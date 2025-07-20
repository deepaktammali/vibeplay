import type { GameMetadata } from './game'
import { TICTACTOE_METADATA } from './tictac'
import { CONNECT4_METADATA } from '../renderer/src/games/connect4'

export interface GameRegistry {
  [gameId: string]: GameMetadata
}

// Central registry of all available games
export const AVAILABLE_GAMES: GameRegistry = {
  tictactoe: TICTACTOE_METADATA,
  connect4: CONNECT4_METADATA
}

// Helper functions for game registry
export const getGameMetadata = (gameId: string): GameMetadata | undefined => {
  return AVAILABLE_GAMES[gameId]
}

export const getAllGames = (): GameMetadata[] => {
  return Object.values(AVAILABLE_GAMES)
}

export const getGamesByMode = (mode: string): GameMetadata[] => {
  return getAllGames().filter(game => game.supportsModes.includes(mode as any))
}

export const getAIEnabledGames = (): GameMetadata[] => {
  return getAllGames().filter(game => game.requiresAI)
}