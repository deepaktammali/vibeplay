import type { BaseGameState, GameMove, AIResponse, GameMetadata } from './game'

export type TicTacBoardRow = [string, string, string]
export type TicTacBoardState = [TicTacBoardRow, TicTacBoardRow, TicTacBoardRow]

export interface TicTacMovePosition {
  row: number
  col: number
}

export interface TicTacMove extends GameMove {
  data: {
    position: TicTacMovePosition
    symbol: 'X' | 'O'
  }
}

export interface TicTacGameState extends BaseGameState {
  gameType: 'tictactoe'
  board: TicTacBoardState
  currentPlayer: 'X' | 'O'
  players: {
    X: { name: string; type: 'human' | 'ai' }
    O: { name: string; type: 'human' | 'ai' }
  }
}

export interface TicTacAIResponse extends AIResponse<TicTacMovePosition> {
  move: TicTacMovePosition
  reasoning?: string
}

// Legacy types for backward compatibility
export type GameMode = 'vs-ai' | 'vs-human'
export interface MovePosition extends TicTacMovePosition {}
export interface LLMResponse extends TicTacAIResponse {}
export interface LLMError extends Error {
  llmResponse?: string
  errorType?: 'invalid_move' | 'invalid_json' | 'connection_failed' | 'config_error'
}
export interface GameState {
  board: TicTacBoardState
  currentPlayer: 'X' | 'O'
  winner?: 'X' | 'O' | 'draw'
  gameOver: boolean
  mode: GameMode
}

// Game metadata
export const TICTACTOE_METADATA: GameMetadata = {
  id: 'tictactoe',
  name: 'tictactoe',
  displayName: 'Tic Tac Toe',
  description: 'Classic 3x3 grid game',
  icon: '🎮',
  minPlayers: 1,
  maxPlayers: 2,
  supportsModes: ['vs-ai', 'vs-human'],
  requiresAI: true
}
