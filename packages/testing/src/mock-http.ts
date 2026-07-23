import type { HttpTestingController } from '@angular/common/http/testing';

export interface MockHttpOptions {
  method?: string;
  multiple?: boolean;
}

/**
 * Simplifies mocking HTTP requests with HttpTestingController.
 * Reduces the boilerplate of expecting a request, checking the method, and flushing data.
 *
 * @param controller The injected HttpTestingController.
 * @param url The exact URL to mock.
 * @param response The mock response body to return.
 * @param options Additional options (method defaults to 'GET', multiple defaults to false).
 */
export function mockHttpRoute(
  controller: HttpTestingController,
  url: string,
  response: any,
  options: MockHttpOptions = {},
): void {
  const method = options.method || 'GET';

  if (options.multiple) {
    const reqs = controller.match((req) => req.url === url && req.method === method);
    reqs.forEach((req) => req.flush(response));
  } else {
    const req = controller.expectOne((req) => req.url === url && req.method === method);
    req.flush(response);
  }
}
