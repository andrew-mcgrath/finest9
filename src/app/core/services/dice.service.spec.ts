import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DiceService } from './dice.service';

describe('DiceService', () => {
  let service: DiceService;

  beforeEach(() => {
    service = new DiceService();
  });

  describe('roll', () => {
    it('should return a DiceRoll object with die1 and die2', () => {
      const result = service.roll();
      expect(result.die1).toBeDefined();
      expect(result.die2).toBeDefined();
      expect(typeof result.die1).toBe('number');
      expect(typeof result.die2).toBe('number');
    });

    it('should have die values between 1 and 6', () => {
      // Test multiple rolls to ensure randomness
      for (let i = 0; i < 100; i++) {
        const result = service.roll();
        expect(result.die1).toBeGreaterThanOrEqual(1);
        expect(result.die1).toBeLessThanOrEqual(6);
        expect(result.die2).toBeGreaterThanOrEqual(1);
        expect(result.die2).toBeLessThanOrEqual(6);
      }
    });

    it('should calculate total correctly', () => {
      const result = service.roll();
      expect(result.total).toBe(result.die1 + result.die2);
    });

    it('should have total between 2 and 12', () => {
      // Test multiple rolls
      for (let i = 0; i < 100; i++) {
        const result = service.roll();
        expect(result.total).toBeGreaterThanOrEqual(2);
        expect(result.total).toBeLessThanOrEqual(12);
      }
    });

    it('should detect Snake Eyes (total === 2)', () => {
      // Mock Math.random to force rolling 1s
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValue(0); // Will result in 1 for both dice

      const result = service.roll();
      expect(result.die1).toBe(1);
      expect(result.die2).toBe(1);
      expect(result.total).toBe(2);
      expect(result.isSnakeEyes).toBe(true);
      expect(result.isBoxcars).toBe(false);
      expect(result.isNine).toBe(false);

      mathRandomSpy.mockRestore();
    });

    it('should detect Boxcars (total === 12)', () => {
      // Mock Math.random to force rolling 6s
      const mathRandomSpy = vi.spyOn(Math, 'random');
      mathRandomSpy.mockReturnValue(0.999); // Will result in 6 for both dice

      const result = service.roll();
      expect(result.die1).toBe(6);
      expect(result.die2).toBe(6);
      expect(result.total).toBe(12);
      expect(result.isSnakeEyes).toBe(false);
      expect(result.isBoxcars).toBe(true);
      expect(result.isNine).toBe(false);

      mathRandomSpy.mockRestore();
    });

    it('should detect nine (total === 9)', () => {
      // Mock Math.random to force rolling 4 and 5
      const mathRandomSpy = vi.spyOn(Math, 'random');
      let callCount = 0;
      mathRandomSpy.mockImplementation(() => {
        // First call: 0.5 → floor(3) → 4
        // Second call: 0.7 → floor(4.2) → 5
        callCount++;
        return callCount === 1 ? 0.5 : 0.7;
      });

      const result = service.roll();
      expect(result.total).toBe(9);
      expect(result.isNine).toBe(true);
      expect(result.isSnakeEyes).toBe(false);
      expect(result.isBoxcars).toBe(false);

      mathRandomSpy.mockRestore();
    });

    it('should not mark Snake Eyes or Boxcars for normal rolls', () => {
      // Mock Math.random to force rolling 3 and 4
      const mathRandomSpy = vi.spyOn(Math, 'random');
      let callCount = 0;
      mathRandomSpy.mockImplementation(() => {
        callCount++;
        // 0.35 → floor(2.1) → 3
        // 0.5 → floor(3) → 4
        return callCount === 1 ? 0.35 : 0.5;
      });

      const result = service.roll();
      expect(result.total).toBe(7);
      expect(result.isSnakeEyes).toBe(false);
      expect(result.isBoxcars).toBe(false);
      expect(result.isNine).toBe(false);

      mathRandomSpy.mockRestore();
    });
  });

  describe('rollUntilNotNine', () => {
    it('should return a result that is not nine', () => {
      const result = service.rollUntilNotNine();
      expect(result.isNine).toBe(false);
      expect(result.total).not.toBe(9);
    });

    it('should re-roll if first roll is nine', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random');
      let callCount = 0;

      mathRandomSpy.mockImplementation(() => {
        callCount++;
        // First two calls: 4 and 5 (total 9)
        // Next two calls: 2 and 3 (total 5)
        if (callCount <= 2) {
          return callCount === 1 ? 0.5 : 0.7; // 4 and 5
        } else {
          return callCount === 3 ? 0.17 : 0.35; // 2 and 3
        }
      });

      const result = service.rollUntilNotNine();
      expect(result.total).toBe(5);
      expect(result.isNine).toBe(false);
      expect(callCount).toBe(4); // Rolled twice (2 dice each time)

      mathRandomSpy.mockRestore();
    });

    it('should keep re-rolling multiple times if necessary', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random');
      let callCount = 0;

      mathRandomSpy.mockImplementation(() => {
        callCount++;
        // First 4 calls: two rolls of 9 (4+5, 3+6)
        // Next 2 calls: roll of 7 (3+4)
        if (callCount <= 2) {
          return callCount === 1 ? 0.5 : 0.7; // 4 and 5 → 9
        } else if (callCount <= 4) {
          return callCount === 3 ? 0.35 : 0.85; // 3 and 6 → 9
        } else {
          return callCount === 5 ? 0.35 : 0.5; // 3 and 4 → 7
        }
      });

      const result = service.rollUntilNotNine();
      expect(result.total).toBe(7);
      expect(result.isNine).toBe(false);
      expect(callCount).toBe(6); // Rolled 3 times total

      mathRandomSpy.mockRestore();
    });

    it('should return on first roll if not nine', () => {
      const mathRandomSpy = vi.spyOn(Math, 'random');
      let callCount = 0;

      mathRandomSpy.mockImplementation(() => {
        callCount++;
        return callCount === 1 ? 0.17 : 0.5; // 2 and 4 → 6
      });

      const result = service.rollUntilNotNine();
      expect(result.total).toBe(6);
      expect(result.isNine).toBe(false);
      expect(callCount).toBe(2); // Only rolled once

      mathRandomSpy.mockRestore();
    });
  });
});
