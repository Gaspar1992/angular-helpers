import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { FullscreenFocusDirective } from './fullscreen-focus.directive';
import { FullscreenService } from '../services/fullscreen.service';
import { of } from 'rxjs';

class MockFullscreenService {
  isSupported = vi.fn().mockReturnValue(true);
  toggle = vi.fn().mockResolvedValue(undefined);
  watch = vi.fn().mockReturnValue(of(false));
  isFullscreen = false;
  fullscreenElement = null;
}

@Component({
  standalone: true,
  imports: [FullscreenFocusDirective],
  template: `<div fullscreenFocus><button>Focus Target</button></div>`,
})
class TestFullscreenComponent {}

describe('FullscreenFocusDirective', () => {
  let fixture: ComponentFixture<TestFullscreenComponent>;
  let element: HTMLDivElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestFullscreenComponent],
      providers: [{ provide: FullscreenService, useClass: MockFullscreenService }],
    });
    fixture = TestBed.createComponent(TestFullscreenComponent);
    fixture.detectChanges();
    element = fixture.nativeElement.querySelector('div');
  });

  it('should create container with fullscreenFocus directive', () => {
    expect(element).toBeTruthy();
  });
});
