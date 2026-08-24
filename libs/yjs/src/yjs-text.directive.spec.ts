import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { YjsTextDirective } from './yjs-text.directive';

@Component({
  template: ` <textarea [yjsText]="text()" class="textarea-test"></textarea> `,
  imports: [YjsTextDirective],
})
class TestHostComponent {
  readonly text = signal<Y.Text>(new Y.Doc().getText('content'));
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
  });

  it('should update textarea when remote Y.Text change occurs', () => {
    const docA = new Y.Doc();
    const docB = new Y.Doc();
    docA.on('update', (u) => Y.applyUpdate(docB, u));
    docB.on('update', (u) => Y.applyUpdate(docA, u));

    const yTextA = docA.getText('content');
    const yTextB = docB.getText('content');
    yTextA.insert(0, 'Initial');

    component.text.set(yTextA);
    fixture.detectChanges();
    expect(textarea.value).toBe('Initial');

    // Simulate remote edit on docB
    yTextB.insert(7, ' Remote');
    expect(textarea.value).toBe('Initial Remote');
  });
});
