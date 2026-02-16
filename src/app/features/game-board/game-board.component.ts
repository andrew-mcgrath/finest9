import { Component, OnInit, signal, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStateService } from '../../core/services/game-state.service';
import { GameEngineService } from '../../core/services/game-engine.service';
import { BotAIService } from '../../core/services/bot-ai.service';
import { PlayerTableauComponent } from './components/player-tableau/player-tableau.component';
import { DiceRollerComponent } from './components/dice-roller/dice-roller.component';
import { MatchSelectorComponent } from './components/match-selector/match-selector.component';
import { ScoreboardComponent } from './components/scoreboard/scoreboard.component';
import { GameOverComponent } from '../game-over/game-over.component';
import { Card } from '../../core/models/card.model';
import { Match } from '../../core/models/match.model';
import { GamePhase } from '../../core/models/game-state.model';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from '../../shared/components/toast/toast.component';

/**
 * GameBoardComponent - Main game orchestration component
 * Integrates all child components and handles game flow including bot automation
 */

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [
    CommonModule,
    PlayerTableauComponent,
    DiceRollerComponent,
    MatchSelectorComponent,
    ScoreboardComponent,
    GameOverComponent,
    ToastComponent
  ],
  templateUrl: './game-board.component.html',
  styleUrl: './game-board.component.scss'
})
export class GameBoardComponent implements OnInit {
  // Services
  private router = inject(Router);
  private gameStateService = inject(GameStateService);
  private gameEngine = inject(GameEngineService);
  private botAI = inject(BotAIService);
  private toastService = inject(ToastService);

  // Signals for reactive state
  selectedCards = signal<Card[]>([]);
  possibleMatches = signal<Match[]>([]);
  selectedMatch = signal<Match | null>(null);
  rolling = signal(false);
  botThinking = signal(false);

  // Access to game state signals
  gameState = this.gameStateService.gameState;
  currentPlayer = this.gameStateService.currentPlayer;
  canRollDice = this.gameStateService.canRollDice;
  isGameOver = this.gameStateService.isGameOver;
  deckCount = this.gameStateService.deckCount;
  isFinalRound = this.gameStateService.isFinalRound;

  constructor() {
    // Effect to handle toast for bot thinking
    effect(() => {
      if (this.botThinking()) {
        this.toastService.show('Bot is thinking...', 'info', 0); // 0 duration = stays until hidden
      } else {
        this.toastService.hide();
      }
    });

    // Set up effect to handle bot turns
    effect(() => {
      const state = this.gameState();
      const player = this.currentPlayer();

      // Check if it's a bot's turn and we're in a phase where bot should act
      if (player?.isBot && !this.isGameOver()) {
        if (state.phase === GamePhase.Rolling) {
          // Bot needs to roll dice
          setTimeout(() => this.handleBotTurn(), 800);
        } else if (state.phase === GamePhase.Matching) {
          // Bot needs to decide on match
          setTimeout(() => this.handleBotDecision(), 500);
        }
      }
    });
  }

  ngOnInit(): void {
    // Redirect if no game in progress
    const state = this.gameState();
    if (state.players.length === 0) {
      this.router.navigate(['/setup']);
    }
  }

  /**
   * Handle dice roll
   */
  onRollDice(): void {
    this.rolling.set(true);

    // Animate rolling
    setTimeout(() => {
      const diceRoll = this.gameEngine.rollDice();
      this.rolling.set(false);

      // Find possible matches
      const matches = this.gameEngine.findPossibleMatches();
      this.possibleMatches.set(matches);
      this.selectedMatch.set(null);
      this.selectedCards.set([]);
    }, 600);
  }

  /**
   * Handle match selection
   */
  onMatchSelected(match: Match): void {
    this.selectedMatch.set(match);
    this.selectedCards.set(match.cards);
  }

  /**
   * Handle confirm match
   */
  onConfirmMatch(match: Match): void {
    try {
      this.gameEngine.processMatch(match);
      this.clearSelection();
    } catch (error) {
      console.error('Error processing match:', error);
      // Could show error message to user here
    }
  }

  /**
   * Handle draw card
   */
  onDrawCard(): void {
    this.gameEngine.processDrawCard();
    this.clearSelection();
  }

  /**
   * Clear selection
   */
  private clearSelection(): void {
    this.selectedCards.set([]);
    this.possibleMatches.set([]);
    this.selectedMatch.set(null);
  }

  /**
   * Handle bot turn (rolling dice)
   */
  private async handleBotTurn(): Promise<void> {
    if (!this.canRollDice()) return;

    this.botThinking.set(true);
    this.rolling.set(true);

    // Simulate bot thinking
    await this.delay(800);

    // Roll dice
    const diceRoll = this.gameEngine.rollDice();
    this.rolling.set(false);

    // Find possible matches
    const matches = this.gameEngine.findPossibleMatches();
    this.possibleMatches.set(matches);

    this.botThinking.set(false);
  }

  /**
   * Handle bot decision (selecting match or drawing)
   */
  private async handleBotDecision(): Promise<void> {
    const state = this.gameState();
    const player = this.currentPlayer();
    const diceRoll = state.lastDiceRoll;

    if (!player || !diceRoll) return;

    this.botThinking.set(true);
    this.gameStateService.updatePhase(GamePhase.BotThinking);

    // Get bot decision
    const matches = this.possibleMatches();
    const decision = await this.botAI.decideBotMove(player, diceRoll, matches);

    // Highlight bot's choice briefly
    if (decision.action === 'match' && decision.selectedMatch) {
      this.selectedMatch.set(decision.selectedMatch);
      this.selectedCards.set(decision.selectedMatch.cards);

      // Show selection for a moment
      await this.delay(1000);

      // Process match
      this.gameEngine.processMatch(decision.selectedMatch);
    } else {
      // Draw card
      await this.delay(500);
      this.gameEngine.processDrawCard();
    }

    this.clearSelection();
    this.botThinking.set(false);
  }

  /**
   * Handle new game
   */
  onNewGame(): void {
    const players = this.gameState().players.map(p => ({
      ...p,
      tableau: [],
      capturedCards: [],
      currentScore: 0
    }));

    this.gameEngine.startGame(players);
    this.clearSelection();
  }

  /**
   * Handle back to setup
   */
  onBackToSetup(): void {
    this.gameEngine.resetGame();
    this.router.navigate(['/setup']);
  }

  /**
   * Check if current player is bot
   */
  get isCurrentPlayerBot(): boolean {
    return this.currentPlayer()?.isBot || false;
  }

  /**
   * Get phase instruction text
   */
  get phaseInstruction(): string {
    const state = this.gameState();

    if (this.isCurrentPlayerBot) {
      return 'Bot is playing...';
    }

    switch (state.phase) {
      case GamePhase.Rolling:
        return 'Roll the dice to start your turn';
      case GamePhase.Matching:
        return 'Select a match or draw a card';
      case GamePhase.BotThinking:
        return 'Bot is thinking...';
      case GamePhase.FinalRound:
        return 'Final round! Roll the dice';
      default:
        return '';
    }
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
