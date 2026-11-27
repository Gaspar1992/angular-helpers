import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { of, firstValueFrom } from 'rxjs';
import { describe, it, expect, vi } from 'vitest';
import { fetchBlogPost, sanitizeBlogHtml } from './blog-post.resolver';
import { SeoService } from '../../core/services/seo.service';

describe('sanitizeBlogHtml', () => {
  it('strips blocked elements like script, iframe, svg, and event handlers', () => {
    const dirty =
      '<p onclick="alert(1)">Hello</p><script>alert(1)</script><iframe src="https://evil.test"></iframe><svg onload="alert(2)"></svg>';
    const clean = sanitizeBlogHtml(dirty);

    expect(clean).toContain('<p>Hello</p>');
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('alert(1)');
    expect(clean).not.toContain('<iframe');
    expect(clean).not.toContain('<svg');
    expect(clean).not.toContain('onclick');
  });

  it('neutralizes unsafe javascript: and data:text/html URLs while keeping safe links', () => {
    const html =
      '<a href="javascript:alert(1)">bad</a><a href="https://angular.dev" target="_blank">good</a>';
    const clean = sanitizeBlogHtml(html);

    expect(clean).toContain('href="#"');
    expect(clean).toContain('href="https://angular.dev"');
  });

  it('preserves safe code blocks and structural tags', () => {
    const html =
      '<div class="code-block-wrapper"><pre><code class="hljs language-ts">const x = 1;</code></pre></div>';
    const clean = sanitizeBlogHtml(html);

    expect(clean).toContain('<div class="code-block-wrapper">');
    expect(clean).toContain('<code class="hljs language-ts">const x = 1;</code>');
  });

  it('handles comments, style blocks, self-closing tags, and data:text/html src attributes', () => {
    const html =
      '<!-- secret --><style>body{display:none}</style><unknown>drop</unknown><p>Keep<br/><img src="data:text/html,<script>" alt="x"/></p>';
    const clean = sanitizeBlogHtml(html);

    expect(clean).not.toContain('secret');
    expect(clean).not.toContain('display:none');
    expect(clean).not.toContain('<unknown>');
    expect(clean).toContain('<p>Keep<br><img src="#" alt="x"></p>');
  });

  it('handles unclosed tags, single-quoted attributes, and self-closing blocked tags', () => {
    expect(sanitizeBlogHtml("<p title='hi'>ok</p><script/><div>unclosed")).toBe(
      '<p title="hi">ok</p><div>unclosed',
    );
    expect(sanitizeBlogHtml('text<unclosed')).toBe('text');
  });

  it('fetchBlogPost rejects invalid slugs, handles <!doctype html> 404, and parses frontmatter + code blocks', async () => {
    TestBed.configureTestingModule({});
    const sanitizer = TestBed.inject(DomSanitizer);
    const seo = TestBed.inject(SeoService);
    const http = {
      get: vi
        .fn()
        .mockReturnValueOnce(of('<!doctype html><html></html>'))
        .mockReturnValueOnce(
          of(
            `---\ntitle: Test Post\npublishedAt: 2026-06-01\ntags: [angular, signals]\nexcerpt: Hello\n---\n\n\`\`\`ts\nconst x = 1;\n\`\`\``,
          ),
        ),
    } as unknown as HttpClient;

    expect(await firstValueFrom(fetchBlogPost('bad slug!', http, sanitizer, seo))).toBeNull();
    expect(await firstValueFrom(fetchBlogPost('missing', http, sanitizer, seo))).toBeNull();

    const post = await firstValueFrom(fetchBlogPost('valid-slug', http, sanitizer, seo));
    expect(post?.meta.title).toBe('Test Post');
    expect(post?.meta.tags).toEqual(['angular', 'signals']);
  });
});
