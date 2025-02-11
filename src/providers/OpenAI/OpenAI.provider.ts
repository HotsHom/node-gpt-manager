import { IProvider } from '../IProvider.interface'
import { BaseGPTConfig } from '../../types/GPTConfig'
import { GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes'
import { isOpenAIConfig, OpenAIConfig } from './types'
import axios, { AxiosInstance } from 'axios'
import { hasInputAudio } from '../../helpers/hasInputAudio.helper'
import {getLastPDFUrl, hasInputPDFHelper} from "../../helpers/hasInputPDF.helper";
import * as fs from "fs";
import FormData from "form-data";
import path from "node:path";

export class OpenAIProvider implements IProvider {
  private readonly config: OpenAIConfig
  private readonly providerName?: string
  private network?: AxiosInstance

  constructor(config: BaseGPTConfig, providerName?: string) {
    if (!isOpenAIConfig(config)) {
      throw new Error('Invalid configuration for OpenAIProvider')
    }
    this.config = config
    this.providerName = providerName
  }

  async init(): Promise<boolean> {
    return true
  }

  getConfig(): OpenAIConfig {
    return this.config
  }

  async authenticate(): Promise<boolean> {
    try {
      this.network = axios.create({
        baseURL: 'https://api.openai.com/v1',
        headers: {
          Authorization: `Bearer ${this.config.openAiApiKey}`,
          'Content-Type': 'application/json',
        },
      })
      const { data } = await this.network.get('/models')
      return !!data.object
    } catch (error) {
      console.error(
        `Error generating new Access Token for [${this.providerName}] with error: ${error}`
      )
      return false
    }
  }

  async completion(
    request: GPTRequest,
    onStreamCallback?: (chunk: string) => void,
    shouldAbort?: () => boolean
  ): Promise<GPTMessageEntity | string | void> {
    try {
      if (!this.network) {
        throw new Error('Network is not initialized, call authenticate() first')
      }

      let fileId: string | undefined
      if (hasInputPDFHelper(request)) {
        const pdfUrl = getLastPDFUrl(request)
        if (pdfUrl) {
          try {
            const fileResponse = await axios.get(pdfUrl, { responseType: 'arraybuffer' })

            const formData = new FormData();
            formData.append('file', Buffer.from(fileResponse.data), {
              filename: 'document.pdf',
              contentType: 'application/pdf',
            });
            formData.append('purpose', 'assistants');

            const response = await this.network.post('/files', formData, {
              headers: {
                ...formData.getHeaders()
              }
            })
            fileId = response.data.id
            if (Array.isArray(request)) {
              request.forEach(msg => {
                if (Array.isArray(msg.content)) {
                  msg.content = msg.content.filter(item => item.type !== 'pdf_url');
                } else if (msg.content && typeof msg.content === 'object' && msg.content.type === 'pdf_url') {
                  msg.content = { type: 'text', text: '' };
                }
              });
            }
          } catch (e) {
            console.log('[Error][Files]', e)
            return `Generating message abort with error: ${JSON.stringify(e)}`
          }
        }
      }

      const { data } = await this.network.post(
        '/chat/completions',
        {
          model: hasInputAudio(request) ? 'gpt-4o-audio-preview' : (this.config.model ?? 'gpt-4o'),
          messages: request,
          stream: !!onStreamCallback,
          file_ids: fileId ? [fileId] : [],
        },
        {
          responseType: onStreamCallback ? 'stream' : 'json',
        }
      )

      if (onStreamCallback) {
        data.on('data', (chunk: Buffer) => {
          if (shouldAbort && shouldAbort()) {
            console.warn(`shouldAbort ${shouldAbort()}`)
            onStreamCallback('[DONE]')
            data.destroy()
          }

          const lines = chunk
            .toString('utf8')
            .split('\n')
            .filter(line => line.trim().startsWith('data: '))

          for (const line of lines) {
            const content = line.replace('data: ', '')
            if (content === '[DONE]') {
              onStreamCallback('[DONE]')
              break
            }

            try {
              const parsed = JSON.parse(content)
              const gptChunk = parsed.choices[0].delta?.content || ''
              onStreamCallback(gptChunk)
            } catch (error) {
              console.error('Ошибка парсинга:', error)
            }
          }
        })
      } else {
        return data.choices[0].message
      }
    } catch (e) {
      console.log('[Error][Completion]', e)
      return `Generating message abort with error: ${JSON.stringify(e)}`
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.authenticate()
      if (!this.network) {
        throw new Error('Network is not initialized, call authenticate() first')
      }

      const { data } = await this.network.get('/models')
      return !!data.object
    } catch (e) {
      console.log(`Connection service error ${e}`)
      return false
    }
  }
}
