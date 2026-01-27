// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {Cognumbers} from "../src/Cognumbers.sol";

contract CognumbersScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying Cognumbers...");
        console.log("Deployer:", deployer);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy with deployer as owner
        Cognumbers cognumbers = new Cognumbers(deployer);

        console.log("Cognumbers deployed at:", address(cognumbers));
        console.log("Owner:", cognumbers.owner());

        vm.stopBroadcast();
    }
}
