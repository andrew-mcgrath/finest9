import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BotAIService } from './bot-ai.service';
import { Player } from '../models/player.model';
import { Match, MatchType } from '../models/match.model';
import { DiceRoll } from '../models/game-state.model';
import { Card, Rank, Suit } from '../models/card.model';

describe('BotAIService', () => {
  let service: BotAIService;

  beforeEach(() => {
    service = new BotAIService();
  });

  const createCard = (rank: Rank, suit: Suit = Suit.Hearts): Card => ({
    rank,
    suit,
    id: `${suit}-${rank}`
  });

  const createPlayer = (
    id: string,
    name: string,
    tableau: Card[] = [],
    capturedCards: Card[] = []
  ): Player => ({
    id,
    name,
    isBot: true,
    tableau,
    capturedCards,
    currentScore: 0
  });

  const createDiceRoll = (total: number): DiceRoll => ({
    die1: Math.min(total - 1, 6),
    die2: total - Math.min(total - 1, 6),
    total,
    isSnakeEyes: total === 2,
    isBoxcars: total === 12,
    isNine: total === 9
  });

  describe('decideBotMove', () => {
    it('should return draw action when no matches available', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(7);
      const possibleMatches: Match[] = [];

      const decision = await service.decideBotMove(player, diceRoll, possibleMatches);

      expect(decision.action).toBe('draw');
      expect(decision.selectedMatch).toBeUndefined();
    });

    it('should return match action when matches available', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(7);
      const possibleMatches: Match[] = [
        {
          type: MatchType.Pair,
          cards: [createCard(Rank.Seven), createCard(Rank.Seven, Suit.Diamonds)],
          score: 14,
          isValid: true
        }
      ];

      const decision = await service.decideBotMove(player, diceRoll, possibleMatches);

      expect(decision.action).toBe('match');
      expect(decision.selectedMatch).toBeDefined();
    });

    it('should include thinking time in decision', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(7);
      const possibleMatches: Match[] = [];

      const decision = await service.decideBotMove(player, diceRoll, possibleMatches);

      expect(decision.thinkingTime).toBeGreaterThanOrEqual(500);
      expect(decision.thinkingTime).toBeLessThanOrEqual(1500);
    });

    it('should delay for thinking time', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(7);
      const possibleMatches: Match[] = [];

      const startTime = Date.now();
      await service.decideBotMove(player, diceRoll, possibleMatches);
      const endTime = Date.now();

      const elapsed = endTime - startTime;
      expect(elapsed).toBeGreaterThanOrEqual(490); // Allow small margin
    });
  });

  describe('Match Selection', () => {
    it('should select higher scoring match', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(7);

      const lowScoreMatch: Match = {
        type: MatchType.Pair,
        cards: [createCard(Rank.Two), createCard(Rank.Two, Suit.Diamonds)],
        score: 4,
        isValid: true
      };

      const highScoreMatch: Match = {
        type: MatchType.Pair,
        cards: [createCard(Rank.King), createCard(Rank.King, Suit.Diamonds)],
        score: 20,
        isValid: true
      };

      // Mock Math.random to always choose optimal (< 0.8)
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValue(0.5);

      const decision = await service.decideBotMove(player, diceRoll, [lowScoreMatch, highScoreMatch]);

      expect(decision.selectedMatch).toEqual(highScoreMatch);

      mathRandomSpy.mockRestore();
    });

    it('should prefer more cards when scores are equal', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(7);

      const twoCardMatch: Match = {
        type: MatchType.Pair,
        cards: [createCard(Rank.Five), createCard(Rank.Five, Suit.Diamonds)],
        score: 10,
        isValid: true
      };

      const threeCardMatch: Match = {
        type: MatchType.Set,
        cards: [
          createCard(Rank.Three),
          createCard(Rank.Three, Suit.Diamonds),
          createCard(Rank.Four)
        ],
        score: 10,
        isValid: true
      };

      // Mock Math.random to always choose optimal
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValue(0.5);

      const decision = await service.decideBotMove(player, diceRoll, [twoCardMatch, threeCardMatch]);

      expect(decision.selectedMatch?.cards.length).toBe(3);

      mathRandomSpy.mockRestore();
    });

    it('should sometimes select random match (not always optimal)', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(7);

      const lowScoreMatch: Match = {
        type: MatchType.Pair,
        cards: [createCard(Rank.Two), createCard(Rank.Two, Suit.Diamonds)],
        score: 4,
        isValid: true
      };

      const highScoreMatch: Match = {
        type: MatchType.Pair,
        cards: [createCard(Rank.King), createCard(Rank.King, Suit.Diamonds)],
        score: 20,
        isValid: true
      };

      // Mock Math.random to trigger random selection (>= 0.8)
      const mathRandomSpy = vi.spyOn(Math, 'random');
      let callCount = 0;
      mathRandomSpy.mockImplementation(() => {
        callCount++;
        // First call: thinking time calculation
        if (callCount === 1) return 0.5;
        // Second call: decide optimal vs random (return >= 0.8 for random)
        if (callCount === 2) return 0.85;
        // Third call: select random match index (return 0 for first match)
        if (callCount === 3) return 0.1;
        // Default
        return 0.5;
      });

      const decision = await service.decideBotMove(player, diceRoll, [lowScoreMatch, highScoreMatch]);

      // Should select first match (low score) due to random selection
      expect(decision.selectedMatch?.score).toBe(4);

      mathRandomSpy.mockRestore();
    });
  });

  describe('evaluatePosition', () => {
    it('should return positive score when captured > tableau', () => {
      const player = createPlayer(
        'bot1',
        'Bot 1',
        [createCard(Rank.Two)], // 2 points
        [createCard(Rank.King), createCard(Rank.Ace)] // 21 points
      );

      const score = service.evaluatePosition(player);
      expect(score).toBe(19); // 21 - 2
    });

    it('should return negative score when tableau > captured', () => {
      const player = createPlayer(
        'bot1',
        'Bot 1',
        [createCard(Rank.King), createCard(Rank.Queen)], // 20 points
        [createCard(Rank.Three)] // 3 points
      );

      const score = service.evaluatePosition(player);
      expect(score).toBe(-17); // 3 - 20
    });

    it('should return zero when captured equals tableau', () => {
      const player = createPlayer(
        'bot1',
        'Bot 1',
        [createCard(Rank.Five)], // 5 points
        [createCard(Rank.Five, Suit.Diamonds)] // 5 points
      );

      const score = service.evaluatePosition(player);
      expect(score).toBe(0);
    });

    it('should handle empty tableau', () => {
      const player = createPlayer(
        'bot1',
        'Bot 1',
        [], // 0 points
        [createCard(Rank.King)] // 10 points
      );

      const score = service.evaluatePosition(player);
      expect(score).toBe(10);
    });

    it('should handle empty captured cards', () => {
      const player = createPlayer(
        'bot1',
        'Bot 1',
        [createCard(Rank.Seven)], // 7 points
        [] // 0 points
      );

      const score = service.evaluatePosition(player);
      expect(score).toBe(-7);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle multiple match options correctly', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(7);

      const matches: Match[] = [
        {
          type: MatchType.Pair,
          cards: [createCard(Rank.Two), createCard(Rank.Two, Suit.Diamonds)],
          score: 4,
          isValid: true
        },
        {
          type: MatchType.Pair,
          cards: [createCard(Rank.Seven), createCard(Rank.Seven, Suit.Diamonds)],
          score: 14,
          isValid: true
        },
        {
          type: MatchType.Sequence,
          cards: [createCard(Rank.Six), createCard(Rank.Seven), createCard(Rank.Eight)],
          score: 21,
          isValid: true
        }
      ];

      // Mock for optimal selection
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValue(0.5);

      const decision = await service.decideBotMove(player, diceRoll, matches);

      // Should select sequence (highest score)
      expect(decision.selectedMatch?.type).toBe(MatchType.Sequence);
      expect(decision.selectedMatch?.score).toBe(21);

      mathRandomSpy.mockRestore();
    });

    it('should handle Snake Eyes correctly', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(2); // Snake Eyes

      const matches: Match[] = [
        {
          type: MatchType.SnakeEyes,
          cards: [createCard(Rank.King), createCard(Rank.King, Suit.Diamonds)],
          score: 20,
          isValid: true
        },
        {
          type: MatchType.SnakeEyes,
          cards: [createCard(Rank.Five), createCard(Rank.Five, Suit.Diamonds)],
          score: 10,
          isValid: true
        }
      ];

      // Mock for optimal selection
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValue(0.5);

      const decision = await service.decideBotMove(player, diceRoll, matches);

      // Should select higher value pair
      expect(decision.selectedMatch?.score).toBe(20);

      mathRandomSpy.mockRestore();
    });

    it('should handle Boxcars correctly', async () => {
      const player = createPlayer('bot1', 'Bot 1');
      const diceRoll = createDiceRoll(12); // Boxcars

      const matches: Match[] = [
        {
          type: MatchType.Boxcars,
          cards: [createCard(Rank.Two), createCard(Rank.Three), createCard(Rank.Four)],
          score: 9,
          isValid: true
        },
        {
          type: MatchType.Boxcars,
          cards: [createCard(Rank.King), createCard(Rank.Queen), createCard(Rank.Jack)],
          score: 30,
          isValid: true
        }
      ];

      // Mock for optimal selection
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValue(0.5);

      const decision = await service.decideBotMove(player, diceRoll, matches);

      // Should select higher scoring sequence
      expect(decision.selectedMatch?.score).toBe(30);

      mathRandomSpy.mockRestore();
    });
  });
});
