import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatPrize(entryFee: bigint, playerCount: bigint): string {
  const totalWei = entryFee * playerCount
  const eth = Number(totalWei) / 1e18
  return eth.toFixed(4)
}
