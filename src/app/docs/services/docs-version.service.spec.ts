import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DocsVersionService } from './docs-version.service';

describe('DocsVersionService', () => {
  let service: DocsVersionService;
  let routerSpy: any;

  beforeEach(() => {
    routerSpy = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    TestBed.configureTestingModule({
      providers: [DocsVersionService, { provide: Router, useValue: routerSpy }],
    });
    service = TestBed.inject(DocsVersionService);
  });

  it('should be created and default to v21', () => {
    expect(service).toBeTruthy();
    expect(service.version()).toBe('v21');
  });

  it('should update version programmatically when setVersion is called', () => {
    service.setVersion('v22');
    expect(service.version()).toBe('v22');
    expect(routerSpy.navigate).toHaveBeenCalledWith([], {
      queryParams: { v: '22' },
      queryParamsHandling: 'merge',
    });
  });
});
