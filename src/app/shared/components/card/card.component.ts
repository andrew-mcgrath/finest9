import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Card, Suit } from '../../../core/models/card.model';

/**
 * CardComponent - Displays a playing card
 * Supports states: normal, selected, highlighted
 */
@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  @Input({ required: true }) card!: Card;
  @Input() selected: boolean = false;
  @Input() highlighted: boolean = false;
  @Input() disabled: boolean = false;
  @Input() showBack: boolean = false; // Show card back instead of face

  @Output() cardClick = new EventEmitter<Card>();

  // Suit symbols
  private suitSymbols: Record<Suit, string> = {
    [Suit.Hearts]: '♥',
    [Suit.Diamonds]: '♦',
    [Suit.Clubs]: '♣',
    [Suit.Spades]: '♠'
  };

  // Suit colors
  private suitColors: Record<Suit, string> = {
    [Suit.Hearts]: 'red',
    [Suit.Diamonds]: 'red',
    [Suit.Clubs]: 'black',
    [Suit.Spades]: 'black'
  };

  /**
   * Get the suit symbol for display
   */
  get suitSymbol(): string {
    return this.suitSymbols[this.card.suit];
  }

  /**
   * Get the suit color
   */
  get suitColor(): string {
    return this.suitColors[this.card.suit];
  }

  /**
   * Get CSS classes for card
   */
  get cardClasses(): string[] {
    const classes = ['card'];

    if (this.selected) classes.push('card--selected');
    if (this.highlighted) classes.push('card--highlighted');
    if (this.disabled) classes.push('card--disabled');
    if (this.showBack) classes.push('card--back');

    classes.push(`card--${this.suitColor}`);

    return classes;
  }

  /**
   * Handle card click
   */
  onClick(): void {
    if (!this.disabled && !this.showBack) {
      this.cardClick.emit(this.card);
    }
  }

  /**
   * Handle keyboard interaction
   */
  onKeyPress(event: KeyboardEvent): void {
    if ((event.key === 'Enter' || event.key === ' ') && !this.disabled && !this.showBack) {
      event.preventDefault();
      this.cardClick.emit(this.card);
    }
  }
}
