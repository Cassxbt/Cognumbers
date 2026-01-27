// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Cognumbers.sol";

contract DeployCognumbers is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        Cognumbers cognumbers = new Cognumbers();
        
        console.log("Cognumbers deployed to:", address(cognumbers));
        
        vm.stopBroadcast();
    }
}
