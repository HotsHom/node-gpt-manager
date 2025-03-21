export class TokenService {
  private yandexToken: string | undefined = undefined;
  private openAiToken: string | undefined = undefined;
  private grokToken: string | undefined = undefined;
  private static instance: TokenService | null = null;
  private readonly isServiceInProcess: boolean = false;

  constructor() {
    this.isServiceInProcess = true
  }

  static getTokenService () {
    if (!TokenService.instance?.isServiceInProcess) {
      TokenService.instance = new TokenService()
    }

    return TokenService.instance
  }

  setToken(token: string, type: 'yandex' | 'openAi' | 'grok') {
    switch (type) {
      case 'yandex': {
        this.yandexToken = token;
        break;
      }
      case 'grok': {
        this.grokToken = token;
        break;
      }
      case 'openAi': {
        this.openAiToken = token;
        break;
      }
    }
  }

  getTokenByType(type: 'yandex' | 'openAi' | 'grok') {
    switch (type) {
      case 'yandex': {
        return this.yandexToken;
      }
      case 'grok': {
        return this.grokToken;
      }
      case 'openAi': {
        return this.openAiToken;
      }
    }
  }
}
