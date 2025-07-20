import type { BaseGameState, GameMove } from '../types/game'
import type { GameState as LegacyTicTacGameState } from '../types/tictac'
import type { Connect4GameState } from '../types/connect4'
import { GameLLMRegistry, initializeGameLLMHandlers } from './games'
import { generateTicTacToeNextStep } from './games/tictactoe-llm'
import { generateConnect4NextStep } from './games/connect4-llm'

interface GameHandler {
  validateMove(gameState: BaseGameState, move: GameMove): boolean
  applyMove(gameState: BaseGameState, move: GameMove): Promise<BaseGameState>
  checkGameEnd(gameState: BaseGameState): { isEnded: boolean; winner?: string | number | 'draw' }
  getAIMove?(gameState: BaseGameState): Promise<any>
}

class GameManager {
  private gameHandlers: Map<string, GameHandler> = new Map()
  private initialized = false

  constructor() {
    this.initializeHandlers()
  }

  private initializeHandlers(): void {
    if (this.initialized) return
    
    // Initialize game LLM handlers
    initializeGameLLMHandlers()
    this.initialized = true
  }

  registerGameHandler(gameType: string, handler: GameHandler): void {
    this.gameHandlers.set(gameType, handler)
  }

  getGameHandler(gameType: string): GameHandler | undefined {
    return this.gameHandlers.get(gameType)
  }

  async processMove(gameState: BaseGameState, move: GameMove): Promise<BaseGameState> {
    const handler = this.getGameHandler(gameState.gameType)
    if (!handler) {
      throw new Error(`No handler registered for game type: ${gameState.gameType}`)
    }

    if (!handler.validateMove(gameState, move)) {
      throw new Error('Invalid move')
    }

    const newState = await handler.applyMove(gameState, move)
    
    // Check if game ended
    const gameEnd = handler.checkGameEnd(newState)
    if (gameEnd.isEnded) {
      newState.gameOver = true
      newState.status = 'completed'
      newState.winner = gameEnd.winner
    }

    return newState
  }

  async getAIMove(gameState: BaseGameState): Promise<any> {
    const handler = this.getGameHandler(gameState.gameType)
    if (!handler?.getAIMove) {
      throw new Error(`No AI handler available for game type: ${gameState.gameType}`)
    }

    return await handler.getAIMove(gameState)
  }

  // Unified AI move generation using the new LLM system
  async generateAIMove(gameState: BaseGameState): Promise<BaseGameState> {
    this.initializeHandlers()
    
    try {
      // Use the unified LLM system
      return await GameLLMRegistry.generateNextStep(gameState.gameType, gameState)
    } catch (error) {
      console.error(`AI move generation failed for ${gameState.gameType}:`, error)
      throw error
    }
  }

  // Legacy support for TicTacToe
  async processLegacyTicTacMove(gameState: LegacyTicTacGameState): Promise<LegacyTicTacGameState> {
    this.initializeHandlers()
    return await generateTicTacToeNextStep(gameState)
  }

  // Connect4 specific handler
  async processConnect4Move(gameState: Connect4GameState): Promise<Connect4GameState> {
    this.initializeHandlers()
    return await generateConnect4NextStep(gameState)
  }
}

export const gameManager = new GameManager()

// Register basic game handlers for the unified system
gameManager.registerGameHandler('tictactoe', {
  validateMove: () => true, // Validation is handled by LLM handlers
  applyMove: async (gameState) => gameState, // Move application is handled by LLM handlers
  checkGameEnd: () => ({ isEnded: false }), // Game end check is handled by LLM handlers
  getAIMove: async (gameState) => {
    return await gameManager.generateAIMove(gameState)
  }
})

gameManager.registerGameHandler('connect4', {
  validateMove: () => true, // Validation is handled by LLM handlers
  applyMove: async (gameState) => gameState, // Move application is handled by LLM handlers
  checkGameEnd: () => ({ isEnded: false }), // Game end check is handled by LLM handlers
  getAIMove: async (gameState) => {
    return await gameManager.generateAIMove(gameState)
  }
})