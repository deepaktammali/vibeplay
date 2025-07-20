import { Component } from 'react'
import type { BaseGameState, GameMove, GameError, GameComponent } from '../../../types/game'

export interface BaseGameProps {
  gameMetadata: {
    id: string
    name: string
    displayName: string
    icon: string
  }
  onGameEnd?: (result: { winner?: string | number | 'draw' }) => void
  onError?: (error: GameError) => void
}

export interface BaseGameComponentState {
  gameState: BaseGameState | null
  isLoading: boolean
  error: string
  errorDetails: Record<string, any>
}

export abstract class BaseGameComponent<P extends BaseGameProps = BaseGameProps, S extends BaseGameComponentState = BaseGameComponentState> 
  extends Component<P, S> 
  implements GameComponent {

  constructor(props: P) {
    super(props)
    this.state = this.getInitialState()
  }

  abstract getInitialState(): S

  abstract initializeGame(config?: any): BaseGameState

  abstract validateMove(move: GameMove): boolean

  abstract renderGame(): React.ReactNode

  abstract renderGameSetup(): React.ReactNode

  get gameState(): BaseGameState | null {
    return this.state.gameState
  }

  async onMove(move: GameMove): Promise<void> {
    if (!this.state.gameState || !this.validateMove(move)) {
      return
    }

    this.setState({ isLoading: true, error: '', errorDetails: {} })

    try {
      // Process move locally first
      const newState = await this.processMove(this.state.gameState, move)
      this.setState({ gameState: newState })

      // Check if game ended
      if (newState.gameOver) {
        this.onGameEnd({ winner: newState.winner })
        return
      }

      // If AI needs to make a move, handle that
      if (this.needsAIMove(newState)) {
        await this.handleAIMove(newState)
      }
    } catch (error) {
      this.onError(error as GameError)
    } finally {
      this.setState({ isLoading: false })
    }
  }

  onGameEnd(result: { winner?: string | number | 'draw' }): void {
    this.props.onGameEnd?.(result)
  }

  onError(error: GameError): void {
    this.setState({
      error: error.message,
      errorDetails: error.context || {}
    })
    this.props.onError?.(error)
  }

  protected abstract processMove(gameState: BaseGameState, move: GameMove): Promise<BaseGameState>

  protected abstract needsAIMove(gameState: BaseGameState): boolean

  protected abstract handleAIMove(gameState: BaseGameState): Promise<void>

  protected startNewGame = (config?: any): void => {
    const newGameState = this.initializeGame(config)
    this.setState({
      gameState: newGameState,
      error: '',
      errorDetails: {},
      isLoading: false
    })
  }

  protected resetToMenu = (): void => {
    this.setState({
      gameState: null,
      error: '',
      errorDetails: {},
      isLoading: false
    })
  }

  render(): React.ReactNode {
    if (!this.state.gameState) {
      return this.renderGameSetup()
    }

    return this.renderGame()
  }
}