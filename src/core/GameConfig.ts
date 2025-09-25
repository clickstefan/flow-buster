/**
 * Central configuration for the Rhythm Runner game
 * Contains all game constants and settings
 */
export class GameConfig {
  // Display settings
  static readonly GAME_WIDTH = 1920;
  static readonly GAME_HEIGHT = 1080;
  static readonly MIN_WIDTH = 360;
  static readonly MIN_HEIGHT = 640;
  static readonly MAX_WIDTH = 2560;
  static readonly MAX_HEIGHT = 1440;
  static readonly BACKGROUND_COLOR = '#1a1a2e';

  // Physics settings
  static readonly GRAVITY = 2000;
  static readonly DEBUG_PHYSICS = false;

  // Player settings
  static readonly PLAYER_SPEED = 400;
  static readonly JUMP_VELOCITY = -800;
  static readonly PLATFORM_COUNT = 3;
  static readonly PLATFORM_HEIGHT = 200;
  static readonly PLAYER_SIZE = 80;

  // Audio settings
  static readonly AUDIO_CONTEXT_LATENCY = 'interactive';
  static readonly BEAT_DETECTION_SENSITIVITY = 0.7;
  static readonly AUDIO_BUFFER_SIZE = 512;
  static readonly SAMPLE_RATE = 44100;

  // Tempo control settings
  static readonly MIN_TEMPO = 0.5;
  static readonly MAX_TEMPO = 2.0;
  static readonly DEFAULT_TEMPO = 1.0;
  static readonly TEMPO_TRANSITION_TIME = 0.3; // seconds

  // Harmony energy system
  static readonly MAX_HARMONY_ENERGY = 100;
  static readonly HARMONY_DRAIN_RATE_SLOW = 20; // per second at 0.5x speed
  static readonly HARMONY_RESTORE_RATE = 10; // per second at 1x speed
  static readonly HARMONY_PERFECT_BEAT_BONUS = 15;
  static readonly HARMONY_GOOD_BEAT_BONUS = 5;

  // Obstacle settings
  static readonly OBSTACLE_SPAWN_DISTANCE = 1200;
  static readonly OBSTACLE_SPEED = 600;
  static readonly OBSTACLE_SIZE = 60;
  static readonly OBSTACLE_WARNING_TIME = 1.0; // seconds before obstacle appears

  // Timing windows (in milliseconds)
  static readonly PERFECT_TIMING_WINDOW = 100; // ±50ms for perfect
  static readonly GOOD_TIMING_WINDOW = 200; // ±100ms for good
  static readonly BEAT_PREDICTION_OFFSET = 50; // ms ahead to account for input lag

  // Scoring
  static readonly PERFECT_HIT_SCORE = 100;
  static readonly GOOD_HIT_SCORE = 50;
  static readonly MISS_PENALTY = -10;
  static readonly COLLECTIBLE_SCORE = 25;
  static readonly COMBO_MULTIPLIER = 1.1;
  static readonly MAX_COMBO_MULTIPLIER = 3.0;

  // Visual effects
  static readonly PARTICLE_COUNT = 50;
  static readonly SCREEN_SHAKE_DURATION = 100;
  static readonly BEAT_FLASH_DURATION = 200;
  
  // Colors (hex values)
  static readonly COLORS = {
    PRIMARY: '#6B46C1',
    SECONDARY: '#EC4899',
    ACCENT: '#F59E0B',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    TEXT_PRIMARY: '#F9FAFB',
    TEXT_SECONDARY: '#D1D5DB',
    BACKGROUND_DARK: '#111827',
    BACKGROUND_LIGHT: '#1F2937',
    PLATFORM_BOTTOM: '#7C3AED',  // Bass - purple
    PLATFORM_MIDDLE: '#EC4899', // Rhythm - pink  
    PLATFORM_TOP: '#F59E0B',    // Melody - orange
  };

  // Game states
  static readonly GAME_STATES = {
    LOADING: 'loading',
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_COMPLETE: 'levelComplete',
  };

  // Scene keys
  static readonly SCENES = {
    PRELOAD: 'PreloadScene',
    MAIN_MENU: 'MainMenuScene',
    GAME: 'GameScene',
    UI: 'UIScene',
    PAUSE: 'PauseScene',
    GAME_OVER: 'GameOverScene',
    LEVEL_EDITOR: 'LevelEditorScene',
  };

  // Input settings
  static readonly INPUT = {
    SWIPE_THRESHOLD: 50, // pixels
    TAP_MAX_TIME: 200, // ms
    HOLD_MIN_TIME: 300, // ms
    GESTURE_DEADZONE: 10, // pixels
  };

  // Performance settings
  static readonly PERFORMANCE = {
    MAX_PARTICLES: 100,
    MAX_OBSTACLES_ON_SCREEN: 20,
    AUDIO_LOOKAHEAD: 25.0, // ms
    RENDER_OPTIMIZATION_DISTANCE: 2000, // pixels
  };

  // Level system
  static readonly LEVELS = {
    DEFAULT_BPM: 120,
    MIN_BPM: 80,
    MAX_BPM: 180,
    BEATS_PER_MEASURE: 4,
    MEASURES_PER_SECTION: 8,
  };

  // Development settings
  static readonly DEBUG = {
    SHOW_FPS: false,
    SHOW_AUDIO_DEBUG: false,
    SHOW_TIMING_DEBUG: false,
    ENABLE_DEV_TOOLS: process.env.NODE_ENV === 'development',
    LOG_BEAT_DETECTION: false,
  };
}