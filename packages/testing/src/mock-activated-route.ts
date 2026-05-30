import { Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MockActivatedRouteOptions {
  params?: Record<string, any>;
  queryParams?: Record<string, any>;
  data?: Record<string, any>;
  fragment?: string;
}

/**
 * A mock for ActivatedRoute that exposes parameters as reactive RxJS Observables.
 * Allows simulating parameter changes dynamically during tests without reloading.
 */
export class MockActivatedRoute {
  private paramsSubject: BehaviorSubject<Record<string, any>>;
  private queryParamsSubject: BehaviorSubject<Record<string, any>>;
  private dataSubject: BehaviorSubject<Record<string, any>>;
  private fragmentSubject: BehaviorSubject<string>;

  public params: Observable<Record<string, any>>;
  public queryParams: Observable<Record<string, any>>;
  public data: Observable<Record<string, any>>;
  public fragment: Observable<string>;
  public snapshot: any;

  constructor(options: MockActivatedRouteOptions = {}) {
    this.paramsSubject = new BehaviorSubject(options.params || {});
    this.queryParamsSubject = new BehaviorSubject(options.queryParams || {});
    this.dataSubject = new BehaviorSubject(options.data || {});
    this.fragmentSubject = new BehaviorSubject(options.fragment || '');

    this.params = this.paramsSubject.asObservable();
    this.queryParams = this.queryParamsSubject.asObservable();
    this.data = this.dataSubject.asObservable();
    this.fragment = this.fragmentSubject.asObservable();

    this.snapshot = {
      params: options.params || {},
      queryParams: options.queryParams || {},
      data: options.data || {},
      fragment: options.fragment || '',
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

  setData(data: Record<string, any>) {
    this.snapshot.data = data;
    this.dataSubject.next(data);
  }

  setFragment(fragment: string) {
    this.snapshot.fragment = fragment;
    this.fragmentSubject.next(fragment);
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
