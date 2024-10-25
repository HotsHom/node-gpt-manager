"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.YandexGPTProvider = void 0;
const node_jose_1 = require("node-jose");
const types_1 = require("./types");
const node_timers_1 = require("node:timers");
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
class YandexGPTProvider {
    constructor(config, providerName) {
        if (!(0, types_1.isYandexGPTConfig)(config)) {
            throw new Error('Invalid configuration for YandexGPTProvider');
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
            if (this.updateTokenTimer) {
                (0, node_timers_1.clearTimeout)(this.updateTokenTimer);
            }
            const key = JSON.parse(fs.readFileSync(this.config.certificatePath, 'utf8'));
            const nowTime = Math.floor(Date.now() / 1000);
            const payload = {
                aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
                iss: this.config.identifier,
                iat: nowTime,
                exp: nowTime + 3600,
            };
            const createdKey = await node_jose_1.JWK.asKey(key.private_key, 'pem', {
                kid: this.config.openKeyIdentifier,
                alg: 'PS256',
            });
            const jwt = await node_jose_1.JWS.createSign({ format: 'compact' }, createdKey)
                .update(JSON.stringify(payload))
                .final();
            const response = await axios_1.default.post('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
                jwt,
            });
            this.accessToken = response.data.iamToken;
            this.updateTokenTimer = setTimeout(() => {
                this.authenticate();
            }, 1000 * 60 * 60);
            this.initNetworkInstance();
            return true;
        }
        catch (error) {
            console.error(`Error generating new Access Token for [${this.providerName}] with error: ${error}`);
            return false;
        }
    }
    async completion(request, onStreamCallback) {
        try {
            if (!this.accessToken) {
                throw new Error('AccessToken is not initialized, call authenticate() first');
            }
            if (!this.network) {
                throw new Error('Network is not initialized, call authenticate() first');
            }
            const gptModel = `gpt://${this.config.folderIdentifier}/yandexgpt/latest`;
            const requestTemperature = Math.min(1, Math.max(0, this.config.temperature));
            const updateRequest = Array.isArray(request)
                ? request.map(message => ({
                    role: message.role,
                    text: message.content,
                }))
                : request;
            const { data } = await this.network.post('/completion', {
                modelUri: gptModel,
                completionOptions: {
                    stream: false,
                    temperature: requestTemperature,
                    maxTokens: this.config.maxTokensCount,
                },
                messages: updateRequest,
            });
            return {
                role: data.result.alternatives[0].message.role,
                content: data.result.alternatives[0].message.text,
            };
        }
        catch (e) {
            console.log(`Generating message error: ${e}`);
            return `Generating message abort with error: ${JSON.stringify(e)}`;
        }
    }
    async isAvailable() {
        try {
            await this.authenticate();
            if (!this.accessToken) {
                throw new Error('AccessToken is not initialized, call authenticate() first');
            }
            if (!this.network) {
                throw new Error('Network is not initialized, call authenticate() first');
            }
            const gptModel = `gpt://${this.config.folderIdentifier}/yandexgpt/latest`;
            const { data } = await this.network.post('/tokenize', {
                modelUri: gptModel,
                text: 'x',
            });
            return !!data.tokens;
        }
        catch (e) {
            console.log(`Connection error ${e}`);
            return false;
        }
    }
    initNetworkInstance() {
        if (this.network) {
            return;
        }
        if (!this.accessToken) {
            throw new Error('AccessToken is not initialized, call authenticate() first');
        }
        this.network = axios_1.default.create({
            baseURL: 'https://llm.api.cloud.yandex.net/foundationModels/v1',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
        });
    }
}
exports.YandexGPTProvider = YandexGPTProvider;
