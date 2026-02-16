/**
 * Game state model for Finest 9 game
 */

import { Card } from './card.model';
import { Player } from './player.model';

export enum GamePhase {
  Setup = 'setup',
  Rolling = 'rolling',
  Matching = 'matching',
  Drawing = 'drawing',
  BotThinking = 'bot-thinking',
  FinalRound = 'final-round',
  GameOver = 'game-over'
}

export interface DiceRoll {
  die1: number; // 1-6
  die2: number; // 1-6
  total: number; // Sum of die1 + die2
  isSnakeEyes: boolean; // total === 2
  isBoxcars: boolean; // total === 12
  isNine: boolean; // must re-roll
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  deckEmpty: boolean;
  finalRoundStarted: boolean;
  finalRoundPlayerIndex: number | null; // Track which player started final round
  lastDiceRoll: DiceRoll | null;
  phase: GamePhase;
  winner: Player | null;
}

/**
 * Initial game state factory
 */
export function createInitialGameState(): GameState {
  return {
    players: [],
    currentPlayerIndex: 0,
    deck: [],
    deckEmpty: false,
    finalRoundStarted: false,
    finalRoundPlayerIndex: null,
    lastDiceRoll: null,
    phase: GamePhase.Setup,
    winner: null
  };
}
