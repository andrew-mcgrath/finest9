import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../../../core/models/player.model';
import { GamePhase } from '../../../../core/models/game-state.model';
import { ScoringService } from '../../../../core/services/scoring.service';

/**
 * ScoreboardComponent - Displays all players with scores and game state
 * Highlights the active player
 */
@Component({
  selector: 'app-scoreboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './scoreboard.component.html',
  styleUrl: './scoreboard.component.scss'
})
export class ScoreboardComponent {
  @Input({ required: true }) players: Player[] = [];
  @Input({ required: true }) currentPlayerIndex: number = 0;
  @Input() deckCount: number = 0;
  @Input() phase: GamePhase = GamePhase.Setup;
  @Input() isFinalRound: boolean = false;

  constructor(private scoringService: ScoringService) {}

  /**
   * Check if player is current
   */
  isCurrentPlayer(player: Player): boolean {
    const index = this.players.findIndex(p => p.id === player.id);
    return index === this.currentPlayerIndex;
  }

  /**
   * Get player score
   */
  getPlayerScore(player: Player): number {
    return this.scoringService.calculatePlayerScore(player);
  }

  /**
   * Get phase display text
   */
  get phaseText(): string {
    const texts: Record<GamePhase, string> = {
      [GamePhase.Setup]: 'Setup',
      [GamePhase.Rolling]: 'Roll Dice',
      [GamePhase.Matching]: 'Select Match',
      [GamePhase.Drawing]: 'Drawing',
      [GamePhase.BotThinking]: 'Bot Thinking...',
      [GamePhase.FinalRound]: 'Final Round',
      [GamePhase.GameOver]: 'Game Over'
    };
    return texts[this.phase] || this.phase;
  }

  /**
   * Get current player name
   */
  get currentPlayerName(): string {
    return this.players[this.currentPlayerIndex]?.name || '';
  }
}
