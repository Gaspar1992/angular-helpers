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
        left: 0.5rem;
        background: #6b8cf2;
        color: #fff;
        padding: 0.5rem 1rem;
        border-radius: 0 0 4px 4px;
        font-size: 0.875rem;
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
        padding: 0 1.5rem;
        height: 56px;
        background: rgba(10, 10, 20, 0.92);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
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
        gap: 0.6rem;
        text-decoration: none;
        color: #fff;
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
        color: #fff;
      }

      nav ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        gap: 0.25rem;
      }

      .nav-link {
        display: inline-block;
        padding: 0.4rem 0.9rem;
        font-size: 0.875rem;
        font-weight: 500;
        color: #b0b8d0;
        text-decoration: none;
        border-radius: 6px;
        transition: color 0.15s, background 0.15s;
      }

      .nav-link:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.07);
      }

      .nav-link:focus-visible {
        outline: 2px solid #6b8cf2;
        outline-offset: 2px;
      }

      .nav-link.active {
        color: #fff;
        background: rgba(107, 140, 242, 0.15);
      }
    `,
  ],
})
export class AppNavComponent {}
