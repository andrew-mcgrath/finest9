import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateService } from './game-state.service';
import { GamePhase } from '../models/game-state.model';
import { Player } from '../models/player.model';
import { Card, Rank, Suit } from '../models/card.model';

describe('GameStateService', () => {
  let service: GameStateService;

  beforeEach(() => {
    service = new GameStateService();
  });

  const createCard = (rank: Rank, suit: Suit = Suit.Hearts): Card => ({
    rank,
    suit,
    id: `${suit}-${rank}`
  });

  const createPlayer = (
    id: string,
    name: string,
    isBot: boolean = false,
    tableau: Card[] = [],
    capturedCards: Card[] = []
  ): Player => ({
    id,
    name,
    isBot,
    tableau,
    capturedCards,
    currentScore: 0
  });

  describe('Initial State', () => {
    it('should have initial setup phase', () => {
      expect(service.gameState().phase).toBe(GamePhase.Setup);
    });

    it('should have empty players array', () => {
      expect(service.gameState().players).toEqual([]);
    });

    it('should have empty deck', () => {
      expect(service.gameState().deck).toEqual([]);
      expect(service.deckCount()).toBe(0);
    });

    it('should not be game over initially', () => {
      expect(service.isGameOver()).toBe(false);
    });

    it('should not be in final round initially', () => {
      expect(service.isFinalRound()).toBe(false);
    });
  });

  describe('initGame', () => {
    it('should initialize game with players and deck', () => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2')
      ];
      const deck = [createCard(Rank.Ace), createCard(Rank.King)];

      service.initGame(players, deck);

      const state = service.gameState();
      expect(state.players).toEqual(players);
      expect(state.deck).toEqual(deck);
      expect(state.phase).toBe(GamePhase.Rolling);
      expect(state.currentPlayerIndex).toBe(0);
    });

    it('should set deckEmpty to false when deck has cards', () => {
      const players = [createPlayer('1', 'Player 1')];
      const deck = [createCard(Rank.Ace)];

      service.initGame(players, deck);

      expect(service.gameState().deckEmpty).toBe(false);
    });

    it('should reset final round state', () => {
      const players = [createPlayer('1', 'Player 1')];
      const deck = [createCard(Rank.Ace)];

      service.initGame(players, deck);

      expect(service.gameState().finalRoundStarted).toBe(false);
      expect(service.gameState().finalRoundPlayerIndex).toBeNull();
    });
  });

  describe('Computed Signals', () => {
    beforeEach(() => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2')
      ];
      const deck = [createCard(Rank.Ace)];
      service.initGame(players, deck);
    });

    it('should compute currentPlayer correctly', () => {
      const currentPlayer = service.currentPlayer();
      expect(currentPlayer.id).toBe('1');
      expect(currentPlayer.name).toBe('Player 1');
    });

    it('should update currentPlayer when index changes', () => {
      service.nextPlayer();
      const currentPlayer = service.currentPlayer();
      expect(currentPlayer.id).toBe('2');
    });

    it('should compute canRollDice as true in Rolling phase', () => {
      service.updatePhase(GamePhase.Rolling);
      expect(service.canRollDice()).toBe(true);
    });

    it('should compute canRollDice as false in Matching phase', () => {
      service.updatePhase(GamePhase.Matching);
      expect(service.canRollDice()).toBe(false);
    });

    it('should compute canRollDice as true in FinalRound phase', () => {
      service.updatePhase(GamePhase.FinalRound);
      expect(service.canRollDice()).toBe(true);
    });

    it('should compute deckCount correctly', () => {
      expect(service.deckCount()).toBe(1);
      service.updateDeck([]);
      expect(service.deckCount()).toBe(0);
    });
  });

  describe('Phase Management', () => {
    beforeEach(() => {
      const players = [createPlayer('1', 'Player 1')];
      const deck = [createCard(Rank.Ace)];
      service.initGame(players, deck);
    });

    it('should update phase correctly', () => {
      service.updatePhase(GamePhase.Matching);
      expect(service.gameState().phase).toBe(GamePhase.Matching);
    });

    it('should transition through phases', () => {
      service.updatePhase(GamePhase.Rolling);
      expect(service.gameState().phase).toBe(GamePhase.Rolling);

      service.updatePhase(GamePhase.Matching);
      expect(service.gameState().phase).toBe(GamePhase.Matching);

      service.updatePhase(GamePhase.Drawing);
      expect(service.gameState().phase).toBe(GamePhase.Drawing);
    });
  });

  describe('Dice Roll Management', () => {
    beforeEach(() => {
      const players = [createPlayer('1', 'Player 1')];
      const deck = [createCard(Rank.Ace)];
      service.initGame(players, deck);
    });

    it('should set dice roll', () => {
      const diceRoll = {
        die1: 3,
        die2: 4,
        total: 7,
        isSnakeEyes: false,
        isBoxcars: false,
        isNine: false
      };

      service.setDiceRoll(diceRoll);
      expect(service.gameState().lastDiceRoll).toEqual(diceRoll);
    });

    it('should clear dice roll on next player', () => {
      const players = [createPlayer('1', 'Player 1'), createPlayer('2', 'Player 2')];
      service.initGame(players, []);

      const diceRoll = { die1: 3, die2: 4, total: 7, isSnakeEyes: false, isBoxcars: false, isNine: false };
      service.setDiceRoll(diceRoll);

      service.nextPlayer();
      expect(service.gameState().lastDiceRoll).toBeNull();
    });
  });

  describe('Player Turn Management', () => {
    beforeEach(() => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2'),
        createPlayer('3', 'Player 3')
      ];
      const deck = [createCard(Rank.Ace)];
      service.initGame(players, deck);
    });

    it('should advance to next player', () => {
      expect(service.gameState().currentPlayerIndex).toBe(0);
      service.nextPlayer();
      expect(service.gameState().currentPlayerIndex).toBe(1);
      service.nextPlayer();
      expect(service.gameState().currentPlayerIndex).toBe(2);
    });

    it('should wrap around to first player', () => {
      service.nextPlayer(); // Player 2
      service.nextPlayer(); // Player 3
      service.nextPlayer(); // Back to Player 1
      expect(service.gameState().currentPlayerIndex).toBe(0);
    });

    it('should reset phase to Rolling on next player', () => {
      service.updatePhase(GamePhase.Matching);
      service.nextPlayer();
      expect(service.gameState().phase).toBe(GamePhase.Rolling);
    });
  });

  describe('Player State Updates', () => {
    beforeEach(() => {
      const players = [
        createPlayer('1', 'Player 1', false, [createCard(Rank.Two)]),
        createPlayer('2', 'Player 2')
      ];
      const deck = [createCard(Rank.Ace)];
      service.initGame(players, deck);
    });

    it('should update player tableau', () => {
      const newTableau = [createCard(Rank.King), createCard(Rank.Queen)];
      service.updatePlayerTableau('1', newTableau);

      const player = service.gameState().players.find(p => p.id === '1');
      expect(player?.tableau).toEqual(newTableau);
    });

    it('should not affect other players when updating tableau', () => {
      const newTableau = [createCard(Rank.King)];
      service.updatePlayerTableau('1', newTableau);

      const player2 = service.gameState().players.find(p => p.id === '2');
      expect(player2?.tableau).toEqual([]);
    });

    it('should update player captured cards', () => {
      const captured = [createCard(Rank.Ace), createCard(Rank.King)];
      service.updatePlayerCapturedCards('1', captured);

      const player = service.gameState().players.find(p => p.id === '1');
      expect(player?.capturedCards).toEqual(captured);
    });

    it('should not affect other players when updating captured cards', () => {
      const captured = [createCard(Rank.Ace)];
      service.updatePlayerCapturedCards('1', captured);

      const player2 = service.gameState().players.find(p => p.id === '2');
      expect(player2?.capturedCards).toEqual([]);
    });
  });

  describe('Deck Management', () => {
    beforeEach(() => {
      const players = [createPlayer('1', 'Player 1')];
      const deck = [createCard(Rank.Ace), createCard(Rank.King)];
      service.initGame(players, deck);
    });

    it('should update deck', () => {
      const newDeck = [createCard(Rank.Queen)];
      service.updateDeck(newDeck);

      expect(service.gameState().deck).toEqual(newDeck);
      expect(service.deckCount()).toBe(1);
    });

    it('should set deckEmpty when deck becomes empty', () => {
      service.updateDeck([]);

      expect(service.gameState().deckEmpty).toBe(true);
      expect(service.deckCount()).toBe(0);
    });

    it('should set deckEmpty to false when deck has cards', () => {
      service.updateDeck([]);
      expect(service.gameState().deckEmpty).toBe(true);

      service.updateDeck([createCard(Rank.Two)]);
      expect(service.gameState().deckEmpty).toBe(false);
    });
  });

  describe('Final Round', () => {
    beforeEach(() => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2'),
        createPlayer('3', 'Player 3')
      ];
      const deck = [createCard(Rank.Ace)];
      service.initGame(players, deck);
    });

    it('should start final round', () => {
      service.startFinalRound();

      const state = service.gameState();
      expect(state.finalRoundStarted).toBe(true);
      expect(state.finalRoundPlayerIndex).toBe(0);
      expect(state.phase).toBe(GamePhase.FinalRound);
      expect(service.isFinalRound()).toBe(true);
    });

    it('should record starting player for final round', () => {
      service.nextPlayer(); // Move to player 2
      service.startFinalRound();

      expect(service.gameState().finalRoundPlayerIndex).toBe(1);
    });

    it('should keep phase as FinalRound when advancing players', () => {
      service.startFinalRound();
      service.nextPlayer();

      expect(service.gameState().phase).toBe(GamePhase.FinalRound);
    });

    it('should detect when final round is complete', () => {
      service.startFinalRound(); // Player 1 starts
      expect(service.isFinalRoundComplete()).toBe(false);

      service.nextPlayer(); // Player 2
      expect(service.isFinalRoundComplete()).toBe(false);

      service.nextPlayer(); // Player 3
      expect(service.isFinalRoundComplete()).toBe(true); // Next would be Player 1 again
    });

    it('should not advance past starting player in final round', () => {
      service.startFinalRound(); // Player 1 starts (index 0)
      service.nextPlayer(); // Player 2 (index 1)
      service.nextPlayer(); // Player 3 (index 2)
      service.nextPlayer(); // Should NOT advance to Player 1

      expect(service.gameState().currentPlayerIndex).toBe(2);
    });
  });

  describe('Game Over', () => {
    beforeEach(() => {
      const players = [
        createPlayer('1', 'Player 1'),
        createPlayer('2', 'Player 2')
      ];
      const deck = [createCard(Rank.Ace)];
      service.initGame(players, deck);
    });

    it('should set winner and end game', () => {
      const winner = service.gameState().players[0];
      service.setWinner(winner);

      expect(service.gameState().winner).toEqual(winner);
      expect(service.gameState().phase).toBe(GamePhase.GameOver);
      expect(service.isGameOver()).toBe(true);
    });
  });

  describe('Reset', () => {
    it('should reset to initial state', () => {
      const players = [createPlayer('1', 'Player 1')];
      const deck = [createCard(Rank.Ace)];
      service.initGame(players, deck);

      service.updatePhase(GamePhase.Matching);
      service.nextPlayer();

      service.reset();

      const state = service.gameState();
      expect(state.phase).toBe(GamePhase.Setup);
      expect(state.players).toEqual([]);
      expect(state.deck).toEqual([]);
      expect(state.currentPlayerIndex).toBe(0);
      expect(state.finalRoundStarted).toBe(false);
    });
  });
});
