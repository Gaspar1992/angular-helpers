import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { DocsApiTableComponent } from './docs-api-table.component';
import { type ApiColumn, type ApiRow } from '../../models/doc-meta.model';

describe('DocsApiTableComponent', () => {
  const columns: ApiColumn[] = [
    { key: 'signature', header: 'Signature', cellClass: 'code-sig' },
    { key: 'returns', header: 'Returns', cellClass: 'code-ret' },
    { key: 'description', header: 'Description', cellClass: 'docs-cell-desc' },
  ];

  const rows: ApiRow[] = [
    {
      signature: 'doWork()',
      returns: 'void',
      description: '<strong>Performs</strong> work',
    },
  ];

  it('should render table headers, code cells, and description HTML cells', () => {
    TestBed.configureTestingModule({
      imports: [DocsApiTableComponent],
    });

    const fixture = TestBed.createComponent(DocsApiTableComponent);
    fixture.componentRef.setInput('columns', columns);
    fixture.componentRef.setInput('rows', rows);
    fixture.componentRef.setInput('ariaLabel', 'Methods table');
    fixture.detectChanges();

    const region = fixture.nativeElement.querySelector('[role="region"]');
    expect(region.getAttribute('aria-label')).toBe('Methods table');

    const headers = fixture.nativeElement.querySelectorAll('th');
    expect(headers.length).toBe(columns.length);

    const codeCells = fixture.nativeElement.querySelectorAll('tbody code');
    expect(codeCells.length).toBe(2);
    expect(codeCells[0].textContent).toBe('doWork()');
    expect(codeCells[1].textContent).toBe('void');

    const descSpan = fixture.nativeElement.querySelector('tbody .docs-cell-desc');
    expect(descSpan.innerHTML).toContain('<strong>Performs</strong> work');
  });
});
