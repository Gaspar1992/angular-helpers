import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { blogPostResolver, blogPostResource } from './blog-post.resolver';
import { SeoService } from '../../core/services/seo.service';

describe('blogPostResolver & blogPostResource', () => {
  let httpTesting: HttpTestingController;
  let seoSpy: any;

  beforeEach(() => {
    seoSpy = {
      updateMetadata: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: DomSanitizer,
          useValue: {
            bypassSecurityTrustHtml: (val: string) => val,
          },
        },
        { provide: SeoService, useValue: seoSpy },
      ],
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should resolve blog post markdown and frontmatter via blogPostResolver', async () => {
    const route = {
      paramMap: {
        get: vi.fn().mockReturnValue('angular-22-upgrade'),
      },
    } as any;

    const promise = new Promise((resolve) => {
      TestBed.runInInjectionContext(() => {
        const obs = blogPostResolver(route, {} as any) as any;
        obs.subscribe(resolve);
      });
    });

    const req = httpTesting.expectOne('content/blog/angular-22-upgrade.md');
    expect(req.request.method).toBe('GET');

    const sampleMarkdown = `---
title: Angular 22 Upgrade
publishedAt: 2026-10-01
tags: [angular, upgrade]
excerpt: Overview of Angular 22
---
# Content Header
This is a test post body.`;

    req.flush(sampleMarkdown);

    const result = (await promise) as any;
    expect(result).not.toBeNull();
    expect(result.meta.title).toBe('Angular 22 Upgrade');
    expect(result.meta.tags).toEqual(['angular', 'upgrade']);
    expect(result.html).toContain('Content Header');
    expect(seoSpy.updateMetadata).toHaveBeenCalled();
  });

  it('should create reactive rxResource for blog post via blogPostResource', async () => {
    const ctx = {
      params: signal({ slug: 'test-article' }),
      queryParams: signal({}),
      fragment: signal(undefined),
      data: signal({}),
    } as any;

    const res = TestBed.runInInjectionContext(() => blogPostResource(ctx));
    expect(res).toBeDefined();

    TestBed.flushEffects();

    const req = httpTesting.expectOne('content/blog/test-article.md');
    req.flush(`---
title: Test Article
publishedAt: 2026-10-02
tags: [test]
excerpt: Test excerpt
---
Article Body`);

    TestBed.flushEffects();
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(res.value()?.meta.title).toBe('Test Article');
  });
});
