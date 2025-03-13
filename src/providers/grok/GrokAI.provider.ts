import {IProvider} from "../IProvider.interface";
import {isOpenAIConfig, OpenAIConfig} from "../OpenAI/types";
import axios, {AxiosInstance} from "axios";
import {BaseGPTConfig} from "../../types/GPTConfig";
import {GPTMessageEntity, GPTRequest} from "../../types/GPTRequestTypes";
import {GPTRoles} from "../../constants/GPTRoles";
import {chunkMessages} from "../../helpers/chunk.helper";
import {TiktokenModel} from "tiktoken";
import {hasInputAudio} from "../../helpers/hasInputAudio.helper";

export class GrokAIProvider implements IProvider {
  private readonly config: OpenAIConfig;
  private readonly providerName?: string;
  private network?: AxiosInstance;

  constructor(config: BaseGPTConfig, providerName?: string) {
    if (!isOpenAIConfig(config)) {
      throw new Error('Invalid configuration for GrokAIProvider');
    }
    this.config = config;
    this.providerName = providerName;
  }

  async init(): Promise<boolean> {
    return true;
  }

  getConfig(): OpenAIConfig {
    return this.config;
  }

  async authenticate(): Promise<boolean> {
    try {
      this.network = axios.create({
        baseURL: 'https://api.x.ai/v1',
        headers: {
          Authorization: `Bearer ${this.config.openAiApiKey}`,
          'Content-Type': 'application/json',
        },
      });
      const { data } = await this.network.get('/models');
      return !!data.object;
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
      if (!this.network) throw new Error('Network is not initialized, call authenticate() first');

      const messages: GPTMessageEntity[] =
        typeof request === 'string' ? [{ role: GPTRoles.USER, content: request }] : request;

      const chunks = chunkMessages(messages, {
        maxTokens: 2048,
        overlap: 200,
        model: 'gpt-4o',
      });

      let fullResponse = '';

      const processChunk = async (chunk: GPTMessageEntity[]) => {
        if (!this.network) throw new Error('Network is not initialized, call authenticate() first');

        console.log('[DEBUG] Отправка chunk в API:', JSON.stringify(chunk, null, 2));

        const { data } = await this.network.post(
          '/chat/completions',
          {
            model: this.config.model ?? 'grok-2-latest',
            messages: chunk,
            stream: !!onStreamCallback,
          },
          { responseType: onStreamCallback ? 'stream' : 'json' }
        );

        if (onStreamCallback) {
          data.on('data', (chunk: Buffer) => {
            if (shouldAbort?.()) {
              console.warn(`shouldAbort ${shouldAbort()}`);
              onStreamCallback('[DONE]');
              data.destroy();
              return;
            }

            chunk
              .toString('utf8')
              .split('\n')
              .filter(line => line.trim().startsWith('data: '))
              .forEach(line => {
                const content = line.replace('data: ', '');
                if (content === '[DONE]') {
                  onStreamCallback('[DONE]');
                  return;
                }

                try {
                  const gptChunk = JSON.parse(content).choices[0].delta?.content || '';
                  onStreamCallback(gptChunk);
                  fullResponse += gptChunk;
                } catch (error) {
                  console.error('Ошибка парсинга:', error);
                }
              });
          });
        } else {
          fullResponse += data.choices[0].message.content;
        }
      };

      if (onStreamCallback) {
        for (const chunk of chunks) await processChunk(chunk);
      } else {
        await Promise.all(chunks.map(processChunk));
      }

      return onStreamCallback ? undefined : { role: GPTRoles.ASSISTANT, content: fullResponse };
    } catch (e) {
      console.log('[Error][Completion]', e);
      return `Generating message aborted with error: ${JSON.stringify(e)}`;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.authenticate();
      if (!this.network) {
        throw new Error('Network is not initialized, call authenticate() first');
      }

      const { data } = await this.network.get('/models');
      return !!data.object;
    } catch (e) {
      console.log(`Connection service error ${e}`);
      return false;
    }
  }
}