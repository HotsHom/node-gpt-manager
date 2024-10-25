"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const types_1 = require("./types");
const axios_1 = __importDefault(require("axios"));
class OpenAIProvider {
    constructor(config, providerName) {
        if (!(0, types_1.isOpenAIConfig)(config)) {
            throw new Error('Invalid configuration for OpenAIProvider');
        }
        this.config = config;
        this.providerName = providerName;
    }
    async init() {
        return true;
    }
    getConfig() {
        return this.config;
    }
    async authenticate() {
        try {
            this.network = axios_1.default.create({
                baseURL: 'https://api.openai.com/v1',
                headers: {
                    Authorization: `Bearer ${this.config.openAiApiKey}`,
                    'Content-Type': 'application/json',
                },
            });
            const { data } = await this.network.get('/models');
            return !!data.object;
        }
        catch (error) {
            console.error(`Error generating new Access Token for [${this.providerName}] with error: ${error}`);
            return false;
        }
    }
    async completion(request, onStreamCallback) {
        try {
            if (!this.network) {
                throw new Error('Network is not initialized, call authenticate() first');
            }
            const { data } = await this.network.post('/chat/completions', {
                model: this.config.model ?? 'gpt-4o',
                messages: request,
            }, {
                responseType: onStreamCallback ? 'stream' : 'json',
            });
            if (onStreamCallback) {
                data.on('data', (chunk) => {
                    const lines = chunk
                        .toString('utf8')
                        .split('\n')
                        .filter(line => line.trim().startsWith('data: '));
                    for (const line of lines) {
                        const content = line.replace('data: ', '');
                        if (content === '[DONE]') {
                            break;
                        }
                        try {
                            const parsed = JSON.parse(content);
                            const gptChunk = parsed.choices[0].delta?.content || '';
                            onStreamCallback(gptChunk);
                        }
                        catch (error) {
                            console.error('Ошибка парсинга:', error);
                        }
                    }
                });
            }
            else {
                return data.choices[0].message;
            }
        }
        catch (e) {
            return `Generating message abort with error: ${JSON.stringify(e)}`;
        }
    }
    async isAvailable() {
        try {
            await this.authenticate();
            if (!this.network) {
                throw new Error('Network is not initialized, call authenticate() first');
            }
            const { data } = await this.network.get('/models');
            return !!data.object;
        }
        catch (e) {
            console.log(`Connection service error ${e}`);
            return false;
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
