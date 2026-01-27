import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { CONTRACT_ADDRESS } from '../config/wagmi'
import { COGNUMBERS_ABI } from '../config/contract'

export function useGameIdCounter() {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COGNUMBERS_ABI,
    functionName: 'gameIdCounter',
  })
}

export function useGame(gameId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COGNUMBERS_ABI,
    functionName: 'getGame',
    args: gameId !== undefined ? [gameId] : undefined,
    query: {
      enabled: gameId !== undefined,
    },
  })
}

export function useGamePlayers(gameId: bigint | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COGNUMBERS_ABI,
    functionName: 'getPlayers',
    args: gameId !== undefined ? [gameId] : undefined,
    query: {
      enabled: gameId !== undefined,
    },
  })
}

export function useHasJoined(gameId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COGNUMBERS_ABI,
    functionName: 'hasJoined',
    args: gameId !== undefined && address ? [gameId, address] : undefined,
    query: {
      enabled: gameId !== undefined && !!address,
    },
  })
}

export function useCreateGame() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const createGame = (entryFeeEth: string, durationSeconds: number) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: COGNUMBERS_ABI,
      functionName: 'createGame',
      args: [parseEther(entryFeeEth), BigInt(durationSeconds)],
    })
  }

  return {
    createGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useJoinGame() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const joinGame = (gameId: bigint, encryptedChoice: `0x${string}`, entryFee: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: COGNUMBERS_ABI,
      functionName: 'joinGame',
      args: [gameId, encryptedChoice],
      value: entryFee,
    })
  }

  return {
    joinGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useFinalizeGame() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const finalizeGame = (gameId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: COGNUMBERS_ABI,
      functionName: 'finalizeGame',
      args: [gameId],
    })
  }

  return {
    finalizeGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useResolveWinner() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const resolveWinner = (gameId: bigint, decryptedChoices: bigint[], signatures: `0x${string}`[][]) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: COGNUMBERS_ABI,
      functionName: 'resolveWinner',
      args: [gameId, decryptedChoices, signatures],
    })
  }

  return {
    resolveWinner,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useClaimRefund() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const claimRefund = (gameId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: COGNUMBERS_ABI,
      functionName: 'claimRefund',
      args: [gameId],
    })
  }

  return {
    claimRefund,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useCancelGame() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const cancelGame = (gameId: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: COGNUMBERS_ABI,
      functionName: 'cancelGame',
      args: [gameId],
    })
  }

  return {
    cancelGame,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useCanClaimRefund(gameId: bigint | undefined, address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COGNUMBERS_ABI,
    functionName: 'canClaimRefund',
    args: gameId !== undefined && address ? [gameId, address] : undefined,
    query: {
      enabled: gameId !== undefined && !!address,
    },
  })
}

export function formatEntryFee(entryFee: bigint): string {
  return formatEther(entryFee)
}

export function formatDeadline(deadline: bigint): string {
  const date = new Date(Number(deadline) * 1000)
  return date.toLocaleString()
}

export function isGameExpired(deadline: bigint): boolean {
  return Date.now() > Number(deadline) * 1000
}

export function getTimeRemaining(deadline: bigint): string {
  const now = Date.now()
  const end = Number(deadline) * 1000
  const diff = end - now

  if (diff <= 0) return 'Expired'

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}
