import { SOUND_NOTES, midiToFrequency, type SoundId, type SoundNote } from '../../lib/sounds';
import type { SoundPlayer } from './port';

const MASTER_VOLUME = 0.6;
const ATTACK_SECONDS = 0.005;
const SILENCE = 0.0001;
const STOP_MARGIN_SECONDS = 0.05;

const isAudioSupported = (): boolean => typeof AudioContext !== 'undefined';

export class WebAudioSoundPlayer implements SoundPlayer {
  private context: AudioContext | null = null;
  private output: AudioNode | null = null;

  play(id: SoundId): void {
    const context = this.ensureContext();
    if (!context || !this.output) return;
    if (context.state !== 'running') {
      void context.resume();
      return;
    }
    const output = this.output;
    SOUND_NOTES[id].forEach((n) => this.scheduleNote(context, output, n, context.currentTime));
  }

  unlock(): void {
    const context = this.ensureContext();
    if (context && context.state !== 'running') void context.resume();
  }

  private ensureContext(): AudioContext | null {
    if (this.context) return this.context;
    if (!isAudioSupported()) return null;
    const context = new AudioContext();
    const compressor = context.createDynamicsCompressor();
    const master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    compressor.connect(master);
    master.connect(context.destination);
    this.context = context;
    this.output = compressor;
    return context;
  }

  private scheduleNote(
    context: AudioContext,
    output: AudioNode,
    sound: SoundNote,
    baseTime: number
  ): void {
    const start = baseTime + sound.startSeconds;
    const end = start + sound.durationSeconds;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = sound.wave;
    oscillator.frequency.value = midiToFrequency(sound.midi);
    envelope.gain.setValueAtTime(SILENCE, start);
    envelope.gain.exponentialRampToValueAtTime(sound.volume, start + ATTACK_SECONDS);
    envelope.gain.exponentialRampToValueAtTime(SILENCE, end);
    oscillator.connect(envelope);
    envelope.connect(output);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(end + STOP_MARGIN_SECONDS);
  }
}
