import type { Provider } from '@angular/core';
import { ActivatedRoute, convertToParamMap, type ParamMap } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
  public paramMap: Observable<ParamMap>;
  public queryParams: Observable<Record<string, any>>;
  public queryParamMap: Observable<ParamMap>;
  public data: Observable<Record<string, any>>;
  public fragment: Observable<string>;
  public snapshot: any;

  constructor(options: MockActivatedRouteOptions = {}) {
    const initialParams = options.params || {};
    const initialQueryParams = options.queryParams || {};
    this.paramsSubject = new BehaviorSubject(initialParams);
    this.queryParamsSubject = new BehaviorSubject(initialQueryParams);
    this.dataSubject = new BehaviorSubject(options.data || {});
    this.fragmentSubject = new BehaviorSubject(options.fragment || '');

    this.params = this.paramsSubject.asObservable();
    this.paramMap = this.params.pipe(map((p) => convertToParamMap(p)));
    this.queryParams = this.queryParamsSubject.asObservable();
    this.queryParamMap = this.queryParams.pipe(map((p) => convertToParamMap(p)));
    this.data = this.dataSubject.asObservable();
    this.fragment = this.fragmentSubject.asObservable();

    this.snapshot = {
      params: initialParams,
      paramMap: convertToParamMap(initialParams),
      queryParams: initialQueryParams,
      queryParamMap: convertToParamMap(initialQueryParams),
      data: options.data || {},
      fragment: options.fragment || '',
    };
  }

  setParams(params: Record<string, any>) {
    this.snapshot.params = params;
    this.snapshot.paramMap = convertToParamMap(params);
    this.paramsSubject.next(params);
  }

  setQueryParams(queryParams: Record<string, any>) {
    this.snapshot.queryParams = queryParams;
    this.snapshot.queryParamMap = convertToParamMap(queryParams);
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
