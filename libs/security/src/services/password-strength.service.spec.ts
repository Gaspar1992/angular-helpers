import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PasswordStrengthService } from './password-strength.service';

describe('PasswordStrengthService', () => {
  let service: PasswordStrengthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PasswordStrengthService],
    });
    service = TestBed.inject(PasswordStrengthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('assesses empty password as score 0 (very-weak)', () => {
    const res = service.assess('');
    expect(res.score).toBe(0);
    expect(res.label).toBe('very-weak');
    expect(res.entropy).toBe(0);
  });

  it('assesses short simple password as weak', () => {
    const res = service.assess('abc');
    expect(res.score).toBe(0);
    expect(res.label).toBe('very-weak');
  });

  it('assesses common dictionary password as score <= 1', () => {
    const res = service.assess('password');
    expect(res.score).toBeLessThanOrEqual(1);
  });

  it('assesses medium complexity password correctly', () => {
    const res = service.assess('P@ssw0rd!');
    expect(res.score).toBeGreaterThanOrEqual(2);
    expect(res.entropy).toBeGreaterThan(30);
  });

  it('assesses very strong complex password', () => {
    const res = service.assess('xK#9mZ$vLq2@rBnT7-extra-entropy');
    expect(res.score).toBe(4);
    expect(res.label).toBe('very-strong');
    expect(res.entropy).toBeGreaterThanOrEqual(70);
  });
});
