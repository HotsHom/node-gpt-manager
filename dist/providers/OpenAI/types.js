"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isOpenAIConfig = void 0;
const isOpenAIConfig = (config) => {
    return 'openAiApiKey' in config;
};
exports.isOpenAIConfig = isOpenAIConfig;
