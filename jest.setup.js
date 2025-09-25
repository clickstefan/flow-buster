// Jest setup file
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  createAnalyser: jest.fn(),
  createGain: jest.fn(),
  createOscillator: jest.fn(),
  destination: {},
  sampleRate: 44100
}));

// Mock Canvas API for Phaser
HTMLCanvasElement.prototype.getContext = jest.fn();