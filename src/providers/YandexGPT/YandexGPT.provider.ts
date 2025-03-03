import { JWK, JWS } from 'node-jose';
import { IProvider } from '../IProvider.interface';
import { isYandexGPTConfig, YandexGPTConfig } from './types';
import { BaseGPTConfig } from '../../types/GPTConfig';
import { clearTimeout } from 'node:timers';
import { GPTContentOfMessage, GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { GPTRoles } from '../../constants/GPTRoles';

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

  getConfig(): YandexGPTConfig {
    return this.config;
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
    request: GPTRequest,
    onStreamCallback?: (chunk: string) => void,
    shouldAbort?: () => boolean
  ): Promise<GPTMessageEntity | string | void> {
    try {
      if (!this.accessToken) {
        throw new Error('AccessToken is not initialized, call authenticate() first');
      }
      if (!this.network) {
        throw new Error('Network is not initialized, call authenticate() first');
      }

      const gptModel = `gpt://${this.config.folderIdentifier}/yandexgpt/latest`;
      const requestTemperature = Math.min(1, Math.max(0, this.config.temperature));
      const maxTokens = 2048;
      const overlap = 200;
      const tokenizer = encoding_for_model('gpt-4o');

      const messages: GPTMessageEntity[] =
        typeof request === 'string' ? [{ role: GPTRoles.USER, content: request }] : request;

      const extractText = (
        content: string | GPTContentOfMessage | GPTContentOfMessage[]
      ): string => {
        if (typeof content === 'string') return content;
        if (Array.isArray(content)) return content.map(extractText).join(' ');
        if ('type' in content && content.type === 'text' && content.text) return content.text;
        return '';
      };

      const chunks: GPTMessageEntity[][] = [];
      let currentChunk: GPTMessageEntity[] = [];
      let tokenCount = 0;

      for (const message of messages) {
        if (
          typeof message.content !== 'string' &&
          !Array.isArray(message.content) &&
          'type' in message.content &&
          (message.content.type === 'image_url' || message.content.type === 'input_audio')
        ) {
          currentChunk.push(message);
          continue;
        }

        const textContent = extractText(message.content);
        const tokens = tokenizer.encode(textContent);

        if (tokenCount + tokens.length > maxTokens) {
          if (currentChunk.length) chunks.push([...currentChunk]);
          currentChunk = currentChunk.slice(-overlap);
          tokenCount = tokenizer.encode(
            currentChunk.map(m => extractText(m.content)).join(' ')
          ).length;
        }

        currentChunk.push(message);
        tokenCount += tokens.length;
      }

      if (currentChunk.length) chunks.push(currentChunk);

      if (chunks.length === 0) {
        chunks.push([{ role: GPTRoles.USER, content: ' ' }]);
      }

      let fullResponse = '';
      const processChunk = async (chunk: GPTMessageEntity[]) => {
        if (!this.network) throw new Error('Network is not initialized, call authenticate() first');

        const updateRequestChunk = Array.isArray(chunk)
          ? chunk.map(message => ({
              role: message.role,
              text: message.content,
            }))
          : chunk;

        const { data } = await this.network.post(
          '/completion',
          {
            modelUri: gptModel,
            completionOptions: {
              stream: !!onStreamCallback,
              temperature: requestTemperature,
              maxTokens: this.config.maxTokensCount,
            },
            messages: updateRequestChunk,
          },
          { responseType: onStreamCallback ? 'stream' : 'json' }
        );

        if (onStreamCallback) {
          return new Promise<void>((resolve, reject) => {
            data.on('data', (chunk: Buffer) => {
              if (shouldAbort?.()) {
                onStreamCallback('[DONE]');
                data.destroy();
                resolve();
                return;
              }

              const lines = chunk.toString('utf8').split('\n');
              lines
                .filter(line => line.trim())
                .forEach(line => {
                  try {
                    const parsedChunk = JSON.parse(line.trim());
                    const textChunk = parsedChunk?.result?.alternatives?.[0]?.message?.text || '';
                    const status = parsedChunk?.result?.alternatives?.[0]?.status || '';

                    if (textChunk) {
                      const delta = textChunk.slice(fullResponse.length);
                      if (delta) {
                        onStreamCallback(delta);
                      }
                      fullResponse = textChunk;
                    }

                    if (status === 'ALTERNATIVE_STATUS_FINAL') {
                      resolve();
                    }
                  } catch (error) {
                    console.error('Ошибка парсинга строки:', error, 'Строка:', line);
                  }
                });
            });

            data.on('end', () => {
              console.log('Стрим завершен для чанка, fullResponse:', fullResponse);
              onStreamCallback('[DONE]');
              resolve();
            });

            data.on('error', (err: Error) => {
              reject(`Stream error: ${err.message}`);
            });
          });
        } else {
          fullResponse += data.result.alternatives[0].message.text;
        }
      };

      if (onStreamCallback) {
        for (const chunk of chunks) await processChunk(chunk);
      } else {
        await Promise.all(chunks.map(processChunk));
      }

      return onStreamCallback ? undefined : { role: GPTRoles.ASSISTANT, content: fullResponse };
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
      const gptModel = `gpt://${this.config.folderIdentifier}/yandexgpt/latest`;
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
