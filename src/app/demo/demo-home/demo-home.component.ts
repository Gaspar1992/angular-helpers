import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

interface DemoCard {
  path: string;
  title: string;
  icon: string;
  description: string;
  features: string[];
  badge?: string;
}

const DEMO_CARDS: DemoCard[] = [
  {
    path: '/demo/browser-apis',
    title: 'Browser Web APIs',
    icon: '🌐',
    description: 'Interactive demonstrations of browser-native APIs with Angular service wrappers.',
    features: ['Camera', 'Geolocation', 'Web Storage', 'Notifications', 'WebSocket'],
    badge: '20+ APIs',
  },
  {
    path: '/demo/security',
    title: 'Security Services',
    icon: '🔐',
    description: 'Security-focused utilities for validation, crypto, and safe storage.',
    features: ['Regex Security', 'Web Crypto', 'Secure Storage', 'Input Sanitizer'],
    badge: 'Enterprise',
  },
  {
    path: '/demo/worker-http',
    title: 'Worker HTTP',
    icon: '⚡',
    description: 'HTTP client that runs in Web Workers for non-blocking requests.',
    features: ['Interceptors', 'Retry Logic', 'Caching', 'HMAC Signing'],
    badge: 'High Performance',
  },
  {
    path: '/demo/library-services',
    title: 'Library Services',
    icon: '📦',
    description: 'Playground for testing all library services in one place.',
    features: ['Service Harness', 'Playwright Tests', 'All Packages'],
  },
];

@Component({
  selector: 'app-demo-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="demo-home">
      <div class="demo-hero">
        <h1 class="demo-title">Interactive Demos</h1>
        <p class="demo-subtitle">
          Explore Angular Helpers through live, interactive demonstrations. Built with signals, OnPush,
          and modern Angular patterns.
        </p>
        <div class="demo-badges">
          <span class="demo-badge demo-badge--angular">Angular 20+</span>
          <span class="demo-badge demo-badge--signals">Signals</span>
          <span class="demo-badge demo-badge--onpush">OnPush</span>
        </div>
      </div>

      <div class="demo-grid">
        @for (card of demoCards; track card.path) {
          <a [routerLink]="card.path" class="demo-card">
            <div class="demo-card-header">
              <span class="demo-card-icon">{{ card.icon }}</span>
              @if (card.badge) {
                <span class="demo-card-badge">{{ card.badge }}</span>
              }
            </div>
            <h2 class="demo-card-title">{{ card.title }}</h2>
            <p class="demo-card-desc">{{ card.description }}</p>
            <div class="demo-card-features">
              @for (feature of card.features; track feature) {
                <span class="demo-feature-tag">{{ feature }}</span>
              }
            </div>
            <span class="demo-card-link"> Launch Demo <span class="demo-card-arrow">→</span> </span>
          </a>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .demo-home {
        padding: var(--sp-8) 0;
      }

      .demo-hero {
        text-align: center;
        margin-bottom: var(--sp-10);
      }

      .demo-title {
        font-size: var(--text-4xl);
        font-weight: 800;
        margin: 0 0 var(--sp-4);
        background: linear-gradient(135deg, var(--text), var(--accent));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .demo-subtitle {
        font-size: var(--text-lg);
        color: var(--text-muted);
        max-width: 600px;
        margin: 0 auto var(--sp-6);
        line-height: 1.6;
      }

      .demo-badges {
        display: flex;
        gap: var(--sp-2);
        justify-content: center;
      }

      .demo-badge {
        display: inline-flex;
        align-items: center;
        padding: var(--sp-1) var(--sp-3);
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .demo-badge--angular {
        background: #dd0031;
        color: white;
      }

      .demo-badge--signals {
        background: #6366f1;
        color: white;
      }

      .demo-badge--onpush {
        background: #10b981;
        color: white;
      }

      .demo-grid {
        display: grid;
        gap: var(--sp-6);
        grid-template-columns: 1fr;
      }

      @media (min-width: 640px) {
        .demo-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .demo-card {
        display: flex;
        flex-direction: column;
        padding: var(--sp-6);
        background: var(--bg-elevated);
        border: 1px solid var(--border);
        border-radius: var(--radius-xl);
        text-decoration: none;
        color: var(--text);
        transition: all var(--transition);
      }

      .demo-card:hover {
        border-color: var(--accent);
        box-shadow: 0 4px 20px -2px rgba(99, 102, 241, 0.2);
        transform: translateY(-2px);
      }

      .demo-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--sp-4);
      }

      .demo-card-icon {
        font-size: 2.5rem;
      }

      .demo-card-badge {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--accent);
        background: var(--accent-hover);
        padding: var(--sp-1) var(--sp-2);
        border-radius: var(--radius);
      }

      .demo-card-title {
        font-size: var(--text-xl);
        font-weight: 700;
        margin: 0 0 var(--sp-2);
      }

      .demo-card-desc {
        font-size: var(--text-base);
        color: var(--text-muted);
        margin: 0 0 var(--sp-4);
        line-height: 1.5;
        flex: 1;
      }

      .demo-card-features {
        display: flex;
        flex-wrap: wrap;
        gap: var(--sp-1);
        margin-bottom: var(--sp-4);
      }

      .demo-feature-tag {
        font-size: var(--text-xs);
        color: var(--text-muted);
        background: var(--bg);
        padding: var(--sp-1) var(--sp-2);
        border-radius: var(--radius);
      }

      .demo-card-link {
        display: flex;
        align-items: center;
        gap: var(--sp-1);
        color: var(--accent);
        font-weight: 600;
        font-size: var(--text-sm);
      }

      .demo-card-arrow {
        transition: transform var(--transition);
      }

      .demo-card:hover .demo-card-arrow {
        transform: translateX(4px);
      }
    `,
  ],
})
export class DemoHomeComponent {
  protected readonly demoCards = DEMO_CARDS;
}
