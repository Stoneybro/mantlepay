// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {AidraIntentRegistry, IAidraSmartWallet} from "../src/AidraIntentRegistry.sol";

contract AidraIntentRegistryTest is Test {
    AidraIntentRegistry internal registry;
    MockSmartWallet internal wallet;

    address internal walletOwner = makeAddr("walletOwner");
    address internal keeper = makeAddr("keeper");
    address internal other = makeAddr("other");

    address internal recipient1 = makeAddr("recipient1");
    address internal recipient2 = makeAddr("recipient2");

    uint256 internal constant DURATION = 3 days;
    uint256 internal constant INTERVAL = 1 days;
    uint256 internal constant TOTAL_TRANSACTIONS = 3; // DURATION / INTERVAL

    function setUp() public {
        registry = new AidraIntentRegistry();
        wallet = new MockSmartWallet(walletOwner);

        // Give the wallet enough ETH for testing
        vm.deal(address(wallet), 1000 ether);

        // Set the registry on the wallet
        vm.prank(walletOwner);
        wallet.setRegistry(address(registry));
        
        // The wallet will be automatically registered when it creates its first intent
    }

    function test_CreateIntent_SetsStateAndRegistersWallet() public {
        bytes32 intentId = _createDefaultIntent(0);

        AidraIntentRegistry.Intent memory intent = registry.getIntent(address(wallet), intentId);

        assertEq(intent.wallet, address(wallet));
        assertEq(intent.totalTransactionCount, DURATION / INTERVAL);
        assertTrue(intent.active);

        bytes32[] memory activeIntents = registry.getActiveIntents(address(wallet));
        assertEq(activeIntents.length, 1);
        assertEq(activeIntents[0], intentId);

        uint256 totalAmountPerExecution = _totalAmount();
        uint256 expectedCommitment = totalAmountPerExecution * (DURATION / INTERVAL);
        assertEq(registry.walletCommittedFunds(address(wallet), address(0)), expectedCommitment);
    }

    function test_CreateIntent_RevertsWhenNoRecipients() public {
        address[] memory recipients;
        uint256[] memory amounts;

        vm.prank(address(wallet));
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__NoRecipients.selector);
        registry.createIntent(address(0), "Test Intent", recipients, amounts, DURATION, INTERVAL, 0, false);
    }

    function test_CreateIntent_RevertsWhenMismatchedArrays() public {
        address[] memory recipients = new address[](2);
        recipients[0] = recipient1;
        recipients[1] = recipient2;
        
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1 ether;

        vm.prank(address(wallet));
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__ArrayLengthMismatch.selector);
        registry.createIntent(address(0), "Test Intent", recipients, amounts, DURATION, INTERVAL, 0, false);
    }

    function test_CreateIntent_RevertsWhenNoAmounts() public {
        address[] memory recipients = new address[](1);
        recipients[0] = recipient1;
        
        uint256[] memory amounts = new uint256[](0);

        vm.prank(address(wallet));
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__ArrayLengthMismatch.selector);
        registry.createIntent(address(0), "Test Intent", recipients, amounts, DURATION, INTERVAL, 0, false);
    }

    function test_CreateIntent_RevertsWhenInsufficientFunds() public {
        address[] memory recipients = _recipients();
        uint256[] memory amounts = _amounts();
        
        // Set amounts that exceed the wallet balance
        amounts[0] = 1000 ether;
        amounts[1] = 1000 ether;

        vm.prank(address(wallet));
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__InsufficientFunds.selector);
        registry.createIntent(address(0), "Test Intent", recipients, amounts, DURATION, INTERVAL, 0, false);
    }

    function test_CreateIntent_RevertsWhenZeroDuration() public {
        address[] memory recipients = _recipients();
        uint256[] memory amounts = _amounts();
        
        vm.prank(address(wallet));
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__InvalidDuration.selector);
        registry.createIntent(address(0), "Test Intent", recipients, amounts, 0, INTERVAL, 0, false);
    }

    function test_CreateIntent_RevertsWhenZeroInterval() public {
        address[] memory recipients = _recipients();
        uint256[] memory amounts = _amounts();
        
        vm.prank(address(wallet));
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__InvalidInterval.selector);
        registry.createIntent(address(0), "Test Intent", recipients, amounts, DURATION, 0, 0, false);
    }

    function test_CreateIntent_RevertsWhenTotalTransactionCountZero() public {
        address[] memory recipients = _recipients();
        uint256[] memory amounts = _amounts();
        uint256 shortDuration = INTERVAL - 1;

        vm.prank(address(wallet));
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__InvalidTotalTransactionCount.selector);
        registry.createIntent(address(0), "Test Intent", recipients, amounts, shortDuration, INTERVAL, 0, false);
    }

    function test_CreateIntent_RevertsWhenStartTimeInPast() public {
        address[] memory recipients = _recipients();
        uint256[] memory amounts = _amounts();
        
        // Set the block timestamp to a known value that's safe to subtract from
        // Use a fixed timestamp that's well above zero to avoid underflow
        uint256 testTimestamp = 1_000_000_000; // Far in the past but safe to subtract from
        vm.warp(testTimestamp);
        
        // Try to create an intent with a start time in the past
        uint256 pastTime = testTimestamp - 1 days;
        
        vm.prank(address(wallet));
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__StartTimeInPast.selector);
        registry.createIntent(address(0), "Test Intent", recipients, amounts, DURATION, INTERVAL, pastTime, false);
        
        // Verify that creating an intent with current time works
        vm.prank(address(wallet));
        registry.createIntent(address(0), "Test Intent", recipients, amounts, DURATION, INTERVAL, testTimestamp, false);
        
        // Create another intent with a future time
        uint256 futureTime = testTimestamp + 1 days;
        vm.prank(address(wallet));
        registry.createIntent(address(0), "Test Intent 2", recipients, amounts, DURATION, INTERVAL, futureTime, false);
    }

    function test_CreateIntent_DoesNotDuplicateWalletRegistration() public {
        _createDefaultIntent(0);
        _createDefaultIntent(0);

        assertEq(registry.registeredWallets(0), address(wallet));
        assertEq(registry.getRegisteredWalletsCount(), 1);
    }

    function test_CancelIntent_UnlocksFundsAndRemovesIntent() public {
        // Ensure the wallet has enough ETH to cover the commitment
        uint256 walletBalance = 1000 ether;
        vm.deal(address(wallet), walletBalance);
        
        // Set the registry on the wallet (must be called by the wallet owner)
        vm.prank(walletOwner);
        wallet.setRegistry(address(registry));
        
        // Create a default intent starting now
        // This will automatically register the wallet with the registry
        bytes32 intentId = _createDefaultIntent(0);
        
        // Calculate the expected commitment
        uint256 totalAmount = _totalAmount();
        uint256 totalTransactions = DURATION / INTERVAL;
        uint256 expectedCommitment = totalAmount * totalTransactions;
        
        // Verify initial committed funds
        uint256 committedFunds = registry.walletCommittedFunds(address(wallet), address(0));
        assertEq(committedFunds, expectedCommitment, "Initial committed funds should match expected commitment");
        
        // Verify the intent is active and in the active intents list
        AidraIntentRegistry.Intent memory intentBefore = registry.getIntent(address(wallet), intentId);
        assertTrue(intentBefore.active, "Intent should be active before cancellation");
        
        bytes32[] memory activeIntentsBefore = registry.getActiveIntents(address(wallet));
        assertEq(activeIntentsBefore.length, 1, "Should have exactly one active intent");
        assertEq(activeIntentsBefore[0], intentId, "Active intent ID should match the created intent");

        // Cancel the intent
        vm.prank(address(wallet));
        registry.cancelIntent(intentId);

        // Verify committed funds are reduced by the remaining amount
        // Since we're canceling immediately, all committed funds should be unlocked
        uint256 committedFundsAfter = registry.walletCommittedFunds(address(wallet), address(0));
        assertEq(committedFundsAfter, 0, "Committed funds should be zero after cancellation");

        // Verify the intent is marked as inactive
        AidraIntentRegistry.Intent memory intentAfter = registry.getIntent(address(wallet), intentId);
        assertFalse(intentAfter.active, "Intent should be inactive after cancellation");

        // Verify the intent is removed from active intents
        bytes32[] memory activeIntentsAfter = registry.getActiveIntents(address(wallet));
        assertEq(activeIntentsAfter.length, 0, "Should have no active intents after cancellation");
    }

    function test_CancelIntent_RevertsForUnauthorizedCaller() public {
        // Ensure the wallet has enough ETH to cover the commitment
        uint256 walletBalance = 1000 ether;
        vm.deal(address(wallet), walletBalance);
        
        // Set the registry on the wallet (must be called by the wallet owner)
        vm.startPrank(walletOwner);
        wallet.setRegistry(address(registry));
        vm.stopPrank();
        
        // Create intent from the wallet - _createDefaultIntent handles the prank internally
        bytes32 intentId = _createDefaultIntent(0);
        
        // Ensure no active prank before the next one
        vm.stopPrank();
        
        // Try to cancel from unauthorized address - should revert with IntentNotFound
        vm.prank(other);
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__IntentNotFound.selector);
        registry.cancelIntent(intentId);
    }

    function test_CancelIntent_RevertsWhenAlreadyInactive() public {
        // Ensure the wallet has enough ETH to cover the commitment
        uint256 walletBalance = 1000 ether;
        vm.deal(address(wallet), walletBalance);
        
        // Set the registry on the wallet (must be called by the wallet owner)
        vm.startPrank(walletOwner);
        wallet.setRegistry(address(registry));
        vm.stopPrank();
        
        // Create intent from the wallet - _createDefaultIntent handles the prank internally
        bytes32 intentId = _createDefaultIntent(0);
        
        // Ensure no active prank before the next one
        vm.stopPrank();

        // Cancel the intent
        vm.prank(address(wallet));
        registry.cancelIntent(intentId);
        
        // Ensure no active prank before the next one
        vm.stopPrank();

        // Try to cancel again - should revert with IntentNotActive
        vm.prank(address(wallet));
        vm.expectRevert(AidraIntentRegistry.AidraIntentRegistry__IntentNotActive.selector);
        registry.cancelIntent(intentId);
    }

    function test_CheckUpkeep_ReturnsFalseWhenNoWallets() public {
        AidraIntentRegistry freshRegistry = new AidraIntentRegistry();
        (bool upkeepNeeded,) = freshRegistry.checkUpkeep("");
        assertFalse(upkeepNeeded);
    }

    function test_CheckUpkeep_ReturnsFalseBeforeStart() public {
        _createDefaultIntent(2 days);

        (bool upkeepNeeded,) = registry.checkUpkeep("");
        assertFalse(upkeepNeeded);
    }

    function test_CheckUpkeep_ReturnsFalseWhenIntentInactive() public {
        bytes32 intentId = _createDefaultIntent(0);

        vm.prank(address(wallet));
        registry.cancelIntent(intentId);

        (bool upkeepNeeded,) = registry.checkUpkeep("");
        assertFalse(upkeepNeeded);
    }

    function test_CheckUpkeep_ReturnsFalseWhenIntervalNotElapsed() public {
        bytes32 intentId = _createDefaultIntent(0);

        vm.warp(block.timestamp + INTERVAL);
        _executeIntent(intentId);

        (bool upkeepNeeded,) = registry.checkUpkeep("");
        assertFalse(upkeepNeeded);
    }

    function test_CheckUpkeep_ReturnsFalseWhenWalletBalanceLow() public {
        _createDefaultIntent(0);

        vm.deal(address(wallet), 0);
        vm.warp(block.timestamp + INTERVAL);

        (bool upkeepNeeded,) = registry.checkUpkeep("");
        assertFalse(upkeepNeeded);
    }

    function test_CheckUpkeepAndPerformUpkeep_ExecutesIntentAndUpdatesState() public {
        bytes32 intentId = _createDefaultIntent(0);

        vm.warp(block.timestamp + INTERVAL);

        (bool upkeepNeeded, bytes memory performData) = registry.checkUpkeep("");
        assertTrue(upkeepNeeded);

        vm.prank(keeper);
        registry.performUpkeep(performData);

        // Funds transferred to recipients
        assertEq(recipient1.balance, _amounts()[0]);
        assertEq(recipient2.balance, _amounts()[1]);

        // Wallet committed funds reduced by one execution
        uint256 remainingCommitment = _totalAmount() * ((DURATION / INTERVAL) - 1);
        assertEq(registry.walletCommittedFunds(address(wallet), address(0)), remainingCommitment);

        AidraIntentRegistry.Intent memory intent = registry.getIntent(address(wallet), intentId);
        assertEq(intent.transactionCount, 1);
        assertTrue(intent.active);
        assertEq(wallet.batchCalls(), 1);
    }

    function test_PerformUpkeep_DeactivatesIntentAfterFinalExecution() public {
        // Ensure the wallet has enough ETH to cover all transactions
        uint256 totalAmount = _totalAmount();
        uint256 executions = TOTAL_TRANSACTIONS;
        uint256 totalNeeded = totalAmount * executions;
        
        // Give the wallet enough ETH for all transactions plus some extra for gas
        // We need to ensure the wallet has enough ETH to cover the committed funds
        // The wallet needs to have at least totalNeeded ETH available (not committed)
        // Plus the committed funds (totalNeeded)
        // Plus some extra for gas
        uint256 walletBalance = (totalNeeded * 2) + 1 ether;
        vm.deal(address(wallet), walletBalance);
        
        // Set the registry on the wallet (must be called by the wallet owner)
        vm.startPrank(walletOwner);
        wallet.setRegistry(address(registry));
        vm.stopPrank();
        
        // Create the intent from the wallet - _createDefaultIntent handles the prank internally
        bytes32 intentId = _createDefaultIntent(0);
        
        // Execute all transactions
        for (uint256 i = 0; i < executions; i++) {
            bool isFinalExecution = (i == executions - 1);
            // Ensure no active prank before the next operations
            vm.stopPrank();
            
            // Get the current state of the intent
            AidraIntentRegistry.Intent memory currentIntent = registry.getIntent(address(wallet), intentId);
            
            // Calculate the next execution time
            uint256 nextExecutionTime = currentIntent.latestTransactionTime > 0 
                ? currentIntent.latestTransactionTime + currentIntent.interval 
                : currentIntent.transactionStartTime;
                
            // Move to the exact next execution time (don't add 1 second to ensure we're before transactionEndTime)
            if (block.timestamp < nextExecutionTime) {
                vm.warp(nextExecutionTime);
            }
            
            // Check if upkeep is needed - this should return true with the performData
            (bool needsUpkeep, bytes memory performData) = registry.checkUpkeep("");
            
            // Debug: Log the current state of the intent
            console.log("Current block.timestamp:", block.timestamp);
            console.log("Intent latestTransactionTime:", currentIntent.latestTransactionTime);
            console.log("Intent interval:", currentIntent.interval);
            console.log("Next execution time:", currentIntent.latestTransactionTime + currentIntent.interval);
            console.log("Intent active:", currentIntent.active);
            console.log("Transaction count:", currentIntent.transactionCount);
            console.log("Total transaction count:", currentIntent.totalTransactionCount);
            
            assertTrue(needsUpkeep, "Upkeep should be needed");
            
            // Get the wallet and intentId from the performData
            (address upkeepWallet, bytes32 upkeepIntentId) = abi.decode(performData, (address, bytes32));
            assertEq(upkeepWallet, address(wallet), "Unexpected wallet address in performData");
            assertEq(upkeepIntentId, intentId, "Unexpected intent ID in performData");
            
            // Perform the upkeep with the correct performData
            registry.performUpkeep(performData);
            
            // Get the updated intent after execution
            AidraIntentRegistry.Intent memory intent = registry.getIntent(address(wallet), intentId);
            
            // If this is the final execution, the intent should be deactivated
            if (isFinalExecution) {
                assertFalse(intent.active, "Intent should be deactivated after final execution");
            } else {
                assertTrue(intent.active, "Intent should still be active");
            }
            
            assertEq(intent.transactionCount, i + 1, "Transaction count should increment");
        }
        
        // The final execution should have been handled in the loop
        // Now verify the final state of the intent
        vm.stopPrank();
        
        // Get the final state of the intent
        AidraIntentRegistry.Intent memory finalIntent = registry.getIntent(address(wallet), intentId);
        
        // The intent should be deactivated after all executions
        assertFalse(finalIntent.active, "Intent should be deactivated after final execution");
        assertEq(finalIntent.transactionCount, executions, "All transactions should be executed");

        // Verify committed funds are released
        assertEq(registry.walletCommittedFunds(address(wallet), address(0)), 0, "Committed funds should be zero");

        // Verify the intent is removed from active intents
        bytes32[] memory activeIntents = registry.getActiveIntents(address(wallet));
        assertEq(activeIntents.length, 0, "No active intents should remain");
        
        // Verify the correct number of batch calls were made
        assertEq(wallet.batchCalls(), executions, "Batch calls should match execution count");
    }

    /*//////////////////////////////////////////////////////////////
                                HELPERS
    //////////////////////////////////////////////////////////////*/

    function _createDefaultIntent(uint256 startTimeOffset) internal returns (bytes32) {
        // Set up the intent parameters
        address[] memory recipients = _recipients();
        uint256[] memory amounts = _amounts();
        uint256 startTime = block.timestamp + startTimeOffset;
        
        // Calculate the exact duration needed for the total number of transactions
        uint256 duration = INTERVAL * TOTAL_TRANSACTIONS;
        
        // Call createIntent through the mock wallet
        vm.prank(address(wallet));
        return registry.createIntent(
            address(0), // ETH
            "Test Intent",
            recipients,
            amounts,
            duration,
            INTERVAL,
            startTime,
            false // revertOnFailure
        );
    }

    function _executeIntent(bytes32 intentId)
        internal
        returns (bool upkeepNeeded, bytes memory performData, AidraIntentRegistry.Intent memory intent)
    {
        (upkeepNeeded, performData) = registry.checkUpkeep("");
        if (upkeepNeeded) {
            registry.performUpkeep(performData);
        }
        intent = registry.getIntent(address(wallet), intentId);
    }

    function _totalAmount() internal pure returns (uint256) {
        uint256[] memory amounts = _amounts();
        return amounts[0] + amounts[1];
    }

    function _recipients() internal view returns (address[] memory recipients) {
        recipients = new address[](2);
        recipients[0] = recipient1;
        recipients[1] = recipient2;
    }

    function _amounts() internal pure returns (uint256[] memory amounts) {
        amounts = new uint256[](2);
        amounts[0] = 1 ether;
        amounts[1] = 2 ether;
    }
}

contract MockSmartWallet is IAidraSmartWallet {
    address public immutable owner;
    address public registry;
    uint256 public batchCalls;

    error MockSmartWallet__NotOwner();
    error MockSmartWallet__RegistryNotSet();
    error MockSmartWallet__Unauthorized();
    error MockSmartWallet__InvalidBatchInput();
    error MockSmartWallet__TransferFailed(address recipient, uint256 amount);

    // Track committed funds per token
    mapping(address => uint256) public committedFunds;

    constructor(address owner_) {
        owner = owner_;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert MockSmartWallet__NotOwner();
        _;
    }

    function setRegistry(address registry_) external onlyOwner {
        registry = registry_;
    }

    function executeBatchIntentTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 intentId,
        uint256 transactionCount,
        bool revertOnFailure
    ) external override returns (uint256 failedAmount) {
        if (registry == address(0)) revert MockSmartWallet__RegistryNotSet();
        if (msg.sender != registry) revert MockSmartWallet__Unauthorized();
        if (recipients.length == 0 || recipients.length != amounts.length) revert MockSmartWallet__InvalidBatchInput();

        batchCalls++;
        failedAmount = 0;

        for (uint256 i = 0; i < recipients.length; i++) {
            if (token == address(0)) {
                // Handle ETH transfer
                (bool success,) = payable(recipients[i]).call{value: amounts[i]}("");
                if (!success) {
                    if (revertOnFailure) {
                        revert MockSmartWallet__TransferFailed(recipients[i], amounts[i]);
                    }
                    failedAmount += amounts[i];
                }
            } else {
                // For ERC20, we just track the transfer in the mock
                // In a real implementation, this would call token.transfer()
            }
        }
        
        return failedAmount;
    }

    function decreaseCommitment(address token, uint256 amount) external override {
        if (msg.sender != registry) revert MockSmartWallet__Unauthorized();
        committedFunds[token] -= amount;
    }
    
    function increaseCommitment(address token, uint256 amount) external override {
        if (msg.sender != registry) revert MockSmartWallet__Unauthorized();
        committedFunds[token] += amount;
    }
    
    function getAvailableBalance(address token) external view override returns (uint256) {
        if (token == address(0)) {
            // Return a large enough balance to cover the test case
            return 1000 ether;
        }
        // For ERC20, return a large enough balance
        return 1000 ether;
    }

    receive() external payable {}
}
