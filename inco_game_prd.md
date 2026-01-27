# PRD: Build Number Verse Arena on Inco (Step-by-Step)

## Project Overview
Recreate "Number Verse Arena" as a privacy-preserving game on the Inco Network. Players submit encrypted numbers, and the contract determines the "Unique Minimum Number" winner without revealing choices during gameplay.

## Step 1: Smart Contract Setup (Solidity)
**Goal**: Create `UniqueGame.sol` using `@inco/lightning`.

1.  **Project Initialization**:
    *   Initialize a Foundry project using the Inco [Lightning Rod](https://github.com/Inco-fhevm/lightning-rod) template.
    *   Install `@inco/lightning` contracts.
2.  **Define Game State**:
    *   `mapping (address => euint32) private playerSubmissions;`
    *   `mapping (uint32 => euint32) private numberCounts;`
    *   `address[] public players;`
3.  **Implement `joinGame(bytes calldata encryptedInput)`**:
    *   Validate entry fee.
    *   Construct `euint32 choice = encryptedInput.newEuint32(msg.sender);`.
    *   Update `numberCounts` for the entire range (1-max) using `eq`, `select`, and `add`.
    *   Store `choice` and `choice.allowThis()`.
4.  **Implement `finalizeGame()`**:
    *   Mark game status as `Calculating`.
    *   Emit an event with the `handles` of all player submissions.
5.  **Implement `resolveWinner(DecryptionAttestation[] memory attestations, bytes[] memory signatures)`**:
    *   Verify each attestation using `inco.incoVerifier().isValidDecryptionAttestation(...)`.
    *   Verify attestation handles match player submissions.
    *   Calculate the unique minimum winner in the clear (post-decryption).
    *   Distribute prize pool.

## Step 2: Frontend Integration (JS SDK)
**Goal**: Build a React interface that handles Inco encryption and attestation.

1.  **Initialize Inco SDK**:
    ```typescript
    const zap = await Lightning.latest('testnet', supportedChains.inco);
    ```
2.  **Encryption Flow**:
    *   When a player selects "7", call `zap.encrypt(7n, { ... accountAddress, dappAddress, handleType: euint32 })`.
    *   Call the contract's `joinGame` with the resulting `ciphertext`.
3.  **Resolution Logic**:
    *   Listen for `Calculating` status.
    *   Call `zap.attestedDecrypt(walletClient, handles)` to get signed plaintexts.
    *   Submit the signatures to the contract's `resolveWinner`.

## Step 3: Local Testing
1.  **Docker**: Run `docker compose up` from Lightning Rod to start a local Inco node.
2.  **Foundry Tests**: Write tests that simulate multiple players joining and the final resolution. Use `e.reveal()` in tests for quick debugging, then switch to Attested flows for "production-like" verification.

## Step 4: Deployment
1.  **Contract**: Deploy `UniqueGame.sol` to Inco Gentry Testnet.
2.  **Frontend**: Deploy the React app (Vite) to Vercel/Netlify.
3.  **Config**: Update contract addresses and RPC URLs.

## Success Criteria
- [ ] No player can see others' numbers before the game ends.
- [ ] The contract correctly identifies the minimum unique number.
- [ ] Prize is automatically available to the winner.
