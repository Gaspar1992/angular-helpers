import { VersionDropdownComponent } from './version-dropdown.component';
import { DocsVersionService } from '../services/docs-version.service';
import { render, provideMockService } from '@angular-helpers/testing';
import { vi } from 'vitest';
import { signal } from '@angular/core';

describe('VersionDropdownComponent', () => {
  async function setup(customOptions?: { value: any; label: string }[]) {
    const result = await render(VersionDropdownComponent, {
      providers: [
        provideMockService(DocsVersionService, {
          version: signal('v21'),
        }),
      ],
      detectInitialChanges: false,
    });

    if (customOptions) {
      (result.component as any).options = customOptions;
    }
    result.fixture.componentRef.changeDetectorRef.markForCheck();
    result.fixture.detectChanges();
    return result;
  }

  it('should create and verify accessible combobox and role="combobox"', async () => {
    const { query } = await setup();
    const triggerBtn = query('[role="combobox"]');
    expect(triggerBtn).toBeTruthy();
    expect(triggerBtn?.getAttribute('aria-haspopup')).toBe('listbox');
    expect(triggerBtn?.getAttribute('aria-expanded')).toBe('false');
  });

  it('should open dropdown and verify options', async () => {
    const { query, queryAll, click } = await setup();
    click('[role="combobox"]');

    const triggerBtn = query('[role="combobox"]');
    expect(triggerBtn?.getAttribute('aria-expanded')).toBe('true');

    expect(query('[role="listbox"]')).toBeTruthy();
    expect(queryAll('[role="option"]').length).toBe(2);
  });

  it('should navigate options on keydown and select on Enter', async () => {
    const { query, fixture } = await setup();
    const triggerBtn = query('[role="combobox"]') as HTMLElement;

    triggerBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');

    triggerBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    const versionService = fixture.debugElement.injector.get(DocsVersionService);
    triggerBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(versionService.setVersion).toHaveBeenCalledWith('v22');
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should close dropdown on Escape', async () => {
    const { query, click, fixture } = await setup();
    click('[role="combobox"]');

    const triggerBtn = query('[role="combobox"]') as HTMLElement;
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('true');

    triggerBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(triggerBtn.getAttribute('aria-expanded')).toBe('false');
  });

  it('should hide the dropdown completely when only one option is available', async () => {
    const { query } = await setup([{ value: 'v21', label: 'Angular v21' }]);
    expect(query('[role="combobox"]')).toBeNull();
  });
});
