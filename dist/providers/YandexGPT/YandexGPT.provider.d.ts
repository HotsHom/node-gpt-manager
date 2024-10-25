import { IProvider } from '../IProvider.interface';
import { YandexGPTConfig } from './types';
import { BaseGPTConfig } from '../../types/GPTConfig';
import { GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes';
export declare class YandexGPTProvider implements IProvider {
    private readonly config;
    private readonly providerName?;
    private accessToken?;
    private updateTokenTimer?;
    private network?;
    constructor(config: BaseGPTConfig, providerName?: string);
    init(): Promise<boolean>;
    getConfig(): YandexGPTConfig;
    authenticate(): Promise<boolean>;
    completion(request: GPTRequest, onStreamCallback?: (chunk: string) => void): Promise<GPTMessageEntity | string | void>;
    isAvailable(): Promise<boolean>;
    private initNetworkInstance;
}
