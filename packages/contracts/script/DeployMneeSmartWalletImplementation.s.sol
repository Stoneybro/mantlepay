// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {MneeSmartWallet} from "../src/MneeSmartWallet.sol";
import {HelperConfig} from "./HelperConfig.s.sol";


contract DeployMneeSmartWalletImplementation is Script {
    function run() external {
        HelperConfig helperConfig=new HelperConfig();
        HelperConfig.NetworkConfig memory networkConfig=helperConfig.getConfig();
        vm.startBroadcast();
        MneeSmartWallet wallet = new MneeSmartWallet(networkConfig.registry);
        vm.stopBroadcast();
        console.log("Implementation Deployed at:", address(wallet));
    }
}
