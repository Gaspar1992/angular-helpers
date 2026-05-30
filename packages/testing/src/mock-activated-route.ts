import { Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MockActivatedRouteOptions {
  params?: Record<string, any>;
  queryParams?: Record<string, any>;
}

/**
 * A mock for ActivatedRoute that exposes parameters as reactive RxJS Observables.
 * Allows simulating parameter changes dynamically during tests without reloading.
 */
export class MockActivatedRoute {
  private paramsSubject: BehaviorSubject<Record<string, any>>;
  private queryParamsSubject: BehaviorSubject<Record<string, any>>;

  public params: Observable<Record<string, any>>;
  public queryParams: Observable<Record<string, any>>;
  public snapshot: any;

  constructor(options: MockActivatedRouteOptions = {}) {
    this.paramsSubject = new BehaviorSubject(options.params || {});
    this.queryParamsSubject = new BehaviorSubject(options.queryParams || {});

    this.params = this.paramsSubject.asObservable();
    this.queryParams = this.queryParamsSubject.asObservable();

    this.snapshot = {
      params: options.params || {},
      queryParams: options.queryParams || {},
    };
  }

  setParams(params: Record<string, any>) {
    this.snapshot.params = params;
    this.paramsSubject.next(params);
  }

  setQueryParams(queryParams: Record<string, any>) {
    this.snapshot.queryParams = queryParams;
    this.queryParamsSubject.next(queryParams);
  }
}

/**
 * Provides a mock for ActivatedRoute with reactive params and queryParams.
 *
 * @param options Initial params and queryParams
 * @returns A Provider object ready to be used in TestBed
 */
export function provideMockActivatedRoute(options: MockActivatedRouteOptions = {}): Provider {
  return {
    provide: ActivatedRoute,
    useValue: new MockActivatedRoute(options),
  };
}
