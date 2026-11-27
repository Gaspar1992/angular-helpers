# 🤝 @angular-helpers/yjs

Reactive Angular 22+ Signals bridge for Yjs CRDTs — bind `Y.Map`, `Y.Array`, and `Y.Text` directly to Angular Signals with multi-document lifecycle management, WebSocket sync, IndexedDB persistence, Awareness, and UndoManager.

---

## Quick Path

### 1. Installation

```bash
pnpm add @angular-helpers/yjs yjs
```

### 2. Multi-Doc Provider & Signal Usage

```typescript
import { Component, inject } from '@angular/core';
import { YjsDocService, YJS_DOC, provideYjsDoc, yjsMapSignal } from '@angular-helpers/yjs';

@Component({
  selector: 'app-collab-note',
  providers: [provideYjsDoc('room-42')],
  template: `<pre>{{ state() | json }}</pre>`,
})
export class CollabNoteComponent {
  private readonly doc = inject(YJS_DOC);
  readonly state = yjsMapSignal<{ title: string }>(this.doc.getMap('meta'));
}
```

---

## Secondary Entry Points & Primitives

| Primitive / Entry Point                             | Description                                                                            |
| :-------------------------------------------------- | :------------------------------------------------------------------------------------- |
| `YjsDocService` / `provideYjsDoc(name?)`            | Lifecycle-managed default & named `Y.Doc` registry (`getDoc`, `hasDoc`, `destroyDoc`). |
| `yjsMapSignal` / `yjsArraySignal` / `yjsTextSignal` | Bidirectional Angular Signals bound to Yjs shared types.                               |
| `yjsUndoSignal`                                     | Signal wrapper over `Y.UndoManager` (`canUndo`, `canRedo`, `undo()`, `redo()`).        |
| `YjsTextDirective`                                  | Two-way binding directive for collaborative `<input>` / `<textarea>` elements.         |
| `@angular-helpers/yjs/websocket`                    | `YjsWebsocketService` with exponential backoff and status signals.                     |
| `@angular-helpers/yjs/indexeddb`                    | `YjsIndexeddbService` for offline-first local CRDT persistence.                        |
| `@angular-helpers/yjs/awareness`                    | Presence & cursor state signals via `YjsAwarenessService`.                             |

---

## Interactive Documentation & Demo

👉 **[Yjs Docs](https://gaspar1992.github.io/angular-helpers/docs/yjs)**
👉 **[Yjs Collaborative Demo](https://gaspar1992.github.io/angular-helpers/demo/yjs)**

## License

MIT
