import { IProvider } from '../providers/IProvider.interface'
import { IStrategy } from '../strategies/IStrategy.interfrace'
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes'
import { AvailableModelsType } from '../constants/types'
import { BaseGPTConfig } from '../types/GPTConfig'

/**
 * Interface for managing GPT providers and configurations.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export interface IGPTManager<TGPTNames extends string> {
  /**
   * Retrieves the GPT provider instance with the specified name.
   *
   * @param gptName - Name of the GPT provider.
   * @returns The GPT provider instance.
   */
  getGPTProvider(gptName: TGPTNames): IProvider

  /**
   * Retrieves a map of GPT provider instances with their respective names.
   *
   * @returns A map containing GPT provider instances with their names as keys.
   */
  getProvidersWithNamesMap(): Map<TGPTNames, IProvider>

  setStrategy(newStrategy: IStrategy): void

  completion(
    request: GPTRequest,
    finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>
  ): Promise<GPTMessageEntity | string>

  getAvailableProviders(): Promise<AvailableModelsType<TGPTNames>>
}
