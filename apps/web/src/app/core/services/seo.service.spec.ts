import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let title: Title;
  let meta: Meta;
  let doc: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
    doc = TestBed.inject(DOCUMENT);
  });

  it('updates canonical URL, OpenGraph, and Twitter image using the canonical domain', () => {
    service.updateMetadata({
      title: 'Schematics',
      description: 'Workspace generators',
      url: '/docs/schematics',
      image: '/og-schematics.png',
    });

    expect(title.getTitle()).toBe('Schematics — Angular Helpers');
    expect(meta.getTag('property="og:url"')?.content).toBe(
      'https://gaspar1992.github.io/angular-helpers/docs/schematics',
    );
    expect(meta.getTag('name="twitter:image"')?.content).toBe(
      'https://gaspar1992.github.io/angular-helpers/og-schematics.png',
    );
    const canonical = doc.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe(
      'https://gaspar1992.github.io/angular-helpers/docs/schematics',
    );
  });
});
