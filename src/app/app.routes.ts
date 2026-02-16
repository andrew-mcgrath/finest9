import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/setup',
    pathMatch: 'full'
  },
  {
    path: 'setup',
    loadComponent: () =>
      import('./features/game-setup/game-setup.component').then(m => m.GameSetupComponent)
  },
  {
    path: 'game',
    loadComponent: () =>
      import('./features/game-board/game-board.component').then(m => m.GameBoardComponent)
  }
];
