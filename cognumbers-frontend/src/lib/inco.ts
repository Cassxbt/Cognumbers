import { Lightning } from '@inco/js/lite'
import { handleTypes } from '@inco/js'
import type { WalletClient } from 'viem'
import { CONTRACT_ADDRESS } from '../config/wagmi'

type LightningInstance = Awaited<ReturnType<typeof Lightning.latest>>

let lightningInstance: LightningInstance | null = null

export async function getIncoLightning(): Promise<LightningInstance> {
  if (!lightningInstance) {
    lightningInstance = await Lightning.latest('testnet', 84532 as never)
  }
  return lightningInstance
}

export async function encryptNumber(
  value: number,
  accountAddress: `0x${string}`
): Promise<`0x${string}`> {
  console.log('[encryptNumber] Starting encryption:', { value, accountAddress, CONTRACT_ADDRESS })

  try {
    console.log('[encryptNumber] Getting Lightning instance...')
    const lightning = await getIncoLightning()
    console.log('[encryptNumber] Got Lightning instance')

    console.log('[encryptNumber] Calling lightning.encrypt with:', {
      value: BigInt(value).toString(),
      accountAddress,
      dappAddress: CONTRACT_ADDRESS,
      handleType: 'euint256',
    })

    const ciphertext = await lightning.encrypt(BigInt(value), {
      accountAddress,
      dappAddress: CONTRACT_ADDRESS,
      handleType: handleTypes.euint256,
    })

    console.log('[encryptNumber] Encryption successful, ciphertext:', ciphertext?.slice(0, 66) + '...')
    return ciphertext as `0x${string}`
  } catch (err) {
    console.error('[encryptNumber] Encryption error:', err)
    throw err
  }
}

interface DecryptResult {
  plaintext?: {
    value?: bigint
  }
}

export async function decryptHandle(
  walletClient: WalletClient,
  handle: `0x${string}`
): Promise<bigint | null> {
  if (!walletClient.account) {
    throw new Error('Wallet client has no account')
  }

  const lightning = await getIncoLightning()

  const maxRetries = 5
  const baseDelay = 1000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const results = await lightning.attestedDecrypt(walletClient as never, [handle]) as DecryptResult[]
      return results[0]?.plaintext?.value ?? null
    } catch (err) {
      if (attempt === maxRetries) {
        console.error('Failed to decrypt after all retries:', err)
        throw err
      }

      const delay = baseDelay * Math.pow(1.5, attempt - 1)
      console.log(`Decrypt attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return null
}

export async function decryptMultipleHandles(
  walletClient: WalletClient,
  handles: `0x${string}`[]
): Promise<(bigint | null)[]> {
  if (!walletClient.account) {
    throw new Error('Wallet client has no account')
  }

  const lightning = await getIncoLightning()

  const maxRetries = 5
  const baseDelay = 1000

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const results = await lightning.attestedDecrypt(walletClient as never, handles) as DecryptResult[]
      return results.map((r: DecryptResult) => r?.plaintext?.value ?? null)
    } catch (err) {
      if (attempt === maxRetries) {
        console.error('Failed to decrypt after all retries:', err)
        throw err
      }

      const delay = baseDelay * Math.pow(1.5, attempt - 1)
      console.log(`Decrypt attempt ${attempt} failed, retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  return handles.map(() => null)
}
