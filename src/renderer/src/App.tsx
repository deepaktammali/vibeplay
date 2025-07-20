import { useState } from 'react'
import { Flex, Heading, Text, Box, Button, Card, Separator, Tooltip } from '@radix-ui/themes'
import { GearIcon, ArrowLeftIcon } from '@radix-ui/react-icons'
import { Settings } from './components/Settings'
import { TicTacToe } from './games/tictactoe'
import { Connect4 } from './games/connect4'
import { getAllGames, getGameMetadata } from './games'
import type { GameMetadata } from './games'

type ViewType = 'game' | 'settings'

function App(): React.JSX.Element {
  const [selectedGameId, setSelectedGameId] = useState<string>('tictactoe')
  const [currentView, setCurrentView] = useState<ViewType>('game')
  const availableGames = getAllGames()
  const selectedGame = getGameMetadata(selectedGameId)

  const renderGameComponent = (gameMetadata: GameMetadata) => {
    switch (gameMetadata.id) {
      case 'tictactoe':
        return <TicTacToe />
      case 'connect4':
        return <Connect4 />
      default:
        return (
          <Box style={{ textAlign: 'center', padding: '2rem' }}>
            <Text size="4">Game not yet implemented: {gameMetadata.displayName}</Text>
          </Box>
        )
    }
  }

  const handleGameSelect = (gameId: string) => {
    setSelectedGameId(gameId)
    setCurrentView('game')
  }

  return (
    <Flex style={{ width: '100%', height: '100vh' }}>
      {/* Sidebar */}
      <Box style={{ 
        width: '280px', 
        backgroundColor: 'var(--gray-2)', 
        borderRight: '1px solid var(--gray-6)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <Box style={{ padding: '16px', borderBottom: '1px solid var(--gray-6)' }}>
          <Heading size="4">VibePlay</Heading>
          <Text size="1" style={{ color: 'var(--gray-9)' }}>Game Collection</Text>
        </Box>

        {/* Games Section */}
        <Flex direction="column" style={{ padding: '16px', flex: 1 }}>
          <Text size="3" weight="bold" style={{ marginBottom: '24px' }}>Games</Text>
          <Flex direction="column" gap="4">
            {availableGames.map((game) => (
              <Card 
                key={game.id}
                className="game-card"
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: selectedGameId === game.id ? 'var(--accent-3)' : 'var(--gray-1)',
                  border: selectedGameId === game.id ? '2px solid var(--accent-8)' : '1px solid var(--gray-4)',
                  transition: 'background-color 0.15s ease',
                  boxShadow: selectedGameId === game.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                }}
                onClick={() => handleGameSelect(game.id)}
              >
                <Flex align="center" gap="3" style={{ padding: '12px' }}>
                  <Box style={{ 
                    fontSize: '20px',
                    minWidth: '36px',
                    height: '36px',
                    textAlign: 'center',
                    backgroundColor: selectedGameId === game.id ? 'var(--accent-4)' : 'var(--gray-4)',
                    borderRadius: '10px',
                    padding: '8px',
                    color: selectedGameId === game.id ? 'var(--accent-11)' : 'var(--gray-11)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedGameId === game.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
                  }}>
                    {game.icon}
                  </Box>
                  <Box style={{ flex: 1 }}>
                    <Tooltip content={game.description}>
                      <Text size="3" weight="bold" style={{ 
                        color: selectedGameId === game.id ? 'var(--accent-12)' : 'var(--gray-12)',
                        display: 'block'
                      }}>
                        {game.displayName}
                      </Text>
                    </Tooltip>
                  </Box>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Flex>

        {/* Settings Section */}
        <Box style={{ padding: '16px', borderTop: '1px solid var(--gray-6)' }}>
          <Button 
            variant="ghost"
            onClick={() => setCurrentView('settings')}
            style={{ 
              width: '100%', 
              justifyContent: 'flex-start',
              gap: '8px',
              height: '40px',
              color: currentView === 'settings' ? 'var(--accent-11)' : 'var(--gray-11)',
              backgroundColor: currentView === 'settings' ? 'var(--accent-3)' : 'transparent'
            }}
          >
            <GearIcon width="16" height="16" />
            Settings
          </Button>
        </Box>
      </Box>

      {/* Main Content */}
      <Box style={{ flex: 1, padding: '24px', backgroundColor: 'var(--gray-1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {currentView === 'game' ? (
          <Flex direction="column" style={{ width: '100%', minHeight: '100%' }}>
            {selectedGame ? (
              <Box>
                <Flex align="center" justify="between" style={{ marginBottom: '24px' }}>
                  <Flex align="center" gap="3">
                    <Text size="6">{selectedGame.icon}</Text>
                    <Box>
                      <Heading size="5">{selectedGame.displayName}</Heading>
                      <Text size="2" color="gray">{selectedGame.description}</Text>
                    </Box>
                  </Flex>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setSelectedGameId('')
                      setCurrentView('game')
                    }}
                    size="2"
                  >
                    <ArrowLeftIcon width="16" height="16" />
                    Back to Home
                  </Button>
                </Flex>
                {renderGameComponent(selectedGame)}
              </Box>
            ) : (
              <Box style={{ textAlign: 'center', padding: '2rem' }}>
                <Text size="4">No game selected</Text>
              </Box>
            )}
          </Flex>
        ) : (
          <Box>
            <Flex align="center" gap="3" style={{ marginBottom: '24px' }}>
              <Text size="6">⚙️</Text>
              <Box>
                <Heading size="5">Settings</Heading>
                <Text size="2" color="gray">Configure your AI provider and game preferences</Text>
              </Box>
            </Flex>
            <Box style={{ maxWidth: '800px', overflow: 'hidden' }}>
              <Settings />
            </Box>
          </Box>
        )}
      </Box>
    </Flex>
  )
}

export default App
