import assert from "assert";
import { 
  TestHelpers,
  MneeSmartWallet_Executed
} from "generated";
const { MockDb, MneeSmartWallet } = TestHelpers;

describe("MneeSmartWallet contract Executed event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for MneeSmartWallet contract Executed event
  const event = MneeSmartWallet.Executed.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("MneeSmartWallet_Executed is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await MneeSmartWallet.Executed.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualMneeSmartWalletExecuted = mockDbUpdated.entities.MneeSmartWallet_Executed.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedMneeSmartWalletExecuted: MneeSmartWallet_Executed = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      target: event.params.target,
      value: event.params.value,
      data: event.params.data,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualMneeSmartWalletExecuted, expectedMneeSmartWalletExecuted, "Actual MneeSmartWalletExecuted should be the same as the expectedMneeSmartWalletExecuted");
  });
});
