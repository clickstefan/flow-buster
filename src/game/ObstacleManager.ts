import * as Phaser from 'phaser';
import { GameConfig } from '@/core/GameConfig';

interface Obstacle {
  sprite: Phaser.Physics.Arcade.Sprite;
  platform: number;
  beatNumber: number;
  timing: 'pending' | 'hit' | 'missed';
  hitWindow: { start: number; end: number };
}

/**
 * ObstacleManager - Manages obstacle spawning, movement, and collision
 * Synchronizes obstacles with beat detection and handles timing feedback
 */
export class ObstacleManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private obstacles: Obstacle[] = [];
  private obstacleGroup!: Phaser.Physics.Arcade.Group;
  private collectibleGroup!: Phaser.Physics.Arcade.Group;
  
  // Spawn timing
  private currentTempo = GameConfig.DEFAULT_TEMPO;
  private spawnPattern: number[] = [1, 0, 1, 1]; // Simple 4-beat pattern
  private patternIndex = 0;
  
  // Platform positions (mirrors PlayerManager)
  private platformPositions: number[] = [];

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.calculatePlatformPositions();
    this.createObstacleGroups();
    this.setupCollisions();
  }

  private calculatePlatformPositions(): void {
    const { height } = this.scene.cameras.main;
    const platformHeight = GameConfig.PLATFORM_HEIGHT;
    
    this.platformPositions = [
      height - platformHeight / 2,     // Bottom platform
      height - platformHeight * 1.5,  // Middle platform
      height - platformHeight * 2.5,  // Top platform
    ];
  }

  private createObstacleGroups(): void {
    // Main obstacle group
    this.obstacleGroup = this.scene.physics.add.group({
      defaultKey: 'obstacle',
      maxSize: GameConfig.PERFORMANCE.MAX_OBSTACLES_ON_SCREEN,
    });

    // Collectible notes group
    this.collectibleGroup = this.scene.physics.add.group({
      defaultKey: 'note-collectible',
      maxSize: 20,
    });
  }

  private setupCollisions(): void {
    // Note: Actual collision setup would be done in GameScene
    // This is a placeholder for the collision logic structure
  }

  public onBeat(beatNumber: number): void {
    
    // Check current pattern for this beat
    const shouldSpawn = this.spawnPattern[this.patternIndex];
    this.patternIndex = (this.patternIndex + 1) % this.spawnPattern.length;
    
    if (shouldSpawn) {
      this.spawnObstacle(beatNumber);
    }
    
    // Occasionally spawn collectibles between beats
    if (Math.random() < 0.3) {
      this.spawnCollectible(beatNumber);
    }
  }

  private spawnObstacle(beatNumber: number): void {
    const { width } = this.scene.cameras.main;
    
    // Choose random platform (could be more sophisticated based on music analysis)
    const platform = Math.floor(Math.random() * GameConfig.PLATFORM_COUNT);
    const spawnX = width + GameConfig.OBSTACLE_SIZE;
    const spawnY = this.platformPositions[platform];
    
    // Get or create obstacle sprite
    let obstacle = this.obstacleGroup.getFirstDead(false);
    if (!obstacle) {
      obstacle = this.scene.physics.add.sprite(spawnX, spawnY, 'obstacle');
      this.obstacleGroup.add(obstacle);
    } else {
      obstacle.setPosition(spawnX, spawnY);
      obstacle.setActive(true);
      obstacle.setVisible(true);
    }
    
    // Set up obstacle properties
    obstacle.setDisplaySize(GameConfig.OBSTACLE_SIZE, GameConfig.OBSTACLE_SIZE);
    obstacle.setVelocityX(-GameConfig.OBSTACLE_SPEED * this.currentTempo);
    obstacle.setBounce(0);
    obstacle.setCollideWorldBounds(false);
    
    // Start pulsing animation
    obstacle.anims.play('obstacle-pulse', true);
    
    // Calculate timing windows for this obstacle
    const arrivalTime = this.calculateArrivalTime(spawnX);
    const goodStart = arrivalTime - GameConfig.GOOD_TIMING_WINDOW / 2;
    const goodEnd = arrivalTime + GameConfig.GOOD_TIMING_WINDOW / 2;
    
    // Create obstacle data
    const obstacleData: Obstacle = {
      sprite: obstacle,
      platform: platform,
      beatNumber: beatNumber,
      timing: 'pending',
      hitWindow: { start: goodStart, end: goodEnd },
    };
    
    // Store timing data on sprite for easy access
    (obstacle as any).obstacleData = obstacleData;
    this.obstacles.push(obstacleData);
    
    console.log(`ObstacleManager: Spawned obstacle on platform ${platform} for beat ${beatNumber}`);
    this.emit('obstacleSpawned', obstacleData);
  }

  private spawnCollectible(_beatNumber: number): void {
    const { width } = this.scene.cameras.main;
    
    // Spawn collectibles between platforms
    const platform1 = Math.floor(Math.random() * GameConfig.PLATFORM_COUNT);
    const platform2 = Math.min(GameConfig.PLATFORM_COUNT - 1, platform1 + 1);
    const spawnX = width + 50;
    const spawnY = (this.platformPositions[platform1] + this.platformPositions[platform2]) / 2;
    
    // Get or create collectible sprite
    let collectible = this.collectibleGroup.getFirstDead(false);
    if (!collectible) {
      collectible = this.scene.physics.add.sprite(spawnX, spawnY, 'note-collectible');
      this.collectibleGroup.add(collectible);
    } else {
      collectible.setPosition(spawnX, spawnY);
      collectible.setActive(true);
      collectible.setVisible(true);
    }
    
    // Set up collectible properties
    collectible.setDisplaySize(30, 30);
    collectible.setVelocityX(-GameConfig.OBSTACLE_SPEED * this.currentTempo);
    
    // Floating animation
    this.scene.tweens.add({
      targets: collectible,
      y: spawnY - 20,
      duration: 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    });
    
    // Rotation animation
    this.scene.tweens.add({
      targets: collectible,
      rotation: Math.PI * 2,
      duration: 2000,
      repeat: -1,
    });
  }

  private calculateArrivalTime(spawnX: number): number {
    // Calculate when obstacle will reach player position
    const playerX = 200; // Player's fixed X position
    const distance = spawnX - playerX;
    const speed = GameConfig.OBSTACLE_SPEED * this.currentTempo;
    const travelTime = (distance / speed) * 1000; // Convert to milliseconds
    
    return this.scene.time.now + travelTime;
  }

  public update(delta: number): void {
    this.updateObstacles(delta);
    this.updateCollectibles(delta);
    this.cleanupOffscreenObjects();
  }

  private updateObstacles(_delta: number): void {
    const currentTime = this.scene.time.now;
    
    this.obstacles.forEach((obstacle) => {
      if (!obstacle.sprite.active) return;
      
      // Check if obstacle has passed the timing window
      if (obstacle.timing === 'pending' && currentTime > obstacle.hitWindow.end) {
        obstacle.timing = 'missed';
        this.onObstacleMissed(obstacle);
      }
      
      // Update obstacle visual effects based on timing window
      this.updateObstacleVisuals(obstacle, currentTime);
    });
  }

  private updateObstacleVisuals(obstacle: Obstacle, currentTime: number): void {
    const { start, end } = obstacle.hitWindow;
    const perfectStart = start + (end - start) * 0.25;
    const perfectEnd = end - (end - start) * 0.25;
    
    // Change obstacle appearance based on timing window
    if (currentTime >= perfectStart && currentTime <= perfectEnd) {
      // Perfect timing window - bright glow
      obstacle.sprite.setTint(0x00FF00);
      obstacle.sprite.setAlpha(1);
    } else if (currentTime >= start && currentTime <= end) {
      // Good timing window - moderate glow
      obstacle.sprite.setTint(0xFFFF00);
      obstacle.sprite.setAlpha(0.9);
    } else {
      // Outside timing window - normal appearance
      obstacle.sprite.clearTint();
      obstacle.sprite.setAlpha(0.8);
    }
  }

  private updateCollectibles(_delta: number): void {
    // Collectibles have simpler logic - just move and sparkle
    this.collectibleGroup.children.entries.forEach((collectible: any) => {
      if (collectible.active) {
        // Add sparkle effect
        if (Math.random() < 0.1) {
          collectible.setTint(0xFFFFFF);
          this.scene.time.delayedCall(100, () => {
            if (collectible.active) {
              collectible.clearTint();
            }
          });
        }
      }
    });
  }

  private cleanupOffscreenObjects(): void {
    const screenLeft = this.scene.cameras.main.scrollX - 100;
    
    // Clean up obstacles
    this.obstacles = this.obstacles.filter(obstacle => {
      if (obstacle.sprite.x < screenLeft) {
        obstacle.sprite.setActive(false);
        obstacle.sprite.setVisible(false);
        return false;
      }
      return true;
    });
    
    // Clean up collectibles
    this.collectibleGroup.children.entries.forEach((collectible: any) => {
      if (collectible.x < screenLeft) {
        collectible.setActive(false);
        collectible.setVisible(false);
      }
    });
  }

  // Collision detection methods (to be called from GameScene)
  public checkObstacleHit(playerSprite: Phaser.Physics.Arcade.Sprite): void {
    const currentTime = this.scene.time.now;
    
    // Check for overlapping obstacles
    this.obstacles.forEach(obstacle => {
      if (obstacle.timing !== 'pending' || !obstacle.sprite.active) return;
      
      const distance = Phaser.Math.Distance.Between(
        playerSprite.x, playerSprite.y,
        obstacle.sprite.x, obstacle.sprite.y
      );
      
      if (distance < (GameConfig.PLAYER_SIZE + GameConfig.OBSTACLE_SIZE) / 2) {
        this.onObstacleHit(obstacle, currentTime);
      }
    });
  }

  public checkCollectibleHit(playerSprite: Phaser.Physics.Arcade.Sprite): void {
    this.collectibleGroup.children.entries.forEach((collectible: any) => {
      if (!collectible.active) return;
      
      const distance = Phaser.Math.Distance.Between(
        playerSprite.x, playerSprite.y,
        collectible.x, collectible.y
      );
      
      if (distance < (GameConfig.PLAYER_SIZE + 30) / 2) {
        this.onCollectibleHit(collectible);
      }
    });
  }

  private onObstacleHit(obstacle: Obstacle, hitTime: number): void {
    obstacle.timing = 'hit';
    
    // Determine hit quality based on timing
    const { start, end } = obstacle.hitWindow;
    const perfectStart = start + (end - start) * 0.25;
    const perfectEnd = end - (end - start) * 0.25;
    
    let hitQuality: 'perfect' | 'good' | 'miss';
    
    if (hitTime >= perfectStart && hitTime <= perfectEnd) {
      hitQuality = 'perfect';
    } else if (hitTime >= start && hitTime <= end) {
      hitQuality = 'good';
    } else {
      hitQuality = 'miss';
    }
    
    // Visual feedback
    this.showHitEffect(obstacle.sprite, hitQuality);
    
    // Remove obstacle
    obstacle.sprite.setActive(false);
    obstacle.sprite.setVisible(false);
    
    // Play sound effect
    const soundKey = hitQuality === 'perfect' ? 'perfect-hit' : 'beat-hit';
    this.scene.sound.play(soundKey, { volume: 0.4 });
    
    console.log(`ObstacleManager: Obstacle hit with ${hitQuality} timing`);
    this.emit('obstacleHit', hitQuality, obstacle);
  }

  private onObstacleMissed(obstacle: Obstacle): void {
    // Visual feedback for missed obstacle
    this.showMissEffect(obstacle.sprite);
    
    console.log('ObstacleManager: Obstacle missed');
    this.emit('obstacleMissed', obstacle);
  }

  private onCollectibleHit(collectible: Phaser.Physics.Arcade.Sprite): void {
    // Visual effect
    const burstParticles = this.scene.add.particles(collectible.x, collectible.y, 'particle', {
      scale: { start: 0.4, end: 0.1 },
      speed: { min: 100, max: 200 },
      alpha: { start: 1, end: 0 },
      lifespan: 400,
      tint: parseInt(GameConfig.COLORS.ACCENT.replace('#', ''), 16),
      quantity: 12,
    });
    burstParticles.explode();
    
    // Remove collectible
    collectible.setActive(false);
    collectible.setVisible(false);
    
    // Play sound
    this.scene.sound.play('collect-note', { volume: 0.3 });
    
    console.log('ObstacleManager: Collectible collected');
    this.emit('collectibleHit', GameConfig.COLLECTIBLE_SCORE);
    
    // Clean up particles
    this.scene.time.delayedCall(500, () => {
      burstParticles.destroy();
    });
  }

  private showHitEffect(sprite: Phaser.Physics.Arcade.Sprite, quality: 'perfect' | 'good' | 'miss'): void {
    const colors = {
      perfect: 0x00FF00,
      good: 0xFFFF00,
      miss: 0xFF0000,
    };
    
    const hitEffect = this.scene.add.particles(sprite.x, sprite.y, 'particle', {
      scale: { start: 0.6, end: 0.1 },
      speed: { min: 150, max: 300 },
      alpha: { start: 1, end: 0 },
      lifespan: 600,
      tint: colors[quality],
      quantity: 20,
    });
    hitEffect.explode();
    
    // Screen shake for perfect hits
    if (quality === 'perfect') {
      this.scene.cameras.main.shake(GameConfig.SCREEN_SHAKE_DURATION, 0.005);
    }
    
    // Clean up
    this.scene.time.delayedCall(700, () => {
      hitEffect.destroy();
    });
  }

  private showMissEffect(sprite: Phaser.Physics.Arcade.Sprite): void {
    // Simple fade out for missed obstacles
    this.scene.tweens.add({
      targets: sprite,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        sprite.setActive(false);
        sprite.setVisible(false);
        sprite.setAlpha(1); // Reset for reuse
      },
    });
  }

  // Public methods
  public setTempo(tempo: number): void {
    this.currentTempo = tempo;
    
    // Update existing obstacles' speed
    this.obstacles.forEach(obstacle => {
      if (obstacle.sprite.active) {
        obstacle.sprite.setVelocityX(-GameConfig.OBSTACLE_SPEED * tempo);
      }
    });
    
    // Update collectibles' speed
    this.collectibleGroup.children.entries.forEach((collectible: any) => {
      if (collectible.active) {
        collectible.setVelocityX(-GameConfig.OBSTACLE_SPEED * tempo);
      }
    });
  }

  public getActiveObstacles(): Obstacle[] {
    return this.obstacles.filter(o => o.sprite.active && o.timing === 'pending');
  }

  public clear(): void {
    // Remove all obstacles
    this.obstacles.forEach(obstacle => {
      obstacle.sprite.destroy();
    });
    this.obstacles = [];
    
    // Clear groups
    this.obstacleGroup.clear(true, true);
    this.collectibleGroup.clear(true, true);
    
    console.log('ObstacleManager: Cleared all obstacles');
  }

  public destroy(): void {
    this.clear();
    this.obstacleGroup.destroy();
    this.collectibleGroup.destroy();
    
    console.log('ObstacleManager: Destroyed');
  }
}