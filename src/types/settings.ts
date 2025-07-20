export type AIProvider = 'ollama' | 'openai' | 'anthropic' | 'google' | 'azure-openai' | 'bedrock'

export interface ProviderConfig {
  // Common
  provider: AIProvider
  model: string
  
  // Ollama
  url?: string
  
  // API-based providers
  apiKey?: string
  
  // Azure OpenAI specific
  azureOpenAIApiInstanceName?: string
  azureOpenAIApiDeploymentName?: string
  azureOpenAIApiVersion?: string
  
  // Bedrock specific
  region?: string
  accessKeyId?: string
  secretAccessKey?: string
  crossRegion?: boolean // For cross-region models
}

export interface AIConfig {
  provider: AIProvider
  config: ProviderConfig
}

export type FieldType = 'text' | 'password' | 'url' | 'select' | 'checkbox'

export interface FormField {
  key: keyof ProviderConfig
  label: string
  type: FieldType
  placeholder?: string
  description?: string
  required?: boolean
  defaultValue?: string
  options?: { value: string; label: string }[]
}

export interface ProviderFormConfig {
  name: string
  description: string
  defaultModel: string
  fields: FormField[]
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings?: string[]
}

export interface SettingsSchema {
  // Legacy Ollama settings (for backward compatibility)
  ollamaUrl: string
  ollamaModel: string
  
  // New provider settings
  aiProvider: AIProvider
  providerConfig: ProviderConfig
}

export interface SettingsAPI {
  getAll: () => Promise<SettingsSchema>
  update: (settings: Partial<SettingsSchema>) => Promise<SettingsSchema>
  
  // Legacy Ollama methods
  getOllamaUrl: () => Promise<string>
  setOllamaUrl: (url: string) => Promise<string>
  getOllamaModel: () => Promise<string>
  setOllamaModel: (model: string) => Promise<string>
  
  // Unified AI config methods
  getAIConfig: () => Promise<AIConfig>
  setAIConfig: (config: AIConfig) => Promise<ValidationResult>
  // Removed separate validation and test methods - now integrated into setAIConfig
  
  // Legacy provider methods (deprecated)
  getAIProvider: () => Promise<AIProvider>
  setAIProvider: (provider: AIProvider) => Promise<AIProvider>
  getProviderConfig: () => Promise<ProviderConfig>
  setProviderConfig: (config: ProviderConfig) => Promise<ProviderConfig>
  validateProviderConfig: (config: ProviderConfig) => Promise<{ valid: boolean; errors: string[] }>
}

export type PartialSettings = Partial<SettingsSchema>