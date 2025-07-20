import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { ProviderConfig, ValidationResult } from '../types/settings'
import { ProviderFactory } from './providers/provider-factory'

export class LLMFactory {
  private static instances: Map<string, BaseChatModel> = new Map()

  /**
   * Create or get cached LLM instance
   */
  static createLLM(config: ProviderConfig, temperature: number = 0.3): BaseChatModel {
    // Create a cache key based on config
    const cacheKey = this.createCacheKey(config, temperature)
    
    if (this.instances.has(cacheKey)) {
      return this.instances.get(cacheKey)!
    }

    const llm = this.instantiateLLM(config, temperature)
    this.instances.set(cacheKey, llm)
    
    return llm
  }

  /**
   * Create LLM instance without caching (for testing)
   */
  static createTestLLM(config: ProviderConfig): BaseChatModel {
    return this.instantiateLLM(config, 0.3)
  }

  /**
   * Validate configuration and test connection
   */
  static async validateAndTest(config: ProviderConfig): Promise<ValidationResult> {
    try {
      const provider = ProviderFactory.getProvider(config.provider)
      
      // Basic validation first
      const validationResult = provider.validateConfig(config)
      if (!validationResult.valid) {
        return validationResult
      }

      // Test connection
      const testResult = await provider.testConnection(config)
      
      return {
        valid: testResult.valid,
        errors: testResult.errors,
        warnings: [...(validationResult.warnings || []), ...(testResult.warnings || [])]
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed'
      return { valid: false, errors: [errorMessage] }
    }
  }

  /**
   * Validate configuration without testing connection
   */
  static validateConfig(config: ProviderConfig): ValidationResult {
    try {
      const provider = ProviderFactory.getProvider(config.provider)
      return provider.validateConfig(config)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed'
      return { valid: false, errors: [errorMessage] }
    }
  }

  /**
   * Clear cached instances (useful for settings changes)
   */
  static clearCache(): void {
    this.instances.clear()
  }

  /**
   * Get current LLM instance for game usage
   */
  static getCurrentLLM(config: ProviderConfig): BaseChatModel {
    return this.createLLM(config, 0.3)
  }

  // Private helper methods
  private static instantiateLLM(config: ProviderConfig, temperature: number): BaseChatModel {
    const provider = ProviderFactory.getProvider(config.provider)
    return provider.createLLM(config, temperature)
  }

  private static createCacheKey(config: ProviderConfig, temperature: number): string {
    // Create a deterministic cache key from config
    const keyObject = {
      provider: config.provider,
      model: config.model,
      temperature,
      url: config.url,
      apiKey: config.apiKey ? 'present' : 'missing', // Don't cache actual API key
      azureInstance: config.azureOpenAIApiInstanceName,
      azureDeployment: config.azureOpenAIApiDeploymentName,
      azureVersion: config.azureOpenAIApiVersion,
      region: config.region,
      accessKeyId: config.accessKeyId ? 'present' : 'missing'
    }
    return JSON.stringify(keyObject)
  }

}