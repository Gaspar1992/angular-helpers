import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from '@angular-helpers/browser-web-apis';

export interface PasswordCredentialData {
  id: string;
  password: string;
  name?: string;
  iconURL?: string;
}

export interface PublicKeyCredentialOptions {
  challenge: BufferSource;
  rp: { name: string; id?: string };
  user: {
    id: BufferSource;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{ type: 'public-key'; alg: number }>;
  timeout?: number;
  attestation?: AttestationConveyancePreference;
  authenticatorSelection?: AuthenticatorSelectionCriteria;
}

export interface CredentialResult {
  id: string;
  type: string;
}

@Injectable()
export class CredentialManagementService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'credential-management';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'credentials' in navigator;
  }

  isPublicKeySupported(): boolean {
    return this.isSupported() && 'PublicKeyCredential' in window;
  }

  async get(options?: CredentialRequestOptions): Promise<Credential | null> {
    if (!this.isSupported()) {
      throw new Error('Credential Management API not supported');
    }
    return navigator.credentials.get(options);
  }

  async store(credential: Credential): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('Credential Management API not supported');
    }
    await navigator.credentials.store(credential);
  }

  async createPasswordCredential(data: PasswordCredentialData): Promise<Credential> {
    if (!this.isSupported()) {
      throw new Error('Credential Management API not supported');
    }
    return navigator.credentials.create({
      password: data,
    } as CredentialCreationOptions) as Promise<Credential>;
  }

  async createPublicKeyCredential(options: PublicKeyCredentialOptions): Promise<Credential | null> {
    if (!this.isPublicKeySupported()) {
      throw new Error('PublicKeyCredential API not supported');
    }
    return navigator.credentials.create({
      publicKey: options as unknown as PublicKeyCredentialCreationOptions,
    });
  }

  async preventSilentAccess(): Promise<void> {
    if (!this.isSupported()) return;
    await navigator.credentials.preventSilentAccess();
  }

  async isConditionalMediationAvailable(): Promise<boolean> {
    if (!this.isPublicKeySupported()) return false;
    if ('isConditionalMediationAvailable' in PublicKeyCredential) {
      return (
        PublicKeyCredential as unknown as {
          isConditionalMediationAvailable: () => Promise<boolean>;
        }
      ).isConditionalMediationAvailable();
    }
    return false;
  }
}
