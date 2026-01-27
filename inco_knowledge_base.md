# Inco Knowledge Base

## 1. Introduction & Core Concepts
**Source:** `https://docs.inco.org/guide/intro`

The Inco Guide Introduction provides a "Hello World" example of a Confidential Token (ERC-20 like) using the Inco Lightning Library.

### Key Patterns Observed:
1.  **Imports**: `import {euint256, ebool, e} from "@inco/lightning/Lib.sol";`
2.  **Usage**: `using e for *;` enables method syntax for encrypted types.
3.  **Encrypted State**: `mapping(address => euint256) public balanceOf;`
4.  **Key Operations**:
    -   `asEuint256()`: Cast clear text key to encrypted type (e.g. in constructor).
    -   `newEuint256(msg.sender)`: Decrypts/Processes input ciphertext from a specific sender.
    -   `isAllowed(value)`: Checks if the sender has permission to usage the handle.
    -   `ge(value)`: Greater-than-or-equal comparison (returns `ebool`).
    -   `select(trueVal, falseVal)`: Multiplexer/Ternary operator based on `ebool`.
    -   `add()`, `sub()`: Homomorphic arithmetic.
    -   `allow(address)`: Grants re-encryption permission to an address.
    -   `allowThis()`: Grants re-encryption permission to the contract itself.

### Example Contract snippet (SimpleConfidentialToken):
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8;
import {euint256, ebool, e} from "@inco/lightning/Lib.sol";

contract SimpleConfidentialToken {
    using e for *;
    mapping(address => euint256) public balanceOf;

    constructor() {
        balanceOf[msg.sender] = uint256(1000 * 1e9).asEuint256();
    }

    // Transfer using raw bytes input (ciphertext)
    function transfer(address to, bytes memory valueInput) external returns (ebool) {
        euint256 value = valueInput.newEuint256(msg.sender);
        return _transfer(to, value);
    }

    // Transfer using handle (requires isAllowed check)
    function transfer(address to, euint256 value) public returns (ebool success) {
        require(msg.sender.isAllowed(value), "unauthorized handle access");
        return _transfer(to, value);
    }

    function _transfer(address to, euint256 value) external returns (ebool success) {
        success = balanceOf[msg.sender].ge(value);
        // If success, transfer value, else transfer 0
        euint256 transferredValue = success.select(value, uint256(0).asEuint256());
        
        euint256 senderNewBalance = balanceOf[msg.sender].sub(transferredValue);
        euint256 receiverNewBalance = balanceOf[to].add(transferredValue);
        
        balanceOf[msg.sender] = senderNewBalance;
        balanceOf[to] = receiverNewBalance;

        // Update permissions so users can view their new balances
        senderNewBalance.allow(msg.sender);
        receiverNewBalance.allow(to);
        senderNewBalance.allowThis();
        receiverNewBalance.allowThis();
    }
}
```

### Concepts to Explore Further:
-   **Handles**: References to encrypted data.
-   **Inputs**: How users send encrypted data.
-   **Operations**: Available FHE operations.
-   **Control Flow**: Branching (since we can't `if` on encrypted data traditionally).
-   **Access Control**: Managing view permissions.



### 1.1 Handles & E-Types
**Source:** `https://docs.inco.org/guide/handles`
-   **Concept**: Data on Inco is encrypted. Smart contracts interact with "Handles", which are `bytes32` identifiers pointing to the actual encrypted data stored off-chain (in the validators' memory).
-   **Types**:
    -   `euint256` (wrapper around `bytes32`)
    -   `ebool` (wrapper around `bytes32`)
    -   `eaddress` (wrapper around `bytes32`)
    -   `einput` (alias for `bytes`, used for raw input ciphertexts)
-   **Note**: Clear text types (`uint256`, `bool`, `address`) exist alongside encrypted types.

### 1.2 Inputs & Type Conversion
**Source:** `https://docs.inco.org/guide/input` & `https://docs.inco.org/guide/operations`
-   **From Off-chain (User Input)**:
    -   Users send encrypted bytes (`ciphertext`).
    -   Contracts convert `bytes` to handles using `newE*` methods.
    -   **Important**: `msg.sender` MUST be passed to bind the input to the sender.
    ```solidity
    // Inside a function
    euint256 value = valueInput.newEuint256(msg.sender);
    ebool flag = flagInput.newEbool(msg.sender);
    eaddress addr = addrInput.newEaddress(msg.sender);
    ```
    -   *Cost*: `newE*` operations consume gas (need `inco.getFee()`).

-   **From Variables (Clear to Encrypted)**:
    -   Cast clear values to encrypted handles using `asE*`.
    ```solidity
    euint256 a = e.asEuint256(42);
    ebool b = e.asEbool(true);
    ```

### 1.3 Operations
**Source:** `https://docs.inco.org/guide/operations`
-   **Arithmetic**: `add`, `sub`, `mul`, `div`, `rem`
-   **Bitwise**: `and`, `or`, `xor`, `shr`, `shl`
-   **Comparison** (returns `ebool`): `eq`, `ne`, `ge`, `gt`, `le`, `lt`
-   **Min/Max**: `min`, `max`
-   **Randomness**:
    -   `e.rand()`: Generate random encrypted uint256.
    -   `e.randBounded(upperBound)`: Generate random within range.

### 1.4 Control Flow (Multiplexer Pattern)
**Source:** `https://docs.inco.org/guide/control-flow`
-   **Problem**: You cannot use standard `if/else` on encrypted booleans (`ebool`) because the network doesn't know the result (it's encrypted).
-   **Solution**: Use `select` (multiplexer). It computes BOTH branches and returns a result that matches the valid branch based on the condition.
    ```solidity
    ebool condition = encryptedValue.gt(10);
    // If condition is true, result is valA, else valB
    euint256 result = condition.select(valA, valB);
    ```
-   **Implication**: State changes for *both* branches must be calculated, then merged using `select`.

### 1.5 Access Control & Decryption
**Source:** `https://docs.inco.org/guide/guide-access-control` & `https://docs.inco.org/guide/decryption`
-   **Default**: State is encrypted. No one sees it, not even the contract.
-   **Allowing Access**:
    -   `e.allow(address)`: Grants a specific user permission to decrypt a handle (via off-chain API).
    -   `e.allowThis()`: Grants the contract itself permission (rarely used for direct decryption, mostly for re-encryption flows).
-   **Viewing Encrypted Data (Attested Decrypt)**:
    1.  User requests decryption off-chain (via JS SDK `zap.attestedDecrypt`).
    2.  Validators sign the decryption if the user is `allowed`.
    3.  User receives plaintext + signatures.
-   **Using Decrypted Data On-Chain (Attested Reveal/Compute)**:
    -   To use a private value in public logic (e.g. `require(score > 700)`), the user submits the value + signatures to the contract.
    -   The contract verifies the attestation.

### 1.6 Verification & Best Practices
**Source:** `https://docs.inco.org/guide/verifying-attestations` & `https://docs.inco.org/guide/best-practices`
-   **Verification**: Use `inco.incoVerifier().isValidDecryptionAttestation(decryption, signatures)`.
-   **Critical Check**: Always verify the `decryption.handle` matches the handle stored in the contract!
    ```solidity
    require(storedHandle == decryption.handle, "Handle mismatch");
    ```
-   **Allowance Check**: When accepting handled inputs, verify `msg.sender` allowed them.
    ```solidity
    require(msg.sender.isAllowed(handle), "Unauthorized");
    ```

## 2. Structured Reference of All Library Functions

### 2.1 Types
-   `euint256`, `ebool`, `eaddress`
-   Clear types: `uint256`, `bool`, `address`

### 2.2 Math Operations (`euint256`)
-   `e.add(a, b)`: Addition
-   `e.sub(a, b)`: Subtraction
-   `e.mul(a, b)`: Multiplication
-   `e.div(a, b)`: Division
-   `e.rem(a, b)`: Remainder/Modulus
-   `e.min(a, b)`: Minimum
-   `e.max(a, b)`: Maximum

### 2.3 Bitwise Operations
-   `e.and(a, b)`
-   `e.or(a, b)`
-   `e.xor(a, b)`
-   `e.shl(a, shift)`: Shift Left
-   `e.shr(a, shift)`: Shift Right
-   `e.rotl(a, shift)`: Rotate Left
-   `e.rotr(a, shift)`: Rotate Right
-   `e.not(a)`: Bitwise Not

### 2.4 Comparison (Returns `ebool`)
-   `e.eq(a, b)`: Equal
-   `e.ne(a, b)`: Not Equal
-   `e.ge(a, b)`: Greater or Equal
-   `e.gt(a, b)`: Greater Than
-   `e.le(a, b)`: Less or Equal
-   `e.lt(a, b)`: Less Than

### 2.5 Multiplexer (Select)
-   `condition.select(trueVal, falseVal)`
-   Supports `euint256`, `ebool`, `eaddress` return types.

### 2.6 Randomness
-   `e.rand()`: Random `euint256`
-   `e.randBounded(max)`: Random `euint256` < max

### 2.7 Casts & Conversions
-   `e.asEuint256(clearValue)`: Public -> Encrypted
-   `e.asEbool(clearValue)`
-   `e.asEaddress(clearValue)`
-   `e.asEbool(euint256)`: Cast
-   `e.asEuint256(ebool)`: Cast

### 2.8 Access Control Methods
-   `e.allow(handle, user)`: Grants `user` access to `handle`.
-   `e.allowThis(handle)`: Grants contract access.
-   `e.isAllowed(user, handle)`: Returns clear `bool` checking permission.

### 3.1 Overview
**Source:** `https://github.com/Inco-fhevm/lightning-rod`
Lightning Rod is the official Dapp Development Kit (DDK) for Inco. It provides a template repository and tools to build, test, and deploy applications.

### 3.2 Prerequisites & Stack
-   **Runtime**: [Bun](https://bun.sh/)
-   **Smart Contracts**: [Foundry](https://getfoundry.sh/)
-   **Local Network**: [Docker](https://www.docker.com/) (runs a local Inco node)

### 3.3 Quick Start
1.  **Install**: `bun install`
2.  **Run Local Network**: `docker compose up` (starts the FHE-enabled chain locally)
3.  **Test E2E**: `bun test:e2e` (runs `incolite.local.e2e.test.ts`)
4.  **Test Contracts**:
    ```bash
    cd contracts
    forge test
    ```

### 3.4 Key Directories
-   `contracts/`: Solidity smart contracts. Example confidential token usually provided.
-   `backend/`: TypeScript scripts/tests using the JS SDK to interact with the chain.


### 4.1 Setup
**Source:** `https://docs.inco.org/js-sdk/existing-project`
-   **Package**: `npm install @inco/js` (or `@inco/lightning` for specific modules)
-   **Initialization**:
    ```typescript
    import { Lightning, getViemChain, supportedChains } from '@inco/js';
    import { createWalletClient, custom } from 'viem';

    // 1. Setup Wallet (Viem)
    const walletClient = createWalletClient({
        chain: getViemChain(supportedChains.baseSepolia),
        transport: custom(window.ethereum!) // In browser
    });

    // 2. Initialize Inco Zap
    const zap = await Lightning.latest('testnet', supportedChains.baseSepolia);
    ```

### 4.2 Encrypting Values (Inputs)
**Source:** `https://docs.inco.org/js-sdk/encryption`
To call a contract function that takes encrypted inputs (`bytes` which become `euint256`, etc.), you must encrypt them off-chain first.

```typescript
import { handleTypes } from '@inco/js';

// Encrypting a uint256
const { ciphertext, signature } = await zap.encrypt(42n, {
    accountAddress: walletClient.account.address,
    dappAddress: "0xContractAddress...",
    handleType: handleTypes.euint256,
});
// 'ciphertext' is what you pass to the contract's `bytes` argument.
```

### 4.3 Attested Decrypt (Reading Private Data)
**Source:** `https://docs.inco.org/js-sdk/attestations/attested-decrypt`
To read an encrypted handle that the user is allowed to access:

```typescript
// 'handle' is the 0x... hex string returned from the contract
const handle = "0x123..."; 

const results = await zap.attestedDecrypt(
    walletClient,
    [handle]
);

const plaintext = results[0].plaintext.value; // e.g. 42n
```

### 4.4 Attested Reveal
**Source:** `https://docs.inco.org/js-sdk/attestations/attested-reveal`
Similar to decrypt, but for handles that are globally revealed by the contract (using `e.reveal()`).

```typescript
const results = await zap.attestedReveal(
    [handle]
);
const plaintext = results[0].plaintext;
```

