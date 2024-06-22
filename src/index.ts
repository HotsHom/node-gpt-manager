// type gptNames = 'YandexGPT' | 'MyCustomGPT';
// type gptConfigs = {
//   MyCustomGPT: BaseGPTConfig;
//   YandexGPT: YandexGPTConfig;
// };
// async function init() {
//   const manager = await GPTManager.init<gptNames, gptConfigs>({
//     MyCustomGPT: {
//       maxTokensCount: 1,
//       generateAttemptsCount: 1,
//       id: '123',
//       transformerValue: 1,
//       provider: GigaChatProvider,
//     },
//     YandexGPT: {
//       identifier: 'YandexGPT',
//       openKeyIdentifier: 'YandexGPT',
//       maxTokensCount: 1,
//       generateAttemptsCount: 1,
//       id: '456',
//       transformerValue: 1,
//       provider: YandexGPTProvider,
//       certificatePath: 'YandexGPT',
//     },
//   });
//   manager?.setStrategy(new ParallelRequestsStrategy(manager));
//   manager?.completion([
//     {
//       role: GPTRoles.ASSISTANT,
//       content: 'wfwfwf',
//     },
//   ]);
//   manager?.setStrategy(new FallbackStrategy(manager, 'MyCustomGPT'));
//   manager?.completion([
//     {
//       role: GPTRoles.ASSISTANT,
//       content: 'wfwfwf',
//     },
//   ]);
// }

export { GPTManager } from './gptManager/GPTManager';
export { IGPTManager } from './gptManager/IGPTManager.interface';

export { GPTRequest } from './types/GPTRequestTypes';
export { GPTRoles } from './constants/GPTRoles';
export { GPTProviderType, GPTProviderClassMapType } from './constants/GPTProviderClassMapType';
export { BaseGPTConfig, GPTConfigsInitType } from './types/GPTConfig';

export { IStrategy } from './strategies/IStrategy.interfrace';
export { FallbackStrategy } from './strategies/Fallback.strategy';
export { ParallelRequestsStrategy } from './strategies/ParallelRequests.strategy';
export { FirstSuccessStrategy } from './strategies/FirstSuccess.strategy';
export { PriorityBasedStrategy } from './strategies/PriorityBased.strategy';

export { IProvider } from './providers/IProvider.interface';

export { YandexGPTProvider } from './providers/YandexGPT/YandexGPT.provider';
export * as YandexGPTProviderTypes from './providers/YandexGPT/YandexGPT.provider';

export { GigaChatProvider } from './providers/GigaChat/GigaChat.provider';
export * as GigaChatProviderTypes from './providers/GigaChat/types';

export { OpenAIProvider } from './providers/OpenAI/OpenAI.provider';
export * as OpenAIProviderTypes from './providers/OpenAI/types';
