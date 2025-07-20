import Store from 'electron-store'
import type { SettingsSchema, PartialSettings, AIProvider, ProviderConfig, AIConfig, ValidationResult } from '../types/settings'
import { LLMFactory } from './llm-factory'

// Initialize settings store with defaults
const store = new Store<SettingsSchema>({
  defaults: {
    // Legacy Ollama settings
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: '',
    
    // New provider settings
    aiProvider: 'ollama' as AIProvider,
    providerConfig: {
      provider: 'ollama' as AIProvider,
      model: '',
      url: 'http://localhost:11434'
    }
  }
})

// Ensure defaults are set when the store is first created
function initializeDefaults() {
  const currentUrl = store.get('ollamaUrl')
  
  if (!currentUrl || currentUrl.trim() === '') {
    console.log('Setting default Ollama URL')
    store.set('ollamaUrl', 'http://localhost:11434')
  }
  
  console.log('Settings initialized:', {
    ollamaUrl: store.get('ollamaUrl'),
    ollamaModel: store.get('ollamaModel')
  })
}

// Initialize defaults on startup
initializeDefaults()

export class SettingsService {
  static getOllamaUrl(): string {
    const url = store.get('ollamaUrl')
    console.log('Getting Ollama URL:', url)
    return url
  }

  static setOllamaUrl(url: string): void {
    console.log('Setting Ollama URL:', url)
    store.set('ollamaUrl', url)
  }

  static getOllamaModel(): string {
    const model = store.get('ollamaModel')
    console.log('Getting Ollama Model:', model)
    return model
  }

  static setOllamaModel(model: string): void {
    console.log('Setting Ollama Model:', model)
    store.set('ollamaModel', model)
  }

  // New provider methods
  static getAIProvider(): AIProvider {
    return store.get('aiProvider', 'ollama')
  }

  static setAIProvider(provider: AIProvider): void {
    console.log('Setting AI Provider:', provider)
    store.set('aiProvider', provider)
  }

  static getProviderConfig(): ProviderConfig {
    return store.get('providerConfig', {
      provider: 'ollama',
      model: '',
      url: 'http://localhost:11434'
    })
  }

  static setProviderConfig(config: ProviderConfig): void {
    console.log('Setting Provider Config:', config)
    store.set('providerConfig', config)
  }

  // Unified AI config methods
  static getAIConfig(): AIConfig {
    return {
      provider: this.getAIProvider(),
      config: this.getProviderConfig()
    }
  }

  static async setAIConfig(aiConfig: AIConfig): Promise<ValidationResult> {
    try {
      // Validate and test the configuration using LLMFactory
      const validationResult = await LLMFactory.validateAndTest(aiConfig.config)
      
      if (!validationResult.valid) {
        return validationResult
      }

      // Save the configuration
      this.setAIProvider(aiConfig.provider)
      this.setProviderConfig(aiConfig.config)

      // Update legacy settings for backward compatibility
      if (aiConfig.provider === 'ollama') {
        this.setOllamaUrl(aiConfig.config.url || '')
        this.setOllamaModel(aiConfig.config.model)
      }

      return {
        valid: true,
        errors: [],
        warnings: validationResult.warnings
      }
    } catch (error) {
      console.error('Failed to set AI config:', error)
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred']
      }
    }
  }


  // Legacy validation method - used by LLM service
  static async validateProviderConfig(config: ProviderConfig): Promise<{ valid: boolean; errors: string[] }> {
    const result = LLMFactory.validateConfig(config)
    return { valid: result.valid, errors: result.errors }
  }

  static getAllSettings(): SettingsSchema {
    return {
      ollamaUrl: store.get('ollamaUrl'),
      ollamaModel: store.get('ollamaModel'),
      aiProvider: store.get('aiProvider', 'ollama'),
      providerConfig: store.get('providerConfig', {
        provider: 'ollama',
        model: '',
        url: 'http://localhost:11434'
      })
    }
  }

  static updateSettings(settings: PartialSettings): void {
    if (settings.ollamaUrl !== undefined) {
      store.set('ollamaUrl', settings.ollamaUrl)
    }
    if (settings.ollamaModel !== undefined) {
      store.set('ollamaModel', settings.ollamaModel)
    }
    if (settings.aiProvider !== undefined) {
      store.set('aiProvider', settings.aiProvider)
    }
    if (settings.providerConfig !== undefined) {
      store.set('providerConfig', settings.providerConfig)
    }
  }
}
