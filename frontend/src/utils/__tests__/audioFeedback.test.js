import { describe, it, expect, vi, beforeEach } from 'vitest';
import { soundEffects } from '../audioFeedback';

describe('audioFeedback soundEffects', () => {
  beforeEach(() => {
    soundEffects.ctx = null;
  });

  it('plays success chime without throwing errors', () => {
    expect(() => soundEffects.playSuccess()).not.toThrow();
    expect(soundEffects.ctx).not.toBeNull();
  });

  it('plays warning buzz without throwing errors', () => {
    expect(() => soundEffects.playWarning()).not.toThrow();
    expect(soundEffects.ctx).not.toBeNull();
  });

  it('plays error buzz without throwing errors', () => {
    expect(() => soundEffects.playError()).not.toThrow();
    expect(soundEffects.ctx).not.toBeNull();
  });

  it('handles environment gracefully when AudioContext is unsupported', () => {
    const originalAudioContext = window.AudioContext;
    const originalWebkit = window.webkitAudioContext;

    delete window.AudioContext;
    delete window.webkitAudioContext;
    soundEffects.ctx = null;

    expect(() => soundEffects.playSuccess()).not.toThrow();
    expect(() => soundEffects.playWarning()).not.toThrow();
    expect(() => soundEffects.playError()).not.toThrow();

    window.AudioContext = originalAudioContext;
    window.webkitAudioContext = originalWebkit;
  });
});
