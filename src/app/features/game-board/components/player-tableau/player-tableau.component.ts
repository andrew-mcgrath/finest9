import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { Player } from '../../../../core/models/player.model';
import { Card } from '../../../../core/models/card.model';

/**
 * PlayerTableauComponent - Displays a player's 9 cards in a 3x3 grid
 * Supports card selection and highlighting
 */
@Component({
  selector: 'app-player-tableau',
  standalone: true,
  imports: [CommonModule, CardComponent],
  templateUrl: './player-tableau.component.html',
  styleUrl: './player-tableau.component.scss'
})
export class PlayerTableauComponent {
  @Input({ required: true }) player!: Player;
  @Input() selectedCards: Card[] = [];
  @Input() highlightedCards: Card[] = [];
  @Input() disabled: boolean = false;

  @Output() cardSelected = new EventEmitter<Card>();

  /**
   * Check if a card is selected
   */
  isSelected(card: Card): boolean {
    return this.selectedCards.some(c => c.id === card.id);
  }

  /**
   * Check if a card is highlighted
   */
  isHighlighted(card: Card): boolean {
    return this.highlightedCards.some(c => c.id === card.id);
  }

  /**
   * Handle card click
   */
  onCardClick(card: Card): void {
    if (!this.disabled) {
      this.cardSelected.emit(card);
    }
  }

  /**
   * Get captured cards count
   */
  get capturedCount(): number {
    return this.player.capturedCards.length;
  }

  /**
   * Get captured cards total value
   */
  get capturedValue(): number {
    return this.player.capturedCards.reduce((sum, card) => {
      return sum + this.getCardValue(card.rank);
    }, 0);
  }

  /**
   * Get card value for display
   */
  private getCardValue(rank: string): number {
    const values: Record<string, number> = {
      '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
      '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10, 'A': 11
    };
    return values[rank] || 0;
  }
}
