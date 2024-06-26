import { IGPTManager } from '../gptManager/IGPTManager.interface';
import { GPTMessageEntity, GPTRequest, YandexGPTMessageEntity } from '../types/GPTRequestTypes';
import { IStrategy } from './IStrategy.interfrace';
import { BaseGPTConfig } from '../types/GPTConfig';

/**
 * Strategy that sends requests to multiple GPT providers in parallel and returns the first successful response.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export class ParallelRequestsStrategy<TGPTNames extends string> implements IStrategy {
  NAME: string = 'ParallelRequests';

  /**
   * Constructs a new ParallelRequestsStrategy.
   *
   * @param manager - Instance of the GPT manager.
   */
  constructor(private manager: IGPTManager<TGPTNames>) {}

  /**
   * Attempts to generate text by sending requests to multiple GPT providers in parallel.
   * Returns the response from the first provider that succeeds.
   *
   * @param request - The request to be sent to the GPT models.
   * @param finishCallback
   * @returns A promise that resolves to the generated text or throws an error if all providers fail.
   */
  async completion(
    request: GPTRequest,
    finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>
  ): Promise<GPTMessageEntity | YandexGPTMessageEntity | string> {
    const providers = Array.from(this.manager.getProvidersWithNamesMap().entries()).map(
      async gptProviderWithName => {
        const provider = gptProviderWithName[1];
        const response = await provider.completion(request);
        return {
          config: provider.getConfig(),
          name: gptProviderWithName[0],
          response,
        };
      }
    );

    try {
      const result = await Promise.any(providers);
      finishCallback && (await finishCallback(result.config, result.name));
      return result.response;
    } catch (error) {
      throw new Error('All providers failed to generate text');
    }
  }
}
