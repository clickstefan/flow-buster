import * as Phaser from 'phaser';
import { GameConfig } from '@/core/GameConfig';

/**
 * PlayerManager - Handles player character movement and state
 * Manages jumping, platform switching, and player physics
 */
export class PlayerManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private player!: Phaser.Physics.Arcade.Sprite;
  
  // Platform system
  private currentPlatform = 0; // 0 = bottom, 1 = middle, 2 = top
  private platformPositions: number[] = [];
  
  // Movement state
  private isJumping = false;
  private canSwitchPlatform = false;
  
  // Visual effects
  private playerTrail!: Phaser.GameObjects.Particles.ParticleEmitter;
  private jumpParticles!: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.calculatePlatformPositions();
    this.createPlayer();
    this.setupAnimations();
    this.setupParticleEffects();
  }

  private calculatePlatformPositions(): void {
    const { height } = this.scene.cameras.main;
    const platformHeight = GameConfig.PLATFORM_HEIGHT;
    
    // Calculate Y positions for each platform (centered on platform)
    this.platformPositions = [
      height - platformHeight / 2,     // Bottom platform
      height - platformHeight * 1.5,  // Middle platform
      height - platformHeight * 2.5,  // Top platform
    ];
  }

  private createPlayer(): void {
    const startX = 200; // Player starts on left side
    const startY = this.platformPositions[this.currentPlatform];
    
    // Create player sprite with physics
    this.player = this.scene.physics.add.sprite(startX, startY, 'player-idle');
    this.player.setDisplaySize(GameConfig.PLAYER_SIZE, GameConfig.PLAYER_SIZE);
    this.player.setCollideWorldBounds(false); // Allow vertical movement between platforms
    
    // Set up physics
    this.player.setBounce(0.2);
    this.player.setDragX(100); // Slight air resistance
    this.player.setMaxVelocity(GameConfig.PLAYER_SPEED, 2000);
    
    // Set player to auto-run forward
    this.player.setVelocityX(GameConfig.PLAYER_SPEED);
    
    console.log('PlayerManager: Player created at platform', this.currentPlatform);
  }

  private setupAnimations(): void {
    // Default running animation
    this.player.anims.play('player-run', true);
  }

  private setupParticleEffects(): void {
    // Player trail effect
    this.playerTrail = this.scene.add.particles(0, 0, 'particle', {
      follow: this.player,
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 300,
      frequency: 50,
      tint: parseInt(GameConfig.COLORS.PRIMARY.replace('#', ''), 16),
    });

    // Jump particle burst
    this.jumpParticles = this.scene.add.particles(0, 0, 'particle', {
      scale: { start: 0.5, end: 0.1 },
      speed: { min: 50, max: 150 },
      alpha: { start: 0.8, end: 0 },
      lifespan: 500,
      tint: parseInt(GameConfig.COLORS.ACCENT.replace('#', ''), 16),
    });
    this.jumpParticles.stop();
  }

  public jump(): void {
    if (this.isJumping) {
      // Already jumping - this could extend the jump or do nothing
      return;
    }

    // Perform jump
    this.player.setVelocityY(GameConfig.JUMP_VELOCITY);
    this.isJumping = true;
    this.canSwitchPlatform = true;
    
    // Change to jump animation
    this.player.setTexture('player-jump');
    
    // Jump particle effect
    this.jumpParticles.explode(10, this.player.x, this.player.y + GameConfig.PLAYER_SIZE / 2);
    
    // Play jump sound
    this.scene.sound.play('jump-sound', { volume: 0.3 });
    
    console.log('PlayerManager: Player jumped from platform', this.currentPlatform);
    this.emit('jump', this.currentPlatform);
  }

  public switchPlatform(direction: 'up' | 'down'): void {
    if (!this.canSwitchPlatform) {
      console.log('PlayerManager: Cannot switch platform - not jumping');
      return;
    }

    const newPlatform = direction === 'up' 
      ? Math.min(GameConfig.PLATFORM_COUNT - 1, this.currentPlatform + 1)
      : Math.max(0, this.currentPlatform - 1);

    if (newPlatform === this.currentPlatform) {
      console.log('PlayerManager: Already at', direction === 'up' ? 'top' : 'bottom', 'platform');
      return;
    }

    // Update platform
    const oldPlatform = this.currentPlatform;
    this.currentPlatform = newPlatform;
    
    // Visual feedback for platform switch
    this.showPlatformSwitchEffect(oldPlatform, newPlatform);
    
    console.log(`PlayerManager: Switched platform ${oldPlatform} -> ${newPlatform}`);
    this.emit('platformChanged', newPlatform, oldPlatform);
  }

  private showPlatformSwitchEffect(_from: number, to: number): void {
    // Trail color changes based on target platform
    const colors = [
      GameConfig.COLORS.PLATFORM_BOTTOM,
      GameConfig.COLORS.PLATFORM_MIDDLE,
      GameConfig.COLORS.PLATFORM_TOP,
    ];
    
    const targetColor = parseInt(colors[to].replace('#', ''), 16);
    
    // Update trail color (simplified approach)
    this.playerTrail.stop();
    this.playerTrail = this.scene.add.particles(0, 0, 'particle', {
      follow: this.player,
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      lifespan: 300,
      frequency: 50,
      tint: targetColor,
    });
    
    // Burst effect during switch
    const switchParticles = this.scene.add.particles(this.player.x, this.player.y, 'particle', {
      scale: { start: 0.4, end: 0.1 },
      speed: { min: 80, max: 200 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      tint: targetColor,
      quantity: 15,
    });
    
    switchParticles.explode();
    
    // Clean up after animation
    this.scene.time.delayedCall(500, () => {
      switchParticles.destroy();
    });
  }

  public update(delta: number): void {
    this.updateJumpState();
    this.updatePosition(delta);
    this.updateVisualEffects();
  }

  private updateJumpState(): void {
    if (!this.isJumping) return;

    // Check if player has landed on target platform
    const targetY = this.platformPositions[this.currentPlatform];
    const playerY = this.player.y;
    const tolerance = 20; // Landing tolerance
    
    // Landing detection - when player is falling and near target platform
    if (this.player.body!.velocity.y >= 0 && Math.abs(playerY - targetY) < tolerance) {
      this.landOnPlatform();
    }

    // Infinite gliding logic - if player is between platforms
    const minY = this.platformPositions[GameConfig.PLATFORM_COUNT - 1] - 50;
    const maxY = this.platformPositions[0] + 50;
    
    if (playerY < minY || playerY > maxY) {
      // Apply gentle pull toward target platform
      const pullForce = (targetY - playerY) * 0.02;
      this.player.setVelocityY(this.player.body!.velocity.y + pullForce);
    }
  }

  private landOnPlatform(): void {
    if (!this.isJumping) return;
    
    // Snap to platform position
    const targetY = this.platformPositions[this.currentPlatform];
    this.player.setY(targetY);
    this.player.setVelocityY(0);
    
    // Reset jump state
    this.isJumping = false;
    this.canSwitchPlatform = false;
    
    // Return to running animation
    this.player.anims.play('player-run', true);
    
    // Landing effect
    this.jumpParticles.explode(8, this.player.x, this.player.y + GameConfig.PLAYER_SIZE / 2);
    
    // Screen shake on landing
    this.scene.cameras.main.shake(GameConfig.SCREEN_SHAKE_DURATION, 0.01);
    
    console.log('PlayerManager: Landed on platform', this.currentPlatform);
    this.emit('landed', this.currentPlatform);
  }

  private updatePosition(_delta: number): void {
    // Maintain forward speed (auto-runner)
    if (this.player.body!.velocity.x < GameConfig.PLAYER_SPEED) {
      this.player.setVelocityX(GameConfig.PLAYER_SPEED);
    }
    
    // Keep player on left side of screen
    const targetX = 200;
    if (Math.abs(this.player.x - targetX) > 50) {
      this.player.setX(targetX);
    }
  }

  private updateVisualEffects(): void {
    // Adjust trail intensity based on speed and state
    const speed = Math.abs(this.player.body!.velocity.x);
    const intensity = Math.min(1, speed / GameConfig.PLAYER_SPEED);
    
    this.playerTrail.setAlpha(0.3 + intensity * 0.3);
    
    // Special effects when jumping
    if (this.isJumping) {
      this.playerTrail.setFrequency(30); // More frequent particles
    } else {
      this.playerTrail.setFrequency(50); // Normal frequency
    }
  }

  // Public getters
  public getCurrentPlatform(): number {
    return this.currentPlatform;
  }

  public isPlayerJumping(): boolean {
    return this.isJumping;
  }

  public canPlayerSwitchPlatform(): boolean {
    return this.canSwitchPlatform;
  }

  public getPlayerSprite(): Phaser.Physics.Arcade.Sprite {
    return this.player;
  }

  public getPlayerPosition(): { x: number; y: number } {
    return { x: this.player.x, y: this.player.y };
  }

  // Utility methods
  public getPlatformPosition(platform: number): number {
    return this.platformPositions[platform] || this.platformPositions[0];
  }

  public resetPlayer(): void {
    // Reset to starting position and state
    this.currentPlatform = 0;
    this.isJumping = false;
    this.canSwitchPlatform = false;
    
    this.player.setPosition(200, this.platformPositions[0]);
    this.player.setVelocity(GameConfig.PLAYER_SPEED, 0);
    this.player.anims.play('player-run', true);
    
    console.log('PlayerManager: Player reset');
    this.emit('reset');
  }

  // Cleanup
  public destroy(): void {
    if (this.playerTrail) {
      this.playerTrail.destroy();
    }
    if (this.jumpParticles) {
      this.jumpParticles.destroy();
    }
    if (this.player) {
      this.player.destroy();
    }
    
    console.log('PlayerManager: Destroyed');
  }
}