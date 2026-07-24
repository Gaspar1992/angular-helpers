import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CopyButtonDirective } from './copy-button.directive';
import { ClipboardService } from '../services/clipboard.service';
import { render, RenderResult } from '@angular-helpers/testing';

class MockClipboardService {
  isSupported = vi.fn().mockReturnValue(true);
  writeText = vi.fn().mockResolvedValue(undefined);
  ensureSupported = vi.fn();
}

describe('CopyButtonDirective', () => {
  let result: RenderResult<any>;
  let clipboardService: MockClipboardService;

  beforeEach(async () => {
    result = await render(CopyButtonDirective, {
      template: '<button copyButton [copyText]="textToCopy">Copiar</button>',
      providers: [{ provide: ClipboardService, useClass: MockClipboardService }],
      hostProperties: {
        textToCopy: 'Hola mundo',
      },
    });

    clipboardService = result.fixture.debugElement.injector.get(
      ClipboardService,
    ) as unknown as MockClipboardService;
  });

  it('should create and call writeText on click', async () => {
    expect(result.fixture.nativeElement.querySelector('button')).toBeTruthy();

    // Simulate real user click
    result.click('button');

    // Validate the ClipboardService was called with the correct text
    expect(clipboardService.writeText).toHaveBeenCalledWith('Hola mundo');
  });
});
