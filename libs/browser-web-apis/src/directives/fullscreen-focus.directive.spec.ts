import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { FullscreenFocusDirective } from './fullscreen-focus.directive';
import { FullscreenService } from '../services/fullscreen.service';
import { render, RenderResult } from '@angular-helpers/testing';

class MockFullscreenService {
  watchSubject = new BehaviorSubject<boolean>(false);
  isSupported = vi.fn().mockReturnValue(true);
  toggle = vi.fn().mockResolvedValue(undefined);
  watch = vi.fn().mockImplementation(() => this.watchSubject.asObservable());
  isFullscreen = false;
  fullscreenElement: HTMLElement | null = null;
}

describe('FullscreenFocusDirective', () => {
  let result: RenderResult<any>;
  let fullscreenService: MockFullscreenService;
  let container: HTMLDivElement;
  let btn1: HTMLButtonElement;
  let btn2: HTMLButtonElement;

  beforeEach(async () => {
    result = await render(FullscreenFocusDirective, {
      template: `<div fullscreenFocus><button id="b1">First</button><button id="b2">Second</button></div>`,
      providers: [{ provide: FullscreenService, useClass: MockFullscreenService }],
    });

    fullscreenService = result.fixture.debugElement.injector.get(
      FullscreenService,
    ) as unknown as MockFullscreenService;

    container = result.fixture.nativeElement.querySelector('div');
    btn1 = result.fixture.nativeElement.querySelector('#b1');
    btn2 = result.fixture.nativeElement.querySelector('#b2');
  });

  it('should create container with fullscreenFocus directive', () => {
    expect(container).toBeTruthy();
    expect(container.hasAttribute('fullscreenFocus')).toBe(true);
  });

  it('should toggle fullscreen on click and swallow rejected toggle promises', async () => {
    container.click();
    expect(fullscreenService.toggle).toHaveBeenCalledWith(container);

    fullscreenService.toggle.mockRejectedValueOnce(new Error('Blocked'));
    await expect(
      result.fixture.debugElement.children[0].injector.get(FullscreenFocusDirective).onClick(),
    ).resolves.toBeUndefined();
  });

  it('should ignore keydown when fullscreen is not active', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    container.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('should preventDefault on Tab when fullscreen is active but no focusable elements have dimensions', () => {
    fullscreenService.fullscreenElement = container;
    fullscreenService.watchSubject.next(true);

    // By default in JSDOM offsetWidth/offsetHeight are 0
    const event = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    container.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('should trap focus forward and backward on Tab / Shift+Tab when fullscreen is active', () => {
    fullscreenService.fullscreenElement = container;
    fullscreenService.watchSubject.next(true);

    for (const el of [btn1, btn2]) {
      Object.defineProperty(el, 'offsetWidth', { value: 100, configurable: true });
      Object.defineProperty(el, 'offsetHeight', { value: 30, configurable: true });
    }

    // Forward Tab from last element wraps to first
    btn2.focus();
    const tabFromLast = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    container.dispatchEvent(tabFromLast);
    expect(tabFromLast.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(btn1);

    // Forward Tab from first element does not wrap
    const tabFromFirst = new KeyboardEvent('keydown', { key: 'Tab', cancelable: true });
    container.dispatchEvent(tabFromFirst);
    expect(tabFromFirst.defaultPrevented).toBe(false);

    // Shift+Tab from first element wraps to last
    btn1.focus();
    const shiftTabFromFirst = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      cancelable: true,
    });
    container.dispatchEvent(shiftTabFromFirst);
    expect(shiftTabFromFirst.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(btn2);

    // Shift+Tab from last element does not wrap
    const shiftTabFromLast = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      cancelable: true,
    });
    container.dispatchEvent(shiftTabFromLast);
    expect(shiftTabFromLast.defaultPrevented).toBe(false);

    result.fixture.destroy();
  });
});
