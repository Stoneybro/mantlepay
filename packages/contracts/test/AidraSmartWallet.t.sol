// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {Test} from "forge-std/Test.sol";
import {AidraSmartWallet} from "../src/AidraSmartWallet.sol";
import {AidraSmartWalletFactory} from "../src/AidraSmartWalletFactory.sol";
import {AidraIntentRegistry} from "../src/AidraIntentRegistry.sol";
import {PackedUserOperation} from "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import {_packValidationData} from "@account-abstraction/contracts/core/Helpers.sol";

contract EntryPointMock {
    uint256 public executions;

    function record() external {
        executions++;
    }
}

contract WalletTests is Test {
    AidraSmartWalletFactory internal factory;
    AidraSmartWallet internal implementation;
    AidraSmartWallet internal smartWallet;

    address internal owner;
    uint256 internal ownerKey;
    address internal other = makeAddr("other");
    address internal registry = makeAddr("registry");
    address internal entryPoint;

    function setUp() public {
        (owner, ownerKey) = makeAddrAndKey("owner");

        // Deploy the registry contract first
        AidraIntentRegistry intentRegistry = new AidraIntentRegistry();
        registry = address(intentRegistry);

        // Deploy the implementation with registry
        implementation = new AidraSmartWallet(registry);
        
        // Deploy the factory with implementation only
        factory = new AidraSmartWalletFactory(address(implementation));

        // Create a new smart wallet through the factory
        vm.prank(owner);
        address account = factory.createSmartAccount(owner);
        
        // Cast the address to AidraSmartWallet
        smartWallet = AidraSmartWallet(payable(account));

        // Verify the registry is set correctly
        assertEq(smartWallet.intentRegistry(), registry, "Registry address mismatch");

        // Set up the entry point for testing
        entryPoint = smartWallet.entryPoint();

        // Fund the wallet with some ETH for testing
        vm.deal(account, 20 ether);
    }


    function test_Execute_ByOwner() public {
        address payable recipient = payable(makeAddr("recipient"));

        uint256 recipientBalanceBefore = recipient.balance;

        vm.prank(owner);
        smartWallet.execute(recipient, 1 ether, "");

        assertEq(recipient.balance, recipientBalanceBefore + 1 ether);
        assertEq(address(smartWallet).balance, 19 ether);
    }

    function test_Execute_ByEntryPoint() public {
        address payable recipient = payable(makeAddr("entryRecipient"));

        vm.prank(entryPoint);
        smartWallet.execute(recipient, 1 ether, "");

        assertEq(recipient.balance, 1 ether);
        assertEq(address(smartWallet).balance, 19 ether);
    }

    function test_Execute_RevertsIfUnauthorized() public {
        vm.prank(other);
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__Unauthorized.selector);
        smartWallet.execute(makeAddr("target"), 0, "");
    }

    function test_ExecuteBatch_ByOwner() public {
        AidraSmartWallet.Call[] memory calls = new AidraSmartWallet.Call[](2);
        calls[0] = AidraSmartWallet.Call({target: makeAddr("batchTarget1"), value: 1 ether, data: bytes("")});
        calls[1] = AidraSmartWallet.Call({target: makeAddr("batchTarget2"), value: 2 ether, data: bytes("")});

        vm.prank(owner);
        smartWallet.executeBatch(calls);

        assertEq(makeAddr("batchTarget1").balance, 1 ether);
        assertEq(makeAddr("batchTarget2").balance, 2 ether);
        assertEq(address(smartWallet).balance, 17 ether);
    }

    function test_ExecuteBatch_RevertsIfUnauthorized() public {
        AidraSmartWallet.Call[] memory calls = new AidraSmartWallet.Call[](1);
        calls[0] = AidraSmartWallet.Call({target: makeAddr("unauth"), value: 0, data: bytes("")});

        vm.prank(other);
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__Unauthorized.selector);
        smartWallet.executeBatch(calls);
    }

    function test_ExecuteBatchIntentTransfer_RevertsOnMismatchedArrays() public {
        address[] memory recipients = new address[](2);
        recipients[0] = makeAddr("recipient1");
        recipients[1] = makeAddr("recipient2");
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1 ether;
        address token = address(0); // ETH

        // Should revert with NotFromRegistry when called directly by owner
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__NotFromRegistry.selector);
        vm.prank(owner);
        smartWallet.executeBatchIntentTransfer(token, recipients, amounts, bytes32(0), 0, false);
        
        // Test with registry as caller
        vm.prank(registry);
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__InvalidBatchInput.selector);
        smartWallet.executeBatchIntentTransfer(token, recipients, amounts, bytes32(0), 0, false);
    }

    function test_ExecuteBatchIntentTransfer_RevertsIfNoRecipients() public {
        address[] memory recipients = new address[](0);
        uint256[] memory amounts = new uint256[](0);

        // Should revert with NotFromRegistry when called directly by owner
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__NotFromRegistry.selector);
        vm.prank(owner);
        smartWallet.executeBatchIntentTransfer(address(0), recipients, amounts, bytes32(0), 0, false);
        
        // Test with registry as caller
        vm.prank(registry);
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__InvalidBatchInput.selector);
        smartWallet.executeBatchIntentTransfer(address(0), recipients, amounts, bytes32(0), 0, false);
    }

    // Mock ERC20 token that always fails transfers
    function _deployMockToken() private returns (address) {
        // Deploy a mock token that always fails transfers
        string memory name = "MockToken";
        string memory symbol = "MOCK";
        uint8 decimals = 18;
        
        // Use a precomputed address with proper checksum
        address mockToken = 0x000000000000000000000000000000000000bEEF;
        
        // Deploy a mock token that always reverts on transfer
        vm.etch(mockToken, new bytes(0x1000));
        vm.allowCheatcodes(mockToken);
        
        // Mock the token to always return false on transfer
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("transfer(address,uint256)"),
            abi.encode(false)
        );
        
        // Mock the decimals function
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("decimals()"),
            abi.encode(decimals)
        );
        
        // Mock the name function
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("name()"),
            abi.encode(name)
        );
        
        // Mock the symbol function
        vm.mockCall(
            mockToken,
            abi.encodeWithSignature("symbol()"),
            abi.encode(symbol)
        );
        
        return mockToken;
    }
    
    function test_ExecuteBatchIntentTransfer_RevertsOnInsufficientBalance() public {
        // Deploy a mock token that will fail transfers
        address mockToken = _deployMockToken();
        
        address[] memory recipients = new address[](1);
        recipients[0] = makeAddr("recipient1");
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1e18; // 1 token with 18 decimals
        
        // Should revert with NotFromRegistry when called directly by owner
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__NotFromRegistry.selector);
        vm.prank(owner);
        smartWallet.executeBatchIntentTransfer(mockToken, recipients, amounts, bytes32(0), 0, false);
        
        // Test with registry as caller - the transfer should fail and return the failed amount
        vm.prank(registry);
        uint256 failedAmount = smartWallet.executeBatchIntentTransfer(
            mockToken, 
            recipients, 
            amounts, 
            bytes32(0), 
            0, 
            false
        );
        
        // The function should return the failed amount (1 token)
        assertEq(failedAmount, 1e18, "Failed amount should be 1 token");
        
        // Now test with revertOnFailure = true - should revert with TransferFailed
        vm.prank(registry);
        vm.expectRevert(
            abi.encodeWithSelector(
                AidraSmartWallet.AidraSmartWallet__TransferFailed.selector,
                recipients[0],
                mockToken,
                amounts[0]
            )
        );
        smartWallet.executeBatchIntentTransfer(mockToken, recipients, amounts, bytes32(0), 0, true);
    }


    function test_Execute_ByEntryPoint_CallsTarget() public {
        EntryPointMock mock = new EntryPointMock();
        // Note: Registry is already set during initialization

        bytes memory data = abi.encodeWithSignature("record()");

        vm.prank(entryPoint);
        smartWallet.execute(address(mock), 0, data);

        assertEq(mock.executions(), 1);
    }

    function test_ExecuteBatchIntentTransfer_RevertsOnTransferFailureWhenRevertOnFailureIsTrue() public {
        RevertingReceiver revertingReceiver = new RevertingReceiver();
        
        address[] memory recipients = new address[](1);
        recipients[0] = address(revertingReceiver);
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1 ether;
        address token = address(0); // ETH

        // Fund the wallet with ETH
        vm.deal(address(smartWallet), 1 ether);

        // Should revert with NotFromRegistry when called directly by owner
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__NotFromRegistry.selector);
        vm.prank(owner);
        smartWallet.executeBatchIntentTransfer(token, recipients, amounts, bytes32(0), 0, true);
        
        // Test with registry as caller
        vm.prank(registry);
        vm.expectRevert(
            abi.encodeWithSelector(
                AidraSmartWallet.AidraSmartWallet__TransferFailed.selector,
                address(revertingReceiver),
                token,
                1 ether
            )
        );
        smartWallet.executeBatchIntentTransfer(token, recipients, amounts, bytes32(0), 0, true);
    }

    function test_ExecuteBatchIntentTransfer_TransfersETH() public {
        address payable recipient1 = payable(makeAddr("recipient1"));
        address payable recipient2 = payable(makeAddr("recipient2"));
        
        address[] memory recipients = new address[](2);
        recipients[0] = recipient1;
        recipients[1] = recipient2;
        
        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;
        
        address token = address(0); // ETH

        uint256 balanceBefore1 = recipient1.balance;
        uint256 balanceBefore2 = recipient2.balance;

        // Should revert with NotFromRegistry when called directly by owner
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__NotFromRegistry.selector);
        vm.prank(owner);
        smartWallet.executeBatchIntentTransfer(token, recipients, amounts, bytes32(0), 0, false);

        // Test with registry as caller
        vm.prank(registry);
        smartWallet.executeBatchIntentTransfer(token, recipients, amounts, bytes32(0), 0, false);

        assertEq(recipient1.balance, balanceBefore1 + 1 ether);
        assertEq(recipient2.balance, balanceBefore2 + 2 ether);
        assertEq(address(smartWallet).balance, 17 ether);
    }

    function test_Execute_RevertsWhenTargetReverts() public {
        RevertingReceiver reverting = new RevertingReceiver();

        vm.prank(owner);
        vm.expectRevert(bytes("transfer failed"));
        smartWallet.execute(address(reverting), 0, "");
    }

    function test_ExecuteBatch_RevertsWhenInnerCallFails() public {
        RevertingReceiver reverting = new RevertingReceiver();

        AidraSmartWallet.Call[] memory calls = new AidraSmartWallet.Call[](1);
        calls[0] = AidraSmartWallet.Call({target: address(reverting), value: 0, data: bytes("")});

        vm.prank(owner);
        vm.expectRevert(bytes("transfer failed"));
        smartWallet.executeBatch(calls);
    }

    function test_ValidateUserOp_RevertsIfNotEntryPoint() public {
        PackedUserOperation memory userOp;
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__NotFromEntryPoint.selector);
        smartWallet.validateUserOp(userOp, bytes32(0), 0);
    }

    bytes constant DUMMY_SIG = hex"1b";

    function _signatureFrom(uint256 privateKey, bytes32 digest) internal pure returns (bytes memory) {
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);
        return abi.encodePacked(r, s, v);
    }

    function test_ValidateUserOp_ReturnsFailingValidationDataOnBadSignature() public {
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(smartWallet),
            nonce: 0,
            initCode: bytes(""),
            callData: bytes(""),
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: bytes(""),
            signature: DUMMY_SIG
        });

        vm.prank(entryPoint);
        uint256 validationData = smartWallet.validateUserOp(userOp, keccak256("bad"), 0);

        assertEq(validationData, _packValidationData(true, 0, 0));
    }

    function test_ValidateUserOp_ReturnsFailingValidationDataWhenSignerNotOwner() public {
        (, uint256 attackerKey) = makeAddrAndKey("attacker");
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(smartWallet),
            nonce: 0,
            initCode: bytes(""),
            callData: bytes(""),
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: bytes(""),
            signature: _signatureFrom(attackerKey, keccak256("op"))
        });

        vm.prank(entryPoint);
        uint256 validationData = smartWallet.validateUserOp(userOp, keccak256("op"), 0);

        assertEq(validationData, _packValidationData(true, 0, 0));
    }

    function test_ValidateUserOp_SucceedsWhenSignedByOwner() public {
        // Generate signature over the EIP-191 prefixed hash like the contract does
        bytes32 userOpHash = keccak256("good");
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        
        PackedUserOperation memory userOp = PackedUserOperation({
            sender: address(smartWallet),
            nonce: 0,
            initCode: bytes(""),
            callData: bytes(""),
            accountGasLimits: bytes32(0),
            preVerificationGas: 0,
            gasFees: bytes32(0),
            paymasterAndData: bytes(""),
            signature: _signatureFrom(ownerKey, ethSignedMessageHash)
        });

        vm.prank(entryPoint);
        uint256 validationData = smartWallet.validateUserOp(userOp, userOpHash, 1 ether);

        assertEq(validationData, _packValidationData(false, 0, 0));
    }

    function test_OnlyEntryPointRevertsForUnauthorizedCaller() public {
        vm.expectRevert(AidraSmartWallet.AidraSmartWallet__NotFromEntryPoint.selector);
        vm.prank(owner);
        smartWallet.validateUserOp(
            PackedUserOperation({
                sender: address(smartWallet),
                nonce: 0,
                initCode: bytes(""),
                callData: bytes(""),
                accountGasLimits: bytes32(0),
                preVerificationGas: 0,
                gasFees: bytes32(0),
                paymasterAndData: bytes(""),
                signature: DUMMY_SIG
            }),
            keccak256(""),
            0
        );
    }

    function test_ExecuteBatchIntentTransfer_RevertsIfTransferFails() public {
        RevertingReceiver revertingRecipient = new RevertingReceiver();

        address[] memory recipients = new address[](1);
        recipients[0] = address(revertingRecipient);
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1 ether;

        // Fund the wallet with ETH
        vm.deal(address(smartWallet), 1 ether);

        // Start prank as the registry
        vm.startPrank(registry);
        
        // Expect the transfer to revert with the correct error
        vm.expectRevert(
            abi.encodeWithSelector(
                AidraSmartWallet.AidraSmartWallet__TransferFailed.selector, 
                address(revertingRecipient), 
                address(0), 
                1 ether
            )
        );
        
        // Execute the batch transfer with revertOnFailure set to true
        smartWallet.executeBatchIntentTransfer(address(0), recipients, amounts, bytes32(0), 0, true);
        vm.stopPrank();
    }

    function test_ExecuteBatchIntentTransfer_Succeeds() public {
        address payable recipient1 = payable(makeAddr("recipient1"));
        address payable recipient2 = payable(makeAddr("recipient2"));

        address[] memory recipients = new address[](2);
        recipients[0] = recipient1;
        recipients[1] = recipient2;

        uint256[] memory amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;

        // Fund the wallet with enough ETH
        uint256 totalAmount = 3 ether;
        vm.deal(address(smartWallet), totalAmount);

        // Get initial balances
        uint256 initialBalance1 = recipient1.balance;
        uint256 initialBalance2 = recipient2.balance;
        uint256 initialWalletBalance = address(smartWallet).balance;

        // Start prank as the registry
        vm.startPrank(registry);
        
        // Execute the batch transfer with revertOnFailure set to false
        smartWallet.executeBatchIntentTransfer(
            address(0), // ETH transfer
            recipients, 
            amounts, 
            bytes32("test-intent"), // intentId
            1, // transactionCount
            false // revertOnFailure
        );
        vm.stopPrank();

        // Verify the balances after the transfer
        assertEq(recipient1.balance, initialBalance1 + 1 ether, "Recipient 1 should receive 1 ETH");
        assertEq(recipient2.balance, initialBalance2 + 2 ether, "Recipient 2 should receive 2 ETH");
        assertEq(
            address(smartWallet).balance, 
            initialWalletBalance - 3 ether, 
            "Wallet balance should decrease by 3 ETH"
        );
    }
}

contract RevertingReceiver {
    receive() external payable {
        revert("transfer failed");
    }
}
