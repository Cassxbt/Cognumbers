import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Privacy-focused address shortening
// Default: 0x12...5678 (2 chars after 0x + last 4) - balanced privacy
// For leaderboard use startChars=2, endChars=3 for more privacy
export function shortenAddress(
  address: string,
  startChars = 2,
  endChars = 4
): string {
  if (!address || address.length < 10) return address
  return `${address.slice(0, startChars + 2)}...${address.slice(-endChars)}`
}

// Extra private version for leaderboards - shows minimal identifiable info
export function maskAddress(address: string): string {
  if (!address || address.length < 10) return address
  // Show only: 0x + 2 chars + •••• + 2 chars = minimal OSINT surface
  return `${address.slice(0, 4)}••••${address.slice(-2)}`
}

export function formatPrize(entryFee: bigint, playerCount: bigint): string {
  const totalWei = entryFee * playerCount
  const eth = Number(totalWei) / 1e18
  return eth.toFixed(4)
}
