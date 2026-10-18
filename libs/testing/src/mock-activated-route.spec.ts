import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideMockActivatedRoute, MockActivatedRoute } from './mock-activated-route';

describe('provideMockActivatedRoute', () => {
  it('should provide reactive params, queryParams, data, and fragment', () => {
    TestBed.configureTestingModule({
      providers: [
        provideMockActivatedRoute({
          params: { id: '1' },
          queryParams: { page: '1' },
          data: { role: 'admin' },
          fragment: 'top',
        }),
      ],
    });

    const route = TestBed.inject(ActivatedRoute) as unknown as MockActivatedRoute;
    let currentId = null;

    route.params.subscribe((p) => (currentId = p['id']));

    expect(currentId).toBe('1');
    expect(route.snapshot.params['id']).toBe('1');

    route.setParams({ id: '2' });
    expect(currentId).toBe('2');
    expect(route.snapshot.params['id']).toBe('2');

    let currentQuery = null;
    route.queryParams.subscribe((q) => (currentQuery = q['search']));
    route.setQueryParams({ search: 'angular' });
    expect(currentQuery).toBe('angular');
    expect(route.snapshot.queryParams['search']).toBe('angular');

    let currentData = null;
    route.data.subscribe((d) => (currentData = d['role']));
    expect(currentData).toBe('admin');
    route.setData({ role: 'editor' });
    expect(currentData).toBe('editor');
    expect(route.snapshot.data['role']).toBe('editor');

    let currentFragment = null;
    route.fragment.subscribe((f) => (currentFragment = f));
    expect(currentFragment).toBe('top');
    route.setFragment('section-2');
    expect(currentFragment).toBe('section-2');
    expect(route.snapshot.fragment).toBe('section-2');
  });

  it('should initialize with empty defaults when no options are passed', () => {
    TestBed.configureTestingModule({
      providers: [provideMockActivatedRoute()],
    });

    const route = TestBed.inject(ActivatedRoute) as unknown as MockActivatedRoute;
    expect(route.snapshot.params).toEqual({});
    expect(route.snapshot.queryParams).toEqual({});
    expect(route.snapshot.data).toEqual({});
    expect(route.snapshot.fragment).toBe('');
  });
});
