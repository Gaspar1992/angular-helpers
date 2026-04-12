import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SiteFooterComponent } from '../../../shared/components/site-footer/site-footer.component';
import { BLOG_POSTS } from '../../config/posts.data';
import { WebRedesignArticleComponent } from './articles/web-redesign-and-library-vision.component';

@Component({
  selector: 'app-blog-post',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SiteFooterComponent, WebRedesignArticleComponent],
  template: `
    <main id="main-content" class="min-h-screen">
      @if (post()) {
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
              @for (tag of post()!.tags; track tag) {
                <span class="badge badge-ghost badge-sm">{{ tag }}</span>
              }
            </div>
            <h1
              class="text-[1.8rem] sm:text-[2.2rem] font-black text-base-content tracking-tight leading-snug m-0 mb-4"
            >
              {{ post()!.title }}
            </h1>
            <time [attr.datetime]="post()!.publishedAt" class="text-xs text-base-content/30">
              Published {{ post()!.publishedAt }}
            </time>
          </header>

          @if (slug() === 'web-redesign-and-library-vision') {
            <app-web-redesign-article />
          }
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
})
export class BlogPostComponent {
  private readonly route = inject(ActivatedRoute);

  readonly slug = computed(() => this.route.snapshot.paramMap.get('slug') ?? '');
  readonly post = computed(() => BLOG_POSTS.find((p) => p.slug === this.slug()) ?? null);
}
