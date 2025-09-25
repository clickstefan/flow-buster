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

    // Create procedural assets for missing files
    this.createProceduralAssets();

    // Load level data
    this.load.json('demo-level-1', 'levels/demo-level-1.json');
    this.load.json('demo-level-2', 'levels/demo-level-2.json');
    this.load.json('demo-level-3', 'levels/demo-level-3.json');

    // Set up error handling for missing assets
    this.load.on('filecomplete', (key: string) => {
      console.log(`✓ Loaded: ${key}`);
    });

    this.load.on('loaderror', (file: any) => {
      console.log(`! Asset not found: ${file.key}, using procedural fallback`);
    });
  }

  private createProceduralAssets(): void {
    // Create simple colored rectangles as textures
    const graphics = this.add.graphics();
    
    // Background
    graphics.fillStyle(0x1a1a2e);
    graphics.fillRect(0, 0, 1920, 1080);
    graphics.generateTexture('background', 1920, 1080);
    
    // Player textures
    graphics.clear();
    graphics.fillStyle(0x6B46C1);
    graphics.fillCircle(40, 25, 15); // Head
    graphics.fillRect(25, 40, 30, 40); // Body
    graphics.generateTexture('player-idle', 80, 80);
    
    graphics.clear();
    graphics.fillStyle(0x8B5CF6);
    graphics.fillCircle(40, 20, 15); // Head (jumping)
    graphics.fillRect(25, 35, 30, 45); // Body
    graphics.generateTexture('player-jump', 80, 80);
    
    // Create multi-frame player-run sprite
    graphics.clear();
    graphics.fillStyle(0x7C3AED);
    for (let i = 0; i < 8; i++) {
      const x = i * 80;
      graphics.fillCircle(x + 40, 25, 15);
      graphics.fillRect(x + 25, 40, 30, 40);
    }
    graphics.generateTexture('player-run', 640, 80);
    
    // Platform
    graphics.clear();
    graphics.fillStyle(0x4B5563);
    graphics.fillRect(0, 0, 200, 50);
    graphics.generateTexture('platform', 200, 50);
    
    // Obstacle
    graphics.clear();
    graphics.fillStyle(0xEF4444);
    graphics.fillRect(0, 0, 60, 60);
    graphics.generateTexture('obstacle', 60, 60);
    
    // Multi-frame obstacle pulse
    graphics.clear();
    for (let i = 0; i < 4; i++) {
      const x = i * 60;
      const intensity = 0xEF4444 + (i * 0x101010);
      graphics.fillStyle(intensity);
      graphics.fillRect(x, 0, 60, 60);
    }
    graphics.generateTexture('obstacle-pulse', 240, 60);
    
    // Note collectible
    graphics.clear();
    graphics.fillStyle(0xF59E0B);
    graphics.fillCircle(15, 15, 12);
    graphics.generateTexture('note-collectible', 30, 30);
    
    // Particle
    graphics.clear();
    graphics.fillStyle(0xFFFFFF);
    graphics.fillCircle(5, 5, 4);
    graphics.generateTexture('particle', 10, 10);
    
    // UI Buttons
    graphics.clear();
    graphics.fillStyle(0x10B981);
    graphics.fillRoundedRect(0, 0, 240, 60, 10);
    graphics.generateTexture('button-play', 240, 60);
    
    graphics.clear();
    graphics.fillStyle(0xF59E0B);
    graphics.fillRoundedRect(0, 0, 60, 60, 10);
    graphics.generateTexture('button-pause', 60, 60);
    
    graphics.clear();
    graphics.fillStyle(0x6B7280);
    graphics.fillRoundedRect(0, 0, 60, 60, 10);
    graphics.generateTexture('button-menu', 60, 60);
    
    // Harmony bar
    graphics.clear();
    graphics.fillStyle(0x059669);
    graphics.fillRect(0, 0, 300, 20);
    graphics.generateTexture('harmony-bar', 300, 20);
    
    // Tempo dial
    graphics.clear();
    graphics.fillStyle(0xEC4899);
    graphics.fillCircle(40, 40, 35);
    graphics.generateTexture('tempo-dial', 80, 80);
    
    // Clean up
    graphics.destroy();
    
    console.log('✓ Created procedural textures for all game assets');
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