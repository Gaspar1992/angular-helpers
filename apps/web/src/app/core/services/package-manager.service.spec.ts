import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, afterEach } from 'vitest';
import { PackageManagerService } from './package-manager.service';

describe('PackageManagerService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    window.localStorage.clear();
  });

  it('defaults to pnpm and generates install commands for all supported managers', () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });

    const service = TestBed.inject(PackageManagerService);
    expect(service.current()).toBe('pnpm');
    expect(service.getInstallCommand('@angular-helpers/core')).toBe(
      'pnpm add @angular-helpers/core',
    );

    service.setPackageManager('npm');
    expect(service.getInstallCommand('@angular-helpers/core')).toBe(
      'npm install @angular-helpers/core',
    );

    service.setPackageManager('yarn');
    expect(service.getInstallCommand('@angular-helpers/core')).toBe(
      'yarn add @angular-helpers/core',
    );

    service.setPackageManager('bun');
    expect(service.getInstallCommand('@angular-helpers/core')).toBe(
      'bun add @angular-helpers/core',
    );
  });
});
