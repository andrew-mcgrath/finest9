import { Injectable } from '@angular/core';
import { Card, getCardValue } from '../models/card.model';
import { Player } from '../models/player.model';

/**
 * ScoringService - Handles score calculations
 * Responsible for calculating card values and final player scores
 */
@Injectable({
  providedIn: 'root'
})
export class ScoringService {
  /**
   * Calculate total points for an array of cards
   */
  calculateCardsValue(cards: Card[]): number {
    return cards.reduce((total, card) => total + getCardValue(card.rank), 0);
  }

  /**
   * Calculate a player's current score
   * Score = (captured cards points) - (remaining tableau cards points)
   */
  calculatePlayerScore(player: Player): number {
    const capturedPoints = this.calculateCardsValue(player.capturedCards);
    const tableauPoints = this.calculateCardsValue(player.tableau);
    return capturedPoints - tableauPoints;
  }

  /**
   * Calculate final scores for all players
   * Returns a map of player ID to final score
   */
  calculateFinalScores(players: Player[]): Map<string, number> {
    const scores = new Map<string, number>();

    players.forEach(player => {
      const finalScore = this.calculatePlayerScore(player);
      scores.set(player.id, finalScore);
    });

    return scores;
  }

  /**
   * Determine the winner from an array of players
   * Returns the player with the highest score
   * In case of tie, returns the first player with that score
   */
  determineWinner(players: Player[]): Player | null {
    if (players.length === 0) {
      return null;
    }

    let winner = players[0];
    let highestScore = this.calculatePlayerScore(winner);

    for (let i = 1; i < players.length; i++) {
      const playerScore = this.calculatePlayerScore(players[i]);
      if (playerScore > highestScore) {
        highestScore = playerScore;
        winner = players[i];
      }
    }

    return winner;
  }

  /**
   * Get players sorted by score (highest to lowest)
   */
  getPlayersByRank(players: Player[]): Array<{ player: Player; score: number; rank: number }> {
    const playerScores = players.map(player => ({
      player,
      score: this.calculatePlayerScore(player)
    }));

    // Sort by score descending
    playerScores.sort((a, b) => b.score - a.score);

    // Add rank (handling ties)
    let currentRank = 1;
    let previousScore: number | null = null;

    return playerScores.map((item, index) => {
      if (previousScore !== null && item.score < previousScore) {
        currentRank = index + 1;
      }
      previousScore = item.score;

      return {
        ...item,
        rank: currentRank
      };
    });
  }
}
