import { useState, useCallback } from 'react'
import { useAccount, useWalletClient } from 'wagmi'
import { encryptNumber, decryptHandle, decryptMultipleHandles } from '../lib/inco'

export function useEncrypt() {
  const { address } = useAccount()
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const encrypt = useCallback(
    async (value: number): Promise<`0x${string}` | null> => {
      if (!address) {
        setError(new Error('Wallet not connected'))
        return null
      }

      setIsEncrypting(true)
      setError(null)

      try {
        const ciphertext = await encryptNumber(value, address)
        return ciphertext
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        console.error('Encryption failed:', error)
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
