/**
 * Match model for Finest 9 game
 */

import { Card } from './card.model';

export enum MatchType {
  Pair = 'pair', // 2 cards of same rank
  Set = 'set', // 3+ cards of same rank
  Sequence = 'sequence', // 3 consecutive ranks
  SnakeEyes = 'snake-eyes', // Special: any pair on roll of 2
  Boxcars = 'boxcars' // Special: any sequence on roll of 12
}

export interface Match {
  type: MatchType;
  cards: Card[]; // Cards involved in the match
  score: number; // Points for this match
  isValid: boolean; // Whether this match is valid for current dice roll
}
