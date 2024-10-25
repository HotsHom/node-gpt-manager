import { BaseGPTConfig } from '../../types/GPTConfig';
export type OpenAIConfig = BaseGPTConfig & {
    openAiApiKey: string;
    model?: string;
};
export declare const isOpenAIConfig: (config: BaseGPTConfig) => config is OpenAIConfig;
