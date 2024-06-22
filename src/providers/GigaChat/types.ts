import { BaseGPTConfig } from '../../types/GPTConfig';

export type GigaChatConfig = BaseGPTConfig & {
  clientSecret: string;
  authData: string;
  clientID: string;
  scope: string;
};

export const isGigaChatConfig = (config: BaseGPTConfig): config is GigaChatConfig => {
  return 'clientSecret' in config && 'clientID' in config;
};
