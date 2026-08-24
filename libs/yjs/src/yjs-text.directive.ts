/* eslint-disable @angular-eslint/directive-selector */
import { Directive, ElementRef, DestroyRef, inject, input, effect } from '@angular/core';
import * as Y from 'yjs';

/**
 * Directive that binds a Y.Text instance to an HTMLInputElement or HTMLTextAreaElement.
 * Automatically synchronizes content bidirectionally and preserves cursor selection during remote concurrent edits.
 *
 * @example
 * ```html
 * <textarea [yjsText]="yTextDoc" class="textarea"></textarea>
 * ```
 */
@Directive({
  selector: 'input[yjsText], textarea[yjsText]',
  host: {
    '(input)': 'onInput($event)',
  },
})
export class YjsTextDirective {
  private readonly elRef = inject<ElementRef<HTMLInputElement | HTMLTextAreaElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * The Y.Text CRDT shared type to bind.
   */
  readonly yjsText = input.required<Y.Text>();

  /**
   * Transaction origin label for local changes (default: 'yjs-text-directive').
   */
  readonly origin = input<string | symbol>('yjs-text-directive');

  private currentYText: Y.Text | null = null;
  private observer: ((event: Y.YTextEvent, transaction: Y.Transaction) => void) | null = null;

  constructor() {
    effect(() => {
      const yText = this.yjsText();
      this.attachYText(yText);
    });

    this.destroyRef.onDestroy(() => {
      this.detachYText();
    });
  }

  private detachYText(): void {
    if (this.currentYText && this.observer) {
      this.currentYText.unobserve(this.observer);
      this.currentYText = null;
      this.observer = null;
    }
  }

  private attachYText(yText: Y.Text): void {
    this.detachYText();
    this.currentYText = yText;

    const el = this.elRef.nativeElement;
    el.value = yText.toString();

    this.observer = (event: Y.YTextEvent, transaction: Y.Transaction) => {
      if (transaction.origin === this.origin()) {
        return;
      }

      const doc = yText.doc;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;

      let rStart: Y.RelativePosition | null = null;
      let rEnd: Y.RelativePosition | null = null;

      if (doc) {
        rStart = Y.createRelativePositionFromTypeIndex(yText, start);
        rEnd = Y.createRelativePositionFromTypeIndex(yText, end);
      }

      el.value = yText.toString();

      if (doc && rStart && rEnd) {
        const absStart = Y.createAbsolutePositionFromRelativePosition(rStart, doc);
        const absEnd = Y.createAbsolutePositionFromRelativePosition(rEnd, doc);

        if (absStart !== null && absEnd !== null) {
          el.setSelectionRange(absStart.index, absEnd.index);
        }
      }
    };

    yText.observe(this.observer);
  }

  protected onInput(_event: Event): void {
    const yText = this.currentYText;
    if (!yText) return;

    const el = this.elRef.nativeElement;
    const nextVal = el.value;
    const currentVal = yText.toString();

    if (nextVal === currentVal) return;

    const doc = yText.doc;
    const origin = this.origin();

    const applyDiff = () => {
      let start = 0;
      while (
        start < currentVal.length &&
        start < nextVal.length &&
        currentVal.charCodeAt(start) === nextVal.charCodeAt(start)
      ) {
        start++;
      }

      let oldEnd = currentVal.length;
      let newEnd = nextVal.length;
      while (
        oldEnd > start &&
        newEnd > start &&
        currentVal.charCodeAt(oldEnd - 1) === nextVal.charCodeAt(newEnd - 1)
      ) {
        oldEnd--;
        newEnd--;
      }

      const deleteCount = oldEnd - start;
      const insertStr = nextVal.slice(start, newEnd);

      if (deleteCount > 0) {
        yText.delete(start, deleteCount);
      }
      if (insertStr.length > 0) {
        yText.insert(start, insertStr);
      }
    };

    if (doc) {
      doc.transact(applyDiff, origin);
    } else {
      applyDiff();
    }
  }
}
