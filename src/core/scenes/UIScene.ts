import * as Phaser from 'phaser';
import { GameConfig } from '@/core/GameConfig';

/**
 * UIScene - Game UI overlay
 * Handles HUD, controls, and game status display
 */
export class UIScene extends Phaser.Scene {
  // UI elements
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private harmonyBar!: Phaser.GameObjects.Graphics;
  private harmonyBarBg!: Phaser.GameObjects.Graphics;
  private tempoIndicator!: Phaser.GameObjects.Graphics;
  private beatIndicator!: Phaser.GameObjects.Graphics;
  
  // Control buttons
  private pauseButton!: Phaser.GameObjects.Image;
  private menuButton!: Phaser.GameObjects.Image;
  
  // Current game data
  private gameData = {
    score: 0,
    combo: 0,
    harmonyEnergy: 100,
    currentTempo: 1.0,
    currentBeat: 0,
  };

  constructor() {
    super({ key: GameConfig.SCENES.UI });
  }

  create(): void {
    console.log('UIScene: Creating UI overlay...');
    
    this.createHUD();
    this.createControlButtons();
    this.createHarmonyEnergyBar();
    this.createTempoIndicator();
    this.createBeatIndicator();
    this.setupEventListeners();
  }

  private createHUD(): void {
    const { width } = this.cameras.main;
    const padding = 40;

    // Score display
    this.scoreText = this.add.text(padding, padding, 'SCORE: 0', {
      fontSize: '28px',
      color: GameConfig.COLORS.TEXT_PRIMARY,
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: GameConfig.COLORS.BACKGROUND_DARK,
      strokeThickness: 2,
    });

    // Combo display
    this.comboText = this.add.text(padding, padding + 50, 'COMBO: 0', {
      fontSize: '24px',
      color: GameConfig.COLORS.ACCENT,
      fontFamily: 'Rajdhani, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: GameConfig.COLORS.BACKGROUND_DARK,
      strokeThickness: 2,
    });

    // Game title in corner
    const titleCorner = this.add.text(width - padding, padding, 'RHYTHM RUNNER', {
      fontSize: '20px',
      color: GameConfig.COLORS.PRIMARY,
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(1, 0);
    titleCorner.alpha = 0.7;
  }

  private createControlButtons(): void {
    const { width, height } = this.cameras.main;
    const buttonSize = 60;
    const padding = 30;

    // Pause button
    this.pauseButton = this.add.image(
      width - padding - buttonSize,
      height - padding - buttonSize,
      'button-pause'
    ).setDisplaySize(buttonSize, buttonSize)
     .setInteractive()
     .setAlpha(0.8);

    this.pauseButton.on('pointerdown', () => {
      this.pauseGame();
    });

    // Menu button  
    this.menuButton = this.add.image(
      width - padding - buttonSize * 2 - 20,
      height - padding - buttonSize,
      'button-menu'
    ).setDisplaySize(buttonSize, buttonSize)
     .setInteractive()
     .setAlpha(0.8);

    this.menuButton.on('pointerdown', () => {
      this.returnToMenu();
    });

    // Button hover effects
    [this.pauseButton, this.menuButton].forEach(button => {
      button.on('pointerover', () => {
        this.tweens.add({
          targets: button,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
        });
      });

      button.on('pointerout', () => {
        this.tweens.add({
          targets: button,
          scaleX: 1,
          scaleY: 1,
          duration: 150,
        });
      });
    });
  }

  private createHarmonyEnergyBar(): void {
    const { width } = this.cameras.main;
    const barWidth = 300;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    const barY = 40;

    // Background
    this.harmonyBarBg = this.add.graphics();
    this.harmonyBarBg.fillStyle(0x333333, 0.8);
    this.harmonyBarBg.fillRoundedRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 10);
    this.harmonyBarBg.lineStyle(2, parseInt(GameConfig.COLORS.PRIMARY.replace('#', ''), 16), 0.8);
    this.harmonyBarBg.strokeRoundedRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 10);

    // Energy bar
    this.harmonyBar = this.add.graphics();

    // Label
    this.add.text(barX, barY - 30, 'HARMONY ENERGY', {
      fontSize: '16px',
      color: GameConfig.COLORS.TEXT_SECONDARY,
      fontFamily: 'Rajdhani, Arial, sans-serif',
      fontStyle: 'bold',
    });
  }

  private createTempoIndicator(): void {
    const { height } = this.cameras.main;
    const indicatorX = 80;
    const indicatorY = height - 120;

    // Tempo dial background
    this.tempoIndicator = this.add.graphics();
    
    // Tempo label
    this.add.text(indicatorX, indicatorY - 40, 'TEMPO', {
      fontSize: '16px',
      color: GameConfig.COLORS.TEXT_SECONDARY,
      fontFamily: 'Rajdhani, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private createBeatIndicator(): void {
    const { width } = this.cameras.main;
    const indicatorX = width - 100;
    const indicatorY = 150;

    // Beat pulse indicator
    this.beatIndicator = this.add.graphics();
    
    // Beat label
    this.add.text(indicatorX, indicatorY - 40, 'BEAT', {
      fontSize: '16px',
      color: GameConfig.COLORS.TEXT_SECONDARY,
      fontFamily: 'Rajdhani, Arial, sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private setupEventListeners(): void {
    // Listen for game data updates
    this.events.on('updateGameData', this.updateGameData.bind(this));
    
    // Listen for game scene events
    const gameScene = this.scene.get(GameConfig.SCENES.GAME);
    if (gameScene) {
      gameScene.events.on('beat', this.onBeat.bind(this));
      gameScene.events.on('tempoChange', this.onTempoChange.bind(this));
    }
  }

  private updateGameData(data: any): void {
    this.gameData = { ...this.gameData, ...data };
    
    // Update score
    this.scoreText.setText(`SCORE: ${this.gameData.score.toLocaleString()}`);
    
    // Update combo with color coding
    const comboColor = this.gameData.combo > 10 
      ? GameConfig.COLORS.SUCCESS 
      : this.gameData.combo > 5 
        ? GameConfig.COLORS.WARNING 
        : GameConfig.COLORS.ACCENT;
    
    this.comboText.setText(`COMBO: ${this.gameData.combo}`)
                  .setColor(comboColor);
    
    // Update harmony energy bar
    this.updateHarmonyBar();
    
    // Update tempo indicator
    this.updateTempoIndicator();
  }

  private updateHarmonyBar(): void {
    const { width } = this.cameras.main;
    const barWidth = 300;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    const barY = 40;
    
    const energyPercent = this.gameData.harmonyEnergy / GameConfig.MAX_HARMONY_ENERGY;
    const energyWidth = barWidth * energyPercent;
    
    // Clear and redraw
    this.harmonyBar.clear();
    
    // Determine color based on energy level
    let barColor = parseInt(GameConfig.COLORS.SUCCESS.replace('#', ''), 16);
    if (energyPercent < 0.3) {
      barColor = parseInt(GameConfig.COLORS.ERROR.replace('#', ''), 16);
    } else if (energyPercent < 0.6) {
      barColor = parseInt(GameConfig.COLORS.WARNING.replace('#', ''), 16);
    }
    
    this.harmonyBar.fillStyle(barColor, 0.8);
    this.harmonyBar.fillRoundedRect(barX, barY, energyWidth, barHeight, 10);
    
    // Add glow effect when energy is low
    if (energyPercent < 0.2) {
      this.harmonyBar.lineStyle(4, barColor, 0.6);
      this.harmonyBar.strokeRoundedRect(barX, barY, energyWidth, barHeight, 10);
    }
  }

  private updateTempoIndicator(): void {
    const indicatorX = 80;
    const indicatorY = this.cameras.main.height - 120;
    const radius = 30;
    
    this.tempoIndicator.clear();
    
    // Draw tempo dial
    this.tempoIndicator.lineStyle(4, parseInt(GameConfig.COLORS.SECONDARY.replace('#', ''), 16));
    this.tempoIndicator.strokeCircle(indicatorX, indicatorY, radius);
    
    // Draw tempo indicator needle
    const tempoNormalized = (this.gameData.currentTempo - GameConfig.MIN_TEMPO) / 
                           (GameConfig.MAX_TEMPO - GameConfig.MIN_TEMPO);
    const angle = (tempoNormalized * Math.PI) - (Math.PI / 2);
    const needleX = indicatorX + Math.cos(angle) * (radius - 5);
    const needleY = indicatorY + Math.sin(angle) * (radius - 5);
    
    this.tempoIndicator.lineStyle(3, parseInt(GameConfig.COLORS.ACCENT.replace('#', ''), 16));
    this.tempoIndicator.lineBetween(indicatorX, indicatorY, needleX, needleY);
    
    // Draw center dot
    this.tempoIndicator.fillStyle(parseInt(GameConfig.COLORS.ACCENT.replace('#', ''), 16));
    this.tempoIndicator.fillCircle(indicatorX, indicatorY, 4);
    
    // Add tempo text
    const tempoText = `${this.gameData.currentTempo.toFixed(1)}x`;
    const existingText = this.children.getByName('tempoText') as Phaser.GameObjects.Text;
    if (existingText) {
      existingText.setText(tempoText);
    } else {
      this.add.text(indicatorX, indicatorY + radius + 20, tempoText, {
        fontSize: '14px',
        color: GameConfig.COLORS.TEXT_PRIMARY,
        fontFamily: 'Rajdhani, Arial, sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5).setName('tempoText');
    }
  }

  private onBeat(_beatNumber: number): void {
    // Animate beat indicator
    const indicatorX = this.cameras.main.width - 100;
    const indicatorY = 150;
    const radius = 20;
    
    this.beatIndicator.clear();
    this.beatIndicator.fillStyle(parseInt(GameConfig.COLORS.PRIMARY.replace('#', ''), 16), 1);
    this.beatIndicator.fillCircle(indicatorX, indicatorY, radius);
    
    // Pulse animation
    this.tweens.add({
      targets: this.beatIndicator,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: GameConfig.BEAT_FLASH_DURATION,
      ease: 'Power2',
      onComplete: () => {
        this.beatIndicator.clear();
        this.beatIndicator.fillStyle(parseInt(GameConfig.COLORS.PRIMARY.replace('#', ''), 16), 0.3);
        this.beatIndicator.fillCircle(indicatorX, indicatorY, radius);
        this.beatIndicator.setScale(1).setAlpha(1);
      }
    });
  }

  private onTempoChange(newTempo: number): void {
    this.gameData.currentTempo = newTempo;
    this.updateTempoIndicator();
  }

  private pauseGame(): void {
    console.log('Pausing game...');
    const gameScene = this.scene.get(GameConfig.SCENES.GAME) as any;
    if (gameScene && gameScene.pauseGame) {
      gameScene.pauseGame();
    }
    
    // Show pause overlay
    this.showPauseOverlay();
  }

  private showPauseOverlay(): void {
    const { width, height } = this.cameras.main;
    
    // Semi-transparent overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    
    // Pause text
    const pauseText = this.add.text(width / 2, height / 2, 'PAUSED', {
      fontSize: '72px',
      color: GameConfig.COLORS.TEXT_PRIMARY,
      fontFamily: 'Orbitron, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: GameConfig.COLORS.BACKGROUND_DARK,
      strokeThickness: 4,
    }).setOrigin(0.5);
    
    // Resume instruction
    this.add.text(width / 2, height / 2 + 100, 'Tap to Resume', {
      fontSize: '24px',
      color: GameConfig.COLORS.TEXT_SECONDARY,
      fontFamily: 'Rajdhani, Arial, sans-serif',
    }).setOrigin(0.5);
    
    // Resume on tap
    overlay.setInteractive();
    overlay.on('pointerdown', () => {
      overlay.destroy();
      pauseText.destroy();
      this.resumeGame();
    });
  }

  private resumeGame(): void {
    const gameScene = this.scene.get(GameConfig.SCENES.GAME) as any;
    if (gameScene && gameScene.resumeGame) {
      gameScene.resumeGame();
    }
  }

  private returnToMenu(): void {
    console.log('Returning to main menu...');
    
    // Stop the game
    this.scene.stop(GameConfig.SCENES.GAME);
    this.scene.stop();
    
    // Return to main menu
    this.scene.start(GameConfig.SCENES.MAIN_MENU);
  }
}