import { BaseGPTConfig, GPTConfigsInitType } from '../types/GPTConfig';
import { GPTProviderClassMapType } from '../constants/GPTProviderClassMapType';
import { IGPTManager } from './IGPTManager.interface';
import { IProvider } from '../providers/IProvider.interface';
import { IStrategy } from '../strategies/IStrategy.interfrace';
import { FirstSuccessStrategy } from '../strategies/FirstSuccess.strategy';
import { GPTMessageEntity, GPTRequest } from '../types/GPTRequestTypes';

/**
 * Manager class responsible for managing GPT providers and configurations.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export class GPTManager<TGPTNames extends string> implements IGPTManager<TGPTNames> {
  private static instance: GPTManager<any>;
  private gptProviders: Map<TGPTNames, IProvider> = new Map();
  private readonly providerClassMap: GPTProviderClassMapType<TGPTNames>;
  private strategy: IStrategy;

  /**
   * Constructs a new GPTManager instance.
   *
   * @param providerClassMap - Map of GPT provider classes with their respective names as keys.
   */
  constructor(providerClassMap: GPTProviderClassMapType<TGPTNames>) {
    this.providerClassMap = providerClassMap;
    this.strategy = new FirstSuccessStrategy(this);
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
        acc[key as TGPTNames] = value.provider;
        return acc;
      }, {} as GPTProviderClassMapType<TGPTNames>);

      GPTManager.instance = new GPTManager<TGPTNames>(providers);
    }

    try {
      for (const gptName of Object.keys(gptConfigs) as TGPTNames[]) {
        const config = gptConfigs[gptName];
        if (!config) continue;
        await GPTManager.instance.addProvider(gptName, config);
        await GPTManager.instance.getGPTProvider(gptName).authenticate();
      }
      return GPTManager.instance;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  /**
   * Retrieves the singleton instance of GPTManager.
   *
   * @returns The singleton instance of GPTManager.
   */
  static getInstance<TGPTNames extends string>(): GPTManager<TGPTNames> {
    return GPTManager.instance as GPTManager<TGPTNames>;
  }

  /**
   * Adds a GPT provider to the manager with the specified configuration.
   *
   * @param gptName - Name of the GPT provider.
   * @param config - Configuration for the GPT provider.
   * @returns A promise that resolves to true if the provider is added successfully, false otherwise.
   */
  private async addProvider(gptName: TGPTNames, config: BaseGPTConfig): Promise<boolean> {
    const ProviderClass = this.providerClassMap[gptName];
    if (!ProviderClass) return false;

    const newProvider = new ProviderClass(config, gptName);
    this.gptProviders.set(gptName, newProvider);
    return true;
  }

  /**
   * Retrieves the GPT provider instance with the specified name.
   *
   * @param gptName - Name of the GPT provider.
   * @returns The GPT provider instance.
   * @throws Error if the provider with the specified name is not found.
   */
  getGPTProvider(gptName: TGPTNames): IProvider {
    const gptProvider = this.gptProviders.get(gptName);
    if (!gptProvider) throw new Error('GPT provider not found');
    return gptProvider;
  }

  /**
   * Retrieves a map of GPT provider instances with their respective names.
   *
   * @returns A map containing GPT provider instances with their names as keys.
   */
  getProvidersWithNamesMap(): Map<TGPTNames, IProvider> {
    return this.gptProviders;
  }

  setStrategy(newStrategy: IStrategy): void {
    this.strategy = newStrategy;
  }

  completion(request: GPTRequest): Promise<GPTMessageEntity | string> {
    return this.strategy.completion(request);
  }
}
