import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SiteFooterComponent } from '../../../shared/components/site-footer/site-footer.component';
import type { BlogPostData } from '../../services/blog-post.resolver';

@Component({
  selector: 'app-blog-post',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SiteFooterComponent],
  template: `
    <main id="main-content" class="min-h-screen">
      @if (data(); as d) {
        <article class="max-w-[760px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <nav class="mb-8" aria-label="Breadcrumb">
            <a
              routerLink="/blog"
              class="text-sm text-base-content/40 no-underline hover:text-primary transition-colors"
            >
              ← Blog
            </a>
          </nav>

          <header class="mb-10">
            <div class="flex flex-wrap gap-2 mb-4">
              @for (tag of d.meta.tags; track tag) {
                <span class="badge badge-ghost badge-sm">{{ tag }}</span>
              }
            </div>
            <h1
              class="text-[1.8rem] sm:text-[2.2rem] font-black text-base-content tracking-tight leading-snug m-0 mb-4"
            >
              {{ d.meta.title }}
            </h1>
            <time [attr.datetime]="d.meta.publishedAt" class="text-xs text-base-content/30">
              Published {{ d.meta.publishedAt }}
            </time>
          </header>

          <div class="prose-angular" [innerHTML]="d.html"></div>
        </article>
      } @else {
        <div class="max-w-[760px] mx-auto px-4 py-20 text-center">
          <h1 class="text-2xl font-bold text-base-content mb-4">Article not found</h1>
          <a routerLink="/blog" class="btn btn-primary">Back to Blog</a>
        </div>
      }

      <app-site-footer />
    </main>
  `,
  styles: [
    `
      :host ::ng-deep .prose-angular {
        color: oklch(88% 0.02 256 / 0.8);
        line-height: 1.8;
        font-size: 1rem;
      }
      :host ::ng-deep .prose-angular p {
        margin: 0 0 1.25rem;
      }
      :host ::ng-deep .prose-angular > p:first-child {
        font-size: 1.1rem;
        color: oklch(88% 0.02 256 / 0.7);
      }
      :host ::ng-deep .prose-angular h2 {
        font-size: 1.4rem;
        font-weight: 800;
        color: oklch(88% 0.02 256);
        margin: 2.5rem 0 0.75rem;
        letter-spacing: -0.02em;
      }
      :host ::ng-deep .prose-angular h3 {
        font-size: 1.05rem;
        font-weight: 700;
        color: oklch(69% 0.18 254);
        margin: 1.75rem 0 0.5rem;
      }
      :host ::ng-deep .prose-angular code {
        font-family: 'Fira Code', 'Cascadia Code', monospace;
        font-size: 0.85em;
        color: oklch(69% 0.18 254);
        background: oklch(69% 0.18 254 / 0.1);
        padding: 0.1em 0.35em;
        border-radius: 4px;
      }
      :host ::ng-deep .code-block-wrapper {
        background: oklch(17% 0.03 256);
        border: 1px solid oklch(22% 0.03 256);
        border-radius: 10px;
        overflow: hidden;
        margin: 1.5rem 0;
      }
      :host ::ng-deep .code-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem 1rem;
        background: oklch(20% 0.02 256);
        border-bottom: 1px solid oklch(22% 0.03 256);
      }
      :host ::ng-deep .lang-badge {
        font-size: 0.7rem;
        font-weight: 600;
        color: oklch(60% 0.05 256 / 0.8);
        text-transform: uppercase;
        letter-spacing: 0.07em;
      }
      :host ::ng-deep .copy-btn {
        font-size: 0.7rem;
        padding: 0.15rem 0.5rem;
        background: oklch(25% 0.02 256);
        border: 1px solid oklch(30% 0.02 256);
        border-radius: 4px;
        color: oklch(70% 0.05 256);
        cursor: pointer;
        transition:
          background 0.15s ease,
          color 0.15s ease,
          transform 0.1s ease,
          box-shadow 0.15s ease;
        box-shadow: 0 1px 2px oklch(10% 0.01 256 / 0.3);
      }
      :host ::ng-deep .copy-btn:hover {
        background: oklch(30% 0.02 256);
        color: oklch(85% 0.02 256);
        box-shadow: 0 2px 4px oklch(10% 0.01 256 / 0.4);
      }
      :host ::ng-deep .copy-btn:active {
        transform: translateY(1px) scale(0.98);
        box-shadow: 0 1px 1px oklch(10% 0.01 256 / 0.3);
        background: oklch(35% 0.02 256);
      }
      :host ::ng-deep .prose-angular pre {
        margin: 0;
        padding: 1.25rem 1.5rem;
        overflow-x: auto;
        background: transparent;
        border: none;
        border-radius: 0;
      }
      :host ::ng-deep .prose-angular pre code {
        background: none;
        padding: 0;
        color: oklch(88% 0.02 256 / 0.7);
        font-size: 0.82rem;
        line-height: 1.65;
      }
      :host ::ng-deep .prose-angular strong {
        color: oklch(88% 0.02 256);
        font-weight: 700;
      }
      :host ::ng-deep .prose-angular em {
        color: oklch(88% 0.02 256 / 0.7);
        font-style: italic;
      }
      :host ::ng-deep .prose-angular ul,
      :host ::ng-deep .prose-angular ol {
        padding-left: 1.5rem;
        margin: 0 0 1.25rem;
      }
      :host ::ng-deep .prose-angular li {
        margin-bottom: 0.4rem;
      }
      :host ::ng-deep .prose-angular a {
        color: oklch(69% 0.18 254);
        text-decoration: underline;
        text-underline-offset: 3px;
      }
      :host ::ng-deep .prose-angular a:hover {
        color: oklch(75% 0.18 254);
      }
      :host ::ng-deep .prose-angular blockquote {
        border-left: 3px solid oklch(69% 0.18 254 / 0.4);
        padding-left: 1rem;
        margin: 1.5rem 0;
        color: oklch(88% 0.02 256 / 0.55);
        font-style: italic;
      }

      /* Highlight.js syntax highlighting - Atom One Dark theme adaptation */
      :host ::ng-deep .hljs {
        color: oklch(88% 0.02 256 / 0.9);
        background: transparent;
      }
      :host ::ng-deep .hljs-comment,
      :host ::ng-deep .hljs-quote {
        color: oklch(60% 0.05 256 / 0.7);
        font-style: italic;
      }
      :host ::ng-deep .hljs-keyword,
      :host ::ng-deep .hljs-selector-tag,
      :host ::ng-deep .hljs-type {
        color: oklch(65% 0.25 285);
      }
      :host ::ng-deep .hljs-string,
      :host ::ng-deep .hljs-regexp,
      :host ::ng-deep .hljs-addition,
      :host ::ng-deep .hljs-attribute,
      :host ::ng-deep .hljs-meta-string {
        color: oklch(75% 0.2 145);
      }
      :host ::ng-deep .hljs-number,
      :host ::ng-deep .hljs-literal,
      :host ::ng-deep .hljs-built_in,
      :host ::ng-deep .hljs-bullet {
        color: oklch(70% 0.15 50);
      }
      :host ::ng-deep .hljs-variable,
      :host ::ng-deep .hljs-template-variable,
      :host ::ng-deep .hljs-tag .hljs-attr {
        color: oklch(75% 0.15 95);
      }
      :host ::ng-deep .hljs-function,
      :host ::ng-deep .hljs-title,
      :host ::ng-deep .hljs-section {
        color: oklch(70% 0.15 265);
      }
      :host ::ng-deep .hljs-class,
      :host ::ng-deep .hljs-title.class_ {
        color: oklch(75% 0.2 95);
      }
      :host ::ng-deep .hljs-params {
        color: oklch(88% 0.02 256 / 0.8);
      }
      :host ::ng-deep .hljs-punctuation,
      :host ::ng-deep .hljs-tag {
        color: oklch(70% 0.1 256);
      }
      :host ::ng-deep .hljs-operator,
      :host ::ng-deep .hljs-property {
        color: oklch(75% 0.18 310);
      }
      :host ::ng-deep .hljs-deletion,
      :host ::ng-deep .hljs-name,
      :host ::ng-deep .hljs-tag .hljs-name {
        color: oklch(65% 0.2 25);
      }
    `,
  ],
})
export class BlogPostComponent {
  private readonly route = inject(ActivatedRoute);

  readonly data = toSignal(
    this.route.data.pipe(map((d) => (d['post'] as BlogPostData | null) ?? null)),
  );
}
