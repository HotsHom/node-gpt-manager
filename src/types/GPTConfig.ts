import { GPTProviderType } from '../constants/GPTProviderClassMapType'

/**
 * Type representing initial configurations for GPT providers.
 *
 * @template TGPTNames - Type of GPT provider names.
 */
export type GPTConfigsInitType<TGPTNames extends string> = {
  [key in TGPTNames]?: BaseGPTConfig
}

/**
 * Type representing the base configuration for a GPT provider.
 */
export type BaseGPTConfig = {
  /**
   * Identifier for the GPT provider.
   */
  id: string
  /**
   * Maximum number of tokens allowed for generation.
   */
  maxTokensCount: number
  /**
   * Transformer value for the provider.
   */
  transformerValue: number
  /**
   * Number of generate attempts allowed.
   */
  generateAttemptsCount: number
  /**
   * Type of the GPT provider.
   */
  provider: GPTProviderType
  /**
   * Additional info.
   */
  extra?: Record<string, unknown>
}
