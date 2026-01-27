export function Leaderboard() {
  // Leaderboard will be populated from on-chain events in future update
  const isLoading = false
  const hasData = false

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-['Orbitron'] font-bold text-white mb-2">LEADERBOARD</h1>
      <p className="text-slate-400 font-mono text-sm mb-8">Top players ranked by wins</p>

      <div className="border border-slate-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              <th className="px-4 py-3 text-left text-xs font-mono text-slate-500">#</th>
              <th className="px-4 py-3 text-left text-xs font-mono text-slate-500">PLAYER</th>
              <th className="px-4 py-3 text-center text-xs font-mono text-slate-500">WINS</th>
              <th className="px-4 py-3 text-center text-xs font-mono text-slate-500">GAMES</th>
              <th className="px-4 py-3 text-right text-xs font-mono text-slate-500">EARNINGS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="text-slate-500 font-mono">Loading...</div>
                </td>
              </tr>
            ) : !hasData ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="text-slate-500 font-mono">
                    <p className="text-lg mb-2">NO DATA YET</p>
                    <p className="text-sm">Play games to appear on the leaderboard</p>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-8 border border-slate-800 p-4">
        <p className="text-xs text-slate-500 font-mono text-center">
          Leaderboard updates automatically from on-chain data
        </p>
      </div>
    </div>
  )
}
