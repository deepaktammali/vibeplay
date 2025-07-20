import type { GameAPI, BaseGameState, GameMove, GameConfig } from '../../../../types/game'
import type { 
  TicTacGameState, 
  TicTacMove, 
  TicTacBoardState, 
  TicTacMovePosition, 
  TicTacAIResponse,
  GameMode,
  GameState as LegacyGameState
} from '../../../../types/tictac'

export class TicTacToeAPI implements GameAPI {
  
  async initializeGame(config: GameConfig & { mode?: GameMode }): Promise<TicTacGameState> {
    const mode = config.mode || 'vs-ai'
    
    return {
      id: `tictactoe-${Date.now()}`,
      gameType: 'tictactoe',
      status: 'in_progress',
      mode: mode as any,
      board: this.createInitialBoard(),
      currentPlayer: mode === 'vs-ai' ? 'O' : 'X', // In vs-ai: User is O, AI is X
      players: {
        X: { name: mode === 'vs-ai' ? 'AI' : 'Player X', type: mode === 'vs-ai' ? 'ai' : 'human' },
        O: { name: mode === 'vs-ai' ? 'You' : 'Player O', type: 'human' }
      },
      gameOver: false,
      createdAt: new Date(),
      lastMove: new Date()
    }
  }

  validateMove(gameState: BaseGameState, move: GameMove): boolean {
    const ticTacState = gameState as TicTacGameState
    const ticTacMove = move as TicTacMove
    
    if (ticTacState.gameOver) return false
    if (!ticTacState.board) return false
    
    const { row, col } = ticTacMove.data.position
    if (row < 0 || row > 2 || col < 0 || col > 2) return false
    
    // Check if cell is empty
    const cell = ticTacState.board[row][col]
    if (cell !== '' && cell !== ' ') return false
    
    // In vs-AI mode, only allow user moves when it's their turn
    if (ticTacState.mode === 'vs-ai' && ticTacState.currentPlayer !== 'O') return false
    
    return true
  }

  async applyMove(gameState: BaseGameState, move: GameMove): Promise<BaseGameState> {
    const ticTacState = gameState as TicTacGameState
    const ticTacMove = move as TicTacMove
    
    const { row, col } = ticTacMove.data.position
    const symbol = ticTacMove.data.symbol
    
    // Apply move to board
    const newBoard = ticTacState.board.map((boardRow, rowIndex) =>
      boardRow.map((cell, colIndex) =>
        rowIndex === row && colIndex === col ? symbol : cell
      )
    ) as TicTacBoardState

    // Create the new state with proper type casting
    const newTicTacState: TicTacGameState = {
      ...ticTacState,
      board: newBoard,
      currentPlayer: symbol === 'X' ? 'O' : 'X',
      lastMove: new Date()
    }
    
    // Check for game end
    const gameEnd = this.checkGameEnd(newTicTacState)
    
    return {
      ...newTicTacState,
      gameOver: gameEnd.isEnded,
      winner: gameEnd.winner,
      status: gameEnd.isEnded ? 'completed' : 'in_progress'
    }
  }

  checkGameEnd(gameState: BaseGameState): { isEnded: boolean; winner?: string | number | 'draw' } {
    const ticTacState = gameState as TicTacGameState
    const board = ticTacState.board
    
    // Check rows
    for (const row of board) {
      if (row[0] && row[0] === row[1] && row[1] === row[2]) {
        return { isEnded: true, winner: row[0] }
      }
    }

    // Check columns
    for (let col = 0; col < 3; col++) {
      if (board[0][col] && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
        return { isEnded: true, winner: board[0][col] }
      }
    }

    // Check diagonals
    if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
      return { isEnded: true, winner: board[0][0] }
    }
    if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
      return { isEnded: true, winner: board[0][2] }
    }

    // Check for draw
    const isFull = board.every((row) => row.every((cell) => cell !== '' && cell !== ' '))
    if (isFull) {
      return { isEnded: true, winner: 'draw' }
    }

    return { isEnded: false }
  }

  async getAIMove(gameState: BaseGameState): Promise<TicTacAIResponse> {
    const ticTacState = gameState as TicTacGameState
    
    // Convert to legacy format for compatibility with existing LLM handler
    const legacyState: LegacyGameState = {
      board: ticTacState.board,
      currentPlayer: ticTacState.currentPlayer,
      gameOver: ticTacState.gameOver,
      winner: ticTacState.winner as any,
      mode: ticTacState.mode as GameMode
    }
    
    // Use the existing LLM system
    if (!window.api?.nextStep) {
      throw new Error('Game API is not available. Please restart the application.')
    }
    
    const newState = await window.api.nextStep(legacyState)
    
    // Find the AI move by comparing boards
    const aiMove = this.findMoveDifference(ticTacState.board, newState.board)
    if (!aiMove) {
      throw new Error('Could not determine AI move')
    }
    
    return {
      move: aiMove,
      reasoning: 'AI move generated'
    }
  }

  serialize(gameState: BaseGameState): string {
    return JSON.stringify(gameState)
  }

  deserialize(data: string): BaseGameState {
    return JSON.parse(data) as TicTacGameState
  }

  // Helper methods
  private createInitialBoard(): TicTacBoardState {
    return [
      ['', '', ''],
      ['', '', ''],
      ['', '', '']
    ]
  }

  private findMoveDifference(oldBoard: TicTacBoardState, newBoard: TicTacBoardState): TicTacMovePosition | null {
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (oldBoard[row][col] !== newBoard[row][col]) {
          return { row, col }
        }
      }
    }
    return null
  }
}