import type { BaseGameState, GameMetadata, GameMove, AIResponse } from './game'
import type { GameMode } from './tictac'

// Connect4 specific types
export type Connect4Player = 'red' | 'yellow'
export type Connect4Cell = '' | 'red' | 'yellow'
export type Connect4Board = Connect4Cell[][] // 7 columns x 6 rows

export interface Connect4MoveData {
  column: number
  player: Connect4Player
}

export interface Connect4Move extends GameMove {
  data: Connect4MoveData
}

export interface Connect4GameState extends BaseGameState {
  gameType: 'connect4'
  board: Connect4Board
  currentPlayer: Connect4Player
  players: {
    red: { name: string; type: 'human' | 'ai' }
    yellow: { name: string; type: 'human' | 'ai' }
  }
  mode: GameMode
  lastColumn?: number
}

export interface Connect4AIResponse extends AIResponse<Connect4MoveData> {
  move: Connect4MoveData
  reasoning?: string
}

// Game constants
export const CONNECT4_COLS = 7
export const CONNECT4_ROWS = 6
export const CONNECT4_WIN_LENGTH = 4

export const CONNECT4_METADATA: GameMetadata = {
  id: 'connect4',
  name: 'connect4',
  displayName: 'Connect 4',
  description: 'Drop checkers to connect four in a row',
  icon: '🔴',
  minPlayers: 1,
  maxPlayers: 2,
  supportsModes: ['vs-ai', 'vs-human'],
  requiresAI: true
}