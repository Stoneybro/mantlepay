// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IAccount} from "@account-abstraction/contracts/interfaces/IAccount.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {_packValidationData} from "@account-abstraction/contracts/core/Helpers.sol";
import {AidraIntentRegistry} from "./AidraIntentRegistry.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title AidraSmartWallet
 * @author Zion Livingstone
 * @notice ERC-4337-compatible smart account for AI-powered intent automation.
 */
contract AidraSmartWallet is IAccount, ReentrancyGuard, Initializable {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    /// @notice Represents a call to make.
    struct Call {
        /// @dev The address to call.
        address target;
        /// @dev The value to send when making the call.
        uint256 value;
        /// @dev The data of the call.
        bytes data;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Account owner address. Signer of UserOperations.
    address public s_owner;
    /// @notice Aidra intent registry authorized to trigger scheduled transfers.
    AidraIntentRegistry public s_intentRegistry;

    /// @notice EIP-1271 magic return value for valid signatures.
    bytes4 internal constant _EIP1271_MAGICVALUE = 0x1626ba7e;

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when caller is not the EntryPoint.
    error AidraSmartWallet__NotFromEntryPoint();

    /// @notice Thrown when caller is neither EntryPoint nor owner.
    error AidraSmartWallet__Unauthorized();

    /// @notice Thrown when owner is zero address.
    error AidraSmartWallet__OwnerIsZeroAddress();

    /// @notice Thrown when registry address is zero.
    error AidraSmartWallet__IntentRegistryZeroAddress();

    /// @notice Thrown when registry is already configured.
    error AidraSmartWallet__IntentRegistryAlreadySet();

    /// @notice Thrown when registry not yet configured.
    error AidraSmartWallet__IntentRegistryNotSet();

    /// @notice Thrown when batch inputs are invalid.
    error AidraSmartWallet__InvalidBatchInput();

    /// @notice Thrown when a transfer fails.
    error AidraSmartWallet__TransferFailed(address recipient, uint256 amount);

    /*MODIFIER */

    /// @notice Reverts if the caller is not the EntryPoint.
    modifier onlyEntryPoint() {
        if (msg.sender != entryPoint()) {
            revert AidraSmartWallet__NotFromEntryPoint();
        }
        _;
    }

    /// @notice Reverts if the caller is neither the EntryPoint nor the owner.
    modifier onlyEntryPointOrOwner() {
        if (msg.sender != entryPoint() && msg.sender != s_owner) {
            revert AidraSmartWallet__Unauthorized();
        }
        _;
    }
    /**
     * @notice Sends to the EntryPoint (i.e. `msg.sender`) the missing funds for this transaction.
     *
     * @dev Subclass MAY override this modifier for better funds management (e.g. send to the
     *  EntryPoint more than the minimum required, so that in future transactions it will not
     *   be required to send again).
     *
     * @param missingAccountFunds The minimum value this modifier should send the EntryPoint which
     *  MAY be zero, in case there is enough deposit, or the userOp has a
     *  paymaster.
     */

    modifier payPrefund(uint256 missingAccountFunds) {
        _;

        assembly ("memory-safe") {
            if missingAccountFunds {
                // Ignore failure (it's EntryPoint's job to verify, not the account's).
                pop(call(gas(), caller(), missingAccountFunds, codesize(), 0x00, codesize(), 0x00))
            }
        }
    }

    /// @notice Constructor prevents initialization of implementation contract.
    /*CONSTRUCTOR*/
    constructor() {
        _disableInitializers();
    }
    /**
     * @notice Initializes the account with the owner.
     *
     * @dev Reverts if the account has already been initialized.
     *
     * @param _owner Address that will own this account and sign UserOperations.
     */

    function initialize(address _owner) external initializer {
        if (_owner == address(0)) revert AidraSmartWallet__OwnerIsZeroAddress();
        s_owner = _owner;
    }

    /*//////////////////////////////////////////////////////////////
                              FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    /**
     * @inheritdoc IAccount
     *
     * @notice ERC-4337 `validateUserOp` method. The EntryPoint will call this to validate
     *  the UserOperation before execution.
     *
     * @dev Signature failure should be reported by returning 1. This allows making a "simulation call"
     *  without a valid signature. Other failures should still revert.
     *
     * @param userOp The `UserOperation` to validate.
     * @param userOpHash  The hash of the `UserOperation`, computed by EntryPoint.
     * @param missingAccountFunds The missing account funds that must be deposited on the EntryPoint.
     *
     * @return validationData The encoded `ValidationData` structure:
     *  `(uint256(validAfter) << (160 + 48)) | (uint256(validUntil) << 160) | (success ? 0 : 1)`
     *
     */
    function validateUserOp(PackedUserOperation calldata userOp, bytes32 userOpHash, uint256 missingAccountFunds)
        external
        override
        onlyEntryPoint
        payPrefund(missingAccountFunds)
        returns (uint256 validationData)
    {
        (address signer, ECDSA.RecoverError err,) = ECDSA.tryRecover(userOpHash, userOp.signature);

        if (err != ECDSA.RecoverError.NoError) {
            return _packValidationData(true, 0, 0);
        }

        if (signer != s_owner) {
            return _packValidationData(true, 0, 0);
        }

        return _packValidationData(false, 0, 0);
    }

    /**
     * @notice Sets the authorized intent registry.
     *
     * @param registry The address of the Aidra intent registry contract.
     */
    function setIntentRegistry(address registry) external onlyEntryPointOrOwner {
        if (registry == address(0)) revert AidraSmartWallet__IntentRegistryZeroAddress();
        if (address(s_intentRegistry) != address(0)) revert AidraSmartWallet__IntentRegistryAlreadySet();
        s_intentRegistry = AidraIntentRegistry(registry);
    }

    /**
     * @notice Executes a single call from this account.
     *
     * @dev Can only be called by the EntryPoint or the owner of this account.
     *
     * @param target The address to call.
     * @param value  The value to send with the call.
     * @param data   The data of the call.
     */
    function execute(address target, uint256 value, bytes calldata data)
        external
        payable
        nonReentrant
        onlyEntryPointOrOwner
    {
        _call(target, value, data);
    }

    /**
     * @notice Executes a batch of calls from this account.
     *
     * @dev Can only be called by the EntryPoint or the owner of this account.
     *
     * @param calls The list of `Call`s to execute.
     */
    function executeBatch(Call[] calldata calls) external payable nonReentrant onlyEntryPointOrOwner {
        for (uint256 i; i < calls.length; i++) {
            _call(calls[i].target, calls[i].value, calls[i].data);
        }
    }

    /**
     * @notice Executes a batch of transfers as part of an Aidra intent.
     *
     * @param recipients The array of recipient addresses.
     * @param amounts The array of amounts corresponding to each recipient.
     */
    function executeBatchIntentTransfer(address[] calldata recipients, uint256[] calldata amounts)
        external
        nonReentrant
    {
        if (address(s_intentRegistry) == address(0)) revert AidraSmartWallet__IntentRegistryNotSet();
        if (msg.sender != address(s_intentRegistry)) revert AidraSmartWallet__Unauthorized();
        if (recipients.length == 0 || recipients.length != amounts.length) revert AidraSmartWallet__InvalidBatchInput();

        for (uint256 i; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];

            if (recipient == address(0) || amount == 0) revert AidraSmartWallet__InvalidBatchInput();

            (bool success,) = recipient.call{value: amount}("");
            if (!success) revert AidraSmartWallet__TransferFailed(recipient, amount);
        }
    }

    /**
     * @notice Returns the address of the EntryPoint v0.7.
     *
     * @return The address of the EntryPoint v0.7.
     */
    function entryPoint() public pure returns (address) {
        return 0x0000000071727De22E5E9d8BAf0edAc6f37da032;
    }

    /**
     * @notice EIP-1271 signature validation for contract signatures and off-chain t    ooling.
     *
     * @dev Supports EIP-191 (`eth_sign`) prefix for message hashing.
     *
     * @param hash      The hash that was signed.
     * @param signature The signature bytes.
     *
     * @return magicValue `_EIP1271_MAGICVALUE` (0x1626ba7e) if valid, 0x00000000 otherwise.
     */
    function isValidSignature(bytes32 hash, bytes memory signature) external view returns (bytes4) {
        address recovered = ECDSA.recover(MessageHashUtils.toEthSignedMessageHash(hash), signature);

        if (recovered == s_owner) {
            return _EIP1271_MAGICVALUE;
        }

        return bytes4(0);
    }

    /**
     * @notice Executes a call from this account.
     *
     * @dev Reverts with the original error if the call fails.
     *
     * @param target The address to call.
     * @param value  The value to send with the call.
     * @param data   The calldata to send.
     */
    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly ("memory-safe") {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /// @notice Allows the contract to receive ETH.
    receive() external payable {}

    /// @notice Fallback function to receive ETH.
    fallback() external payable {}
}
