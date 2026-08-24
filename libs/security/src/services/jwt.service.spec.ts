import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { JwtService, InvalidJwtError, JwtStandardClaims } from './jwt.service';

function createToken(header: object, payload: object, signature = 'mockSignature'): string {
  const b64 = (obj: object) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64(header)}.${b64(payload)}.${signature}`;
}

describe('JwtService', () => {
  let service: JwtService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [JwtService],
    });
    service = TestBed.inject(JwtService);
  });

  describe('InvalidJwtError', () => {
    it('creates instance of error with correct name and message', () => {
      const err = new InvalidJwtError('Test error');
      expect(err).toBeInstanceOf(Error);
      expect(err.name).toBe('InvalidJwtError');
      expect(err.message).toBe('Test error');
    });
  });

  describe('decode', () => {
    it('decodes a valid JWT payload correctly', () => {
      const payload: JwtStandardClaims = {
        sub: '12345',
        iss: 'auth.example.com',
        exp: Math.floor(Date.now() / 1000) + 3600,
      };
      const token = createToken({ alg: 'HS256', typ: 'JWT' }, payload);

      const decoded = service.decode(token);
      expect(decoded.sub).toBe('12345');
      expect(decoded.iss).toBe('auth.example.com');
      expect(decoded.exp).toBe(payload.exp);
    });

    it('handles base64url characters (- and _) and padding', () => {
      // payload with binary chars or characters that generate '-' and '_'
      const payload = { test: ' subjects >>> ??? ~~~ @@ 123456 ' };
      const token = createToken({ alg: 'none' }, payload);

      const decoded = service.decode<{ test: string }>(token);
      expect(decoded.test).toBe(payload.test);
    });

    it('throws InvalidJwtError for empty token', () => {
      expect(() => service.decode('')).toThrow(InvalidJwtError);
      expect(() => service.decode(null as any)).toThrow(InvalidJwtError);
    });

    it('throws InvalidJwtError when token does not have 3 segments', () => {
      expect(() => service.decode('segment1.segment2')).toThrow(/must have 3 segments/);
      expect(() => service.decode('seg1.seg2.seg3.seg4')).toThrow(/must have 3 segments/);
    });

    it('throws InvalidJwtError when payload is invalid base64url', () => {
      expect(() => service.decode('header.!!!invalid-base64!!!.signature')).toThrow(
        /not valid base64url/,
      );
    });

    it('throws InvalidJwtError when payload is valid base64 but not valid JSON', () => {
      const invalidJsonB64 = btoa('not a json object').replace(/=/g, '');
      expect(() => service.decode(`header.${invalidJsonB64}.signature`)).toThrow(/not valid JSON/);
    });
  });

  describe('isExpired', () => {
    it('returns false for a token with future expiration', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 120; // 2 min ahead
      const token = createToken({ alg: 'HS256' }, { exp: futureExp });
      expect(service.isExpired(token)).toBe(false);
    });

    it('returns true for a token with past expiration', () => {
      const pastExp = Math.floor(Date.now() / 1000) - 120; // 2 min ago
      const token = createToken({ alg: 'HS256' }, { exp: pastExp });
      expect(service.isExpired(token)).toBe(true);
    });

    it('respects leewaySeconds parameter', () => {
      // Token expired 10 seconds ago
      const slightlyPastExp = Math.floor(Date.now() / 1000) - 10;
      const token = createToken({ alg: 'HS256' }, { exp: slightlyPastExp });

      // Without leeway: expired
      expect(service.isExpired(token, 0)).toBe(true);
      // With 30s leeway: not considered expired yet
      expect(service.isExpired(token, 30)).toBe(false);
    });

    it('returns true when exp claim is missing or non-numeric (fail-secure)', () => {
      const tokenNoExp = createToken({ alg: 'HS256' }, { sub: 'user' });
      expect(service.isExpired(tokenNoExp)).toBe(true);

      const tokenBadExp = createToken({ alg: 'HS256' }, { exp: 'tomorrow' });
      expect(service.isExpired(tokenBadExp)).toBe(true);
    });

    it('returns true when token is malformed', () => {
      expect(service.isExpired('bad.token')).toBe(true);
    });
  });

  describe('expiresIn', () => {
    it('returns remaining milliseconds for future token', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const futureExp = Math.floor(now / 1000) + 60; // 60 seconds
      const token = createToken({ alg: 'HS256' }, { exp: futureExp });

      const remaining = service.expiresIn(token);
      expect(remaining).toBe(futureExp * 1000 - now);
    });

    it('returns negative number when token is already expired', () => {
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const pastExp = Math.floor(now / 1000) - 30;
      const token = createToken({ alg: 'HS256' }, { exp: pastExp });

      expect(service.expiresIn(token)).toBeLessThan(0);
    });

    it('returns 0 when exp is missing or non-numeric', () => {
      const token = createToken({ alg: 'HS256' }, { sub: 'user' });
      expect(service.expiresIn(token)).toBe(0);
    });

    it('returns -1 when token is malformed', () => {
      expect(service.expiresIn('invalid-token')).toBe(-1);
    });
  });

  describe('claim', () => {
    it('extracts existing claim by name', () => {
      const token = createToken(
        { alg: 'HS256' },
        { sub: 'user123', email: 'user@test.com', role: 'admin' },
      );

      expect(service.claim(token, 'sub')).toBe('user123');
      expect(service.claim(token, 'email')).toBe('user@test.com');
      expect(service.claim(token, 'role')).toBe('admin');
    });

    it('returns null when claim is absent', () => {
      const token = createToken({ alg: 'HS256' }, { sub: 'user123' });
      expect(service.claim(token, 'non_existent')).toBeNull();
    });

    it('returns null when token is invalid', () => {
      expect(service.claim('bad.token', 'sub')).toBeNull();
    });
  });
});
