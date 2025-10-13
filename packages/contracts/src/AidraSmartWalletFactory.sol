// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {AidraSmartWallet} from "./AidraSmartWallet.sol";
import {Clones} from "@openzeppelin/contracts/proxy/Clones.sol";

/**
 * @title AidraSmartWalletFactory
 * @author Zion Livingstone
 * @notice AidraSmartWallet factory, based on OpenZeppelin's Clones (ERC-1167).
 */
contract AidraSmartWalletFactory {
    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice Address of the ERC-1167 implementation used as implementation for new accounts.
    address public immutable implementation;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /**
     * @param account The address of the created account.
     * @param owner The initial owner of the account.
     * @notice Emitted when a new account is created.
     */
    event AccountCreated(address indexed account, address indexed owner);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Thrown when trying to construct with an implementation that is not deployed.
     */
    error AidraSmartWalletFactory__ImplementationUndeployed();

    /*CONSTRUCTOR*/
    /**
     * @notice Factory constructor used to initialize the implementation address to use for future
     *         AidraSmartWallet deployments.
     *
     * @param _implementation The address of the AidraSmartWallet implementation which new accounts will proxy to.
     */
    constructor(address _implementation) {
        if (_implementation.code.length == 0) {
            revert AidraSmartWalletFactory__ImplementationUndeployed();
        }
        implementation = _implementation;
    }

    /*//////////////////////////////////////////////////////////////
                              FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Deploys and initializes a deterministic AidraSmartWallet for the caller, or returns
     *         the existing account if already deployed.
     *
     * @dev Deployed as an ERC-1167 minimal proxy whose implementation is `this.implementation`.
     *      Uses `msg.sender` to generate a unique salt, ensuring one wallet per address.
     *
     * @return account The address of the ERC-1167 proxy created for `msg.sender`, or the existing
     *                 account address if already deployed.
     */
    function createSmartAccount() external returns (address account) {
        bytes32 salt = _getSalt(msg.sender);
        address predictedAddress = Clones.predictDeterministicAddress(implementation, salt, address(this));

        // Return existing account if already deployed
        if (predictedAddress.code.length != 0) {
            return predictedAddress;
        }

        // Deploy new account
        account = Clones.cloneDeterministic(implementation, salt);

        // Initialize with caller as owner
        AidraSmartWallet(payable(account)).initialize(msg.sender);

        emit AccountCreated(account, msg.sender);
    }

    /**
     * @notice Returns the deterministic address of the account that would be created for a given owner.
     *
     * @param owner The address of the owner for which to predict the account address.
     *
     * @return The predicted account deployment address.
     */
    function getPredictedAddress(address owner) external view returns (address) {
        bytes32 salt = _getSalt(owner);
        return Clones.predictDeterministicAddress(implementation, salt, address(this));
    }

    /**
     * @notice Returns the create2 salt for `Clones.predictDeterministicAddress`.
     *
     * @param owner The address of the owner.
     *
     * @return The computed salt.
     */
    function _getSalt(address owner) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(owner));
    }
}
