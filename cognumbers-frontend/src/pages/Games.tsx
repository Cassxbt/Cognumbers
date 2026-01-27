import { Link } from 'react-router-dom'
import { useAllGames } from '../hooks/useGames'
import { GameCard } from '../components/GameCard'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { GameStatus } from '../types/game'
import { useState } from 'react'
import { cn } from '../lib/utils'

type FilterType = 'all' | 'open' | 'calculating' | 'finished'

export function Games() {
  const { games, isLoading } = useAllGames()
  const [filter, setFilter] = useState<FilterType>('all')

  const filteredGames = games.filter((game) => {
    if (filter === 'all') return true
    if (filter === 'open') return game.status === GameStatus.Open
    if (filter === 'calculating') return game.status === GameStatus.Calculating
    if (filter === 'finished') return game.status === GameStatus.Finished
    return true
  })

  const openCount = games.filter((g) => g.status === GameStatus.Open).length
  const calculatingCount = games.filter((g) => g.status === GameStatus.Calculating).length
  const finishedCount = games.filter((g) => g.status === GameStatus.Finished).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-['Orbitron'] text-3xl font-bold text-white mb-2">
            ACTIVE GAMES
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            {games.length} TOTAL GAMES // {openCount} OPEN
          </p>
        </div>
        <Link to="/create" className="cyber-button">
          + CREATE GAME
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'ALL', count: games.length },
          { key: 'open', label: 'OPEN', count: openCount },
          { key: 'calculating', label: 'CALCULATING', count: calculatingCount },
          { key: 'finished', label: 'FINISHED', count: finishedCount },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => setFilter(item.key as FilterType)}
            className={cn(
              'px-4 py-2 font-mono text-sm whitespace-nowrap transition-all duration-200',
              filter === item.key
                ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/50'
                : 'text-slate-400 border border-slate-700 hover:border-slate-600'
            )}
          >
            {item.label} [{item.count}]
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner text="LOADING GAMES..." />
        </div>
      ) : filteredGames.length === 0 ? (
        <div className="cyber-card p-12 text-center">
          <div className="text-4xl mb-4">[ ]</div>
          <p className="text-slate-400 font-mono mb-4">NO GAMES FOUND</p>
          <Link to="/create" className="cyber-button inline-block">
            CREATE FIRST GAME
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game) => (
            <GameCard key={game.gameId.toString()} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
