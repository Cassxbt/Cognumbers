import { useState, useCallback } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { encryptNumber, decryptHandle, decryptMultipleHandles, revealWithSignatures, type RevealResult } from '../lib/inco'

export function useEncrypt() {
  const { address } = useAccount()
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const encrypt = useCallback(
    async (value: number): Promise<`0x${string}` | null> => {
      console.log('[useEncrypt] Starting encryption for value:', value, 'address:', address)

      if (!address) {
        console.error('[useEncrypt] No wallet address')
        setError(new Error('Wallet not connected'))
        return null
      }

      setIsEncrypting(true)
      setError(null)

      try {
        console.log('[useEncrypt] Calling encryptNumber...')
        const ciphertext = await encryptNumber(value, address)
        console.log('[useEncrypt] Encryption successful, ciphertext length:', ciphertext?.length)
        return ciphertext
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        console.error('[useEncrypt] Encryption failed:', error)
        console.error('[useEncrypt] Error stack:', error.stack)
        return null
      } finally {
        setIsEncrypting(false)
      }
    },
    [address]
  )

  return {
    encrypt,
    isEncrypting,
    error,
  }
}

export function useDecrypt() {
  const { data: walletClient } = useWalletClient()
  const [isDecrypting, setIsDecrypting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const decrypt = useCallback(
    async (handle: `0x${string}`): Promise<bigint | null> => {
      if (!walletClient) {
        setError(new Error('Wallet client not available'))
        return null
      }

      setIsDecrypting(true)
      setError(null)

      try {
        const plaintext = await decryptHandle(walletClient, handle)
        return plaintext
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        console.error('Decryption failed:', error)
        return null
      } finally {
        setIsDecrypting(false)
      }
    },
    [walletClient]
  )

  const decryptMultiple = useCallback(
    async (handles: `0x${string}`[]): Promise<(bigint | null)[]> => {
      if (!walletClient) {
        setError(new Error('Wallet client not available'))
        return handles.map(() => null)
      }

      setIsDecrypting(true)
      setError(null)

      try {
        const plaintexts = await decryptMultipleHandles(walletClient, handles)
        return plaintexts
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        console.error('Decryption failed:', error)
        return handles.map(() => null)
      } finally {
        setIsDecrypting(false)
      }
    },
    [walletClient]
  )

  return {
    decrypt,
    decryptMultiple,
    isDecrypting,
    error,
  }
}

/**
 * Hook to reveal publicly accessible encrypted values with signatures
 * Use this after a game has been finalized (e.reveal called on-chain)
 */
export function useReveal() {
  const [isRevealing, setIsRevealing] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const reveal = useCallback(
    async (handles: `0x${string}`[]): Promise<RevealResult[] | null> => {
      if (handles.length === 0) {
        return []
      }

      setIsRevealing(true)
      setError(null)

      try {
        console.log('[useReveal] Revealing', handles.length, 'handles')
        const results = await revealWithSignatures(handles)
        console.log('[useReveal] Reveal successful:', results.length, 'results')
        return results
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        console.error('[useReveal] Reveal failed:', error)
        return null
      } finally {
        setIsRevealing(false)
      }
    },
    []
  )

  return {
    reveal,
    isRevealing,
    error,
  }
}
