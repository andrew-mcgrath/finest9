import { describe, it, expect, beforeEach } from 'vitest';
import { DeckService } from './deck.service';
import { Rank, Suit } from '../models/card.model';

describe('DeckService', () => {
  let service: DeckService;

  beforeEach(() => {
    service = new DeckService();
  });

  describe('createDeck', () => {
    it('should create a deck with 52 cards', () => {
      const deck = service.createDeck();
      expect(deck.length).toBe(52);
    });

    it('should create unique cards', () => {
      const deck = service.createDeck();
      const ids = deck.map(card => card.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(52);
    });

    it('should contain all suits', () => {
      const deck = service.createDeck();
      const suits = new Set(deck.map(card => card.suit));
      expect(suits.size).toBe(4);
      expect(suits.has(Suit.Hearts)).toBe(true);
      expect(suits.has(Suit.Diamonds)).toBe(true);
      expect(suits.has(Suit.Clubs)).toBe(true);
      expect(suits.has(Suit.Spades)).toBe(true);
    });

    it('should contain all ranks', () => {
      const deck = service.createDeck();
      const ranks = new Set(deck.map(card => card.rank));
      expect(ranks.size).toBe(13);
      expect(ranks.has(Rank.Ace)).toBe(true);
      expect(ranks.has(Rank.King)).toBe(true);
      expect(ranks.has(Rank.Queen)).toBe(true);
      expect(ranks.has(Rank.Jack)).toBe(true);
      expect(ranks.has(Rank.Nine)).toBe(true);
    });

    it('should have 4 cards of each rank', () => {
      const deck = service.createDeck();
      const rankCounts = new Map<Rank, number>();

      deck.forEach(card => {
        rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
      });

      Object.values(Rank).forEach(rank => {
        expect(rankCounts.get(rank)).toBe(4);
      });
    });
  });

  describe('shuffle', () => {
    it('should return a deck with the same number of cards', () => {
      const deck = service.createDeck();
      const shuffled = service.shuffle(deck);
      expect(shuffled.length).toBe(deck.length);
    });

    it('should not modify the original deck', () => {
      const deck = service.createDeck();
      const originalFirstCard = deck[0];
      service.shuffle(deck);
      expect(deck[0]).toBe(originalFirstCard);
    });

    it('should contain the same cards', () => {
      const deck = service.createDeck();
      const shuffled = service.shuffle(deck);

      const originalIds = deck.map(c => c.id).sort();
      const shuffledIds = shuffled.map(c => c.id).sort();

      expect(shuffledIds).toEqual(originalIds);
    });

    it('should produce different order (probabilistic)', () => {
      const deck = service.createDeck();
      const shuffled = service.shuffle(deck);

      // Check if at least some cards are in different positions
      let differentPositions = 0;
      for (let i = 0; i < deck.length; i++) {
        if (deck[i].id !== shuffled[i].id) {
          differentPositions++;
        }
      }

      // With 52 cards, extremely unlikely to have all in same position
      expect(differentPositions).toBeGreaterThan(0);
    });
  });

  describe('dealCards', () => {
    it('should deal the correct number of cards', () => {
      const deck = service.createDeck();
      const { dealtCards } = service.dealCards(deck, 9);
      expect(dealtCards.length).toBe(9);
    });

    it('should remove dealt cards from remaining deck', () => {
      const deck = service.createDeck();
      const { remainingDeck } = service.dealCards(deck, 9);
      expect(remainingDeck.length).toBe(43);
    });

    it('should deal cards from the top of the deck', () => {
      const deck = service.createDeck();
      const firstCard = deck[0];
      const { dealtCards } = service.dealCards(deck, 5);
      expect(dealtCards[0]).toBe(firstCard);
    });

    it('should handle dealing more cards than available', () => {
      const deck = service.createDeck();
      const { dealtCards, remainingDeck } = service.dealCards(deck, 100);
      expect(dealtCards.length).toBe(52);
      expect(remainingDeck.length).toBe(0);
    });

    it('should not have duplicates between dealt and remaining', () => {
      const deck = service.createDeck();
      const { dealtCards, remainingDeck } = service.dealCards(deck, 20);

      const dealtIds = new Set(dealtCards.map(c => c.id));
      const remainingIds = new Set(remainingDeck.map(c => c.id));

      // No overlap
      dealtIds.forEach(id => {
        expect(remainingIds.has(id)).toBe(false);
      });
    });
  });

  describe('getRemainingCount', () => {
    it('should return the correct count', () => {
      const deck = service.createDeck();
      expect(service.getRemainingCount(deck)).toBe(52);
    });

    it('should return 0 for empty deck', () => {
      expect(service.getRemainingCount([])).toBe(0);
    });

    it('should return correct count after dealing', () => {
      const deck = service.createDeck();
      const { remainingDeck } = service.dealCards(deck, 10);
      expect(service.getRemainingCount(remainingDeck)).toBe(42);
    });
  });
});
