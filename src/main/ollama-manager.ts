import { Ollama } from 'ollama'
import { SettingsService } from './settings'

export interface ModelPullProgress {
  status: 'downloading' | 'verifying' | 'writing' | 'complete' | 'error'
  digest?: string
  total?: number
  completed?: number
  progress?: number
}

export class OllamaManager {
  private static ollama: Ollama | null = null

  private static getOllamaInstance(): Ollama {
    if (!this.ollama) {
      const baseUrl = SettingsService.getOllamaUrl()
      this.ollama = new Ollama({ host: baseUrl })
    }
    return this.ollama
  }

  static async checkModelExists(modelName: string): Promise<boolean> {
    try {
      const ollama = this.getOllamaInstance()
      const models = await ollama.list()
      return models.models.some(model => model.name === modelName)
    } catch (error) {
      console.error('Failed to check model existence:', error)
      return false
    }
  }

  static async pullModel(
    modelName: string,
    onProgress?: (progress: ModelPullProgress) => void
  ): Promise<void> {
    try {
      const ollama = this.getOllamaInstance()
      
      const stream = await ollama.pull({
        model: modelName,
        stream: true
      })

      for await (const chunk of stream) {
        if (onProgress) {
          const progress: ModelPullProgress = {
            status: chunk.status as any,
            digest: chunk.digest,
            total: chunk.total,
            completed: chunk.completed
          }

          // Calculate progress percentage
          if (chunk.total && chunk.completed) {
            progress.progress = Math.round((chunk.completed / chunk.total) * 100)
          }

          onProgress(progress)
        }

        // Check if pull is complete
        if (chunk.status === 'success') {
          if (onProgress) {
            onProgress({ status: 'complete', progress: 100 })
          }
          break
        }
      }
    } catch (error) {
      console.error('Failed to pull model:', error)
      if (onProgress) {
        onProgress({ 
          status: 'error',
          progress: 0
        })
      }
      throw error
    }
  }

  static async ensureModelExists(modelName: string): Promise<boolean> {
    try {
      console.log(`Checking if model ${modelName} exists...`)
      const exists = await this.checkModelExists(modelName)
      
      if (exists) {
        console.log(`Model ${modelName} already exists`)
        return true
      }

      console.log(`Model ${modelName} not found, will need to pull`)
      return false
    } catch (error) {
      console.error('Error checking model existence:', error)
      throw error
    }
  }

  // Reset ollama instance when settings change
  static resetConnection(): void {
    this.ollama = null
  }
}