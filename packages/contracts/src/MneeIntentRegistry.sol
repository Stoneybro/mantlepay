// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";
import {IMneeSmartWallet} from "./IMneeSmartWallet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Mnee Intent Registry
 * @author Zion Livingstone
 * @notice Central registry for managing automated payment intents across all Mnee wallets.
 * @dev Integrates with Chainlink Automation for decentralized intent execution. Supports ETH and ERC20 tokens.
 * @custom:security-contact stoneybrocrypto@gmail.com
 */
contract MneeIntentRegistry is  ReentrancyGuard {
    /*//////////////////////////////////////////////////////////////
                                TYPES
    //////////////////////////////////////////////////////////////*/

    struct Intent {
        /// @notice The unique identifier for this intent
        bytes32 id;
        /// @notice The wallet that owns this intent
        address wallet;
        /// @notice The token address (address(0) for ETH, token address for ERC20)
        address token;
        /// @notice The recipients of the intent
        address[] recipients;
        /// @notice The amounts per recipient per transaction
        uint256[] amounts;
        /// @notice The current transaction count
        uint256 transactionCount;
        /// @notice The final total transaction count
        uint256 totalTransactionCount;
        /// @notice The interval between transactions in seconds
        uint256 interval;
        /// @notice The start time of the transaction schedule
        uint256 transactionStartTime;
        /// @notice The end time of the transaction schedule
        uint256 transactionEndTime;
        /// @notice The latest transaction execution time
        uint256 latestTransactionTime;
        /// @notice Whether the intent is active
        bool active;
        /// @notice Whether to revert entire transaction on any failure (true) or skip failed transfers (false)
        bool revertOnFailure;
        /// @notice Total amount that failed to transfer (for recovery)
        uint256 failedAmount;
    }

    /*//////////////////////////////////////////////////////////////
                           STATE VARIABLES
    //////////////////////////////////////////////////////////////*/

    /// @notice The list of registered wallets
    address[] public registeredWallets;

    /// @notice Whether the wallet is registered
    mapping(address => bool) public isWalletRegistered;

    /// @notice The intents per wallet
    mapping(address => mapping(bytes32 => Intent)) public walletIntents;

    /// @notice The active intent ids per wallet
    mapping(address => bytes32[]) public walletActiveIntentIds;

    /// @notice The amount of funds committed to intents per wallet per token
    mapping(address => mapping(address => uint256)) public walletCommittedFunds;

    /// @notice A counter used to generate unique intent ids
    uint256 public intentCounter;

    /// @notice Maximum number of recipients allowed per intent
    uint256 public constant MAX_RECIPIENTS = 10;

    /// @notice Minimum interval between transactions (30 seconds)
    uint256 public constant MIN_INTERVAL = 30;

    /// @notice Maximum intent duration (1 year in seconds)
    uint256 public constant MAX_DURATION = 365 days;

    /*//////////////////////////////////////////////////////////////
                               EVENTS
    //////////////////////////////////////////////////////////////*/

    /// @notice The event emitted when an intent is created
    event IntentCreated(
        address indexed wallet,
        bytes32 indexed intentId,
        address indexed token,
        uint256 totalCommitment,
        uint256 totalTransactionCount,
        uint256 interval,
        uint256 duration,
        uint256 transactionStartTime,
        uint256 transactionEndTime
    );

    /// @notice The event emitted when an intent is executed
    event IntentExecuted(
        address indexed wallet, bytes32 indexed intentId, uint256 transactionCount, uint256 totalAmount
    );

    /// @notice The event emitted when an intent is cancelled
    event IntentCancelled(
        address indexed wallet,
        bytes32 indexed intentId,
        address indexed token,
        uint256 amountRefunded,
        uint256 failedAmountRecovered
    );

    event ScheduleNextExecution(bytes32 indexed intentId, address indexed wallet, uint256 executeAfter);

    /// @notice The event emitted when a wallet is registered
    event WalletRegistered(address indexed wallet);

    /*//////////////////////////////////////////////////////////////
                                ERRORS
    //////////////////////////////////////////////////////////////*/

    /// @notice Thrown when no recipients are provided
    error MneeIntentRegistry__NoRecipients();

    /// @notice Thrown when a recipient address is zero
    error MneeIntentRegistry__InvalidRecipient();

    /// @notice Thrown when recipients and amounts arrays have different lengths
    error MneeIntentRegistry__ArrayLengthMismatch();

    /// @notice Thrown when number of recipients exceeds maximum allowed
    error MneeIntentRegistry__TooManyRecipients();

    /// @notice Thrown when duration is zero or exceeds maximum
    error MneeIntentRegistry__InvalidDuration();

    /// @notice Thrown when interval is below minimum
    error MneeIntentRegistry__InvalidInterval();

    /// @notice Thrown when an amount is zero or negative
    error MneeIntentRegistry__InvalidAmount();

    /// @notice Thrown when total transaction count is zero
    error MneeIntentRegistry__InvalidTotalTransactionCount();

    /// @notice Thrown when wallet has insufficient funds
    error MneeIntentRegistry__InsufficientFunds();

    /// @notice Thrown when trying to execute an inactive intent
    error MneeIntentRegistry__IntentNotActive();

    /// @notice Thrown when intent conditions are not met for execution
    error MneeIntentRegistry__IntentNotExecutable();

    /// @notice Thrown when the caller is not the wallet owner
    error MneeIntentRegistry__Unauthorized();

    /// @notice Thrown when token address is invalid
    error MneeIntentRegistry__InvalidToken();

    /// @notice Thrown when transaction start time is in the past
    error MneeIntentRegistry__StartTimeInPast();

    /// @notice Thrown when intent not found for wallet
    error MneeIntentRegistry__IntentNotFound();

    /*//////////////////////////////////////////////////////////////
                              FUNCTIONS
    //////////////////////////////////////////////////////////////*/

    /**
     * @notice Creates a new multi-recipient intent for the sender/wallet
     *
     * @param token The token address (address(0) for ETH, PYUSD address for PYUSD, other ERC20 addresses supported)
     * @param recipients The array of recipient addresses
     * @param amounts The array of amounts corresponding to each recipient
     * @param duration The total duration of the intent in seconds
     * @param interval The interval between transactions in seconds
     * @param transactionStartTime The start time of the transaction (0 for immediate start)
     * @param revertOnFailure Whether to revert entire transaction on any failure (true) or skip failed transfers (false)
     *
     * @return intentId The unique identifier for the created intent
     */
    function createIntent(
        address token,
        address[] memory recipients,
        uint256[] memory amounts,
        uint256 duration,
        uint256 interval,
        uint256 transactionStartTime,
        bool revertOnFailure
    ) external returns (bytes32) {
        address wallet = msg.sender;

        ///@notice When a wallet tries to create an intent for the first time, it is registered
        if (!isWalletRegistered[wallet]) {
            registeredWallets.push(wallet);
            isWalletRegistered[wallet] = true;
            emit WalletRegistered(wallet);
        }

        ///@notice Validate token address (address(0) for ETH is valid)
        if (token != address(0)) {
            ///@dev Basic check: token must be a contract
            if (token.code.length == 0) revert MneeIntentRegistry__InvalidToken();
        }

        ///@notice Validate recipients and amounts arrays
        if (recipients.length == 0) revert MneeIntentRegistry__NoRecipients();
        if (recipients.length != amounts.length) revert MneeIntentRegistry__ArrayLengthMismatch();
        if (recipients.length > MAX_RECIPIENTS) revert MneeIntentRegistry__TooManyRecipients();

        ///@notice Validate timing parameters
        if (duration == 0 || duration > MAX_DURATION) revert MneeIntentRegistry__InvalidDuration();
        if (interval < MIN_INTERVAL) revert MneeIntentRegistry__InvalidInterval();

        ///@notice Validate start time is not in the past (unless it's 0 for immediate start)
        if (transactionStartTime != 0 && transactionStartTime < block.timestamp) {
            revert MneeIntentRegistry__StartTimeInPast();
        }

        ///@notice Calculate total amount per execution and validate each recipient/amount
        uint256 totalAmountPerExecution = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert MneeIntentRegistry__InvalidRecipient();
            if (amounts[i] == 0) revert MneeIntentRegistry__InvalidAmount();
            totalAmountPerExecution += amounts[i];
        }

        ///@notice Calculate projected final transaction count
        uint256 totalTransactionCount = duration / interval;
        if (totalTransactionCount == 0) revert MneeIntentRegistry__InvalidTotalTransactionCount();

        ///@notice Calculate total commitment across all executions
        uint256 totalCommitment = totalAmountPerExecution * totalTransactionCount;

        ///@notice Check if the wallet has enough available funds to cover the intent
        uint256 availableBalance = IMneeSmartWallet(wallet).getAvailableBalance(token);
        if (availableBalance < totalCommitment) {
            revert MneeIntentRegistry__InsufficientFunds();
        }

        ///@notice Generate a unique intent id using abi.encode to prevent collision
        bytes32 intentId = keccak256(abi.encode(wallet, token, recipients, amounts, block.timestamp, intentCounter++));

        ///@notice Calculate actual start and end times
        uint256 actualStartTime = transactionStartTime == 0 ? block.timestamp : transactionStartTime;
        uint256 actualEndTime = actualStartTime + duration;

        ///@notice Store the intent
        walletIntents[wallet][intentId] = Intent({
            id: intentId,
            wallet: wallet,
            token: token,
            recipients: recipients,
            amounts: amounts,
            transactionCount: 0,
            totalTransactionCount: totalTransactionCount,
            interval: interval,
            transactionStartTime: actualStartTime,
            transactionEndTime: actualEndTime,
            latestTransactionTime: 0,
            active: true,
            revertOnFailure: revertOnFailure,
            failedAmount: 0
        });

        ///@notice Update the wallet's committed funds for this token
        walletCommittedFunds[wallet][token] += totalCommitment;
        IMneeSmartWallet(wallet).increaseCommitment(token, totalCommitment);

        ///@notice Add the intent id to the wallet's active intent ids
        walletActiveIntentIds[wallet].push(intentId);

        emit IntentCreated(
            wallet,
            intentId,
            token,
            totalCommitment,
            totalTransactionCount,
            interval,
            duration,
            actualStartTime,
            actualEndTime
        );
        emit ScheduleNextExecution(intentId, wallet, actualStartTime);
        return intentId;
    }


    /**
     * @notice Checks if an intent should be executed based on its conditions
     *
     * @param intent The intent to check
     *
     * @return bool True if the intent should be executed
     */
    function shouldExecuteIntent(Intent storage intent) internal view returns (bool) {
        ///@notice Check if the intent is active
        if (!intent.active) return false;

        ///@notice Check if the intent is within the start time
        if (block.timestamp < intent.transactionStartTime) return false;

        ///@notice Check if the intent has reached the total transaction count
        if (intent.transactionCount >= intent.totalTransactionCount) return false;

        ///@notice Check if the interval has elapsed since last execution
        if (intent.latestTransactionTime != 0 && block.timestamp < intent.latestTransactionTime + intent.interval) {
            return false;
        }

        ///@notice Calculate total amount needed for this execution
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < intent.amounts.length; i++) {
            totalAmount += intent.amounts[i];
        }

        ///@notice Check if the wallet has enough funds to cover the execution
        uint256 balance;
        if (intent.token == address(0)) {
            balance = intent.wallet.balance;
        } else {
            balance = IERC20(intent.token).balanceOf(intent.wallet);
        }

        if (totalAmount > balance) return false;

        return true;
    }

    /**
     * @notice Executes an intent by transferring funds to all recipients
     *
     * @param wallet The wallet address that owns the intent
     * @param intentId The intent id to execute
     */
    function executeIntent(address wallet, bytes32 intentId) internal nonReentrant {
        Intent storage intent = walletIntents[wallet][intentId];

        ///@notice Verify the intent exists and belongs to this wallet
        if (intent.id != intentId || intent.wallet != wallet) {
            revert MneeIntentRegistry__IntentNotFound();
        }

        ///@notice Verify the intent is active
        if (!intent.active) revert MneeIntentRegistry__IntentNotActive();

        ///@notice Verify the intent should be executed
        if (!shouldExecuteIntent(intent)) revert MneeIntentRegistry__IntentNotExecutable();

        ///@notice Store current transaction count before incrementing
        uint256 currentTransactionCount = intent.transactionCount;

        ///@notice Update intent state before external calls (checks-effects-interactions pattern)
        intent.transactionCount++;
        intent.latestTransactionTime = block.timestamp;

        ///@notice Deactivate the intent if it has reached the total transaction count
        if (intent.transactionCount >= intent.totalTransactionCount) {
            intent.active = false;
        }

        ///@notice Calculate total amount for this execution
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < intent.amounts.length; i++) {
            totalAmount += intent.amounts[i];
        }

        ///@notice Update the wallet's committed funds for this token
        walletCommittedFunds[wallet][intent.token] -= totalAmount;
        IMneeSmartWallet(wallet).decreaseCommitment(intent.token, totalAmount);

        ///@notice Execute the batch intent transfer with token, intentId and transaction count
        uint256 failedAmount = IMneeSmartWallet(wallet)
            .executeBatchIntentTransfer(
                intent.token,
                intent.recipients,
                intent.amounts,
                intentId,
                currentTransactionCount,
                intent.revertOnFailure
            );

        ///@notice Track failed amounts for recovery
        if (failedAmount > 0) {
            intent.failedAmount += failedAmount;
        }

        emit IntentExecuted(wallet, intentId, currentTransactionCount, totalAmount);
        emit ScheduleNextExecution(intentId, wallet, block.timestamp + intent.interval);
    }

    /**
     * @notice Allows wallet owner to cancel an active intent
     *
     * @param intentId The intent id to cancel
     */
    function cancelIntent(bytes32 intentId) external {
        address wallet = msg.sender;
        Intent storage intent = walletIntents[wallet][intentId];

        ///@notice Verify the intent exists and belongs to this wallet
        if (intent.id != intentId || intent.wallet != wallet) {
            revert MneeIntentRegistry__IntentNotFound();
        }

        if (!intent.active) revert MneeIntentRegistry__IntentNotActive();

        ///@notice Calculate remaining amount
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < intent.amounts.length; i++) {
            totalAmount += intent.amounts[i];
        }

        ///@notice Handle case where intent is already completed
        uint256 amountRemaining = 0;
        if (intent.transactionCount < intent.totalTransactionCount) {
            uint256 remainingTransactions = intent.totalTransactionCount - intent.transactionCount;
            amountRemaining = remainingTransactions * totalAmount;
        }

        ///@notice Store failed amount before deactivating
        uint256 failedAmountToRecover = intent.failedAmount;

        ///@notice Unlock funds when the intent is cancelled (only if there are remaining transactions)
        if (amountRemaining > 0) {
            walletCommittedFunds[wallet][intent.token] -= amountRemaining;
            IMneeSmartWallet(wallet).decreaseCommitment(intent.token, amountRemaining);
        }

        intent.active = false;
        intent.failedAmount = 0; // Clear failed amount as we're emitting it

        ///@notice Emit event
        emit IntentCancelled(wallet, intentId, intent.token, amountRemaining, failedAmountToRecover);
    }

    /**
     * @notice Gets an intent by wallet and intent id
     *
     * @param wallet The wallet address
     * @param intentId The intent id
     *
     * @return intent The intent struct
     */
    function getIntent(address wallet, bytes32 intentId) external view returns (Intent memory) {
        return walletIntents[wallet][intentId];
    }

    /**
     * @notice Gets all active intent ids for a wallet
     *
     * @param wallet The wallet address
     *
     * @return intentIds Array of active intent ids
     */
    function getActiveIntents(address wallet) external view returns (bytes32[] memory) {
        return walletActiveIntentIds[wallet];
    }

    /**
     * @notice Gets the number of registered wallets
     *
     * @return count The number of registered wallets
     */
    function getRegisteredWalletsCount() external view returns (uint256) {
        return registeredWallets.length;
    }
}
