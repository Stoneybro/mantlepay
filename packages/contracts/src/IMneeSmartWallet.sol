// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IMneeSmartWallet
 * @notice Interface for Mnee Smart Wallet that the Intent Registry interacts with
 */
interface IMneeSmartWallet {
    /**
     * @notice Increases the committed funds for intents.
     * @param token The token address (address(0) for ETH).
     * @param amount The amount to add to committed funds.
     */
    function increaseCommitment(address token, uint256 amount) external;

    /**
     * @notice Decreases the committed funds after intent execution/cancellation.
     * @param token The token address (address(0) for ETH).
     * @param amount The amount to subtract from committed funds.
     */
    function decreaseCommitment(address token, uint256 amount) external;

    /**
     * @notice Executes a batch of transfers as part of an Mnee intent.
     * @param token The token address (address(0) for ETH, token address for ERC20).
     * @param recipients The array of recipient addresses.
     * @param amounts The array of amounts corresponding to each recipient.
     * @param intentId The unique identifier for the intent being executed.
     * @param transactionCount The current transaction number within the intent.
     * @param revertOnFailure Whether to revert entire transaction on any failure.
     * @return failedAmount The total amount that failed to transfer (only in skip mode)
     */
    function executeBatchIntentTransfer(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 intentId,
        uint256 transactionCount,
        bool revertOnFailure
    ) external returns (uint256 failedAmount);

    /**
     * @notice Returns the available (uncommitted) balance for a specific token.
     * @param token The token address (address(0) for ETH, token address for ERC20).
     * @return The available balance.
     */
    function getAvailableBalance(address token) external view returns (uint256);
}
