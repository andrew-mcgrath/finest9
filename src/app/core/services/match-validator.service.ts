import { Injectable } from '@angular/core';
import { Card, Rank, getRankNumericValue, isWild9, getCardValue } from '../models/card.model';
import { Match, MatchType } from '../models/match.model';
import { DiceRoll } from '../models/game-state.model';
import { ScoringService } from './scoring.service';

/**
 * MatchValidatorService - Handles match detection and validation
 * This is the most complex service - handles all matching rules including
 * pairs, sets, sequences, wild 9s, and special rolls
 */
@Injectable({
  providedIn: 'root'
})
export class MatchValidatorService {
  constructor(private scoringService: ScoringService) { }

  /**
   * Find all possible matches from a tableau based on the dice roll
   */
  findPossibleMatches(tableau: Card[], diceRoll: DiceRoll): Match[] {
    const matches: Match[] = [];

    // Special case: Snake Eyes - can match any pair
    if (diceRoll.isSnakeEyes) {
      const pairMatches = this.findAllPairs(tableau);
      pairMatches.forEach(match => {
        matches.push({
          ...match,
          type: MatchType.SnakeEyes,
          isValid: true
        });
      });
    }

    // Special case: Boxcars - can match any sequence
    if (diceRoll.isBoxcars) {
      const sequenceMatches = this.findAllSequences(tableau);
      sequenceMatches.forEach(match => {
        matches.push({
          ...match,
          type: MatchType.Boxcars,
          isValid: true
        });
      });
    }

    // Normal matching: pairs/sets matching the dice value
    const pairMatch = this.detectPairs(tableau, diceRoll.total);
    if (pairMatch) {
      matches.push(pairMatch);
    }

    // Normal matching: sequences where one card matches dice value
    const sequenceMatches = this.detectSequences(tableau, diceRoll.total);
    matches.push(...sequenceMatches);

    return matches;
  }

  /**
   * Detect pairs/sets of cards matching the target value
   * Returns all cards of that rank (2 or more)
   */
  detectPairs(tableau: Card[], targetValue: number): Match | null {
    // Separate wild 9s from regular cards
    const wild9s = tableau.filter(card => isWild9(card));
    const nonWildCards = tableau.filter(card => !isWild9(card));

    // Group non-wild cards by their dice-matching value
    const cardsByValue = new Map<number, Card[]>();

    nonWildCards.forEach(card => {
      const value = getCardValue(card.rank); // Use dice-matching value, not sequence value
      if (!cardsByValue.has(value)) {
        cardsByValue.set(value, []);
      }
      cardsByValue.get(value)!.push(card);
    });

    // Look for cards matching the target value
    const matchingCards = cardsByValue.get(targetValue) || [];

    if (matchingCards.length >= 2) {
      // Have a pair/set without needing wild cards
      const type = matchingCards.length === 2 ? MatchType.Pair : MatchType.Set;
      return {
        type,
        cards: [...matchingCards],
        score: this.scoringService.calculateCardsValue(matchingCards),
        isValid: true
      };
    } else if (matchingCards.length === 1 && wild9s.length >= 1) {
      // Can make a pair with wild 9s
      const cardsToUse = [matchingCards[0], ...wild9s];
      return {
        type: MatchType.Pair,
        cards: cardsToUse,
        score: this.scoringService.calculateCardsValue(cardsToUse),
        isValid: true
      };
    } else if (matchingCards.length === 0 && wild9s.length >= 2) {
      // Two or more wild 9s can match the dice value
      return {
        type: wild9s.length === 2 ? MatchType.Pair : MatchType.Set,
        cards: [...wild9s],
        score: this.scoringService.calculateCardsValue(wild9s),
        isValid: true
      };
    }

    return null;
  }

  /**
   * Detect sequences (3 consecutive ranks) where one card matches the dice value
   */
  detectSequences(tableau: Card[], diceValue: number): Match[] {
    const sequences: Match[] = [];
    const allSequences = this.findAllSequences(tableau);

    // Filter sequences where at least one card matches the dice value
    allSequences.forEach(sequence => {
      const hasMatchingCard = sequence.cards.some(card => {
        if (isWild9(card)) return true; // Wild 9 can match any value
        return getCardValue(card.rank) === diceValue; // Use card value, not sequence value
      });

      if (hasMatchingCard) {
        sequences.push({
          ...sequence,
          isValid: true
        });
      }
    });

    return sequences;
  }

  /**
   * Find all possible 3-card sequences in the tableau
   * Handles wild 9s and Q-K-A wrapping
   */
  findAllSequences(tableau: Card[]): Match[] {
    const sequences: Match[] = [];

    if (tableau.length < 3) {
      return sequences;
    }

    // Get unique ranks and wild 9s
    const wild9s = tableau.filter(card => isWild9(card));
    const nonWildCards = tableau.filter(card => !isWild9(card));

    // Try to find sequences without wild cards first
    const sequencesWithoutWilds = this.findSequencesWithoutWilds(nonWildCards);
    sequences.push(...sequencesWithoutWilds);

    // Try to find sequences with wild cards
    if (wild9s.length > 0) {
      const sequencesWithWilds = this.findSequencesWithWilds(nonWildCards, wild9s);
      sequences.push(...sequencesWithWilds);
    }

    return sequences;
  }

  /**
   * Find all pairs in the tableau (for Snake Eyes special roll)
   */
  private findAllPairs(tableau: Card[]): Match[] {
    const pairs: Match[] = [];
    const cardsByRank = new Map<Rank, Card[]>();

    tableau.forEach(card => {
      if (!cardsByRank.has(card.rank)) {
        cardsByRank.set(card.rank, []);
      }
      cardsByRank.get(card.rank)!.push(card);
    });

    cardsByRank.forEach((cards, rank) => {
      if (cards.length >= 2) {
        const type = cards.length === 2 ? MatchType.Pair : MatchType.Set;
        pairs.push({
          type,
          cards: [...cards],
          score: this.scoringService.calculateCardsValue(cards),
          isValid: true
        });
      }
    });

    return pairs;
  }

  /**
   * Find sequences without using wild cards
   */
  private findSequencesWithoutWilds(cards: Card[]): Match[] {
    const sequences: Match[] = [];
    const rankValues = cards.map(card => ({
      card,
      value: getRankNumericValue(card.rank)
    }));

    // Sort by rank value
    rankValues.sort((a, b) => a.value - b.value);

    // Look for consecutive sequences
    for (let i = 0; i < rankValues.length - 2; i++) {
      for (let j = i + 1; j < rankValues.length - 1; j++) {
        for (let k = j + 1; k < rankValues.length; k++) {
          const v1 = rankValues[i].value;
          const v2 = rankValues[j].value;
          const v3 = rankValues[k].value;

          // Check for consecutive values
          if (v2 === v1 + 1 && v3 === v2 + 1) {
            const sequenceCards = [
              rankValues[i].card,
              rankValues[j].card,
              rankValues[k].card
            ];
            sequences.push({
              type: MatchType.Sequence,
              cards: sequenceCards,
              score: this.scoringService.calculateCardsValue(sequenceCards),
              isValid: false // Will be validated later
            });
          }


        }
      }
    }

    return sequences;
  }

  /**
   * Find sequences using wild 9s to fill gaps
   */
  private findSequencesWithWilds(nonWildCards: Card[], wild9s: Card[]): Match[] {
    const sequences: Match[] = [];

    if (wild9s.length === 0) {
      return sequences;
    }

    const rankValues = nonWildCards.map(card => ({
      card,
      value: getRankNumericValue(card.rank)
    }));

    // With 1 wild: need 2 consecutive cards
    if (wild9s.length >= 1 && nonWildCards.length >= 2) {
      for (let i = 0; i < rankValues.length - 1; i++) {
        for (let j = i + 1; j < rankValues.length; j++) {
          const v1 = rankValues[i].value;
          const v2 = rankValues[j].value;
          const diff = v2 - v1;

          // Can fill a gap of 1 or complete a sequence
          if (diff === 1 || diff === 2) {
            const sequenceCards = [
              rankValues[i].card,
              rankValues[j].card,
              wild9s[0]
            ];
            sequences.push({
              type: MatchType.Sequence,
              cards: sequenceCards,
              score: this.scoringService.calculateCardsValue(sequenceCards),
              isValid: false
            });
          }
        }
      }
    }

    // With 2 wilds: need 1 non-wild card
    if (wild9s.length >= 2 && nonWildCards.length >= 1) {
      nonWildCards.forEach(card => {
        const sequenceCards = [card, wild9s[0], wild9s[1]];
        sequences.push({
          type: MatchType.Sequence,
          cards: sequenceCards,
          score: this.scoringService.calculateCardsValue(sequenceCards),
          isValid: false
        });
      });
    }

    // With 3 wilds: automatic sequence
    if (wild9s.length >= 3) {
      const sequenceCards = [wild9s[0], wild9s[1], wild9s[2]];
      sequences.push({
        type: MatchType.Sequence,
        cards: sequenceCards,
        score: this.scoringService.calculateCardsValue(sequenceCards),
        isValid: false
      });
    }

    return sequences;
  }

  /**
   * Validate if a match is legal for the current dice roll
   */
  validateMatch(match: Match, diceRoll: DiceRoll): boolean {
    // Snake Eyes and Boxcars are always valid if they exist
    if (match.type === MatchType.SnakeEyes || match.type === MatchType.Boxcars) {
      return true;
    }

    // For normal matches, check if already marked as valid
    return match.isValid;
  }
}
