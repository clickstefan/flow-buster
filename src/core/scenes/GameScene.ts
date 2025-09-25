import * as Phaser from 'phaser';
import { GameConfig } from '@/core/GameConfig';
import { AudioManager } from '@/audio/AudioManager';
import { PlayerManager } from '@/game/PlayerManager';
import { ObstacleManager } from '@/game/ObstacleManager';
import { InputManager } from '@/game/InputManager';
import { GameStateManager } from '@/game/GameStateManager';

/**
 * GameScene - Main gameplay scene
 * Handles core game loop, player movement, obstacles, and audio sync
 */
export class GameScene extends Phaser.Scene {
  // Core managers
  private audioManager!: AudioManager;
  private playerManager!: PlayerManager;
  private obstacleManager!: ObstacleManager;
  private inputManager!: InputManager;
  private gameStateManager!: GameStateManager;

  // Game objects
  private background!: Phaser.GameObjects.TileSprite;
  private platforms: Phaser.GameObjects.Graphics[] = [];
  
  // Game state
  private isGameActive = false;
  private currentBeat = 0;
  private score = 0;
  private combo = 0;
  private harmonyEnergy = GameConfig.MAX_HARMONY_ENERGY;

  constructor() {
    super({ key: GameConfig.SCENES.GAME });
  }

  create(): void {
    console.log('GameScene: Starting game...');
    
    this.createGameWorld();
    this.initializeManagers();
    this.setupGameSystems();
    this.startGame();
  }

  private createGameWorld(): void {
    const { width, height } = this.cameras.main;

    // Scrolling background
    this.background = this.add.tileSprite(
      0, 0,
      width, height,
      'background'
    ).setOrigin(0, 0);

    // Create the three platforms
    this.createPlatforms();
  }

  private createPlatforms(): void {
    const { width, height } = this.cameras.main;
    const platformHeight = GameConfig.PLATFORM_HEIGHT;
    const platformY = [
      height - platformHeight,     // Bottom platform (Bass)
      height - platformHeight * 2, // Middle platform (Rhythm)  
      height - platformHeight * 3, // Top platform (Melody)
    ];

    const colors = [
      GameConfig.COLORS.PLATFORM_BOTTOM,
      GameConfig.COLORS.PLATFORM_MIDDLE,
      GameConfig.COLORS.PLATFORM_TOP,
    ];

    for (let i = 0; i < GameConfig.PLATFORM_COUNT; i++) {
      const platform = this.add.graphics();
      platform.fillStyle(parseInt(colors[i].replace('#', ''), 16), 0.6);
      platform.fillRect(0, platformY[i], width, platformHeight);
      
      // Add platform glow effect
      platform.lineStyle(4, parseInt(colors[i].replace('#', ''), 16), 0.8);
      platform.strokeRect(0, platformY[i], width, 4);
      
      this.platforms.push(platform);
    }
  }

  private initializeManagers(): void {
    // Initialize audio system
    this.audioManager = new AudioManager(this);
    
    // Initialize player
    this.playerManager = new PlayerManager(this);
    
    // Initialize obstacles
    this.obstacleManager = new ObstacleManager(this);
    
    // Initialize input system
    this.inputManager = new InputManager(this);
    
    // Initialize game state
    this.gameStateManager = new GameStateManager(this);

    // Connect systems
    this.connectManagers();
  }

  private connectManagers(): void {
    // Connect audio events to game systems
    this.audioManager.on('beat', this.onBeat.bind(this));
    this.audioManager.on('tempoChange', this.onTempoChange.bind(this));
    
    // Connect input events
    this.inputManager.on('jump', this.onJump.bind(this));
    this.inputManager.on('switchPlatform', this.onSwitchPlatform.bind(this));
    this.inputManager.on('tempoControl', this.onTempoControl.bind(this));
    
    // Connect obstacle events
    this.obstacleManager.on('obstacleHit', this.onObstacleHit.bind(this));
    this.obstacleManager.on('obstacleMissed', this.onObstacleMissed.bind(this));
    
    // Connect player events
    this.playerManager.on('platformChanged', this.onPlatformChanged.bind(this));
  }

  private setupGameSystems(): void {
    // Load and prepare audio
    this.audioManager.loadTrack('demo-track');
    
    // Set up UI scene overlay
    this.scene.launch(GameConfig.SCENES.UI);
    
    // Set up physics world boundaries
    this.physics.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
  }

  private startGame(): void {
    console.log('Game starting...');
    
    this.isGameActive = true;
    this.audioManager.startTrack();
    
    // Start UI updates
    this.time.addEvent({
      delay: 16, // ~60fps updates
      callback: this.updateUI,
      callbackScope: this,
      loop: true,
    });
  }

  update(_time: number, delta: number): void {
    if (!this.isGameActive) return;

    // Update all managers
    this.audioManager.update(delta);
    this.playerManager.update(delta);
    this.obstacleManager.update(delta);
    this.gameStateManager.update(delta);

    // Update visual effects
    this.updateBackground(delta);
    this.updatePlatformEffects();
    
    // Update harmony energy
    this.updateHarmonyEnergy(delta);
  }

  private updateBackground(delta: number): void {
    // Scroll background based on game speed
    const scrollSpeed = GameConfig.PLAYER_SPEED * this.audioManager.getCurrentTempo();
    this.background.tilePositionX += (scrollSpeed * delta) / 1000;
  }

  private updatePlatformEffects(): void {
    // Update platform visual effects based on audio
    const audioData = this.audioManager.getAudioData();
    if (audioData) {
      this.platforms.forEach((platform, index) => {
        const intensity = audioData.frequencyBins[index] || 0;
        platform.alpha = 0.6 + (intensity * 0.4);
      });
    }
  }

  private updateHarmonyEnergy(delta: number): void {
    const currentTempo = this.audioManager.getCurrentTempo();
    
    if (currentTempo < GameConfig.DEFAULT_TEMPO) {
      // Drain energy when slowing down
      const drainRate = GameConfig.HARMONY_DRAIN_RATE_SLOW * (GameConfig.DEFAULT_TEMPO - currentTempo);
      this.harmonyEnergy = Math.max(0, this.harmonyEnergy - (drainRate * delta / 1000));
    } else if (currentTempo === GameConfig.DEFAULT_TEMPO) {
      // Restore energy at normal speed
      this.harmonyEnergy = Math.min(
        GameConfig.MAX_HARMONY_ENERGY,
        this.harmonyEnergy + (GameConfig.HARMONY_RESTORE_RATE * delta / 1000)
      );
    }
  }

  private updateUI(): void {
    // Send UI updates to UI scene
    this.scene.get(GameConfig.SCENES.UI)?.events.emit('updateGameData', {
      score: this.score,
      combo: this.combo,
      harmonyEnergy: this.harmonyEnergy,
      currentTempo: this.audioManager.getCurrentTempo(),
      currentBeat: this.currentBeat,
    });
  }

  // Event handlers
  private onBeat(beatNumber: number): void {
    this.currentBeat = beatNumber;
    
    // Flash platform effects on beat
    this.platforms.forEach(platform => {
      this.tweens.add({
        targets: platform,
        alpha: 1,
        duration: GameConfig.BEAT_FLASH_DURATION,
        yoyo: true,
        ease: 'Power2',
      });
    });

    // Spawn obstacles based on beat
    this.obstacleManager.onBeat(beatNumber);
  }

  private onTempoChange(newTempo: number): void {
    console.log(`Tempo changed to ${newTempo}x`);
    this.obstacleManager.setTempo(newTempo);
  }

  private onJump(): void {
    this.playerManager.jump();
  }

  private onSwitchPlatform(direction: 'up' | 'down'): void {
    this.playerManager.switchPlatform(direction);
  }

  private onTempoControl(direction: 'slow' | 'fast' | 'normal'): void {
    if (this.harmonyEnergy <= 0 && direction !== 'normal') {
      // Not enough energy for tempo control
      return;
    }

    let targetTempo = GameConfig.DEFAULT_TEMPO;
    
    switch (direction) {
      case 'slow':
        targetTempo = GameConfig.MIN_TEMPO;
        break;
      case 'fast':
        targetTempo = GameConfig.MAX_TEMPO;
        break;
      case 'normal':
        targetTempo = GameConfig.DEFAULT_TEMPO;
        break;
    }

    this.audioManager.setTempo(targetTempo);
  }

  private onObstacleHit(timing: 'perfect' | 'good' | 'miss'): void {
    switch (timing) {
      case 'perfect':
        this.score += GameConfig.PERFECT_HIT_SCORE * this.getComboMultiplier();
        this.harmonyEnergy = Math.min(
          GameConfig.MAX_HARMONY_ENERGY,
          this.harmonyEnergy + GameConfig.HARMONY_PERFECT_BEAT_BONUS
        );
        this.combo++;
        break;
      case 'good':
        this.score += GameConfig.GOOD_HIT_SCORE * this.getComboMultiplier();
        this.harmonyEnergy = Math.min(
          GameConfig.MAX_HARMONY_ENERGY,
          this.harmonyEnergy + GameConfig.HARMONY_GOOD_BEAT_BONUS
        );
        this.combo++;
        break;
      case 'miss':
        this.score = Math.max(0, this.score + GameConfig.MISS_PENALTY);
        this.combo = 0;
        break;
    }

    // Visual feedback
    this.showHitFeedback(timing);
  }

  private onObstacleMissed(): void {
    this.combo = 0;
  }

  private onPlatformChanged(newPlatform: number): void {
    console.log(`Player switched to platform ${newPlatform}`);
  }

  private getComboMultiplier(): number {
    return Math.min(
      GameConfig.MAX_COMBO_MULTIPLIER,
      1 + (this.combo * (GameConfig.COMBO_MULTIPLIER - 1))
    );
  }

  private showHitFeedback(timing: 'perfect' | 'good' | 'miss'): void {
    const { width, height } = this.cameras.main;
    const colors = {
      perfect: GameConfig.COLORS.SUCCESS,
      good: GameConfig.COLORS.WARNING,
      miss: GameConfig.COLORS.ERROR,
    };
    
    const text = this.add.text(
      width / 2,
      height / 3,
      timing.toUpperCase(),
      {
        fontSize: '48px',
        color: colors[timing],
        fontFamily: 'Orbitron, Arial, sans-serif',
        fontStyle: 'bold',
        stroke: GameConfig.COLORS.BACKGROUND_DARK,
        strokeThickness: 4,
      }
    ).setOrigin(0.5);

    // Animate feedback
    this.tweens.add({
      targets: text,
      scaleX: 1.2,
      scaleY: 1.2,
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });
  }

  // Public methods for external access
  public pauseGame(): void {
    this.isGameActive = false;
    this.audioManager.pauseTrack();
    this.scene.pause();
  }

  public resumeGame(): void {
    this.isGameActive = true;
    this.audioManager.resumeTrack();
    this.scene.resume();
  }

  public getGameData() {
    return {
      score: this.score,
      combo: this.combo,
      harmonyEnergy: this.harmonyEnergy,
      currentTempo: this.audioManager.getCurrentTempo(),
      isActive: this.isGameActive,
    };
  }
}