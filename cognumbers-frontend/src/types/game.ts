export const GameStatus = {
  Open: 0,
  Calculating: 1,
  Finished: 2,
  Cancelled: 3,
  Refunded: 4,
} as const

export type GameStatus = typeof GameStatus[keyof typeof GameStatus]

export interface Game {
  gameId: bigint
  creator: `0x${string}`
  status: GameStatus
  entryFee: bigint
  deadline: bigint
  playerCount: bigint
  winner: `0x${string}`
  winningNumber: bigint
  prizePool: bigint
}

export interface GameWithPlayers extends Game {
  players: `0x${string}`[]
}

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  [GameStatus.Open]: 'OPEN',
  [GameStatus.Calculating]: 'CALCULATING',
  [GameStatus.Finished]: 'FINISHED',
  [GameStatus.Cancelled]: 'CANCELLED',
  [GameStatus.Refunded]: 'REFUNDED',
}

export const MIN_NUMBER = 1
export const MAX_NUMBER = 10
export const MAX_PLAYERS = 10
export const MIN_PLAYERS = 2
