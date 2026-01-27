# Number Verse Arena Analysis (Zama vs Inco)

## 1. Game Mechanics Recap
Number Verse Arena is a multiplayer game where players pick a number within a range.
- **Privacy**: Numbers are encrypted on the client and submitted to the blockchain.
- **Goal**: Be the player who picked the **minimum unique number**.
- **Unique Logic**: If multiple players pick the same number, that number is no longer unique.
- **FHE Usage**:
    - **Submission**: Encrypted input ensures no one (not even the owner) sees the numbers during the round.
    - **Counting**: The contract increments an encrypted counter for each possible number in the range when a player submits. This happens homomorphically: `counter[i] = counter[i] + (selection == i ? 1 : 0)`.
    - **Resolution**: Once the game is full or the deadline passes, the contract requests decryption of the submissions to determine the winner.

## 2. Architecture Comparison

| Component | Zama (Current) | Inco (Proposed) |
| :--- | :--- | :--- |
| **Encrypted Types** | `euint32` | `euint32` (via `Lib.sol`) |
| **Input Handling** | `FHE.fromExternal(ciphertext, proof)` | `inputBytes.newEuint32(msg.sender)` |
| **Selection Logic** | `FHE.select(ebool, valA, valB)` | `ebool.select(valA, valB)` |
| **Decryption Flow** | Async `requestDecryption` + Callback | **Attested Decrypt/Reveal** flow |
| **Permissions** | `FHE.allowThis(handle)` | `handle.allowThis()` / `handle.allow(user)` |
| **Frontend SDK** | `fhevmjs` / `relayer-sdk` | `@inco/js` (Zap) |

## 3. Core Logic Mapping (Solidity)

### Number Selection Check
**Zama:**
```solidity
ebool isCurrentNumber = FHE.eq(submittedNumber, FHE.asEuint32(i));
euint32 increment = FHE.select(isCurrentNumber, FHE.asEuint32(1), FHE.asEuint32(0));
gameCounts[i] = FHE.add(gameCounts[i], increment);
```

**Inco:**
```solidity
// Inco syntax using common Lib.sol patterns
ebool isCurrentNumber = submittedNumber.eq(uint256(i).asEuint32());
euint32 increment = isCurrentNumber.select(uint256(1).asEuint32(), uint256(0).asEuint32());
gameCounts[i] = gameCounts[i].add(increment);
// Note: handle.allowThis() must be called on new handles if stored in state
gameCounts[i].allowThis();
```

## 4. Inco Compatibility Status
**Status: Highly Compatible**
Inco is a perfect fit for this game. The only major architectural shift is moving from Zama's "contract-triggered callback" decryption to Inco's "attestation-based" revelation.

### The Decryption Pivot
In Zama, the contract calls `FHE.requestDecryption`, and a relayer brings the result back.
In Inco, to maintain decentralization and speed:
1. The contract marks the game as "Ready for Resolution".
2. The UI (or a bot) detects this and uses the Inco JS SDK to request a signed attestation for the submissions.
3. The UI submits these signatures to a `resolveGame` function.
4. The contract verifies the signatures and calculates the winner.

## 5. Security & Privacy Notes
- **Information Leakage**: The counting loop (`for i = min to max`) reveals the *range* of numbers, but this is already public in the game rules.
- **Proof of Uniqueness**: Inco's `e.reveal()` or Attested Reveal ensures that the final winner calculation is transparent once privacy is no longer needed.
