import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooterComponent } from '../shared/components/site-footer/site-footer.component';
import { BLOG_POSTS } from './config/posts.data';

@Component({
  selector: 'app-blog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SiteFooterComponent],
  template: `
    <main id="main-content" class="min-h-screen">
      <div class="max-w-[860px] mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <header class="mb-12">
          <p class="text-xs font-bold uppercase tracking-[0.1em] text-primary m-0 mb-3">
            Angular Helpers
          </p>
          <h1
            class="text-[2rem] sm:text-[2.5rem] font-black text-base-content tracking-tight leading-snug m-0 mb-4"
          >
            Blog
          </h1>
          <p class="text-base text-base-content/60 leading-relaxed m-0">
            Thoughts on Angular development, library design, and the web platform.
          </p>
        </header>

        <ul role="list" class="list-none p-0 m-0 flex flex-col gap-6">
          @for (post of posts; track post.slug) {
            <li>
              <article
                class="p-6 bg-base-200 border border-base-300 rounded-xl transition-colors hover:border-primary/35"
              >
                <div class="flex flex-wrap gap-2 mb-3">
                  @for (tag of post.tags; track tag) {
                    <span class="badge badge-ghost badge-sm">{{ tag }}</span>
                  }
                </div>
                <h2 class="text-lg font-bold text-base-content m-0 mb-2 leading-snug">
                  <a
                    [routerLink]="['/blog', post.slug]"
                    class="no-underline text-inherit hover:text-primary transition-colors"
                  >
                    {{ post.title }}
                  </a>
                </h2>
                <p class="text-sm text-base-content/60 leading-relaxed m-0 mb-4">
                  {{ post.excerpt }}
                </p>
                <div class="flex items-center justify-between">
                  <time [attr.datetime]="post.publishedAt" class="text-xs text-base-content/60">
                    {{ post.publishedAt }}
                  </time>
                  <a
                    [routerLink]="['/blog', post.slug]"
                    class="text-xs font-semibold text-primary hover:text-primary/80 no-underline transition-colors"
                  >
                    Read article →
                  </a>
                </div>
              </article>
            </li>
          }
        </ul>
      </div>

      <app-site-footer />
    </main>
  `,
})
export class BlogComponent {
  protected readonly posts = BLOG_POSTS;
}
