import { Component, input, output, EventEmitter, Output } from '@angular/core';
import { render } from './render';
import { vi } from 'vitest';

@Component({
  selector: 'app-test',
  template:
    '<form id="my-form"><button (click)="onClick()">Click {{data()}}</button><input name="username" type="text" [value]="text" (input)="text = $any($event.target).value"><input name="password" type="password" (input)="pass = $any($event.target).value"></form>',
})
class TestComponent {
  data = input(1);
  val = 1;
  text = 'initial';
  pass = '';

  // Signal output
  action = output<number>();
  // Classic output
  @Output() legacyAction = new EventEmitter<string>();

  onClick() {
    this.val = 2;
    this.action.emit(this.data());
    this.legacyAction.emit('legacy');
  }
}

describe('render', () => {
  it('should render component and allow querying and clicking', async () => {
    const actionSpy = vi.fn();
    const legacySpy = vi.fn();

    const result = await render(TestComponent, {
      inputs: { data: 5 },
      outputs: {
        action: actionSpy,
        legacyAction: legacySpy,
      },
    });

    expect(result.component.data()).toBe(5);
    expect(result.query('button')?.textContent).toContain('Click 5');

    result.click('button');
    expect(result.component.val).toBe(2);

    // Verify outputs were bound and triggered correctly
    expect(actionSpy).toHaveBeenCalledWith(5);
    expect(legacySpy).toHaveBeenCalledWith('legacy');
  });

  it('should support typing realistically', async () => {
    const result = await render(TestComponent);
    result.type('[name="username"]', 'hello');
    expect(result.component.text).toBe('hello');
  });

  it('should support fillForm', async () => {
    const result = await render(TestComponent);
    result.fillForm('#my-form', { username: 'john', password: '123' });

    expect(result.component.text).toBe('john');
    expect(result.component.pass).toBe('123');
  });

  it('should support dynamic host templates with hostProperties', async () => {
    const result = await render(TestComponent, {
      template: '<app-test [data]="hostData"></app-test>',
      hostProperties: { hostData: 42 },
      inputs: { data: 10 },
    });

    expect(result.component).toBeDefined();
    expect(result.component.data()).toBe(42);
    expect(result.queryAll('input').length).toBe(2);
  });

  it('should throw errors when elements are not found', async () => {
    const result = await render(TestComponent, { detectInitialChanges: false });
    expect(() => result.click('#non-existent')).toThrow(/Element not found for selector/);
    expect(() => result.type('#non-existent', 'val')).toThrow(/Element not found for selector/);
    expect(() => result.fillForm('#non-existent-form', {})).toThrow(/Form not found for selector/);
  });

  it('should throw error when component is not found in custom template', async () => {
    await expect(
      render(TestComponent, { template: '<div>No component here</div>' }),
    ).rejects.toThrow(/Could not find directive or component/);
  });
});
