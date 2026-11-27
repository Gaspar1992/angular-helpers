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
    '(compositionstart)': 'onCompositionStart()',
    '(compositionend)': 'onCompositionEnd($event)',
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
  private isComposing = false;

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

      const isFocused = el.ownerDocument?.activeElement === el;
      const start = el.selectionStart ?? 0;
      const end = el.selectionEnd ?? 0;

      const nextStart = transformIndexByDelta(start, event.delta);
      const nextEnd = transformIndexByDelta(end, event.delta);

      el.value = yText.toString();

      if (isFocused) {
        try {
          el.setSelectionRange(nextStart, nextEnd);
        } catch {
          // Non-text input types (e.g. email, number) do not support setSelectionRange
        }
      }
    };

    yText.observe(this.observer);
  }

  protected onCompositionStart(): void {
    this.isComposing = true;
  }

  protected onCompositionEnd(event: Event): void {
    this.isComposing = false;
    this.syncInputToYText(event);
  }

  protected onInput(event: Event): void {
    if (this.isComposing || (event as InputEvent).isComposing) {
      return;
    }
    this.syncInputToYText(event);
  }

  private syncInputToYText(_event: Event): void {
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

function transformIndexByDelta(
  index: number,
  delta: Array<{ retain?: number; insert?: unknown; delete?: number }>,
): number {
  let cursor = 0;
  let shifted = index;

  for (const op of delta) {
    if (typeof op.retain === 'number') {
      cursor += op.retain;
    } else if (op.insert !== undefined) {
      const insertLen = typeof op.insert === 'string' ? op.insert.length : 1;
      if (cursor <= shifted) {
        shifted += insertLen;
      }
      cursor += insertLen;
    } else if (typeof op.delete === 'number') {
      if (cursor < shifted) {
        const removedBefore = Math.min(op.delete, shifted - cursor);
        shifted -= removedBefore;
      }
    }
  }

  return Math.max(0, shifted);
}
