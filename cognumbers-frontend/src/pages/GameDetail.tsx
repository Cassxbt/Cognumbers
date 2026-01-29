import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  useGame,
  useGamePlayers,
  useHasJoined,
  useJoinGame,
  useFinalizeGame,
  useResolveWinner,
  usePlayerChoiceHandles,
  formatEntryFee,
  getTimeRemaining,
  isGameExpired,
} from '../hooks/useContract'
import { useEncrypt, useReveal } from '../hooks/useInco'
import { NumberSelector } from '../components/NumberSelector'
import { StatusBadge } from '../components/StatusBadge'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { GameStatus, MAX_PLAYERS } from '../types/game'
import { shortenAddress, formatPrize } from '../lib/utils'

// Calculate winner using minimum unique number rule
function calculateWinner(choices: { player: string; choice: bigint }[]): {
  winnerAddress: string | null
  winningNumber: bigint | null
} {
  if (choices.length === 0) return { winnerAddress: null, winningNumber: null }

  // Count occurrences of each number
  const counts = new Map<string, number>()
  for (const { choice } of choices) {
    const key = choice.toString()
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  // Find unique numbers (count === 1) and get the minimum
  let minUnique: bigint | null = null
  let winner: string | null = null

  for (const { player, choice } of choices) {
    const count = counts.get(choice.toString()) || 0
    if (count === 1) {
      if (minUnique === null || choice < minUnique) {
        minUnique = choice
        winner = player
      }
    }
  }

  return { winnerAddress: winner, winningNumber: minUnique }
}

export function GameDetail() {
  const { id } = useParams<{ id: string }>()
  const gameId = id ? BigInt(id) : undefined

  const { address, isConnected } = useAccount()
  const { data: game, isLoading, refetch } = useGame(gameId)
  const { data: players } = useGamePlayers(gameId)
  const { data: hasJoined } = useHasJoined(gameId, address)

  const {
    joinGame,
    hash: joinHash,
    isPending: isJoining,
    isConfirming: isJoinConfirming,
    isSuccess: isJoinSuccess,
    isReverted: isJoinReverted,
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
  const { reveal, isRevealing, error: revealError } = useReveal()
  const { fetchHandles, isLoading: isFetchingHandles } = usePlayerChoiceHandles()
  const {
    resolveWinner,
    hash: resolveHash,
    isPending: isResolving,
    isConfirming: isResolveConfirming,
    isSuccess: isResolveSuccess,
    error: resolveError,
  } = useResolveWinner()

  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [encryptionStatus, setEncryptionStatus] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [resolutionStatus, setResolutionStatus] = useState<string | null>(null)
  const [revealedChoices, setRevealedChoices] = useState<{ player: string; choice: bigint }[] | null>(null)

  // Calculate winner from revealed choices
  const calculatedWinner = useMemo(() => {
    if (!revealedChoices) return { winnerAddress: null, winningNumber: null }
    return calculateWinner(revealedChoices)
  }, [revealedChoices])

  const handleShare = useCallback(() => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  useEffect(() => {
    if (!game) return
    const interval = setInterval(() => {
      setTimeRemaining(getTimeRemaining(game.deadline))
    }, 1000)
    return () => clearInterval(interval)
  }, [game])

  useEffect(() => {
    if (isJoinSuccess) {
      console.log('[GameDetail] Join successful! Refetching game data...')
      setEncryptionStatus(null)
      refetch()
    }
    if (isFinalizeSuccess) {
      console.log('[GameDetail] Finalize successful! Refetching game data...')
      refetch()
    }
  }, [isJoinSuccess, isFinalizeSuccess, refetch])

  // Handle join error or reverted transaction
  useEffect(() => {
    if (joinError) {
      console.error('[GameDetail] Join error:', joinError)
      setEncryptionStatus(null)
    }
    if (isJoinReverted) {
      console.error('[GameDetail] Transaction reverted on-chain!')
      setEncryptionStatus(null)
    }
  }, [joinError, isJoinReverted])

  const handleJoin = async () => {
    if (gameId === undefined || !game || selectedNumber === null) {
      console.log('[JOIN] Missing data:', { gameId, game: !!game, selectedNumber })
      return
    }

    // Check deadline before proceeding - add 30 second buffer for tx to be mined
    const nowSeconds = Math.floor(Date.now() / 1000)
    const deadlineSeconds = Number(game.deadline)
    const timeUntilDeadline = deadlineSeconds - nowSeconds

    console.log('[JOIN] Deadline check:', {
      now: nowSeconds,
      deadline: deadlineSeconds,
      timeUntilDeadline,
    })

    if (timeUntilDeadline < 30) {
      setEncryptionStatus('GAME DEADLINE TOO CLOSE - CANNOT JOIN')
      console.error('[JOIN] Deadline too close, need at least 30 seconds buffer')
      return
    }

    console.log('[JOIN] Starting join process for game', gameId.toString(), 'with number', selectedNumber)
    setEncryptionStatus('ENCRYPTING NUMBER WITH FHE...')

    try {
      console.log('[JOIN] Calling encrypt with value:', selectedNumber)
      const encryptedChoice = await encrypt(selectedNumber)
      console.log('[JOIN] Encrypt result:', encryptedChoice)

      if (!encryptedChoice) {
        console.error('[JOIN] Encryption returned null/undefined')
        setEncryptionStatus('ENCRYPTION FAILED')
        return
      }

      console.log('[JOIN] Encrypted choice length:', encryptedChoice.length)
      console.log('[JOIN] Entry fee:', game.entryFee.toString())

      setEncryptionStatus('SUBMITTING TO BLOCKCHAIN...')
      console.log('[JOIN] Calling joinGame with:', {
        gameId: gameId.toString(),
        encryptedChoicePreview: encryptedChoice.slice(0, 66) + '...',
        entryFee: game.entryFee.toString(),
      })

      joinGame(gameId, encryptedChoice, game.entryFee)
      // Don't clear status - let the isPending/isConfirming/isSuccess states handle UI
      console.log('[JOIN] joinGame called, waiting for wallet confirmation...')
    } catch (err) {
      console.error('[JOIN] Error during join:', err)
      setEncryptionStatus('FAILED TO JOIN: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  const handleFinalize = () => {
    if (!gameId) return
    finalizeGame(gameId)
  }

  const handleResolve = async () => {
    if (!gameId || !players || players.length === 0) {
      console.log('[RESOLVE] Missing data:', { gameId, players })
      return
    }

    try {
      setResolutionStatus('FETCHING PLAYER HANDLES...')
      console.log('[RESOLVE] Starting resolution for game', gameId.toString())

      // Step 1: Fetch all player choice handles
      const handles = await fetchHandles(gameId, players as `0x${string}`[])
      console.log('[RESOLVE] Got handles:', handles)

      if (handles.length === 0 || handles.some(h => h === '0x0000000000000000000000000000000000000000000000000000000000000000')) {
        setResolutionStatus('ERROR: Could not fetch player handles')
        return
      }

      // Step 2: Reveal all handles (get decrypted values + signatures)
      setResolutionStatus('DECRYPTING CHOICES WITH ATTESTATION...')
      const results = await reveal(handles)

      if (!results || results.length !== players.length) {
        setResolutionStatus('ERROR: Decryption failed')
        return
      }

      console.log('[RESOLVE] Revealed values:', results)

      // Show the revealed choices
      const revealed = results.map((r, i) => ({
        player: players[i],
        choice: r.value,
      }))
      setRevealedChoices(revealed)

      // Step 3: Prepare data for contract call
      const decryptedChoices = results.map(r => r.value)
      const signatures = results.map(r => r.signatures)

      console.log('[RESOLVE] Calling resolveWinner with:', {
        gameId: gameId.toString(),
        choices: decryptedChoices.map(c => c.toString()),
        signaturesCount: signatures.map(s => s.length),
      })

      // Step 4: Call resolveWinner on contract
      setResolutionStatus('SUBMITTING TO BLOCKCHAIN...')
      resolveWinner(gameId, decryptedChoices, signatures)

    } catch (err) {
      console.error('[RESOLVE] Error:', err)
      setResolutionStatus('ERROR: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  // Clear resolution status on success
  useEffect(() => {
    if (isResolveSuccess) {
      setResolutionStatus(null)
      refetch()
    }
  }, [isResolveSuccess, refetch])

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
  // Minimal contract: status defaults to 0 (Open), use gameId from URL
  const gameStatus = (game as { status?: number }).status ?? GameStatus.Open
  const canJoin =
    isConnected &&
    !hasJoined &&
    gameStatus === GameStatus.Open &&
    !expired &&
    Number(game.playerCount) < MAX_PLAYERS
  const canFinalize =
    isConnected &&
    gameStatus === GameStatus.Open &&
    expired &&
    Number(game.playerCount) > 0

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
      <div className="mb-4 md:mb-6">
        <Link to="/games" className="text-slate-400 hover:text-cyan-400 font-mono text-xs md:text-sm">
          &lt; BACK TO GAMES
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Game header card */}
          <div className="cyber-card p-4 md:p-6">
            {/* Header row */}
            <div className="flex items-start justify-between mb-4 md:mb-6">
              <div>
                <div className="text-[10px] md:text-xs text-slate-500 font-mono mb-1">GAME</div>
                <h1 className="text-2xl md:text-4xl font-bold text-white font-['Orbitron']">
                  #{(gameId ?? 0n).toString().padStart(4, '0')}
                </h1>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={handleShare}
                  className="px-2 md:px-3 py-1 md:py-1.5 border border-slate-600 hover:border-cyan-400 text-slate-400 hover:text-cyan-400 font-mono text-[10px] md:text-xs transition-colors"
                >
                  {copied ? 'COPIED!' : 'SHARE'}
                </button>
                <StatusBadge status={gameStatus as GameStatus} />
              </div>
            </div>

            {/* Entry fee & Prize - responsive grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-6">
              <div className="p-2 md:p-0 bg-slate-800/30 md:bg-transparent border border-slate-700 md:border-0">
                <div className="text-[10px] md:text-xs text-slate-500 font-mono mb-1">ENTRY FEE</div>
                <div className="text-lg md:text-2xl text-cyan-400 font-mono">
                  {formatEntryFee(game.entryFee)} <span className="text-sm md:text-xl">ETH</span>
                </div>
              </div>
              <div className="p-2 md:p-0 bg-slate-800/30 md:bg-transparent border border-slate-700 md:border-0">
                <div className="text-[10px] md:text-xs text-slate-500 font-mono mb-1">PRIZE POOL</div>
                <div className="text-lg md:text-2xl text-green-400 font-mono">
                  {formatPrize(game.entryFee, game.playerCount)} <span className="text-sm md:text-xl">ETH</span>
                </div>
              </div>
            </div>

            {/* Players & Time - responsive grid */}
            <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700">
              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div>
                  <div className="text-[10px] md:text-xs text-slate-500 font-mono mb-2">PLAYERS</div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="flex-1 h-2 md:h-3 bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400/50 to-cyan-400 transition-all duration-500"
                        style={{ width: `${(Number(game.playerCount) / MAX_PLAYERS) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-mono text-sm md:text-lg">
                      {game.playerCount.toString()}/{MAX_PLAYERS}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] md:text-xs text-slate-500 font-mono mb-2">TIME REMAINING</div>
                  <div className={`text-lg md:text-2xl font-mono ${expired ? 'text-red-400' : 'text-white'}`}>
                    {gameStatus === GameStatus.Open ? timeRemaining || getTimeRemaining(game.deadline) : '--:--'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {gameStatus === GameStatus.Open && canJoin && (
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

              {(joinError || encryptError || isJoinReverted) && (
                <div className="mt-4 p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-mono">
                  ERROR: {isJoinReverted
                    ? 'Transaction reverted! The game may have expired or you already joined.'
                    : (joinError?.message || encryptError?.message)}
                </div>
              )}

              {isJoinSuccess && (
                <div className="mt-4 p-4 border border-green-500/50 bg-green-500/10">
                  <div className="text-green-400 text-sm font-mono font-bold mb-2">
                    SUCCESSFULLY JOINED!
                  </div>
                  <div className="text-green-300 text-xs font-mono">
                    Your number is encrypted on-chain. Nobody can see it until the game ends.
                  </div>
                  {joinHash && (
                    <div className="mt-3 pt-3 border-t border-green-500/30">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="text-xs text-slate-500 font-mono">ENCRYPTED TX:</span>
                        <a
                          href={`https://sepolia.basescan.org/tx/${joinHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                        >
                          {joinHash.slice(0, 10)}...{joinHash.slice(-6)}
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono mt-1">
                        View input data to see encrypted ciphertext
                      </p>
                    </div>
                  )}
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

          {hasJoined && gameStatus === GameStatus.Open && (
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

          {gameStatus === GameStatus.Finished && game.winner !== '0x0000000000000000000000000000000000000000' && (
            <div className="cyber-card p-6 border-green-500/50 bg-gradient-to-b from-green-500/5 to-transparent">
              {/* Header with trophy */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-green-400 font-['Orbitron']">
                    WINNER
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">Prize claimed on-chain</p>
                </div>
              </div>

              {/* Winner details */}
              <div className="space-y-4">
                <div className="p-3 bg-slate-800/50 border border-slate-700">
                  <div className="text-xs text-slate-500 font-mono mb-1">WINNER ADDRESS</div>
                  <div className={`font-mono text-lg ${game.winner === address ? 'text-green-400' : 'text-white'}`}>
                    {shortenAddress(game.winner)}
                    {game.winner === address && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-green-500/20 border border-green-500/30 text-green-400">
                        YOU WON!
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-800/50 border border-slate-700 text-center">
                    <div className="text-xs text-slate-500 font-mono mb-1">WINNING NUMBER</div>
                    <div className="text-3xl text-cyan-400 font-mono font-bold">{game.winningNumber.toString()}</div>
                  </div>
                  <div className="p-3 bg-slate-800/50 border border-slate-700 text-center">
                    <div className="text-xs text-slate-500 font-mono mb-1">PRIZE WON</div>
                    <div className="text-2xl text-green-400 font-mono font-bold">{formatPrize(game.entryFee, game.playerCount)}</div>
                    <div className="text-xs text-slate-500 font-mono">ETH</div>
                  </div>
                </div>

                {/* Transaction verification link */}
                {resolveHash && (
                  <div className="pt-3 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-mono">TRANSACTION</span>
                      <a
                        href={`https://sepolia.basescan.org/tx/${resolveHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
                      >
                        {resolveHash.slice(0, 10)}...{resolveHash.slice(-6)}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {gameStatus === GameStatus.Calculating && (
            <div className="cyber-card p-6 border-yellow-500/50">
              <h2 className="text-lg font-bold text-yellow-400 mb-4 font-['Orbitron']">
                RESOLVE WINNER
              </h2>
              <p className="text-slate-400 font-mono text-sm mb-4">
                Game finalized. Decrypt choices and determine the winner.
              </p>

              {revealedChoices && (
                <div className="mb-4 p-3 border border-cyan-500/30 bg-cyan-500/5">
                  <div className="text-xs text-slate-500 font-mono mb-2">REVEALED CHOICES:</div>
                  <div className="space-y-2">
                    {revealedChoices.map((rc, i) => {
                      const isWinner = calculatedWinner.winnerAddress === rc.player
                      return (
                        <div
                          key={i}
                          className={`flex justify-between items-center text-sm font-mono p-2 ${
                            isWinner
                              ? 'border border-green-500/50 bg-green-500/10'
                              : 'border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {isWinner && (
                              <span className="text-green-400 text-xs">★</span>
                            )}
                            <span className={isWinner ? 'text-green-400' : 'text-slate-400'}>
                              {shortenAddress(rc.player as `0x${string}`)}
                              {rc.player === address && ' (YOU)'}
                            </span>
                          </div>
                          <span className={isWinner ? 'text-green-400 font-bold' : 'text-cyan-400'}>
                            {rc.choice.toString()}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {calculatedWinner.winnerAddress && (
                    <div className="mt-3 pt-3 border-t border-cyan-500/30">
                      <div className="text-xs text-green-400 font-mono">
                        WINNER: {shortenAddress(calculatedWinner.winnerAddress as `0x${string}`)}
                        {calculatedWinner.winnerAddress === address && ' (YOU!)'}
                        {' '}with number {calculatedWinner.winningNumber?.toString()}
                      </div>
                    </div>
                  )}
                  {!calculatedWinner.winnerAddress && revealedChoices.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-cyan-500/30">
                      <div className="text-xs text-yellow-400 font-mono">
                        NO WINNER - No unique numbers found
                      </div>
                    </div>
                  )}
                </div>
              )}

              {resolutionStatus && (
                <div className="mb-4 p-3 border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-sm font-mono flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  {resolutionStatus}
                </div>
              )}

              {(resolveError || revealError) && (
                <div className="mb-4 p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-mono">
                  ERROR: {resolveError?.message || revealError?.message}
                </div>
              )}

              {isResolveSuccess && (
                <div className="mb-4 p-4 border border-green-500/50 bg-green-500/10">
                  <div className="text-green-400 text-sm font-mono font-bold mb-2">
                    WINNER RESOLVED SUCCESSFULLY!
                  </div>
                  {calculatedWinner.winnerAddress ? (
                    <div className="text-green-300 text-xs font-mono space-y-1">
                      <div>
                        {shortenAddress(calculatedWinner.winnerAddress as `0x${string}`)}
                        {calculatedWinner.winnerAddress === address && ' (YOU!)'}
                        {' '}wins with number {calculatedWinner.winningNumber?.toString()}!
                      </div>
                      <div className="text-slate-400">Prize transferred on-chain.</div>
                      {resolveHash && (
                        <div className="pt-2 border-t border-green-500/30">
                          <span className="text-slate-500">TX: </span>
                          <a
                            href={`https://sepolia.basescan.org/tx/${resolveHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 underline"
                          >
                            {resolveHash.slice(0, 10)}...{resolveHash.slice(-8)}
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-yellow-400 text-xs font-mono">
                      No winner - all numbers were duplicated. Prize returned to players.
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleResolve}
                disabled={isRevealing || isFetchingHandles || isResolving || isResolveConfirming}
                className="cyber-button w-full"
              >
                {isRevealing || isFetchingHandles ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    DECRYPTING...
                  </span>
                ) : isResolving || isResolveConfirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    RESOLVING...
                  </span>
                ) : (
                  'RESOLVE WINNER'
                )}
              </button>
            </div>
          )}

          {gameStatus === GameStatus.Cancelled && (
            <div className="cyber-card p-6 border-red-500/50">
              <h2 className="text-lg font-bold text-red-400 mb-2 font-['Orbitron']">
                GAME CANCELLED
              </h2>
              <p className="text-slate-400 font-mono text-sm">
                This game was cancelled. Players can claim refunds.
              </p>
            </div>
          )}

          {!isConnected && gameStatus === GameStatus.Open && (
            <div className="cyber-card p-6 text-center">
              <p className="text-slate-400 font-mono mb-4">CONNECT WALLET TO JOIN</p>
              <ConnectButton />
            </div>
          )}
        </div>

        {/* Sidebar - collapses to horizontal cards on mobile */}
        <div className="space-y-4 md:space-y-6">
          {/* Players list */}
          <div className="cyber-card p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-bold text-white mb-3 md:mb-4 font-mono">
              PLAYERS ({game.playerCount.toString()})
            </h3>
            {players && players.length > 0 ? (
              <div className="space-y-1 md:space-y-2 max-h-48 md:max-h-none overflow-y-auto">
                {players.map((player, index) => (
                  <div
                    key={player}
                    className="flex items-center justify-between py-1.5 md:py-2 border-b border-slate-800 last:border-0"
                  >
                    <span className="text-slate-500 font-mono text-[10px] md:text-xs">#{index + 1}</span>
                    <span className={`font-mono text-xs md:text-sm ${player === address ? 'text-cyan-400' : 'text-slate-400'}`}>
                      {shortenAddress(player)}
                      {player === address && ' (YOU)'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 font-mono text-xs md:text-sm">NO PLAYERS YET</p>
            )}
          </div>

          {/* Game info - horizontal on mobile */}
          <div className="cyber-card p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-bold text-white mb-3 md:mb-4 font-mono">GAME INFO</h3>
            <div className="space-y-2 md:space-y-3 text-xs md:text-sm font-mono">
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

          {/* How to win - collapsible hint on mobile */}
          <div className="cyber-card p-4 md:p-6">
            <h3 className="text-xs md:text-sm font-bold text-white mb-3 md:mb-4 font-mono">HOW TO WIN</h3>
            <p className="text-slate-400 font-mono text-[10px] md:text-xs leading-relaxed">
              Choose a number from 1-10. The winner is the player who picks
              the <span className="text-cyan-400">MINIMUM UNIQUE</span> number.
              If multiple players pick the same number, it&apos;s not unique.
              The smallest number that only one person picked wins.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
