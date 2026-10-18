import { TestBed, ComponentFixture } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { CodeBlockComponent } from './code-block.component';
import * as browserWebApis from '@angular-helpers/browser-web-apis';

vi.mock('@angular-helpers/browser-web-apis', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@angular-helpers/browser-web-apis')>();
  return {
    ...actual,
    injectClipboard: vi.fn(),
  };
});

describe('CodeBlockComponent', () => {
  let writeTextMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    writeTextMock = vi.fn().mockResolvedValue(true);
    vi.mocked(browserWebApis.injectClipboard).mockReturnValue({
      writeText: writeTextMock,
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const createFixture = (platformId: string = 'browser'): ComponentFixture<CodeBlockComponent> => {
    TestBed.configureTestingModule({
      imports: [CodeBlockComponent],
      providers: [{ provide: PLATFORM_ID, useValue: platformId }],
    });
    const fixture = TestBed.createComponent(CodeBlockComponent);
    fixture.componentRef.setInput('code', 'const x: number = 42;');
    return fixture;
  };

  it('should render code, normalize language aliases, and format display language', () => {
    const fixture = createFixture('browser');
    fixture.componentRef.setInput('language', 'ts');
    fixture.componentRef.setInput('filename', 'demo.ts');
    fixture.detectChanges();

    const cmp = fixture.componentInstance as any;
    expect(cmp.normalizedLanguage()).toBe('typescript');
    expect(cmp.displayLanguage()).toBe('TypeScript');
    expect(fixture.nativeElement.querySelector('.filename-badge').textContent).toBe('demo.ts');

    fixture.componentRef.setInput('language', 'js');
    fixture.detectChanges();
    expect(cmp.normalizedLanguage()).toBe('javascript');
    expect(cmp.displayLanguage()).toBe('JavaScript');

    fixture.componentRef.setInput('language', 'bash');
    fixture.detectChanges();
    expect(cmp.normalizedLanguage()).toBe('bash');
    expect(cmp.displayLanguage()).toBe('Bash');
  });

  it('should copy code to clipboard and reset copied state after timeout', async () => {
    const fixture = createFixture('browser');
    fixture.detectChanges();

    const cmp = fixture.componentInstance as any;
    expect(cmp.copied()).toBe(false);

    await cmp.copy();
    expect(writeTextMock).toHaveBeenCalledWith('const x: number = 42;');
    expect(cmp.copied()).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(cmp.copied()).toBe(false);
  });

  it('should not set copied to true when clipboard write fails', async () => {
    writeTextMock.mockResolvedValue(false);
    const fixture = createFixture('browser');
    fixture.detectChanges();

    const cmp = fixture.componentInstance as any;
    await cmp.copy();
    expect(cmp.copied()).toBe(false);
  });

  it('should skip syntax highlighting on server platform', () => {
    const fixture = createFixture('server');
    fixture.detectChanges();

    const codeEl: HTMLElement = fixture.nativeElement.querySelector('code');
    expect(codeEl.textContent).toBe('const x: number = 42;');
  });
});
