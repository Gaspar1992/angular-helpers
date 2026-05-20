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
      class="min-h-screen bg-black text-base-content font-sans selection:bg-primary/30 relative overflow-hidden"
    >
      <!-- Decorative Background Glows -->
      <div
        class="absolute top-[-300px] left-[-300px] w-[600px] h-[600px] rounded-full bg-primary/5 blur-[150px] pointer-events-none"
      ></div>
      <div
        class="absolute top-[400px] right-[-200px] w-[500px] h-[500px] rounded-full bg-secondary/5 blur-[130px] pointer-events-none"
      ></div>

      <div class="max-width-container py-20 sm:py-28 max-w-[860px] relative z-10">
        <header
          class="mb-24 text-center sm:text-left animate-in fade-in slide-in-from-top-6 duration-700"
        >
          <div
            class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5 mb-8"
          >
            <span
              class="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"
            ></span>
            <span class="text-[11px] font-black uppercase tracking-widest text-primary"
              >Technical Engineering</span
            >
          </div>
          <h1
            class="text-[3.25rem] sm:text-[4.5rem] font-black text-white tracking-tighter leading-none m-0 mb-6"
          >
            Insights &
            <span
              class="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
              >Engineering</span
            >
          </h1>
          <p class="text-lg text-white/60 leading-relaxed m-0 max-w-2xl font-medium">
            Deep dives into Angular architecture, high-fidelity library design, and the latest
            advancements in the web platform.
          </p>
        </header>

        @defer (on idle) {
          <ul role="list" class="list-none p-0 m-0 flex flex-col gap-10">
            @for (post of posts; track post.slug) {
              <li class="animate-in fade-in slide-in-from-bottom-8 duration-500 fill-mode-both">
                <article
                  class="p-8 sm:p-12 bg-slate-950/40 backdrop-blur-xl border border-white/5 rounded-[2.5rem] transition-all duration-500 hover:border-primary/30 hover:bg-slate-950/65 hover:shadow-[0_30px_70px_-15px_rgba(59,130,246,0.12)] group flex flex-col items-start relative shadow-sm overflow-hidden"
                >
                  <!-- Decorative Cyber Glow Accent Line -->
                  <div
                    class="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-primary via-secondary to-transparent opacity-30 group-hover:opacity-100 transition-opacity duration-500"
                  ></div>

                  <div class="flex flex-wrap gap-2.5 mb-8">
                    @for (tag of post.tags; track tag) {
                      <span
                        class="px-3.5 py-1 text-[9px] font-black uppercase tracking-widest border rounded-full transition-all duration-300 bg-primary/10 border-primary/20 text-primary group-hover:border-primary/45 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.25)]"
                        >{{ tag }}</span
                      >
                    }
                  </div>

                  <h2
                    class="text-2xl sm:text-4xl font-black text-white m-0 mb-5 leading-tight tracking-tighter group-hover:text-primary transition-colors duration-300"
                  >
                    <a
                      [routerLink]="['/blog', post.slug]"
                      class="no-underline text-inherit before:absolute before:inset-0 relative"
                    >
                      {{ post.title }}
                    </a>
                  </h2>

                  <p
                    class="text-base sm:text-lg text-white/50 leading-relaxed m-0 mb-10 max-w-3xl font-medium line-clamp-3"
                    [innerHTML]="post.excerpt"
                  ></p>

                  <div
                    class="flex items-center justify-between w-full mt-auto pt-8 border-t border-white/5"
                  >
                    <time
                      [attr.datetime]="post.publishedAt"
                      class="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] flex items-center gap-3"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full bg-primary/50 group-hover:bg-primary group-hover:shadow-[0_0_8px_rgba(59,130,246,0.8)] transition-all duration-300"
                      ></span>
                      {{ post.publishedAt }}
                    </time>
                    <a
                      [routerLink]="['/blog', post.slug]"
                      class="text-sm font-black text-primary hover:text-primary-active no-underline transition-all flex items-center gap-2 group-hover:gap-4.5"
                    >
                      <span>Read article</span>
                      <span
                        class="text-xl transition-transform duration-300 group-hover:translate-x-1.5"
                        >→</span
                      >
                    </a>
                  </div>
                </article>
              </li>
            }
          </ul>
        } @placeholder {
          <div class="flex flex-col gap-10">
            <div
              class="h-64 bg-slate-950/40 border border-white/5 animate-pulse rounded-[2.5rem]"
            ></div>
            <div
              class="h-64 bg-slate-950/40 border border-white/5 animate-pulse rounded-[2.5rem]"
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
