import { BaseGPTConfig } from '../../types/GPTConfig';
import { GigaChatConfig } from './types';
import { IProvider } from '../IProvider.interface';
import { GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes';
export declare class GigaChatProvider implements IProvider {
    static readonly ConfigType: GigaChatConfig;
    private readonly config;
    private readonly providerName?;
    private network?;
    private accessToken?;
    private updateTokenTimer?;
    constructor(config: BaseGPTConfig, providerName?: string);
    getConfig(): GigaChatConfig;
    authenticate(): Promise<boolean>;
    init(): Promise<boolean>;
    completion(request: GPTRequest, onStreamCallback?: (chunk: string) => void): Promise<GPTMessageEntity | string | void>;
    isAvailable(): Promise<boolean>;
    private initNetworkInstance;
}
