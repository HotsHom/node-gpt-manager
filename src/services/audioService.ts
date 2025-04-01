import { GPTContentOfMessage, GPTMessageEntity } from '../types/GPTRequestTypes';
import axios from 'axios';
import { TokenService } from './tokenService';

export class AudioService {
  private readonly isTranscribeAudioServiceProcess: boolean = false;
  private static instance: AudioService | null = null;

  constructor() {
    this.isTranscribeAudioServiceProcess = true;
  }

  static getService() {
    if (!AudioService.instance?.isTranscribeAudioServiceProcess) {
      AudioService.instance = new AudioService();
    }

    return AudioService.instance;
  }

  async sendAudioMessage(
    messages: GPTMessageEntity[],
    onStreamCallback?: (chunk: string) => void,
    shouldAbort?: () => boolean
  ): Promise<GPTMessageEntity | string | undefined> {
    const lastAudioMessage = this.getLastAudioMessage(messages);
    console.log(`lastAudioMessage ${JSON.stringify(lastAudioMessage)}`)
    console.log(`messages[0] ${JSON.stringify(messages[messages.length - 1])}`)
    const openAiToken = TokenService.getTokenService().getTokenByType('openAi');

    if (!openAiToken) throw new Error(`OpenAIToken is not initialized`);

    if (lastAudioMessage && lastAudioMessage === messages[messages.length - 1]) {
      try {
        const { data } = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4o-audio-preview',
            messages: lastAudioMessage,
            stream: !!onStreamCallback,
          },
          {
            responseType: onStreamCallback ? 'stream' : 'json',
            headers: {
              Authorization: `Bearer ${openAiToken}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (onStreamCallback) {
          data.on('data', (chunk: Buffer) => {
            if (shouldAbort && shouldAbort()) {
              console.warn(`shouldAbort ${shouldAbort()}`);
              onStreamCallback('[DONE]');
              data.destroy();
            }

            const lines = chunk
              .toString('utf8')
              .split('\n')
              .filter(line => line.trim().startsWith('data: '));

            for (const line of lines) {
              const content = line.replace('data: ', '');
              if (content === '[DONE]') {
                onStreamCallback('[DONE]');
                break;
              }

              try {
                const parsed = JSON.parse(content);
                const gptChunk = parsed.choices[0].delta?.content || '';
                onStreamCallback(gptChunk);
              } catch (error) {
                console.error('Ошибка парсинга:', error);
              }
            }
          });
        } else {
          return data.choices[0].message;
        }
      } catch (e) {
        console.log('[Error][Completion]', e);
        return `Generating message abort with error: ${JSON.stringify(e)}`;
      }
    }
  }

  //TODO оставить для возможной интеграции speechkit
  // async findAndTranscribeAudio(request: GPTMessageEntity[], access_token: string) {
  //   const audioMessage = this.getLastAudioMessage(request);
  //   console.log(`audioMessage ${JSON.stringify(audioMessage?.content.input_audio)}`);
  //
  //   if (!audioMessage || !audioMessage.content.input_audio?.data) {
  //     return undefined;
  //   }
  //
  //   try {
  //     const storageUrl = await this.uploadFile(audioMessage, access_token);
  //     if (!storageUrl) return undefined;
  //
  //     const response = await axios.post(
  //       'https://stt.api.cloud.yandex.net/stt/v3/recognizeFileAsync',
  //       {
  //         uri: storageUrl,
  //         recognitionModel: {
  //           model: 'general',
  //           audioFormat: {
  //             containerAudio: {
  //               containerAudioType: 'WAV',
  //             },
  //           },
  //         },
  //       },
  //       {
  //         headers: {
  //           Authorization: `Bearer ${access_token}`,
  //         },
  //       }
  //     );
  //
  //     if (response.data.error) {
  //       console.error(`Error transcribe audio ${JSON.stringify(response.data.error.message)}`);
  //       throw new Error(
  //         `Failed transcribe audio with error: ${JSON.stringify(response.data.error.message)}`
  //       );
  //     }
  //
  //     const operationId = response.data.id;
  //
  //     const result = await this.waitUntilDone(operationId, access_token);
  //
  //     const transcriptionText: string = result.response.chunks[0].alternatives[0].text;
  //     const index = audioMessage.index;
  //
  //     return { transcriptionText, index };
  //   } catch (e) {
  //     console.error(`Error transcribe audio ${JSON.stringify(e)}`);
  //     throw new Error(`Failed transcribe audio with error: ${JSON.stringify(e)}`);
  //   }
  // }
  //
  // private async uploadFile(
  //   audioMessage: { content: GPTContentOfMessage; index: number },
  //   access_token: string
  // ) {
  //   try {
  //     if (!audioMessage || !audioMessage.content.input_audio?.data) {
  //       return undefined;
  //     }
  //
  //     const buffer = Buffer.from(audioMessage.content.input_audio.data, 'base64');
  //     const date = new Date();
  //     const dateStr = date.toISOString().replace(/:/g, '-').replace(/T/g, '_').replace(/Z/g, '');
  //     const randomPart = Math.random().toString(36).substring(2);
  //     const fileName = `audio_${dateStr}_${randomPart}`;
  //     const storageUrl = `https://storage.yandexcloud.net/afilado-speechkit/${encodeURI(fileName)}`;
  //
  //     console.log(`storageUrl ${storageUrl}`);
  //
  //     await axios.put(storageUrl, buffer, {
  //       headers: {
  //         Authorization: `Bearer ${access_token}`,
  //         'Content-Type': 'audio/wav',
  //       },
  //     });
  //
  //     return storageUrl;
  //   } catch (e) {
  //     console.error(`Error uploading: ${JSON.stringify(e)}`);
  //     throw new Error(`Failed to upload with error: ${JSON.stringify(e)}`);
  //   }
  // }
  //
  private getLastAudioMessage(request: GPTMessageEntity[]) {
    const extractContent = (
      content: string | GPTContentOfMessage | GPTContentOfMessage[]
    ): GPTContentOfMessage[] => {
      if (typeof content === 'string') return [];
      return Array.isArray(content) ? content : [content];
    };

    for (let index = request.length - 1; index >= 0; index--) {
      const message = request[index];
      const contents = extractContent(message.content);
      for (const content of contents) {
        if (content.type === 'input_audio' && content.input_audio?.data) {
          return message;
        }
      }
    }
    return null;
  }
  //
  // private async waitUntilDone(operationId: string, access_token: string) {
  //   while (true) {
  //     try {
  //       const response = await axios.get(
  //         `https://operation.api.cloud.yandex.net/operations/${operationId}`,
  //         {
  //           headers: {
  //             Authorization: `Bearer ${access_token}`,
  //           },
  //         }
  //       );
  //       const status = response.data.done;
  //       if (status) {
  //         return response.data;
  //       }
  //       await new Promise(res => setTimeout(res, 1000));
  //     } catch (e) {
  //       console.error(`Get recognition status error ${JSON.stringify(e)}`);
  //       throw new Error(`Failed to get recognition status with error: ${JSON.stringify(e)}`);
  //     }
  //   }
  // }
}
