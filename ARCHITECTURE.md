# Rhythm Runner - Architecture Decision Document

## Framework Selection Analysis

### Requirements Summary
- Cross-platform deployment (mobile + web)
- Strong community support with extensive documentation  
- Good performance for real-time audio and smooth animations
- Easy CI/CD integration with GitHub workflows
- Commercial license friendly
- Lightweight and fast development cycle for prototyping
- Target 60fps on mid-range mobile devices
- Real-time beat detection and audio analysis
- Pitch-shifting during tempo control

### Framework Options Evaluated

#### 1. Phaser.js + Capacitor (RECOMMENDED)
**Pros:**
- ✅ Excellent for 2D games with strong community
- ✅ Built-in audio support with Web Audio API
- ✅ Easy deployment to web (immediate testing)
- ✅ Capacitor enables native mobile deployment
- ✅ JavaScript/TypeScript - easy for beginners
- ✅ Great documentation and tutorials
- ✅ MIT license - commercial friendly
- ✅ Excellent CI/CD support
- ✅ Rich ecosystem for audio plugins

**Cons:**
- ⚠️ Audio analysis requires additional libraries
- ⚠️ Mobile performance depends on device web view

**Technical Stack:**
- Phaser.js 3.x (game engine)
- TypeScript (type safety)
- Capacitor (mobile deployment)
- Web Audio API (audio processing)
- Meyda.js (audio analysis/beat detection)
- Tone.js (audio effects and pitch shifting)
- Vite (build system)
- GitHub Actions (CI/CD)

#### 2. Flutter + Flame
**Pros:**
- ✅ Native mobile performance
- ✅ Single codebase for mobile + web
- ✅ Strong community and documentation
- ✅ Good for beginners with Dart

**Cons:**
- ❌ Limited audio analysis libraries
- ❌ Web performance not ideal for games
- ❌ Steeper learning curve than JavaScript

#### 3. React Native + React Native Game Engine
**Pros:**
- ✅ JavaScript familiarity
- ✅ Native mobile performance

**Cons:**
- ❌ Not designed for intensive gaming
- ❌ Limited audio processing capabilities
- ❌ Complex setup for game development

#### 4. Unity
**Pros:**
- ✅ Professional game engine
- ✅ Excellent performance
- ✅ Rich audio tools

**Cons:**
- ❌ C# learning curve
- ❌ Heavy for simple games
- ❌ Complex CI/CD setup
- ❌ Licensing costs for revenue > $100k

## Selected Architecture: Phaser.js + Capacitor

### Why This Choice?
1. **Lowest barrier to entry** - JavaScript/TypeScript familiarity
2. **Rapid prototyping** - immediate web testing, no compilation
3. **Strong audio ecosystem** - Web Audio API + specialized libraries
4. **Excellent documentation** - abundant tutorials and examples
5. **Cost-effective** - completely free and open source
6. **Easy CI/CD** - simple GitHub Actions integration
7. **Progressive enhancement** - start web, add mobile later

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Rhythm Runner Game                    │
├─────────────────────────────────────────────────────────┤
│  Presentation Layer                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Game UI   │ │  Menu UI    │ │ Level Editor│      │
│  │  (Phaser)   │ │  (HTML/CSS) │ │    UI       │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│  Game Logic Layer                                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Player    │ │  Obstacle   │ │   Level     │      │
│  │  Manager    │ │   Manager   │ │  Manager    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Input     │ │    Game     │ │   Score     │      │
│  │  Manager    │ │   State     │ │  Manager    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│  Audio Engine Layer                                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Audio     │ │    Beat     │ │   Tempo     │      │
│  │  Manager    │ │  Detector   │ │ Controller  │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│  Data Layer                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │   Level     │ │   Player    │ │   Audio     │      │
│  │    Data     │ │   Progress  │ │   Assets    │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│  Platform Layer                                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │    Web      │ │   Mobile    │ │  Desktop    │      │
│  │  (Browser)  │ │ (Capacitor) │ │  (Electron) │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

### Key Components

#### 1. Audio Engine
- **AudioManager**: Central audio system
- **BeatDetector**: Real-time beat detection using Meyda.js
- **TempoController**: Pitch-shifting and tempo control using Tone.js
- **AudioAnalyzer**: FFT analysis for obstacle mapping

#### 2. Game Core
- **PlayerManager**: Handle movement, jumping, platform switching
- **ObstacleManager**: Spawn obstacles synced to beats
- **LevelManager**: Load and manage level data
- **GameState**: Central state management
- **InputManager**: Handle touch/gesture controls

#### 3. Level System
- **Level format**: JSON-based with timing data
- **Beat mapping**: Obstacles tied to musical beats
- **Three-layer system**: Different instruments mapped to platforms
- **Dynamic difficulty**: Adjust based on player performance

### Development Phases

#### Phase 1: Core Foundation (Week 1)
- Set up Phaser.js project with TypeScript
- Basic player movement and physics
- Simple obstacle spawning
- Basic audio playback

#### Phase 2: Audio Integration (Week 2)
- Integrate Meyda.js for beat detection
- Implement tempo control with Tone.js
- Sync obstacles to detected beats
- Add visual feedback for timing

#### Phase 3: Game Mechanics (Week 3)
- Three-platform system
- Gesture controls for mobile
- Harmony energy system
- Collectibles and scoring

#### Phase 4: Polish & Deployment (Week 4)
- UI/UX improvements
- Level creation system
- Mobile deployment with Capacitor
- CI/CD pipeline setup

### Technical Implementation Details

#### Beat Detection Algorithm
```typescript
// Using Meyda.js for real-time audio analysis
const analyzer = Meyda.createMeydaAnalyzer({
  audioContext: audioContext,
  source: audioSource,
  bufferSize: 512,
  featureExtractors: ['spectralCentroid', 'mfcc', 'rms']
});

// Custom beat detection combining multiple features
class BeatDetector {
  detectBeat(features: any): boolean {
    // Algorithm combining energy, spectral centroid, and tempo
    // Returns true when beat is detected
  }
}
```

#### Tempo Control System
```typescript
// Using Tone.js for pitch-shifting
class TempoController {
  private pitchShift: Tone.PitchShift;
  
  setTempo(multiplier: number) {
    this.pitchShift.pitch = Math.log2(multiplier) * 12;
    this.audioSource.playbackRate.value = multiplier;
  }
}
```

### Performance Considerations

1. **Audio Processing**: Use Web Workers for heavy analysis
2. **Rendering**: Object pooling for obstacles and effects
3. **Memory**: Preload audio and dispose unused assets
4. **Mobile**: Optimize texture sizes and reduce draw calls
5. **Battery**: Efficient audio processing and frame management

### Testing Strategy

1. **Unit Tests**: Jest for game logic
2. **Integration Tests**: Phaser testing utilities
3. **Audio Tests**: Timing accuracy validation
4. **Performance Tests**: FPS monitoring and memory usage
5. **Mobile Tests**: Device testing via Capacitor
6. **Rhythm Tests**: Beat detection accuracy validation

This architecture provides a solid foundation for rapid development while meeting all the technical requirements specified in the game brief.