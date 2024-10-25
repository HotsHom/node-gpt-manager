"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GigaChatProvider = void 0;
const types_1 = require("./types");
const axios_1 = __importDefault(require("axios"));
const uuid4_1 = __importDefault(require("uuid4"));
class GigaChatProvider {
    constructor(config, providerName) {
        if (!(0, types_1.isGigaChatConfig)(config)) {
            throw new Error('Invalid configuration for GigaChatProvider');
        }
        this.config = config;
        this.providerName = providerName;
    }
    getConfig() {
        return this.config;
    }
    async authenticate() {
        try {
            const uuid = (0, uuid4_1.default)();
            const { data } = await axios_1.default.post('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
                scope: 'GIGACHAT_API_PERS', // TODO мейби вынести в интерфейс провайдера
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                    RqUID: uuid,
                    Authorization: `Basic ${this.config?.authData}`,
                },
            });
            this.accessToken = data.access_token;
            this.updateTokenTimer = setTimeout(() => {
                this.authenticate();
            }, 1000 * 60 * 30);
            this.initNetworkInstance();
            return true;
        }
        catch (e) {
            console.log(`Error generating new Access Token for [${this.providerName}] with error: ${e}`);
            return false;
        }
    }
    init() {
        return Promise.resolve(false);
    }
    async completion(request, onStreamCallback) {
        try {
            await this.authenticate();
            if (!this.accessToken) {
                throw new Error('AccessToken is not initialized, call authenticate() first');
            }
            if (!this.network) {
                throw new Error('Network is not initialized, call authenticate() first');
            }
            const { data } = await this.network.post('/chat/completions', {
                model: 'GigaChat:latest',
                max_tokens: this.config?.maxTokensCount,
                messages: request,
            });
            return data.choices[0].message;
        }
        catch (e) {
            console.log(`Generating message error: ${e}`);
            return `Generating message abort with error: ${JSON.stringify(e)}`;
        }
    }
    async isAvailable() {
        try {
            if (!this.accessToken) {
                throw new Error('AccessToken is not initialized, call authenticate() first');
            }
            if (!this.network) {
                throw new Error('Network is not initialized, call authenticate() first');
            }
            const { data } = await this.network.get('/models');
            return !!data;
        }
        catch (e) {
            console.log(`Connection service error ${e}`);
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
            baseURL: 'https://gigachat.devices.sberbank.ru/api/v1',
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/json',
            },
        });
    }
}
exports.GigaChatProvider = GigaChatProvider;
