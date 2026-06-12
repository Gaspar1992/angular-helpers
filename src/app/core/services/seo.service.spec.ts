import { TestBed } from '@angular/core/testing';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { SeoService } from './seo.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('SeoService', () => {
  let service: SeoService;
  let titleService: Title;
  let metaService: Meta;
  let dom: Document;

  beforeEach(() => {
    // Mock for Title
    const mockTitle = {
      setTitle: vi.fn(),
    };

    // Mock for Meta
    const mockMeta = {
      updateTag: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { provide: Title, useValue: mockTitle },
        { provide: Meta, useValue: mockMeta },
      ],
    });

    service = TestBed.inject(SeoService);
    titleService = TestBed.inject(Title);
    metaService = TestBed.inject(Meta);
    dom = TestBed.inject(DOCUMENT);

    // Clean up canonical link in head if any
    const existing = dom.head.querySelector('link[rel="canonical"]');
    if (existing) {
      existing.remove();
    }
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should set default metadata if config is empty', () => {
    service.updateMetadata({});

    expect(titleService.setTitle).toHaveBeenCalledWith('Angular Helpers');
    expect(metaService.updateTag).toHaveBeenCalledWith({
      name: 'description',
      content:
        '37 typed Browser Web API services, ReDoS prevention, and off-main-thread HTTP for Angular.',
    });
    expect(metaService.updateTag).toHaveBeenCalledWith({
      property: 'og:title',
      content: 'Angular Helpers',
    });
    expect(metaService.updateTag).toHaveBeenCalledWith({
      property: 'og:url',
      content: 'https://angular-helpers.dev',
    });
    expect(metaService.updateTag).toHaveBeenCalledWith({
      property: 'og:type',
      content: 'website',
    });
  });

  it('should set full title when config.title is provided', () => {
    service.updateMetadata({ title: 'My Page' });
    expect(titleService.setTitle).toHaveBeenCalledWith('My Page — Angular Helpers');
  });

  it('should update keywords when config.keywords is provided', () => {
    service.updateMetadata({ keywords: 'angular, helpers' });
    expect(metaService.updateTag).toHaveBeenCalledWith({
      name: 'keywords',
      content: 'angular, helpers',
    });
  });

  it('should update og:image when config.image is provided', () => {
    service.updateMetadata({ image: '/assets/img.png' });
    expect(metaService.updateTag).toHaveBeenCalledWith({
      property: 'og:image',
      content: 'https://angular-helpers.dev/assets/img.png',
    });
  });

  it('should create a canonical link if not present', () => {
    service.updateMetadata({ url: '/docs' });

    const link = dom.head.querySelector('link[rel="canonical"]');
    expect(link).toBeTruthy();
    expect(link?.getAttribute('href')).toBe('https://angular-helpers.dev/docs');
  });

  it('should update canonical link if already present', () => {
    // Pre-create link
    const link = dom.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', 'https://old.url');
    dom.head.appendChild(link);

    service.updateMetadata({ url: '/new-docs' });

    const updatedLink = dom.head.querySelector('link[rel="canonical"]');
    expect(updatedLink).toBeTruthy();
    expect(updatedLink?.getAttribute('href')).toBe('https://angular-helpers.dev/new-docs');
  });
});
