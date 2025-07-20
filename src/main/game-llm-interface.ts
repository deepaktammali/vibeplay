import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { z } from 'zod/v4'
import type { BaseGameState } from '../types/game'
import { SettingsService } from './settings'
import { LLMFactory } from './llm-factory'

// Base interfaces for game LLM integration
export interface GameLLMMove<T = any> {
  data: T
  reasoning?: string
}

export interface GameLLMError extends Error {
  llmResponse?: string
  errorType?: 'invalid_move' | 'invalid_json' | 'connection_failed' | 'config_error'
  gameType?: string
}

export interface GameLLMResponse<T = any> {
  move: GameLLMMove<T>
  reasoning?: string
}

// Abstract base class for game-specific LLM handlers
export abstract class BaseGameLLM<TGameState extends BaseGameState, TMoveData = any> {
  protected gameType: string

  constructor(gameType: string) {
    this.gameType = gameType
  }

  // Abstract methods that each game must implement
  abstract getMoveSchema(): z.ZodSchema<any>
  abstract isValidMove(gameState: TGameState, moveData: TMoveData): boolean
  abstract applyMove(gameState: TGameState, moveData: TMoveData): TGameState
  abstract checkGameEnd(gameState: TGameState): { isEnded: boolean; winner?: string | 'draw' }
  abstract formatBoardForPrompt(gameState: TGameState): string
  abstract getGameRules(): string
  abstract getStrategyInstructions(): string
  abstract getCurrentPlayerSymbol(gameState: TGameState): string
  abstract getOpponentPlayerSymbol(gameState: TGameState): string

  // Common LLM generation logic
  async generateMove(
    gameState: TGameState,
    maxRetries = 3,
    previousFailures: string[] = []
  ): Promise<GameLLMResponse<TMoveData>> {
    // Get current provider configuration
    const aiProvider = SettingsService.getAIProvider()
    const providerConfig = SettingsService.getProviderConfig()


    // Validate configuration
    const validation = await SettingsService.validateProviderConfig(providerConfig)
    if (!validation.valid) {
      throw new Error(`AI configuration is invalid: ${validation.errors.join(', ')}`)
    }

    // Create LLM instance based on provider
    const llm = LLMFactory.getCurrentLLM(providerConfig)

    const feedbackSection = this.buildFeedbackSection(previousFailures)
    const prompt = this.buildPrompt()
    const parser = StructuredOutputParser.fromZodSchema(this.getMoveSchema())

    try {
      const formattedPrompt = await prompt.format({
        player: this.getCurrentPlayerSymbol(gameState),
        opponent: this.getOpponentPlayerSymbol(gameState),
        board: this.formatBoardForPrompt(gameState),
        gameRules: this.getGameRules(),
        strategyInstructions: this.getStrategyInstructions(),
        feedbackSection,
        format_instructions: parser.getFormatInstructions(),
        ...this.getAdditionalPromptVariables()
      })


      const response = await llm.invoke(formattedPrompt)

      // Convert response to string if it's an AIMessageChunk
      const responseText = typeof response === 'string' 
        ? response 
        : typeof response.content === 'string' 
          ? response.content 
          : JSON.stringify(response.content)

      let parsedResponse
      try {
        parsedResponse = await parser.parse(responseText)
      } catch (parseError) {
        console.error(`${this.gameType} Parse Error:`, parseError)
        const error = new Error(`Failed to parse LLM response: ${parseError}`) as GameLLMError
        error.llmResponse = responseText
        error.errorType = 'invalid_json'
        error.gameType = this.gameType
        throw error
      }


      // Validate the move
      if (!this.isValidMove(gameState, parsedResponse.move)) {
        const failureMessage = this.getInvalidMoveMessage(gameState, parsedResponse.move)
        
        if (maxRetries > 0) {
          return this.generateMove(
            gameState,
            maxRetries - 1,
            [...previousFailures, failureMessage]
          )
        } else {
          const error = new Error(`Invalid move after 3 attempts: ${failureMessage}`) as GameLLMError
          error.llmResponse = responseText
          error.errorType = 'invalid_move'
          error.gameType = this.gameType
          throw error
        }
      }

      return {
        move: {
          data: parsedResponse.move,
          reasoning: parsedResponse.reasoning
        },
        reasoning: parsedResponse.reasoning
      }
    } catch (error: any) {
      console.error(`${this.gameType} LLM Error:`, error)
      
      if (error.errorType) {
        throw error // Re-throw errors that already have types
      }
      
      const llmError = new Error(`${this.gameType} LLM request failed: ${error.message}`) as GameLLMError
      llmError.llmResponse = error.response || 'No response'
      llmError.errorType = 'connection_failed'
      llmError.gameType = this.gameType
      throw llmError
    }
  }

  // Common method to generate next game state
  async generateNextStep(gameState: TGameState): Promise<TGameState> {
    try {
      
      const llmResponse = await this.generateMove(gameState)

      // Apply the move
      const newGameState = this.applyMove(gameState, llmResponse.move.data)
      
      // Check for game end
      const gameEnd = this.checkGameEnd(newGameState)
      
      const finalGameState = {
        ...newGameState,
        gameOver: gameEnd.isEnded,
        winner: gameEnd.winner,
        status: gameEnd.isEnded ? 'completed' : 'in_progress',
        lastMove: new Date()
      } as TGameState

      return finalGameState

    } catch (error: any) {
      console.error(`${this.gameType} generateNextStep failed:`, error)
      throw error
    }
  }

  // Helper methods that can be overridden by subclasses
  protected buildFeedbackSection(previousFailures: string[]): string {
    return previousFailures.length > 0
      ? `\nPREVIOUS MISTAKES TO AVOID:
${previousFailures.map((failure) => `- ${failure}`).join('\n')}

Please learn from these mistakes and make a valid move.\n`
      : ''
  }

  protected buildPrompt(): PromptTemplate {
    return PromptTemplate.fromTemplate(`
You are playing {gameType} as {player} against {opponent}.

{board}

{gameRules}

{strategyInstructions}

{feedbackSection}

{format_instructions}

Return your move as JSON.
`)
  }

  protected getAdditionalPromptVariables(): Record<string, any> {
    return {
      gameType: this.gameType
    }
  }

  protected abstract getInvalidMoveMessage(gameState: TGameState, moveData: TMoveData): string
}

// Game LLM Registry
export class GameLLMRegistry {
  private static handlers: Map<string, BaseGameLLM<any, any>> = new Map()

  static register<T extends BaseGameState, M = any>(
    gameType: string, 
    handler: BaseGameLLM<T, M>
  ): void {
    this.handlers.set(gameType, handler)
  }

  static getHandler<T extends BaseGameState, M = any>(
    gameType: string
  ): BaseGameLLM<T, M> | undefined {
    return this.handlers.get(gameType)
  }

  static async generateNextStep<T extends BaseGameState>(
    gameType: string, 
    gameState: T
  ): Promise<T> {
    const handler = this.getHandler<T>(gameType)
    if (!handler) {
      throw new Error(`No LLM handler registered for game type: ${gameType}`)
    }
    return handler.generateNextStep(gameState)
  }
}