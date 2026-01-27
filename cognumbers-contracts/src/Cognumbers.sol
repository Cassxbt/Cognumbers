// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {euint256, ebool, e, inco} from "@inco/lightning/src/Lib.sol";
import {IIncoVerifier} from "@inco/lightning/src/interfaces/IIncoVerifier.sol";
import {DecryptionAttestation} from "@inco/lightning/src/lightning-parts/DecryptionAttester.types.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Cognumbers
 * @author Cassxbt
 * @notice A privacy-preserving "Unique Minimum Number" game powered by Inco FHE.
 * @dev Players submit encrypted numbers (1-10). The player with the minimum
 * unique number wins the prize pool. Uses Inco's attestation system for
 * secure decryption verification.
 *
 * Security features:
 * - ReentrancyGuard: Prevents reentrancy attacks on prize distribution
 * - Pausable: Emergency pause functionality
 * - Ownable: Admin controls for emergency situations
 * - Attestation verification: Cryptographic proof of correct decryption
 */
contract Cognumbers is ReentrancyGuard, Ownable, Pausable {
    using e for euint256;
    using e for ebool;
    using e for uint256;
    using e for bytes;
    using e for address;

    // ============ Constants ============
    uint256 public constant MIN_NUMBER = 1;
    uint256 public constant MAX_NUMBER = 10;
    uint256 public constant MAX_PLAYERS = 10;
    uint256 public constant MIN_PLAYERS = 2;
    uint256 public constant MIN_DURATION = 60; // 1 minute minimum
    uint256 public constant MAX_DURATION = 7 days;

    // ============ Enums ============
    enum GameStatus { Open, Calculating, Finished, Cancelled, Refunded }

    // ============ Structs ============
    struct Game {
        uint256 gameId;
        address creator;
        GameStatus status;
        uint256 entryFee;
        uint256 deadline;
        uint256 playerCount;
        address winner;
        uint256 winningNumber;
        uint256 prizePool;
    }

    // ============ State ============
    uint256 public gameIdCounter;
    mapping(uint256 => Game) public games;
    mapping(uint256 => address[]) internal gamePlayers;
    mapping(uint256 => mapping(address => euint256)) public playerChoices;
    mapping(uint256 => mapping(address => bytes32)) public playerChoiceHandles;
    mapping(uint256 => mapping(address => bool)) public hasJoined;
    mapping(uint256 => mapping(address => bool)) public hasClaimedRefund;
    mapping(uint256 => euint256[11]) internal numberCounts;

    // ============ Custom Errors ============
    error GameNotOpen(uint256 gameId, GameStatus currentStatus);
    error GameNotCalculating(uint256 gameId, GameStatus currentStatus);
    error DeadlineNotPassed(uint256 gameId, uint256 deadline, uint256 currentTime);
    error DeadlinePassed(uint256 gameId, uint256 deadline, uint256 currentTime);
    error IncorrectEntryFee(uint256 gameId, uint256 required, uint256 provided);
    error AlreadyJoined(uint256 gameId, address player);
    error GameFull(uint256 gameId, uint256 maxPlayers);
    error InsufficientPlayers(uint256 gameId, uint256 current, uint256 required);
    error ChoiceCountMismatch(uint256 gameId, uint256 expected, uint256 provided);
    error InvalidAttestation(uint256 gameId, uint256 playerIndex);
    error PrizeTransferFailed(uint256 gameId, address winner, uint256 amount);
    error RefundTransferFailed(uint256 gameId, address player, uint256 amount);
    error RefundAlreadyClaimed(uint256 gameId, address player);
    error NotEligibleForRefund(uint256 gameId, address player);
    error InvalidDuration(uint256 provided, uint256 min, uint256 max);
    error InvalidEntryFee(uint256 provided);
    error NoPlayersToRefund(uint256 gameId);
    error GameNotRefundable(uint256 gameId, GameStatus status);
    error OnlyCreatorCanCancel(uint256 gameId, address caller, address creator);

    // ============ Events ============
    event GameCreated(
        uint256 indexed gameId,
        address indexed creator,
        uint256 entryFee,
        uint256 deadline
    );

    event PlayerJoined(
        uint256 indexed gameId,
        address indexed player,
        uint256 playerCount,
        uint256 prizePool
    );

    event GameFinalized(
        uint256 indexed gameId,
        uint256 playerCount,
        uint256 prizePool
    );

    event WinnerDetermined(
        uint256 indexed gameId,
        address indexed winner,
        uint256 winningNumber,
        uint256 prize
    );

    event NoWinner(
        uint256 indexed gameId,
        uint256 playerCount,
        string reason
    );

    event GameCancelled(
        uint256 indexed gameId,
        address indexed cancelledBy,
        string reason
    );

    event RefundClaimed(
        uint256 indexed gameId,
        address indexed player,
        uint256 amount
    );

    event RefundsInitiated(
        uint256 indexed gameId,
        uint256 playerCount,
        uint256 totalRefund
    );

    event EmergencyWithdrawal(
        address indexed to,
        uint256 amount
    );

    // ============ Constructor ============
    /**
     * @notice Initialize the Cognumbers contract
     * @param _owner Address of the contract owner
     */
    constructor(address _owner) Ownable(_owner) {}

    // ============ External Functions ============

    /**
     * @notice Create a new game
     * @param _entryFee Entry fee in wei (can be 0 for free games)
     * @param _durationSeconds Game duration in seconds
     * @return gameId The ID of the created game
     */
    function createGame(
        uint256 _entryFee,
        uint256 _durationSeconds
    ) external whenNotPaused returns (uint256 gameId) {
        if (_durationSeconds < MIN_DURATION || _durationSeconds > MAX_DURATION) {
            revert InvalidDuration(_durationSeconds, MIN_DURATION, MAX_DURATION);
        }

        gameId = gameIdCounter++;

        Game storage newGame = games[gameId];
        newGame.gameId = gameId;
        newGame.creator = msg.sender;
        newGame.status = GameStatus.Open;
        newGame.entryFee = _entryFee;
        newGame.deadline = block.timestamp + _durationSeconds;

        // Initialize encrypted counters to 0 for numbers 1-10
        for (uint256 i = MIN_NUMBER; i <= MAX_NUMBER; i++) {
            numberCounts[gameId][i] = uint256(0).asEuint256();
            numberCounts[gameId][i].allowThis();
        }

        emit GameCreated(gameId, msg.sender, _entryFee, newGame.deadline);
    }

    /**
     * @notice Join a game with an encrypted number choice
     * @param _gameId Game ID
     * @param _encryptedChoice Encrypted number (1-10), generated via @inco/js SDK
     */
    function joinGame(
        uint256 _gameId,
        bytes calldata _encryptedChoice
    ) external payable whenNotPaused nonReentrant {
        Game storage game = games[_gameId];

        if (game.status != GameStatus.Open) {
            revert GameNotOpen(_gameId, game.status);
        }
        if (block.timestamp >= game.deadline) {
            revert DeadlinePassed(_gameId, game.deadline, block.timestamp);
        }
        if (hasJoined[_gameId][msg.sender]) {
            revert AlreadyJoined(_gameId, msg.sender);
        }
        if (game.playerCount >= MAX_PLAYERS) {
            revert GameFull(_gameId, MAX_PLAYERS);
        }

        // Handle entry fee - refund excess
        if (msg.value < game.entryFee) {
            revert IncorrectEntryFee(_gameId, game.entryFee, msg.value);
        }

        uint256 excess = msg.value - game.entryFee;
        if (excess > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: excess}("");
            require(refundSuccess, "Excess refund failed");
        }

        hasJoined[_gameId][msg.sender] = true;
        game.playerCount++;
        game.prizePool += game.entryFee;
        gamePlayers[_gameId].push(msg.sender);

        // Create encrypted input from user's ciphertext
        euint256 choice = _encryptedChoice.newEuint256(msg.sender);
        choice.allowThis();

        // Store the player's choice and handle
        playerChoices[_gameId][msg.sender] = choice;
        playerChoiceHandles[_gameId][msg.sender] = euint256.unwrap(choice);

        // Update encrypted counters for each possible number
        for (uint256 i = MIN_NUMBER; i <= MAX_NUMBER; i++) {
            euint256 numToCompare = i.asEuint256();
            ebool isMatch = choice.eq(numToCompare);
            euint256 increment = isMatch.select(uint256(1).asEuint256(), uint256(0).asEuint256());
            numberCounts[_gameId][i] = numberCounts[_gameId][i].add(increment);
            numberCounts[_gameId][i].allowThis();
        }

        emit PlayerJoined(_gameId, msg.sender, game.playerCount, game.prizePool);

        // Auto-finalize if game is full
        if (game.playerCount == MAX_PLAYERS) {
            _finalizeGame(_gameId);
        }
    }

    /**
     * @notice Finalize game after deadline (if not full)
     * @param _gameId Game ID
     */
    function finalizeGame(uint256 _gameId) external whenNotPaused {
        Game storage game = games[_gameId];

        if (game.status != GameStatus.Open) {
            revert GameNotOpen(_gameId, game.status);
        }
        if (block.timestamp < game.deadline) {
            revert DeadlineNotPassed(_gameId, game.deadline, block.timestamp);
        }
        if (game.playerCount < MIN_PLAYERS) {
            revert InsufficientPlayers(_gameId, game.playerCount, MIN_PLAYERS);
        }

        _finalizeGame(_gameId);
    }

    /**
     * @notice Resolve the game with attested decryptions
     * @dev Verifies attestations from Inco covalidators before determining winner
     * @param _gameId Game ID
     * @param _decryptedChoices Array of decrypted player choices (in order of gamePlayers)
     * @param _signatures Array of signature arrays for each attestation
     */
    function resolveWinner(
        uint256 _gameId,
        uint256[] calldata _decryptedChoices,
        bytes[][] calldata _signatures
    ) external whenNotPaused nonReentrant {
        Game storage game = games[_gameId];

        if (game.status != GameStatus.Calculating) {
            revert GameNotCalculating(_gameId, game.status);
        }
        if (_decryptedChoices.length != game.playerCount) {
            revert ChoiceCountMismatch(_gameId, game.playerCount, _decryptedChoices.length);
        }
        if (_signatures.length != game.playerCount) {
            revert ChoiceCountMismatch(_gameId, game.playerCount, _signatures.length);
        }

        address[] storage players = gamePlayers[_gameId];

        // Verify each attestation
        for (uint256 i = 0; i < _decryptedChoices.length; i++) {
            bytes32 handle = playerChoiceHandles[_gameId][players[i]];
            DecryptionAttestation memory attestation = DecryptionAttestation({
                handle: handle,
                value: bytes32(_decryptedChoices[i])
            });

            if (!inco.incoVerifier().isValidDecryptionAttestation(attestation, _signatures[i])) {
                revert InvalidAttestation(_gameId, i);
            }
        }

        // All attestations valid - update state BEFORE external calls (CEI pattern)
        game.status = GameStatus.Finished;

        // Calculate winner using unique minimum logic
        (address winnerAddr, uint256 winningNum) = _calculateWinner(_gameId, _decryptedChoices);

        if (winnerAddr != address(0)) {
            game.winner = winnerAddr;
            game.winningNumber = winningNum;

            uint256 prize = game.prizePool;

            emit WinnerDetermined(_gameId, winnerAddr, winningNum, prize);

            // Transfer prize (after state update)
            (bool success, ) = winnerAddr.call{value: prize}("");
            if (!success) {
                revert PrizeTransferFailed(_gameId, winnerAddr, prize);
            }
        } else {
            // No unique number - initiate refunds
            game.status = GameStatus.Refunded;
            emit NoWinner(_gameId, game.playerCount, "No unique number found");
            emit RefundsInitiated(_gameId, game.playerCount, game.prizePool);
        }
    }

    /**
     * @notice Claim refund when game has no winner
     * @param _gameId Game ID
     */
    function claimRefund(uint256 _gameId) external nonReentrant {
        Game storage game = games[_gameId];

        if (game.status != GameStatus.Refunded && game.status != GameStatus.Cancelled) {
            revert GameNotRefundable(_gameId, game.status);
        }
        if (!hasJoined[_gameId][msg.sender]) {
            revert NotEligibleForRefund(_gameId, msg.sender);
        }
        if (hasClaimedRefund[_gameId][msg.sender]) {
            revert RefundAlreadyClaimed(_gameId, msg.sender);
        }

        hasClaimedRefund[_gameId][msg.sender] = true;
        uint256 refundAmount = game.entryFee;

        emit RefundClaimed(_gameId, msg.sender, refundAmount);

        (bool success, ) = msg.sender.call{value: refundAmount}("");
        if (!success) {
            revert RefundTransferFailed(_gameId, msg.sender, refundAmount);
        }
    }

    /**
     * @notice Cancel game if deadline passed with insufficient players
     * @param _gameId Game ID
     */
    function cancelGame(uint256 _gameId) external {
        Game storage game = games[_gameId];

        if (game.status != GameStatus.Open) {
            revert GameNotOpen(_gameId, game.status);
        }
        if (block.timestamp < game.deadline) {
            revert DeadlineNotPassed(_gameId, game.deadline, block.timestamp);
        }
        if (game.playerCount >= MIN_PLAYERS) {
            revert InsufficientPlayers(_gameId, game.playerCount, MIN_PLAYERS);
        }

        game.status = GameStatus.Cancelled;

        string memory reason = game.playerCount == 0
            ? "No players joined"
            : "Insufficient players";

        emit GameCancelled(_gameId, msg.sender, reason);

        if (game.playerCount > 0) {
            emit RefundsInitiated(_gameId, game.playerCount, game.prizePool);
        }
    }

    // ============ Admin Functions ============

    /**
     * @notice Pause the contract in case of emergency
     * @dev Only callable by owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause the contract
     * @dev Only callable by owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @notice Emergency withdrawal of stuck funds
     * @dev Only callable by owner when paused. Use with extreme caution.
     * @param _to Address to send funds
     * @param _amount Amount to withdraw
     */
    function emergencyWithdraw(
        address _to,
        uint256 _amount
    ) external onlyOwner whenPaused {
        require(_to != address(0), "Invalid recipient");
        require(_amount <= address(this).balance, "Insufficient balance");

        emit EmergencyWithdrawal(_to, _amount);

        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Emergency withdrawal failed");
    }

    // ============ View Functions ============

    /**
     * @notice Get game details
     * @param _gameId Game ID
     * @return Game struct
     */
    function getGame(uint256 _gameId) external view returns (Game memory) {
        return games[_gameId];
    }

    /**
     * @notice Get list of players in a game
     * @param _gameId Game ID
     * @return Array of player addresses
     */
    function getPlayers(uint256 _gameId) external view returns (address[] memory) {
        return gamePlayers[_gameId];
    }

    /**
     * @notice Get a player's encrypted choice handle
     * @param _gameId Game ID
     * @param _player Player address
     * @return The encrypted choice handle
     */
    function getPlayerChoiceHandle(
        uint256 _gameId,
        address _player
    ) external view returns (bytes32) {
        return playerChoiceHandles[_gameId][_player];
    }

    /**
     * @notice Check if a player can claim refund
     * @param _gameId Game ID
     * @param _player Player address
     * @return canClaim True if player can claim refund
     */
    function canClaimRefund(
        uint256 _gameId,
        address _player
    ) external view returns (bool canClaim) {
        Game storage game = games[_gameId];
        return (game.status == GameStatus.Refunded || game.status == GameStatus.Cancelled)
            && hasJoined[_gameId][_player]
            && !hasClaimedRefund[_gameId][_player];
    }

    /**
     * @notice Get contract balance
     * @return Contract ETH balance
     */
    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Get the Inco verifier address used for attestation validation
     * @return The IIncoVerifier contract address
     */
    function getIncoVerifier() external view returns (IIncoVerifier) {
        return inco.incoVerifier();
    }

    // ============ Internal Functions ============

    /**
     * @notice Internal function to finalize a game
     * @param _gameId Game ID
     */
    function _finalizeGame(uint256 _gameId) internal {
        Game storage game = games[_gameId];
        game.status = GameStatus.Calculating;
        emit GameFinalized(_gameId, game.playerCount, game.prizePool);
    }

    /**
     * @notice Calculate the unique minimum winner
     * @param _gameId Game ID
     * @param choices Array of decrypted choices
     * @return winner Winner address
     * @return winningNumber The winning number
     */
    function _calculateWinner(
        uint256 _gameId,
        uint256[] calldata choices
    ) internal view returns (address winner, uint256 winningNumber) {
        address[] storage players = gamePlayers[_gameId];

        // Count occurrences of each number
        uint256[11] memory counts;
        for (uint256 i = 0; i < choices.length; i++) {
            if (choices[i] >= MIN_NUMBER && choices[i] <= MAX_NUMBER) {
                counts[choices[i]]++;
            }
        }

        // Find minimum unique number
        uint256 minUnique = 0;
        for (uint256 num = MIN_NUMBER; num <= MAX_NUMBER; num++) {
            if (counts[num] == 1) {
                minUnique = num;
                break;
            }
        }

        if (minUnique == 0) {
            return (address(0), 0);
        }

        // Find the player who chose minUnique
        for (uint256 i = 0; i < choices.length; i++) {
            if (choices[i] == minUnique) {
                return (players[i], minUnique);
            }
        }

        return (address(0), 0);
    }

    // ============ Receive ============

    /**
     * @notice Reject direct ETH transfers
     */
    receive() external payable {
        revert("Use joinGame to participate");
    }
}
