import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowserApisComponent } from './browser-apis';

describe('BrowserApisComponent', () => {
  let component: BrowserApisComponent;
  let fixture: ComponentFixture<BrowserApisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserApisComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowserApisComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
