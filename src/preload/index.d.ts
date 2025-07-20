import type { GameState } from '../types/tictac'
import type { BaseGameState, GameMove } from '../types/game'
import type { SettingsAPI } from '../types/settings'

declare global {
  interface Window {
    api: {
      // Legacy TicTacToe API
      nextStep: (gameState: GameState) => Promise<GameState>
      
      // New unified game API
      game: {
        processMove: (gameState: BaseGameState, move: GameMove) => Promise<BaseGameState>
        getAIMove: (gameState: BaseGameState) => Promise<any>
      }

      // Connect4 specific API
      connect4: {
        getAIMove: (gameState: any) => Promise<any>
      }
      
      settings: SettingsAPI
      
      model: {
        checkExists: (modelName: string) => Promise<boolean>
        ensureExists: (modelName: string) => Promise<boolean>
        pull: (modelName: string) => Promise<boolean>
        onPullProgress: (callback: (progress: any) => void) => void
        offPullProgress: () => void
      }
    }
  }
}
