import { useEffect, useState, useCallback, useRef } from 'react'

const TITLE = 'COGNUMBERS'
const CHARS = '0123456789#@$%&*!?<>[]{}|/\\~^'
const CHAR_CYCLE_SPEED = 80

export function AnimatedTitle() {
  const [displayText, setDisplayText] = useState<string[]>(
    Array(TITLE.length).fill('')
  )
  const [isHovering, setIsHovering] = useState(false)
  const intervalRef = useRef<number | null>(null)

  const getRandomChar = useCallback(() => {
    return CHARS[Math.floor(Math.random() * CHARS.length)]
  }, [])

  useEffect(() => {
    if (isHovering) {
      // When hovering, show the actual title
      setDisplayText(TITLE.split(''))
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    } else {
      // When not hovering, continuously scramble
      intervalRef.current = window.setInterval(() => {
        setDisplayText(
          Array(TITLE.length)
            .fill('')
            .map(() => getRandomChar())
        )
      }, CHAR_CYCLE_SPEED)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isHovering, getRandomChar])

  return (
    <h1
      className="font-['Orbitron'] text-4xl md:text-6xl font-bold tracking-wider flex justify-center cursor-pointer"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {displayText.map((char, index) => (
        <span
          key={index}
          className={`inline-block transition-all duration-200 ${
            isHovering ? 'text-white' : 'text-cyan-400'
          }`}
          style={{
            textShadow: isHovering
              ? 'none'
              : '0 0 10px rgba(0, 255, 255, 0.8), 0 0 20px rgba(0, 255, 255, 0.4)',
            minWidth: '0.7em',
            textAlign: 'center',
          }}
        >
          {char}
        </span>
      ))}
      {!isHovering && (
        <span className="ml-1 text-cyan-400 animate-pulse">_</span>
      )}
    </h1>
  )
}
