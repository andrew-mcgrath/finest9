import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Player } from '../../core/models/player.model';
import { ScoringService } from '../../core/services/scoring.service';

/**
 * GameOverComponent - Modal overlay displaying final scores and winner
 * Shows score breakdown and options to start new game
 */
@Component({
  selector: 'app-game-over',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './game-over.component.html',
  styleUrl: './game-over.component.scss'
})
export class GameOverComponent {
  @Input({ required: true }) players: Player[] = [];
  @Input({ required: true }) winner: Player | null = null;

  @Output() newGame = new EventEmitter<void>();
  @Output() backToSetup = new EventEmitter<void>();

  constructor(private scoringService: ScoringService) {}

  /**
   * Get player rankings
   */
  get rankings(): Array<{ player: Player; score: number; rank: number }> {
    return this.scoringService.getPlayersByRank(this.players);
  }

  /**
   * Get captured cards value for a player
   */
  getCapturedValue(player: Player): number {
    return this.scoringService.calculateCardsValue(player.capturedCards);
  }

  /**
   * Get tableau cards value for a player
   */
  getTableauValue(player: Player): number {
    return this.scoringService.calculateCardsValue(player.tableau);
  }

  /**
   * Get final score for a player
   */
  getFinalScore(player: Player): number {
    return this.scoringService.calculatePlayerScore(player);
  }

  /**
   * Handle new game click
   */
  onNewGameClick(): void {
    this.newGame.emit();
  }

  /**
   * Handle back to setup click
   */
  onBackToSetupClick(): void {
    this.backToSetup.emit();
  }

  /**
   * Get rank suffix (1st, 2nd, 3rd, etc.)
   */
  getRankSuffix(rank: number): string {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return `${rank}th`;
  }
}
