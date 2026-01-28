// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CognumbersMinimal.sol";

contract DeployMinimal is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        CognumbersMinimal minimal = new CognumbersMinimal();

        console.log("CognumbersMinimal deployed to:", address(minimal));
        console.log("Deployer:", deployer);

        vm.stopBroadcast();
    }
}
