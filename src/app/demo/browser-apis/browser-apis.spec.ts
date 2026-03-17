import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BrowserApis } from './browser-apis';

describe('BrowserApis', () => {
  let component: BrowserApis;
  let fixture: ComponentFixture<BrowserApis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BrowserApis],
    }).compileComponents();

    fixture = TestBed.createComponent(BrowserApis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
