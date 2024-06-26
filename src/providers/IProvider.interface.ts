import { GPTMessageEntity, GPTRequest, YandexGPTMessageEntity } from '../types/GPTRequestTypes';
import {BaseGPTConfig} from "../types/GPTConfig";

/**
 * Interface for defining GPT providers.
 */
export interface IProvider {
  /**
   * Authenticates the provider.
   *
   * @returns A promise that resolves to true if authentication is successful, false otherwise.
   */
  authenticate(): Promise<boolean>;
  /**
   * Method that defines the completion strategy for generating text.
   *
   * @param request - The request to be sent to the GPT models.
   * @returns A promise that resolves to the generated text or throws an error.
   */
  completion(request: GPTRequest): Promise<GPTMessageEntity | YandexGPTMessageEntity | string>;

  isOnline(): Promise<boolean>;

  getConfig(): BaseGPTConfig;
}
