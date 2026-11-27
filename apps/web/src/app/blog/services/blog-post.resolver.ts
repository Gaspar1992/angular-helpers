import { inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { type ResolveFn, ActivatedRouteSnapshot, type ResourceContext } from '@angular/router';
import { of, type Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { marked } from 'marked';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('json', json);
hljs.configure({ ignoreUnescapedHTML: true });
import type { BlogPost } from '../models/blog-post.model';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { SeoService } from '../../core/services/seo.service';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Configure marked to use highlight.js for syntax highlighting
const renderer = new marked.Renderer();
renderer.code = ({ text, lang }: { text: string; lang?: string }) => {
  const rawLang = (lang || 'plaintext').trim();
  const language = /^[a-z0-9_-]+$/i.test(rawLang) ? rawLang : 'plaintext';
  const highlighted = hljs.getLanguage(language)
    ? hljs.highlight(text, { language }).value
    : escapeHtml(text);
  const displayLang = language === 'plaintext' ? 'text' : language;

  return `<div class="code-block-wrapper">
  <div class="code-header">
    <span class="lang-badge">${displayLang}</span>
    <button type="button" class="copy-btn">Copy</button>
  </div>
  <pre><code class="hljs language-${language}">${highlighted}</code></pre>
</div>`;
};

marked.use({ renderer });

const ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'button',
  'code',
  'del',
  'details',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'ul',
]);

const GLOBAL_ALLOWED_ATTRS = new Set(['class', 'id', 'title', 'aria-label', 'aria-hidden']);
const TAG_ALLOWED_ATTRS: Record<string, Set<string>> = {
  a: new Set(['href', 'target', 'rel']),
  button: new Set(['type']),
  img: new Set(['src', 'alt', 'width', 'height', 'loading']),
  td: new Set(['colspan', 'rowspan']),
  th: new Set(['colspan', 'rowspan', 'scope']),
};
const BLOCKED_CONTENT_TAGS = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'svg',
  'math',
]);

function isSafeUrl(value: string): boolean {
  const normalized = value.replace(/[\u0000-\u0020\u007f]+/g, '').toLowerCase();
  if (!normalized || normalized.startsWith('#') || normalized.startsWith('/')) {
    return true;
  }
  const colonIdx = normalized.indexOf(':');
  const slashIdx = normalized.indexOf('/');
  if (colonIdx === -1 || (slashIdx !== -1 && slashIdx < colonIdx)) {
    return true;
  }
  return (
    normalized.startsWith('https://') ||
    normalized.startsWith('http://') ||
    normalized.startsWith('mailto:') ||
    normalized.startsWith('tel:')
  );
}

function findTagEnd(html: string, start: number): number {
  let quote: '"' | "'" | null = null;
  for (let idx = start; idx < html.length; idx++) {
    const ch = html[idx];
    if (quote) {
      if (ch === quote) quote = null;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '>') {
      return idx;
    }
  }
  return -1;
}

/**
 * Deterministic, SSR-safe allowlist HTML sanitizer for rendered Markdown blog posts.
 * Drops blocked container elements and strips disallowed tags, event handlers, and unsafe URLs.
 */
export function sanitizeBlogHtml(html: string): string {
  const out: string[] = [];
  let i = 0;
  let skipUntilTag: string | null = null;

  while (i < html.length) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      if (!skipUntilTag) out.push(html.slice(i));
      break;
    }

    if (lt > i && !skipUntilTag) {
      out.push(html.slice(i, lt));
    }

    const gt = findTagEnd(html, lt + 1);
    if (gt === -1) break;

    const rawTag = html.slice(lt + 1, gt).trim();
    i = gt + 1;

    if (!rawTag || rawTag.startsWith('!')) continue;

    const isClosing = rawTag.startsWith('/');
    const tagBody = isClosing ? rawTag.slice(1).trim() : rawTag;
    const spaceIdx = tagBody.search(/[\s/]/);
    const tagName = (spaceIdx === -1 ? tagBody : tagBody.slice(0, spaceIdx)).toLowerCase();

    if (skipUntilTag) {
      if (isClosing && tagName === skipUntilTag) {
        skipUntilTag = null;
      }
      continue;
    }

    if (!isClosing && BLOCKED_CONTENT_TAGS.has(tagName)) {
      if (!rawTag.endsWith('/')) {
        skipUntilTag = tagName;
      }
      continue;
    }

    if (!ALLOWED_TAGS.has(tagName)) {
      continue;
    }

    if (isClosing) {
      out.push(`</${tagName}>`);
      continue;
    }

    const attrPart = spaceIdx === -1 ? '' : tagBody.slice(spaceIdx).replace(/\/$/, '').trim();
    const safeAttrs: string[] = [];
    const attrRegex =
      /([a-zA-Z_:][a-zA-Z0-9_.:-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let match: RegExpExecArray | null;
    while ((match = attrRegex.exec(attrPart)) !== null) {
      const attrName = match[1].toLowerCase();
      if (attrName.startsWith('on')) continue;
      const allowedForTag = TAG_ALLOWED_ATTRS[tagName];
      if (!GLOBAL_ALLOWED_ATTRS.has(attrName) && !allowedForTag?.has(attrName)) continue;

      const attrVal = match[2] ?? match[3] ?? match[4] ?? '';
      if ((attrName === 'href' || attrName === 'src') && !isSafeUrl(attrVal)) {
        safeAttrs.push(`${attrName}="#"`);
      } else {
        safeAttrs.push(`${attrName}="${escapeHtml(attrVal)}"`);
      }
    }

    const attrString = safeAttrs.length > 0 ? ` ${safeAttrs.join(' ')}` : '';
    out.push(`<${tagName}${attrString}>`);
  }

  return out.join('');
}

export interface BlogPostData {
  meta: BlogPost;
  html: SafeHtml | string;
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

export function fetchBlogPost(
  slug: string,
  http: HttpClient,
  sanitizer: DomSanitizer,
  seo: SeoService,
): Observable<BlogPostData | null> {
  if (!slug || !/^[a-z0-9-]+$/i.test(slug)) return of(null);

  // Use relative path to work with subdirectory deployments (GitHub Pages)
  return http.get(`content/blog/${slug}.md`, { responseType: 'text' }).pipe(
    map((raw) => {
      if (
        raw.trim().toLowerCase().startsWith('<!doctype html>') ||
        raw.trim().toLowerCase().startsWith('<html')
      ) {
        throw new Error('Not found');
      }

      const { meta, body } = parseFrontmatter(raw);
      const rawHtml = marked.parse(body, { async: false }) as string;
      const html = sanitizeBlogHtml(rawHtml);
      const data = {
        meta: {
          slug,
          title: meta.title ?? slug,
          publishedAt: meta.publishedAt ?? '',
          tags: meta.tags ?? [],
          excerpt: meta.excerpt ?? '',
        } satisfies BlogPost,
        html: sanitizer.bypassSecurityTrustHtml(html),
      };

      // Update SEO Metadata dynamically
      seo.updateMetadata({
        title: data.meta.title,
        description: data.meta.excerpt,
        keywords: data.meta.tags.join(', '),
        url: `/blog/${slug}`,
        type: 'article',
      });

      return data;
    }),
    catchError(() => of(null)),
  );
}

export const blogPostResolver: ResolveFn<BlogPostData | null> = (route: ActivatedRouteSnapshot) => {
  const slug = route.paramMap.get('slug') ?? '';
  const http = inject(HttpClient);
  const sanitizer = inject(DomSanitizer);
  const seo = inject(SeoService);
  return fetchBlogPost(slug, http, sanitizer, seo);
};

export function blogPostResource(ctx: ResourceContext) {
  const http = inject(HttpClient);
  const sanitizer = inject(DomSanitizer);
  const seo = inject(SeoService);

  return rxResource({
    params: () => (ctx.params()['slug'] as string | undefined) ?? '',
    stream: ({ params: slug }) => fetchBlogPost(slug, http, sanitizer, seo),
  });
}
