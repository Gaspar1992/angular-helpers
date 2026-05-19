import { Component, ChangeDetectionStrategy, ViewEncapsulation, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { SiteFooterComponent } from '../../../shared/components/site-footer/site-footer.component';
import type { BlogPostData } from '../../services/blog-post.resolver';

@Component({
  selector: 'app-blog-post',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterLink, SiteFooterComponent],
  template: `
    <main
      id="main-content"
      class="min-h-screen bg-base-100 text-base-content font-sans selection:bg-primary/30"
    >
      @if (data(); as d) {
        <article class="max-width-container py-16 sm:py-24 max-w-[860px]">
          <nav class="mb-12" aria-label="Breadcrumb">
            <a
              routerLink="/blog"
              class="inline-flex items-center gap-2 text-sm font-bold text-base-content/50 no-underline hover:text-primary transition-colors"
            >
              <span>←</span> Back to Blog
            </a>
          </nav>

          <header class="mb-20">
            <div class="flex flex-wrap gap-2.5 mb-8">
              @for (tag of d.meta.tags; track tag) {
                @if (tag && tag.trim() !== '') {
                  <span class="badge badge-primary">{{ tag }}</span>
                }
              }
            </div>
            <h1
              class="text-[2.5rem] sm:text-[3.5rem] font-black text-base-content tracking-tighter leading-[1.1] m-0 mb-8"
            >
              {{ d.meta.title }}
            </h1>
            <time
              [attr.datetime]="d.meta.publishedAt"
              class="text-[10px] font-black text-base-content/50 uppercase tracking-[0.2em] flex items-center gap-3"
            >
              <span
                class="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.5)]"
              ></span>
              Published {{ d.meta.publishedAt }}
            </time>
          </header>

          <div class="prose-angular" [innerHTML]="d.html"></div>
        </article>
      } @else {
        <div class="max-width-container py-32 text-center flex flex-col items-center gap-8">
          <div
            class="w-20 h-20 rounded-3xl bg-base-200 flex items-center justify-center border border-base-content/5 shadow-inner"
          >
            <span class="text-3xl">📄</span>
          </div>
          <h1 class="text-3xl font-black text-base-content m-0 tracking-tight">
            Article not found
          </h1>
          <p class="text-base-content/50 m-0 max-w-md font-medium">
            The post you are looking for doesn't exist or has been moved.
          </p>
          <a routerLink="/blog" class="btn btn-primary font-bold px-8 rounded-xl">Back to Blog</a>
        </div>
      }

      <app-site-footer />
    </main>
  `,
})
export class BlogPostComponent {
  private readonly route = inject(ActivatedRoute);

  readonly data = toSignal(
    this.route.data.pipe(map((d) => (d['post'] as BlogPostData | null) ?? null)),
  );
}
