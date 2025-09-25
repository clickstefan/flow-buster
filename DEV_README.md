# Rhythm Runner - Development Setup

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open browser to `http://localhost:3000`

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run linting
- `npm run type-check` - Type checking

## Mobile Development

To test on mobile devices:

1. Build the web version:
```bash
npm run build
```

2. Add mobile platforms (when ready):
```bash
npm run capacitor:add android
npm run capacitor:add ios
```

3. Sync and open in native IDE:
```bash
npm run android:dev
npm run ios:dev
```

## Project Structure

```
src/
├── core/           # Core game engine
├── audio/          # Audio management
├── game/           # Game logic
├── ui/             # UI components
├── data/           # Data models
└── utils/          # Utilities

public/assets/
├── audio/          # Music and sound files
├── images/         # Sprites and textures
└── levels/         # Level data
```

## Audio Assets Required

The game expects these audio files in `public/assets/audio/`:
- `demo-track.ogg` - Main demo track
- `menu-music.ogg` - Menu background music
- `jump-sound.ogg` - Jump sound effect
- `beat-hit.ogg` - Beat hit sound
- `perfect-hit.ogg` - Perfect hit sound
- `collect-note.ogg` - Collectible pickup sound

## Image Assets Required

The game expects these image files in `public/assets/images/`:
- `background.png` - Scrolling background
- `player-idle.png` - Player idle sprite
- `player-jump.png` - Player jumping sprite
- `player-run.png` - Player running spritesheet
- `platform.png` - Platform texture
- `obstacle.png` - Obstacle sprite
- `obstacle-pulse.png` - Obstacle animation spritesheet
- `note-collectible.png` - Musical note collectible
- `particle.png` - Particle effect texture

## UI Assets

UI assets in `public/assets/images/ui/`:
- `button-play.png`
- `button-pause.png`
- `button-menu.png`
- `harmony-bar.png`
- `tempo-dial.png`

## Technology Stack

- **Framework**: Phaser.js 3.x (2D game engine)
- **Language**: TypeScript
- **Audio**: Tone.js + Meyda.js (audio analysis)
- **Build**: Vite
- **Mobile**: Capacitor
- **Testing**: Jest

## Architecture Highlights

This game uses a modular architecture with separate managers for:
- **AudioManager**: Real-time beat detection and tempo control
- **PlayerManager**: Character movement and physics
- **ObstacleManager**: Obstacle spawning and collision
- **InputManager**: Mobile-optimized gesture controls
- **GameStateManager**: Scoring and progression

## Performance Considerations

The game is optimized for 60fps on mid-range mobile devices with:
- Object pooling for obstacles and particles
- Efficient audio processing with Web Workers
- Responsive design for multiple screen sizes
- Careful memory management

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation as needed
4. Ensure mobile compatibility

For more details, see `ARCHITECTURE.md`.