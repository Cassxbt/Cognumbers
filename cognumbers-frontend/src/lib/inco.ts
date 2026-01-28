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

    // Debug: Show deployment info using public properties
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const lightningAny = lightning as any
    console.log('[encryptNumber] Lightning instance:', {
      executorAddress: lightningAny.executorAddress,
      chainId: lightningAny.chainId?.toString(),
    })

    console.log('[encryptNumber] Calling lightning.encrypt with:', {
      value: BigInt(value).toString(),
      accountAddress,
      dappAddress: CONTRACT_ADDRESS,
      handleType: 'euint256 (8)',
    })

    const ciphertext = await lightning.encrypt(BigInt(value), {
      accountAddress,
      dappAddress: CONTRACT_ADDRESS,
      handleType: handleTypes.euint256,
    })

    console.log('[encryptNumber] Encryption successful!')
    console.log('[encryptNumber] Ciphertext length:', ciphertext?.length)
    console.log('[encryptNumber] First 74 chars (hex):', ciphertext?.slice(0, 74))

    // Parse version and handle from ciphertext
    if (ciphertext) {
      const versionHex = ciphertext.slice(2, 10) // Remove '0x', take first 8 hex chars (4 bytes)
      const version = parseInt(versionHex, 16)
      const handleHex = ciphertext.slice(10, 74) // Next 64 hex chars (32 bytes)

      console.log('[encryptNumber] Parsed ciphertext structure:')
      console.log('  - Version (hex):', '0x' + versionHex)
      console.log('  - Version (decimal):', version)
      console.log('  - Handle (hex):', '0x' + handleHex)
      console.log('  - Ciphertext start:', ciphertext.slice(74, 138) + '...')

      // Verify the values match expected
      console.log('[encryptNumber] Validation:')
      console.log('  - Expected version: 1, Actual:', version, version === 1 ? 'OK' : 'MISMATCH')
      console.log('  - Executor used:', lightningAny.executorAddress)
      console.log('  - Expected executor: 0x168FDc3Ae19A5d5b03614578C58974FF30FCBe92')
    }

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
