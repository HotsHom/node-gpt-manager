import { JWK, JWS } from 'node-jose';
import { IProvider } from '../IProvider.interface';
import { isYandexGPTConfig, YandexGPTConfig } from './types';
import { BaseGPTConfig } from '../../types/GPTConfig';
import { clearTimeout } from 'node:timers';
import { GPTMessageEntity, GPTRequest, YandexGPTMessageEntity } from '../../types/GPTRequestTypes';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';

export class YandexGPTProvider implements IProvider {
  private readonly config: YandexGPTConfig;
  private readonly providerName?: string;
  private accessToken?: string;
  private updateTokenTimer?: NodeJS.Timeout;
  private network?: AxiosInstance;

  constructor(config: BaseGPTConfig, providerName?: string) {
    if (!isYandexGPTConfig(config)) {
      throw new Error('Invalid configuration for YandexGPTProvider');
    }
    this.config = config;
    this.providerName = providerName;
  }

  async init(): Promise<boolean> {
    return true;
  }

  async authenticate(): Promise<boolean> {
    try {
      if (this.updateTokenTimer) {
        clearTimeout(this.updateTokenTimer);
      }
      const key = JSON.parse(fs.readFileSync(this.config.certificatePath, 'utf8'));
      const nowTime = Math.floor(Date.now() / 1000);
      const payload = {
        aud: 'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        iss: this.config.identifier,
        iat: nowTime,
        exp: nowTime + 3600,
      };
      const createdKey = await JWK.asKey(key.private_key, 'pem', {
        kid: this.config.openKeyIdentifier,
        alg: 'PS256',
      });
      const jwt = await JWS.createSign({ format: 'compact' }, createdKey)
        .update(JSON.stringify(payload))
        .final();
      const response = await axios.post('https://iam.api.cloud.yandex.net/iam/v1/tokens', {
        jwt,
      });
      this.accessToken = response.data.iamToken;
      this.updateTokenTimer = setTimeout(
        () => {
          this.authenticate();
        },
        1000 * 60 * 60
      );
      this.initNetworkInstance();
      return true;
    } catch (error) {
      console.error(
        `Error generating new Access Token for [${this.providerName}] with error: ${error}`
      );
      return false;
    }
  }

  async completion(
    request: GPTRequest
  ): Promise<GPTMessageEntity | YandexGPTMessageEntity | string> {
    try {
      if (!this.accessToken) {
        throw new Error('AccessToken is not initialized, call authenticate() first');
      }

      if (!this.network) {
        throw new Error('Network is not initialized, call authenticate() first');
      }

      const gptModel = `gpt://${this.config.folderIdentifier}/yandexgpt-lite/latest`;
      const requestTemperature = Math.min(1, Math.max(0, this.config.temperature));
      const { data } = await this.network.post('/completion', {
        modelUri: gptModel,
        completionOptions: {
          stream: false,
          temperature: requestTemperature,
          maxTokens: this.config.maxTokensCount,
        },
        messages: request,
      });

      return data.alternatives[0].message;
    } catch (e) {
      console.log(`Generating message error: ${e}`);
      return `Generating message abort with error: ${JSON.stringify(e)}`;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.authenticate();
      if (!this.accessToken) {
        throw new Error('AccessToken is not initialized, call authenticate() first');
      }

      if (!this.network) {
        throw new Error('Network is not initialized, call authenticate() first');
      }
      const gptModel = `gpt://${this.config.folderIdentifier}/yandexgpt-lite/latest`;
      const { data } = await this.network.post('/tokenize', {
        modelUri: gptModel,
        text: 'x',
      });

      return !!data.tokens;
    } catch (e) {
      console.log(`Connection error ${e}`);
      return false;
    }
  }

  private initNetworkInstance() {
    if (this.network) {
      return;
    }
    if (!this.accessToken) {
      throw new Error('AccessToken is not initialized, call authenticate() first');
    }

    this.network = axios.create({
      baseURL: 'https://llm.api.cloud.yandex.net/foundationModels/v1',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }
}
