import { contextBridge, ipcRenderer } from 'electron/renderer'
import type { GameState } from '../types/tictac'
import type { BaseGameState, GameMove } from '../types/game'
import type { SettingsAPI, PartialSettings } from '../types/settings'

const api = {
  // Legacy TicTacToe API (kept for backward compatibility)
  nextStep: (gameState: GameState) => ipcRenderer.invoke('next-step', gameState),
  
  // New unified game API
  game: {
    processMove: (gameState: BaseGameState, move: GameMove) => 
      ipcRenderer.invoke('game:process-move', gameState, move),
    getAIMove: (gameState: BaseGameState) => 
      ipcRenderer.invoke('game:get-ai-move', gameState)
  },

  // Connect4 specific API
  connect4: {
    getAIMove: (gameState: any) => ipcRenderer.invoke('connect4:ai-move', gameState)
  },
  settings: {
    getAll: () => ipcRenderer.invoke('settings:get-all'),
    update: (settings: PartialSettings) => 
      ipcRenderer.invoke('settings:update', settings),
    // Legacy Ollama methods
    getOllamaUrl: () => ipcRenderer.invoke('settings:get-ollama-url'),
    setOllamaUrl: (url: string) => ipcRenderer.invoke('settings:set-ollama-url', url),
    getOllamaModel: () => ipcRenderer.invoke('settings:get-ollama-model'),
    setOllamaModel: (model: string) => ipcRenderer.invoke('settings:set-ollama-model', model),
    // Unified AI config methods
    getAIConfig: () => ipcRenderer.invoke('settings:get-ai-config'),
    setAIConfig: (config: any) => ipcRenderer.invoke('settings:set-ai-config', config),
    // Removed separate validation and test methods - now integrated into setAIConfig
    
    // Legacy provider methods (deprecated)
    getAIProvider: () => ipcRenderer.invoke('settings:get-ai-provider'),
    setAIProvider: (provider: string) => ipcRenderer.invoke('settings:set-ai-provider', provider),
    getProviderConfig: () => ipcRenderer.invoke('settings:get-provider-config'),
    setProviderConfig: (config: any) => ipcRenderer.invoke('settings:set-provider-config', config),
    validateProviderConfig: (config: any) => ipcRenderer.invoke('settings:validate-provider-config', config)
  } satisfies SettingsAPI,
  model: {
    checkExists: (modelName: string) => ipcRenderer.invoke('model:check-exists', modelName),
    ensureExists: (modelName: string) => ipcRenderer.invoke('model:ensure-exists', modelName),
    pull: (modelName: string) => ipcRenderer.invoke('model:pull', modelName),
    onPullProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('model:pull-progress', (_, progress) => callback(progress))
    },
    offPullProgress: () => {
      ipcRenderer.removeAllListeners('model:pull-progress')
    }
  }
}

console.log('Preload script loading...', { contextIsolated: process.contextIsolated })

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('api', api)
    console.log('API exposed to main world successfully')
  } catch (error) {
    console.error('Failed to expose API:', error)
  }
} else {
  // @ts-ignore (define in dts)
  window.api = api
  console.log('API attached to window')
}
