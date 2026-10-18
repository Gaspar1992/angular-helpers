import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import { DocsTabsComponent, type DocTab } from './docs-tabs.component';

describe('DocsTabsComponent', () => {
  const tabs: DocTab[] = [
    { id: 'api', label: 'API Reference' },
    { id: 'example', label: 'Example' },
    { id: 'guides', label: 'Guides' },
  ];

  it('should render tabs, mark active tab, and emit tabChange on click', () => {
    TestBed.configureTestingModule({
      imports: [DocsTabsComponent],
    });

    const fixture = TestBed.createComponent(DocsTabsComponent);
    fixture.componentRef.setInput('tabs', tabs);
    fixture.componentRef.setInput('activeTab', 'example');
    fixture.componentRef.setInput('ariaLabel', 'Custom tabs');

    const emitSpy = vi.fn();
    fixture.componentInstance.tabChange.subscribe(emitSpy);

    fixture.detectChanges();

    const tablist = fixture.nativeElement.querySelector('[role="tablist"]');
    expect(tablist.getAttribute('aria-label')).toBe('Custom tabs');

    const buttons: NodeListOf<HTMLButtonElement> =
      fixture.nativeElement.querySelectorAll('button[role="tab"]');
    expect(buttons.length).toBe(3);
    expect(buttons[1].classList.contains('active')).toBe(true);
    expect(buttons[1].getAttribute('aria-selected')).toBe('true');
    expect(buttons[0].getAttribute('aria-selected')).toBe('false');

    buttons[2].click();
    expect(emitSpy).toHaveBeenCalledWith('guides');
  });
});
