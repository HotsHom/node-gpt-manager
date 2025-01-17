import { IGPTManager } from '../gptManager/IGPTManager.interface'
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes'
import { IStrategy } from './IStrategy.interfrace'
import { BaseGPTConfig } from '../types/GPTConfig'

/**
 * Strategy that attempts to get a response from the first GPT model that successfully generates text.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export class FirstSuccessStrategy<TGPTNames extends string> implements IStrategy {
  NAME: string = 'FirstSuccess'

  /**
   * Constructs a new FirstSuccessStrategy.
   *
   * @param manager - Instance of the GPT manager.
   */
  constructor(private manager: IGPTManager<TGPTNames>) {}

  /**
   * Attempts to generate text using the first GPT provider that succeeds.
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
    shouldAbort?: boolean
  ): Promise<GPTMessageEntity | string | void> {
    for (const gptProviders of this.manager.getProvidersWithNamesMap()) {
      try {
        const provider = gptProviders[1]
        const response = await provider.completion(request, onStreamCallback, shouldAbort)
        if (response) {
          finishCallback && (await finishCallback(provider.getConfig(), gptProviders[0]))
          return response
        }
      } catch (error) {
        console.warn(`Provider ${gptProviders[0]} failed: ${error}`)
      }
    }
    throw new Error('All providers failed to generate text')
  }
}
