import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  UnifiedServiceDetailComponent,
  type ServiceDetailConfig,
} from './unified-service-detail.component';
import {
  METHODS_COLUMNS,
  FN_FIELDS_COLUMNS,
  type ServiceDoc,
} from '../../../docs/models/doc-meta.model';
import { Router } from '@angular/router';
import { DocsHistoryService } from '../../services/docs-history.service';
import { signal } from '@angular/core';

describe('UnifiedServiceDetailComponent', () => {
  let fixture: ComponentFixture<UnifiedServiceDetailComponent>;
  let component: UnifiedServiceDetailComponent;

  const mockServiceDoc: ServiceDoc = {
    id: 'clipboard',
    name: 'ClipboardService',
    category: 'system',
    description: 'Reactive clipboard wrapper',
    importPath: '@angular-helpers/browser-web-apis',
    inputs: [
      {
        name: 'target',
        type: 'string',
        defaultValue: "'body'",
        description: 'Target selector',
      },
      {
        name: 'optionalInput',
        type: 'boolean',
        description: 'Input without defaultValue',
      },
    ],
    outputs: [
      {
        name: 'copied',
        type: 'EventEmitter<string>',
        description: 'Emits copied text',
      },
    ],
    methods: [
      {
        signature: 'writeText(text: string)',
        returns: 'Promise<boolean>',
        description: 'Writes text to clipboard',
      },
    ],
    example: 'const svc = inject(ClipboardService);',
    fnVersion: {
      name: 'injectClipboard',
      importPath: '@angular-helpers/browser-web-apis',
      fields: [
        {
          field: 'writeText',
          type: '(text: string) => Promise<boolean>',
          description: 'Writes text via function API',
        },
      ],
      example: 'const clipboard = injectClipboard();',
    },
    guides: [
      {
        title: 'Multi-file Guide',
        description: 'Guide with explorer files',
        files: [
          { name: 'comp.ts', language: 'ts', content: 'export class Comp {}' },
          { name: 'comp.html', language: 'html', content: '<div>Hello</div>' },
          { name: 'notes.txt', language: 'text', content: 'Some notes' },
        ],
      },
      {
        title: 'Single Snippet Guide',
        description: 'Guide without files array',
        code: 'console.log("pattern");',
      },
    ],
  };

  const fullConfig: ServiceDetailConfig = {
    service: mockServiceDoc,
    section: 'browser-web-apis',
    backRoute: '/docs/browser-web-apis',
    backLabel: 'browser-web-apis',
    interfaces: [
      {
        name: 'ClipboardConfig',
        description: 'Configuration options',
        properties: [{ name: 'timeout', type: 'number', description: 'Reset delay' }],
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnifiedServiceDetailComponent],
      providers: [
        { provide: Router, useValue: { url: '/docs/browser-web-apis/clipboard' } },
        {
          provide: DocsHistoryService,
          useValue: {
            isBookmarked: () => false,
            toggleBookmark: () => undefined,
            bookmarkedItems: signal([]),
            historyItems: signal([]),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UnifiedServiceDetailComponent);
    component = fixture.componentInstance;
  });

  it('should handle undefined config gracefully', () => {
    fixture.detectChanges();
    const cmp = component as any;

    expect(cmp.service()).toBeUndefined();
    expect(cmp.hasInputs()).toBe(false);
    expect(cmp.hasOutputs()).toBe(false);
    expect(cmp.hasMethods()).toBe(false);
    expect(cmp.inputRows()).toEqual([]);
    expect(cmp.outputRows()).toEqual([]);
    expect(cmp.methodRows()).toEqual([]);
    expect(cmp.importExample()).toBe('');
    expect(cmp.exampleCode()).toBe('');
    expect(cmp.contentTabs().length).toBe(2);
  });

  it('should render API reference tab, inputs, outputs, methods, and interfaces when config is provided', () => {
    fixture.componentRef.setInput('config', fullConfig);
    fixture.detectChanges();

    const cmp = component as any;
    expect(cmp.apiVariant()).toBe('service');
    expect(cmp.activeTab()).toBe('api');
    expect(cmp.contentTabs().length).toBe(3);
    expect(cmp.hasInputs()).toBe(true);
    expect(cmp.hasOutputs()).toBe(true);
    expect(cmp.hasMethods()).toBe(true);
    expect(cmp.inputRows()).toEqual([
      {
        name: 'target',
        type: 'string',
        defaultValue: "'body'",
        description: 'Target selector',
      },
      {
        name: 'optionalInput',
        type: 'boolean',
        defaultValue: '-',
        description: 'Input without defaultValue',
      },
    ]);
    expect(cmp.outputRows().length).toBe(1);
    expect(cmp.currentColumns()).toBe(METHODS_COLUMNS);
    expect(cmp.importExample()).toBe(
      "import { ClipboardService } from '@angular-helpers/browser-web-apis'",
    );
    expect(cmp.exampleCode()).toBe('const svc = inject(ClipboardService);');

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('ClipboardService');
    expect(text).toContain('ClipboardConfig');
  });

  it('should switch between Service and Function API variants', () => {
    fixture.componentRef.setInput('config', fullConfig);
    fixture.detectChanges();

    const cmp = component as any;
    cmp.apiVariant.set('fn');
    fixture.detectChanges();

    expect(cmp.hasMethods()).toBe(true);
    expect(cmp.currentColumns()).toBe(FN_FIELDS_COLUMNS);
    expect(cmp.methodRows()).toEqual(mockServiceDoc.fnVersion!.fields);
    expect(cmp.importExample()).toBe(
      "import { injectClipboard } from '@angular-helpers/browser-web-apis'",
    );
    expect(cmp.exampleCode()).toBe('const clipboard = injectClipboard();');
  });

  it('should default apiVariant to fn when service has fnVersion and 0 methods', () => {
    const fnOnlyConfig: ServiceDetailConfig = {
      ...fullConfig,
      service: {
        ...mockServiceDoc,
        methods: [],
      },
    };

    fixture.componentRef.setInput('config', fnOnlyConfig);
    fixture.detectChanges();

    const cmp = component as any;
    expect(cmp.apiVariant()).toBe('fn');
  });

  it('should render Example and Guides tabs and allow selecting guide files', () => {
    fixture.componentRef.setInput('config', fullConfig);
    fixture.detectChanges();

    const cmp = component as any;

    // Switch to example tab
    cmp.activeTab.set('example');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#panel-example')).toBeTruthy();

    // Switch to guides tab
    cmp.activeTab.set('guides');
    fixture.detectChanges();
    const guidesPanel = fixture.nativeElement.querySelector('#panel-guides');
    expect(guidesPanel).toBeTruthy();
    expect(guidesPanel.textContent).toContain('Multi-file Guide');
    expect(guidesPanel.textContent).toContain('Single Snippet Guide');

    const files = mockServiceDoc.guides![0].files!;
    expect(cmp.getActiveFile(0, files).name).toBe('comp.ts');

    cmp.selectFile(0, 'comp.html');
    fixture.detectChanges();
    expect(cmp.getActiveFile(0, files).name).toBe('comp.html');

    // Fallback to first file if selected file name is not found
    cmp.selectFile(0, 'non-existent.ts');
    expect(cmp.getActiveFile(0, files).name).toBe('comp.ts');
  });
});
