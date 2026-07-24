import { Injectable, OnDestroy } from '@angular/core';
import * as Y from 'yjs';

/**
 * Service providing a managed Y.Doc instance bound to the Angular dependency injection container lifecycle.
 */
@Injectable()
export class YjsDocService implements OnDestroy {
  readonly doc = new Y.Doc();

  getMap<T = any>(name: string): Y.Map<T> {
    return this.doc.getMap(name);
  }

  getArray<T = any>(name: string): Y.Array<T> {
    return this.doc.getArray(name);
  }

  getText(name: string): Y.Text {
    return this.doc.getText(name);
  }

  ngOnDestroy(): void {
    this.doc.destroy();
  }
}
