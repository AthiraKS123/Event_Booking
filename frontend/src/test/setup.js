import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

// Mock Web Audio API for Gatekeeper audioFeedback
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
        linearRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }
  get destination() {
    return {};
  }
}

window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;
