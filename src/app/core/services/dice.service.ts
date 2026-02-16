import { Injectable } from '@angular/core';
import { DiceRoll } from '../models/game-state.model';

/**
 * DiceService - Handles dice rolling operations
 * Responsible for rolling dice and detecting special rolls
 */
@Injectable({
  providedIn: 'root'
})
export class DiceService {
  /**
   * Rolls two six-sided dice and returns the result
   */
  roll(): DiceRoll {
    const die1 = this.rollSingleDie();
    const die2 = this.rollSingleDie();
    const total = die1 + die2;

    return {
      die1,
      die2,
      total,
      isSnakeEyes: total === 2,
      isBoxcars: total === 12,
      isNine: total === 9
    };
  }

  /**
   * Rolls until the total is not 9 (game rule: must re-roll on 9)
   * Returns the final non-9 roll
   */
  rollUntilNotNine(): DiceRoll {
    let result = this.roll();

    // Keep re-rolling if we get a 9
    while (result.isNine) {
      result = this.roll();
    }

    return result;
  }

  /**
   * Rolls a single six-sided die (1-6)
   */
  private rollSingleDie(): number {
    return Math.floor(Math.random() * 6) + 1;
  }
}
