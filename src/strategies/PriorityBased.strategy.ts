import { IGPTManager } from '../gptManager/IGPTManager.interface'
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes'
import { IStrategy } from './IStrategy.interfrace'
import { BaseGPTConfig } from '../types/GPTConfig'

/**
 * Configuration for the priority of each GPT provider.
 */
interface PriorityConfig {
  [gptName: string]: number
}

/**
 * Strategy that uses GPT providers based on their priority.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export class PriorityBasedStrategy<TGPTNames extends string> implements IStrategy {
  NAME: string = 'PriorityBased'
  private priorities: PriorityConfig

  /**
   * Constructs a new PriorityBasedStrategy.
   *
   * @param manager - Instance of the GPT manager.
   * @param priorities - Object defining the priority of each GPT provider.
   */
  constructor(
    private manager: IGPTManager<TGPTNames>,
    priorities: PriorityConfig
  ) {
    this.priorities = priorities
  }

  /**
   * Attempts to generate text using GPT providers in order of their priority.
   *
   * @param request - The request to be sent to the GPT models.
   * @param finishCallback
   * @param onStreamCallback
   * @returns A promise that resolves to the generated text or throws an error if all providers fail.
   */
  async completion(
    request: GPTRequest,
    finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>,
    onStreamCallback?: (chunk: string) => void
  ): Promise<GPTMessageEntity | string | void> {
    const sortedProviders = Array.from(this.manager.getProvidersWithNamesMap().entries())
      .sort((a, b) => {
        const priorityA = this.priorities[a[0]] || 0
        const priorityB = this.priorities[b[0]] || 0
        return priorityA - priorityB
      })
      .map(entry => entry[0])

    for (const gptName of sortedProviders) {
      try {
        const provider = this.manager.getGPTProvider(gptName)
        const response = await provider.completion(request, onStreamCallback)
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
