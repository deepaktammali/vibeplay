import type { AIProvider, ProviderFormConfig } from './settings'

export const PROVIDER_FORM_CONFIGS: Record<AIProvider, ProviderFormConfig> = {
  ollama: {
    name: 'Ollama',
    description: 'Local AI models running on your machine',
    defaultModel: 'llama3.2:3b',
    fields: [
      {
        key: 'url',
        label: 'Ollama URL',
        type: 'url',
        placeholder: 'http://localhost:11434',
        description: 'The URL where your Ollama instance is running',
        required: true,
        defaultValue: 'http://localhost:11434'
      },
      {
        key: 'model',
        label: 'Model Name',
        type: 'text',
        placeholder: 'llama3.2:3b',
        description: 'The name of the model to use for inference',
        required: true
      }
    ]
  },

  openai: {
    name: 'OpenAI',
    description: 'GPT models from OpenAI',
    defaultModel: 'gpt-4o-mini',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-...',
        description: 'Your OpenAI API key',
        required: true
      },
      {
        key: 'model',
        label: 'Model',
        type: 'select',
        description: 'The OpenAI model to use',
        required: true,
        defaultValue: 'gpt-4o-mini',
        options: [
          { value: 'o3-pro', label: 'o3-pro' },
          { value: 'o3', label: 'o3' },
          { value: 'o3-mini', label: 'o3-mini' },
          { value: 'o3-deep-research', label: 'o3-deep-research' },
          { value: 'o4-mini', label: 'o4-mini' },
          { value: 'o4-mini-deep-research', label: 'o4-mini-deep-research' },
          { value: 'o1-pro', label: 'o1-pro' },
          { value: 'o1', label: 'o1' },
          { value: 'o1-preview', label: 'o1-preview' },
          { value: 'o1-mini', label: 'o1-mini' },
          { value: 'gpt-4.1', label: 'GPT-4.1' },
          { value: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
          { value: 'gpt-4.1-nano', label: 'GPT-4.1 nano' },
          { value: 'gpt-4o', label: 'GPT-4o' },
          { value: 'gpt-4o-mini', label: 'GPT-4o mini' },
          { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
          { value: 'gpt-4', label: 'GPT-4' },
          { value: 'codex-mini-latest', label: 'Codex Mini' }
        ]
      }
    ]
  },

  anthropic: {
    name: 'Anthropic',
    description: 'Claude models from Anthropic',
    defaultModel: 'claude-3-haiku-20240307',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'sk-ant-...',
        description: 'Your Anthropic API key',
        required: true
      },
      {
        key: 'model',
        label: 'Model',
        type: 'select',
        description: 'The Claude model to use',
        required: true,
        defaultValue: 'claude-3-haiku-20240307',
        options: [
          { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
          { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
          { value: 'claude-3-7-sonnet-20250219', label: 'Claude Sonnet 3.7' },
          { value: 'claude-3-5-sonnet-20241022', label: 'Claude Sonnet 3.5 v2' },
          { value: 'claude-3-5-sonnet-20240620', label: 'Claude Sonnet 3.5' },
          { value: 'claude-3-5-haiku-20241022', label: 'Claude Haiku 3.5' },
          { value: 'claude-3-opus-20240229', label: 'Claude Opus 3' },
          { value: 'claude-3-sonnet-20240229', label: 'Claude Sonnet 3' },
          { value: 'claude-3-haiku-20240307', label: 'Claude Haiku 3' }
        ]
      }
    ]
  },

  google: {
    name: 'Google AI',
    description: 'Gemini models from Google',
    defaultModel: 'gemini-1.5-flash',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'AIza...',
        description: 'Your Google AI API key',
        required: true
      },
      {
        key: 'model',
        label: 'Model',
        type: 'select',
        description: 'The Gemini model to use',
        required: true,
        defaultValue: 'gemini-1.5-flash',
        options: [
          { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro' },
          { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
          { value: 'gemini-2.5-pro-preview-06-05', label: 'Gemini 2.5 Pro Preview 06-05' },
          { value: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro Preview 05-06' },
          { value: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash Preview 05-20' },
          { value: 'gemini-2.5-flash-preview-04-17', label: 'Gemini 2.5 Flash Preview 04-17' },
          { value: 'gemini-2.5-flash-lite-preview-06-17', label: 'Gemini 2.5 Flash Lite Preview 06-17' },
          { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
          { value: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
          { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
          { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
          { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash-8B' }
        ]
      }
    ]
  },

  'azure-openai': {
    name: 'Azure OpenAI',
    description: 'OpenAI models via Microsoft Azure',
    defaultModel: 'gpt-4o-mini',
    fields: [
      {
        key: 'apiKey',
        label: 'API Key',
        type: 'password',
        placeholder: 'Your Azure OpenAI API key',
        description: 'Your Azure OpenAI API key',
        required: true
      },
      {
        key: 'azureOpenAIApiInstanceName',
        label: 'Instance Name',
        type: 'text',
        placeholder: 'your-instance-name',
        description: 'Your Azure OpenAI instance name',
        required: true
      },
      {
        key: 'azureOpenAIApiDeploymentName',
        label: 'Deployment Name',
        type: 'text',
        placeholder: 'your-deployment-name',
        description: 'Your Azure OpenAI deployment name',
        required: true
      },
      {
        key: 'azureOpenAIApiVersion',
        label: 'API Version',
        type: 'text',
        placeholder: '2024-02-15-preview',
        description: 'Azure OpenAI API version',
        required: false,
        defaultValue: '2024-02-15-preview'
      },
      {
        key: 'model',
        label: 'Model',
        type: 'text',
        placeholder: 'gpt-4o-mini',
        description: 'The model deployment name',
        required: true,
        defaultValue: 'gpt-4o-mini'
      }
    ]
  },

  bedrock: {
    name: 'AWS Bedrock',
    description: 'AWS managed AI models',
    defaultModel: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    fields: [
      {
        key: 'region',
        label: 'AWS Region',
        type: 'select',
        description: 'AWS region where Bedrock is available',
        required: true,
        defaultValue: 'us-east-1',
        options: [
          { value: 'us-east-1', label: 'US East (N. Virginia)' },
          { value: 'us-west-2', label: 'US West (Oregon)' },
          { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
          { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
          { value: 'eu-west-3', label: 'Europe (Paris)' }
        ]
      },
      {
        key: 'accessKeyId',
        label: 'Access Key ID',
        type: 'text',
        placeholder: 'AKIA...',
        description: 'Your AWS access key ID',
        required: true
      },
      {
        key: 'secretAccessKey',
        label: 'Secret Access Key',
        type: 'password',
        placeholder: 'Your AWS secret access key',
        description: 'Your AWS secret access key',
        required: true
      },
      {
        key: 'crossRegion',
        label: 'Cross Region Model',
        type: 'checkbox',
        description: 'Enable to use cross-region inference (automatically prefixes model with region)',
        required: false,
        defaultValue: 'false'
      },
      {
        key: 'model',
        label: 'Model',
        type: 'select',
        description: 'The Bedrock model to use',
        required: true,
        defaultValue: 'anthropic.claude-3-5-haiku-20241022-v1:0',
        options: [
          { value: 'anthropic.claude-3-5-sonnet-20241022-v2:0', label: 'Claude 3.5 Sonnet v2' },
          { value: 'anthropic.claude-3-5-haiku-20241022-v1:0', label: 'Claude 3.5 Haiku' },
          { value: 'anthropic.claude-3-opus-20240229-v1:0', label: 'Claude 3 Opus' },
          { value: 'anthropic.claude-3-sonnet-20240229-v1:0', label: 'Claude 3 Sonnet' },
          { value: 'anthropic.claude-3-haiku-20240307-v1:0', label: 'Claude 3 Haiku' },
          { value: 'amazon.titan-text-lite-v1', label: 'Amazon Titan Text Lite' },
          { value: 'amazon.titan-text-express-v1', label: 'Amazon Titan Text Express' },
          { value: 'amazon.titan-embed-text-v1', label: 'Amazon Titan Embed Text' },
          { value: 'amazon.titan-embed-text-v2:0', label: 'Amazon Titan Embed Text v2' },
          { value: 'cohere.command-text-v14', label: 'Cohere Command Text' },
          { value: 'cohere.command-light-text-v14', label: 'Cohere Command Light Text' },
          { value: 'cohere.embed-english-v3', label: 'Cohere Embed English v3' },
          { value: 'cohere.embed-multilingual-v3', label: 'Cohere Embed Multilingual v3' },
          { value: 'ai21.j2-mid-v1', label: 'AI21 Jurassic-2 Mid' },
          { value: 'ai21.j2-ultra-v1', label: 'AI21 Jurassic-2 Ultra' },
          { value: 'meta.llama2-13b-chat-v1', label: 'Meta Llama 2 13B Chat' },
          { value: 'meta.llama2-70b-chat-v1', label: 'Meta Llama 2 70B Chat' },
          { value: 'meta.llama3-8b-instruct-v1:0', label: 'Meta Llama 3 8B Instruct' },
          { value: 'meta.llama3-70b-instruct-v1:0', label: 'Meta Llama 3 70B Instruct' },
          { value: 'mistral.mistral-7b-instruct-v0:2', label: 'Mistral 7B Instruct' },
          { value: 'mistral.mixtral-8x7b-instruct-v0:1', label: 'Mistral Mixtral 8x7B Instruct' },
          { value: 'mistral.mistral-large-2402-v1:0', label: 'Mistral Large' }
        ]
      }
    ]
  }
}