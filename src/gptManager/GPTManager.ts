import { BaseGPTConfig, GPTConfigsInitType } from '../types/GPTConfig'
import { GPTProviderClassMapType } from '../constants/GPTProviderClassMapType'
import { IGPTManager } from './IGPTManager.interface'
import { IProvider } from '../providers/IProvider.interface'
import { IStrategy } from '../strategies/IStrategy.interfrace'
import { FirstSuccessStrategy } from '../strategies/FirstSuccess.strategy'
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes'
import { AvailableModelsType } from '../constants/types'
import { FallbackStrategy } from '../strategies/Fallback.strategy'

/**
 * Manager class responsible for managing GPT providers and configurations.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export class GPTManager<TGPTNames extends string> implements IGPTManager<TGPTNames> {
  private static instance: GPTManager<any>
  private gptProviders: Map<TGPTNames, IProvider> = new Map()
  private readonly providerClassMap: GPTProviderClassMapType<TGPTNames>
  private strategy: IStrategy

  /**
   * Constructs a new GPTManager instance.
   *
   * @param providerClassMap - Map of GPT provider classes with their respective names as keys.
   */
  constructor(providerClassMap: GPTProviderClassMapType<TGPTNames>) {
    this.providerClassMap = providerClassMap
    this.strategy = new FirstSuccessStrategy(this)
  }

  /**
   * Initializes the GPTManager with the specified configurations.
   *
   * @param gptConfigs - Initial configurations for GPT providers.
   * @returns A promise that resolves to the initialized GPTManager instance or null if initialization fails.
   */
  static async init<TGPTNames extends string, TGPTConfigs extends GPTConfigsInitType<TGPTNames>>(
    gptConfigs: TGPTConfigs
  ): Promise<GPTManager<TGPTNames> | null> {
    if (!GPTManager.instance) {
      const providers = Object.entries<BaseGPTConfig>(
        gptConfigs as { [s: string]: BaseGPTConfig }
      ).reduce((acc, [key, value]) => {
        acc[key as TGPTNames] = value.provider
        return acc
      }, {} as GPTProviderClassMapType<TGPTNames>)

      GPTManager.instance = new GPTManager<TGPTNames>(providers)
    }

    try {
      for (const gptName of Object.keys(gptConfigs) as TGPTNames[]) {
        const config = gptConfigs[gptName]
        if (!config) continue
        await GPTManager.instance.addProvider(gptName, config)
        await GPTManager.instance.getGPTProvider(gptName).authenticate()
      }
      return GPTManager.instance
    } catch (e) {
      console.error(e)
      return null
    }
  }

  /**
   * Retrieves the singleton instance of GPTManager.
   *
   * @returns The singleton instance of GPTManager.
   */
  static getInstance<TGPTNames extends string>(): GPTManager<TGPTNames> {
    return GPTManager.instance as GPTManager<TGPTNames>
  }

  /**
   * Adds a GPT provider to the manager with the specified configuration.
   *
   * @param gptName - Name of the GPT provider.
   * @param config - Configuration for the GPT provider.
   * @returns A promise that resolves to true if the provider is added successfully, false otherwise.
   */
  private async addProvider(gptName: TGPTNames, config: BaseGPTConfig): Promise<boolean> {
    const ProviderClass = this.providerClassMap[gptName]
    if (!ProviderClass) return false

    const newProvider = new ProviderClass(config, gptName)
    this.gptProviders.set(gptName, newProvider)
    return true
  }

  /**
   * Retrieves the GPT provider instance with the specified name.
   *
   * @param gptName - Name of the GPT provider.
   * @returns The GPT provider instance.
   * @throws Error if the provider with the specified name is not found.
   */
  getGPTProvider(gptName: TGPTNames): IProvider {
    const gptProvider = this.gptProviders.get(gptName)
    if (!gptProvider) throw new Error('GPT provider not found')
    return gptProvider
  }

  /**
   * Retrieves a map of GPT provider instances with their respective names.
   *
   * @returns A map containing GPT provider instances with their names as keys.
   */
  getProvidersWithNamesMap(): Map<TGPTNames, IProvider> {
    return this.gptProviders
  }

  /**
   * Sets the strategy for generating text using GPT models.
   *
   * @param {IStrategy} newStrategy - The new strategy to be set.
   * @return {void} No return value.
   */
  setStrategy(newStrategy: IStrategy): void {
    this.strategy = newStrategy
  }

  /**
   * Calls the completion method of the strategy with the given request and finishCallback.
   *
   * This method can be called in three different ways:
   * 1. With a request and a model name, to use a specific GPT model for completion.
   * 2. With a request and a finish callback, to use the default strategy for completion.
   * 3. With a request, a model name or a finish callback, and an optional finish callback.
   *
   * @param {GPTRequest} request - The request to be sent to the GPT models.
   * @param {TGPTNames} [model] - The name of the GPT model to use for completion.
   * @param {(gpt: BaseGPTConfig, gptName?: string) => Promise<void>} [finishCallback] - Optional callback function to be called after the completion.
   * @param onStreamCallback
   * @return {Promise<GPTMessageEntity | string>} - A promise that resolves to the generated text or throws an error.
   */
  completion(
    request: GPTRequest,
    model?: TGPTNames,
    finishCallback?: (gpt: BaseGPTConfig, gptName?: string) => Promise<void>,
    onStreamCallback?: (chunk: string) => void
  ): Promise<GPTMessageEntity | string | void> {
    if (model) {
      const fallbackStrategy = new FallbackStrategy(this, model)
      return fallbackStrategy.completion(request, finishCallback, onStreamCallback)
    }

    return this.strategy.completion(request, finishCallback, onStreamCallback)
  }

  /**
   * Retrieves a list of available GPT providers with their respective names.
   *
   * @returns {AvailableModelsType<TGPTNames>} A list of objects containing GPT provider names as keys and their availability as values.
   */
  async getAvailableProviders(): Promise<AvailableModelsType<TGPTNames>> {
    const availableModels: AvailableModelsType<TGPTNames> = Object.create(null)
    for (const [gptName, provider] of this.gptProviders) {
      availableModels[gptName] = {
        isAvailable: await provider.isAvailable(),
        extra: provider.getConfig().extra,
      }
    }
    return availableModels
  }
}
