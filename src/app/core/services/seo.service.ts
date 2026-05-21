import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  private readonly baseTitle = 'Angular Helpers';
  private readonly baseUrl = 'https://angular-helpers.dev';

  updateMetadata(config: SeoMetadata): void {
    const fullTitle = config.title ? `${config.title} — ${this.baseTitle}` : this.baseTitle;
    const description =
      config.description ||
      '37 typed Browser Web API services, ReDoS prevention, and off-main-thread HTTP for Angular.';
    const url = config.url ? `${this.baseUrl}${config.url}` : this.baseUrl;

    // 1. Title
    this.title.setTitle(fullTitle);

    // 2. Standard Meta Tags
    this.meta.updateTag({ name: 'description', content: description });
    if (config.keywords) {
      this.meta.updateTag({ name: 'keywords', content: config.keywords });
    }

    // 3. Open Graph
    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: config.type || 'website' });
    if (config.image) {
      this.meta.updateTag({ property: 'og:image', content: `${this.baseUrl}${config.image}` });
    }

    // 4. Twitter
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:url', content: url });

    // 5. Canonical URL
    this.updateCanonicalUrl(url);
  }

  private updateCanonicalUrl(url: string): void {
    let link: HTMLLinkElement | null = this.document.querySelector('link[rel="canonical"]');
    if (link) {
      link.setAttribute('href', url);
    } else {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      link.setAttribute('href', url);
      this.document.head.appendChild(link);
    }
  }
}
