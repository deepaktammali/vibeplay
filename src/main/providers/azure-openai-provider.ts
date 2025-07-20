import { AzureChatOpenAI } from '@langchain/openai'
import { BaseProvider } from './base-provider'
import type { ProviderConfig, ValidationResult } from '../../types/settings'

export class AzureOpenAIProvider extends BaseProvider {
  readonly name = 'Azure OpenAI'
  readonly provider = 'azure-openai'

  createLLM(config: ProviderConfig, temperature: number = 0.3) {
    if (!config.apiKey || !config.azureOpenAIApiInstanceName || !config.azureOpenAIApiDeploymentName) {
      throw new Error('Azure OpenAI API key, instance name, and deployment name are required')
    }
    
    return new AzureChatOpenAI({
      azureOpenAIApiKey: config.apiKey,
      azureOpenAIApiInstanceName: config.azureOpenAIApiInstanceName,
      azureOpenAIApiDeploymentName: config.azureOpenAIApiDeploymentName,
      azureOpenAIApiVersion: config.azureOpenAIApiVersion || '2024-02-15-preview',
      temperature
    })
  }

  validateConfig(config: ProviderConfig): ValidationResult {
    const errors: string[] = []

    // Validate API key
    const keyError = this.validateRequired(config.apiKey, 'API key')
    if (keyError) errors.push(keyError)

    // Validate instance name
    const instanceError = this.validateRequired(config.azureOpenAIApiInstanceName, 'Instance name')
    if (instanceError) errors.push(instanceError)

    // Validate deployment name
    const deploymentError = this.validateRequired(config.azureOpenAIApiDeploymentName, 'Deployment name')
    if (deploymentError) errors.push(deploymentError)

    // Validate model
    const modelError = this.validateRequired(config.model, 'Model name')
    if (modelError) errors.push(modelError)

    return errors.length > 0 ? { valid: false, errors } : this.createSuccess()
  }

  async testConnection(config: ProviderConfig): Promise<ValidationResult> {
    if (!config.apiKey || !config.azureOpenAIApiInstanceName || !config.azureOpenAIApiDeploymentName) {
      return this.createError('API key, instance name, and deployment name are required for connection test')
    }

    return this.makeTestRequest(async () => {
      const llm = this.createLLM(config)
      const testMessage = [{ role: 'user' as const, content: 'Test connection' }]
      await llm.invoke(testMessage)

      return this.createSuccess()
    })
  }
}