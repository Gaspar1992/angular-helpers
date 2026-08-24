import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as Y from 'yjs';
import { YjsTextDirective } from './yjs-text.directive';

@Component({
  template: `
    <textarea [yjsText]="text()" [origin]="customOrigin()" class="textarea-test"></textarea>
  `,
  imports: [YjsTextDirective],
})
class TestHostComponent {
  readonly text = signal<Y.Text>(new Y.Doc().getText('content'));
  readonly customOrigin = signal<string>('yjs-text-directive');
}

describe('YjsTextDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let textarea: HTMLTextAreaElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent, YjsTextDirective],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    textarea = fixture.nativeElement.querySelector('textarea');
  });

  it('should initialize textarea with Y.Text content', () => {
    const doc = new Y.Doc();
    const yText = doc.getText('content');
    yText.insert(0, 'Hello Collaborative World');

    component.text.set(yText);
    fixture.detectChanges();

    expect(textarea.value).toBe('Hello Collaborative World');
  });

  it('should sync local textarea input events to Y.Text with minimal diff', () => {
    const doc = new Y.Doc();
    const yText = doc.getText('content');
    yText.insert(0, 'Hello');

    component.text.set(yText);
    fixture.detectChanges();

    textarea.value = 'Hello Angular';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(yText.toString()).toBe('Hello Angular');

    // Delete characters from end/middle
    textarea.value = 'Hello';
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(yText.toString()).toBe('Hello');
  });

  it('should ignore input event when value did not change', () => {
    const doc = new Y.Doc();
    const yText = doc.getText('content');
    yText.insert(0, 'Unchanged');

    component.text.set(yText);
    fixture.detectChanges();

    const insertSpy = vi.spyOn(yText, 'insert');
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(insertSpy).not.toHaveBeenCalled();
  });

  it('should update textarea and adjust selection when remote edits occur', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    docA.on('update', (u) => Y.applyUpdate(docB, u));
    docB.on('update', (u) => Y.applyUpdate(docA, u));

    const yTextA = docA.getText('content');
    const yTextB = docB.getText('content');
    yTextA.insert(0, 'Prefix Suffix');

    component.text.set(yTextA);
    fixture.detectChanges();

    const setSelectionRangeSpy = vi.spyOn(textarea, 'setSelectionRange');

    // Remote user inserts text
    yTextB.insert(0, 'Start ');

    // Local textarea value should update
    expect(textarea.value).toBe('Start Prefix Suffix');
    expect(setSelectionRangeSpy).toHaveBeenCalled();
  });

  it('should ignore changes originated by the directive itself', () => {
    const doc = new Y.Doc();
    const yText = doc.getText('content');
    component.text.set(yText);
    fixture.detectChanges();

    const setSelectionRangeSpy = vi.spyOn(textarea, 'setSelectionRange');

    // Transact with matching origin
    doc.transact(() => {
      yText.insert(0, 'Local edit');
    }, 'yjs-text-directive');

    expect(setSelectionRangeSpy).not.toHaveBeenCalled();
  });

  it('should switch binding and unobserve previous Y.Text when input changes', () => {
    const doc1 = new Y.Doc();
    const text1 = doc1.getText('first');
    text1.insert(0, 'Doc 1');

    const doc2 = new Y.Doc();
    const text2 = doc2.getText('second');
    text2.insert(0, 'Doc 2');

    component.text.set(text1);
    fixture.detectChanges();
    expect(textarea.value).toBe('Doc 1');

    component.text.set(text2);
    fixture.detectChanges();
    expect(textarea.value).toBe('Doc 2');

    // Updating old doc should not change textarea
    text1.insert(5, ' Modified');
    expect(textarea.value).toBe('Doc 2');

    // Updating new doc should change textarea
    text2.insert(5, ' Updated');
    expect(textarea.value).toBe('Doc 2 Updated');
  });

  it('should clean up observers on directive destruction', () => {
    const doc = new Y.Doc();
    const yText = doc.getText('content');
    yText.insert(0, 'Active');

    component.text.set(yText);
    fixture.detectChanges();

    fixture.destroy();

    // Updating yText after destroy should not throw
    yText.insert(6, ' more');
    expect(yText.toString()).toBe('Active more');
  });
});
