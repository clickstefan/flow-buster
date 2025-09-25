import * as Phaser from 'phaser';
import { GameConfig } from '@/core/GameConfig';

interface GameStats {
  score: number;
  combo: number;
  maxCombo: number;
  perfectHits: number;
  goodHits: number;
  misses: number;
  collectibles: number;
  timeElapsed: number;
}

/**
 * GameStateManager - Central game state management
 * Handles scoring, progression, and game state transitions
 */
export class GameStateManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private currentState: string = GameConfig.GAME_STATES.PLAYING;
  
  // Game statistics
  private stats: GameStats = {
    score: 0,
    combo: 0,
    maxCombo: 0,
    perfectHits: 0,
    goodHits: 0,
    misses: 0,
    collectibles: 0,
    timeElapsed: 0,
  };
  
  // Progression tracking
  private level = {
    name: 'Demo Level 1',
    duration: 180000, // 3 minutes in milliseconds
    currentBeat: 0,
    totalBeats: 0,
    progress: 0, // 0-1
  };
  
  // Performance tracking
  private performance = {
    accuracy: 100,
    timing: 'perfect' as 'perfect' | 'good' | 'fair' | 'poor',
    grade: 'S' as 'S' | 'A' | 'B' | 'C' | 'D' | 'F',
    multiplier: 1.0,
  };
  
  // State flags
  private isGameActive = false;
  private isPaused = false;
  private startTime = 0;

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.initialize();
  }

  private initialize(): void {
    this.resetStats();
    this.startTime = this.scene.time.now;
    this.isGameActive = true;
    
    console.log('GameStateManager: Initialized');
  }

  private resetStats(): void {
    this.stats = {
      score: 0,
      combo: 0,
      maxCombo: 0,
      perfectHits: 0,
      goodHits: 0,
      misses: 0,
      collectibles: 0,
      timeElapsed: 0,
    };
  }

  public update(_delta: number): void {
    if (!this.isGameActive || this.isPaused) return;

    // Update time elapsed
    this.stats.timeElapsed = this.scene.time.now - this.startTime;
    
    // Update level progress
    this.updateLevelProgress();
    
    // Update performance metrics
    this.updatePerformance();
    
    // Check for level completion
    this.checkLevelCompletion();
  }

  private updateLevelProgress(): void {
    if (this.level.duration > 0) {
      this.level.progress = Math.min(1, this.stats.timeElapsed / this.level.duration);
      this.emit('progressUpdate', this.level.progress);
    }
  }

  private updatePerformance(): void {
    const totalHits = this.stats.perfectHits + this.stats.goodHits;
    const totalAttempts = totalHits + this.stats.misses;
    
    // Calculate accuracy
    if (totalAttempts > 0) {
      this.performance.accuracy = (totalHits / totalAttempts) * 100;
    }
    
    // Determine timing quality
    if (totalHits > 0) {
      const perfectRatio = this.stats.perfectHits / totalHits;
      if (perfectRatio > 0.8) {
        this.performance.timing = 'perfect';
      } else if (perfectRatio > 0.6) {
        this.performance.timing = 'good';
      } else if (perfectRatio > 0.4) {
        this.performance.timing = 'fair';
      } else {
        this.performance.timing = 'poor';
      }
    }
    
    // Calculate grade
    this.performance.grade = this.calculateGrade();
    
    // Calculate multiplier based on combo
    this.performance.multiplier = Math.min(
      GameConfig.MAX_COMBO_MULTIPLIER,
      1 + (this.stats.combo * 0.1)
    );
  }

  private calculateGrade(): 'S' | 'A' | 'B' | 'C' | 'D' | 'F' {
    const accuracy = this.performance.accuracy;
    const perfectRatio = this.stats.perfectHits / Math.max(1, this.stats.perfectHits + this.stats.goodHits);
    
    // S grade: >95% accuracy with >80% perfect hits
    if (accuracy > 95 && perfectRatio > 0.8) return 'S';
    
    // A grade: >90% accuracy with >60% perfect hits
    if (accuracy > 90 && perfectRatio > 0.6) return 'A';
    
    // B grade: >80% accuracy
    if (accuracy > 80) return 'B';
    
    // C grade: >70% accuracy
    if (accuracy > 70) return 'C';
    
    // D grade: >50% accuracy
    if (accuracy > 50) return 'D';
    
    // F grade: everything else
    return 'F';
  }

  private checkLevelCompletion(): void {
    if (this.level.progress >= 1 && this.currentState === GameConfig.GAME_STATES.PLAYING) {
      this.completeLevel();
    }
  }

  // Event handlers for game events
  public onObstacleHit(quality: 'perfect' | 'good' | 'miss'): void {
    switch (quality) {
      case 'perfect':
        this.stats.perfectHits++;
        this.stats.combo++;
        this.stats.score += Math.floor(GameConfig.PERFECT_HIT_SCORE * this.performance.multiplier);
        break;
      case 'good':
        this.stats.goodHits++;
        this.stats.combo++;
        this.stats.score += Math.floor(GameConfig.GOOD_HIT_SCORE * this.performance.multiplier);
        break;
      case 'miss':
        this.stats.misses++;
        this.resetCombo();
        this.stats.score = Math.max(0, this.stats.score + GameConfig.MISS_PENALTY);
        break;
    }
    
    // Update max combo
    if (this.stats.combo > this.stats.maxCombo) {
      this.stats.maxCombo = this.stats.combo;
    }
    
    this.emit('hitProcessed', {
      quality,
      score: this.stats.score,
      combo: this.stats.combo,
      multiplier: this.performance.multiplier,
    });
  }

  public onCollectibleHit(value: number): void {
    this.stats.collectibles++;
    this.stats.score += Math.floor(value * this.performance.multiplier);
    
    this.emit('collectibleProcessed', {
      value: Math.floor(value * this.performance.multiplier),
      total: this.stats.collectibles,
      score: this.stats.score,
    });
  }

  public onBeat(beatNumber: number): void {
    this.level.currentBeat = beatNumber;
    if (beatNumber > this.level.totalBeats) {
      this.level.totalBeats = beatNumber;
    }
    
    this.emit('beatProcessed', beatNumber);
  }

  private resetCombo(): void {
    if (this.stats.combo > 0) {
      this.emit('comboReset', this.stats.combo);
      this.stats.combo = 0;
    }
  }

  // Game state control
  public pauseGame(): void {
    if (this.currentState === GameConfig.GAME_STATES.PLAYING) {
      this.isPaused = true;
      this.currentState = GameConfig.GAME_STATES.PAUSED;
      this.emit('gamePaused');
      console.log('GameStateManager: Game paused');
    }
  }

  public resumeGame(): void {
    if (this.currentState === GameConfig.GAME_STATES.PAUSED) {
      this.isPaused = false;
      this.currentState = GameConfig.GAME_STATES.PLAYING;
      
      // Adjust start time to account for pause duration
      const pauseTime = this.scene.time.now - (this.startTime + this.stats.timeElapsed);
      this.startTime += pauseTime;
      
      this.emit('gameResumed');
      console.log('GameStateManager: Game resumed');
    }
  }

  public endGame(): void {
    this.isGameActive = false;
    this.currentState = GameConfig.GAME_STATES.GAME_OVER;
    
    // Calculate final stats
    const finalStats = this.generateFinalStats();
    
    this.emit('gameEnded', finalStats);
    console.log('GameStateManager: Game ended', finalStats);
  }

  private completeLevel(): void {
    this.isGameActive = false;
    this.currentState = GameConfig.GAME_STATES.LEVEL_COMPLETE;
    
    // Calculate completion bonus
    const completionBonus = this.calculateCompletionBonus();
    this.stats.score += completionBonus;
    
    const completionData = {
      ...this.generateFinalStats(),
      completionBonus,
      timeBonus: this.calculateTimeBonus(),
    };
    
    this.emit('levelCompleted', completionData);
    console.log('GameStateManager: Level completed', completionData);
  }

  private calculateCompletionBonus(): number {
    // Base completion bonus
    let bonus = 1000;
    
    // Accuracy bonus
    bonus += Math.floor(this.performance.accuracy * 10);
    
    // Perfect hits bonus
    bonus += this.stats.perfectHits * 50;
    
    // Combo bonus
    bonus += this.stats.maxCombo * 25;
    
    return bonus;
  }

  private calculateTimeBonus(): number {
    // Bonus for completing level quickly (if applicable)
    const targetTime = this.level.duration * 0.8; // 80% of full duration
    if (this.stats.timeElapsed < targetTime) {
      const timeSaved = targetTime - this.stats.timeElapsed;
      return Math.floor(timeSaved / 1000) * 10; // 10 points per second saved
    }
    return 0;
  }

  private generateFinalStats() {
    return {
      ...this.stats,
      ...this.performance,
      level: { ...this.level },
      completionTime: this.stats.timeElapsed,
      grade: this.performance.grade,
    };
  }

  // Getters for current state
  public getCurrentState(): string {
    return this.currentState;
  }

  public getStats(): GameStats {
    return { ...this.stats };
  }

  public getPerformance() {
    return { ...this.performance };
  }

  public getLevelInfo() {
    return { ...this.level };
  }

  public getScore(): number {
    return this.stats.score;
  }

  public getCombo(): number {
    return this.stats.combo;
  }

  public getAccuracy(): number {
    return this.performance.accuracy;
  }

  public isActive(): boolean {
    return this.isGameActive && !this.isPaused;
  }

  public getPlayTime(): number {
    return this.stats.timeElapsed;
  }

  // Configuration methods
  public setLevelData(levelData: any): void {
    this.level.name = levelData.name || 'Unknown Level';
    this.level.duration = levelData.duration || 180000;
    this.level.totalBeats = levelData.totalBeats || 0;
    
    console.log('GameStateManager: Level data set', this.level);
  }

  // Save/load functionality (for future persistence)
  public getGameState() {
    return {
      stats: this.stats,
      performance: this.performance,
      level: this.level,
      currentState: this.currentState,
      timeElapsed: this.stats.timeElapsed,
    };
  }

  public loadGameState(state: any): void {
    if (state) {
      this.stats = { ...this.stats, ...state.stats };
      this.performance = { ...this.performance, ...state.performance };
      this.level = { ...this.level, ...state.level };
      this.currentState = state.currentState || GameConfig.GAME_STATES.PLAYING;
      
      console.log('GameStateManager: State loaded');
    }
  }

  // Cleanup
  public reset(): void {
    this.resetStats();
    this.currentState = GameConfig.GAME_STATES.PLAYING;
    this.isGameActive = true;
    this.isPaused = false;
    this.startTime = this.scene.time.now;
    
    console.log('GameStateManager: Reset');
    this.emit('gameReset');
  }

  public destroy(): void {
    this.isGameActive = false;
    console.log('GameStateManager: Destroyed');
  }
}