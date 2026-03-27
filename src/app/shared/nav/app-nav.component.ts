import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <a href="#main-content" class="skip-link">Skip to content</a>
    <header class="app-nav" role="banner">
      <div class="nav-brand">
        <a routerLink="/" class="brand-link" aria-label="Angular Helpers home">
          <img src="icon.webp" alt="" class="brand-icon" aria-hidden="true" />
          <span class="brand-name">Angular Helpers</span>
        </a>
      </div>
      <nav aria-label="Main navigation">
        <ul role="list" class="nav-links">
          <li>
            <a
              routerLink="/demo"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
              class="nav-link"
            >
              Demo
            </a>
          </li>
          <li>
            <a
              routerLink="/docs"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: false }"
              class="nav-link"
            >
              Docs
            </a>
          </li>
        </ul>
      </nav>
    </header>
  `,
  styles: [
    `
      .skip-link {
        position: absolute;
        top: -100px;
        left: var(--sp-2);
        background: var(--accent);
        color: var(--text-white);
        padding: var(--sp-2) var(--sp-4);
        border-radius: 0 0 var(--radius-sm) var(--radius-sm);
        font-size: var(--text-base);
        font-weight: 600;
        z-index: 9999;
        text-decoration: none;
      }

      .skip-link:focus {
        top: 0;
      }

      .app-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--sp-6);
        height: 56px;
        background: rgba(10, 10, 20, 0.94);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .nav-brand {
        display: flex;
        align-items: center;
      }

      .brand-link {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        text-decoration: none;
        color: var(--text-white);
        transition: opacity var(--transition);
      }

      .brand-link:hover {
        opacity: 0.85;
      }

      .brand-icon {
        width: 28px;
        height: 28px;
        object-fit: contain;
      }

      .brand-name {
        font-weight: 700;
        font-size: 1rem;
        letter-spacing: -0.02em;
        color: var(--text-white);
      }

      nav ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        gap: var(--sp-1);
      }

      .nav-link {
        display: inline-block;
        padding: 0.38rem var(--sp-3);
        font-size: var(--text-base);
        font-weight: 500;
        color: #b0b8d0;
        text-decoration: none;
        border-radius: var(--radius-md);
        transition: color var(--transition), background var(--transition);
      }

      .nav-link:hover {
        color: var(--text-white);
        background: var(--bg-hover);
      }

      .nav-link:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 2px;
      }

      .nav-link.active {
        color: var(--text-white);
        background: var(--accent-dim);
      }
    `,
  ],
})
export class AppNavComponent {}
