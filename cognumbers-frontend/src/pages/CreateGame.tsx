import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useCreateGame } from '../hooks/useContract'
import { LoadingSpinner } from '../components/LoadingSpinner'

const DURATION_OPTIONS = [
  { label: '5 MIN', value: 300 },
  { label: '15 MIN', value: 900 },
  { label: '30 MIN', value: 1800 },
  { label: '1 HOUR', value: 3600 },
  { label: '24 HOURS', value: 86400 },
]

const FEE_OPTIONS = ['0.001', '0.005', '0.01', '0.05', '0.1']

export function CreateGame() {
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const { createGame, isPending, isConfirming, isSuccess, error } = useCreateGame()

  const [entryFee, setEntryFee] = useState('0.001')
  const [duration, setDuration] = useState(300)
  const [customFee, setCustomFee] = useState('')

  const handleCreate = () => {
    const fee = customFee || entryFee
    createGame(fee, duration)
  }

  if (isSuccess) {
    setTimeout(() => navigate('/games'), 2000)
  }

  if (!isConnected) {
    return (
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="cyber-card p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-4 font-['Orbitron']">
            CONNECT WALLET
          </h2>
          <p className="text-slate-400 font-mono text-sm mb-6">
            Connect your wallet to create a game
          </p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-['Orbitron'] text-3xl font-bold text-white mb-2">
          CREATE GAME
        </h1>
        <p className="text-slate-400 font-mono text-sm">
          SET UP A NEW COGNUMBERS ARENA
        </p>
      </div>

      <div className="cyber-card p-6 space-y-6">
        <div>
          <label className="block text-xs text-slate-500 font-mono mb-3">
            ENTRY FEE (ETH)
          </label>
          <div className="grid grid-cols-5 gap-2 mb-3">
            {FEE_OPTIONS.map((fee) => (
              <button
                key={fee}
                onClick={() => {
                  setEntryFee(fee)
                  setCustomFee('')
                }}
                className={`py-2 text-sm font-mono border transition-all duration-200 ${
                  entryFee === fee && !customFee
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {fee}
              </button>
            ))}
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Custom amount..."
              value={customFee}
              onChange={(e) => setCustomFee(e.target.value)}
              className="cyber-input pr-12"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">
              ETH
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs text-slate-500 font-mono mb-3">
            GAME DURATION
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setDuration(opt.value)}
                className={`py-2 text-sm font-mono border transition-all duration-200 ${
                  duration === opt.value
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-400/10'
                    : 'border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-700 pt-6">
          <div className="flex items-center justify-between text-sm font-mono mb-2">
            <span className="text-slate-500">ENTRY FEE</span>
            <span className="text-white">{customFee || entryFee} ETH</span>
          </div>
          <div className="flex items-center justify-between text-sm font-mono mb-2">
            <span className="text-slate-500">DURATION</span>
            <span className="text-white">
              {DURATION_OPTIONS.find((d) => d.value === duration)?.label}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm font-mono mb-2">
            <span className="text-slate-500">MAX PLAYERS</span>
            <span className="text-white">10</span>
          </div>
          <div className="flex items-center justify-between text-sm font-mono">
            <span className="text-slate-500">MAX PRIZE POOL</span>
            <span className="text-green-400">
              {(parseFloat(customFee || entryFee) * 10).toFixed(4)} ETH
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm font-mono">
            ERROR: {error.message}
          </div>
        )}

        {isSuccess && (
          <div className="p-3 border border-green-500/50 bg-green-500/10 text-green-400 text-sm font-mono">
            GAME CREATED SUCCESSFULLY! REDIRECTING...
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={isPending || isConfirming}
          className="cyber-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending || isConfirming ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner size="sm" />
              {isPending ? 'CONFIRM IN WALLET...' : 'CREATING GAME...'}
            </span>
          ) : (
            'CREATE GAME'
          )}
        </button>
      </div>
    </div>
  )
}
