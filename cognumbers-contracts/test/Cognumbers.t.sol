// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Cognumbers.sol";

/**
 * @title CognumbersTest
 * @notice Tests for Cognumbers contract
 * @dev Note: FHE operations require Inco network. These tests verify non-FHE logic.
 */
contract CognumbersTest is Test {
    Cognumbers public game;
    
    address public owner = address(0x1);
    address public alice = address(0x2);
    address public bob = address(0x3);

    function setUp() public {
        game = new Cognumbers(owner);
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
    }

    function test_Deployment() public view {
        assertEq(game.owner(), owner);
        assertEq(game.gameIdCounter(), 0);
    }

    function test_Constants() public view {
        assertEq(game.MIN_NUMBER(), 1);
        assertEq(game.MAX_NUMBER(), 10);
        assertEq(game.MAX_PLAYERS(), 10);
        assertEq(game.MIN_PLAYERS(), 2);
    }

    function test_PauseUnpause() public {
        vm.prank(owner);
        game.pause();
        assertTrue(game.paused());
        
        vm.prank(owner);
        game.unpause();
        assertFalse(game.paused());
    }

    function test_OnlyOwnerCanPause() public {
        vm.prank(alice);
        vm.expectRevert();
        game.pause();
    }
}
