import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { marked } from 'marked';
import type { BlogPost } from '../models/blog-post.model';

export interface BlogPostData {
  meta: BlogPost;
  html: string;
}

function parseFrontmatter(raw: string): { meta: Partial<BlogPost>; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };

  const yamlBlock = match[1];
  const body = match[2];
  const meta: Partial<BlogPost> = {};

  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim() as keyof BlogPost;
    const rawValue = line.slice(colonIdx + 1).trim();

    if (key === 'tags') {
      const inner = rawValue.replace(/^\[|\]$/g, '');
      (meta as Record<string, unknown>)[key] = inner.split(',').map((t) => t.trim());
    } else {
      (meta as Record<string, unknown>)[key] = rawValue.replace(/^['"]|['"]$/g, '');
    }
  }

  return { meta, body };
}

export const blogPostResolver: ResolveFn<BlogPostData | null> = (route: ActivatedRouteSnapshot) => {
  const slug = route.paramMap.get('slug');
  if (!slug) return of(null);

  const http = inject(HttpClient);

  return http.get(`/content/blog/${slug}.md`, { responseType: 'text' }).pipe(
    map((raw) => {
      const { meta, body } = parseFrontmatter(raw);
      const html = marked.parse(body, { async: false }) as string;
      return {
        meta: {
          slug,
          title: meta.title ?? slug,
          publishedAt: meta.publishedAt ?? '',
          tags: meta.tags ?? [],
          excerpt: meta.excerpt ?? '',
        } satisfies BlogPost,
        html,
      };
    }),
    catchError(() => of(null)),
  );
};
