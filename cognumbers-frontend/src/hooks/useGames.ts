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
        // Minimal contract returns simpler struct: {creator, entryFee, deadline, playerCount}
        const r = result as {
          creator: `0x${string}`
          entryFee: bigint
          deadline: bigint
          playerCount: bigint
        }
        // Map to full Game type with defaults for missing fields
        return {
          gameId: BigInt(index),
          creator: r.creator,
          status: 0 as GameStatus, // Default to Open for minimal contract
          entryFee: r.entryFee,
          deadline: r.deadline,
          playerCount: r.playerCount,
          winner: '0x0000000000000000000000000000000000000000' as `0x${string}`,
          winningNumber: 0n,
          prizePool: r.entryFee * r.playerCount, // Calculate prizePool
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
