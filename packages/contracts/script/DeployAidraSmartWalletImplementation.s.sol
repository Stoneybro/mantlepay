// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {AidraSmartWallet} from "../src/AidraSmartWallet.sol";
import {HelperConfig} from "./HelperConfig.s.sol";


contract DeployAidraSmartWalletImplementation is Script {
    function run() external {
        HelperConfig helperConfig=new HelperConfig();
        HelperConfig.NetworkConfig memory networkConfig=helperConfig.getConfig();
        vm.startBroadcast();
        AidraSmartWallet wallet = new AidraSmartWallet(networkConfig.registry);
        vm.stopBroadcast();
        console.log("Implementation Deployed at:", address(wallet));
    }
}
