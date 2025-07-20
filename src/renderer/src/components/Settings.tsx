import { useState, useEffect } from 'react'
import { Flex, Text, TextField, Button, Card, Heading, Callout, Select, Badge, Checkbox } from '@radix-ui/themes'
import { toast } from 'sonner'
import type { AIProvider, AIConfig, ValidationResult, FormField } from '../../../types/settings'
import { PROVIDER_FORM_CONFIGS } from '../../../types/form-configs'

export function Settings() {
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    provider: 'ollama',
    config: {
      provider: 'ollama',
      model: '',
      url: 'http://localhost:11434'
    }
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)

  useEffect(() => {
    console.log('Window API:', window)
    console.log('Settings API:', window.api?.settings)
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      if (!window.api?.settings) {
        throw new Error('Settings API is not available')
      }
      const currentConfig = await window.api.settings.getAIConfig()
      setAiConfig(currentConfig)
      setValidationResult(null)
    } catch (error) {
      console.error('Failed to load settings:', error)
      setValidationResult({
        valid: false,
        errors: ['Failed to load settings. Please restart the application.']
      })
      toast.error('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }


  const handleProviderChange = (provider: AIProvider) => {
    const formConfig = PROVIDER_FORM_CONFIGS[provider]
    const defaultConfig: any = {
      provider,
      model: formConfig.defaultModel
    }

    // Set default values from form config
    formConfig.fields.forEach(field => {
      if (field.defaultValue !== undefined) {
        defaultConfig[field.key] = field.defaultValue
      }
    })

    setAiConfig({
      provider,
      config: defaultConfig
    })
    setValidationResult(null)
  }

  const updateConfigField = (key: string, value: string) => {
    setAiConfig(prev => ({
      ...prev,
      config: { ...prev.config, [key]: value }
    }))
    setValidationResult(null)
  }

  const renderFormField = (field: FormField, value: string) => {
    const commonProps = {
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => updateConfigField(field.key as string, e.target.value),
      placeholder: field.placeholder,
      style: { width: '100%', height: '45px', fontSize: '16px' },
      required: field.required,
      size: "3" as const
    }

    let inputElement

    switch (field.type) {
      case 'password':
        inputElement = <TextField.Root type="password" {...commonProps} />
        break
      case 'url':
        inputElement = <TextField.Root type="url" {...commonProps} />
        break
      case 'checkbox':
        inputElement = (
          <Checkbox 
            checked={value === 'true' || (value as any) === true} 
            onCheckedChange={(checked) => updateConfigField(field.key as string, String(checked))}
          />
        )
        break
      case 'select':
        if (field.options) {
          inputElement = (
            <Select.Root value={value || field.defaultValue || ''} onValueChange={(newValue) => updateConfigField(field.key as string, newValue)}>
              <Select.Trigger style={{ width: '100%', height: '45px', fontSize: '16px' }} />
              <Select.Content>
                {field.options.map(option => (
                  <Select.Item key={option.value} value={option.value}>
                    {option.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          )
        } else {
          inputElement = <TextField.Root {...commonProps} />
        }
        break
      default:
        inputElement = <TextField.Root {...commonProps} />
    }

    return (
      <Flex direction="column" gap="2" key={field.key as string}>
        <Text size="3" weight="medium">
          {field.label}
          {field.required && <Text color="red" style={{ fontSize: 'inherit' }}> *</Text>}
        </Text>
        {inputElement}
        {field.description && (
          <Text size="1" color="gray">
            {field.description}
          </Text>
        )}
      </Flex>
    )
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault()
    }
    
    setIsSaving(true)
    setValidationResult(null)
    
    try {
      if (!window.api?.settings) {
        throw new Error('Settings API is not available')
      }
      
      // Show progress toast
      toast.loading('Validating configuration and testing connection...', { id: 'save-settings' })
      
      // Use the unified setAIConfig method which handles validation and connection testing
      const result = await window.api.settings.setAIConfig(aiConfig)
      setValidationResult(result)
      
      // Dismiss loading toast
      toast.dismiss('save-settings')
      
      if (result.valid) {
        toast.success('Settings saved and validated successfully!')
        
        // Show warnings if any
        if (result.warnings && result.warnings.length > 0) {
          result.warnings.forEach(warning => toast.warning(warning))
        }
      } else {
        toast.error(`Failed to save settings: ${result.errors.join(', ')}`)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
      toast.dismiss('save-settings')
      const errorMessage = 'Failed to save settings. Please check your connection and try again.'
      setValidationResult({
        valid: false,
        errors: [errorMessage]
      })
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  const currentFormConfig = PROVIDER_FORM_CONFIGS[aiConfig.provider]

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: '200px' }}>
        <Text>Loading settings...</Text>
      </Flex>
    )
  }

  // Only show error-only screen for critical API errors
  if (validationResult && validationResult.errors.some(err => err.includes('API is not available'))) {
    return (
      <Flex justify="center" style={{ width: '100%' }}>
        <Card style={{ width: '100%', maxWidth: '800px' }}>
          <Flex direction="column" gap="4">
            <Heading size="4">Settings Error</Heading>
            <Callout.Root color="red">
              <Callout.Text>{validationResult.errors.join(', ')}</Callout.Text>
            </Callout.Root>
          </Flex>
        </Card>
      </Flex>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <Flex direction="column" gap="5">
        {validationResult && !validationResult.valid && (
          <Callout.Root color="red">
            <Callout.Text>
              {validationResult.errors.map((err, idx) => (
                <Text key={idx} size="2" style={{ display: 'block' }}>
                  • {err}
                </Text>
              ))}
            </Callout.Text>
          </Callout.Root>
        )}

        {validationResult && validationResult.valid && validationResult.warnings && validationResult.warnings.length > 0 && (
          <Callout.Root color="orange">
            <Callout.Text>
              {validationResult.warnings.map((warning, idx) => (
                <Text key={idx} size="2" style={{ display: 'block' }}>
                  • {warning}
                </Text>
              ))}
            </Callout.Text>
          </Callout.Root>
        )}
        
        <Flex direction="column" gap="2">
          <Text size="3" weight="medium">AI Provider</Text>
          <Select.Root value={aiConfig.provider} onValueChange={handleProviderChange}>
            <Select.Trigger style={{ width: '100%', height: '45px', fontSize: '16px' }} />
            <Select.Content>
              {Object.entries(PROVIDER_FORM_CONFIGS).map(([key, config]) => (
                <Select.Item key={key} value={key}>
                  <Text weight="medium">{config.name}</Text>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Flex align="center" gap="2">
            <Badge color="blue" variant="soft">
              {currentFormConfig.name}
            </Badge>
            <Text size="1" color="gray">
              {currentFormConfig.description}
            </Text>
          </Flex>
        </Flex>

        {currentFormConfig.fields.map(field => 
          renderFormField(field, (aiConfig.config as any)[field.key] || '')
        )}

        <Flex gap="2" justify="end">
          <Button 
            type="submit"
            disabled={isSaving}
            size="3"
          >
            {isSaving ? 'Validating & Saving...' : 'Save Settings'}
          </Button>
        </Flex>
      </Flex>
    </form>
  )
}
