import { IProvider } from '../IProvider.interface';
import { BaseGPTConfig } from '../../types/GPTConfig';
import { GPTContentOfMessage, GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes';
import { isOpenAIConfig, OpenAIConfig } from './types';
import axios, { AxiosInstance } from 'axios';
import { encoding_for_model, TiktokenModel } from 'tiktoken';
import { GPTRoles } from '../../constants/GPTRoles';
import { hasInputAudio } from '../../helpers/hasInputAudio.helper';

export class OpenAIProvider implements IProvider {
  private readonly config: OpenAIConfig;
  private readonly providerName?: string;
  private network?: AxiosInstance;

  constructor(config: BaseGPTConfig, providerName?: string) {
    if (!isOpenAIConfig(config)) {
      throw new Error('Invalid configuration for OpenAIProvider');
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
        baseURL: 'https://api.openai.com/v1',
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

      const maxTokens = 2048;
      const overlap = 200;
      const tokenizer = encoding_for_model((this.config.model as TiktokenModel) ?? 'gpt-4o');

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

        console.log('[DEBUG] Отправка chunk в API:', JSON.stringify(chunk, null, 2));

        const { data } = await this.network.post(
          '/chat/completions',
          {
            model: hasInputAudio(request)
              ? 'gpt-4o-audio-preview'
              : (this.config.model ?? 'gpt-4o'),
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
