import { z } from 'zod/v4'
import { PromptTemplate } from '@langchain/core/prompts'
import { BaseGameLLM } from '../game-llm-interface'
import type { BaseGameState } from '../../types/game'
import type { GameState, TicTacBoardState, MovePosition } from '../../types/tictac'

// Convert legacy GameState to BaseGameState-compatible format
export interface TicTacToeLLMGameState extends BaseGameState {
  gameType: 'tictactoe'
  board: TicTacBoardState
  currentPlayer: 'X' | 'O'
  gameOver: boolean
  winner?: 'X' | 'O' | 'draw'
  mode: 'vs-ai' | 'vs-human'
}

export class TicTacToeLLM extends BaseGameLLM<TicTacToeLLMGameState, MovePosition> {
  constructor() {
    super('TicTacToe')
  }

  getMoveSchema() {
    return z.object({
      move: z.object({
        row: z.number().min(0).max(2).describe('Row index (0-2)'),
        col: z.number().min(0).max(2).describe('Column index (0-2)')
      }),
      reasoning: z.string().optional().describe('Brief explanation of the move choice')
    })
  }

  isValidMove(gameState: TicTacToeLLMGameState, moveData: MovePosition): boolean {
    const { row, col } = moveData
    if (row < 0 || row > 2 || col < 0 || col > 2) return false
    return gameState.board[row][col] === '' || gameState.board[row][col] === ' '
  }

  applyMove(gameState: TicTacToeLLMGameState, moveData: MovePosition): TicTacToeLLMGameState {
    const newBoard = gameState.board.map((row) => [...row]) as TicTacBoardState
    newBoard[moveData.row][moveData.col] = gameState.currentPlayer
    
    const nextPlayer = gameState.currentPlayer === 'X' ? 'O' : 'X'
    
    return {
      ...gameState,
      board: newBoard,
      currentPlayer: nextPlayer
    }
  }

  checkGameEnd(gameState: TicTacToeLLMGameState): { isEnded: boolean; winner?: string | 'draw' } {
    const board = gameState.board
    
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

  formatBoardForPrompt(gameState: TicTacToeLLMGameState): string {
    return `Current Board:
${gameState.board
  .map((row, rowIndex) =>
    row
      .map((cell, colIndex) => {
        if (cell === '' || cell === ' ') {
          return `EMPTY(${rowIndex},${colIndex})`
        } else {
          return `TAKEN-${cell}`
        }
      })
      .join(' | ')
  )
  .join('\n' + '-'.repeat(50) + '\n')}

Legend: EMPTY(row,col) = available position, TAKEN-X/TAKEN-O = occupied positions`
  }

  getGameRules(): string {
    return `Game Rules:
- ONLY choose coordinates from EMPTY(row,col) positions
- NEVER choose TAKEN positions
- Place your symbol in an empty cell
- Win by getting 3 in a row (horizontal, vertical, or diagonal)`
  }

  getStrategyInstructions(): string {
    return `Strategy Priority:
1. Win immediately if possible (complete 3 in a row)
2. Block opponent from winning (prevent their 3 in a row)
3. Play center (1,1) if available for better positioning
4. Play corners for strategic advantage
5. Avoid edges unless necessary`
  }

  getCurrentPlayerSymbol(gameState: TicTacToeLLMGameState): string {
    return gameState.currentPlayer
  }

  getOpponentPlayerSymbol(gameState: TicTacToeLLMGameState): string {
    return gameState.currentPlayer === 'X' ? 'O' : 'X'
  }

  protected getInvalidMoveMessage(gameState: TicTacToeLLMGameState, moveData: MovePosition): string {
    const { row, col } = moveData
    if (row < 0 || row > 2 || col < 0 || col > 2) {
      return `Position (${row},${col}) is out of bounds. Use coordinates 0-2 only.`
    }
    return `Position (${row},${col}) is already occupied by ${gameState.board[row][col]}`
  }

  protected buildPrompt(): PromptTemplate {
    return PromptTemplate.fromTemplate(`
You are playing Tic Tac Toe as {player} against {opponent}.

{board}

{gameRules}

{strategyInstructions}

{feedbackSection}

{format_instructions}

Return your move as JSON with row and col coordinates (0-2).
`)
  }
}

// Legacy compatibility functions
export async function generateTicTacToeNextStep(currentState: GameState): Promise<GameState> {
  const ticTacToeLLM = new TicTacToeLLM()
  
  // Convert legacy state to new format
  const llmGameState: TicTacToeLLMGameState = {
    id: `tictactoe-${Date.now()}`,
    gameType: 'tictactoe',
    status: currentState.gameOver ? 'completed' : 'in_progress',
    createdAt: new Date(),
    lastMove: new Date(),
    board: currentState.board,
    currentPlayer: currentState.currentPlayer,
    gameOver: currentState.gameOver,
    winner: currentState.winner,
    mode: currentState.mode
  }
  
  // Generate next step
  const newLLMState = await ticTacToeLLM.generateNextStep(llmGameState)
  
  // Convert back to legacy format
  return {
    board: newLLMState.board,
    currentPlayer: newLLMState.currentPlayer,
    gameOver: newLLMState.gameOver,
    winner: newLLMState.winner,
    mode: newLLMState.mode
  }
}