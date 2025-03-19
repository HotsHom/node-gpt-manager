import { YandexGPTConfig } from '../providers/YandexGPT/types';
import axios from 'axios';

export const transcribeAudio = async (audioBase64: string, access_token: string) => {
  try {
    const buffer = Buffer.from(audioBase64, 'base64');
    const fileName = `audio/${new Date()}${Math.random()}`;
    const storageUrl = `https://storage.yandexcloud.net/afilado-speechkit/${fileName}`;

    await axios.put(storageUrl, buffer, {
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'audio/wav',
        'x-amz-acl': 'public-read',
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

    const result = await waitUntilDone(operationId, access_token);

    const transcriptionText = result.response.chunks[0].alternatives[0].text;

    return transcriptionText;
  } catch (e) {
    console.error(`Error transcribe audio ${JSON.stringify(e)}`);
    throw new Error(`Failed transcribe audio with error: ${JSON.stringify(e)}`);
  }
};

export const waitUntilDone = async (operationId: string, access_token: string) => {
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
};
