// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {AidraIntentRegistry} from "../src/AidraIntentRegistry.sol";
import {Script,console} from "forge-std/Script.sol";

contract DeployAidraIntentRegistry is Script {
    function run() external {
        vm.startBroadcast();
        AidraIntentRegistry registry=new AidraIntentRegistry();
        vm.stopBroadcast();
        console.log("Registry Deployed at:", address(registry));
    }
}