import * as Phaser from 'phaser';
import { GameConfig } from '@/core/GameConfig';

/**
 * PreloadScene - Loads all game assets
 * Shows loading progress and prepares the game
 */
export class PreloadScene extends Phaser.Scene {
  private loadingBar!: Phaser.GameObjects.Graphics;
  private loadingBox!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: GameConfig.SCENES.PRELOAD });
  }

  preload(): void {
    this.createLoadingScreen();
    this.setupLoadingEvents();
    this.loadAssets();
  }

  private createLoadingScreen(): void {
    const { width, height } = this.cameras.main;

    // Loading box background
    this.loadingBox = this.add.graphics();
    this.loadingBox.fillStyle(0x222222);
    this.loadingBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 5);

    // Loading bar
    this.loadingBar = this.add.graphics();

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2 - 80, 'Loading Rhythm Runner...', {
      fontSize: '24px',
      color: GameConfig.COLORS.TEXT_PRIMARY,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    // Progress percentage text
    this.progressText = this.add.text(width / 2, height / 2 + 50, '0%', {
      fontSize: '18px',
      color: GameConfig.COLORS.TEXT_SECONDARY,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);

    // Game title and flavor text
    this.add.text(width / 2, height / 4, 'Rhythm Runner', {
      fontSize: '48px',
      color: GameConfig.COLORS.PRIMARY,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 4 + 60, 'Musical Adventure Game', {
      fontSize: '20px',
      color: GameConfig.COLORS.TEXT_SECONDARY,
      fontFamily: 'Arial, sans-serif',
    }).setOrigin(0.5);
  }

  private setupLoadingEvents(): void {
    // Update loading bar progress
    this.load.on('progress', (value: number) => {
      const { width, height } = this.cameras.main;
      
      this.loadingBar.clear();
      this.loadingBar.fillStyle(0x6B46C1);
      this.loadingBar.fillRoundedRect(
        width / 2 - 150,
        height / 2 - 15,
        300 * value,
        30,
        5
      );

      this.progressText.setText(`${Math.round(value * 100)}%`);
    });

    // Show file loading progress
    this.load.on('fileprogress', (file: any) => {
      this.loadingText.setText(`Loading: ${file.key}`);
    });

    // Loading complete
    this.load.on('complete', () => {
      this.loadingText.setText('Ready to play!');
      this.time.delayedCall(500, () => {
        this.scene.start(GameConfig.SCENES.MAIN_MENU);
      });
    });
  }

  private loadAssets(): void {
    // Set base URL for assets
    this.load.setBaseURL('assets/');

    // Load audio assets
    this.load.audio('demo-track', 'audio/demo-track.ogg');
    this.load.audio('menu-music', 'audio/menu-music.ogg');
    this.load.audio('jump-sound', 'audio/jump.ogg');
    this.load.audio('beat-hit', 'audio/beat-hit.ogg');
    this.load.audio('perfect-hit', 'audio/perfect-hit.ogg');
    this.load.audio('collect-note', 'audio/collect-note.ogg');

    // Load image assets
    this.load.image('background', 'images/background.png');
    this.load.image('player-idle', 'images/player-idle.png');
    this.load.image('player-jump', 'images/player-jump.png');
    this.load.image('platform', 'images/platform.png');
    this.load.image('obstacle', 'images/obstacle.png');
    this.load.image('note-collectible', 'images/note-collectible.png');
    this.load.image('particle', 'images/particle.png');

    // Load sprite sheets for animations
    this.load.spritesheet('player-run', 'images/player-run.png', {
      frameWidth: 80,
      frameHeight: 80,
    });

    this.load.spritesheet('obstacle-pulse', 'images/obstacle-pulse.png', {
      frameWidth: 60,
      frameHeight: 60,
    });

    // Load UI assets
    this.load.image('button-play', 'images/ui/button-play.png');
    this.load.image('button-pause', 'images/ui/button-pause.png');
    this.load.image('button-menu', 'images/ui/button-menu.png');
    this.load.image('harmony-bar', 'images/ui/harmony-bar.png');
    this.load.image('tempo-dial', 'images/ui/tempo-dial.png');

    // Load level data
    this.load.json('demo-level-1', 'levels/demo-level-1.json');
    this.load.json('demo-level-2', 'levels/demo-level-2.json');
    this.load.json('demo-level-3', 'levels/demo-level-3.json');

    // Load fonts (optional - will use fallback if not available)
    try {
      // Uncomment when rexWebFont plugin is available
      // this.load.rexWebFont({
      //   google: {
      //     families: ['Orbitron:400,700', 'Rajdhani:400,600']
      //   }
      // });
    } catch (error) {
      console.log('Web fonts plugin not available, using system fonts');
    }
  }

  create(): void {
    console.log('PreloadScene: Assets loaded successfully');
    
    // Create animations for later use
    this.createAnimations();
  }

  private createAnimations(): void {
    // Player running animation
    if (!this.anims.exists('player-run')) {
      this.anims.create({
        key: 'player-run',
        frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1,
      });
    }

    // Obstacle pulsing animation
    if (!this.anims.exists('obstacle-pulse')) {
      this.anims.create({
        key: 'obstacle-pulse',
        frames: this.anims.generateFrameNumbers('obstacle-pulse', { start: 0, end: 3 }),
        frameRate: 8,
        repeat: -1,
      });
    }
  }
}