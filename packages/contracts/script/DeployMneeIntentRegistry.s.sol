// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MneeIntentRegistry} from "../src/MneeIntentRegistry.sol";

contract DeployMneeIntentRegistry is Script {
    function run() external {
        vm.startBroadcast();
        MneeIntentRegistry registry = new MneeIntentRegistry();
        vm.stopBroadcast();
        console.log("Intent Registry Deployed at:", address(registry));
    }
}
