import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes'
import { BaseGPTConfig } from '../types/GPTConfig'

/**
 * Interface for defining GPT providers.
 */
export interface IProvider {
  /**
   * Authenticates the provider.
   *
   * @returns A promise that resolves to true if authentication is successful, false otherwise.
   */
  authenticate(): Promise<boolean>

  /**
   * Method that defines the completion strategy for generating text.
   *
   * @param request - The request to be sent to the GPT models.
   * @param onStreamCallback
   * @param shouldAbort
   * @returns A promise that resolves to the generated text or throws an error.
   */
  completion(
    request: GPTRequest,
    onStreamCallback?: (chunk: string) => void,
    shouldAbort?: boolean
  ): Promise<GPTMessageEntity | string | void>

  isAvailable(): Promise<boolean>

  getConfig(): BaseGPTConfig
}
