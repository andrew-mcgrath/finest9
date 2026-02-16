import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameEngineService } from '../../core/services/game-engine.service';
import { Player } from '../../core/models/player.model';

type PlayMode = 'friends' | 'bots' | null;

/**
 * GameSetupComponent - Initial game setup screen
 * Allows players to configure game mode, player names, and bot count
 */
@Component({
  selector: 'app-game-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './game-setup.component.html',
  styleUrl: './game-setup.component.scss'
})
export class GameSetupComponent {
  // Play mode selection
  playMode = signal<PlayMode>(null);

  // Friends mode settings
  playerCount = signal<number>(2);
  playerNames = signal<string[]>(['', '']);

  // Bots mode settings
  humanPlayerName = signal<string>('');
  botCount = signal<number>(1);

  // Generated bot names
  private readonly botNames = ['Alpha', 'Beta', 'Gamma', 'Delta'];

  constructor(
    private router: Router,
    private gameEngine: GameEngineService
  ) { }

  /**
   * Select play mode
   */
  selectPlayMode(mode: PlayMode): void {
    this.playMode.set(mode);

    // Reset settings
    if (mode === 'friends') {
      this.playerCount.set(2);
      this.playerNames.set(['', '']);
    } else if (mode === 'bots') {
      this.humanPlayerName.set('');
      this.botCount.set(1);
    }
  }

  /**
   * Update player count for friends mode
   */
  updatePlayerCount(count: number): void {
    this.playerCount.set(count);

    // Adjust player names array
    const current = this.playerNames();
    if (count > current.length) {
      // Add empty strings
      const newNames = [...current, ...Array(count - current.length).fill('')];
      this.playerNames.set(newNames);
    } else {
      // Trim array
      this.playerNames.set(current.slice(0, count));
    }
  }

  /**
   * Update player name at specific index
   */
  updatePlayerName(index: number, name: string): void {
    const names = [...this.playerNames()];
    names[index] = name;
    this.playerNames.set(names);
  }

  /**
   * Check if setup is valid and ready to start
   */
  canStartGame(): boolean {
    const mode = this.playMode();

    if (!mode) return false;

    if (mode === 'friends') {
      // All player names must be non-empty
      return this.playerNames().every(name => name.trim().length > 0);
    } else if (mode === 'bots') {
      // Human player name must be non-empty
      return this.humanPlayerName().trim().length > 0;
    }

    return false;
  }

  /**
   * Start the game
   */
  startGame(): void {
    if (!this.canStartGame()) return;

    const mode = this.playMode();
    let players: Player[] = [];

    if (mode === 'friends') {
      // Create players from entered names
      players = this.playerNames().map((name, index) => ({
        id: `player-${index + 1}`,
        name: name.trim(),
        isBot: false,
        tableau: [],
        capturedCards: [],
        currentScore: 0
      }));
    } else if (mode === 'bots') {
      // Create human player
      const humanPlayer: Player = {
        id: 'player-1',
        name: this.humanPlayerName().trim(),
        isBot: false,
        tableau: [],
        capturedCards: [],
        currentScore: 0
      };

      // Create bot players
      const botPlayers: Player[] = Array.from(
        { length: this.botCount() },
        (_, index) => ({
          id: `bot-${index + 1}`,
          name: this.botNames[index] || `Bot ${index + 1}`,
          isBot: true,
          tableau: [],
          capturedCards: [],
          currentScore: 0
        })
      );

      players = [humanPlayer, ...botPlayers];
    }

    // Initialize game
    this.gameEngine.startGame(players);

    // Navigate to game board
    this.router.navigate(['/game']);
  }

  /**
   * Track by index for ngFor to prevent focus loss
   */
  trackByIndex(index: number, item: any): number {
    return index;
  }

  /**
   * Go back to mode selection
   */
  goBack(): void {
    this.playMode.set(null);
  }
}
