import type { GameAPI, BaseGameState, GameMove, GameConfig } from '../../../../types/game'
import type { GameMode } from '../../../../types/tictac'
import type { 
  Connect4GameState, 
  Connect4Move, 
  Connect4Board, 
  Connect4Player,
  Connect4Cell,
  Connect4AIResponse
} from './types'
import { CONNECT4_COLS, CONNECT4_ROWS, CONNECT4_WIN_LENGTH } from './types'

export class Connect4API implements GameAPI {
  
  async initializeGame(config: GameConfig & { mode?: GameMode }): Promise<Connect4GameState> {
    const mode = config.mode || 'vs-ai'
    
    return {
      id: `connect4-${Date.now()}`,
      gameType: 'connect4',
      status: 'in_progress',
      mode,
      board: this.createInitialBoard(),
      currentPlayer: mode === 'vs-ai' ? 'yellow' : 'red', // In vs-ai: User is yellow, AI is red
      players: {
        red: { name: mode === 'vs-ai' ? 'AI' : 'Player 1', type: mode === 'vs-ai' ? 'ai' : 'human' },
        yellow: { name: mode === 'vs-ai' ? 'You' : 'Player 2', type: 'human' }
      },
      gameOver: false,
      createdAt: new Date(),
      lastMove: new Date()
    }
  }

  validateMove(gameState: BaseGameState, move: GameMove): boolean {
    const connect4State = gameState as Connect4GameState
    const connect4Move = move as Connect4Move
    
    if (connect4State.gameOver) return false
    if (!connect4State.board) return false
    
    const { column } = connect4Move.data
    
    // Check if column is valid
    if (column < 0 || column >= CONNECT4_COLS) return false
    
    // Check if column is not full (top row is empty)
    if (connect4State.board[0][column] !== '') return false
    
    // In vs-AI mode, only allow user moves when it's their turn
    if (connect4State.mode === 'vs-ai' && connect4State.currentPlayer !== 'yellow') return false
    
    return true
  }

  async applyMove(gameState: BaseGameState, move: GameMove): Promise<BaseGameState> {
    const connect4State = gameState as Connect4GameState
    const connect4Move = move as Connect4Move
    
    const { column, player } = connect4Move.data
    
    // Find the lowest empty row in the column
    const row = this.findLowestEmptyRow(connect4State.board, column)
    if (row === -1) {
      throw new Error('Column is full')
    }
    
    // Apply move to board
    const newBoard = connect4State.board.map((boardRow, rowIndex) =>
      boardRow.map((cell, colIndex) =>
        rowIndex === row && colIndex === column ? player : cell
      )
    ) as Connect4Board

    // Switch player
    const nextPlayer: Connect4Player = player === 'red' ? 'yellow' : 'red'
    
    // Create the new state with proper type casting
    const newConnect4State: Connect4GameState = {
      ...connect4State,
      board: newBoard,
      currentPlayer: nextPlayer,
      lastColumn: column,
      lastMove: new Date()
    }
    
    // Check for game end
    const gameEnd = this.checkGameEnd(newConnect4State)
    
    return {
      ...newConnect4State,
      gameOver: gameEnd.isEnded,
      winner: gameEnd.winner,
      status: gameEnd.isEnded ? 'completed' : 'in_progress'
    }
  }

  checkGameEnd(gameState: BaseGameState): { isEnded: boolean; winner?: string | number | 'draw' } {
    const connect4State = gameState as Connect4GameState
    const board = connect4State.board
    
    // Check for winner
    const winner = this.checkForWinner(board)
    if (winner) {
      return { isEnded: true, winner }
    }

    // Check for draw (board is full)
    const isFull = this.isBoardFull(board)
    if (isFull) {
      return { isEnded: true, winner: 'draw' }
    }

    return { isEnded: false }
  }

  async getAIMove(gameState: BaseGameState): Promise<Connect4AIResponse> {
    const connect4State = gameState as Connect4GameState
    
    // Simple AI: try to win, block opponent, or play strategically
    const aiMove = this.getAIMoveLogic(connect4State.board, 'red')
    
    return {
      move: {
        column: aiMove,
        player: 'red'
      },
      reasoning: `AI chose column ${aiMove + 1}`
    }
  }

  serialize(gameState: BaseGameState): string {
    return JSON.stringify(gameState)
  }

  deserialize(data: string): BaseGameState {
    return JSON.parse(data) as Connect4GameState
  }

  // Helper methods
  private createInitialBoard(): Connect4Board {
    return Array(CONNECT4_ROWS).fill(null).map(() => 
      Array(CONNECT4_COLS).fill('') as Connect4Cell[]
    )
  }

  private findLowestEmptyRow(board: Connect4Board, column: number): number {
    for (let row = CONNECT4_ROWS - 1; row >= 0; row--) {
      if (board[row][column] === '') {
        return row
      }
    }
    return -1 // Column is full
  }

  private checkForWinner(board: Connect4Board): Connect4Player | null {
    // Check all possible directions: horizontal, vertical, diagonal
    for (let row = 0; row < CONNECT4_ROWS; row++) {
      for (let col = 0; col < CONNECT4_COLS; col++) {
        const cell = board[row][col]
        if (cell === '') continue
        
        // Check horizontal (right)
        if (this.checkDirection(board, row, col, 0, 1, cell)) return cell as Connect4Player
        
        // Check vertical (down)
        if (this.checkDirection(board, row, col, 1, 0, cell)) return cell as Connect4Player
        
        // Check diagonal (down-right)
        if (this.checkDirection(board, row, col, 1, 1, cell)) return cell as Connect4Player
        
        // Check diagonal (down-left)
        if (this.checkDirection(board, row, col, 1, -1, cell)) return cell as Connect4Player
      }
    }
    return null
  }

  private checkDirection(
    board: Connect4Board, 
    startRow: number, 
    startCol: number, 
    deltaRow: number, 
    deltaCol: number, 
    player: Connect4Cell
  ): boolean {
    let count = 0
    let row = startRow
    let col = startCol
    
    while (
      row >= 0 && row < CONNECT4_ROWS && 
      col >= 0 && col < CONNECT4_COLS && 
      board[row][col] === player
    ) {
      count++
      if (count >= CONNECT4_WIN_LENGTH) return true
      row += deltaRow
      col += deltaCol
    }
    
    return false
  }

  private isBoardFull(board: Connect4Board): boolean {
    return board[0].every(cell => cell !== '')
  }

  private getAIMoveLogic(board: Connect4Board, aiPlayer: Connect4Player): number {
    const opponent: Connect4Player = aiPlayer === 'red' ? 'yellow' : 'red'
    
    // 1. Try to win
    for (let col = 0; col < CONNECT4_COLS; col++) {
      if (this.canMakeMove(board, col)) {
        const testBoard = this.simulateMove(board, col, aiPlayer)
        if (this.checkForWinner(testBoard) === aiPlayer) {
          return col
        }
      }
    }
    
    // 2. Block opponent from winning
    for (let col = 0; col < CONNECT4_COLS; col++) {
      if (this.canMakeMove(board, col)) {
        const testBoard = this.simulateMove(board, col, opponent)
        if (this.checkForWinner(testBoard) === opponent) {
          return col
        }
      }
    }
    
    // 3. Play center columns preferentially
    const preferredColumns = [3, 2, 4, 1, 5, 0, 6]
    for (const col of preferredColumns) {
      if (this.canMakeMove(board, col)) {
        return col
      }
    }
    
    // 4. Fallback: first available column
    for (let col = 0; col < CONNECT4_COLS; col++) {
      if (this.canMakeMove(board, col)) {
        return col
      }
    }
    
    return 0 // Should never reach here in a valid game
  }

  private canMakeMove(board: Connect4Board, column: number): boolean {
    return column >= 0 && column < CONNECT4_COLS && board[0][column] === ''
  }

  private simulateMove(board: Connect4Board, column: number, player: Connect4Player): Connect4Board {
    const newBoard = board.map(row => [...row]) as Connect4Board
    const row = this.findLowestEmptyRow(newBoard, column)
    if (row !== -1) {
      newBoard[row][column] = player
    }
    return newBoard
  }
}