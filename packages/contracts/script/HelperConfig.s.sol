// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {Script} from "forge-std/Script.sol";
import {EntryPoint} from "lib/account-abstraction/contracts/core/EntryPoint.sol";


contract HelperConfig is Script {
    /*//////////////////////////////////////////////////////////////
                                 TYPES
    //////////////////////////////////////////////////////////////*/
    struct NetworkConfig {
        address implementation;
        address registry;
    }

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    NetworkConfig public localNetwork;
    uint256 constant SEPOLIA_CHAIN_ID = 11155111;
    uint256 constant LOCAL_CHAIN_ID = 31337;
    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/
    error HelperConfig__UnsupportedNetwork();

    /*CONSTRUCTOR*/

    /*//////////////////////////////////////////////////////////////
                               FUNCTIONS
    //////////////////////////////////////////////////////////////*/
    function getConfig() external returns (NetworkConfig memory) {
        return getConfigByChainId(block.chainid);
    }

    function getConfigByChainId(uint256 chainId) public returns (NetworkConfig memory) {
        if (chainId == LOCAL_CHAIN_ID) {
            return getAnvilEthConfig();
        } else if (chainId == SEPOLIA_CHAIN_ID) {
            return getSepoliaEthConfig();
        } else {
            revert HelperConfig__UnsupportedNetwork();
        }
    }

    function getSepoliaEthConfig() public pure returns (NetworkConfig memory) {
        return NetworkConfig({implementation:0xD1d49aB947c9E5757196E3cb80e13689A375127c, registry: 0xd77d00B7b600F52d84F807A80f723019D6A78535});
    }

    function getAnvilEthConfig() public returns (NetworkConfig memory) {
        if (localNetwork.implementation != address(0)) {
            return localNetwork;
        }

        localNetwork = NetworkConfig({implementation: address(0), registry: address(0)});

        return localNetwork;
    }
}
