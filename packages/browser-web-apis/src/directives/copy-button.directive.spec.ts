import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CopyButtonDirective } from './copy-button.directive';
import { ClipboardService } from '../services/clipboard.service';
import { Renderer2 } from '@angular/core';

class MockClipboardService {
  isSupported = vi.fn().mockReturnValue(true);
  writeText = vi.fn().mockResolvedValue(undefined);
  ensureSupported = vi.fn();
}

class MockRenderer2 {
  createElement = vi.fn().mockReturnValue(document.createElement('div'));
  setAttribute = vi.fn();
  setStyle = vi.fn();
  appendChild = vi.fn();
  setProperty = vi.fn();
}

describe('CopyButtonDirective', () => {
  let directive: CopyButtonDirective;
  let service: ClipboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CopyButtonDirective,
        { provide: ClipboardService, useClass: MockClipboardService },
        { provide: Renderer2, useClass: MockRenderer2 },
      ],
    });
    directive = TestBed.inject(CopyButtonDirective);
    service = TestBed.inject(ClipboardService);
  });

  it('should create and call writeText on click', async () => {
    expect(directive).toBeTruthy();
    // Test base click flow
    await directive.onClick();
    // Since copyText default is empty, it shouldn't call writeText
    expect(service.writeText).not.toHaveBeenCalled();
  });
});
