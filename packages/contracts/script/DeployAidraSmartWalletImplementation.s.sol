// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {AidraSmartWallet} from "../src/AidraSmartWallet.sol";

contract DeployAidraSmartWalletImplementation is Script {
    function run() external {
        vm.startBroadcast();
        AidraSmartWallet wallet = new AidraSmartWallet();
        vm.stopBroadcast();
        console.log("Implementation Deployed at:", address(wallet));
    }
}
