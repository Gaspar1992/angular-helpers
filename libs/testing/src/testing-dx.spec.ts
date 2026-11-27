import { Component, input, output, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render } from './render';

@Component({
  selector: 'ah-test-greeting',
  template: `
    <label for="name-input">Full Name</label>
    <input id="name-input" type="text" />
    <h2>Hello {{ name() }}</h2>
    <button type="button" (click)="saved.emit(name())">Save Greeting</button>
  `,
})
class TestGreetingComponent {
  readonly name = input('World');
  readonly saved = output<string>();
}

describe('Testing DX (T2)', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('supports getByText, getByRole, getByLabelText, rerender, and typed outputs', async () => {
    const onSaved = vi.fn<(val: string) => void>();

    const result = await render(TestGreetingComponent, {
      providers: [provideZonelessChangeDetection()],
      inputs: { name: 'Angular' },
      outputs: { saved: onSaved },
    });

    expect(result.getByText('Hello Angular').tagName).toBe('H2');
    expect(result.getByLabelText('Full Name').id).toBe('name-input');

    const btn = result.getByRole('button', { name: 'Save Greeting' });
    btn.click();
    expect(onSaved).toHaveBeenCalledWith('Angular');

    await result.rerender({ name: 'v22' });
    expect(result.getByText('Hello v22').tagName).toBe('H2');
  });
});
