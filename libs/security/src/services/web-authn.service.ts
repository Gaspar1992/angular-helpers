import { Injectable } from '@angular/core';

// --- JSON Interfaces for WebAuthn ---

export interface PublicKeyCredentialUserEntityJSON {
  id: string; // base64url
  name: string;
  displayName: string;
}

export interface PublicKeyCredentialDescriptorJSON {
  id: string; // base64url
  type: PublicKeyCredentialType;
  transports?: AuthenticatorTransport[];
}

export interface PublicKeyCredentialCreationOptionsJSON {
  challenge: string; // base64url
  rp: PublicKeyCredentialRpEntity;
  user: PublicKeyCredentialUserEntityJSON;
  pubKeyCredParams: PublicKeyCredentialParameters[];
  timeout?: number;
  excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
  authenticatorSelection?: AuthenticatorSelectionCriteria;
  attestation?: AttestationConveyancePreference;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface AuthenticatorAttestationResponseJSON {
  clientDataJSON: string; // base64url
  attestationObject: string; // base64url
  authenticatorData?: string; // base64url
  transports?: AuthenticatorTransport[];
  publicKeyAlgorithm?: number;
  publicKey?: string; // base64url
}

export interface PublicKeyCredentialRegistrationJSON {
  id: string;
  rawId: string; // base64url
  response: AuthenticatorAttestationResponseJSON;
  type: 'public-key';
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  authenticatorAttachment?: AuthenticatorAttachment;
}

export interface PublicKeyCredentialRequestOptionsJSON {
  challenge: string; // base64url
  timeout?: number;
  rpId?: string;
  allowCredentials?: PublicKeyCredentialDescriptorJSON[];
  userVerification?: UserVerificationRequirement;
  extensions?: AuthenticationExtensionsClientInputs;
}

export interface AuthenticatorAssertionResponseJSON {
  clientDataJSON: string; // base64url
  authenticatorData: string; // base64url
  signature: string; // base64url
  userHandle?: string; // base64url
}

export interface PublicKeyCredentialAuthenticationJSON {
  id: string;
  rawId: string; // base64url
  response: AuthenticatorAssertionResponseJSON;
  type: 'public-key';
  clientExtensionResults: AuthenticationExtensionsClientOutputs;
  authenticatorAttachment?: AuthenticatorAttachment;
}

/**
 * Service to facilitate WebAuthn (Passkeys) registration and authentication.
 * Translates between browser binary ArrayBuffers and JSON-friendly base64url strings.
 */
@Injectable({
  providedIn: 'root',
})
export class WebAuthnService {
  /**
   * Checks if WebAuthn is supported in the current environment.
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      !!window.navigator &&
      !!window.navigator.credentials &&
      typeof window.PublicKeyCredential === 'function'
    );
  }

  /**
   * Checks if a platform authenticator (e.g. Touch ID, Face ID, Windows Hello) is available.
   */
  async isPlatformAuthenticatorAvailable(): Promise<boolean> {
    if (!this.isSupported()) {
      return false;
    }
    return PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  }

  /**
   * Triggers WebAuthn registration (credential creation).
   */
  async register(
    options: PublicKeyCredentialCreationOptionsJSON,
  ): Promise<PublicKeyCredentialRegistrationJSON> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser.');
    }

    const creationOptions: PublicKeyCredentialCreationOptions = {
      ...options,
      challenge: this.base64urlToBuffer(options.challenge),
      user: {
        ...options.user,
        id: this.base64urlToBuffer(options.user.id),
      },
      excludeCredentials: options.excludeCredentials?.map((cred) => ({
        ...cred,
        id: this.base64urlToBuffer(cred.id),
      })),
    };

    const credential = (await navigator.credentials.create({
      publicKey: creationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Credential creation failed or was cancelled.');
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    // Optional fields from WebAuthn L3 / browser-specific implementations
    const transports = response.getTransports
      ? (response.getTransports() as AuthenticatorTransport[])
      : undefined;
    const publicKey = (response as any).getPublicKey
      ? this.bufferToBase64url((response as any).getPublicKey())
      : undefined;
    const publicKeyAlgorithm = (response as any).getPublicKeyAlgorithm
      ? (response as any).getPublicKeyAlgorithm()
      : undefined;
    const authenticatorData = (response as any).getAuthenticatorData
      ? this.bufferToBase64url((response as any).getAuthenticatorData())
      : undefined;

    return {
      id: credential.id,
      rawId: this.bufferToBase64url(credential.rawId),
      type: 'public-key',
      response: {
        clientDataJSON: this.bufferToBase64url(response.clientDataJSON),
        attestationObject: this.bufferToBase64url(response.attestationObject),
        transports,
        publicKey,
        publicKeyAlgorithm,
        authenticatorData,
      },
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment:
        (credential.authenticatorAttachment as AuthenticatorAttachment) ?? undefined,
    };
  }

  /**
   * Triggers WebAuthn authentication (credential assertion).
   */
  async authenticate(
    options: PublicKeyCredentialRequestOptionsJSON,
  ): Promise<PublicKeyCredentialAuthenticationJSON> {
    if (!this.isSupported()) {
      throw new Error('WebAuthn is not supported in this browser.');
    }

    const requestOptions: PublicKeyCredentialRequestOptions = {
      ...options,
      challenge: this.base64urlToBuffer(options.challenge),
      allowCredentials: options.allowCredentials?.map((cred) => ({
        ...cred,
        id: this.base64urlToBuffer(cred.id),
      })),
    };

    const credential = (await navigator.credentials.get({
      publicKey: requestOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      throw new Error('Credential assertion failed or was cancelled.');
    }

    const response = credential.response as AuthenticatorAssertionResponse;

    return {
      id: credential.id,
      rawId: this.bufferToBase64url(credential.rawId),
      type: 'public-key',
      response: {
        clientDataJSON: this.bufferToBase64url(response.clientDataJSON),
        authenticatorData: this.bufferToBase64url(response.authenticatorData),
        signature: this.bufferToBase64url(response.signature),
        userHandle: response.userHandle ? this.bufferToBase64url(response.userHandle) : undefined,
      },
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment:
        (credential.authenticatorAttachment as AuthenticatorAttachment) ?? undefined,
    };
  }

  /**
   * Converts an ArrayBuffer to a base64url-encoded string.
   */
  bufferToBase64url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  /**
   * Converts a base64url-encoded string to an ArrayBuffer.
   */
  base64urlToBuffer(base64url: string): ArrayBuffer {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) {
      base64 += '='.repeat(4 - pad);
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
