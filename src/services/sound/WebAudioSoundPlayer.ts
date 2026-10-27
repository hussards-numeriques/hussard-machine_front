import { SOUND_NOTES, midiToFrequency, type Sound, type SoundNote } from '../../lib/sounds';
import type { SoundPlayer } from './port';

const MASTER_VOLUME = 0.6;
const ATTACK_SECONDS = 0.005;
const SILENCE = 0.0001;
const STOP_MARGIN_SECONDS = 0.05;

const isRunning = (context: AudioContext): boolean => context.state === 'running';

const isAudioSupported = (): boolean => typeof AudioContext !== 'undefined';

export class WebAudioSoundPlayer implements SoundPlayer {
  private context: AudioContext | null = null;
  private output: AudioNode | null = null;

  play(sound: Sound): void {
    const context = this.ensureContext();
    if (!context || !this.output) return;
    if (isRunning(context)) {
      this.schedule(context, this.output, sound);
      return;
    }
    const output = this.output;
    void this.resume(context).then((running) => {
      if (running) this.schedule(context, output, sound);
    });
  }

  unlock(): Promise<boolean> {
    const context = this.ensureContext();
    return context ? this.resume(context) : Promise.resolve(false);
  }

  private async resume(context: AudioContext): Promise<boolean> {
    if (isRunning(context)) return true;
    try {
      await context.resume();
    } catch {
      return false;
    }
    return isRunning(context);
  }

  private schedule(context: AudioContext, output: AudioNode, sound: Sound): void {
    const notes = typeof sound === 'string' ? SOUND_NOTES[sound] : sound;
    notes.forEach((n) => this.scheduleNote(context, output, n, context.currentTime));
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
