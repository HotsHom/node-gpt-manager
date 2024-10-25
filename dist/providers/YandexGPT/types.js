"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isYandexGPTConfig = void 0;
const isYandexGPTConfig = (config) => {
    return 'identifier' in config && 'openKeyIdentifier' in config && 'folderIdentifier' in config;
};
exports.isYandexGPTConfig = isYandexGPTConfig;
