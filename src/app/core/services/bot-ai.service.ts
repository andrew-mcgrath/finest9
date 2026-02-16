import { Injectable } from '@angular/core';
import { Player } from '../models/player.model';
import { Match } from '../models/match.model';
import { DiceRoll } from '../models/game-state.model';

/**
 * Bot decision result
 */
export interface BotDecision {
  action: 'match' | 'draw';
  selectedMatch?: Match;
  thinkingTime: number; // milliseconds to wait before executing
}

/**
 * BotAIService - AI decision-making for bot players
 * Implements intelligent but beatable bot logic
 */
@Injectable({
  providedIn: 'root'
})
export class BotAIService {
  // Configuration
  private readonly MIN_THINKING_TIME = 500; // ms
  private readonly MAX_THINKING_TIME = 1500; // ms
  private readonly OPTIMAL_CHOICE_PROBABILITY = 0.8; // 80% optimal, 20% random

  /**
   * Determine bot's move based on current state
   * Returns a promise that resolves after thinking time
   */
  async decideBotMove(
    player: Player,
    diceRoll: DiceRoll,
    possibleMatches: Match[]
  ): Promise<BotDecision> {
    const thinkingTime = this.calculateThinkingTime();

    // Wait for thinking time (simulates bot "thinking")
    await this.delay(thinkingTime);

    // If no matches available, must draw
    if (possibleMatches.length === 0) {
      return {
        action: 'draw',
        thinkingTime
      };
    }

    // Select best match
    const selectedMatch = this.selectMatch(possibleMatches);

    return {
      action: 'match',
      selectedMatch,
      thinkingTime
    };
  }

  /**
   * Select a match from available options
   * 80% of the time selects optimal match, 20% random for unpredictability
   */
  private selectMatch(matches: Match[]): Match {
    // Apply randomness factor
    const useOptimal = Math.random() < this.OPTIMAL_CHOICE_PROBABILITY;

    if (useOptimal) {
      return this.selectBestMatch(matches);
    } else {
      return this.selectRandomMatch(matches);
    }
  }

  /**
   * Select the best match based on scoring priority
   * Priority: 1) Higher score, 2) More cards (reduces end-game penalty)
   */
  private selectBestMatch(matches: Match[]): Match {
    let bestMatch = matches[0];
    let bestScore = bestMatch.score;
    let bestCardCount = bestMatch.cards.length;

    for (let i = 1; i < matches.length; i++) {
      const match = matches[i];

      // Prefer higher score
      if (match.score > bestScore) {
        bestMatch = match;
        bestScore = match.score;
        bestCardCount = match.cards.length;
      } else if (match.score === bestScore) {
        // If scores are equal, prefer more cards
        if (match.cards.length > bestCardCount) {
          bestMatch = match;
          bestCardCount = match.cards.length;
        }
      }
    }

    return bestMatch;
  }

  /**
   * Select a random match from available options
   */
  private selectRandomMatch(matches: Match[]): Match {
    const randomIndex = Math.floor(Math.random() * matches.length);
    return matches[randomIndex];
  }

  /**
   * Calculate random thinking time
   */
  private calculateThinkingTime(): number {
    const range = this.MAX_THINKING_TIME - this.MIN_THINKING_TIME;
    return this.MIN_THINKING_TIME + Math.floor(Math.random() * range);
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Evaluate a player's position (for future advanced AI)
   * Returns a score indicating how good the position is
   */
  evaluatePosition(player: Player): number {
    // Simple evaluation: captured - remaining
    const capturedValue = player.capturedCards.reduce((sum, card) => {
      return sum + this.getCardValue(card.rank);
    }, 0);

    const tableauValue = player.tableau.reduce((sum, card) => {
      return sum + this.getCardValue(card.rank);
    }, 0);

    return capturedValue - tableauValue;
  }

  /**
   * Get card value for evaluation
   */
  private getCardValue(rank: string): number {
    const values: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 11
    };
    return values[rank] || 0;
  }
}
