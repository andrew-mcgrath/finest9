import { describe, it, expect, beforeEach } from 'vitest';
import { MatchValidatorService } from './match-validator.service';
import { ScoringService } from './scoring.service';
import { Card, Rank, Suit } from '../models/card.model';
import { DiceRoll } from '../models/game-state.model';
import { MatchType } from '../models/match.model';

describe('MatchValidatorService', () => {
  let service: MatchValidatorService;
  let scoringService: ScoringService;

  beforeEach(() => {
    scoringService = new ScoringService();
    service = new MatchValidatorService(scoringService);
  });

  const createCard = (rank: Rank, suit: Suit = Suit.Hearts): Card => ({
    rank,
    suit,
    id: `${suit}-${rank}`
  });

  const createDiceRoll = (total: number): DiceRoll => ({
    die1: Math.min(total - 1, 6),
    die2: total - Math.min(total - 1, 6),
    total,
    isSnakeEyes: total === 2,
    isBoxcars: total === 12,
    isNine: total === 9
  });

  describe('detectPairs', () => {
    it('should detect a pair of matching cards', () => {
      const tableau = [
        createCard(Rank.Seven),
        createCard(Rank.Seven, Suit.Diamonds),
        createCard(Rank.Three)
      ];

      const match = service.detectPairs(tableau, 7);
      expect(match).not.toBeNull();
      expect(match?.type).toBe(MatchType.Pair);
      expect(match?.cards.length).toBe(2);
      expect(match?.isValid).toBe(true);
    });

    it('should detect a set of three matching cards', () => {
      const tableau = [
        createCard(Rank.King),
        createCard(Rank.King, Suit.Diamonds),
        createCard(Rank.King, Suit.Clubs),
        createCard(Rank.Two)
      ];

      const match = service.detectPairs(tableau, 10); // Kings = 10
      expect(match).not.toBeNull();
      expect(match?.type).toBe(MatchType.Set);
      expect(match?.cards.length).toBe(3);
    });

    it('should detect a set of four matching cards', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Five, Suit.Diamonds),
        createCard(Rank.Five, Suit.Clubs),
        createCard(Rank.Five, Suit.Spades)
      ];

      const match = service.detectPairs(tableau, 5);
      expect(match).not.toBeNull();
      expect(match?.type).toBe(MatchType.Set);
      expect(match?.cards.length).toBe(4);
    });

    it('should return null when no pair exists', () => {
      const tableau = [
        createCard(Rank.Two),
        createCard(Rank.Three),
        createCard(Rank.Four)
      ];

      const match = service.detectPairs(tableau, 5);
      expect(match).toBeNull();
    });

    it('should use wild 9 when only one regular card matches', () => {
      const tableau = [
        createCard(Rank.Seven),
        createCard(Rank.Eight),
        createCard(Rank.Nine) // Wild 9 should be used
      ];

      const match = service.detectPairs(tableau, 7);
      expect(match).not.toBeNull();
      expect(match?.type).toBe(MatchType.Pair);
      expect(match?.cards.length).toBe(2);
      expect(match?.cards.some(c => c.rank === Rank.Nine)).toBe(true);
    });

    it('should use wild 9 to complete a pair', () => {
      const tableau = [
        createCard(Rank.Seven),
        createCard(Rank.Nine), // Wild
        createCard(Rank.Three)
      ];

      const match = service.detectPairs(tableau, 7);
      expect(match).not.toBeNull();
      expect(match?.type).toBe(MatchType.Pair);
      expect(match?.cards.length).toBe(2);
      expect(match?.cards.some(c => c.rank === Rank.Nine)).toBe(true);
    });

    it('should match two wild 9s as a pair', () => {
      const tableau = [
        createCard(Rank.Nine),
        createCard(Rank.Nine, Suit.Diamonds),
        createCard(Rank.Three)
      ];

      const match = service.detectPairs(tableau, 7);
      expect(match).not.toBeNull();
      expect(match?.type).toBe(MatchType.Pair);
      expect(match?.cards.length).toBe(2);
    });

    it('should calculate correct score for pair', () => {
      const tableau = [
        createCard(Rank.King),
        createCard(Rank.King, Suit.Diamonds)
      ];

      const match = service.detectPairs(tableau, 10);
      expect(match?.score).toBe(20); // 10 + 10
    });
  });

  describe('detectSequences', () => {
    it('should detect a basic sequence (5-6-7)', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Six),
        createCard(Rank.Seven)
      ];

      const matches = service.detectSequences(tableau, 6);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].type).toBe(MatchType.Sequence);
      expect(matches[0].cards.length).toBe(3);
    });

    it('should detect Q-K-A sequence', () => {
      const tableau = [
        createCard(Rank.Queen),
        createCard(Rank.King),
        createCard(Rank.Ace)
      ];

      const matches = service.detectSequences(tableau, 10); // Match on Queen or King
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should NOT detect K-A-2 sequence (invalid wrap)', () => {
      const tableau = [
        createCard(Rank.King),
        createCard(Rank.Ace),
        createCard(Rank.Two)
      ];

      const matches = service.detectSequences(tableau, 10);
      expect(matches.length).toBe(0);
    });

    it('should require at least one card to match dice value', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Six),
        createCard(Rank.Seven)
      ];

      const matchesValid = service.detectSequences(tableau, 6);
      expect(matchesValid.length).toBeGreaterThan(0);

      const matchesInvalid = service.detectSequences(tableau, 10);
      expect(matchesInvalid.length).toBe(0);
    });

    it('should work with wild 9 in sequence', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Six),
        createCard(Rank.Nine) // Wild
      ];

      const matches = service.detectSequences(tableau, 6);
      expect(matches.length).toBeGreaterThan(0);
    });

    it('should calculate correct score for sequence', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Six),
        createCard(Rank.Seven)
      ];

      const matches = service.detectSequences(tableau, 6);
      expect(matches[0].score).toBe(18); // 5 + 6 + 7
    });
  });

  describe('findAllSequences', () => {
    it('should return empty array for less than 3 cards', () => {
      const tableau = [createCard(Rank.Five), createCard(Rank.Six)];
      const sequences = service.findAllSequences(tableau);
      expect(sequences.length).toBe(0);
    });

    it('should find multiple sequences if they exist', () => {
      const tableau = [
        createCard(Rank.Two),
        createCard(Rank.Three),
        createCard(Rank.Four),
        createCard(Rank.Five)
      ];

      const sequences = service.findAllSequences(tableau);
      expect(sequences.length).toBeGreaterThan(0);
    });

    it('should find sequence with one wild 9', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Seven),
        createCard(Rank.Nine) // Can fill gap
      ];

      const sequences = service.findAllSequences(tableau);
      expect(sequences.length).toBeGreaterThan(0);
    });

    it('should find sequence with two wild 9s', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Nine),
        createCard(Rank.Nine, Suit.Diamonds)
      ];

      const sequences = service.findAllSequences(tableau);
      expect(sequences.length).toBeGreaterThan(0);
    });

    it('should find sequence with three wild 9s', () => {
      const tableau = [
        createCard(Rank.Nine),
        createCard(Rank.Nine, Suit.Diamonds),
        createCard(Rank.Nine, Suit.Clubs)
      ];

      const sequences = service.findAllSequences(tableau);
      expect(sequences.length).toBeGreaterThan(0);
    });

    it('should not return duplicate QKA sequences when tableau has QQKA', () => {
      // Tableau with two Queens, one King, one Ace
      const tableau = [
        createCard(Rank.Queen, Suit.Hearts),
        createCard(Rank.Queen, Suit.Spades),
        createCard(Rank.King, Suit.Hearts),
        createCard(Rank.Ace, Suit.Hearts)
      ];

      const sequences = service.findAllSequences(tableau);

      // Expect exactly 2 matches (Q1-K-A and Q2-K-A)
      // If bug exists (double counting QKA), it would be 4
      expect(sequences.length).toBe(2);
    });
  });

  describe('findPossibleMatches', () => {
    it('should find pairs for normal roll', () => {
      const tableau = [
        createCard(Rank.Seven),
        createCard(Rank.Seven, Suit.Diamonds)
      ];
      const diceRoll = createDiceRoll(7);

      const matches = service.findPossibleMatches(tableau, diceRoll);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(m => m.type === MatchType.Pair)).toBe(true);
    });

    it('should find sequences for normal roll', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Six),
        createCard(Rank.Seven)
      ];
      const diceRoll = createDiceRoll(6);

      const matches = service.findPossibleMatches(tableau, diceRoll);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(m => m.type === MatchType.Sequence)).toBe(true);
    });

    it('should find all pairs for Snake Eyes', () => {
      const tableau = [
        createCard(Rank.Two),
        createCard(Rank.Two, Suit.Diamonds),
        createCard(Rank.Five),
        createCard(Rank.Five, Suit.Diamonds)
      ];
      const diceRoll = createDiceRoll(2); // Snake Eyes

      const matches = service.findPossibleMatches(tableau, diceRoll);
      const snakeEyesMatches = matches.filter(m => m.type === MatchType.SnakeEyes);
      expect(snakeEyesMatches.length).toBeGreaterThan(0);
    });

    it('should find all sequences for Boxcars', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Six),
        createCard(Rank.Seven),
        createCard(Rank.Eight)
      ];
      const diceRoll = createDiceRoll(12); // Boxcars

      const matches = service.findPossibleMatches(tableau, diceRoll);
      const boxcarsMatches = matches.filter(m => m.type === MatchType.Boxcars);
      expect(boxcarsMatches.length).toBeGreaterThan(0);
    });

    it('should return empty array when no matches exist', () => {
      const tableau = [
        createCard(Rank.Two),
        createCard(Rank.Four),
        createCard(Rank.Eight)
      ];
      const diceRoll = createDiceRoll(7);

      const matches = service.findPossibleMatches(tableau, diceRoll);
      expect(matches.length).toBe(0);
    });

    it('should not return invalid sequence matches', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Six),
        createCard(Rank.Seven)
      ];
      const diceRoll = createDiceRoll(10); // No card in sequence matches 10

      const matches = service.findPossibleMatches(tableau, diceRoll);
      const validMatches = matches.filter(m => m.isValid);
      expect(validMatches.length).toBe(0);
    });
  });

  describe('validateMatch', () => {
    it('should validate Snake Eyes match', () => {
      const match = {
        type: MatchType.SnakeEyes,
        cards: [createCard(Rank.Five), createCard(Rank.Five, Suit.Diamonds)],
        score: 10,
        isValid: true
      };
      const diceRoll = createDiceRoll(2);

      expect(service.validateMatch(match, diceRoll)).toBe(true);
    });

    it('should validate Boxcars match', () => {
      const match = {
        type: MatchType.Boxcars,
        cards: [createCard(Rank.Five), createCard(Rank.Six), createCard(Rank.Seven)],
        score: 18,
        isValid: true
      };
      const diceRoll = createDiceRoll(12);

      expect(service.validateMatch(match, diceRoll)).toBe(true);
    });

    it('should validate match marked as valid', () => {
      const match = {
        type: MatchType.Pair,
        cards: [createCard(Rank.Seven), createCard(Rank.Seven, Suit.Diamonds)],
        score: 14,
        isValid: true
      };
      const diceRoll = createDiceRoll(7);

      expect(service.validateMatch(match, diceRoll)).toBe(true);
    });

    it('should not validate match marked as invalid', () => {
      const match = {
        type: MatchType.Pair,
        cards: [createCard(Rank.Seven), createCard(Rank.Seven, Suit.Diamonds)],
        score: 14,
        isValid: false
      };
      const diceRoll = createDiceRoll(7);

      expect(service.validateMatch(match, diceRoll)).toBe(false);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle multiple pairs and sequences in same tableau', () => {
      const tableau = [
        createCard(Rank.Five),
        createCard(Rank.Five, Suit.Diamonds),
        createCard(Rank.Six),
        createCard(Rank.Seven)
      ];
      const diceRoll = createDiceRoll(5);

      const matches = service.findPossibleMatches(tableau, diceRoll);
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(m => m.type === MatchType.Pair)).toBe(true);
    });

    it('should prioritize complete matches over wild substitutions', () => {
      const tableau = [
        createCard(Rank.Seven),
        createCard(Rank.Seven, Suit.Diamonds),
        createCard(Rank.Nine) // Wild
      ];
      const diceRoll = createDiceRoll(7);

      const matches = service.findPossibleMatches(tableau, diceRoll);
      const pairMatch = matches.find(m => m.type === MatchType.Pair);
      expect(pairMatch?.cards.length).toBe(2); // Should match the two 7s without wild
    });

    it('should handle ace in sequences correctly', () => {
      const tableau = [
        createCard(Rank.Queen),
        createCard(Rank.King),
        createCard(Rank.Ace)
      ];
      const diceRoll = createDiceRoll(11); // Ace value

      const matches = service.findPossibleMatches(tableau, diceRoll);
      expect(matches.length).toBeGreaterThan(0);
    });
  });
});
