import { ChatBedrockConverse } from '@langchain/aws'
import { BaseProvider } from './base-provider'
import type { ProviderConfig, ValidationResult } from '../../types/settings'

export class BedrockProvider extends BaseProvider {
  readonly name = 'AWS Bedrock'
  readonly provider = 'bedrock'

  createLLM(config: ProviderConfig, temperature: number = 0.3) {
    if (!config.region || !config.accessKeyId || !config.secretAccessKey) {
      throw new Error('AWS region, access key ID, and secret access key are required for Bedrock')
    }
    
    // Handle cross-region models by prefixing with region
    let modelName = config.model
    if (config.crossRegion && config.region) {
      modelName = this.formatCrossRegionModel(config.model, config.region)
    }
    
    return new ChatBedrockConverse({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      model: modelName,
      temperature,
    })
  }

  validateConfig(config: ProviderConfig): ValidationResult {
    const errors: string[] = []

    // Validate region
    const regionError = this.validateRequired(config.region, 'AWS region')
    if (regionError) errors.push(regionError)

    // Validate access key ID
    const accessKeyError = this.validateRequired(config.accessKeyId, 'Access Key ID')
    if (accessKeyError) errors.push(accessKeyError)

    // Validate secret access key
    const secretKeyError = this.validateRequired(config.secretAccessKey, 'Secret Access Key')
    if (secretKeyError) errors.push(secretKeyError)

    // Validate model
    const modelError = this.validateRequired(config.model, 'Model name')
    if (modelError) errors.push(modelError)

    // Basic format validation for AWS credentials
    if (config.accessKeyId && !config.accessKeyId.match(/^AKIA[0-9A-Z]{16}$/)) {
      errors.push('AWS Access Key ID should start with "AKIA" followed by 16 alphanumeric characters')
    }

    // Validate cross-region setup if enabled
    const warnings: string[] = []
    if (config.crossRegion && config.region && config.model) {
      const formattedModel = this.formatCrossRegionModel(config.model, config.region)
      if (formattedModel !== config.model) {
        warnings.push(`Cross-region enabled: Model will be accessed as "${formattedModel}"`)
      }
    }

    return errors.length > 0 ? { valid: false, errors } : this.createSuccess(warnings)
  }

  async testConnection(config: ProviderConfig): Promise<ValidationResult> {
    if (!config.region || !config.accessKeyId || !config.secretAccessKey || !config.model) {
      return this.createError('Region, access key ID, secret access key, and model are required for connection test')
    }

    return this.makeTestRequest(async () => {
      const llm = this.createLLM(config)
      const testMessage = [{ role: 'user' as const, content: 'Test connection' }]
      await llm.invoke(testMessage)

      return this.createSuccess()
    })
  }

  /**
   * Format model name for cross-region inference
   * Prefixes model with region code based on AWS region
   */
  private formatCrossRegionModel(modelName: string, region: string): string {
    // Determine region prefix based on AWS region
    let regionPrefix = ''
    
    if (region.startsWith('us-')) {
      regionPrefix = 'us.'
    } else if (region.startsWith('eu-')) {
      regionPrefix = 'eu.'
    } else if (region.startsWith('ap-')) {
      regionPrefix = 'ap.'
    } else if (region.startsWith('ca-')) {
      regionPrefix = 'ca.'
    } else if (region.startsWith('sa-')) {
      regionPrefix = 'sa.'
    } else {
      // For other regions, use the region as prefix (e.g., 'af-south-1' -> 'af.')
      const regionCode = region.split('-')[0]
      regionPrefix = `${regionCode}.`
    }

    // Only add prefix if not already present
    if (!modelName.includes('.')) {
      return `${regionPrefix}${modelName}`
    }
    
    return modelName
  }
}