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
});
