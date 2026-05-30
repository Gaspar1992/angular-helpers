import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FullscreenFocusDirective } from './fullscreen-focus.directive';
import { FullscreenService } from '../services/fullscreen.service';
import { render, RenderResult } from '@angular-helpers/testing';
import { of } from 'rxjs';

class MockFullscreenService {
  isSupported = vi.fn().mockReturnValue(true);
  toggle = vi.fn().mockResolvedValue(undefined);
  watch = vi.fn().mockReturnValue(of(false));
  isFullscreen = false;
  fullscreenElement = null;
}

describe('FullscreenFocusDirective', () => {
  let result: RenderResult<any>;
  let fullscreenService: MockFullscreenService;

  beforeEach(async () => {
    result = await render(FullscreenFocusDirective, {
      template: `<div fullscreenFocus><button>Focus Target</button></div>`,
      providers: [{ provide: FullscreenService, useClass: MockFullscreenService }],
    });

    fullscreenService = result.fixture.debugElement.injector.get(
      FullscreenService,
    ) as unknown as MockFullscreenService;
  });

  it('should create container with fullscreenFocus directive', () => {
    const element = result.fixture.nativeElement.querySelector('div');
    expect(element).toBeTruthy();
    expect(element.hasAttribute('fullscreenFocus')).toBe(true);
  });

  it('should toggle fullscreen on click', () => {
    const element = result.fixture.nativeElement.querySelector('div');
    element.click();
    expect(fullscreenService.toggle).toHaveBeenCalled();
  });
});
