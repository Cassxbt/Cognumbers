# 🎮 Cognumbers

**Privacy-Preserving Unique Minimum Number Game built on Inco Network**

[![Solidity](https://img.shields.io/badge/Solidity-%5E0.8.20-363636?logo=solidity)](https://soliditylang.org/)
[![Inco](https://img.shields.io/badge/Powered%20by-Inco%20FHE-00ffff)](https://inco.org/)
[![React](https://img.shields.io/badge/Frontend-React%20+%20Vite-61DAFB?logo=react)](https://react.dev/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **"The only winning move is to think different."**  
> A cryptographic game of strategy where your choice stays hidden until the very end.

![Cognumbers Game](https://img.shields.io/badge/Status-Deployed-success)

---

## 🎯 What is Cognumbers?

Cognumbers is a **fully on-chain, privacy-preserving multiplayer game** where players compete to pick the **minimum unique number**. Unlike traditional blockchain games where all moves are public, Cognumbers leverages **Fully Homomorphic Encryption (FHE)** via the **Inco Network** to keep player choices encrypted throughout the entire game.

### The Game Mechanics

1. **Join a Game** → Players connect their wallet and join an active game
2. **Pick a Number (1-10)** → Your choice is encrypted client-side before submission
3. **Numbers Stay Hidden** → Not even the contract owner can see the choices
4. **Game Ends** → When max players join or deadline passes
5. **Winner Revealed** → The player with the **lowest unique number** wins the entire prize pool

**Example**: If 5 players pick `[3, 1, 1, 7, 4]`, the number `1` is not unique (two players picked it). The winner is the player who picked `3` — the minimum unique number.

---

## 🔐 Why Inco Network?

Cognumbers is a showcase of **Inco Network's FHE capabilities** — demonstrating how Web3 games can achieve true privacy without compromising on decentralization or verifiability.

### Key Inco Features Used

| Feature | How Cognumbers Uses It |
|---------|------------------------|
| **Encrypted State (`euint256`)** | Player choices stored as encrypted values on-chain |
| **Homomorphic Operations** | Encrypted counting of number selections without decryption |
| **Multiplexer Pattern (`select`)** | Privacy-preserving conditional logic for counting |
| **Attested Decryption** | Cryptographic proof that decrypted values are authentic |
| **Access Control (`allow`)** | Only authorized parties can decrypt specific handles |

### The Privacy Guarantee

```
┌─────────────────────────────────────────────────────────────┐
│                   TRADITIONAL BLOCKCHAIN                     │
│  Player A picks 7 → Everyone sees "7"                       │
│  Player B picks 3 → Everyone sees "3"                       │
│  ❌ No privacy, players can copy successful strategies       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   WITH INCO FHE                              │
│  Player A picks 7 → On-chain: 0x8a4f...c2b1 (encrypted)     │
│  Player B picks 3 → On-chain: 0x2e91...f7a3 (encrypted)     │
│  ✅ Complete privacy until game resolution                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

```
cognumbers/
├── cognumbers-contracts/    # Solidity smart contracts (Foundry)
│   ├── src/
│   │   └── Cognumbers.sol   # Main game contract (560+ lines)
│   ├── script/              # Deployment scripts
│   └── test/                # Contract tests
│
├── cognumbers-frontend/     # React + TypeScript dApp
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Application routes
│   │   ├── hooks/           # Custom React hooks (useInco, useContract)
│   │   ├── lib/             # Inco SDK integration
│   │   └── config/          # Contract ABI & addresses
│   └── public/
│
└── docs/                    # Analysis & PRD documents
```

### Smart Contract Highlights

```solidity
// Encrypted player submissions — nobody can see choices until game ends
mapping(uint256 => mapping(address => euint256)) public playerChoices;

// Encrypted counters for each number (1-10)
mapping(uint256 => euint256[11]) internal numberCounts;

// When a player joins, their choice is counted homomorphically
for (uint256 i = MIN_NUMBER; i <= MAX_NUMBER; i++) {
    euint256 numToCompare = i.asEuint256();
    ebool isMatch = choice.eq(numToCompare);
    euint256 increment = isMatch.select(uint256(1).asEuint256(), uint256(0).asEuint256());
    numberCounts[_gameId][i] = numberCounts[_gameId][i].add(increment);
}
```

### Frontend Integration

```typescript
// Encrypt player's number choice using Inco Lightning SDK
export async function encryptNumber(
  value: number,
  accountAddress: `0x${string}`
): Promise<`0x${string}`> {
  const lightning = await Lightning.latest('testnet', 84532);
  
  const ciphertext = await lightning.encrypt(BigInt(value), {
    accountAddress,
    dappAddress: CONTRACT_ADDRESS,
    handleType: handleTypes.euint256,
  });
  
  return ciphertext as `0x${string}`;
}
```

---

## ⚡ Ease of Integration with Inco

One of the most impressive aspects of building Cognumbers was **how seamlessly Inco integrates with existing Solidity patterns**. If you're familiar with OpenZeppelin contracts, you'll feel right at home.

### 1. Minimal Code Changes

Converting a public variable to encrypted takes just one line:

```solidity
// Before (public)
mapping(address => uint256) public playerChoices;

// After (encrypted with Inco)
mapping(address => euint256) public playerChoices;
```

### 2. Familiar Syntax

Inco's `using e for *` pattern enables intuitive method chaining:

```solidity
using e for euint256;
using e for ebool;
using e for uint256;

// Comparison returns encrypted bool
ebool isMatch = submittedNumber.eq(targetNumber);

// Conditional selection (multiplexer pattern)
euint256 result = isMatch.select(valueIfTrue, valueIfFalse);

// Arithmetic operations
euint256 newBalance = oldBalance.add(increment);
```

### 3. Type-Safe Encrypted Inputs

The SDK handles encryption/decryption seamlessly:

```typescript
// Frontend: Encrypt before sending
const encrypted = await zap.encrypt(7n, {
  accountAddress: wallet.account.address,
  dappAddress: contractAddress,
  handleType: handleTypes.euint256,
});

// Contract: Convert encrypted bytes to handle
euint256 choice = _encryptedChoice.newEuint256(msg.sender);
```

### 4. Built-in Security

Inco's attestation system ensures decrypted values are authentic:

```solidity
// Verify Inco covalidator signatures before using decrypted data
if (!inco.incoVerifier().isValidDecryptionAttestation(attestation, signatures)) {
    revert InvalidAttestation(_gameId, i);
}
```

---

## 🎨 Tech Stack

### Smart Contracts
- **Solidity ^0.8.20** with OpenZeppelin security contracts
- **Foundry** for compilation, testing, and deployment  
- **@inco/lightning** for FHE operations
- **OpenZeppelin** (ReentrancyGuard, Ownable, Pausable)

### Frontend
- **React 19** + **Vite** for blazing-fast development
- **TypeScript** for type safety
- **@inco/js** SDK for encryption/decryption
- **wagmi** + **viem** for Web3 connectivity
- **RainbowKit** for wallet connection
- **Framer Motion** for premium animations
- **Tailwind CSS** for responsive design

### Deployment
- **Base Sepolia** testnet for contract deployment
- **Inco Gentry Testnet** for FHE computation

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- A wallet with Base Sepolia testnet ETH

### Smart Contracts

```bash
# Navigate to contracts
cd cognumbers-contracts

# Install dependencies
forge install

# Build
forge build

# Deploy (configure .env first)
forge script script/DeployCognumbers.s.sol:DeployCognumbers \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast \
  --verify
```

### Frontend

```bash
# Navigate to frontend
cd cognumbers-frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your contract address

# Start development server
npm run dev
```

---

## 🔑 Key Features

### 🎲 Game Mechanics
- **2-10 players** per game
- **Configurable entry fees** (including free games)
- **Flexible duration** (1 minute to 7 days)
- **Auto-finalization** when max players reached

### 🔒 Security
- **ReentrancyGuard** prevents reentrancy attacks
- **Pausable** for emergency situations
- **CEI Pattern** (Checks-Effects-Interactions)
- **Attestation Verification** for decryption integrity
- **Custom Errors** for gas-efficient reverts

### 💸 Fair Economics
- **Winner Takes All** — entire prize pool to winner
- **Automatic Refunds** — if no unique number exists
- **Claim-Based Refunds** — for cancelled games
- **No Platform Fees** — 100% to players

### 🎯 User Experience
- **Premium Cyberpunk UI** with smooth animations
- **Real-time Countdowns** for game deadlines
- **Transaction Status Feedback** at every step
- **Mobile Responsive** design

---

## 📊 Contract Overview

### State Machine

```
                    ┌──────────────┐
                    │     OPEN     │
                    └──────┬───────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  CANCELLED   │ │ CALCULATING  │ │    OPEN      │
    │ (< 2 players)│ │ (≥ 2 players)│ │  (waiting)   │
    └──────────────┘ └──────┬───────┘ └──────────────┘
                           │
           ┌───────────────┼───────────────┐
           │                               │
           ▼                               ▼
    ┌──────────────┐               ┌──────────────┐
    │   FINISHED   │               │   REFUNDED   │
    │  (winner!)   │               │ (no unique)  │
    └──────────────┘               └──────────────┘
```

### Key Functions

| Function | Description |
|----------|-------------|
| `createGame(fee, duration)` | Create a new game with entry fee and duration |
| `joinGame(gameId, encryptedChoice)` | Join with encrypted number (payable) |
| `finalizeGame(gameId)` | Transition to calculating state after deadline |
| `resolveWinner(gameId, choices, signatures)` | Submit attested decryptions to determine winner |
| `claimRefund(gameId)` | Claim refund for cancelled/no-winner games |

---

## 🧪 Testing

### Contract Tests

```bash
cd cognumbers-contracts
forge test -vvv
```

### Local Development with Docker

```bash
# Start local Inco node
docker compose up

# Run E2E tests
bun test:e2e
```

---

## 📝 Learnings & Challenges

### Challenge 1: Control Flow Without Conditionals
Traditional `if/else` doesn't work with encrypted booleans. We use the **multiplexer pattern**:

```solidity
// ❌ Can't do this (would leak information)
if (choice.eq(targetNumber)) { count++; }

// ✅ Inco's select pattern
ebool matches = choice.eq(targetNumber);
count = count.add(matches.select(one, zero));
```

### Challenge 2: Attestation Flow
Inco uses an attestation-based decryption model instead of callback-based:

1. Game marks itself "Calculating"
2. Frontend requests attested decryption from Inco validators
3. Signed plaintexts submitted to contract
4. Contract verifies signatures before using values

### Challenge 3: Gas Optimization
FHE operations are more expensive. We minimize costs by:
- Batching operations where possible
- Using `euint256` only where necessary
- Pre-computing constants

---

## 🛣️ Roadmap

- [x] Core game smart contract
- [x] Inco FHE integration
- [x] React frontend with wallet connectivity
- [x] Base Sepolia testnet deployment
- [ ] Tournament mode (multi-round games)
- [ ] Leaderboard with player statistics
- [ ] Mobile app (React Native)
- [ ] Multi-chain support

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **[Inco Network](https://inco.org/)** — For pioneering FHE on EVM
- **[Foundry](https://getfoundry.sh/)** — For the incredible Solidity toolkit
- **[RainbowKit](https://rainbowkit.com/)** — For the polished wallet UX
- **Number Verse Arena** — Original game concept inspiration

---

<div align="center">

**Built with 🔐 by the Cognumbers Team**

*Privacy is not a feature, it's a fundamental right.*

</div>
