import { Injectable, InjectionToken, type OnDestroy, type Provider } from '@angular/core';
import * as Y from 'yjs';

export const YJS_DOC = new InjectionToken<Y.Doc>('YJS_DOC');

/**
 * Provides a `YJS_DOC` instance backed by {@link YjsDocService}.
 * When `name` is omitted, provides the default shared `Y.Doc`.
 */
export function provideYjsDoc(name?: string): Provider {
  return {
    provide: YJS_DOC,
    useFactory: (service: YjsDocService) => (name ? service.getDoc(name) : service.doc),
    deps: [YjsDocService],
  };
}

/**
 * Service providing managed `Y.Doc` instances bound to the Angular DI lifecycle.
 * Supports both the default `doc` and named multi-document rooms via `getDoc(name)`.
 */
@Injectable({ providedIn: 'root' })
export class YjsDocService implements OnDestroy {
  readonly doc = new Y.Doc();
  private readonly namedDocs = new Map<string, Y.Doc>();

  getDoc(name: string): Y.Doc {
    let named = this.namedDocs.get(name);
    if (!named) {
      named = new Y.Doc();
      this.namedDocs.set(name, named);
    }
    return named;
  }

  hasDoc(name: string): boolean {
    return this.namedDocs.has(name);
  }

  destroyDoc(name: string): void {
    const named = this.namedDocs.get(name);
    if (named) {
      named.destroy();
      this.namedDocs.delete(name);
    }
  }

  getMap<T = unknown>(name: string): Y.Map<T> {
    return this.doc.getMap(name);
  }

  getArray<T = unknown>(name: string): Y.Array<T> {
    return this.doc.getArray(name);
  }

  getText(name: string): Y.Text {
    return this.doc.getText(name);
  }

  ngOnDestroy(): void {
    this.doc.destroy();
    for (const named of this.namedDocs.values()) {
      named.destroy();
    }
    this.namedDocs.clear();
  }
}
