import { z } from 'zod/v4'
import { PromptTemplate } from '@langchain/core/prompts'
import { BaseGameLLM } from '../game-llm-interface'
import type { 
  Connect4GameState, 
  Connect4Board, 
  Connect4Player,
  Connect4MoveData 
} from '../../types/connect4'

export class Connect4LLM extends BaseGameLLM<Connect4GameState, Connect4MoveData> {
  constructor() {
    super('Connect 4')
  }

  getMoveSchema() {
    return z.object({
      move: z.object({
        column: z.number().min(0).max(6).describe('Column index (0-6)'),
        player: z.enum(['red', 'yellow']).describe('Player color')
      }),
      reasoning: z.string().optional().describe('Brief explanation of the move choice')
    })
  }

  isValidMove(gameState: Connect4GameState, moveData: Connect4MoveData): boolean {
    const { column } = moveData
    if (column < 0 || column > 6) return false
    // Check if column is not full (top row is empty)
    return gameState.board[0][column] === ''
  }

  applyMove(gameState: Connect4GameState, moveData: Connect4MoveData): Connect4GameState {
    const { column, player } = moveData
    
    // Find the lowest empty row in the column
    const row = this.findLowestEmptyRow(gameState.board, column)
    if (row === -1) {
      throw new Error('Column is full')
    }
    
    // Apply move to board
    const newBoard = gameState.board.map((boardRow, rowIndex) =>
      boardRow.map((cell, colIndex) =>
        rowIndex === row && colIndex === column ? player : cell
      )
    ) as Connect4Board

    // Switch player
    const nextPlayer: Connect4Player = player === 'red' ? 'yellow' : 'red'
    
    return {
      ...gameState,
      board: newBoard,
      currentPlayer: nextPlayer,
      lastColumn: column
    }
  }

  checkGameEnd(gameState: Connect4GameState): { isEnded: boolean; winner?: string | 'draw' } {
    const board = gameState.board
    const ROWS = 6
    const COLS = 7
    const WIN_LENGTH = 4

    // Check all possible directions: horizontal, vertical, diagonal
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const cell = board[row][col]
        if (cell === '') continue
        
        // Check horizontal (right)
        if (this.checkDirection(board, row, col, 0, 1, cell, WIN_LENGTH)) return { isEnded: true, winner: cell }
        
        // Check vertical (down)
        if (this.checkDirection(board, row, col, 1, 0, cell, WIN_LENGTH)) return { isEnded: true, winner: cell }
        
        // Check diagonal (down-right)
        if (this.checkDirection(board, row, col, 1, 1, cell, WIN_LENGTH)) return { isEnded: true, winner: cell }
        
        // Check diagonal (down-left)
        if (this.checkDirection(board, row, col, 1, -1, cell, WIN_LENGTH)) return { isEnded: true, winner: cell }
      }
    }

    // Check for draw (board is full)
    const isFull = board[0].every(cell => cell !== '')
    if (isFull) {
      return { isEnded: true, winner: 'draw' }
    }

    return { isEnded: false }
  }

  formatBoardForPrompt(gameState: Connect4GameState): string {
    const board = gameState.board
    const columnHeaders = Array.from({ length: 7 }, (_, i) => `  ${i}  `).join('|')
    const separator = '-'.repeat(35)
    
    const boardDisplay = board
      .map((row, rowIndex) =>
        row
          .map((cell) => {
            if (cell === '') {
              return ` E${rowIndex} `
            } else {
              return ` ${cell.substring(0, 2).toUpperCase()} `
            }
          })
          .join('|')
      )
      .join('\n' + separator + '\n')

    const columnStatus = this.getColumnStatus(gameState.board)

    return `Current Board (6 rows x 7 columns):
Columns: ${columnHeaders}
${separator}
${boardDisplay}

Column Status: ${columnStatus}

Legend: 
- E0-E5 = Empty cell (can drop piece)
- RE = Red piece, YE = Yellow piece
- OPEN = can drop piece, FULL = column is full`
  }

  getGameRules(): string {
    return `Game Rules:
- Drop pieces into columns (0-6)
- Pieces fall to the lowest available row in that column
- Win by connecting 4 pieces in a row (horizontal, vertical, or diagonal)
- ONLY choose columns marked as OPEN
- NEVER choose columns marked as FULL`
  }

  getStrategyInstructions(): string {
    return `Strategy Priority:
1. Win immediately if possible (connect 4 of your pieces)
2. Block opponent from winning (prevent their 4 in a row)
3. Build towards your own winning opportunities
4. Create multiple winning threats when possible
5. Play center columns (3,2,4) when possible for better positioning
6. Avoid giving opponent winning opportunities`
  }

  getCurrentPlayerSymbol(gameState: Connect4GameState): string {
    return gameState.currentPlayer.toUpperCase()
  }

  getOpponentPlayerSymbol(gameState: Connect4GameState): string {
    const opponent: Connect4Player = gameState.currentPlayer === 'red' ? 'yellow' : 'red'
    return opponent.toUpperCase()
  }

  protected getInvalidMoveMessage(_gameState: Connect4GameState, moveData: Connect4MoveData): string {
    const { column } = moveData
    if (column < 0 || column > 6) {
      return `Column ${column} is out of bounds. Use columns 0-6 only.`
    }
    return `Column ${column} is full. Choose an OPEN column.`
  }

  protected buildPrompt(): PromptTemplate {
    return PromptTemplate.fromTemplate(`
You are playing Connect 4 as {player} against {opponent}.

{board}

{gameRules}

{strategyInstructions}

{feedbackSection}

{format_instructions}

Return your move as JSON with the column number (0-6) and your player color.
`)
  }

  protected getAdditionalPromptVariables(): Record<string, any> {
    return {
      gameType: 'Connect 4'
    }
  }

  // Helper methods
  private findLowestEmptyRow(board: Connect4Board, column: number): number {
    for (let row = 5; row >= 0; row--) { // 6 rows (0-5), check from bottom
      if (board[row][column] === '') {
        return row
      }
    }
    return -1 // Column is full
  }

  private checkDirection(
    board: Connect4Board, 
    startRow: number, 
    startCol: number, 
    deltaRow: number, 
    deltaCol: number, 
    player: string,
    winLength: number
  ): boolean {
    let count = 0
    let row = startRow
    let col = startCol
    
    while (
      row >= 0 && row < 6 && 
      col >= 0 && col < 7 && 
      board[row][col] === player
    ) {
      count++
      if (count >= winLength) return true
      row += deltaRow
      col += deltaCol
    }
    
    return false
  }

  private getColumnStatus(board: Connect4Board): string {
    const status = board[0].map((cell, colIndex) => {
      const isFull = cell !== ''
      return `Col${colIndex}: ${isFull ? 'FULL' : 'OPEN'}`
    })
    return status.join(' | ')
  }
}

// Export for use in game manager
export async function generateConnect4NextStep(gameState: Connect4GameState): Promise<Connect4GameState> {
  const connect4LLM = new Connect4LLM()
  return connect4LLM.generateNextStep(gameState)
}