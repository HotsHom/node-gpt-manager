import { BaseGPTConfig } from '../../types/GPTConfig';

export type YandexGPTConfig = BaseGPTConfig & {
  identifier: string;
  openKeyIdentifier: string;
  certificatePath: string;
  folderIdentifier: string;
  temperature: number;
};

export const isYandexGPTConfig = (config: BaseGPTConfig): config is YandexGPTConfig => {
  return 'identifier' in config && 'openKeyIdentifier' in config && 'folderIdentifier' in config;
};
