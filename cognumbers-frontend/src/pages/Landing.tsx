import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatedTitle } from '../components/AnimatedTitle'

const faqs = [
  {
    question: 'How many players can join?',
    answer: 'Each game supports 2-100 players. The more players, the bigger the prize pool.',
  },
  {
    question: 'How much does it cost to play?',
    answer: 'Entry fee is set by the game creator. You pay the entry fee + gas to join.',
  },
  {
    question: 'What happens if no one wins?',
    answer: 'If no unique number exists, the prize pool rolls over or is split among participants.',
  },
  {
    question: 'When does the game end?',
    answer: 'Games end when max players join or the time limit expires.',
  },
  {
    question: 'How do I claim my prize?',
    answer: 'Winners are paid automatically when the game resolves. No claim needed.',
  },
]

export function Landing() {
  const [showPlayOptions, setShowPlayOptions] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-[calc(100vh-140px)] flex flex-col items-center px-4 py-12">
      <div className="max-w-3xl mx-auto text-center">
        {/* Hero */}
        <div className="mb-8">
          <div className="inline-block border border-cyan-400/30 p-4 mb-6">
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="w-10 h-10 border border-slate-700 flex items-center justify-center text-slate-500 font-bold"
                >
                  {n}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <AnimatedTitle />
        </div>

        <p className="text-cyan-400 font-mono text-lg mb-8">
          PRIVACY-PRESERVING NUMBER GAME
        </p>

        {/* Play Button */}
        <div
          className="relative inline-block mb-16 pb-4"
          onMouseEnter={() => setShowPlayOptions(true)}
          onMouseLeave={() => setShowPlayOptions(false)}
        >
          <button className="cyber-button text-xl px-12 py-4">
            PLAY
          </button>

          <div
            className={`absolute top-full left-1/2 -translate-x-1/2 pt-2 flex flex-col gap-2 transition-all duration-300 z-50 ${
              showPlayOptions
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-2 pointer-events-none'
            }`}
          >
            <Link
              to="/games"
              className="cyber-button whitespace-nowrap text-center"
            >
              JOIN GAME
            </Link>
            <Link
              to="/create"
              className="cyber-button whitespace-nowrap text-center"
            >
              CREATE GAME
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 text-left mb-16">
          <div className="cyber-card p-6">
            <div className="text-cyan-400 text-2xl font-bold mb-2 font-['Orbitron']">01</div>
            <h3 className="text-white font-bold mb-2">HIDDEN MOVES</h3>
            <p className="text-slate-400 text-sm font-mono">
              Your number stays encrypted. No one sees it until game ends.
            </p>
          </div>

          <div className="cyber-card p-6">
            <div className="text-cyan-400 text-2xl font-bold mb-2 font-['Orbitron']">02</div>
            <h3 className="text-white font-bold mb-2">FAIR PLAY</h3>
            <p className="text-slate-400 text-sm font-mono">
              Lowest unique number wins. Pure strategy, zero cheating.
            </p>
          </div>

          <div className="cyber-card p-6">
            <div className="text-cyan-400 text-2xl font-bold mb-2 font-['Orbitron']">03</div>
            <h3 className="text-white font-bold mb-2">AUTO PAYOUT</h3>
            <p className="text-slate-400 text-sm font-mono">
              Win and get paid instantly. Smart contract handles it all.
            </p>
          </div>
        </div>

        {/* How to Play */}
        <div className="mb-16">
          <h2 className="text-2xl font-['Orbitron'] font-bold text-white mb-8">HOW TO PLAY</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="border border-slate-800 p-4">
              <div className="text-cyan-400 text-3xl font-bold font-['Orbitron'] mb-2">1</div>
              <p className="text-slate-400 text-sm font-mono">Connect your wallet</p>
            </div>
            <div className="border border-slate-800 p-4">
              <div className="text-cyan-400 text-3xl font-bold font-['Orbitron'] mb-2">2</div>
              <p className="text-slate-400 text-sm font-mono">Join or create a game</p>
            </div>
            <div className="border border-slate-800 p-4">
              <div className="text-cyan-400 text-3xl font-bold font-['Orbitron'] mb-2">3</div>
              <p className="text-slate-400 text-sm font-mono">Pick a number 1-10</p>
            </div>
            <div className="border border-slate-800 p-4">
              <div className="text-cyan-400 text-3xl font-bold font-['Orbitron'] mb-2">4</div>
              <p className="text-slate-400 text-sm font-mono">Lowest unique wins!</p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-2xl font-['Orbitron'] font-bold text-white mb-8">FAQ</h2>
          <div className="space-y-2">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="border border-slate-800 text-left"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-4 py-3 flex items-center justify-between text-white font-mono text-sm hover:bg-slate-800/50 transition-colors"
                >
                  <span>{faq.question}</span>
                  <span className="text-cyan-400">{openFaq === index ? '−' : '+'}</span>
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index ? 'max-h-32' : 'max-h-0'
                  }`}
                >
                  <p className="px-4 pb-3 text-slate-400 text-sm font-mono">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Network Status */}
        <div className="border border-slate-800 p-6">
          <div className="text-xs text-slate-500 font-mono mb-4">NETWORK STATUS</div>
          <div className="flex items-center justify-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 animate-pulse" />
              <span className="text-slate-400 text-sm font-mono">BASE SEPOLIA</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-cyan-400 animate-pulse" />
              <span className="text-slate-400 text-sm font-mono">INCO FHE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
