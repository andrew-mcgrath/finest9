import { Injectable } from '@angular/core';
import { GameStateService } from './game-state.service';
import { DeckService } from './deck.service';
import { DiceService } from './dice.service';
import { MatchValidatorService } from './match-validator.service';
import { ScoringService } from './scoring.service';
import { Player } from '../models/player.model';
import { Match } from '../models/match.model';
import { GamePhase, DiceRoll } from '../models/game-state.model';
import { Card } from '../models/card.model';

/**
 * GameEngineService - Core game loop orchestration
 * Handles turn progression, match processing, and game flow
 */
@Injectable({
  providedIn: 'root'
})
export class GameEngineService {
  constructor(
    private gameState: GameStateService,
    private deckService: DeckService,
    private diceService: DiceService,
    private matchValidator: MatchValidatorService,
    private scoringService: ScoringService
  ) {}

  /**
   * Start a new game
   */
  startGame(players: Player[]): void {
    // Create and shuffle deck
    let deck = this.deckService.createDeck();
    deck = this.deckService.shuffle(deck);

    // Deal 9 cards to each player
    const updatedPlayers = players.map(player => {
      const { dealtCards, remainingDeck } = this.deckService.dealCards(deck, 9);
      deck = remainingDeck;
      return {
        ...player,
        tableau: dealtCards,
        capturedCards: [],
        currentScore: 0
      };
    });

    // Initialize game state
    this.gameState.initGame(updatedPlayers, deck);
  }

  /**
   * Roll dice for current player
   * Automatically re-rolls if total is 9
   */
  rollDice(): DiceRoll {
    const diceRoll = this.diceService.rollUntilNotNine();
    this.gameState.setDiceRoll(diceRoll);
    this.gameState.updatePhase(GamePhase.Matching);
    return diceRoll;
  }

  /**
   * Find all possible matches for current player based on dice roll
   */
  findPossibleMatches(): Match[] {
    const currentPlayer = this.gameState.currentPlayer();
    const diceRoll = this.gameState.gameState().lastDiceRoll;

    if (!diceRoll) {
      return [];
    }

    return this.matchValidator.findPossibleMatches(currentPlayer.tableau, diceRoll);
  }

  /**
   * Process a match - capture cards and advance turn
   */
  processMatch(match: Match): void {
    const currentPlayer = this.gameState.currentPlayer();
    const diceRoll = this.gameState.gameState().lastDiceRoll;

    if (!diceRoll) {
      throw new Error('No dice roll available');
    }

    // Validate match is legal
    if (!this.matchValidator.validateMatch(match, diceRoll)) {
      throw new Error('Invalid match for current dice roll');
    }

    // Remove matched cards from tableau
    const newTableau = currentPlayer.tableau.filter(
      card => !match.cards.some(matchCard => matchCard.id === card.id)
    );

    // Add matched cards to captured pile
    const newCapturedCards = [...currentPlayer.capturedCards, ...match.cards];

    // Update player state
    this.gameState.updatePlayerTableau(currentPlayer.id, newTableau);
    this.gameState.updatePlayerCapturedCards(currentPlayer.id, newCapturedCards);

    // Update score
    const newScore = this.scoringService.calculatePlayerScore({
      ...currentPlayer,
      tableau: newTableau,
      capturedCards: newCapturedCards
    });

    // Advance turn
    this.advanceTurn();
  }

  /**
   * Process drawing a card when no match is available
   */
  processDrawCard(): void {
    const currentPlayer = this.gameState.currentPlayer();
    const currentDeck = this.gameState.gameState().deck;

    if (currentDeck.length === 0) {
      // No cards to draw, just advance turn
      this.advanceTurn();
      return;
    }

    // Draw one card
    const { dealtCards, remainingDeck } = this.deckService.dealCards(currentDeck, 1);

    // Add card to player's tableau
    const newTableau = [...currentPlayer.tableau, dealtCards[0]];
    this.gameState.updatePlayerTableau(currentPlayer.id, newTableau);

    // Update deck
    this.gameState.updateDeck(remainingDeck);

    // Check if deck is now empty and start final round
    if (remainingDeck.length === 0 && !this.gameState.isFinalRound()) {
      this.gameState.startFinalRound();
    }

    // Advance turn
    this.advanceTurn();
  }

  /**
   * Advance to next turn
   */
  private advanceTurn(): void {
    const state = this.gameState.gameState();

    // Check if final round is complete
    if (state.finalRoundStarted && this.gameState.isFinalRoundComplete()) {
      this.endGame();
      return;
    }

    // Move to next player
    this.gameState.nextPlayer();
  }

  /**
   * End the game and determine winner
   */
  private endGame(): void {
    const players = this.gameState.gameState().players;
    const winner = this.scoringService.determineWinner(players);

    if (winner) {
      this.gameState.setWinner(winner);
    } else {
      // Should not happen, but handle gracefully
      this.gameState.updatePhase(GamePhase.GameOver);
    }
  }

  /**
   * Get final scores for all players
   */
  getFinalScores(): Map<string, number> {
    const players = this.gameState.gameState().players;
    return this.scoringService.calculateFinalScores(players);
  }

  /**
   * Get players ranked by score
   */
  getPlayerRankings(): Array<{ player: Player; score: number; rank: number }> {
    const players = this.gameState.gameState().players;
    return this.scoringService.getPlayersByRank(players);
  }

  /**
   * Reset game state
   */
  resetGame(): void {
    this.gameState.reset();
  }
}
