import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes';

/**
 * Interface for defining strategies for generating text using GPT models.
 */
export interface IStrategy {
  /**
   * Name of the strategy.
   */
  NAME: string;
  /**
   * Method that defines the completion strategy for generating text.
   *
   * @param request - The request to be sent to the GPT models.
   * @returns A promise that resolves to the generated text or throws an error.
   */
  completion(request: GPTRequest): Promise<GPTMessageEntity | string>;
}
