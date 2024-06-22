import { BaseGPTConfig } from '../../types/GPTConfig';

export type YandexGPTConfig = BaseGPTConfig & {
  identifier: string;
  openKeyIdentifier: string;
  certificatePath: string;
};

export const isYandexGPTConfig = (config: BaseGPTConfig): config is YandexGPTConfig => {
  return 'identifier' in config && 'openKeyIdentifier' in config;
};
