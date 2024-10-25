"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProviderTypes = exports.OpenAIProvider = exports.GigaChatProviderTypes = exports.GigaChatProvider = exports.YandexGPTProviderTypes = exports.YandexGPTProvider = exports.PriorityBasedStrategy = exports.FirstSuccessStrategy = exports.ParallelRequestsStrategy = exports.FallbackStrategy = exports.GPTRoles = exports.GPTManager = void 0;
var GPTManager_1 = require("./gptManager/GPTManager");
Object.defineProperty(exports, "GPTManager", { enumerable: true, get: function () { return GPTManager_1.GPTManager; } });
var GPTRoles_1 = require("./constants/GPTRoles");
Object.defineProperty(exports, "GPTRoles", { enumerable: true, get: function () { return GPTRoles_1.GPTRoles; } });
var Fallback_strategy_1 = require("./strategies/Fallback.strategy");
Object.defineProperty(exports, "FallbackStrategy", { enumerable: true, get: function () { return Fallback_strategy_1.FallbackStrategy; } });
var ParallelRequests_strategy_1 = require("./strategies/ParallelRequests.strategy");
Object.defineProperty(exports, "ParallelRequestsStrategy", { enumerable: true, get: function () { return ParallelRequests_strategy_1.ParallelRequestsStrategy; } });
var FirstSuccess_strategy_1 = require("./strategies/FirstSuccess.strategy");
Object.defineProperty(exports, "FirstSuccessStrategy", { enumerable: true, get: function () { return FirstSuccess_strategy_1.FirstSuccessStrategy; } });
var PriorityBased_strategy_1 = require("./strategies/PriorityBased.strategy");
Object.defineProperty(exports, "PriorityBasedStrategy", { enumerable: true, get: function () { return PriorityBased_strategy_1.PriorityBasedStrategy; } });
var YandexGPT_provider_1 = require("./providers/YandexGPT/YandexGPT.provider");
Object.defineProperty(exports, "YandexGPTProvider", { enumerable: true, get: function () { return YandexGPT_provider_1.YandexGPTProvider; } });
exports.YandexGPTProviderTypes = __importStar(require("./providers/YandexGPT/YandexGPT.provider"));
var GigaChat_provider_1 = require("./providers/GigaChat/GigaChat.provider");
Object.defineProperty(exports, "GigaChatProvider", { enumerable: true, get: function () { return GigaChat_provider_1.GigaChatProvider; } });
exports.GigaChatProviderTypes = __importStar(require("./providers/GigaChat/types"));
var OpenAI_provider_1 = require("./providers/OpenAI/OpenAI.provider");
Object.defineProperty(exports, "OpenAIProvider", { enumerable: true, get: function () { return OpenAI_provider_1.OpenAIProvider; } });
exports.OpenAIProviderTypes = __importStar(require("./providers/OpenAI/types"));
