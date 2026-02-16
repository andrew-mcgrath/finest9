import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DieComponent } from '../../../../shared/components/die/die.component';
import { DiceRoll } from '../../../../core/models/game-state.model';

/**
 * DiceRollerComponent - Displays dice and roll button
 * Shows special roll badges (Snake Eyes, Boxcars)
 */
@Component({
  selector: 'app-dice-roller',
  standalone: true,
  imports: [CommonModule, DieComponent],
  templateUrl: './dice-roller.component.html',
  styleUrl: './dice-roller.component.scss'
})
export class DiceRollerComponent {
  @Input() diceRoll: DiceRoll | null = null;
  @Input() canRoll: boolean = false;
  @Input() rolling: boolean = false;

  @Output() rollDice = new EventEmitter<void>();

  /**
   * Handle roll button click
   */
  onRollClick(): void {
    if (this.canRoll && !this.rolling) {
      this.rollDice.emit();
    }
  }

  /**
   * Get special roll badge text
   */
  get specialRollBadge(): string | null {
    if (!this.diceRoll) return null;

    if (this.diceRoll.isSnakeEyes) {
      return 'Snake Eyes! (Match any pair)';
    }

    if (this.diceRoll.isBoxcars) {
      return 'Boxcars! (Match any sequence)';
    }

    return null;
  }

  /**
   * Get special roll badge CSS class
   */
  get specialRollBadgeClass(): string {
    if (!this.diceRoll) return '';

    if (this.diceRoll.isSnakeEyes) return 'dice-roller__badge--snake-eyes';
    if (this.diceRoll.isBoxcars) return 'dice-roller__badge--boxcars';

    return '';
  }
}
