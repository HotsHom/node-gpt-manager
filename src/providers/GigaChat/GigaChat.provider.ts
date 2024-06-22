import { BaseGPTConfig } from '../../types/GPTConfig';
import { GigaChatConfig, isGigaChatConfig } from './types';
import { IProvider } from '../IProvider.interface';
import { GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes';

export class GigaChatProvider implements IProvider {
  static ConfigType: GigaChatConfig;
  private readonly providerName?: string;

  protected readonly config: typeof GigaChatProvider.ConfigType | undefined;

  constructor(config: BaseGPTConfig, providerName?: string) {
    if (!isGigaChatConfig(config)) {
      throw new Error('Invalid configuration for GigaChatProvider');
    }
    this.config = config;
    this.providerName = providerName;
  }

  authenticate(): Promise<boolean> {
    return Promise.resolve(false);
  }

  init(): Promise<boolean> {
    return Promise.resolve(false);
  }

  completion(request: GPTRequest): Promise<GPTMessageEntity | string> {
    return Promise.resolve(request.toString());
  }
}
