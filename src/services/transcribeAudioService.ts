import { GPTContentOfMessage, GPTMessageEntity } from '../types/GPTRequestTypes';
import axios from 'axios';

export class TranscribeAudioService {
  private readonly isTranscribeAudioServiceProcess: boolean = false;
  private static instance: TranscribeAudioService | null = null;

  constructor() {
    this.isTranscribeAudioServiceProcess = true;
  }

  static getService() {
    if (!TranscribeAudioService.instance?.isTranscribeAudioServiceProcess) {
      TranscribeAudioService.instance = new TranscribeAudioService();
    }

    return TranscribeAudioService.instance;
  }

  async findAndTranscribeAudio(request: GPTMessageEntity[], access_token: string) {
    const audioMessage = this.getLastAudioMessage(request);

    if (!audioMessage || !audioMessage.content.input_audio?.data) {
      return undefined;
    }

    try {
      const buffer = Buffer.from(audioMessage.content.input_audio.data, 'base64');
      const date = new Date();
      const dateStr = date.toISOString().replace(/:/g, '-').replace(/T/g, '_').replace(/Z/g, '');
      const randomPart = Math.random().toString(36).substring(2);
      const fileName = `audio/${dateStr}_${randomPart}`;
      const storageUrl = `https://storage.yandexcloud.net/afiladoSpeechkit/${encodeURI(fileName)}`;

      await axios.put(storageUrl, buffer, {
        headers: {
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'audio/wav',
        },
      });

      const response = await axios.post(
        'https://stt.api.cloud.yandex.net/stt/v3/recognizeFileAsync',
        {
          uri: storageUrl,
          recognitionModel: {
            model: 'general',
            audioFormat: {
              containerAudio: {
                containerAudioType: 'WAV',
              },
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );

      if (response.data.error) {
        console.error(`Error transcribe audio ${JSON.stringify(response.data.error.message)}`);
        throw new Error(
          `Failed transcribe audio with error: ${JSON.stringify(response.data.error.message)}`
        );
      }

      const operationId = response.data.id;

      const result = await this.waitUntilDone(operationId, access_token);

      const transcriptionText: string = result.response.chunks[0].alternatives[0].text;
      const index = audioMessage.index;

      return { transcriptionText, index };
    } catch (e) {
      console.error(`Error transcribe audio ${JSON.stringify(e)}`);
      throw new Error(`Failed transcribe audio with error: ${JSON.stringify(e)}`);
    }
  }

  private getLastAudioMessage(request: GPTMessageEntity[]) {
    const extractContent = (
      content: string | GPTContentOfMessage | GPTContentOfMessage[]
    ): GPTContentOfMessage[] => {
      if (typeof content === 'string') return [];
      return Array.isArray(content) ? content : [content];
    };

    const contents = request.flatMap(message => extractContent(message.content));
    for (let index = contents.length - 1; index >= 0; index--) {
      const content = contents[index];
      if (content.type === 'input_audio' && content.input_audio?.data) {
        return { content, index };
      }
    }
    return null;
  }

  private async waitUntilDone(operationId: string, access_token: string) {
    while (true) {
      try {
        const response = await axios.get(
          `https://operation.api.cloud.yandex.net/operations/${operationId}`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          }
        );
        const status = response.data.done;
        if (status) {
          return response.data;
        }
        await new Promise(res => setTimeout(res, 1000));
      } catch (e) {
        console.error(`Get recognition status error ${JSON.stringify(e)}`);
        throw new Error(`Failed to get recognition status with error: ${JSON.stringify(e)}`);
      }
    }
  }
}
