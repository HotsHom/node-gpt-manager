import { BaseGPTConfig } from '../../types/GPTConfig';

export type OpenAIConfig = BaseGPTConfig & {
  openAiApiKey: string;
};

export const isOpenAIConfig = (config: BaseGPTConfig): config is OpenAIConfig => {
  return 'identifier' in config && 'openKeyIdentifier' in config;
};
