import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { mockHttpRoute } from './mock-http';

describe('mockHttpRoute', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('should mock a single route', () => {
    http.get('/api/test').subscribe((data) => {
      expect(data).toEqual({ ok: true });
    });

    mockHttpRoute(controller, '/api/test', { ok: true });
  });

  it('should mock multiple routes when multiple: true', () => {
    http.get('/api/multi').subscribe((data) => expect(data).toEqual({ ok: 1 }));
    http.get('/api/multi').subscribe((data) => expect(data).toEqual({ ok: 1 }));

    mockHttpRoute(controller, '/api/multi', { ok: 1 }, { multiple: true });
  });
});
