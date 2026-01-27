import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useGame,
  useGamePlayers,
  useHasJoined,
  useJoinGame,
  useFinalizeGame,
  formatEntryFee,
  getTimeRemaining,
  isGameExpired,
} from '../hooks/useContract'
import { useEncrypt } from '../hooks/useInco'
import { NumberSelector } from '../components/NumberSelector'
import { StatusBadge } from '../components/StatusBadge'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { GameStatus, MAX_PLAYERS } from '../types/game'
import { shortenAddress, formatPrize } from '../lib/utils'

export function GameDetail() {
  const { id } = useParams<{ id: string }>()
  const gameId = id ? BigInt(id) : undefined

  const { address, isConnected } = useAccount()
  const { data: game, isLoading, refetch } = useGame(gameId)
  const { data: players } = useGamePlayers(gameId)
  const { data: hasJoined } = useHasJoined(gameId, address)

  const {
    joinGame,
    isPending: isJoining,
    isConfirming: isJoinConfirming,
    isSuccess: isJoinSuccess,
    error: joinError,
  } = useJoinGame()

  const {
    finalizeGame,
    isPending: isFinalizing,
    isConfirming: isFinalizeConfirming,
    isSuccess: isFinalizeSuccess,
    error: finalizeError,
  } = useFinalizeGame()

  const { encrypt, isEncrypting, error: encryptError } = useEncrypt()

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [encryptionStatus, setEncryptionStatus] = useState<string | null>(null)

  useEffect(() => {
    if (!game) return
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(game.deadline))
    }, 1000)
    return () => clearInterval(interval)
  }, [game])

  useEffect(() => {
    if (isJoinSuccess || isFinalizeSuccess) {
      refetch()
    }
  }, [isJoinSuccess, isFinalizeSuccess, refetch])

  const handleJoin = async () => {
    if (!gameId || !game || selectedNumber === null) return

    setEncryptionStatus('ENCRYPTING NUMBER WITH FHE...')

    try {
      const encryptedChoice = await encrypt(selectedNumber)

      if (!encryptedChoice) {
        setEncryptionStatus('ENCRYPTION FAILED')
        return
      }

      setEncryptionStatus('SUBMITTING TO BLOCKCHAIN...')
      joinGame(gameId, encryptedChoice, game.entryFee)
      setEncryptionStatus(null)
    } catch (err) {
      console.error('Join failed:', err)
      setEncryptionStatus('FAILED TO JOIN')
    }
  }

  const handleFinalize = () => {
    if (!gameId) return
    finalizeGame(gameId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="LOADING GAME..." />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="cyber-card p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4">GAME NOT FOUND</h2>
          <Link to="/games" className="cyber-button inline-block">
            BACK TO GAMES
          </Link>
        </div>
      </div>
    )
  }

  const expired = isGameExpired(game.deadline)
  const canJoin =
    isConnected &&
    !hasJoined &&
    game.status === GameStatus.Open &&
    !expired &&
    Number(game.playerCount) < MAX_PLAYERS
  const canFinalize =
    isConnected &&
    game.status === GameStatus.Open &&
    expired &&
    Number(game.playerCount) > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/games" className="text-slate-400 hover:text-cyan-400 font-mono text-sm">
          &lt; BACK TO GAMES
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="cyber-card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-xs text-slate-500 font-mono mb-1">GAME</div>
                <h1 className="text-4xl font-bold text-white font-['Orbitron']">
                  #{game.gameId.toString().padStart(4, '0')}
                </h1>
              </div>
              <StatusBadge status={game.status as GameStatus} />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-slate-500 font-mono mb-1">ENTRY FEE</div>
                <div className="text-2xl text-cyan-400 font-mono">
                  {formatEntryFee(game.entryFee)} ETH
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 font-mono mb-1">PRIZE POOL</div>
                <div className="text-2xl text-green-400 font-mono">
                  {formatPrize(game.entryFee, game.playerCount)} ETH
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-700">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-xs text-slate-500 font-mono mb-2">PLAYERS</div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400/50 to-cyan-400 transition-all duration-500"
                        style={{ width: `${(Number(game.playerCount) / MAX_PLAYERS) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-mono text-lg">
                      {game.playerCount.toString()}/{MAX_PLAYERS}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-mono mb-2">TIME REMAINING</div>
                  <div className={`text-2xl font-mono ${expired ? 'text-red-400' : 'text-white'}`}>
                    {game.status === GameStatus.Open ? timeRemaining || getTimeRemaining(game.deadline) : '--:--'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {game.status === GameStatus.Open && canJoin && (
            <div className="cyber-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 font-['Orbitron']">
                JOIN GAME
              </h2>

              <NumberSelector
                selected={selectedNumber}
                onSelect={setSelectedNumber}
                disabled={isJoining || isJoinConfirming || isEncrypting}
              />

              {encryptionStatus && (
                <div className="mt-4 p-3 border border-cyan-500/50 bg-cyan-500/10 text-cyan-400 text-sm font-mono flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  {encryptionStatus}
                </div>
              )}

              {(joinError || encryptError) && (
                <div className="mt-4 p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-mono">
                  ERROR: {joinError?.message || encryptError?.message}
                </div>
              )}

              {isJoinSuccess && (
                <div className="mt-4 p-3 border border-green-500/50 bg-green-500/10 text-green-400 text-sm font-mono">
                  SUCCESSFULLY JOINED!
                </div>
              )}

              <button
                onClick={handleJoin}
                disabled={!selectedNumber || isJoining || isJoinConfirming || isEncrypting}
                className="cyber-button w-full mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEncrypting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    ENCRYPTING...
                  </span>
                ) : isJoining || isJoinConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    {isJoining ? 'CONFIRM IN WALLET...' : 'JOINING...'}
                  </span>
                ) : (
                  `JOIN FOR ${formatEntryFee(game.entryFee)} ETH`
                )}
              </button>
            </div>
          )}

          {hasJoined && game.status === GameStatus.Open && (
            <div className="cyber-card p-6">
              <div className="flex items-center gap-3 text-green-400">
                <div className="w-3 h-3 bg-green-400 animate-pulse" />
                <span className="font-mono">YOU HAVE JOINED THIS GAME</span>
              </div>
              <p className="text-slate-400 font-mono text-sm mt-2">
                Your number is encrypted. Wait for the game to end to see results.
              </p>
            </div>
          )}

          {canFinalize && (
            <div className="cyber-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 font-['Orbitron']">
                FINALIZE GAME
              </h2>
              <p className="text-slate-400 font-mono text-sm mb-4">
                Game deadline has passed. Finalize to begin winner calculation.
              </p>

              {finalizeError && (
                <div className="mb-4 p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-mono">
                  ERROR: {finalizeError.message}
                </div>
              )}

              <button
                onClick={handleFinalize}
                disabled={isFinalizing || isFinalizeConfirming}
                className="cyber-button w-full"
              >
                {isFinalizing || isFinalizeConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    FINALIZING...
                  </span>
                ) : (
                  'FINALIZE GAME'
                )}
              </button>
            </div>
          )}

          {game.status === GameStatus.Finished && (
            <div className="cyber-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 font-['Orbitron']">
                GAME RESULTS
              </h2>
              {game.winner !== '0x0000000000000000000000000000000000000000' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-green-500/30 bg-green-500/5">
                    <div>
                      <div className="text-xs text-slate-500 font-mono mb-1">WINNER</div>
                      <div className="text-green-400 font-mono">
                        {shortenAddress(game.winner)}
                        {game.winner === address && (
                          <span className="ml-2 text-yellow-400">(YOU!)</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-500 font-mono mb-1">WINNING NUMBER</div>
                      <div className="text-3xl font-bold text-yellow-400 font-['Orbitron']">
                        {game.winningNumber.toString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-slate-500 font-mono mb-1">PRIZE WON</div>
                    <div className="text-2xl text-green-400 font-mono">
                      {formatPrize(game.entryFee, game.playerCount)} ETH
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-slate-400 font-mono">
                  NO WINNER - NO UNIQUE NUMBER FOUND
                </div>
              )}
            </div>
          )}

          {!isConnected && game.status === GameStatus.Open && (
            <div className="cyber-card p-6 text-center">
              <p className="text-slate-400 font-mono mb-4">CONNECT WALLET TO JOIN</p>
              <ConnectButton />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="cyber-card p-6">
            <h3 className="text-sm font-bold text-white mb-4 font-mono">PLAYERS ({game.playerCount.toString()})</h3>
            {players && players.length > 0 ? (
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div
                    key={player}
                    className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                  >
                    <span className="text-slate-500 font-mono text-xs">#{index + 1}</span>
                    <span className={`font-mono text-sm ${player === address ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {shortenAddress(player)}
                      {player === address && ' (YOU)'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 font-mono text-sm">NO PLAYERS YET</p>
            )}
          </div>

          <div className="cyber-card p-6">
            <h3 className="text-sm font-bold text-white mb-4 font-mono">GAME INFO</h3>
            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">CREATOR</span>
                <span className="text-slate-400">{shortenAddress(game.creator)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NETWORK</span>
                <span className="text-slate-400">BASE SEPOLIA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">NUMBER RANGE</span>
                <span className="text-slate-400">1 - 10</span>
              </div>
            </div>
          </div>

          <div className="cyber-card p-6">
            <h3 className="text-sm font-bold text-white mb-4 font-mono">HOW TO WIN</h3>
            <p className="text-slate-400 font-mono text-xs leading-relaxed">
              Choose a number from 1-10. The winner is the player who picks
              the MINIMUM UNIQUE number. If multiple players pick the same
              number, it's not unique. The smallest number that only one
              person picked wins.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
