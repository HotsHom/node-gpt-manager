import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes'
import { BaseGPTConfig } from '../types/GPTConfig'

/**
 * Interface for defining strategies for generating text using GPT models.
 */
export interface IStrategy {
  /**
   * Name of the strategy.
   */
  NAME: string

  /**
   * Method that defines the completion strategy for generating text.
   *
   * @param request - The request to be sent to the GPT models.
   * @param finishCallback
   * @returns A promise that resolves to the generated text or throws an error.
   */
  completion(
    request: GPTRequest,
    finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>
  ): Promise<GPTMessageEntity | string>
}
