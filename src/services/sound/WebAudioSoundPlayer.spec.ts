import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SOUND_NOTES } from '../../lib/sounds';
import { WebAudioSoundPlayer } from './WebAudioSoundPlayer';

const createdOscillators: { start: ReturnType<typeof vi.fn> }[] = [];
const suspendedContexts: FakeAudioContext[] = [];

const param = () => ({
  value: 0,
  setValueAtTime: vi.fn(),
  exponentialRampToValueAtTime: vi.fn(),
});

class FakeAudioContext {
  state: AudioContextState = 'running';
  constructor() {
    suspendedContexts.push(this);
  }
  currentTime = 1;
  destination = {};
  resume = vi.fn(() => {
    this.state = 'running';
    return Promise.resolve();
  });
  createGain = () => ({ gain: param(), connect: vi.fn(), disconnect: vi.fn() });
  createDynamicsCompressor = () => ({ connect: vi.fn() });
  createOscillator = () => {
    const oscillator = {
      type: 'sine',
      frequency: param(),
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    };
    createdOscillators.push(oscillator);
    return oscillator;
  };
}

describe('WebAudioSoundPlayer', () => {
  beforeEach(() => {
    createdOscillators.length = 0;
    suspendedContexts.length = 0;
    vi.stubGlobal('AudioContext', FakeAudioContext);
  });

  it('schedules one oscillator per note of the sound', () => {
    const player = new WebAudioSoundPlayer();
    player.unlock();
    player.play('correct');
    expect(createdOscillators).toHaveLength(SOUND_NOTES.correct.length);
    createdOscillators.forEach((o) => expect(o.start).toHaveBeenCalled());
  });

  it('plays a sound requested while suspended once the context resumes', async () => {
    const player = new WebAudioSoundPlayer();
    await player.unlock();
    suspendedContexts.forEach((c) => (c.state = 'suspended'));
    player.play('correct');
    await Promise.resolve();
    await Promise.resolve();
    expect(createdOscillators).toHaveLength(SOUND_NOTES.correct.length);
  });

  it('plays nothing when the context refuses to resume', async () => {
    const player = new WebAudioSoundPlayer();
    await player.unlock();
    suspendedContexts.forEach((c) => {
      c.state = 'suspended';
      c.resume = vi.fn(() => Promise.reject(new Error('blocked')));
    });
    player.play('correct');
    await Promise.resolve();
    await Promise.resolve();
    expect(createdOscillators).toHaveLength(0);
  });

  it('is a silent no-op when Web Audio is unavailable', () => {
    vi.stubGlobal('AudioContext', undefined);
    const player = new WebAudioSoundPlayer();
    expect(() => {
      player.unlock();
      player.play('correct');
    }).not.toThrow();
    expect(createdOscillators).toHaveLength(0);
  });
});
