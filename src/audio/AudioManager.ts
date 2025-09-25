import * as Phaser from 'phaser';
import * as Tone from 'tone';
import Meyda from 'meyda';
import { GameConfig } from '@/core/GameConfig';

/**
 * AudioManager - Central audio system
 * Handles music playback, beat detection, tempo control, and audio analysis
 */
export class AudioManager extends Phaser.Events.EventEmitter {
  private scene: Phaser.Scene;
  
  // Tone.js audio components
  private player!: Tone.Player;
  private pitchShift!: Tone.PitchShift;
  private analyzer!: Tone.Analyser;
  private compressor!: Tone.Compressor;
  
  // Meyda audio analysis
  private meydaAnalyzer: any;
  private audioContext!: AudioContext;
  
  // Beat detection
  private beatThreshold = GameConfig.BEAT_DETECTION_SENSITIVITY;
  private lastBeatTime = 0;
  private beatCount = 0;
  private isPlaying = false;
  
  // Tempo control
  private currentTempo = GameConfig.DEFAULT_TEMPO;
  private targetTempo = GameConfig.DEFAULT_TEMPO;
  private tempoTransitionTween?: Phaser.Tweens.Tween;
  
  // Audio analysis data
  private audioData = {
    frequencyBins: new Array(3).fill(0), // For 3 platforms
    rms: 0,
    spectralCentroid: 0,
    zcr: 0,
  };
  
  // Beat detection algorithm state
  private beatDetector = {
    energyBuffer: new Array(43).fill(0), // ~1 second at 512 samples, 44.1kHz
    bufferIndex: 0,
    lastEnergy: 0,
    variance: 0,
  };

  constructor(scene: Phaser.Scene) {
    super();
    this.scene = scene;
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Start Tone.js audio context
      await Tone.start();
      console.log('AudioManager: Tone.js started successfully');
      
      // Set up audio processing chain
      this.setupAudioChain();
      
      // Set up Meyda for audio analysis
      this.setupMeyda();
      
      console.log('AudioManager: Initialized successfully');
    } catch (error) {
      console.error('AudioManager: Failed to initialize:', error);
    }
  }

  private setupAudioChain(): void {
    // Create audio processing chain: Player -> PitchShift -> Compressor -> Destination
    this.player = new Tone.Player().toDestination();
    this.pitchShift = new Tone.PitchShift();
    this.compressor = new Tone.Compressor(-30, 3);
    this.analyzer = new Tone.Analyser('waveform', 1024);
    
    // Connect the audio chain
    this.player.chain(this.pitchShift, this.compressor, this.analyzer, Tone.getDestination());
    
    // Set up player callbacks
    this.player.onstop = () => {
      this.isPlaying = false;
      this.emit('trackEnded');
    };
  }

  private setupMeyda(): void {
    // Get the Tone.js audio context
    this.audioContext = Tone.getContext().rawContext as AudioContext;
    
    // Create analyzer for beat detection
    this.meydaAnalyzer = Meyda.createMeydaAnalyzer({
      audioContext: this.audioContext,
      source: this.analyzer.context.rawContext.createAnalyser(), // Will be connected later
      bufferSize: GameConfig.AUDIO_BUFFER_SIZE,
      featureExtractors: [
        'rms',
        'spectralCentroid', 
        'spectralRolloff',
        'spectralFlux',
        'loudness'
      ]
    });

    // Set up real-time analysis
    this.meydaAnalyzer.start();
  }

  public async loadTrack(trackKey: string): Promise<void> {
    try {
      // Check if audio buffer exists in Phaser cache
      const audioBuffer = this.scene.cache.audio.get(trackKey);
      if (audioBuffer) {
        await this.player.load(audioBuffer.url);
        console.log(`AudioManager: Loaded track ${trackKey}`);
      } else {
        // Create a silent audio track for development
        console.log(`AudioManager: Creating silent track for ${trackKey}`);
        this.createSilentTrack();
      }
      
      this.emit('trackLoaded', trackKey);
    } catch (error) {
      console.log(`AudioManager: Using silent track fallback for ${trackKey}`);
      this.createSilentTrack();
    }
  }

  private createSilentTrack(): void {
    // Create a simple silent track for development
    console.log('AudioManager: Using silent track for development');
    
    // For now, just mark the player as loaded with an empty buffer
    // In a production app, this would load an actual audio file
    this.isPlaying = false;
    
    // Simulate that we have a track loaded
    this.simulateBeats();
  }

  private simulateBeats(): void {
    // Create a simple timer to simulate beats at 120 BPM for development
    if (this.beatSimulationInterval) {
      clearInterval(this.beatSimulationInterval);
    }
    
    // Only simulate beats when playing
    this.beatSimulationInterval = setInterval(() => {
      if (this.isPlaying) {
        this.onBeatDetected(Tone.now());
      }
    }, 500); // 120 BPM = 500ms per beat
  }

  private beatSimulationInterval?: NodeJS.Timeout;

  public startTrack(): void {
    // In development mode without real audio, just start the simulation
    this.isPlaying = true;
    this.beatCount = 0;
    this.lastBeatTime = Tone.now();
    
    console.log('AudioManager: Track started (simulation mode)');
    this.emit('trackStarted');
    
    // Start beat simulation for development
    this.simulateBeats();
  }

  public pauseTrack(): void {
    if (this.isPlaying) {
      this.player.stop();
      this.isPlaying = false;
      this.emit('trackPaused');
    }
  }

  public resumeTrack(): void {
    if (!this.isPlaying && this.player.loaded) {
      this.player.start();
      this.isPlaying = true;
      this.emit('trackResumed');
    }
  }

  public setTempo(tempo: number): void {
    const clampedTempo = Phaser.Math.Clamp(
      tempo,
      GameConfig.MIN_TEMPO,
      GameConfig.MAX_TEMPO
    );

    if (clampedTempo === this.currentTempo) return;

    this.targetTempo = clampedTempo;
    
    // Smooth tempo transition
    if (this.tempoTransitionTween) {
      this.tempoTransitionTween.stop();
    }

    this.tempoTransitionTween = this.scene.tweens.addCounter({
      from: this.currentTempo,
      to: this.targetTempo,
      duration: GameConfig.TEMPO_TRANSITION_TIME * 1000,
      ease: 'Power2',
      onUpdate: (tween) => {
        const newTempo = tween.getValue();
        if (typeof newTempo === 'number') {
          this.applyTempo(newTempo);
        }
      },
      onComplete: () => {
        this.currentTempo = this.targetTempo;
        this.emit('tempoChangeComplete', this.currentTempo);
      }
    });

    this.emit('tempoChange', this.targetTempo);
  }

  private applyTempo(tempo: number): void {
    // Apply pitch shift (Tone.js uses semitones)
    const pitchShiftSemitones = Math.log2(tempo) * 12;
    this.pitchShift.pitch = pitchShiftSemitones;
    
    // Apply playback rate change
    this.player.playbackRate = tempo;
    
    this.currentTempo = tempo;
  }

  public update(_delta: number): void {
    if (!this.isPlaying) return;

    // Update audio analysis
    this.updateAudioAnalysis();
    
    // Update beat detection
    this.updateBeatDetection();
  }

  private updateAudioAnalysis(): void {
    try {
      // Get waveform data from Tone.js (for future use)
      // const waveform = this.analyzer.getValue() as Float32Array;
      
      // Get frequency analysis from Meyda
      const features = this.meydaAnalyzer?.get([
        'rms',
        'spectralCentroid',
        'loudness'
      ]);

      if (features) {
        this.audioData.rms = features.rms || 0;
        this.audioData.spectralCentroid = features.spectralCentroid || 0;
        
        // Map frequency bands to platforms (simplified approach)
        // This would be more sophisticated in production
        const loudness = features.loudness?.specific || [];
        if (loudness.length >= 3) {
          this.audioData.frequencyBins[0] = Math.min(1, loudness[0] / 100); // Bass
          this.audioData.frequencyBins[1] = Math.min(1, loudness[1] / 100); // Mid
          this.audioData.frequencyBins[2] = Math.min(1, loudness[2] / 100); // High
        }
      }
    } catch (error) {
      // Silently handle analysis errors
    }
  }

  private updateBeatDetection(): void {
    // In development mode, beats are handled by the simulation timer
    // This function is kept for when real audio analysis is available
    
    const currentTime = Tone.now();
    const energy = this.audioData.rms;
    
    // Only use energy-based detection if we have significant audio data
    if (energy < 0.001) {
      return; // Let simulation handle beats
    }
    
    // Add current energy to circular buffer
    this.beatDetector.energyBuffer[this.beatDetector.bufferIndex] = energy;
    this.beatDetector.bufferIndex = (this.beatDetector.bufferIndex + 1) % this.beatDetector.energyBuffer.length;
    
    // Calculate local average energy
    const avgEnergy = this.beatDetector.energyBuffer.reduce((a, b) => a + b, 0) / this.beatDetector.energyBuffer.length;
    
    // Calculate variance
    const variance = this.beatDetector.energyBuffer.reduce((acc, val) => acc + Math.pow(val - avgEnergy, 2), 0) / this.beatDetector.energyBuffer.length;
    this.beatDetector.variance = variance;
    
    // Beat detection: current energy > threshold * average energy
    const threshold = this.beatThreshold * (1 + variance * 0.5);
    const timeSinceLastBeat = currentTime - this.lastBeatTime;
    
    // Minimum time between beats (prevent false positives)
    const minBeatInterval = 60.0 / 200.0 / this.currentTempo; // Max 200 BPM adjusted for tempo
    
    if (energy > threshold * avgEnergy && 
        energy > this.beatDetector.lastEnergy &&
        timeSinceLastBeat > minBeatInterval) {
      
      this.onBeatDetected(currentTime);
    }
    
    this.beatDetector.lastEnergy = energy;
  }

  private onBeatDetected(time: number): void {
    this.lastBeatTime = time;
    this.beatCount++;
    
    console.log(`Beat detected: ${this.beatCount} at ${time.toFixed(2)}s`);
    this.emit('beat', this.beatCount, time);
  }

  // Public getters
  public getCurrentTempo(): number {
    return this.currentTempo;
  }

  public getAudioData() {
    return { ...this.audioData };
  }

  public isTrackPlaying(): boolean {
    return this.isPlaying;
  }

  public getBeatCount(): number {
    return this.beatCount;
  }

  public getPlaybackPosition(): number {
    return this.player.immediate();
  }

  // Timing utilities for game synchronization
  public scheduleGameEvent(callback: () => void, time: number): void {
    Tone.getTransport().scheduleOnce(callback, time);
  }

  public getAudioLatency(): number {
    return this.audioContext.baseLatency + this.audioContext.outputLatency;
  }

  // Cleanup
  public dispose(): void {
    if (this.tempoTransitionTween) {
      this.tempoTransitionTween.stop();
    }
    
    if (this.beatSimulationInterval) {
      clearInterval(this.beatSimulationInterval);
    }
    
    if (this.meydaAnalyzer) {
      try {
        this.meydaAnalyzer.stop();
      } catch (error) {
        // Ignore disposal errors
      }
    }
    
    if (this.player) {
      try {
        this.player.dispose();
      } catch (error) {
        // Ignore disposal errors
      }
    }
    
    if (this.pitchShift) {
      try {
        this.pitchShift.dispose();
      } catch (error) {
        // Ignore disposal errors
      }
    }
    
    if (this.analyzer) {
      try {
        this.analyzer.dispose();
      } catch (error) {
        // Ignore disposal errors
      }
    }
    
    console.log('AudioManager: Disposed');
  }
}