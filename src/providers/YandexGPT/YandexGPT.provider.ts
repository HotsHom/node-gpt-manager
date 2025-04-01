import { JWK, JWS } from 'node-jose';
import { IProvider } from '../IProvider.interface';
import { isYandexGPTConfig, YandexGPTConfig } from './types';
import { BaseGPTConfig } from '../../types/GPTConfig';
import { clearTimeout } from 'node:timers';
import { GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import { GPTRoles } from '../../constants/GPTRoles';
import { chunkMessages } from '../../helpers/chunk.helper';
import { TokenService } from '../../services/tokenService';
import { AudioService } from '../../services/audioService';

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

      if (this.accessToken) TokenService.getTokenService().setToken(this.accessToken, 'yandex');

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
      if (!this.accessToken)
        throw new Error('AccessToken is not initialized, call authenticate() first');

      if (!this.network) throw new Error('Network is not initialized, call authenticate() first');

      const gptModel = `gpt://${this.config.folderIdentifier}/yandexgpt/latest`;
      const requestTemperature = Math.min(1, Math.max(0, this.config.temperature));

      const messages: GPTMessageEntity[] =
        typeof request === 'string' ? [{ role: GPTRoles.USER, content: request }] : request;

      const audioData = await AudioService.getService().sendAudioMessage(
        messages,
        onStreamCallback,
        shouldAbort
      );

      if (audioData && typeof audioData === 'string') {
        return { role: GPTRoles.ASSISTANT, content: audioData };
      } else {
        const chunks = chunkMessages(messages, {
          maxTokens: 2048,
          overlap: 200,
          model: 'gpt-4o',
        });

        let fullResponse = '';
        const processChunk = async (chunk: GPTMessageEntity[]) => {
          if (!this.network)
            throw new Error('Network is not initialized, call authenticate() first');

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
      }

      // const yandexToken = TokenService.getTokenService().getTokenByType('yandex');
      //
      // if (hasInputAudio(request) && yandexToken) {
      //   const audioText = await AudioService.getService().findAndTranscribeAudio(
      //     messages,
      //     yandexToken
      //   );
      //
      //   if (audioText) {
      //     messages[audioText.index].content = {
      //       type: 'text',
      //       text: audioText.transcriptionText,
      //       input_audio: undefined,
      //       image_url: undefined,
      //     };
      //   }
      // }
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
