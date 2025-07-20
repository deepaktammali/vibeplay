export interface GameMetadata {
  id: string
  name: string
  displayName: string
  description: string
  icon: string
  minPlayers: number
  maxPlayers: number
  supportsModes: GameMode[]
  requiresAI?: boolean
}

export type GameMode = 'vs-ai' | 'vs-human' | 'multiplayer' | 'solo'

export type GameStatus = 'waiting' | 'in_progress' | 'completed' | 'paused'

export interface BaseGameState {
  id: string
  gameType: string
  status: GameStatus
  mode: GameMode
  currentPlayer?: string | number
  winner?: string | number | 'draw'
  gameOver: boolean
  createdAt: Date
  lastMove?: Date
}

export interface Player {
  id: string
  name: string
  type: 'human' | 'ai'
  symbol?: string
  color?: string
}

export interface GameMove {
  playerId: string
  timestamp: Date
  data: Record<string, any>
}

export interface GameError extends Error {
  gameType?: string
  errorType?: 'invalid_move' | 'invalid_json' | 'connection_failed' | 'config_error' | 'game_over'
  context?: Record<string, any>
}

export interface GameConfig {
  difficulty?: 'easy' | 'medium' | 'hard'
  timeLimit?: number
  customRules?: Record<string, any>
}

export interface AIResponse<T = any> {
  move: T
  reasoning?: string
  confidence?: number
}

export interface GameAPI {
  // Game lifecycle
  initializeGame(config: GameConfig): Promise<BaseGameState>
  validateMove(gameState: BaseGameState, move: GameMove): boolean
  applyMove(gameState: BaseGameState, move: GameMove): Promise<BaseGameState>
  checkGameEnd(gameState: BaseGameState): { isEnded: boolean; winner?: string | number | 'draw' }
  
  // AI integration
  getAIMove?(gameState: BaseGameState): Promise<AIResponse>
  
  // Game-specific methods (to be extended by individual games)
  serialize(gameState: BaseGameState): string
  deserialize(data: string): BaseGameState
}

export interface GameComponent {
  gameState: BaseGameState | null
  onMove: (move: GameMove) => Promise<void>
  onGameEnd: (result: { winner?: string | number | 'draw' }) => void
  onError: (error: GameError) => void
}