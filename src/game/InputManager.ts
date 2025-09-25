import * as Phaser from 'phaser';
import { GameConfig } from '@/core/GameConfig';

interface GestureState {
  isActive: boolean;
  startTime: number;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  type?: 'tap' | 'swipe' | 'hold';
  direction?: 'up' | 'down' | 'left' | 'right';
}

/**
 * InputManager - Handles touch/mouse input and gesture recognition
 * Optimized for mobile rhythm game controls
 */
export class InputManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  private gestureState: GestureState;
  private isPointerDown = false;
  
  // Tempo control state
  private tempoControlActive = false;
  private currentTempoDirection: 'slow' | 'fast' | 'normal' = 'normal';

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.gestureState = this.resetGestureState();
    this.setupInputHandlers();
  }

  private resetGestureState(): GestureState {
    return {
      isActive: false,
      startTime: 0,
      startPosition: { x: 0, y: 0 },
      currentPosition: { x: 0, y: 0 },
    };
  }

  private setupInputHandlers(): void {
    // Touch/mouse input handlers
    this.scene.input.on('pointerdown', this.onPointerDown, this);
    this.scene.input.on('pointermove', this.onPointerMove, this);
    this.scene.input.on('pointerup', this.onPointerUp, this);
    
    // Keyboard shortcuts (for testing)
    if (GameConfig.DEBUG.ENABLE_DEV_TOOLS) {
      this.setupKeyboardHandlers();
    }
  }

  private setupKeyboardHandlers(): void {
    const keyboard = this.scene.input.keyboard;
    if (!keyboard) return;

    // Jump
    keyboard.addKey('SPACE').on('down', () => {
      this.emit('jump');
    });

    // Platform switching
    keyboard.addKey('UP').on('down', () => {
      this.emit('switchPlatform', 'up');
    });

    keyboard.addKey('DOWN').on('down', () => {
      this.emit('switchPlatform', 'down');
    });

    // Tempo control
    keyboard.addKey('LEFT').on('down', () => {
      this.emit('tempoControl', 'slow');
    });

    keyboard.addKey('RIGHT').on('down', () => {
      this.emit('tempoControl', 'fast');
    });

    keyboard.addKey('LEFT').on('up', () => {
      this.emit('tempoControl', 'normal');
    });

    keyboard.addKey('RIGHT').on('up', () => {
      this.emit('tempoControl', 'normal');
    });
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    this.isPointerDown = true;
    this.gestureState.isActive = true;
    this.gestureState.startTime = this.scene.time.now;
    this.gestureState.startPosition = { x: pointer.x, y: pointer.y };
    this.gestureState.currentPosition = { x: pointer.x, y: pointer.y };
    
    console.log('InputManager: Pointer down at', pointer.x, pointer.y);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isPointerDown || !this.gestureState.isActive) return;

    this.gestureState.currentPosition = { x: pointer.x, y: pointer.y };
    
    // Check for tempo control gesture (horizontal swipe while holding)
    this.checkTempoControlGesture();
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.gestureState.isActive) return;

    this.isPointerDown = false;
    this.gestureState.currentPosition = { x: pointer.x, y: pointer.y };
    
    // Process the completed gesture
    this.processGesture();
    
    // Reset tempo control if it was active
    if (this.tempoControlActive) {
      this.tempoControlActive = false;
      this.emit('tempoControl', 'normal');
    }
    
    // Reset gesture state
    this.gestureState = this.resetGestureState();
  }

  private checkTempoControlGesture(): void {
    const deltaX = this.gestureState.currentPosition.x - this.gestureState.startPosition.x;
    const deltaY = this.gestureState.currentPosition.y - this.gestureState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = this.scene.time.now - this.gestureState.startTime;
    
    // Check if this is a horizontal swipe gesture for tempo control
    if (duration > GameConfig.INPUT.HOLD_MIN_TIME && distance > GameConfig.INPUT.SWIPE_THRESHOLD) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      
      // Horizontal swipe (tempo control)
      if (absX > absY * 1.5) {
        const newDirection = deltaX < 0 ? 'slow' : 'fast';
        
        if (!this.tempoControlActive || this.currentTempoDirection !== newDirection) {
          this.tempoControlActive = true;
          this.currentTempoDirection = newDirection;
          this.emit('tempoControl', newDirection);
          console.log('InputManager: Tempo control activated -', newDirection);
        }
      }
    }
  }

  private processGesture(): void {
    const deltaX = this.gestureState.currentPosition.x - this.gestureState.startPosition.x;
    const deltaY = this.gestureState.currentPosition.y - this.gestureState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = this.scene.time.now - this.gestureState.startTime;
    
    console.log(`InputManager: Gesture - distance: ${distance.toFixed(1)}, duration: ${duration}ms`);

    // If tempo control was active, don't process other gestures
    if (this.tempoControlActive) {
      return;
    }

    // Classify gesture type
    if (duration < GameConfig.INPUT.TAP_MAX_TIME && distance < GameConfig.INPUT.GESTURE_DEADZONE) {
      // TAP - Jump
      this.processJump();
    } else if (distance > GameConfig.INPUT.SWIPE_THRESHOLD) {
      // SWIPE - Platform switching
      this.processSwipe(deltaX, deltaY);
    } else if (duration > GameConfig.INPUT.HOLD_MIN_TIME) {
      // HOLD - Could be used for special actions in the future
      this.processHold();
    }
  }

  private processJump(): void {
    console.log('InputManager: Jump gesture detected');
    this.emit('jump');
    
    // Visual feedback for jump input
    this.showInputFeedback('jump');
  }

  private processSwipe(deltaX: number, deltaY: number): void {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    // Determine swipe direction
    if (absY > absX) {
      // Vertical swipe - platform switching
      const direction = deltaY < 0 ? 'up' : 'down';
      console.log('InputManager: Platform switch gesture -', direction);
      this.emit('switchPlatform', direction);
      this.showInputFeedback('platform', direction);
    } else {
      // Horizontal swipe was already handled in tempo control
      // This shouldn't happen if tempo control was properly detected
      console.log('InputManager: Horizontal swipe detected but not processed as tempo control');
    }
  }

  private processHold(): void {
    // Hold gestures could be used for special abilities in the future
    console.log('InputManager: Hold gesture detected');
    // Currently no specific action for hold
  }

  private showInputFeedback(type: 'jump' | 'platform', direction?: string): void {
    const { width, height } = this.scene.cameras.main;
    let feedbackText = '';
    let color = GameConfig.COLORS.PRIMARY;
    let position = { x: width / 2, y: height / 2 };
    
    switch (type) {
      case 'jump':
        feedbackText = '↑ JUMP';
        color = GameConfig.COLORS.SUCCESS;
        position.y = height * 0.7;
        break;
      case 'platform':
        feedbackText = direction === 'up' ? '⬆ UP' : '⬇ DOWN';
        color = GameConfig.COLORS.ACCENT;
        position.x = direction === 'up' ? width * 0.3 : width * 0.7;
        position.y = height / 2;
        break;
    }
    
    // Create feedback text
    const feedback = this.scene.add.text(position.x, position.y, feedbackText, {
      fontSize: '20px',
      color: color,
      fontFamily: 'Rajdhani, Arial, sans-serif',
      fontStyle: 'bold',
      stroke: GameConfig.COLORS.BACKGROUND_DARK,
      strokeThickness: 2,
    }).setOrigin(0.5).setAlpha(0);
    
    // Animate feedback
    this.scene.tweens.add({
      targets: feedback,
      alpha: 1,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 150,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        this.scene.tweens.add({
          targets: feedback,
          alpha: 0,
          duration: 300,
          ease: 'Power2',
          onComplete: () => feedback.destroy(),
        });
      },
    });
  }

  // Public methods for external control
  public enableInput(): void {
    this.scene.input.enabled = true;
    console.log('InputManager: Input enabled');
  }

  public disableInput(): void {
    this.scene.input.enabled = false;
    this.gestureState = this.resetGestureState();
    this.tempoControlActive = false;
    console.log('InputManager: Input disabled');
  }

  public isInputEnabled(): boolean {
    return this.scene.input.enabled;
  }

  // Configuration methods
  public setSensitivity(sensitivity: number): void {
    // Adjust gesture recognition sensitivity
    // This could modify thresholds for swipe distance, timing, etc.
    console.log('InputManager: Sensitivity set to', sensitivity);
  }

  // Debug information
  public getGestureState(): GestureState {
    return { ...this.gestureState };
  }

  public getCurrentInput(): string {
    if (this.tempoControlActive) {
      return `Tempo: ${this.currentTempoDirection}`;
    } else if (this.gestureState.isActive) {
      return 'Gesture in progress';
    } else {
      return 'Idle';
    }
  }

  // Cleanup
  public destroy(): void {
    // Remove event listeners
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    
    // Reset state
    this.gestureState = this.resetGestureState();
    this.tempoControlActive = false;
    
    console.log('InputManager: Destroyed');
  }
}