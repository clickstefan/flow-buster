import * as Phaser from 'phaser';
import { GameConfig } from '@/core/GameConfig';

/**
 * MainMenuScene - Game's main menu
 * Provides navigation to game modes and settings
 */
export class MainMenuScene extends Phaser.Scene {
  private menuMusic!: Phaser.Sound.BaseSound;
  private titleText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: GameConfig.SCENES.MAIN_MENU });
  }

  create(): void {
    this.createBackground();
    this.createTitle();
    this.createMenuButtons();
    this.startBackgroundMusic();
    this.setupInputHandlers();
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main;

    // Gradient background
    const bgGraphics = this.add.graphics();
    bgGraphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    bgGraphics.fillRect(0, 0, width, height);

    // Animated background elements
    this.createFloatingNotes();
  }

  private createFloatingNotes(): void {
    const { width, height } = this.cameras.main;

    // Create floating musical notes for atmosphere
    for (let i = 0; i < 8; i++) {
      const note = this.add.text(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        '♪',
        {
          fontSize: `${Phaser.Math.Between(20, 40)}px`,
          color: GameConfig.COLORS.PRIMARY,
        }
      );
      note.alpha = 0.3;

      // Animate floating
      this.tweens.add({
        targets: note,
        y: note.y - 100,
        alpha: 0,
        duration: Phaser.Math.Between(3000, 6000),
        ease: 'Power2',
        repeat: -1,
        yoyo: false,
        onRepeat: () => {
          note.setPosition(
            Phaser.Math.Between(0, width),
            height + 50
          );
          note.alpha = 0.3;
        },
      });
    }
  }

  private createTitle(): void {
    const { width, height } = this.cameras.main;

    // Main title
    this.titleText = this.add.text(width / 2, height * 0.25, 'Rhythm Runner', {
      fontSize: '72px',
      color: GameConfig.COLORS.PRIMARY,
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: GameConfig.COLORS.BACKGROUND_DARK,
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle with typing effect
    const subtitle = this.add.text(
      width / 2,
      height * 0.35,
      'Musical Adventure Awaits',
      {
        fontSize: '24px',
        color: GameConfig.COLORS.TEXT_SECONDARY,
        fontFamily: 'Rajdhani, Arial, sans-serif',
      }
    ).setOrigin(0.5).setAlpha(0);

    // Animate title entrance
    this.tweens.add({
      targets: this.titleText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 2000,
      ease: 'Power2',
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: subtitle,
      alpha: 1,
      duration: 1000,
      delay: 500,
      ease: 'Power2',
    });
  }

  private createMenuButtons(): void {
    const { width, height } = this.cameras.main;
    const buttonY = height * 0.6;
    const buttonSpacing = 100;

    // Play button
    this.createButton(
      width / 2,
      buttonY,
      'PLAY',
      GameConfig.COLORS.PRIMARY,
      () => this.startGame()
    );

    // Level Editor button
    this.createButton(
      width / 2,
      buttonY + buttonSpacing,
      'LEVEL EDITOR',
      GameConfig.COLORS.SECONDARY,
      () => this.openLevelEditor()
    );

    // Settings button
    this.createButton(
      width / 2,
      buttonY + buttonSpacing * 2,
      'SETTINGS',
      GameConfig.COLORS.ACCENT,
      () => this.openSettings()
    );

    // Version info
    this.add.text(
      width - 20,
      height - 20,
      'v0.1.0 - Alpha',
      {
        fontSize: '14px',
        color: GameConfig.COLORS.TEXT_SECONDARY,
        fontFamily: 'Arial, sans-serif',
      }
    ).setOrigin(1);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    color: string,
    callback: () => void
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    // Button background
    const bg = this.add.graphics();
    bg.fillStyle(parseInt(color.replace('#', ''), 16), 0.8);
    bg.fillRoundedRect(-120, -30, 240, 60, 10);
    bg.lineStyle(2, parseInt(color.replace('#', ''), 16));
    bg.strokeRoundedRect(-120, -30, 240, 60, 10);

    // Button text
    const buttonText = this.add.text(0, 0, text, {
      fontSize: '24px',
      color: GameConfig.COLORS.TEXT_PRIMARY,
      fontFamily: 'Rajdhani, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    container.add([bg, buttonText]);
    container.setSize(240, 60);
    container.setInteractive();

    // Button interactions
    container.on('pointerover', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 150,
        ease: 'Power2',
      });
    });

    container.on('pointerout', () => {
      this.tweens.add({
        targets: container,
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Power2',
      });
    });

    container.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        ease: 'Power2',
        yoyo: true,
        onComplete: callback,
      });
    });

    return container;
  }

  private startBackgroundMusic(): void {
    if (this.sound.get('menu-music')) {
      this.menuMusic = this.sound.add('menu-music', {
        volume: 0.3,
        loop: true,
      });
      this.menuMusic.play();
    } else {
      console.warn('Menu music not loaded');
    }
  }

  private setupInputHandlers(): void {
    // Keyboard shortcuts
    this.input.keyboard?.addKey('SPACE').on('down', () => {
      this.startGame();
    });

    this.input.keyboard?.addKey('ESC').on('down', () => {
      // Could add quit confirmation
    });
  }

  private startGame(): void {
    console.log('Starting game...');
    
    // Stop menu music
    if (this.menuMusic) {
      this.menuMusic.stop();
    }

    // Transition to game
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(500, () => {
      this.scene.start(GameConfig.SCENES.GAME);
    });
  }

  private openLevelEditor(): void {
    console.log('Opening level editor...');
    // TODO: Implement level editor scene
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.8,
      'Level Editor - Coming Soon!',
      {
        fontSize: '20px',
        color: GameConfig.COLORS.WARNING,
        fontFamily: 'Arial, sans-serif',
      }
    ).setOrigin(0.5);
  }

  private openSettings(): void {
    console.log('Opening settings...');
    // TODO: Implement settings menu
    this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.9,
      'Settings - Coming Soon!',
      {
        fontSize: '20px',
        color: GameConfig.COLORS.WARNING,
        fontFamily: 'Arial, sans-serif',
      }
    ).setOrigin(0.5);
  }
}