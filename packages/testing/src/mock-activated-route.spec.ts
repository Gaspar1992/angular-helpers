import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideMockActivatedRoute, MockActivatedRoute } from './mock-activated-route';

describe('provideMockActivatedRoute', () => {
  it('should provide reactive params and queryParams', () => {
    TestBed.configureTestingModule({
      providers: [provideMockActivatedRoute({ params: { id: '1' } })],
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
  });
});
