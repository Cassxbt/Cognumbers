// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {euint256, e, inco} from "@inco/lightning/src/Lib.testnet.sol";

/**
 * @title CognumbersMinimal
 * @notice Minimal contract to test Inco FHE encryption
 * @dev This is a diagnostic contract to isolate the newEuint256 issue
 */
contract CognumbersMinimal {
    using e for euint256;
    using e for bytes;

    // Simple game state
    uint256 public gameIdCounter;

    struct Game {
        address creator;
        uint256 entryFee;
        uint256 deadline;
        uint256 playerCount;
    }

    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => bytes32)) public playerHandles;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(uint256 => address[]) public gamePlayers;

    // Events
    event GameCreated(uint256 indexed gameId, address creator, uint256 entryFee, uint256 deadline);
    event PlayerJoined(uint256 indexed gameId, address player, bytes32 handle);
    event EncryptionSuccess(address user, bytes32 handle);
    event DebugStep(string step, uint256 value);

    // Errors
    error GameNotOpen();
    error DeadlinePassed();
    error AlreadyJoined();
    error InsufficientFee();

    constructor() {}

    /**
     * @notice Create a simple game
     */
    function createGame(uint256 _entryFee, uint256 _durationSeconds) external returns (uint256) {
        uint256 gameId = gameIdCounter++;

        games[gameId] = Game({
            creator: msg.sender,
            entryFee: _entryFee,
            deadline: block.timestamp + _durationSeconds,
            playerCount: 0
        });

        emit GameCreated(gameId, msg.sender, _entryFee, block.timestamp + _durationSeconds);
        return gameId;
    }

    /**
     * @notice Join game with encrypted choice - MINIMAL version
     * @dev Only does newEuint256, no other FHE operations
     */
    function joinGame(uint256 _gameId, bytes calldata _encryptedChoice) external payable {
        Game storage game = games[_gameId];

        // Basic checks
        if (game.creator == address(0)) revert GameNotOpen();
        if (block.timestamp >= game.deadline) revert DeadlinePassed();
        if (hasJoined[_gameId][msg.sender]) revert AlreadyJoined();
        if (msg.value < game.entryFee) revert InsufficientFee();

        emit DebugStep("passed_checks", _gameId);

        // THE KEY OPERATION - This is what we're testing
        euint256 choice = _encryptedChoice.newEuint256(msg.sender);
        bytes32 handle = euint256.unwrap(choice);

        emit DebugStep("encryption_done", uint256(handle));

        // Store state
        hasJoined[_gameId][msg.sender] = true;
        playerHandles[_gameId][msg.sender] = handle;
        gamePlayers[_gameId].push(msg.sender);
        game.playerCount++;

        emit PlayerJoined(_gameId, msg.sender, handle);
        emit EncryptionSuccess(msg.sender, handle);
    }

    /**
     * @notice Test encryption without game logic
     * @dev Pure encryption test
     */
    function testEncrypt(bytes calldata _encryptedData) external returns (bytes32) {
        euint256 encrypted = _encryptedData.newEuint256(msg.sender);
        bytes32 handle = euint256.unwrap(encrypted);
        emit EncryptionSuccess(msg.sender, handle);
        return handle;
    }

    /**
     * @notice Get player's handle
     */
    function getPlayerHandle(uint256 _gameId, address _player) external view returns (bytes32) {
        return playerHandles[_gameId][_player];
    }

    /**
     * @notice Get game info
     */
    function getGame(uint256 _gameId) external view returns (Game memory) {
        return games[_gameId];
    }

    /**
     * @notice Get players in a game
     */
    function getPlayers(uint256 _gameId) external view returns (address[] memory) {
        return gamePlayers[_gameId];
    }

    /**
     * @notice Accept ETH for fees
     */
    receive() external payable {}
}
