import { ChatOpenAI } from '@langchain/openai'
import { BaseProvider } from './base-provider'
import type { ProviderConfig, ValidationResult } from '../../types/settings'

export class OpenAIProvider extends BaseProvider {
  readonly name = 'OpenAI'
  readonly provider = 'openai'

  createLLM(config: ProviderConfig, temperature: number = 0.3) {
    if (!config.apiKey) throw new Error('OpenAI API key is required')
    
    return new ChatOpenAI({
      apiKey: config.apiKey,
      model: config.model,
      temperature
    })
  }

  validateConfig(config: ProviderConfig): ValidationResult {
    const errors: string[] = []

    // Validate API key
    const keyError = this.validateRequired(config.apiKey, 'API key')
    if (keyError) errors.push(keyError)

    // Validate model
    const modelError = this.validateRequired(config.model, 'Model name')
    if (modelError) errors.push(modelError)

    // Basic API key format validation
    if (config.apiKey && !config.apiKey.startsWith('sk-')) {
      errors.push('OpenAI API key should start with "sk-"')
    }

    return errors.length > 0 ? { valid: false, errors } : this.createSuccess()
  }

  async testConnection(config: ProviderConfig): Promise<ValidationResult> {
    if (!config.apiKey || !config.model) {
      return this.createError('API key and model are required for connection test')
    }

    return this.makeTestRequest(async () => {
      const llm = this.createLLM(config)
      const testMessage = [{ role: 'user' as const, content: 'Test connection' }]
      await llm.invoke(testMessage)

      return this.createSuccess()
    })
  }
}