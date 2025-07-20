// Game LLM handlers index
export { TicTacToeLLM, generateTicTacToeNextStep } from './tictactoe-llm'
export { Connect4LLM, generateConnect4NextStep } from './connect4-llm'

// Register all game LLM handlers
export { GameLLMRegistry } from '../game-llm-interface'
import { GameLLMRegistry } from '../game-llm-interface'
import { TicTacToeLLM } from './tictactoe-llm'
import { Connect4LLM } from './connect4-llm'

// Initialize and register all game handlers
export function initializeGameLLMHandlers(): void {
  GameLLMRegistry.register('tictactoe', new TicTacToeLLM())
  GameLLMRegistry.register('connect4', new Connect4LLM())
  
}