/**
 * Player model for Finest 9 game
 */

import { Card } from './card.model';

export interface Player {
  id: string;
  name: string;
  isBot: boolean; // true if AI-controlled
  tableau: Card[]; // 9 face-up cards
  capturedCards: Card[]; // Scored pile
  currentScore: number; // Running score
}
