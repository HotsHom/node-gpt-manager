import { IGPTManager } from '../gptManager/IGPTManager.interface'
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes'
import { IStrategy } from './IStrategy.interfrace'
import { BaseGPTConfig } from '../types/GPTConfig'

/**
 * Strategy that attempts to use a primary GPT provider and falls back to others if it fails.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export class FallbackStrategy<TGPTNames extends string> implements IStrategy {
  NAME: string = 'Fallback'

  private readonly primaryModelName: TGPTNames
  private readonly fallbackModelNames: TGPTNames[]

  /**
   * Constructs a new FallbackStrategy.
   *
   * @param manager - Instance of the GPT manager.
   * @param primaryModelName - Name of the primary GPT provider.
   */
  constructor(
    private manager: IGPTManager<TGPTNames>,
    primaryModelName: TGPTNames
  ) {
    this.primaryModelName = primaryModelName
    this.fallbackModelNames = Array.from(manager.getProvidersWithNamesMap().entries())
      .filter(item => item[0] !== primaryModelName)
      .map(item => item[0])
  }

  /**
   * Attempts to generate text using the primary GPT provider, and falls back to other providers if the primary fails.
   *
   * @param request - The request to be sent to the GPT models.
   * @param finishCallback
   * @param onStreamCallback
   * @param shouldAbort
   * @returns A promise that resolves to the generated text or throws an error if all providers fail.
   */
  async completion(
    request: GPTRequest,
    finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>,
    onStreamCallback?: (chunk: string) => void,
    shouldAbort?: () => boolean
  ): Promise<GPTMessageEntity | string | void> {
    const models = [this.primaryModelName, ...this.fallbackModelNames]

    for (const gptName of models) {
      try {
        const provider = this.manager.getGPTProvider(gptName)
        const response = await provider.completion(request, onStreamCallback, shouldAbort)
        if (onStreamCallback) {
          return
        }
        if (response) {
          finishCallback && (await finishCallback(provider.getConfig(), gptName))
          return response
        }
      } catch (error) {
        console.warn(`Provider ${gptName} failed: ${error}`)
      }
    }
    throw new Error('All providers failed to generate text')
  }
}
