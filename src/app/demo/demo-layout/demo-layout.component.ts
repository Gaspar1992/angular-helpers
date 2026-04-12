import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

interface DemoTab {
  path: string;
  label: string;
  icon: string;
}

const DEMO_TABS: DemoTab[] = [
  { path: '/demo', label: 'Home', icon: '🏠' },
  { path: '/demo/browser-apis', label: 'Browser APIs', icon: '🌐' },
  { path: '/demo/security', label: 'Security', icon: '🔐' },
  { path: '/demo/worker-http', label: 'Worker HTTP', icon: '⚡' },
  { path: '/demo/library-services', label: 'Library', icon: '📦' },
];

@Component({
  selector: 'app-demo-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="demo-layout">
      <header class="demo-header">
        <div class="demo-header-content">
          <a routerLink="/" class="demo-logo">
            <span class="demo-logo-icon">⚡</span>
            <span class="demo-logo-text">Angular Helpers</span>
          </a>
          <nav class="demo-nav">
            @for (tab of tabs; track tab.path) {
              <a
                [routerLink]="tab.path"
                routerLinkActive="demo-nav-item--active"
                [routerLinkActiveOptions]="{ exact: tab.path === '/demo' }"
                class="demo-nav-item"
              >
                <span class="demo-nav-icon">{{ tab.icon }}</span>
                <span class="demo-nav-label">{{ tab.label }}</span>
              </a>
            }
          </nav>
          <a routerLink="/docs" class="demo-docs-link"> Documentation → </a>
        </div>
      </header>

      <main class="demo-main">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [
    `
      .demo-layout {
        min-height: 100vh;
        background: var(--bg);
        display: flex;
        flex-direction: column;
      }

      .demo-header {
        background: var(--bg-elevated);
        border-bottom: 1px solid var(--border);
        position: sticky;
        top: 0;
        z-index: 100;
      }

      .demo-header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: var(--sp-3) var(--sp-4);
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--sp-3);
      }

      @media (min-width: 768px) {
        .demo-header-content {
          gap: var(--sp-6);
        }
      }

      .demo-logo {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        text-decoration: none;
        color: var(--text);
        font-weight: 600;
        font-size: var(--text-lg);
      }

      .demo-logo-icon {
        font-size: 1.25em;
      }

      .demo-logo-text {
        background: linear-gradient(135deg, var(--accent), var(--accent-light));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .demo-nav {
        display: flex;
        gap: var(--sp-1);
        flex: 1;
        justify-content: center;
        overflow-x: auto;
        scrollbar-width: none;
        -ms-overflow-style: none;
        padding: var(--sp-1) 0;
        min-width: 0;
      }

      .demo-nav::-webkit-scrollbar {
        display: none;
      }

      @media (max-width: 640px) {
        .demo-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg-elevated);
          border-top: 1px solid var(--border);
          padding: var(--sp-2) var(--sp-4);
          justify-content: space-around;
          z-index: 100;
        }
        .demo-main {
          padding-bottom: 80px;
        }
      }

      .demo-nav-item {
        display: flex;
        align-items: center;
        gap: var(--sp-2);
        padding: var(--sp-2) var(--sp-3);
        border-radius: var(--radius-lg);
        text-decoration: none;
        color: var(--text-muted);
        font-size: var(--text-sm);
        font-weight: 500;
        transition: all var(--transition);
      }

      .demo-nav-item:hover {
        background: var(--surface-hover);
        color: var(--text);
      }

      .demo-nav-item--active {
        background: var(--accent);
        color: white;
      }

      .demo-nav-icon {
        font-size: 1.1em;
      }

      .demo-nav-label {
        display: none;
      }

      @media (min-width: 768px) {
        .demo-nav-label {
          display: inline;
        }
      }

      @media (max-width: 480px) {
        .demo-nav-item {
          padding: var(--sp-1);
          flex-direction: column;
          gap: var(--sp-1);
          font-size: var(--text-xs);
        }
        .demo-nav-icon {
          font-size: 1.3em;
        }
        .demo-logo-text {
          display: none;
        }
        .demo-docs-link {
          display: none;
        }
      }

      .demo-docs-link {
        color: var(--accent);
        text-decoration: none;
        font-size: var(--text-sm);
        font-weight: 500;
        white-space: nowrap;
      }

      .demo-docs-link:hover {
        text-decoration: underline;
      }

      .demo-main {
        flex: 1;
        padding: var(--sp-6) var(--sp-4);
        max-width: 1200px;
        margin: 0 auto;
        width: 100%;
      }
    `,
  ],
})
export class DemoLayoutComponent {
  protected readonly tabs = DEMO_TABS;
}
