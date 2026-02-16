import { Injectable } from '@angular/core';
import { Card, Rank, Suit } from '../models/card.model';

/**
 * DeckService - Manages card deck operations
 * Responsible for creating, shuffling, and dealing cards
 */
@Injectable({
  providedIn: 'root'
})
export class DeckService {
  /**
   * Creates a standard 52-card deck (no jokers)
   */
  createDeck(): Card[] {
    const deck: Card[] = [];
    const suits = Object.values(Suit);
    const ranks = Object.values(Rank);

    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          suit,
          rank,
          id: `${suit}-${rank}`
        });
      }
    }

    return deck;
  }

  /**
   * Shuffles a deck using Fisher-Yates algorithm
   * Returns a new shuffled array (immutable)
   */
  shuffle(deck: Card[]): Card[] {
    const shuffled = [...deck]; // Create a copy

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled;
  }

  /**
   * Deals a specified number of cards from the deck
   * Returns { dealtCards, remainingDeck }
   */
  dealCards(deck: Card[], count: number): { dealtCards: Card[]; remainingDeck: Card[] } {
    if (count > deck.length) {
      console.warn(`Cannot deal ${count} cards, only ${deck.length} available`);
      count = deck.length;
    }

    const dealtCards = deck.slice(0, count);
    const remainingDeck = deck.slice(count);

    return { dealtCards, remainingDeck };
  }

  /**
   * Gets the number of cards remaining in the deck
   */
  getRemainingCount(deck: Card[]): number {
    return deck.length;
  }
}
