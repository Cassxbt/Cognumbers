// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/Cognumbers.sol";

contract CognumbersTest is Test {
    Cognumbers public game;
    
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);

    function setUp() public {
        game = new Cognumbers();
        vm.deal(alice, 10 ether);
        vm.deal(bob, 10 ether);
        vm.deal(charlie, 10 ether);
    }

    function test_CreateGame() public {
        uint256 gameId = game.createGame(0.01 ether, 1 hours);
        
        (
            uint256 id,
            address creator,
            Cognumbers.GameStatus status,
            uint256 entryFee,
            uint256 deadline,
            uint256 playerCount,
            ,
        ) = game.games(gameId);
        
        assertEq(id, 0);
        assertEq(creator, address(this));
        assertEq(uint256(status), uint256(Cognumbers.GameStatus.Open));
        assertEq(entryFee, 0.01 ether);
        assertEq(playerCount, 0);
        assertGt(deadline, block.timestamp);
    }

    function test_ResolveWinner_UniqueMinimum() public {
        // This test simulates the resolution phase with decrypted values
        // In production, these would come from attested decryptions
        
        uint256 gameId = game.createGame(0.01 ether, 1 hours);
        
        // Simulate players joining (can't test FHE in Foundry without a local node)
        // For now, we skip directly to resolution testing
        
        // Direct state manipulation for test
        // In real usage, players would call joinGame with encrypted inputs
    }

    function test_CalculateWinner_Logic() public {
        // Test the winner calculation with known values
        // Player 1: 3, Player 2: 5, Player 3: 3 -> Winner is Player 2 (5 is unique minimum)
        
        // This would require exposing _calculateWinner or testing through resolveWinner
    }
}
