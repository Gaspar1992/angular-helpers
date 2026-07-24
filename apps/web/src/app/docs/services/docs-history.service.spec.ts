import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { DocsHistoryService } from './docs-history.service';

describe('DocsHistoryService', () => {
  let service: DocsHistoryService;
  let routerEvents$: Subject<any>;
  let mockRouter: any;

  beforeEach(() => {
    localStorage.clear();
    routerEvents$ = new Subject<any>();
    mockRouter = {
      events: routerEvents$,
      url: '/docs/core',
      navigate: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [DocsHistoryService, { provide: Router, useValue: mockRouter }],
    });

    service = TestBed.inject(DocsHistoryService);
  });

  it('should initialize with empty bookmarks and history', () => {
    expect(service.bookmarks()).toEqual([]);
    expect(service.history()).toEqual([]);
    expect(service.bookmarkedItems()).toEqual([]);
    expect(service.historyItems()).toEqual([]);
  });

  describe('Bookmarks Management', () => {
    it('should toggle a bookmark', () => {
      expect(service.isBookmarked('/docs/core/worker-pool')).toBe(false);

      service.toggleBookmark('/docs/core/worker-pool');
      expect(service.bookmarks()).toEqual(['/docs/core/worker-pool']);
      expect(service.isBookmarked('/docs/core/worker-pool')).toBe(true);

      service.toggleBookmark('/docs/core/worker-pool');
      expect(service.bookmarks()).toEqual([]);
      expect(service.isBookmarked('/docs/core/worker-pool')).toBe(false);
    });

    it('should resolve bookmarkedItems with correct labels', () => {
      service.toggleBookmark('/docs/core/worker-pool');
      service.toggleBookmark('/docs/core/non-existent-api');

      expect(service.bookmarkedItems()).toEqual([
        { route: '/docs/core/worker-pool', label: 'WorkerPool' },
        { route: '/docs/core/non-existent-api', label: 'Non Existent Api' },
      ]);
    });
  });

  describe('History Tracking', () => {
    it('should add to history and deduplicate moving the most recent to the top', () => {
      service.addToHistory('/docs/core/worker-pool');
      expect(service.history()).toEqual(['/docs/core/worker-pool']);

      service.addToHistory('/docs/core/is-transferable');
      expect(service.history()).toEqual(['/docs/core/is-transferable', '/docs/core/worker-pool']);

      service.addToHistory('/docs/core/worker-pool');
      expect(service.history()).toEqual(['/docs/core/worker-pool', '/docs/core/is-transferable']);
    });

    it('should cap history to a maximum of 10 items', () => {
      for (let i = 1; i <= 12; i++) {
        service.addToHistory(`/docs/core/api-${i}`);
      }

      expect(service.history().length).toBe(10);
      expect(service.history()[0]).toBe('/docs/core/api-12');
      expect(service.history()[9]).toBe('/docs/core/api-3');
    });

    it('should track history items with labels', () => {
      service.addToHistory('/docs/core/worker-pool');
      service.addToHistory('/docs/core/non-existent-api');

      expect(service.historyItems()).toEqual([
        { route: '/docs/core/non-existent-api', label: 'Non Existent Api' },
        { route: '/docs/core/worker-pool', label: 'WorkerPool' },
      ]);
    });
  });

  describe('Router Navigation Tracking', () => {
    it('should track NavigationEnd events on /docs paths and strip query parameters', () => {
      routerEvents$.next(
        new NavigationEnd(1, '/docs/core/worker-pool?v=21', '/docs/core/worker-pool?v=21'),
      );
      expect(service.history()).toEqual(['/docs/core/worker-pool']);

      // Ignore non-/docs paths
      routerEvents$.next(new NavigationEnd(2, '/home', '/home'));
      expect(service.history()).toEqual(['/docs/core/worker-pool']);
    });
  });
});
