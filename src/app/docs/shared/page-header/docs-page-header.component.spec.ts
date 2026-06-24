import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Router } from '@angular/router';
import { DocsPageHeaderComponent } from './docs-page-header.component';
import { DocsHistoryService } from '../../services/docs-history.service';

describe('DocsPageHeaderComponent', () => {
  let fixture: ComponentFixture<DocsPageHeaderComponent>;
  let mockHistoryService: any;
  let mockRouter: any;

  beforeEach(() => {
    mockRouter = {
      url: '/docs/core/worker-pool',
    };

    mockHistoryService = {
      isBookmarked: vi.fn().mockReturnValue(false),
      toggleBookmark: vi.fn(),
    };

    TestBed.configureTestingModule({
      imports: [DocsPageHeaderComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: DocsHistoryService, useValue: mockHistoryService },
      ],
    });

    fixture = TestBed.createComponent(DocsPageHeaderComponent);
    fixture.componentRef.setInput('title', 'Worker Pool');
    fixture.componentRef.setInput('lead', 'Manage worker threads reactively.');
  });

  it('should render unfilled star button when page is not bookmarked', () => {
    mockHistoryService.isBookmarked.mockReturnValue(false);
    fixture.detectChanges();

    const starSvg = fixture.nativeElement.querySelector('.star-icon');
    expect(starSvg).toBeTruthy();
    expect(starSvg.classList.contains('filled')).toBe(false);
  });

  it('should render filled star button when page is bookmarked', () => {
    mockHistoryService.isBookmarked.mockReturnValue(true);
    fixture.detectChanges();

    const starSvg = fixture.nativeElement.querySelector('.star-icon');
    expect(starSvg).toBeTruthy();
    expect(starSvg.classList.contains('filled')).toBe(true);
  });

  it('should call toggleBookmark on click', () => {
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('.bookmark-btn');
    button.click();

    expect(mockHistoryService.toggleBookmark).toHaveBeenCalledWith('/docs/core/worker-pool');
  });
});
