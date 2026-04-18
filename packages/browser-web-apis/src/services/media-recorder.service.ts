import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import type { BrowserCapabilityId } from './browser-capability.service';

export type RecordingState = 'inactive' | 'recording' | 'paused';

export interface RecordingOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
  timeslice?: number;
}

export interface RecordingResult {
  blob: Blob;
  url: string;
  mimeType: string;
  duration: number;
}

@Injectable()
export class MediaRecorderService extends BrowserApiBaseService {
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime = 0;
  private readonly dataSubject = new Subject<Blob>();
  private readonly stateSubject = new Subject<RecordingState>();

  protected override getApiName(): string {
    return 'media-recorder';
  }

  protected override getCapabilityId(): BrowserCapabilityId {
    return 'mediaRecorder';
  }

  get state(): RecordingState {
    return (this.recorder?.state as RecordingState) ?? 'inactive';
  }

  static isTypeSupported(mimeType: string): boolean {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mimeType);
  }

  watchState(): Observable<RecordingState> {
    return this.stateSubject.asObservable();
  }

  watchData(): Observable<Blob> {
    return this.dataSubject.asObservable();
  }

  async start(stream: MediaStream, options: RecordingOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('MediaRecorder API not supported in this browser');
    }

    if (!window.isSecureContext) {
      throw new Error('MediaRecorder requires a secure context (HTTPS)');
    }

    this.stop();
    this.chunks = [];
    this.startTime = Date.now();

    const { timeslice, ...recorderOptions } = options;

    try {
      this.recorder = new MediaRecorder(stream, recorderOptions);

      this.recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.dataSubject.next(event.data);
        }
      };

      this.recorder.onstart = () => this.stateSubject.next('recording');
      this.recorder.onpause = () => this.stateSubject.next('paused');
      this.recorder.onresume = () => this.stateSubject.next('recording');
      this.recorder.onstop = () => this.stateSubject.next('inactive');

      this.recorder.start(timeslice);
    } catch (error) {
      this.logError('Failed to start recording:', error);
      throw this.createError('Failed to start recording', error);
    }
  }

  pause(): void {
    if (this.recorder?.state === 'recording') {
      this.recorder.pause();
    }
  }

  resume(): void {
    if (this.recorder?.state === 'paused') {
      this.recorder.resume();
    }
  }

  stop(): RecordingResult | null {
    if (!this.recorder || this.recorder.state === 'inactive') {
      return null;
    }

    this.recorder.stop();

    const mimeType = this.recorder.mimeType;
    const duration = Date.now() - this.startTime;
    const blob = new Blob(this.chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);

    this.recorder = null;
    this.chunks = [];

    return { blob, url, mimeType, duration };
  }

  getResult(): RecordingResult | null {
    if (this.chunks.length === 0) return null;
    const mimeType = this.recorder?.mimeType ?? 'video/webm';
    const blob = new Blob(this.chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const duration = Date.now() - this.startTime;
    return { blob, url, mimeType, duration };
  }
}
