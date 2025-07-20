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
  Text
} from '@radix-ui/themes'
import { CircleIcon } from '@radix-ui/react-icons'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { 
  Connect4GameState, 
  Connect4Player, 
  Connect4Cell,
  Connect4MoveData
} from './types'
import type { GameMode } from '../../../../types/tictac'
import { Connect4API } from './Connect4API'
import { CONNECT4_COLS, CONNECT4_ROWS } from './types'

const connect4API = new Connect4API()

const createInitialGameState = (mode: GameMode = 'vs-ai'): Connect4GameState => ({
  id: `connect4-${Date.now()}`,
  gameType: 'connect4',
  status: 'in_progress',
  mode,
  board: Array(CONNECT4_ROWS).fill(null).map(() => Array(CONNECT4_COLS).fill('')),
  currentPlayer: mode === 'vs-ai' ? 'yellow' : 'red', // In vs-ai: User is yellow, AI is red
  players: {
    red: { name: mode === 'vs-ai' ? 'AI' : 'Player 1', type: mode === 'vs-ai' ? 'ai' : 'human' },
    yellow: { name: mode === 'vs-ai' ? 'You' : 'Player 2', type: 'human' }
  },
  gameOver: false,
  createdAt: new Date(),
  lastMove: new Date()
})

interface CellProps {
  value: Connect4Cell
  isLastMove?: boolean
  onClick?: () => void
  disabled?: boolean
}

function Cell({ value, isLastMove, onClick, disabled }: CellProps) {
  const getCellStyles = () => {
    const baseStyle = {
      width: '60px',
      height: '60px',
      fontWeight: 'bold',
      cursor: 'default',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 'var(--radius-3)',
      border: '1px solid var(--gray-5)',
      transform: 'scale(1)'
    }

    return baseStyle
  }

  const getCellIcon = () => {
    if (value === 'red') return <CircleIcon width="24" height="24" style={{ color: '#f87171' }} />
    if (value === 'yellow') return <CircleIcon width="24" height="24" style={{ color: '#fde047' }} />
    return null
  }


  return (
    <Button
      variant={value ? 'soft' : 'outline'}
      onClick={onClick}
      disabled={disabled}
      size="1"
      style={getCellStyles()}
    >
      {getCellIcon()}
    </Button>
  )
}

interface ColumnHeaderProps {
  column: number
  onClick: () => void
  disabled: boolean
  canDrop: boolean
  currentPlayer: Connect4Player
}

function ColumnHeader({ onClick, disabled, canDrop, currentPlayer }: ColumnHeaderProps) {
  const getHeaderStyle = () => {
    const baseStyle = {
      width: '60px',
      height: '30px',
      cursor: !disabled && canDrop ? 'pointer' : 'default',
      borderRadius: 'var(--radius-3)',
      border: '1px solid var(--gray-5)',
      transition: 'all 0.2s ease',
      opacity: !canDrop ? 0.3 : 1,
      color: !canDrop ? 'var(--gray-8)' : currentPlayer === 'red' ? '#f87171' : '#fde047'
    }
    return baseStyle
  }

  return (
    <Button
      variant={canDrop ? 'soft' : 'ghost'}
      onClick={onClick}
      disabled={disabled || !canDrop}
      size="1"
      style={getHeaderStyle()}
    >
      <Text size="1" weight="bold">↓</Text>
    </Button>
  )
}

export function Connect4() {
  const [gameMode, setGameMode] = useState<GameMode>('vs-ai')
  const [gameState, setGameState] = useState<Connect4GameState | null>(null)
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [error, setError] = useState<string>('')

  const isValidMove = (column: number): boolean => {
    if (!gameState || gameState.gameOver) return false
    if (!gameState.board || column < 0 || column >= CONNECT4_COLS) return false
    
    // Check if column is not full (top row is empty)
    if (gameState.board[0][column] !== '') return false
    
    // In vs-AI mode, only allow moves when it's the user's turn (yellow)
    if (gameState.mode === 'vs-ai' && gameState.currentPlayer !== 'yellow') return false
    
    return true
  }

  const makeMove = useCallback(
    async (column: number) => {
      if (!gameState || !isValidMove(column)) {
        return
      }

      setError('')

      const currentPlayer = gameState.currentPlayer
      const moveData: Connect4MoveData = {
        column,
        player: currentPlayer
      }

      try {
        // Apply move using the API
        const newState = await connect4API.applyMove(gameState, {
          playerId: currentPlayer,
          timestamp: new Date(),
          data: moveData
        }) as Connect4GameState

        setGameState(newState)

        // Check if game is over
        if (newState.gameOver) {
          if (newState.winner === 'draw') {
            toast.info("It's a draw!")
          } else if (gameState.mode === 'vs-human') {
            toast.success(`${newState.winner} wins! 🎉`)
          } else if (newState.winner === 'yellow') {
            toast.success('You won! 🎉')
          } else {
            toast.error('AI won! Better luck next time.')
          }
          return
        }

        // If vs AI mode and it's now AI's turn (red), get AI move
        if (newState.mode === 'vs-ai' && newState.currentPlayer === 'red') {
          await getAIMove(newState)
        }
      } catch (error) {
        console.error('Move failed:', error)
        setError(error instanceof Error ? error.message : 'Move failed')
        toast.error('Move failed')
      }
    },
    [gameState]
  )

  const getAIMove = async (currentGameState: Connect4GameState) => {
    setIsAiThinking(true)

    try {
      // Use the backend AI system
      if (!(window as any).api?.connect4?.getAIMove) {
        throw new Error('Connect4 API is not available. Please restart the application.')
      }

      const newState = await (window as any).api.connect4.getAIMove(currentGameState)
      console.log('AI returned new state:', newState)

      setGameState(newState)
      setIsAiThinking(false)

      // Check AI move result
      if (newState.gameOver) {
        if (newState.winner === 'red') {
          toast.error('AI won! Better luck next time.')
        } else if (newState.winner === 'draw') {
          toast.info("It's a draw!")
        }
      }
    } catch (error) {
      setIsAiThinking(false)
      console.error('AI move failed:', error)
      
      let errorMessage = 'AI move failed'
      if (error instanceof Error) {
        if (error.message.includes('not configured') || error.message.includes('configuration')) {
          errorMessage = 'AI is not properly configured. Please check Settings.'
        } else {
          errorMessage = `AI Error: ${error.message}`
        }
      }
      
      setError(errorMessage)
      toast.error(errorMessage)
    }
  }

  const startNewGame = async () => {
    const newGameState = createInitialGameState(gameMode)
    setGameState(newGameState)
    setIsAiThinking(false)
    setError('')
  }

  const resetToMenu = () => {
    setGameState(null)
    setIsAiThinking(false)
    setError('')
  }

  const handleModeChange = (newMode: GameMode) => {
    setGameMode(newMode)
  }

  const getStatusMessage = (): React.ReactNode => {
    if (!gameState) return ''

    if (gameState.gameOver) {
      if (gameState.winner === 'draw') return <Text>It's a draw!</Text>
      if (gameState.mode === 'vs-human') {
        return <Text>{gameState.winner} wins!</Text>
      } else {
        if (gameState.winner === 'yellow') return <Text>You won!</Text>
        if (gameState.winner === 'red') return <Text>AI won!</Text>
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
      return <Text>{gameState.currentPlayer}'s turn</Text>
    } else {
      if (gameState.currentPlayer === 'yellow') return <Text>Your turn (Yellow)</Text>
      return <Text>AI's turn (Red)</Text>
    }
  }

  const getStatusColor = (): 'green' | 'red' | 'blue' | 'gray' => {
    if (!gameState) return 'blue'

    if (gameState.gameOver) {
      if (gameState.winner === 'draw') return 'gray'
      if (gameState.mode === 'vs-human') return 'green'
      if (gameState.winner === 'yellow') return 'green'
      if (gameState.winner === 'red') return 'red'
    }
    return 'blue'
  }

  const canDropInColumn = (column: number): boolean => {
    if (!gameState) return false
    return gameState.board[0][column] === ''
  }

  // Show game setup screen if no active game
  if (!gameState) {
    return (
      <Box style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
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
                      You are yellow, AI is red
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
    <Box style={{ width: '100%', maxWidth: '500px', margin: '0 auto' }}>
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
          <Callout.Root color="red" size="2" style={{ width: '100%' }}>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {/* Column drop buttons */}
        <Box style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${CONNECT4_COLS}, minmax(0, 1fr))`,
          gap: '8px',
          width: '100%',
          paddingLeft: '16px',
          paddingRight: '16px',
          justifyItems: 'center'
        }}>
          {Array.from({ length: CONNECT4_COLS }, (_, col) => (
            <ColumnHeader
              key={col}
              column={col}
              onClick={() => makeMove(col)}
              disabled={!gameState || gameState.gameOver || isAiThinking}
              canDrop={canDropInColumn(col)}
              currentPlayer={gameState?.currentPlayer || 'yellow'}
            />
          ))}
        </Box>

        {/* Game board */}
        <Box style={{ 
          display: 'grid',
          gridTemplateColumns: `repeat(${CONNECT4_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${CONNECT4_ROWS}, minmax(0, 1fr))`,
          gap: '8px',
          padding: '16px',
          background: 'var(--gray-2)',
          borderRadius: 'var(--radius-4)',
          border: '2px solid var(--gray-6)',
          justifyItems: 'center',
          alignItems: 'center',
          width: '100%'
        }}>
          {gameState.board.map((row, rowIndex) => 
            row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                value={cell}
                isLastMove={gameState.lastColumn === colIndex && rowIndex === gameState.board.findIndex(r => r[colIndex] !== '') - 1}
                disabled={true} // Cells are not clickable, only column headers
              />
            ))
          )}
        </Box>

        <Button onClick={startNewGame} variant="solid" size="3" style={{ width: '100%' }}>
          🔄 New Game
        </Button>

        <Flex direction="column" gap="1" style={{ textAlign: 'center' }}>
          <Text size="1" color="gray">
            Drop checkers by clicking the arrows above each column
          </Text>
          <Text size="1" color="gray">
            Connect four pieces in a row to win!
          </Text>
        </Flex>
      </Flex>
    </Box>
  )
}
