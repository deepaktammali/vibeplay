import { ChatOllama } from '@langchain/ollama'
import { BaseProvider } from './base-provider'
import type { ProviderConfig, ValidationResult } from '../../types/settings'

export class OllamaProvider extends BaseProvider {
  readonly name = 'Ollama'
  readonly provider = 'ollama'

  createLLM(config: ProviderConfig, temperature: number = 0.3) {
    if (!config.url) throw new Error('Ollama URL is required')
    
    return new ChatOllama({
      baseUrl: config.url,
      model: config.model,
      temperature,
      keepAlive: '1m'
    })
  }

  validateConfig(config: ProviderConfig): ValidationResult {
    const errors: string[] = []

    // Validate URL
    const urlError = this.validateUrl(config.url, 'Ollama URL')
    if (urlError) errors.push(urlError)

    // Validate model
    const modelError = this.validateRequired(config.model, 'Model name')
    if (modelError) errors.push(modelError)

    return errors.length > 0 ? { valid: false, errors } : this.createSuccess()
  }

  async testConnection(config: ProviderConfig): Promise<ValidationResult> {
    if (!config.url || !config.model) {
      return this.createError('URL and model are required for connection test')
    }

    return this.makeTestRequest(async () => {
      // First test basic Ollama API connectivity
      const response = await fetch(`${config.url}/api/tags`)
      if (!response.ok) {
        throw new Error(`Ollama API returned ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const models = data.models || []
      
      // Check if the specified model exists
      const modelExists = models.some((model: any) => 
        model.name === config.model || model.name === `${config.model}:latest`
      )

      const warnings: string[] = []
      if (!modelExists) {
        warnings.push(
          `Model "${config.model}" not found on Ollama instance. Available models: ${models.map((m: any) => m.name).join(', ')}`
        )
      }

      // Test using LangChain client
      const llm = this.createLLM(config)
      const testMessage = [{ role: 'user' as const, content: 'Test connection' }]
      await llm.invoke(testMessage)

      return this.createSuccess(warnings)
    })
  }
}