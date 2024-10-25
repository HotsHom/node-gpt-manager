import { BaseGPTConfig } from '../../types/GPTConfig';
export type YandexGPTConfig = BaseGPTConfig & {
    identifier: string;
    openKeyIdentifier: string;
    certificatePath: string;
    folderIdentifier: string;
    temperature: number;
};
export declare const isYandexGPTConfig: (config: BaseGPTConfig) => config is YandexGPTConfig;
