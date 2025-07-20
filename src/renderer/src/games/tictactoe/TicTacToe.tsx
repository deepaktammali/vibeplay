import {
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Flex,
  Heading,
  RadioCards,
  Spinner,
  Text,
  Tooltip
} from '@radix-ui/themes'
import { CircleIcon, Cross1Icon } from '@radix-ui/react-icons'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { GameMode, GameState, TicTacBoardState } from '../../../../types/tictac'

const createInitialBoard = (): TicTacBoardState => [
  ['', '', ''],
  ['', '', ''],
  ['', '', '']
]

const createInitialGameState = (mode: GameMode = 'vs-ai'): GameState => ({
  board: createInitialBoard(),
  currentPlayer: mode === 'vs-ai' ? 'O' : 'X', // In vs-ai: User is O, AI is X. In vs-human: X starts
  gameOver: false,
  mode
})

interface CellProps {
  value: string
  onClick: () => void
  disabled: boolean
}

function Cell({ value, onClick, disabled }: CellProps) {
  const getCellColor = () => {
    if (value === 'X') return 'purple'
    if (value === 'O') return 'cyan'
    return 'gray'
  }

  const getCellIcon = () => {
    if (value === 'X') return <Cross1Icon width="32" height="32" />
    if (value === 'O') return <CircleIcon width="32" height="32" />
    return null
  }

  const isEmpty = !value || value === '' || value === ' '
  const isClickable = !disabled && isEmpty

  return (
    <Button
      variant={value ? 'soft' : 'outline'}
      color={getCellColor()}
      onClick={onClick}
      disabled={disabled}
      size="4"
      style={{
        width: '90px',
        height: '90px',
        fontWeight: 'bold',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled && !isEmpty ? 0.6 : 1,
        transform: disabled && !isEmpty ? 'scale(0.95)' : 'scale(1)'
      }}
    >
      {getCellIcon()}
    </Button>
  )
}

export function TicTacToe() {
  const [gameMode, setGameMode] = useState<GameMode>('vs-ai')
  const [gameState, setGameState] = useState<GameState | null>(null) // Start with no active game
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [error, setError] = useState<string>('')
  const [errorDetails, setErrorDetails] = useState<{ llmResponse?: string; errorType?: string }>({})  

  // Debug log to check initial state
  console.log('TicTacToe component loaded, gameState:', gameState)

  const isValidMove = (row: number, col: number): boolean => {
    if (!gameState || gameState.gameOver) return false
    if (!gameState.board || !gameState.board[row] || gameState.board[row][col] === undefined)
      return false

    // In vs-AI mode, only allow moves when it's the user's turn (O)
    if (gameState.mode === 'vs-ai' && gameState.currentPlayer !== 'O') return false

    return gameState.board[row][col] === '' || gameState.board[row][col] === ' '
  }

  const checkWinner = (board: TicTacBoardState): 'X' | 'O' | 'draw' | null => {
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

  const makeMove = useCallback(
    async (row: number, col: number) => {
      console.log('makeMove called:', {
        row,
        col,
        gameState: gameState?.currentPlayer,
        mode: gameState?.mode
      })

      if (!gameState || !isValidMove(row, col)) {
        console.log('Move blocked by validation')
        return
      }
      if (!gameState.board) {
        console.log('No board available')
        return
      }

      setError('')
    setErrorDetails({}) // Clear any previous errors
      setErrorDetails({})

      const currentPlayer = gameState.currentPlayer

      // Apply move
      const newBoard = gameState.board.map((boardRow, rowIndex) =>
        boardRow.map((cell, colIndex) =>
          rowIndex === row && colIndex === col ? currentPlayer : cell
        )
      ) as TicTacBoardState

      console.log('Move applied, newBoard:', newBoard)

      // Check if game is over
      const winner = checkWinner(newBoard)
      if (winner) {
        const finalGameState: GameState = {
          ...gameState,
          board: newBoard,
          winner: winner === 'draw' ? 'draw' : winner,
          gameOver: true
        }

        console.log('Game over:', finalGameState)
        setGameState(finalGameState)

        if (winner === 'draw') {
          toast.info("It's a draw!")
        } else if (gameState.mode === 'vs-human') {
          toast.success(`Player ${winner} won! 🎉`)
        } else if (winner === 'O') {
          toast.success('You won! 🎉')
        } else {
          toast.error('AI won! Better luck next time.')
        }
        return
      }

      // Switch player and update game state
      const nextPlayer = currentPlayer === 'X' ? 'O' : 'X'
      const gameStateAfterMove: GameState = {
        ...gameState,
        board: newBoard,
        currentPlayer: nextPlayer,
        gameOver: false
      }

      console.log('Setting game state after move:', gameStateAfterMove)

      // If vs AI mode and it's now AI's turn (X), get AI move
      if (gameStateAfterMove.mode === 'vs-ai' && nextPlayer === 'X') {
        console.log('Triggering AI move, state:', gameStateAfterMove)

        // Set state optimistically but be ready to revert
        setGameState(gameStateAfterMove)

        try {
          await getAIMove(gameStateAfterMove)
        } catch (error) {
          // Revert to state before user move if AI fails
          console.error('AI move failed, reverting user move')
          setGameState(gameState) // Revert to original state
          setIsAiThinking(false) // Ensure loading state is cleared

          let errorMessage = 'AI move failed. Your move has been reverted.'
          let details = {}
          
          if (error instanceof Error) {
            // Capture LLM response details for tooltip
            if ((error as any).llmResponse || (error as any).errorType) {
              details = {
                llmResponse: (error as any).llmResponse,
                errorType: (error as any).errorType
              }
            }
            
            if (
              error.message.includes('model is required') ||
              error.message.includes('not configured')
            ) {
              errorMessage =
                'AI is not properly configured. Please check Settings. Your move has been reverted.'
            } else {
              errorMessage = `AI Error: ${error.message}. Your move has been reverted.`
            }
          }

          setError(errorMessage)
          setErrorDetails(details)
          toast.error(errorMessage)
        }
      } else {
        // For vs-human mode, just update the state
        setGameState(gameStateAfterMove)
        console.log('Not triggering AI move:', { mode: gameStateAfterMove.mode, nextPlayer })
      }
    },
    [gameState]
  )

  const getAIMove = async (currentGameState: GameState) => {
    setIsAiThinking(true)

    if (!window.api?.nextStep) {
      throw new Error('Game API is not available. Please restart the application.')
    }

    // Check if model is configured before making AI call
    const ollamaModel = await window.api.settings.getOllamaModel()
    if (!ollamaModel || ollamaModel.trim() === '') {
      throw new Error(
        'Ollama model is not configured. Please go to Settings and configure your model.'
      )
    }

    console.log('Calling AI with state:', currentGameState)
    const newGameState = await window.api.nextStep(currentGameState)
    console.log('AI returned state:', newGameState)

    // Validate AI response
    if (!newGameState || !newGameState.board) {
      throw new Error('Invalid response from AI')
    }

    console.log('AI move completed, updating state to:', newGameState)
    setGameState(newGameState)
    setIsAiThinking(false)

    // Check AI move result and show appropriate messages
    if (newGameState.gameOver) {
      if (newGameState.winner === 'X') {
        toast.error('AI won! Better luck next time.')
      } else if (newGameState.winner === 'draw') {
        toast.info("It's a draw!")
      }
    }

    console.log('After AI move, current player should be:', newGameState.currentPlayer)
  }

  const startNewGame = () => {
    setGameState(createInitialGameState(gameMode))
    setIsAiThinking(false)
    setError('')
    setErrorDetails({})
  }

  const resetToMenu = () => {
    setGameState(null)
    setIsAiThinking(false)
    setError('')
    setErrorDetails({})
  }

  const handleModeChange = (newMode: GameMode) => {
    setGameMode(newMode)
    // Don't start a game immediately when mode changes
  }

  const getStatusMessage = (): React.ReactNode => {
    if (!gameState) return ''

    if (gameState.gameOver) {
      if (gameState.winner === 'draw') return <Text>It's a draw!</Text>
      if (gameState.mode === 'vs-human') {
        return <Text>Player {gameState.winner} won!</Text>
      } else {
        if (gameState.winner === 'O') return <Text>You won!</Text>
        if (gameState.winner === 'X') return <Text>AI won!</Text>
      }
    }

    if (isAiThinking)
      return (
        <Flex align="center" gap="2" justify="center">
          <Spinner size="1" />
          <Text color="blue">AI is thinking...</Text>
        </Flex>
      )

    if (gameState.mode === 'vs-human') {
      return <Text>Player {gameState.currentPlayer}'s turn</Text>
    } else {
      if (gameState.currentPlayer === 'O') return <Text>Your turn (O)</Text>
      return <Text>AI's turn (X)</Text>
    }
  }

  const getStatusColor = (): 'green' | 'red' | 'blue' | 'gray' => {
    if (!gameState) return 'blue'

    if (gameState.gameOver) {
      if (gameState.winner === 'draw') return 'gray'
      if (gameState.mode === 'vs-human') return 'green'
      if (gameState.winner === 'O') return 'green'
      if (gameState.winner === 'X') return 'red'
    }
    return 'blue'
  }

  // Show game setup screen if no active game
  if (!gameState) {
    return (
      <Box style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
        <Flex direction="column" gap="6" align="center">
          <Text size="3" color="gray" style={{ textAlign: 'center' }}>Choose your game mode to start playing</Text>

          <Flex direction="column" gap="4" align="center" style={{ width: '100%' }}>
            <Box style={{ width: '100%' }}>
              <RadioCards.Root value={gameMode} onValueChange={handleModeChange} columns="1" size="2">
                <RadioCards.Item value="vs-ai">
                  <Flex direction="column" width="100%" gap="2" p="3">
                    <Flex align="center" gap="2">
                      <Text size="4">🤖</Text>
                      <Text size="4" weight="bold">vs AI</Text>
                    </Flex>
                    <Text size="2" color="gray">
                      You are O, AI is X
                    </Text>
                  </Flex>
                </RadioCards.Item>
                <RadioCards.Item value="vs-human">
                  <Flex direction="column" width="100%" gap="2" p="3">
                    <Flex align="center" gap="2">
                      <Text size="4">👥</Text>
                      <Text size="4" weight="bold">vs Human</Text>
                    </Flex>
                    <Text size="2" color="gray">
                      Play with a friend on the same device
                    </Text>
                  </Flex>
                </RadioCards.Item>
              </RadioCards.Root>
            </Box>
          </Flex>

          <Button onClick={startNewGame} variant="solid" size="4" style={{ width: '100%', marginTop: '8px' }}>
            🚀 Start Game
          </Button>
        </Flex>
      </Box>
    )
  }

  // Show active game
  return (
    <Box style={{ width: '100%', maxWidth: '450px', margin: '0 auto' }}>
      <Flex direction="column" gap="5" align="center">
        <Flex justify="end" align="center" style={{ width: '100%' }}>
          <Button onClick={resetToMenu} variant="ghost" size="2" color="gray">
            ← Back to Home
          </Button>
        </Flex>

        <Badge color={getStatusColor()} size="3" variant="soft" style={{ padding: '8px 16px' }}>
          {getStatusMessage()}
        </Badge>

        {error && (
          <Tooltip 
            content={
              errorDetails.llmResponse ? (
                <Box style={{ width: '100%', padding: '8px' }}>
                  <Text size="2" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                    Error Type: {errorDetails.errorType || 'unknown'}
                  </Text>
                  <Text size="1" style={{ display: 'block', fontFamily: 'monospace', whiteSpace: 'pre-wrap', background: 'var(--gray-2)', padding: '4px', borderRadius: '4px' }}>
                    {errorDetails.llmResponse}
                  </Text>
                </Box>
              ) : undefined
            }
          >
            <Callout.Root color="red" size="2" style={{ cursor: errorDetails.llmResponse ? 'help' : 'default', width: '100%' }}>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          </Tooltip>
        )}

        {/* {isAiThinking && (
          <Flex align="center" gap="2" justify="center">
            <Spinner size="2" />
            <Text size="2" color="blue">AI is thinking...</Text>
          </Flex>
        )} */}

        <Box style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          padding: '16px',
          background: 'var(--gray-2)',
          borderRadius: 'var(--radius-4)',
          border: '2px solid var(--gray-6)'
        }}>
          {gameState.board &&
            gameState.board.map((row, rowIndex) => 
              row &&
              row.map((cell, colIndex) => (
                <Cell
                  key={`${rowIndex}-${colIndex}`}
                  value={cell || ''}
                  onClick={() => makeMove(rowIndex, colIndex)}
                  disabled={
                    !gameState ||
                    gameState.gameOver ||
                    !gameState.board ||
                    !gameState.board[rowIndex] ||
                    gameState.board[rowIndex][colIndex] === undefined ||
                    (gameState.mode === 'vs-ai' && gameState.currentPlayer !== 'O') ||
                    !(
                      gameState.board[rowIndex][colIndex] === '' ||
                      gameState.board[rowIndex][colIndex] === ' '
                    ) ||
                    isAiThinking
                  }
                />
              ))
            )}
        </Box>

        <Button onClick={startNewGame} variant="solid" size="3" style={{ width: '100%' }}>
          🔄 New Game
        </Button>

        <Flex direction="column" gap="1" style={{ textAlign: 'center' }}>
          {gameMode === 'vs-ai' ? (
            <>
              <Text size="1" color="gray">
                You are O, AI is X
              </Text>
              <Text size="1" color="gray">
                Click any empty cell to make your move
              </Text>
            </>
          ) : (
            <>
              <Text size="1" color="gray">
                Player X vs Player O
              </Text>
              <Text size="1" color="gray">
                Take turns clicking empty cells
              </Text>
            </>
          )}
        </Flex>
      </Flex>
    </Box>
  )
}
