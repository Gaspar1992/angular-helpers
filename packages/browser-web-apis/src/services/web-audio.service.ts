import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';

export type AudioContextState = 'suspended' | 'running' | 'closed';

export interface AudioAnalyserData {
  frequencyData: Uint8Array;
  timeDomainData: Uint8Array;
}

@Injectable()
export class WebAudioService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'web-audio';
  }

  private context: AudioContext | null = null;

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'AudioContext' in window;
  }

  getContext(): AudioContext {
    if (!this.isSupported()) {
      throw new Error('Web Audio API not supported');
    }
    if (!this.context || this.context.state === 'closed') {
      this.context = new AudioContext();
      this.destroyRef.onDestroy(() => this.close());
    }
    return this.context;
  }

  async resume(): Promise<void> {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  async close(): Promise<void> {
    if (this.context && this.context.state !== 'closed') {
      await this.context.close();
      this.context = null;
    }
  }

  getState(): AudioContextState {
    return (this.context?.state ?? 'closed') as AudioContextState;
  }

  createOscillator(type: OscillatorType = 'sine', frequency = 440): OscillatorNode {
    const ctx = this.getContext();
    const oscillator = ctx.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    return oscillator;
  }

  createGain(value = 1): GainNode {
    const ctx = this.getContext();
    const gain = ctx.createGain();
    gain.gain.value = value;
    return gain;
  }

  createAnalyser(fftSize = 2048): AnalyserNode {
    const ctx = this.getContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = fftSize;
    return analyser;
  }

  watchAnalyser(analyser: AnalyserNode, intervalMs = 50): Observable<AudioAnalyserData> {
    return new Observable<AudioAnalyserData>((subscriber) => {
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      const timeDomainData = new Uint8Array(analyser.frequencyBinCount);

      const interval = setInterval(() => {
        analyser.getByteFrequencyData(frequencyData);
        analyser.getByteTimeDomainData(timeDomainData);
        subscriber.next({
          frequencyData: new Uint8Array(frequencyData),
          timeDomainData: new Uint8Array(timeDomainData),
        });
      }, intervalMs);

      return () => clearInterval(interval);
    });
  }

  async decodeAudioData(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = this.getContext();
    return ctx.decodeAudioData(arrayBuffer);
  }

  playBuffer(buffer: AudioBuffer, loop = false): AudioBufferSourceNode {
    const ctx = this.getContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    source.connect(ctx.destination);
    source.start(0);
    return source;
  }
}
