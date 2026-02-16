/**
 * Card model for Finest 9 game
 */

export enum Suit {
  Hearts = 'hearts',
  Diamonds = 'diamonds',
  Clubs = 'clubs',
  Spades = 'spades'
}

export enum Rank {
  Two = '2',
  Three = '3',
  Four = '4',
  Five = '5',
  Six = '6',
  Seven = '7',
  Eight = '8',
  Nine = '9',
  Ten = '10',
  Jack = 'J',
  Queen = 'Q',
  King = 'K',
  Ace = 'A'
}

export interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // Unique identifier (e.g., "hearts-A")
}

/**
 * Helper to get numeric value of a rank for game scoring
 */
export function getCardValue(rank: Rank): number {
  switch (rank) {
    case Rank.Two:
      return 2;
    case Rank.Three:
      return 3;
    case Rank.Four:
      return 4;
    case Rank.Five:
      return 5;
    case Rank.Six:
      return 6;
    case Rank.Seven:
      return 7;
    case Rank.Eight:
      return 8;
    case Rank.Nine:
      return 9;
    case Rank.Ten:
    case Rank.Jack:
    case Rank.Queen:
    case Rank.King:
      return 10;
    case Rank.Ace:
      return 11;
  }
}

/**
 * Helper to check if a card is a wild 9
 */
export function isWild9(card: Card): boolean {
  return card.rank === Rank.Nine;
}

/**
 * Get numeric rank for sequence detection
 */
export function getRankNumericValue(rank: Rank): number {
  switch (rank) {
    case Rank.Two:
      return 2;
    case Rank.Three:
      return 3;
    case Rank.Four:
      return 4;
    case Rank.Five:
      return 5;
    case Rank.Six:
      return 6;
    case Rank.Seven:
      return 7;
    case Rank.Eight:
      return 8;
    case Rank.Nine:
      return 9;
    case Rank.Ten:
      return 10;
    case Rank.Jack:
      return 11;
    case Rank.Queen:
      return 12;
    case Rank.King:
      return 13;
    case Rank.Ace:
      return 14; // Ace can be high in Q-K-A sequence
  }
}
