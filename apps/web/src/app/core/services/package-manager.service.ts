import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

const STORAGE_KEY = 'ah-preferred-pm';
const VALID_PMS: readonly PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun'];

@Injectable({
  providedIn: 'root',
})
export class PackageManagerService {
  private readonly platformId = inject(PLATFORM_ID);
  readonly current = signal<PackageManager>(this.loadInitial());

  private loadInitial(): PackageManager {
    if (!isPlatformBrowser(this.platformId)) {
      return 'pnpm';
    }
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as PackageManager | null;
      return saved && VALID_PMS.includes(saved) ? saved : 'pnpm';
    } catch {
      return 'pnpm';
    }
  }

  setPackageManager(pm: PackageManager): void {
    this.current.set(pm);
    if (isPlatformBrowser(this.platformId)) {
      try {
        window.localStorage.setItem(STORAGE_KEY, pm);
      } catch {
        // Ignore storage errors in restricted environments
      }
    }
  }

  getInstallCommand(npmPackage: string): string {
    switch (this.current()) {
      case 'npm':
        return `npm install ${npmPackage}`;
      case 'yarn':
        return `yarn add ${npmPackage}`;
      case 'bun':
        return `bun add ${npmPackage}`;
      case 'pnpm':
      default:
        return `pnpm add ${npmPackage}`;
    }
  }
}
