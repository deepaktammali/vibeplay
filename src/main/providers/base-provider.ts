import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { ProviderConfig, ValidationResult } from '../../types/settings'

export abstract class BaseProvider {
  abstract readonly name: string
  abstract readonly provider: string

  /**
   * Create LLM instance for this provider
   */
  abstract createLLM(config: ProviderConfig, temperature?: number): BaseChatModel

  /**
   * Validate configuration without testing connection
   */
  abstract validateConfig(config: ProviderConfig): ValidationResult

  /**
   * Test connection with the provider
   */
  abstract testConnection(config: ProviderConfig): Promise<ValidationResult>

  /**
   * Helper method to validate required fields
   */
  protected validateRequired(value: string | undefined, fieldName: string): string | null {
    if (!value || value.trim() === '') {
      return `${fieldName} is required`
    }
    return null
  }

  /**
   * Helper method to validate URL format
   */
  protected validateUrl(url: string | undefined, fieldName: string): string | null {
    const requiredError = this.validateRequired(url, fieldName)
    if (requiredError) return requiredError

    try {
      new URL(url!)
      return null
    } catch {
      return `Invalid ${fieldName} format`
    }
  }

  /**
   * Helper method to create success result
   */
  protected createSuccess(warnings: string[] = []): ValidationResult {
    return { valid: true, errors: [], warnings }
  }

  /**
   * Helper method to create error result
   */
  protected createError(error: string): ValidationResult {
    return { valid: false, errors: [error] }
  }

  /**
   * Helper method to make test requests with error handling
   */
  protected async makeTestRequest(testFn: () => Promise<ValidationResult>): Promise<ValidationResult> {
    try {
      return await testFn()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed'
      return this.createError(errorMessage)
    }
  }
}