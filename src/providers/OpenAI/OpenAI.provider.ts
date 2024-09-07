import { IProvider } from '../IProvider.interface'
import { BaseGPTConfig } from '../../types/GPTConfig'
import { GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes'
import { isOpenAIConfig, OpenAIConfig } from './types'
import axios, { AxiosInstance } from 'axios'

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

  async completion(request: GPTRequest): Promise<GPTMessageEntity | string> {
    try {
      if (!this.network) {
        throw new Error('Network is not initialized, call authenticate() first')
      }
      const { data } = await this.network.post('/chat/completions', {
        model: this.config.model ?? 'gpt-4o',
        messages: request,
      })
      return data.choices[0].message
    } catch (e) {
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
