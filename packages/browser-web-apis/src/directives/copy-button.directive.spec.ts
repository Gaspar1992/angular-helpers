import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CopyButtonDirective } from './copy-button.directive';
import { ClipboardService } from '../services/clipboard.service';

class MockClipboardService {
  isSupported = vi.fn().mockReturnValue(true);
  writeText = vi.fn().mockResolvedValue(undefined);
  ensureSupported = vi.fn();
}

@Component({
  standalone: true,
  imports: [CopyButtonDirective],
  template: `<button copyButton copyText="Hello World">Copy</button>`,
})
class TestCopyComponent {}

describe('CopyButtonDirective', () => {
  let fixture: ComponentFixture<TestCopyComponent>;
  let button: HTMLButtonElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestCopyComponent],
      providers: [{ provide: ClipboardService, useClass: MockClipboardService }],
    });
    fixture = TestBed.createComponent(TestCopyComponent);
    fixture.detectChanges();
    button = fixture.nativeElement.querySelector('button');
  });

  it('should create and call writeText on click', async () => {
    expect(button).toBeTruthy();
    button.click();
    fixture.detectChanges();

    const clipboardService = TestBed.inject(ClipboardService);
    expect(clipboardService.writeText).toHaveBeenCalledWith('Hello World');
  });
});
