import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { Component, signal } from '@angular/core';
import { DocsLayoutComponent } from './docs-layout.component';
import { DocsHistoryService } from '../services/docs-history.service';
import { DocsVersionService } from '../services/docs-version.service';
import { WINDOW } from '@angular-helpers/browser-web-apis';
import { VitalsPanelComponent } from './vitals-panel.component';

@Component({
  selector: 'app-vitals-panel',
  template: '',
})
class VitalsPanelStubComponent {}

describe('DocsLayoutComponent', () => {
  let fixture: ComponentFixture<DocsLayoutComponent>;
  let mockHistoryService: any;
  let mockVersionService: any;
  let mockRouter: any;
  let mockActivatedRoute: any;
  let routerEvents$: Subject<any>;

  beforeEach(() => {
    routerEvents$ = new Subject<any>();
    mockRouter = {
      events: routerEvents$,
      url: '/docs/core',
      navigate: vi.fn(),
    };

    mockActivatedRoute = {
      queryParams: of({}),
    };

    mockHistoryService = {
      bookmarkedItems: signal([]),
      historyItems: signal([]),
    };

    mockVersionService = {
      version: signal('v22'),
      setVersion: vi.fn(),
    };

    const mockWindow = {
      document: {
        querySelectorAll: vi.fn().mockReturnValue([]),
      },
    };

    TestBed.configureTestingModule({
      imports: [DocsLayoutComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: DocsHistoryService, useValue: mockHistoryService },
        { provide: DocsVersionService, useValue: mockVersionService },
        { provide: WINDOW, useValue: mockWindow },
      ],
    }).overrideComponent(DocsLayoutComponent, {
      remove: { imports: [VitalsPanelComponent] },
      add: { imports: [VitalsPanelStubComponent] },
    });

    fixture = TestBed.createComponent(DocsLayoutComponent);
  });

  it('should not show bookmarks or history sections when they are empty', () => {
    fixture.detectChanges();
    const bookmarksSec = fixture.nativeElement.querySelector('#sidebar-bookmarks');
    const historySec = fixture.nativeElement.querySelector('#sidebar-history');

    expect(bookmarksSec).toBeFalsy();
    expect(historySec).toBeFalsy();
  });

  it('should show bookmarks and history sections when they contain items', () => {
    mockHistoryService.bookmarkedItems.set([
      { route: '/docs/core/worker-pool', label: 'WorkerPool' },
    ]);
    mockHistoryService.historyItems.set([
      { route: '/docs/core/is-transferable', label: 'isTransferable' },
    ]);

    fixture.detectChanges();

    const bookmarksSec = fixture.nativeElement.querySelector('#sidebar-bookmarks');
    const historySec = fixture.nativeElement.querySelector('#sidebar-history');

    expect(bookmarksSec).toBeTruthy();
    expect(historySec).toBeTruthy();

    expect(bookmarksSec.textContent).toContain('WorkerPool');
    expect(historySec.textContent).toContain('isTransferable');
  });

  it('should render the vitals panel stub', () => {
    fixture.detectChanges();
    const vitalsPanel = fixture.nativeElement.querySelector('app-vitals-panel');
    expect(vitalsPanel).toBeTruthy();
  });
});
