import { Injectable, signal, computed } from '@angular/core';
import { GameState, GamePhase, DiceRoll } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { Card } from '../models/card.model';

/**
 * GameStateService - Central state management using Angular Signals
 * Provides reactive state for the entire game
 */
@Injectable({
  providedIn: 'root'
})
export class GameStateService {
  // Private signal for game state
  private gameStateSignal = signal<GameState>(this.createInitialState());

  // Computed signals for derived state
  currentPlayer = computed(() => {
    const state = this.gameStateSignal();
    return state.players[state.currentPlayerIndex];
  });

  canRollDice = computed(() => {
    const state = this.gameStateSignal();
    return state.phase === GamePhase.Rolling || state.phase === GamePhase.FinalRound;
  });

  isGameOver = computed(() => {
    return this.gameStateSignal().phase === GamePhase.GameOver;
  });

  deckCount = computed(() => {
    return this.gameStateSignal().deck.length;
  });

  isFinalRound = computed(() => {
    return this.gameStateSignal().finalRoundStarted;
  });

  // Expose read-only access to full state
  gameState = computed(() => this.gameStateSignal());

  private createInitialState(): GameState {
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

  /**
   * Initialize game with players and deck
   */
  initGame(players: Player[], deck: Card[]): void {
    this.gameStateSignal.set({
      players,
      currentPlayerIndex: 0,
      deck,
      deckEmpty: false,
      finalRoundStarted: false,
      finalRoundPlayerIndex: null,
      lastDiceRoll: null,
      phase: GamePhase.Rolling,
      winner: null
    });
  }

  /**
   * Update the current game phase
   */
  updatePhase(phase: GamePhase): void {
    this.gameStateSignal.update(state => ({ ...state, phase }));
  }

  /**
   * Set the last dice roll
   */
  setDiceRoll(diceRoll: DiceRoll): void {
    this.gameStateSignal.update(state => ({ ...state, lastDiceRoll: diceRoll }));
  }

  /**
   * Advance to the next player's turn
   */
  nextPlayer(): void {
    this.gameStateSignal.update(state => {
      const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;

      // Check if final round is complete
      if (state.finalRoundStarted && state.finalRoundPlayerIndex !== null) {
        if (nextIndex === state.finalRoundPlayerIndex) {
          // Final round complete, don't advance
          return state;
        }
      }

      return {
        ...state,
        currentPlayerIndex: nextIndex,
        lastDiceRoll: null,
        phase: state.finalRoundStarted ? GamePhase.FinalRound : GamePhase.Rolling
      };
    });
  }

  /**
   * Update a player's tableau
   */
  updatePlayerTableau(playerId: string, tableau: Card[]): void {
    this.gameStateSignal.update(state => ({
      ...state,
      players: state.players.map(p =>
        p.id === playerId ? { ...p, tableau } : p
      )
    }));
  }

  /**
   * Update a player's captured cards
   */
  updatePlayerCapturedCards(playerId: string, capturedCards: Card[]): void {
    this.gameStateSignal.update(state => ({
      ...state,
      players: state.players.map(p =>
        p.id === playerId ? { ...p, capturedCards } : p
      )
    }));
  }

  /**
   * Update the deck
   */
  updateDeck(deck: Card[]): void {
    this.gameStateSignal.update(state => ({
      ...state,
      deck,
      deckEmpty: deck.length === 0
    }));
  }

  /**
   * Start the final round (one roll per player after deck is empty)
   */
  startFinalRound(): void {
    this.gameStateSignal.update(state => ({
      ...state,
      finalRoundStarted: true,
      finalRoundPlayerIndex: state.currentPlayerIndex,
      phase: GamePhase.FinalRound
    }));
  }

  /**
   * Check if final round is complete
   */
  isFinalRoundComplete(): boolean {
    const state = this.gameStateSignal();
    if (!state.finalRoundStarted || state.finalRoundPlayerIndex === null) {
      return false;
    }

    // Calculate next player index
    const nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    return nextIndex === state.finalRoundPlayerIndex;
  }

  /**
   * Set the winner and end the game
   */
  setWinner(winner: Player): void {
    this.gameStateSignal.update(state => ({
      ...state,
      winner,
      phase: GamePhase.GameOver
    }));
  }

  /**
   * Reset game state
   */
  reset(): void {
    this.gameStateSignal.set(this.createInitialState());
  }
}
