"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGigaChatConfig = void 0;
const isGigaChatConfig = (config) => {
    return 'clientSecret' in config && 'clientID' in config;
};
exports.isGigaChatConfig = isGigaChatConfig;
