import { useEffect, useState } from 'react'
import { useReadContracts, useWatchContractEvent } from 'wagmi'
import { CONTRACT_ADDRESS } from '../config/wagmi'
import { COGNUMBERS_ABI } from '../config/contract'
import type { Game, GameStatus } from '../types/game'

export function useAllGames() {
  const [games, setGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const { data: gameIdCounter, refetch: refetchCounter } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: COGNUMBERS_ABI,
        functionName: 'gameIdCounter',
      },
    ],
  })

  useEffect(() => {
    async function fetchGames() {
      if (!gameIdCounter?.[0]?.result) {
        setIsLoading(false)
        return
      }

      const totalGames = Number(gameIdCounter[0].result)
      if (totalGames === 0) {
        setGames([])
        setIsLoading(false)
        return
      }

      const gameIds = Array.from({ length: totalGames }, (_, i) => BigInt(i))
      const contracts = gameIds.map((id) => ({
        address: CONTRACT_ADDRESS as `0x${string}`,
        abi: COGNUMBERS_ABI,
        functionName: 'getGame' as const,
        args: [id] as const,
      }))

      try {
        const results = await Promise.all(
          contracts.map(async (contract) => {
            const response = await fetch(
              'https://sepolia.base.org',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  method: 'eth_call',
                  params: [
                    {
                      to: contract.address,
                      data: encodeGetGame(contract.args[0]),
                    },
                    'latest',
                  ],
                  id: 1,
                }),
              }
            )
            return response.json()
          })
        )

        const gamesData: Game[] = results
          .filter((r) => r.result && r.result !== '0x')
          .map((r, index) => decodeGame(r.result, BigInt(index)))

        setGames(gamesData.reverse())
      } catch (error) {
        console.error('Failed to fetch games:', error)
      }

      setIsLoading(false)
    }

    fetchGames()
  }, [gameIdCounter])

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

function encodeGetGame(gameId: bigint): string {
  const selector = '0x08b90c80'
  const paddedId = gameId.toString(16).padStart(64, '0')
  return selector + paddedId
}

function decodeGame(hexData: string, gameId: bigint): Game {
  const data = hexData.slice(2)
  const chunkSize = 64

  return {
    gameId,
    creator: ('0x' + data.slice(1 * chunkSize + 24, 2 * chunkSize)) as `0x${string}`,
    status: parseInt(data.slice(2 * chunkSize, 3 * chunkSize), 16) as GameStatus,
    entryFee: BigInt('0x' + data.slice(3 * chunkSize, 4 * chunkSize)),
    deadline: BigInt('0x' + data.slice(4 * chunkSize, 5 * chunkSize)),
    playerCount: BigInt('0x' + data.slice(5 * chunkSize, 6 * chunkSize)),
    winner: ('0x' + data.slice(6 * chunkSize + 24, 7 * chunkSize)) as `0x${string}`,
    winningNumber: BigInt('0x' + data.slice(7 * chunkSize, 8 * chunkSize)),
  }
}
