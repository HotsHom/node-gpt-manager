import { BaseGPTConfig } from '../../types/GPTConfig';
export type GigaChatConfig = BaseGPTConfig & {
    clientSecret: string;
    authData: string;
    clientID: string;
    scope: string;
};
export declare const isGigaChatConfig: (config: BaseGPTConfig) => config is GigaChatConfig;
