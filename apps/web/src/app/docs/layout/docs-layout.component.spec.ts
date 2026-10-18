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

  it('should not show bookmarks section when empty', () => {
    fixture.detectChanges();
    const bookmarksSec = fixture.nativeElement.querySelector('#sidebar-bookmarks');
    const historySec = fixture.nativeElement.querySelector('#sidebar-history');

    expect(bookmarksSec).toBeFalsy();
    expect(historySec).toBeFalsy();
  });

  it('should show bookmarks section when it contains items', () => {
    mockHistoryService.bookmarkedItems.set([
      { route: '/docs/core/worker-pool', label: 'WorkerPool' },
    ]);

    fixture.detectChanges();

    const bookmarksSec = fixture.nativeElement.querySelector('#sidebar-bookmarks');
    const historySec = fixture.nativeElement.querySelector('#sidebar-history');

    expect(bookmarksSec).toBeTruthy();
    expect(historySec).toBeFalsy();

    expect(bookmarksSec.textContent).toContain('WorkerPool');
  });

  it('should render the vitals panel stub', () => {
    fixture.detectChanges();
    const vitalsPanel = fixture.nativeElement.querySelector('app-vitals-panel');
    expect(vitalsPanel).toBeTruthy();
  });

  it('should update version when queryParams emit v=21 or v=22', () => {
    const queryParams$ = new Subject<Record<string, string>>();
    mockActivatedRoute.queryParams = queryParams$;

    const localFixture = TestBed.createComponent(DocsLayoutComponent);
    localFixture.detectChanges();

    queryParams$.next({ v: '21' });
    expect(mockVersionService.setVersion).toHaveBeenCalledWith('v21');

    queryParams$.next({ v: '22' });
    expect(mockVersionService.setVersion).toHaveBeenCalledWith('v22');
  });

  it('should compute activeLibrary and activeItem on NavigationEnd events', async () => {
    const { NavigationEnd } = await import('@angular/router');
    fixture.detectChanges();

    const cmp = fixture.componentInstance;
    expect(cmp.activeLibrary()?.id).toBe('core');
    expect(cmp.activeItem()).toBeNull();

    // Navigate to a specific item inside core
    const firstItemRoute = cmp.activeLibrary()!.sections[0].items[0].route;
    routerEvents$.next(new NavigationEnd(1, firstItemRoute, firstItemRoute));
    fixture.detectChanges();

    expect(cmp.activeItem()?.route).toBe(firstItemRoute);

    // Navigate to non-matching route
    routerEvents$.next(new NavigationEnd(2, '/other', '/other'));
    fixture.detectChanges();

    expect(cmp.activeLibrary()).toBeNull();
    expect(cmp.activeItem()).toBeNull();
  });

  it('should toggle and close sidebar, reload window, and return library icons', () => {
    const cmp = fixture.componentInstance as any;
    expect(cmp.sidebarOpen()).toBe(false);

    cmp.toggleSidebar();
    expect(cmp.sidebarOpen()).toBe(true);

    cmp.closeSidebar();
    expect(cmp.sidebarOpen()).toBe(false);

    expect(cmp.getLibraryIcon('core')).toBe('⚡');
    expect(cmp.getLibraryIcon('openlayers')).toBe('🗺️');
    expect(cmp.getLibraryIcon('unknown-lib')).toBe('📦');

    // Test reload when location is undefined vs defined
    cmp.reload();
    const reloadSpy = vi.fn();
    cmp.window.location = { reload: reloadSpy };
    cmp.reload();
    expect(reloadSpy).toHaveBeenCalledOnce();
  });

  it('should scroll sidebar when active item is outside sidebar viewport', () => {
    const cmp = fixture.componentInstance as any;
    const scrollBySpy = vi.fn();

    const mockActiveItemOut = {
      getBoundingClientRect: () => ({ top: 500, bottom: 540, height: 40 }),
    };
    const mockSidebar = {
      querySelector: vi.fn().mockReturnValue(mockActiveItemOut),
      getBoundingClientRect: () => ({ top: 0, bottom: 300, height: 300 }),
      scrollBy: scrollBySpy,
    };

    cmp.window.document.querySelectorAll = vi.fn().mockReturnValue([mockSidebar]);
    cmp.scrollToActiveItem();
    expect(scrollBySpy).toHaveBeenCalledWith({
      top: 370,
      behavior: 'smooth',
    });

    // When document is missing, should return early without throwing
    cmp.window.document = undefined;
    expect(() => cmp.scrollToActiveItem()).not.toThrow();
  });
});
