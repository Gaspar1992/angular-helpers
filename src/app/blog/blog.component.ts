import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SiteFooterComponent } from '../shared/components/site-footer/site-footer.component';
import { BLOG_POSTS } from './config/posts.data';

@Component({
  selector: 'app-blog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SiteFooterComponent],
  template: `
    <main
      id="main-content"
      class="min-h-screen bg-base-100 text-base-content font-sans selection:bg-primary/30"
    >
      <div class="max-width-container py-16 sm:py-24 max-w-[860px]">
        <header class="mb-20 text-center sm:text-left">
          <div
            class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10 mb-8"
          >
            <span class="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            <span class="text-[11px] font-black uppercase tracking-widest text-primary"
              >Technical Engineering</span
            >
          </div>
          <h1
            class="text-[3rem] sm:text-[4rem] font-black text-base-content tracking-tighter leading-none m-0 mb-6"
          >
            Insights & <span class="text-primary">Engineering</span>
          </h1>
          <p class="text-lg text-base-content/50 leading-relaxed m-0 max-w-2xl font-medium">
            Deep dives into Angular architecture, library design, and the latest advancements in the
            web platform.
          </p>
        </header>

        @defer (on idle) {
          <ul role="list" class="list-none p-0 m-0 flex flex-col gap-10">
            @for (post of posts; track post.slug) {
              <li>
                <article
                  class="p-8 sm:p-12 bg-base-200 border border-base-content/5 rounded-[2.5rem] transition-all duration-500 hover:border-primary/40 hover:shadow-2xl group flex flex-col items-start relative shadow-sm overflow-hidden"
                >
                  <!-- Decorative Gradient Accent -->
                  <div
                    class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary via-secondary to-transparent opacity-40 group-hover:opacity-100 transition-opacity"
                  ></div>

                  <div class="flex flex-wrap gap-3 mb-8">
                    @for (tag of post.tags; track tag) {
                      <span
                        class="badge badge-outline border-primary/20 group-hover:border-primary/50 transition-all px-4 py-1.5"
                        >{{ tag }}</span
                      >
                    }
                  </div>
                  <h2
                    class="text-2xl sm:text-4xl font-black text-base-content m-0 mb-5 leading-tight tracking-tighter group-hover:text-primary transition-colors duration-300"
                  >
                    <a
                      [routerLink]="['/blog', post.slug]"
                      class="no-underline text-inherit before:absolute before:inset-0 relative"
                    >
                      {{ post.title }}
                    </a>
                  </h2>
                  <p
                    class="text-base sm:text-lg text-base-content/50 leading-relaxed m-0 mb-10 max-w-3xl font-medium line-clamp-3"
                  >
                    {{ post.excerpt }}
                  </p>
                  <div
                    class="flex items-center justify-between w-full mt-auto pt-8 border-t border-base-content/5"
                  >
                    <time
                      [attr.datetime]="post.publishedAt"
                      class="text-[10px] font-black text-base-content/50 uppercase tracking-[0.2em] flex items-center gap-2"
                    >
                      <span class="w-1 h-1 rounded-full bg-base-content/40"></span>
                      {{ post.publishedAt }}
                    </time>
                    <a
                      [routerLink]="['/blog', post.slug]"
                      class="text-sm font-black text-primary hover:text-primary-active no-underline transition-all flex items-center gap-2 group-hover:gap-3"
                    >
                      <span>Read article</span>
                      <span class="text-xl">→</span>
                    </a>
                  </div>
                </article>
              </li>
            }
          </ul>
        } @placeholder {
          <div class="flex flex-col gap-10">
            <div
              class="h-64 bg-base-200 border border-base-content/5 animate-pulse rounded-[2.5rem]"
            ></div>
            <div
              class="h-64 bg-base-200 border border-base-content/5 animate-pulse rounded-[2.5rem]"
            ></div>
          </div>
        }
      </div>

      <app-site-footer />
    </main>
  `,
})
export class BlogComponent {
  protected readonly posts = BLOG_POSTS;
}
