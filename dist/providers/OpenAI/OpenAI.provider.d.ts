import { IProvider } from '../IProvider.interface';
import { BaseGPTConfig } from '../../types/GPTConfig';
import { GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes';
import { OpenAIConfig } from './types';
export declare class OpenAIProvider implements IProvider {
    private readonly config;
    private readonly providerName?;
    private network?;
    constructor(config: BaseGPTConfig, providerName?: string);
    init(): Promise<boolean>;
    getConfig(): OpenAIConfig;
    authenticate(): Promise<boolean>;
    completion(request: GPTRequest, onStreamCallback?: (chunk: string) => void): Promise<GPTMessageEntity | string | void>;
    isAvailable(): Promise<boolean>;
}
