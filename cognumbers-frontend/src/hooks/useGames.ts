import { useEffect, useState, useCallback } from 'react'
import { useReadContract, useWatchContractEvent, usePublicClient } from 'wagmi'
import { CONTRACT_ADDRESS } from '../config/wagmi'
import { COGNUMBERS_ABI } from '../config/contract'
import type { Game, GameStatus } from '../types/game'

export function useAllGames() {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const publicClient = usePublicClient()

  const { data: gameIdCounter, refetch: refetchCounter } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: COGNUMBERS_ABI,
    functionName: 'gameIdCounter',
  })

  const fetchGames = useCallback(async () => {
    if (gameIdCounter === undefined || !publicClient) {
      setIsLoading(false)
      return
    }

    const totalGames = Number(gameIdCounter)
    if (totalGames === 0) {
      setGames([])
      setIsLoading(false)
      return
    }

    try {
      const gamePromises = Array.from({ length: totalGames }, (_, i) =>
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: COGNUMBERS_ABI,
          functionName: 'getGame',
          args: [BigInt(i)],
        })
      )

      const results = await Promise.all(gamePromises)

      const gamesData: Game[] = results.map((result, index) => {
        const r = result as {
          gameId: bigint
          creator: `0x${string}`
          status: number
          entryFee: bigint
          deadline: bigint
          playerCount: bigint
          winner: `0x${string}`
          winningNumber: bigint
          prizePool: bigint
        }
        return {
          gameId: BigInt(index),
          creator: r.creator,
          status: r.status as GameStatus,
          entryFee: r.entryFee,
          deadline: r.deadline,
          playerCount: r.playerCount,
          winner: r.winner,
          winningNumber: r.winningNumber,
          prizePool: r.prizePool,
        }
      })

      setGames(gamesData.reverse())
    } catch (error) {
      console.error('Failed to fetch games:', error)
    }

    setIsLoading(false)
  }, [gameIdCounter, publicClient])

  useEffect(() => {
    fetchGames()
  }, [fetchGames])

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: COGNUMBERS_ABI,
    eventName: 'GameCreated',
    onLogs: () => {
      refetchCounter()
    },
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: COGNUMBERS_ABI,
    eventName: 'PlayerJoined',
    onLogs: () => {
      refetchCounter()
    },
  })

  return { games, isLoading, refetch: refetchCounter }
}
