import { BaseProvider } from './base-provider'
import { OllamaProvider } from './ollama-provider'
import { OpenAIProvider } from './openai-provider'
import { AnthropicProvider } from './anthropic-provider'
import { GoogleProvider } from './google-provider'
import { AzureOpenAIProvider } from './azure-openai-provider'
import { BedrockProvider } from './bedrock-provider'
import type { AIProvider } from '../../types/settings'

export class ProviderFactory {
  private static providers: Map<AIProvider, BaseProvider> = new Map()

  static {
    this.providers.set('ollama', new OllamaProvider())
    this.providers.set('openai', new OpenAIProvider())
    this.providers.set('anthropic', new AnthropicProvider())
    this.providers.set('google', new GoogleProvider())
    this.providers.set('azure-openai', new AzureOpenAIProvider())
    this.providers.set('bedrock', new BedrockProvider())
  }

  static getProvider(provider: AIProvider): BaseProvider {
    const providerInstance = this.providers.get(provider)
    if (!providerInstance) {
      throw new Error(`Unsupported AI provider: ${provider}`)
    }
    return providerInstance
  }

  static getAllProviders(): BaseProvider[] {
    return Array.from(this.providers.values())
  }

  static getSupportedProviders(): AIProvider[] {
    return Array.from(this.providers.keys())
  }
}