import { Injectable, Signal, signal, NgZone, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { Observable, Subject } from 'rxjs';
import { WebCryptoService } from './web-crypto.service';

export interface SecureMessageConfig {
  allowedOrigins: string[];
  signingKey: CryptoKey;
}

export interface SecureMessage<T = unknown> {
  data: T;
  origin: string;
  timestamp: number;
}

/** @internal */
interface SignedEnvelope {
  __signed: true;
  payload: unknown;
  timestamp: number;
  nonce: string;
  signature: string;
}

const REPLAY_WINDOW_MS = 30_000;

@Injectable({
  providedIn: 'root',
})
export class SecureMessageService {
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);
  private readonly crypto = inject(WebCryptoService);

  private config: SecureMessageConfig | null = null;
  private _lastMessage = signal<SecureMessage | null>(null);
  private _messages$ = new Subject<SecureMessage>();
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  private get targetWindow(): Window & typeof globalThis {
    return this.document.defaultView as Window & typeof globalThis;
  }

  /** Returns a new HMAC-SHA-256 CryptoKey ready to use in `configure()`. */
  generateChannelKey(): Promise<CryptoKey> {
    return this.crypto.generateHmacKey('HMAC-SHA-256');
  }

  /**
   * Configures the service with a signing key and allowed origins.
   * Starts listening for incoming messages.
   */
  configure(config: SecureMessageConfig): void {
    this.destroy();
    this.config = config;

    if (!isPlatformBrowser(this.platformId)) return;

    this.ngZone.runOutsideAngular(() => {
      this.messageHandler = (event: MessageEvent) => this.handleMessage(event);
      this.targetWindow.addEventListener('message', this.messageHandler);
    });
  }

  /**
   * Signs and sends a payload to a target window.
   * @throws if `targetOrigin` is `'*'`
   */
  async send<T>(target: Window, payload: T, targetOrigin: string): Promise<void> {
    if (targetOrigin === '*') {
      throw new Error('SecureMessageService: targetOrigin must be an explicit origin, not "*".');
    }

    if (!this.config) {
      throw new Error('SecureMessageService: call configure() before send().');
    }

    const timestamp = Date.now();
    const nonce = this.targetWindow.crypto.randomUUID();
    const body = { payload, timestamp, nonce };
    const signature = await this.crypto.sign(this.config.signingKey, JSON.stringify(body));

    const envelope: SignedEnvelope = { __signed: true, ...body, signature };
    target.postMessage(envelope, targetOrigin);
  }

  /** Observable of verified incoming messages. */
  messages$<T = unknown>(): Observable<SecureMessage<T>> {
    return this._messages$.asObservable() as Observable<SecureMessage<T>>;
  }

  /** Signal with the last verified incoming message (null before first message). */
  lastMessage<T = unknown>(): Signal<SecureMessage<T> | null> {
    return this._lastMessage as Signal<SecureMessage<T> | null>;
  }

  /** Removes the window listener and completes the internal Subject. */
  destroy(): void {
    if (this.messageHandler && isPlatformBrowser(this.platformId)) {
      this.targetWindow.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
    this.config = null;
  }

  private async handleMessage(event: MessageEvent): Promise<void> {
    if (!this.config) return;

    // 1. Origin whitelist
    if (!this.config.allowedOrigins.includes(event.origin)) return;

    // 2. Envelope shape
    const env = event.data as Partial<SignedEnvelope>;
    if (env?.__signed !== true) return;

    const { payload, timestamp, nonce, signature } = env;
    if (!payload || !timestamp || !nonce || !signature) return;

    // 3. Replay window
    if (Date.now() - timestamp > REPLAY_WINDOW_MS) return;

    // 4. Signature verification
    const body = { payload, timestamp, nonce };
    const valid = await this.crypto.verify(this.config.signingKey, JSON.stringify(body), signature);
    if (!valid) return;

    // 5. Emit inside NgZone so signals trigger CD
    this.ngZone.run(() => {
      const message: SecureMessage = { data: payload, origin: event.origin, timestamp };
      this._lastMessage.set(message);
      this._messages$.next(message);
    });
  }
}
