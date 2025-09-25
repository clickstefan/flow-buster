import * as Phaser from 'phaser';
import { GameConfig } from '@/core/GameConfig';
import { PreloadScene } from '@/core/scenes/PreloadScene';
import { MainMenuScene } from '@/core/scenes/MainMenuScene';
import { GameScene } from '@/core/scenes/GameScene';
import { UIScene } from '@/core/scenes/UIScene';

/**
 * Main entry point for Rhythm Runner
 * Initializes Phaser game with optimized settings for rhythm gameplay
 */
class RhythmRunner {
  private game: Phaser.Game | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    // Hide loading screen once game is ready
    const loadingElement = document.getElementById('loading');
    
    // Create Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: GameConfig.GAME_WIDTH,
      height: GameConfig.GAME_HEIGHT,
      parent: 'game-container',
      backgroundColor: GameConfig.BACKGROUND_COLOR,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
          width: GameConfig.MIN_WIDTH,
          height: GameConfig.MIN_HEIGHT,
        },
        max: {
          width: GameConfig.MAX_WIDTH,
          height: GameConfig.MAX_HEIGHT,
        },
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: GameConfig.GRAVITY },
          debug: GameConfig.DEBUG_PHYSICS,
        },
      },
      input: {
        touch: true,
        smoothFactor: 0.2,
      },
      audio: {
        disableWebAudio: false,
        context: undefined, // Will be set by AudioManager
      },
      scene: [PreloadScene, MainMenuScene, GameScene, UIScene],
      callbacks: {
        postBoot: (_game: Phaser.Game) => {
          // Hide loading screen when game boots
          if (loadingElement) {
            loadingElement.style.display = 'none';
          }
          console.log('🎵 Rhythm Runner loaded successfully!');
        },
      },
      // Performance optimizations
      render: {
        pixelArt: false,
        antialias: true,
        powerPreference: 'high-performance',
      },
      fps: {
        target: 60,
        forceSetTimeOut: true,
      },
    };

    this.game = new Phaser.Game(config);

    // Handle window resize
    this.setupResizeHandler();
    
    // Handle visibility changes (mobile background/foreground)
    this.setupVisibilityHandler();
  }

  private setupResizeHandler(): void {
    window.addEventListener('resize', () => {
      if (this.game) {
        this.game.scale.refresh();
      }
    });

    // Handle orientation changes on mobile
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (this.game) {
          this.game.scale.refresh();
        }
      }, 100);
    });
  }

  private setupVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      if (this.game) {
        if (document.hidden) {
          // Pause audio and game when app goes to background
          this.game.scene.getScenes(true).forEach(scene => {
            if (scene.scene.key === 'GameScene') {
              scene.scene.pause();
            }
          });
        } else {
          // Resume when app comes to foreground (user decides)
          console.log('App resumed - user can manually resume game');
        }
      }
    });
  }

  public destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
  }
}

// Initialize the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RhythmRunner());
} else {
  new RhythmRunner();
}

// Handle unload
window.addEventListener('beforeunload', () => {
  // Cleanup if needed
});

export default RhythmRunner;