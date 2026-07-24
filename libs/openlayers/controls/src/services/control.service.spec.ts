// OlControlService unit tests
import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { OlControlService } from './control.service';

describe('OlControlService', () => {
  it('addCustomControl is a no-op stub that does not throw', () => {
    const svc = new OlControlService();
    const el = document.createElement('div');
    expect(() => svc.addCustomControl(el, 'top-right')).not.toThrow();
  });

  it('removeCustomControl is a no-op stub that does not throw', () => {
    const svc = new OlControlService();
    const el = document.createElement('div');
    expect(() => svc.removeCustomControl(el)).not.toThrow();
  });
});
