import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEngineService } from './game-engine.service';
import { GameStateService } from './game-state.service';
import { DeckService } from './deck.service';
import { DiceService } from './dice.service';
import { MatchValidatorService } from './match-validator.service';
import { ScoringService } from './scoring.service';
import { Player } from '../models/player.model';
import { Card, Rank, Suit } from '../models/card.model';
import { MatchType } from '../models/match.model';
import { GamePhase } from '../models/game-state.model';

describe('GameEngineService', () => {
  let service: GameEngineService;
  let gameState: GameStateService;
  let deckService: DeckService;
  let diceService: DiceService;
  let matchValidator: MatchValidatorService;
  let scoringService: ScoringService;

  beforeEach(() => {
    gameState = new GameStateService();
    deckService = new DeckService();
    diceService = new DiceService();
    scoringService = new ScoringService();
    matchValidator = new MatchValidatorService(scoringService);
    service = new GameEngineService(
      gameState,
      deckService,
      diceService,
      matchValidator,
      scoringService
    );
  });

  const createCard = (rank: Rank, suit: Suit = Suit.Hearts): Card => ({
    rank,
    suit,
    id: `${suit}-${rank}`
  });

  const createPlayer = (
    id: string,
    name: string,
    isBot: boolean = false
  ): Player => ({
    id,
    name,
    isBot,
    tableau: [],
    capturedCards: [],
    currentScore: 0
  });

  describe('startGame', () => {
    it('should deal 9 cards to each player', () => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2')
      ];

      service.startGame(players);

      const state = gameState.gameState();
      expect(state.players[0].tableau.length).toBe(9);
      expect(state.players[1].tableau.length).toBe(9);
    });

    it('should initialize with Rolling phase', () => {
      const players = [createPlayer('1', 'Player 1')];
      service.startGame(players);

      expect(gameState.gameState().phase).toBe(GamePhase.Rolling);
    });

    it('should create deck with remaining cards', () => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2')
      ];

      service.startGame(players);

      const state = gameState.gameState();
      expect(state.deck.length).toBe(52 - 18); // 52 - (9 cards * 2 players)
    });

    it('should initialize empty captured cards', () => {
      const players = [createPlayer('1', 'Player 1')];
      service.startGame(players);

      const state = gameState.gameState();
      expect(state.players[0].capturedCards).toEqual([]);
    });

    it('should handle 4 players', () => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2'),
        createPlayer('3', 'Player 3'),
        createPlayer('4', 'Player 4')
      ];

      service.startGame(players);

      const state = gameState.gameState();
      expect(state.players.length).toBe(4);
      expect(state.deck.length).toBe(52 - 36); // 52 - (9 cards * 4 players)
    });
  });

  describe('rollDice', () => {
    beforeEach(() => {
      const players = [createPlayer('1', 'Player 1')];
      service.startGame(players);
    });

    it('should roll dice and update state', () => {
      const diceRoll = service.rollDice();

      expect(diceRoll.total).toBeGreaterThanOrEqual(2);
      expect(diceRoll.total).toBeLessThanOrEqual(12);
      expect(gameState.gameState().lastDiceRoll).toEqual(diceRoll);
    });

    it('should not roll 9 (should re-roll)', () => {
      const diceRoll = service.rollDice();
      expect(diceRoll.isNine).toBe(false);
      expect(diceRoll.total).not.toBe(9);
    });

    it('should transition to Matching phase', () => {
      service.rollDice();
      expect(gameState.gameState().phase).toBe(GamePhase.Matching);
    });
  });

  describe('findPossibleMatches', () => {
    it('should return empty array when no dice roll', () => {
      const players = [createPlayer('1', 'Player 1')];
      service.startGame(players);

      // Don't roll dice
      const matches = service.findPossibleMatches();
      expect(matches).toEqual([]);
    });

    it('should find matches based on dice roll', () => {
      const players = [createPlayer('1', 'Player 1')];
      service.startGame(players);

      // Manually set tableau with matching cards
      gameState.updatePlayerTableau('1', [
        createCard(Rank.Seven),
        createCard(Rank.Seven, Suit.Diamonds),
        createCard(Rank.Three)
      ]);

      // Mock dice roll to 7
      const mockDiceRoll = { die1: 3, die2: 4, total: 7, isSnakeEyes: false, isBoxcars: false, isNine: false };
      gameState.setDiceRoll(mockDiceRoll);

      const matches = service.findPossibleMatches();
      expect(matches.length).toBeGreaterThan(0);
      expect(matches.some(m => m.type === MatchType.Pair)).toBe(true);
    });
  });

  describe('processMatch', () => {
    beforeEach(() => {
      const players = [createPlayer('1', 'Player 1')];
      service.startGame(players);

      // Set up tableau with matching cards
      gameState.updatePlayerTableau('1', [
        createCard(Rank.Seven),
        createCard(Rank.Seven, Suit.Diamonds),
        createCard(Rank.Three)
      ]);

      // Set dice roll
      const mockDiceRoll = { die1: 3, die2: 4, total: 7, isSnakeEyes: false, isBoxcars: false, isNine: false };
      gameState.setDiceRoll(mockDiceRoll);
    });

    it('should remove matched cards from tableau', () => {
      const match = {
        type: MatchType.Pair,
        cards: [
          createCard(Rank.Seven),
          createCard(Rank.Seven, Suit.Diamonds)
        ],
        score: 14,
        isValid: true
      };

      service.processMatch(match);

      const player = gameState.currentPlayer();
      expect(player.tableau.length).toBe(1);
      expect(player.tableau[0].rank).toBe(Rank.Three);
    });

    it('should add matched cards to captured pile', () => {
      const match = {
        type: MatchType.Pair,
        cards: [
          createCard(Rank.Seven),
          createCard(Rank.Seven, Suit.Diamonds)
        ],
        score: 14,
        isValid: true
      };

      service.processMatch(match);

      const player = gameState.currentPlayer();
      expect(player.capturedCards.length).toBe(2);
    });

    it('should throw error if no dice roll', () => {
      gameState.setDiceRoll(null as any);

      const match = {
        type: MatchType.Pair,
        cards: [createCard(Rank.Seven)],
        score: 7,
        isValid: true
      };

      expect(() => service.processMatch(match)).toThrow('No dice roll available');
    });

    it('should throw error for invalid match', () => {
      // Invalid match (doesn't match dice roll)
      const match = {
        type: MatchType.Pair,
        cards: [createCard(Rank.Five)],
        score: 5,
        isValid: false
      };

      expect(() => service.processMatch(match)).toThrow('Invalid match');
    });
  });

  describe('processDrawCard', () => {
    beforeEach(() => {
      const players = [createPlayer('1', 'Player 1'), createPlayer('2', 'Player 2')];
      service.startGame(players);
    });

    it('should draw one card from deck', () => {
      const initialDeckSize = gameState.deckCount();
      const initialTableauSize = gameState.currentPlayer().tableau.length;

      service.processDrawCard();

      expect(gameState.deckCount()).toBe(initialDeckSize - 1);
      const state = gameState.gameState();
      const player = state.players.find(p => p.id === '1');
      expect(player?.tableau.length).toBe(initialTableauSize + 1);
    });

    it('should advance to next player after drawing', () => {
      expect(gameState.gameState().currentPlayerIndex).toBe(0);
      service.processDrawCard();
      expect(gameState.gameState().currentPlayerIndex).toBe(1);
    });

    it('should start final round when deck becomes empty', () => {
      // Drain the deck to 1 card
      const currentDeck = gameState.gameState().deck;
      gameState.updateDeck([currentDeck[0]]);

      service.processDrawCard();

      expect(gameState.isFinalRound()).toBe(true);
      expect(gameState.gameState().phase).toBe(GamePhase.FinalRound);
    });

    it('should handle drawing when deck is empty', () => {
      // Empty the deck
      gameState.updateDeck([]);

      const initialTableauSize = gameState.currentPlayer().tableau.length;
      service.processDrawCard();

      // Should still advance turn but not add cards
      const state = gameState.gameState();
      const player = state.players.find(p => p.id === '1');
      expect(player?.tableau.length).toBe(initialTableauSize);
    });
  });

  describe('Game Flow', () => {
    it('should complete a full turn cycle', () => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2')
      ];
      service.startGame(players);

      // Player 1 turn
      expect(gameState.currentPlayer().id).toBe('1');
      service.rollDice();
      expect(gameState.gameState().phase).toBe(GamePhase.Matching);

      service.processDrawCard(); // No match, draw card

      // Player 2 turn
      expect(gameState.currentPlayer().id).toBe('2');
    });

    it('should handle final round completion', () => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2')
      ];
      service.startGame(players);

      // Manually trigger final round
      gameState.updateDeck([]);
      gameState.startFinalRound();

      // Player 1 rolls (starting player)
      service.rollDice();
      service.processDrawCard();

      // Player 2 rolls
      expect(gameState.gameState().phase).toBe(GamePhase.FinalRound);
      service.rollDice();
      service.processDrawCard();

      // Game should now be over
      expect(gameState.isGameOver()).toBe(true);
      expect(gameState.gameState().phase).toBe(GamePhase.GameOver);
    });
  });

  describe('getFinalScores', () => {
    it('should return scores for all players', () => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2')
      ];
      service.startGame(players);

      const scores = service.getFinalScores();
      expect(scores.size).toBe(2);
      expect(scores.has('1')).toBe(true);
      expect(scores.has('2')).toBe(true);
    });
  });

  describe('getPlayerRankings', () => {
    it('should return players ranked by score', () => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2')
      ];
      service.startGame(players);

      const rankings = service.getPlayerRankings();
      expect(rankings.length).toBe(2);
      expect(rankings[0].rank).toBe(1);
      expect(rankings[1].rank).toBeDefined();
    });
  });

  describe('resetGame', () => {
    it('should reset game state', () => {
      const players = [createPlayer('1', 'Player 1')];
      service.startGame(players);

      service.rollDice();
      service.resetGame();

      expect(gameState.gameState().phase).toBe(GamePhase.Setup);
      expect(gameState.gameState().players).toEqual([]);
    });
  });
});
