import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { DocsTabsComponent, type DocTab } from './docs-tabs.component';

@Component({
  imports: [DocsTabsComponent],
  template: `
    <app-docs-tabs [tabs]="tabs" [activeTab]="active()" (tabChange)="active.set($event)" />
  `,
})
class HostComponent {
  readonly tabs: DocTab[] = [
    { id: 'api', label: 'API' },
    { id: 'example', label: 'Example' },
    { id: 'guides', label: 'Guides' },
  ];
  readonly active = signal('api');
}

describe('DocsTabsComponent keyboard navigation', () => {
  it('navigates tabs with ArrowRight, ArrowLeft, Home, and End and maintains roving tabindex', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button[role="tab"]'),
    ) as HTMLButtonElement[];
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');

    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('example');
    expect(buttons[1].getAttribute('tabindex')).toBe('0');

    buttons[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('guides');

    buttons[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('api');

    buttons[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('guides');

    buttons[2].dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    fixture.detectChanges();
    expect(fixture.componentInstance.active()).toBe('guides');
  });
});
