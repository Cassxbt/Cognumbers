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
  const lightning = await getIncoLightning()

  const ciphertext = await lightning.encrypt(BigInt(value), {
    accountAddress,
    dappAddress: CONTRACT_ADDRESS,
    handleType: handleTypes.euint256,
  })

  return ciphertext as `0x${string}`
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
