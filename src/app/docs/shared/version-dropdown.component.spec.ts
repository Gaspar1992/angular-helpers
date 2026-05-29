import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { VersionDropdownComponent } from './version-dropdown.component';
import { DocsVersionService } from '../services/docs-version.service';

describe('VersionDropdownComponent', () => {
  let component: VersionDropdownComponent;
  let fixture: ComponentFixture<VersionDropdownComponent>;
  let versionService: DocsVersionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VersionDropdownComponent],
      providers: [DocsVersionService],
    }).compileComponents();

    fixture = TestBed.createComponent(VersionDropdownComponent);
    component = fixture.componentInstance;
    // Set 2 options to allow testing interactive dropdown features
    (component as any).options = [
      { value: 'v22', label: 'Angular v22 (Latest)' },
      { value: 'v21', label: 'Angular v21' },
    ];
    versionService = TestBed.inject(DocsVersionService);
    fixture.detectChanges();
  });

  it('should create and verify accessible combobox and role="combobox"', () => {
    const triggerBtn = fixture.debugElement.query(By.css('[role="combobox"]'));
    expect(triggerBtn).toBeTruthy();
    expect(triggerBtn.attributes['aria-haspopup']).toBe('listbox');
    expect(triggerBtn.attributes['aria-expanded']).toBe('false');
  });

  it('should open dropdown and verify options', async () => {
    const triggerBtn = fixture.debugElement.query(By.css('[role="combobox"]'));
    triggerBtn.nativeElement.click();
    fixture.detectChanges();

    expect(triggerBtn.attributes['aria-expanded']).toBe('true');
    const listbox = fixture.debugElement.query(By.css('[role="listbox"]'));
    expect(listbox).toBeTruthy();

    const options = fixture.debugElement.queryAll(By.css('[role="option"]'));
    expect(options.length).toBe(2);
  });

  it('should navigate options on keydown and select on Enter', () => {
    const triggerBtn = fixture.debugElement.query(By.css('[role="combobox"]'));

    // Press ArrowDown to open
    triggerBtn.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(triggerBtn.attributes['aria-expanded']).toBe('true');

    // Press ArrowDown again to highlight second option (index 1 = v21 since initial index was 0)
    triggerBtn.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();

    // Verify it updates service version when pressing Enter
    const setVersionSpy = vi.spyOn(versionService, 'setVersion');
    triggerBtn.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();

    expect(setVersionSpy).toHaveBeenCalledWith('v22');
    expect(triggerBtn.attributes['aria-expanded']).toBe('false');
  });

  it('should close dropdown on Escape', () => {
    const triggerBtn = fixture.debugElement.query(By.css('[role="combobox"]'));
    triggerBtn.nativeElement.click();
    fixture.detectChanges();
    expect(triggerBtn.attributes['aria-expanded']).toBe('true');

    triggerBtn.nativeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(triggerBtn.attributes['aria-expanded']).toBe('false');
  });

  it('should hide the dropdown completely when only one option is available', () => {
    const singleFixture = TestBed.createComponent(VersionDropdownComponent);
    singleFixture.detectChanges();
    const triggerBtn = singleFixture.debugElement.query(By.css('[role="combobox"]'));
    expect(triggerBtn).toBeNull();
  });
});
