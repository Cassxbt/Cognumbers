// ABI for CognumbersMinimal test contract
export const COGNUMBERS_MINIMAL_ABI = [
  // Functions
  {
    type: 'function',
    name: 'gameIdCounter',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'createGame',
    inputs: [
      { name: '_entryFee', type: 'uint256' },
      { name: '_durationSeconds', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'joinGame',
    inputs: [
      { name: '_gameId', type: 'uint256' },
      { name: '_encryptedChoice', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'testEncrypt',
    inputs: [{ name: '_encryptedData', type: 'bytes' }],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getGame',
    inputs: [{ name: '_gameId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'creator', type: 'address' },
          { name: 'entryFee', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'playerCount', type: 'uint256' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'games',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'creator', type: 'address' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'playerCount', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlayers',
    inputs: [{ name: '_gameId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address[]' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getPlayerHandle',
    inputs: [
      { name: '_gameId', type: 'uint256' },
      { name: '_player', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'hasJoined',
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },

  // Events
  {
    type: 'event',
    name: 'GameCreated',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: false },
      { name: 'entryFee', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PlayerJoined',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: false },
      { name: 'handle', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'EncryptionSuccess',
    inputs: [
      { name: 'user', type: 'address', indexed: false },
      { name: 'handle', type: 'bytes32', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'DebugStep',
    inputs: [
      { name: 'step', type: 'string', indexed: false },
      { name: 'value', type: 'uint256', indexed: false },
    ],
  },

  // Errors
  {
    type: 'error',
    name: 'GameNotOpen',
    inputs: [],
  },
  {
    type: 'error',
    name: 'DeadlinePassed',
    inputs: [],
  },
  {
    type: 'error',
    name: 'AlreadyJoined',
    inputs: [],
  },
  {
    type: 'error',
    name: 'InsufficientFee',
    inputs: [],
  },
] as const
