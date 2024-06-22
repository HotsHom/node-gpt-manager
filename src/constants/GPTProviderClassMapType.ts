import { BaseGPTConfig } from '../types/GPTConfig';
import { IProvider } from '../providers/IProvider.interface';

/**
 * Type representing a constructor for a GPT provider with a specific configuration.
 */
export type GPTProviderType = {
  new (config: BaseGPTConfig, providerName?: string): IProvider;
};

/**
 * Type representing a map of GPT provider types with their respective names as keys.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export type GPTProviderClassMapType<TGPTNames extends string> = {
  [key in TGPTNames]: GPTProviderType;
};
