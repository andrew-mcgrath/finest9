import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Match, MatchType } from '../../../../core/models/match.model';

/**
 * MatchSelectorComponent - Displays possible matches and allows selection
 * Shows match type, cards involved, and score for each match
 */
@Component({
  selector: 'app-match-selector',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './match-selector.component.html',
  styleUrl: './match-selector.component.scss'
})
export class MatchSelectorComponent {
  @Input() matches: Match[] = [];
  @Input() canMatch: boolean = false;
  @Input() selectedMatch: Match | null = null;

  @Output() matchSelected = new EventEmitter<Match>();
  @Output() drawCard = new EventEmitter<void>();
  @Output() confirmMatch = new EventEmitter<Match>();

  /**
   * Handle match selection
   */
  onMatchClick(match: Match): void {
    if (this.canMatch) {
      this.matchSelected.emit(match);
    }
  }

  /**
   * Handle draw card click
   */
  onDrawCardClick(): void {
    if (this.canMatch && this.matches.length === 0) {
      this.drawCard.emit();
    }
  }

  /**
   * Handle confirm match click
   */
  onConfirmMatchClick(): void {
    if (this.selectedMatch) {
      this.confirmMatch.emit(this.selectedMatch);
    }
  }

  /**
   * Check if a match is selected
   */
  isSelected(match: Match): boolean {
    if (!this.selectedMatch) return false;
    return this.selectedMatch.cards.every(card =>
      match.cards.some(c => c.id === card.id)
    ) && match.cards.length === this.selectedMatch.cards.length;
  }

  /**
   * Get match type display name
   */
  getMatchTypeName(type: MatchType): string {
    const names: Record<MatchType, string> = {
      [MatchType.Pair]: 'Pair',
      [MatchType.Set]: 'Set',
      [MatchType.Sequence]: 'Sequence',
      [MatchType.SnakeEyes]: 'Snake Eyes',
      [MatchType.Boxcars]: 'Boxcars'
    };
    return names[type] || type;
  }

  /**
   * Get match type icon
   */
  getMatchTypeIcon(type: MatchType): string {
    const icons: Record<MatchType, string> = {
      [MatchType.Pair]: '👥',
      [MatchType.Set]: '🎯',
      [MatchType.Sequence]: '🔢',
      [MatchType.SnakeEyes]: '🐍',
      [MatchType.Boxcars]: '🚂'
    };
    return icons[type] || '🎴';
  }

  /**
   * Get cards summary for match
   */
  getCardsSummary(match: Match): string {
    return match.cards.map(c => c.rank).join(', ');
  }
}
