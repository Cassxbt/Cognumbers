# Cognumbers

> A privacy-preserving "Lowest Unique Number" game powered by Inco's Fully Homomorphic Encryption (FHE) on Base Sepolia.

[![Built with Inco](https://img.shields.io/badge/Built%20with-Inco%20FHE-00D4AA)](https://inco.org)
[![Deployed on Base Sepolia](https://img.shields.io/badge/Network-Base%20Sepolia-0052FF)](https://sepolia.basescan.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Table of Contents

- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [Why Inco FHE?](#why-inco-fhe)
- [How It Works](#how-it-works)
- [Technical Architecture](#technical-architecture)
- [Security Features](#security-features)
- [Smart Contract](#smart-contract)
- [Getting Started](#getting-started)
- [Future Improvements](#future-improvements)
- [Limitations & Challenges](#limitations--challenges)

---

## The Problem

Traditional blockchain games face a fundamental transparency problem: **everything is public**.

Consider a simple number-guessing game where the lowest unique number wins. On a standard blockchain:

```
❌ Player A submits "3" → Everyone sees it
❌ Player B sees "3" is taken, submits "2" → Guaranteed win
❌ The game becomes about timing, not strategy
```

This breaks the core mechanic. Players who submit later have an unfair advantage because they can see all previous choices. The game devolves into a race condition rather than a strategic exercise.

**Existing "solutions" have significant drawbacks:**

| Approach | Problem |
|----------|---------|
| Commit-Reveal | Requires two transactions, players can abandon after seeing commits |
| Trusted Server | Centralization, single point of failure |
| Zero-Knowledge Proofs | Complex, expensive, limited composability |

---

## Our Solution

**Cognumbers** uses Inco's Fully Homomorphic Encryption to create a truly fair game where:

```
✅ Player A submits encrypted "3" → No one can see it
✅ Player B submits encrypted "2" → No one can see it
✅ Game ends → Inco decrypts all choices simultaneously
✅ Winner determined fairly → "2" was the lowest unique number
```

The encryption happens **on-chain**, meaning:
- No trusted third party
- No commit-reveal complexity
- No timing advantages
- Pure strategy

---

## Why Inco FHE?

### What is Fully Homomorphic Encryption?

FHE allows computation on encrypted data without decrypting it first. This is revolutionary for blockchain privacy:

```
Traditional Encryption:
  Encrypt(A) + Encrypt(B) = ??? (meaningless)

Homomorphic Encryption:
  Encrypt(A) + Encrypt(B) = Encrypt(A + B) ✓
```

### Inco's Unique Value Proposition

Inco operates as a **confidential computing coprocessor** for EVM chains. Here's why we chose it:

#### 1. Native EVM Integration
```solidity
// Encrypted types work like regular Solidity types
euint256 encryptedChoice = _encryptedChoice.newEuint256(msg.sender);

// Perform encrypted comparisons
ebool isMatch = encryptedChoice.eq(targetNumber);

// Conditional logic on encrypted data
euint256 result = isMatch.select(valueIfTrue, valueIfFalse);
```

#### 2. Decentralized Decryption
Unlike centralized solutions, Inco uses a network of **covalidators** who must collectively sign off on decryptions:

```
Player submits encrypted choice
         ↓
Stored on Base Sepolia (encrypted)
         ↓
Game ends → Decryption requested
         ↓
Inco covalidators verify & sign
         ↓
Attestation returned to contract
         ↓
Contract verifies signatures
         ↓
Winner determined trustlessly
```

#### 3. Composability
Because Inco integrates at the EVM level, encrypted values can:
- Be stored in mappings
- Participate in contract logic
- Interact with other contracts
- Maintain privacy across calls

#### 4. No User-Side Complexity
Players don't need to:
- Run special software
- Manage encryption keys
- Perform multi-round protocols
- Trust a central server

They simply submit their choice, and the SDK handles encryption client-side before the transaction.

---

## How It Works

### Game Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        GAME LIFECYCLE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. CREATE          2. JOIN             3. FINALIZE            │
│  ┌─────────┐       ┌─────────┐         ┌─────────┐            │
│  │ Creator │       │ Players │         │ Anyone  │            │
│  │ sets:   │       │ submit  │         │ calls   │            │
│  │ - Fee   │  ───► │encrypted│  ───►   │finalize │            │
│  │ - Time  │       │ numbers │         │after    │            │
│  └─────────┘       └─────────┘         │deadline │            │
│                                        └─────────┘            │
│                                             │                  │
│                                             ▼                  │
│  5. PAYOUT          4. RESOLVE                                 │
│  ┌─────────┐       ┌─────────┐                                │
│  │ Winner  │       │Inco     │                                │
│  │receives │  ◄─── │decrypts │                                │
│  │ prize   │       │& attests│                                │
│  └─────────┘       └─────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### The "Lowest Unique Number" Mechanic

Players choose a number from 1-10. The winner is whoever picked the **lowest number that no one else picked**.

**Example:**
| Player | Choice |
|--------|--------|
| Alice  | 3      |
| Bob    | 1      |
| Carol  | 1      |
| Dave   | 2      |

- `1` is not unique (Bob and Carol both chose it)
- `2` is unique and lowest
- **Dave wins!**

This creates interesting game theory:
- Picking `1` seems optimal, but everyone thinks that
- Picking a higher number is safer but less likely to win
- The optimal strategy depends on predicting others' behavior

**Without encryption, this game is broken.** Later players can simply pick an unused low number.

---

## Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  React + Vite + TypeScript                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ RainbowKit  │  │   Wagmi     │  │  Inco SDK   │            │
│  │   Wallet    │  │  Contract   │  │ Encryption  │            │
│  │ Connection  │  │Interactions │  │   Client    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BASE SEPOLIA                               │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   Cognumbers.sol                         │   │
│  │  - Game state management                                 │   │
│  │  - Entry fee collection                                  │   │
│  │  - Encrypted choice storage                              │   │
│  │  - Winner calculation                                    │   │
│  │  - Prize distribution                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INCO COPROCESSOR                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │    FHE      │  │ Covalidator │  │ Attestation │            │
│  │  Runtime    │  │   Network   │  │  Service    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Encryption Flow

```javascript
// 1. User selects number (client-side)
const choice = 5;

// 2. Inco SDK encrypts for the contract
const encryptedChoice = await incoClient.encrypt(choice);

// 3. Submit to contract
await contract.joinGame(gameId, encryptedChoice, { value: entryFee });

// 4. Contract stores encrypted value
playerChoices[gameId][msg.sender] = encryptedChoice.newEuint256(msg.sender);
```

### Decryption & Attestation Flow

```javascript
// 1. Request decryption from Inco
const handles = players.map(p => contract.playerChoiceHandles(gameId, p));
const decryptionResult = await incoClient.decryptMultiple(handles);

// 2. Inco covalidators sign attestations
// (happens automatically via Inco network)

// 3. Submit attested decryptions to contract
await contract.resolveWinner(
  gameId,
  decryptionResult.values,      // Decrypted numbers
  decryptionResult.signatures   // Covalidator signatures
);

// 4. Contract verifies attestations
for (uint256 i = 0; i < choices.length; i++) {
    DecryptionAttestation memory attestation = DecryptionAttestation({
        handle: playerChoiceHandles[gameId][players[i]],
        value: bytes32(choices[i])
    });

    // Verify covalidator signatures
    require(
        inco.incoVerifier().isValidDecryptionAttestation(attestation, signatures[i]),
        "Invalid attestation"
    );
}
```

---

## Security Features

Our contract implements industry-standard security practices:

### 1. Reentrancy Protection
```solidity
contract Cognumbers is ReentrancyGuard {
    function resolveWinner(...) external nonReentrant {
        // State updated BEFORE external calls (CEI pattern)
        game.status = GameStatus.Finished;

        // External call last
        (bool success, ) = winner.call{value: prize}("");
    }
}
```

### 2. Access Control
```solidity
contract Cognumbers is Ownable, Pausable {
    function pause() external onlyOwner {
        _pause();
    }

    function emergencyWithdraw(address _to, uint256 _amount)
        external
        onlyOwner
        whenPaused
    {
        // Emergency recovery only when paused
    }
}
```

### 3. Attestation Verification
```solidity
// Cannot submit fake decryption results
if (!inco.incoVerifier().isValidDecryptionAttestation(attestation, signatures[i])) {
    revert InvalidAttestation(gameId, i);
}
```

### 4. Custom Errors (Gas Efficient)
```solidity
error GameNotOpen(uint256 gameId, GameStatus currentStatus);
error IncorrectEntryFee(uint256 gameId, uint256 required, uint256 provided);
error AlreadyJoined(uint256 gameId, address player);
// ... 15+ custom errors for precise debugging
```

### 5. Refund Mechanism
```solidity
// If no unique number exists, players get refunds
if (winner == address(0)) {
    game.status = GameStatus.Refunded;
    emit RefundsInitiated(gameId, playerCount, prizePool);
}

// Players claim refunds individually (pull pattern)
function claimRefund(uint256 _gameId) external nonReentrant {
    require(game.status == GameStatus.Refunded || game.status == GameStatus.Cancelled);
    require(hasJoined[_gameId][msg.sender]);
    require(!hasClaimedRefund[_gameId][msg.sender]);

    hasClaimedRefund[_gameId][msg.sender] = true;
    (bool success, ) = msg.sender.call{value: game.entryFee}("");
}
```

---

## Smart Contract

**Deployed Address:** `0x3C20F0548933663cD13cCF2884a7bb785EF9766D`

**Network:** Base Sepolia (Chain ID: 84532)

**Package Versions:**
- `@inco/js`: 0.7.11
- `@inco/lightning`: 0.7.11

**View on Basescan:** [Link](https://sepolia.basescan.org/address/0x3C20F0548933663cD13cCF2884a7bb785EF9766D)

### Key Functions

| Function | Description |
|----------|-------------|
| `createGame(entryFee, duration)` | Create a new game with specified parameters |
| `joinGame(gameId, encryptedChoice)` | Join with an encrypted number (1-10) |
| `finalizeGame(gameId)` | Lock the game after deadline |
| `resolveWinner(gameId, choices, signatures)` | Submit attested decryptions |
| `claimRefund(gameId)` | Claim refund if game cancelled/no winner |
| `cancelGame(gameId)` | Cancel if deadline passed with <2 players |

### Game Parameters

| Parameter | Value |
|-----------|-------|
| Min Players | 2 |
| Max Players | 10 |
| Number Range | 1-10 |
| Min Duration | 60 seconds |
| Max Duration | 7 days |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A wallet with Base Sepolia ETH ([Faucet](https://www.alchemy.com/faucets/base-sepolia))

### Frontend Setup

```bash
cd cognumbers-frontend
npm install
npm run dev
```

### Contract Development

```bash
cd cognumbers-contracts
npm install           # Install Inco & OpenZeppelin
forge build          # Compile
forge test           # Run tests
```

### Deployment

```bash
# Set environment variables
cp .env.example .env
# Edit .env with your PRIVATE_KEY and RPC URL

# Deploy
forge script script/Cognumbers.s.sol:CognumbersScript \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast
```

---

## Future Improvements

### Short Term
- [ ] Event indexing with The Graph for game history
- [ ] Leaderboard tracking wins/losses per address
- [ ] Mobile-optimized UI improvements
- [ ] Gas optimization for bulk operations

### Medium Term
- [ ] Tournament mode with brackets
- [ ] Variable number ranges (1-100, etc.)
- [ ] Team-based gameplay
- [ ] Integration with ENS for player names

### Long Term
- [ ] Cross-chain deployment (Arbitrum, Optimism)
- [ ] DAO governance for game parameters
- [ ] NFT rewards for winners
- [ ] Reputation system

---

## Limitations & Challenges

### Current Limitations

1. **Decryption Latency**
   - Inco decryption requires covalidator consensus
   - Adds ~10-30 seconds to resolution
   - Future improvements expected as network matures

2. **Gas Costs**
   - FHE operations are more expensive than plaintext
   - Mitigated by Base L2's low fees
   - Encrypted counter updates add overhead

3. **Player Cap**
   - Currently limited to 10 players per game
   - Scaling requires optimizing encrypted aggregation

### Challenges We Overcame

1. **Attestation Verification**
   - Initially unclear how to verify Inco decryptions
   - Solution: Use `inco.incoVerifier().isValidDecryptionAttestation()`

2. **Encrypted Arithmetic**
   - Counting unique numbers requires comparison loops
   - Solution: Pre-compute encrypted counters per number

3. **Refund Edge Cases**
   - What if no unique number exists?
   - Solution: Implemented `Refunded` status with pull-based claims

---

## Acknowledgments

- [Inco Network](https://inco.org) - FHE infrastructure
- [Base](https://base.org) - L2 deployment
- [RainbowKit](https://rainbowkit.com) - Wallet connection
- [Foundry](https://getfoundry.sh) - Smart contract tooling

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Built for the future of on-chain privacy</strong>
  <br>
  <sub>Cognumbers - Where your strategy stays secret until the very end.</sub>
</p>
