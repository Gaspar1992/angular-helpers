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
      :host ::ng-deep .prose-angular pre {
        background: oklch(17% 0.03 256);
        border: 1px solid oklch(22% 0.03 256);
        border-radius: 10px;
        padding: 1.25rem 1.5rem;
        overflow-x: auto;
        margin: 1.5rem 0;
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
    `,
  ],
})
export class BlogPostComponent {
  private readonly route = inject(ActivatedRoute);

  readonly data = toSignal(
    this.route.data.pipe(map((d) => (d['post'] as BlogPostData | null) ?? null)),
  );
}
