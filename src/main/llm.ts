import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod/v4'
import { GameState, LLMError, LLMResponse, MovePosition, TicTacBoardState } from '../types/tictac'
import { SettingsService } from './settings'
import { LLMFactory } from './llm-factory'

const moveSchema = z.object({
  move: z.object({
    row: z.number().min(0).max(2).describe('Row index (0-2)'),
    col: z.number().min(0).max(2).describe('Column index (0-2)')
  }),
  reasoning: z.string().optional().describe('Brief explanation of the move choice')
})

function isValidMove(board: TicTacBoardState, move: MovePosition): boolean {
  const { row, col } = move
  if (row < 0 || row > 2 || col < 0 || col > 2) return false
  return board[row][col] === '' || board[row][col] === ' '
}

function applyMove(
  board: TicTacBoardState,
  move: MovePosition,
  player: 'X' | 'O'
): TicTacBoardState {
  const newBoard = board.map((row) => [...row]) as TicTacBoardState
  newBoard[move.row][move.col] = player
  return newBoard
}

function checkWinner(board: TicTacBoardState): 'X' | 'O' | 'draw' | null {
  // Check rows
  for (const row of board) {
    if (row[0] && row[0] === row[1] && row[1] === row[2]) {
      return row[0] as 'X' | 'O'
    }
  }

  // Check columns
  for (let col = 0; col < 3; col++) {
    if (board[0][col] && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
      return board[0][col] as 'X' | 'O'
    }
  }

  // Check diagonals
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0] as 'X' | 'O'
  }
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2] as 'X' | 'O'
  }

  // Check for draw
  const isFull = board.every((row) => row.every((cell) => cell !== '' && cell !== ' '))

  if (isFull) return 'draw'

  return null
}

function formatBoardForPrompt(board: TicTacBoardState): string {
  return board
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
    .join('\n' + '-'.repeat(50) + '\n')
}

// LLM instance creation is now handled by LLMFactory

async function generateMoveWithRetry(
  board: TicTacBoardState,
  player: 'X' | 'O',
  maxRetries = 3,
  previousFailures: string[] = []
): Promise<LLMResponse> {
  // Get current provider configuration
  const aiProvider = SettingsService.getAIProvider()
  const providerConfig = SettingsService.getProviderConfig()


  // Validate configuration
  const validation = await SettingsService.validateProviderConfig(providerConfig)
  if (!validation.valid) {
    throw new Error(`AI configuration is invalid: ${validation.errors.join(', ')}`)
  }

  // Create LLM instance based on provider using LLMFactory
  const llm = LLMFactory.getCurrentLLM(providerConfig)

  const feedbackSection =
    previousFailures.length > 0
      ? `\nPREVIOUS MISTAKES TO AVOID:
${previousFailures.map((failure) => `- ${failure}`).join('\n')}

Please learn from these mistakes and make a valid move.\n`
      : ''

  const opponentPlayer = player === 'X' ? 'O' : 'X'

  const prompt = PromptTemplate.fromTemplate(`
You are playing Tic Tac Toe as {player} against {opponent}.

Board:
{board}

Legend: EMPTY(row,col) = available, TAKEN-{player} = your moves, TAKEN-{opponent} = opponent moves
${feedbackSection}
Rules:
- ONLY choose coordinates from EMPTY(row,col) positions
- NEVER choose TAKEN positions
- Win if possible, block opponent wins, then play strategically

{format_instructions}

Return your move as JSON.
`)

  const parser = StructuredOutputParser.fromZodSchema(moveSchema)

  const failures: string[] = [...previousFailures]
  let lastLLMResponse: string | undefined

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const formattedPrompt = await prompt.format({
        player,
        opponent: opponentPlayer,
        board: formatBoardForPrompt(board),
        format_instructions: parser.getFormatInstructions()
      })


      const response = await llm.invoke(formattedPrompt)
      lastLLMResponse = response.content as string


      const parsed = await parser.parse(response.content as string)


      if (isValidMove(board, parsed.move)) {
        return parsed as LLMResponse
      } else {
        const { row, col } = parsed.move
        const currentCell = board[row]?.[col]
        let errorMessage = `Position (${row}, ${col}) is invalid`

        if (row < 0 || row > 2 || col < 0 || col > 2) {
          errorMessage = `Position (${row}, ${col}) is out of bounds. Must be 0-2.`
        } else if (currentCell && currentCell !== '' && currentCell !== ' ') {
          errorMessage = `Position (${row}, ${col}) is already occupied by '${currentCell}'. Choose an empty position.`
        }

        failures.push(errorMessage)

        if (attempt === maxRetries - 1) {
          const error = new Error('AI failed to generate valid move') as LLMError
          error.llmResponse = lastLLMResponse
          error.errorType = 'invalid_move'
          throw error
        }
      }
    } catch (error) {
      console.error(`Attempt ${attempt + 1} failed:`, error)
      if (attempt === maxRetries - 1) {
        if (
          error instanceof SyntaxError ||
          (error instanceof Error && error.message.includes('parse'))
        ) {
          const llmError = new Error('AI failed to generate valid JSON') as LLMError
          llmError.llmResponse = lastLLMResponse
          llmError.errorType = 'invalid_json'
          throw llmError
        }
        const llmError = new Error('AI connection failed') as LLMError
        llmError.llmResponse = lastLLMResponse
        llmError.errorType = 'connection_failed'
        throw llmError
      }
    }
  }

  const error = new Error('AI failed to generate move') as LLMError
  error.llmResponse = lastLLMResponse
  error.errorType = 'invalid_move'
  throw error
}

export const generateNextStep = async (currentState: GameState): Promise<GameState> => {
  try {
    // Check if game is already over
    if (currentState.gameOver) {
      return currentState
    }

    // Generate AI move
    const llmResponse = await generateMoveWithRetry(currentState.board, currentState.currentPlayer)

    // Apply the move
    const newBoard = applyMove(currentState.board, llmResponse.move, currentState.currentPlayer)

    // Check for winner
    const winner = checkWinner(newBoard)
    const gameOver = winner !== null

    // Switch player
    const nextPlayer = currentState.currentPlayer === 'X' ? 'O' : 'X'

    return {
      board: newBoard,
      currentPlayer: gameOver ? currentState.currentPlayer : nextPlayer,
      winner: winner || undefined,
      gameOver,
      mode: currentState.mode
    }
  } catch (error) {
    console.error('Failed to generate next step:', error)
    throw error
  }
}
