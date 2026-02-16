import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * DieComponent - Displays a single die face (1-6)
 * Shows dots in traditional dice pattern
 */
@Component({
  selector: 'app-die',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './die.component.html',
  styleUrl: './die.component.scss'
})
export class DieComponent {
  @Input({ required: true }) value!: number;
  @Input() rolling: boolean = false;
  @Input() size: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Get CSS classes for die
   */
  get dieClasses(): string[] {
    const classes = ['die'];

    if (this.rolling) classes.push('die--rolling');
    classes.push(`die--${this.size}`);
    classes.push(`die--${this.value}`);

    return classes;
  }

  /**
   * Get dot positions for the current value
   * Returns array of boolean arrays representing 3x3 grid
   */
  get dotPattern(): boolean[][] {
    const patterns: Record<number, boolean[][]> = {
      1: [
        [false, false, false],
        [false, true, false],
        [false, false, false]
      ],
      2: [
        [true, false, false],
        [false, false, false],
        [false, false, true]
      ],
      3: [
        [true, false, false],
        [false, true, false],
        [false, false, true]
      ],
      4: [
        [true, false, true],
        [false, false, false],
        [true, false, true]
      ],
      5: [
        [true, false, true],
        [false, true, false],
        [true, false, true]
      ],
      6: [
        [true, false, true],
        [true, false, true],
        [true, false, true]
      ]
    };

    return patterns[this.value] || patterns[1];
  }
}
