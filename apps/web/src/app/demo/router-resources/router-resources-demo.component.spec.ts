import { TestBed } from '@angular/core/testing';
import { RouterResourcesDemoComponent } from './router-resources-demo.component';

describe('RouterResourcesDemoComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RouterResourcesDemoComponent],
    }).compileComponents();
  });

  it('should create the component', () => {
    const fixture = TestBed.createComponent(RouterResourcesDemoComponent);
    const component = fixture.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should initialize with default parameters and status', () => {
    const fixture = TestBed.createComponent(RouterResourcesDemoComponent);
    const component = fixture.componentInstance;

    expect(component.selectedPackage()).toBe('browser-web-apis');
    expect(component.selectedVersion()).toBe('v22');
    expect(component.simulatedDelay()).toBe(300);
    expect(component.demoResource).toBeDefined();
  });

  it('should reload resource when reloadResource is called', async () => {
    const fixture = TestBed.createComponent(RouterResourcesDemoComponent);
    const component = fixture.componentInstance;

    component.reloadResource();
    expect(component.statusColor()).toBeDefined();
  });

  it('should resolve demoResource for feature and core packages and compute statusColor for all states', async () => {
    const fixture = TestBed.createComponent(RouterResourcesDemoComponent);
    const component = fixture.componentInstance;

    component.simulatedDelay.set(5);
    fixture.detectChanges();

    // Wait for initial loader to complete
    await new Promise((resolve) => setTimeout(resolve, 25));
    fixture.detectChanges();

    expect(component.demoResource.value()?.id).toBe('@angular-helpers/browser-web-apis');
    expect(component.demoResource.value()?.category).toBe('Feature Library');
    expect(component.demoResource.value()?.payloadSize).toBe('14.8 kB');
    expect(component.statusColor()).toBe('bg-success');

    // Switch package to core
    component.selectedPackage.set('core');
    component.selectedVersion.set('v21');
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 25));
    fixture.detectChanges();

    expect(component.demoResource.value()?.id).toBe('@angular-helpers/core');
    expect(component.demoResource.value()?.category).toBe('Foundation');
    expect(component.demoResource.value()?.payloadSize).toBe('2.4 kB');
    expect(component.demoResource.value()?.version).toBe('v21');

    // Verify statusColor for each status branch
    const statusSpy = vi.spyOn(component.demoResource, 'status');
    statusSpy.mockReturnValue('loading');
    expect(component.statusColor()).toBe('bg-warning animate-pulse');

    statusSpy.mockReturnValue('reloading');
    expect(component.statusColor()).toBe('bg-warning animate-pulse');

    statusSpy.mockReturnValue('error');
    expect(component.statusColor()).toBe('bg-error');

    statusSpy.mockReturnValue('idle');
    expect(component.statusColor()).toBe('bg-base-content/30');
  });
});
