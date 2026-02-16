import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringService } from './scoring.service';
import { Card, Rank, Suit } from '../models/card.model';
import { Player } from '../models/player.model';

describe('ScoringService', () => {
  let service: ScoringService;

  beforeEach(() => {
    service = new ScoringService();
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
    isBot: false,
    tableau,
    capturedCards,
    currentScore: 0
  });

  describe('calculateCardsValue', () => {
    it('should return 0 for empty array', () => {
      expect(service.calculateCardsValue([])).toBe(0);
    });

    it('should calculate value for number cards', () => {
      const cards = [
        createCard(Rank.Two),
        createCard(Rank.Five),
        createCard(Rank.Ten)
      ];
      expect(service.calculateCardsValue(cards)).toBe(17); // 2 + 5 + 10
    });

    it('should calculate value for face cards', () => {
      const cards = [
        createCard(Rank.Jack),
        createCard(Rank.Queen),
        createCard(Rank.King)
      ];
      expect(service.calculateCardsValue(cards)).toBe(30); // 10 + 10 + 10
    });

    it('should calculate value for aces', () => {
      const cards = [
        createCard(Rank.Ace),
        createCard(Rank.Ace)
      ];
      expect(service.calculateCardsValue(cards)).toBe(22); // 11 + 11
    });

    it('should calculate value for nines', () => {
      const cards = [
        createCard(Rank.Nine),
        createCard(Rank.Nine)
      ];
      expect(service.calculateCardsValue(cards)).toBe(18); // 9 + 9
    });

    it('should calculate value for mixed cards', () => {
      const cards = [
        createCard(Rank.Two),
        createCard(Rank.Nine),
        createCard(Rank.Jack),
        createCard(Rank.Ace)
      ];
      expect(service.calculateCardsValue(cards)).toBe(32); // 2 + 9 + 10 + 11
    });
  });

  describe('calculatePlayerScore', () => {
    it('should return 0 when no cards captured or remaining', () => {
      const player = createPlayer('1', 'Player 1');
      expect(service.calculatePlayerScore(player)).toBe(0);
    });

    it('should return positive score when captured > tableau', () => {
      const player = createPlayer(
        '1',
        'Player 1',
        [createCard(Rank.Two)], // 2 points
        [createCard(Rank.Ten), createCard(Rank.Five)] // 15 points
      );
      expect(service.calculatePlayerScore(player)).toBe(13); // 15 - 2
    });

    it('should return negative score when tableau > captured', () => {
      const player = createPlayer(
        '1',
        'Player 1',
        [createCard(Rank.King), createCard(Rank.Ace)], // 21 points
        [createCard(Rank.Five)] // 5 points
      );
      expect(service.calculatePlayerScore(player)).toBe(-16); // 5 - 21
    });

    it('should handle all cards captured (empty tableau)', () => {
      const player = createPlayer(
        '1',
        'Player 1',
        [], // 0 points
        [createCard(Rank.Ace), createCard(Rank.King)] // 21 points
      );
      expect(service.calculatePlayerScore(player)).toBe(21);
    });

    it('should handle no cards captured (full tableau)', () => {
      const player = createPlayer(
        '1',
        'Player 1',
        [createCard(Rank.Seven), createCard(Rank.Eight)], // 15 points
        [] // 0 points
      );
      expect(service.calculatePlayerScore(player)).toBe(-15);
    });
  });

  describe('calculateFinalScores', () => {
    it('should return empty map for no players', () => {
      const scores = service.calculateFinalScores([]);
      expect(scores.size).toBe(0);
    });

    it('should calculate scores for all players', () => {
      const players = [
        createPlayer(
          '1',
          'Player 1',
          [createCard(Rank.Two)],
          [createCard(Rank.King)]
        ),
        createPlayer(
          '2',
          'Player 2',
          [createCard(Rank.Five)],
          [createCard(Rank.Ace)]
        )
      ];

      const scores = service.calculateFinalScores(players);
      expect(scores.size).toBe(2);
      expect(scores.get('1')).toBe(8); // 10 - 2
      expect(scores.get('2')).toBe(6); // 11 - 5
    });

    it('should handle players with same score', () => {
      const players = [
        createPlayer(
          '1',
          'Player 1',
          [],
          [createCard(Rank.Ten)]
        ),
        createPlayer(
          '2',
          'Player 2',
          [],
          [createCard(Rank.Ten)]
        )
      ];

      const scores = service.calculateFinalScores(players);
      expect(scores.get('1')).toBe(10);
      expect(scores.get('2')).toBe(10);
    });
  });

  describe('determineWinner', () => {
    it('should return null for empty player array', () => {
      expect(service.determineWinner([])).toBeNull();
    });

    it('should return the only player if there is one', () => {
      const player = createPlayer('1', 'Player 1');
      expect(service.determineWinner([player])).toBe(player);
    });

    it('should return player with highest score', () => {
      const players = [
        createPlayer(
          '1',
          'Player 1',
          [createCard(Rank.Two)],
          [createCard(Rank.Five)]
        ), // 5 - 2 = 3
        createPlayer(
          '2',
          'Player 2',
          [createCard(Rank.Three)],
          [createCard(Rank.King)]
        ), // 10 - 3 = 7
        createPlayer(
          '3',
          'Player 3',
          [createCard(Rank.Four)],
          [createCard(Rank.Seven)]
        ) // 7 - 4 = 3
      ];

      const winner = service.determineWinner(players);
      expect(winner).toBe(players[1]);
      expect(winner?.name).toBe('Player 2');
    });

    it('should return first player in case of tie', () => {
      const players = [
        createPlayer(
          '1',
          'Player 1',
          [],
          [createCard(Rank.Ten)]
        ), // 10
        createPlayer(
          '2',
          'Player 2',
          [],
          [createCard(Rank.Ten)]
        ), // 10
        createPlayer(
          '3',
          'Player 3',
          [],
          [createCard(Rank.Five)]
        ) // 5
      ];

      const winner = service.determineWinner(players);
      expect(winner).toBe(players[0]);
      expect(winner?.name).toBe('Player 1');
    });

    it('should handle negative scores', () => {
      const players = [
        createPlayer(
          '1',
          'Player 1',
          [createCard(Rank.King)],
          [createCard(Rank.Two)]
        ), // 2 - 10 = -8
        createPlayer(
          '2',
          'Player 2',
          [createCard(Rank.Five)],
          [createCard(Rank.Three)]
        ), // 3 - 5 = -2
        createPlayer(
          '3',
          'Player 3',
          [createCard(Rank.Ace)],
          [createCard(Rank.Four)]
        ) // 4 - 11 = -7
      ];

      const winner = service.determineWinner(players);
      expect(winner).toBe(players[1]); // -2 is highest
      expect(winner?.name).toBe('Player 2');
    });
  });

  describe('getPlayersByRank', () => {
    it('should return empty array for no players', () => {
      const ranked = service.getPlayersByRank([]);
      expect(ranked.length).toBe(0);
    });

    it('should rank players by score descending', () => {
      const players = [
        createPlayer('1', 'Player 1', [], [createCard(Rank.Five)]), // 5
        createPlayer('2', 'Player 2', [], [createCard(Rank.King)]), // 10
        createPlayer('3', 'Player 3', [], [createCard(Rank.Three)]) // 3
      ];

      const ranked = service.getPlayersByRank(players);
      expect(ranked.length).toBe(3);
      expect(ranked[0].player.name).toBe('Player 2');
      expect(ranked[0].score).toBe(10);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].player.name).toBe('Player 1');
      expect(ranked[1].score).toBe(5);
      expect(ranked[1].rank).toBe(2);
      expect(ranked[2].player.name).toBe('Player 3');
      expect(ranked[2].score).toBe(3);
      expect(ranked[2].rank).toBe(3);
    });

    it('should handle tied scores with same rank', () => {
      const players = [
        createPlayer('1', 'Player 1', [], [createCard(Rank.Ten)]), // 10
        createPlayer('2', 'Player 2', [], [createCard(Rank.Ten)]), // 10
        createPlayer('3', 'Player 3', [], [createCard(Rank.Five)]) // 5
      ];

      const ranked = service.getPlayersByRank(players);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].score).toBe(10);
      expect(ranked[1].rank).toBe(1); // Same rank for tie
      expect(ranked[1].score).toBe(10);
      expect(ranked[2].rank).toBe(3); // Skip rank 2
      expect(ranked[2].score).toBe(5);
    });

    it('should handle multiple ties', () => {
      const players = [
        createPlayer('1', 'Player 1', [], [createCard(Rank.Ten)]), // 10
        createPlayer('2', 'Player 2', [], [createCard(Rank.Five)]), // 5
        createPlayer('3', 'Player 3', [], [createCard(Rank.Ten)]), // 10
        createPlayer('4', 'Player 4', [], [createCard(Rank.Five)]) // 5
      ];

      const ranked = service.getPlayersByRank(players);
      expect(ranked[0].rank).toBe(1);
      expect(ranked[1].rank).toBe(1);
      expect(ranked[2].rank).toBe(3);
      expect(ranked[3].rank).toBe(3);
    });

    it('should handle all players with same score', () => {
      const players = [
        createPlayer('1', 'Player 1', [], [createCard(Rank.Seven)]),
        createPlayer('2', 'Player 2', [], [createCard(Rank.Seven)]),
        createPlayer('3', 'Player 3', [], [createCard(Rank.Seven)])
      ];

      const ranked = service.getPlayersByRank(players);
      expect(ranked.every(r => r.rank === 1)).toBe(true);
      expect(ranked.every(r => r.score === 7)).toBe(true);
    });
  });
});
