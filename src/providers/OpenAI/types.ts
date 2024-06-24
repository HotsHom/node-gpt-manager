import { BaseGPTConfig } from '../../types/GPTConfig';

export type OpenAIConfig = BaseGPTConfig & {
  openAiApiKey: string;
  model?: string;
};

export const isOpenAIConfig = (config: BaseGPTConfig): config is OpenAIConfig => {
  return 'openAiApiKey' in config;
};
