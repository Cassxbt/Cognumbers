export const COGNUMBERS_ABI = [
  // ============ Constants ============
  {
    type: 'function',
    name: 'MIN_NUMBER',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_NUMBER',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_PLAYERS',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MIN_PLAYERS',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MIN_DURATION',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'MAX_DURATION',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'gameIdCounter',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'incoVerifier',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },

  // ============ Core Functions ============
  {
    type: 'function',
    name: 'createGame',
    inputs: [
      { name: '_entryFee', type: 'uint256' },
      { name: '_durationSeconds', type: 'uint256' },
    ],
    outputs: [{ name: 'gameId', type: 'uint256' }],
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
    name: 'finalizeGame',
    inputs: [{ name: '_gameId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'resolveWinner',
    inputs: [
      { name: '_gameId', type: 'uint256' },
      { name: '_decryptedChoices', type: 'uint256[]' },
      { name: '_signatures', type: 'bytes[][]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimRefund',
    inputs: [{ name: '_gameId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelGame',
    inputs: [{ name: '_gameId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // ============ Admin Functions ============
  {
    type: 'function',
    name: 'pause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'unpause',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'emergencyWithdraw',
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'owner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },

  // ============ View Functions ============
  {
    type: 'function',
    name: 'getGame',
    inputs: [{ name: '_gameId', type: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'gameId', type: 'uint256' },
          { name: 'creator', type: 'address' },
          { name: 'status', type: 'uint8' },
          { name: 'entryFee', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'playerCount', type: 'uint256' },
          { name: 'winner', type: 'address' },
          { name: 'winningNumber', type: 'uint256' },
          { name: 'prizePool', type: 'uint256' },
        ],
      },
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
    name: 'getPlayerChoiceHandle',
    inputs: [
      { name: '_gameId', type: 'uint256' },
      { name: '_player', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'canClaimRefund',
    inputs: [
      { name: '_gameId', type: 'uint256' },
      { name: '_player', type: 'address' },
    ],
    outputs: [{ name: 'canClaim', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getBalance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'games',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'creator', type: 'address' },
      { name: 'status', type: 'uint8' },
      { name: 'entryFee', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'playerCount', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'winningNumber', type: 'uint256' },
      { name: 'prizePool', type: 'uint256' },
    ],
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
  {
    type: 'function',
    name: 'hasClaimedRefund',
    inputs: [
      { name: '', type: 'uint256' },
      { name: '', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },

  // ============ Events ============
  {
    type: 'event',
    name: 'GameCreated',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'creator', type: 'address', indexed: true },
      { name: 'entryFee', type: 'uint256', indexed: false },
      { name: 'deadline', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PlayerJoined',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'playerCount', type: 'uint256', indexed: false },
      { name: 'prizePool', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GameFinalized',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'playerCount', type: 'uint256', indexed: false },
      { name: 'prizePool', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'WinnerDetermined',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'winner', type: 'address', indexed: true },
      { name: 'winningNumber', type: 'uint256', indexed: false },
      { name: 'prize', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'NoWinner',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'playerCount', type: 'uint256', indexed: false },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'GameCancelled',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'cancelledBy', type: 'address', indexed: true },
      { name: 'reason', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RefundClaimed',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'player', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RefundsInitiated',
    inputs: [
      { name: 'gameId', type: 'uint256', indexed: true },
      { name: 'playerCount', type: 'uint256', indexed: false },
      { name: 'totalRefund', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'EmergencyWithdrawal',
    inputs: [
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Paused',
    inputs: [{ name: 'account', type: 'address', indexed: false }],
  },
  {
    type: 'event',
    name: 'Unpaused',
    inputs: [{ name: 'account', type: 'address', indexed: false }],
  },

  // ============ Custom Errors ============
  {
    type: 'error',
    name: 'GameNotOpen',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'currentStatus', type: 'uint8' },
    ],
  },
  {
    type: 'error',
    name: 'GameNotCalculating',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'currentStatus', type: 'uint8' },
    ],
  },
  {
    type: 'error',
    name: 'DeadlineNotPassed',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'currentTime', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'DeadlinePassed',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'currentTime', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'IncorrectEntryFee',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'required', type: 'uint256' },
      { name: 'provided', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'AlreadyJoined',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'player', type: 'address' },
    ],
  },
  {
    type: 'error',
    name: 'GameFull',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'maxPlayers', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'InsufficientPlayers',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'current', type: 'uint256' },
      { name: 'required', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'ChoiceCountMismatch',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'expected', type: 'uint256' },
      { name: 'provided', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'InvalidAttestation',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'playerIndex', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'PrizeTransferFailed',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'winner', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'RefundTransferFailed',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'player', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'RefundAlreadyClaimed',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'player', type: 'address' },
    ],
  },
  {
    type: 'error',
    name: 'NotEligibleForRefund',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'player', type: 'address' },
    ],
  },
  {
    type: 'error',
    name: 'InvalidDuration',
    inputs: [
      { name: 'provided', type: 'uint256' },
      { name: 'min', type: 'uint256' },
      { name: 'max', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'GameNotRefundable',
    inputs: [
      { name: 'gameId', type: 'uint256' },
      { name: 'status', type: 'uint8' },
    ],
  },
] as const
