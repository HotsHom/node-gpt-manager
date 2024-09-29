import { BaseGPTConfig } from '../../types/GPTConfig'
import { GigaChatConfig, isGigaChatConfig } from './types'
import { IProvider } from '../IProvider.interface'
import { GPTMessageEntity, GPTRequest } from '../../types/GPTRequestTypes'
import axios, { AxiosInstance } from 'axios'
import uuid4 from 'uuid4'
import { OpenAIConfig } from '../OpenAI/types'

export class GigaChatProvider implements IProvider {
  static readonly ConfigType: GigaChatConfig
  private readonly config: GigaChatConfig
  private readonly providerName?: string
  private network?: AxiosInstance
  private accessToken?: string
  private updateTokenTimer?: NodeJS.Timeout

  constructor(config: BaseGPTConfig, providerName?: string) {
    if (!isGigaChatConfig(config)) {
      throw new Error('Invalid configuration for GigaChatProvider')
    }
    this.config = config
    this.providerName = providerName
  }

  getConfig(): GigaChatConfig {
    return this.config
  }

  async authenticate(): Promise<boolean> {
    try {
      const uuid = uuid4()
      const { data } = await axios.post(
        'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
        {
          scope: 'GIGACHAT_API_PERS', // TODO мейби вынести в интерфейс провайдера
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            RqUID: uuid,
            Authorization: `Basic ${this.config?.authData}`,
          },
        }
      )
      this.accessToken = data.access_token
      this.updateTokenTimer = setTimeout(
        () => {
          this.authenticate()
        },
        1000 * 60 * 30
      )
      this.initNetworkInstance()
      return true
    } catch (e) {
      console.log(`Error generating new Access Token for [${this.providerName}] with error: ${e}`)
      return false
    }
  }

  init(): Promise<boolean> {
    return Promise.resolve(false)
  }

  async completion(
    request: GPTRequest,
    onStreamCallback?: (chunk: string) => void
  ): Promise<GPTMessageEntity | string | void> {
    try {
      await this.authenticate()
      if (!this.accessToken) {
        throw new Error('AccessToken is not initialized, call authenticate() first')
      }

      if (!this.network) {
        throw new Error('Network is not initialized, call authenticate() first')
      }

      const { data } = await this.network.post('/chat/completions', {
        model: 'GigaChat:latest',
        max_tokens: this.config?.maxTokensCount,
        messages: request,
      })

      return data.choices[0].message
    } catch (e) {
      console.log(`Generating message error: ${e}`)
      return `Generating message abort with error: ${JSON.stringify(e)}`
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        throw new Error('AccessToken is not initialized, call authenticate() first')
      }

      if (!this.network) {
        throw new Error('Network is not initialized, call authenticate() first')
      }

      const { data } = await this.network.get('/models')

      return !!data
    } catch (e) {
      console.log(`Connection service error ${e}`)
      return false
    }
  }

  private initNetworkInstance() {
    if (this.network) {
      return
    }
    if (!this.accessToken) {
      throw new Error('AccessToken is not initialized, call authenticate() first')
    }

    this.network = axios.create({
      baseURL: 'https://gigachat.devices.sberbank.ru/api/v1',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    })
  }
}
