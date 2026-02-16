# Finest 9 - Web Card & Dice Game

A digital implementation of the Finest 9 card and dice game, built with Angular 19 and Vite. Play against friends locally or challenge AI opponents!

![Game Status](https://img.shields.io/badge/status-ready%20to%20deploy-success)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-158%20passing-brightgreen)

## 🎮 Features

### Game Modes
- **Play with Friends**: Local hot-seat multiplayer for 2-4 players
- **Play vs Bots**: Challenge 1-3 intelligent AI opponents

### Core Gameplay
- Full rule implementation from RULES.md
- Pair, set, and sequence matching
- Wild 9 card mechanics
- Special rolls (Snake Eyes, Boxcars)
- Automatic score calculation
- Final round when deck is empty

### AI Opponents
- Intelligent decision-making (80% optimal, 20% random)
- Natural thinking delays (500-1500ms)
- Visual feedback during bot turns
- Never breaks game rules

### User Experience
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Accessibility features (ARIA labels, keyboard navigation)
- Clear game state indicators
- Intuitive card selection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd finest9

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to play the game.

### Build for Production

```bash
# Create optimized production build
npm run build

# Preview production build locally
npm run preview
```

Visit `http://localhost:4173` to test the production build.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run linting
npm run lint
```

**Test Coverage**: 158 tests passing across 7 core services
- DeckService: 17 tests
- DiceService: 12 tests
- ScoringService: 24 tests
- MatchValidatorService: 32 tests
- GameStateService: 35 tests
- GameEngineService: 23 tests
- BotAIService: 15 tests

## 📁 Project Structure

```
finest9/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── models/          # Data models and interfaces
│   │   │   └── services/        # Game logic and state management
│   │   ├── features/
│   │   │   ├── game-setup/      # Game configuration screen
│   │   │   ├── game-board/      # Main game interface
│   │   │   └── game-over/       # End game results
│   │   ├── shared/
│   │   │   └── components/      # Reusable UI components
│   │   ├── app.ts               # Root component
│   │   └── app.routes.ts        # Routing configuration
│   ├── styles.scss              # Global styles
│   └── main.ts                  # Application entry point
├── index.html                   # HTML entry point
├── vite.config.ts              # Vite configuration
├── vitest.config.ts            # Test configuration
├── RULES.md                    # Game rules documentation
├── OPTIONAL_RULES.md           # Optional game variants
├── DEPLOYMENT.md               # AWS deployment guide
└── README.md                   # This file
```

## 🎯 Game Rules

See [RULES.md](RULES.md) for complete game rules.

### Quick Summary
1. Each player starts with 9 face-up cards
2. Roll two dice (re-roll if total is 9)
3. Match cards based on dice value:
   - **Pairs/Sets**: All cards of matching rank
   - **Sequences**: Three consecutive ranks where one matches dice
   - **Wild 9s**: Can substitute in any match
   - **Snake Eyes (2)**: Match any pair
   - **Boxcars (12)**: Match any sequence
4. Capture matched cards or draw one card if no match
5. Game ends when deck is empty + one final roll per player
6. Score = (captured cards) - (remaining tableau cards)

## 🏗️ Technology Stack

### Framework & Build
- **Angular 19**: Modern web framework with standalone components
- **Vite**: Fast build tool and dev server
- **TypeScript 5.9**: Type-safe development

### State Management
- **Angular Signals**: Reactive state primitives (no external library needed)

### Styling
- **SCSS**: CSS preprocessor
- **CSS Grid/Flexbox**: Modern layout techniques

### Testing
- **Vitest**: Fast unit testing framework
- **jsdom**: Browser environment simulation

### Linting
- **ESLint 9**: Code quality and consistency
- **Angular ESLint**: Angular-specific rules
- **TypeScript ESLint**: TypeScript linting

## 🎨 Design Decisions

### Why Angular Signals?
- Built-in reactive primitives (no Redux/NgRx needed)
- Fine-grained reactivity
- Better performance than RxJS for this use case
- Simpler learning curve

### Why Vite?
- Faster dev server startup and HMR
- Smaller production bundles
- Modern ESM-based architecture
- Better developer experience

### Why Standalone Components?
- Simpler module structure
- Lazy loading out of the box
- Aligns with Angular's future direction
- Less boilerplate code

## 🤖 Bot AI Implementation

The bot AI uses a simple but effective strategy:

1. **Match Selection** (80% optimal / 20% random):
   - Prioritizes higher-scoring matches
   - Prefers more cards (reduces end-game penalty)
   - Adds randomness for human-like behavior

2. **Special Roll Handling**:
   - Snake Eyes: Chooses highest-value pair
   - Boxcars: Chooses highest-scoring sequence

3. **Natural Behavior**:
   - Random thinking delay (500-1500ms)
   - Visual feedback during decision-making
   - Never breaks game rules

## 🌐 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete AWS deployment instructions.

### Quick Deploy to AWS

```bash
# 1. Build the app
npm run build

# 2. Create S3 bucket
aws s3 mb s3://finest9-game

# 3. Upload files
aws s3 sync dist/finest9/ s3://finest9-game --delete

# 4. Configure for static website hosting
aws s3 website s3://finest9-game \
  --index-document index.html \
  --error-document index.html

# 5. Create CloudFront distribution (see DEPLOYMENT.md)
```

## 🔧 Configuration

### Environment Variables
Currently, the app requires no environment variables. All configuration is in source code.

### Vite Configuration
See [vite.config.ts](vite.config.ts) for build and dev server settings.

### TypeScript Configuration
See [tsconfig.json](tsconfig.json) for compiler options.

## 📊 Bundle Size

**Production Build** (gzipped):
- Total: ~110 KB
- Angular framework: ~69 KB
- Game logic: ~28 KB
- UI components: ~13 KB

## 🐛 Known Issues

None currently. Please report issues via GitHub Issues.

## 🚧 Future Enhancements

### Planned (v1.1-1.2)
- [ ] Optional rules implementation (Perfect Clear, Combo Bonus)
- [ ] Sound effects
- [ ] Tutorial mode
- [ ] Game statistics and history

### Considered (v2.0+)
- [ ] Online multiplayer (Firebase/WebSockets)
- [ ] Multiple bot difficulty levels
- [ ] Custom themes and card designs
- [ ] Tournament mode
- [ ] Achievements system

## 📝 Development

### Adding a New Component

```bash
# Create component directory
mkdir -p src/app/features/new-feature

# Create component files
touch src/app/features/new-feature/new-feature.component.{ts,html,scss}
```

### Running Specific Tests

```bash
# Run tests for a specific file
npm test -- src/app/core/services/dice.service.spec.ts

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Code Style

- Use Angular ESLint recommended rules
- Follow Angular style guide
- Prefer signals over RxJS for simple state
- Use standalone components
- Write descriptive commit messages

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is private and not licensed for public use.

## 🙏 Acknowledgments

- Game design based on family card game rules
- Built with Angular and the amazing Angular community
- Icons and emojis from Unicode standard

## 📞 Support

For questions or issues:
1. Check [RULES.md](RULES.md) for game rules
2. Review [DEPLOYMENT.md](DEPLOYMENT.md) for deployment help
3. Open an issue on GitHub
4. Contact the development team

---

**Made with ❤️ using Angular 19 + Vite**

**Status**: ✅ Ready for deployment
**Last Updated**: February 2026
