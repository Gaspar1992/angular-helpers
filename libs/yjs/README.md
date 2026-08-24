# 🔄 @angular-helpers/yjs

A modern, high-performance, and reactive Angular Signal integration for **Yjs CRDTs** (Conflict-free Replicated Data Types). Build collaborative real-time apps, multi-tab sync, presence tracking, and offline persistence with zero feedback loops.

---

## 📦 Installation

```bash
pnpm add @angular-helpers/yjs yjs
# Optional network & persistence providers:
pnpm add y-websocket y-indexeddb y-protocols y-webrtc
```

---

## ⚡ Quick Path

### 1. Document Service & Signal Synchronization

```typescript
import { Component, inject } from '@angular/core';
import { yjsSignal, YjsDocService, YjsTextDirective } from '@angular-helpers/yjs';

@Component({
  selector: 'app-editor',
  imports: [YjsTextDirective],
  template: `
    <!-- Direct bidirectional Y.Text binding with cursor preservation -->
    <textarea [yjsText]="content" class="textarea"></textarea>

    <!-- Key-bound signal -->
    <input [value]="title()" (input)="title.set($any($event.target).value)" />
  `,
})
export class EditorComponent {
  private readonly yjs = inject(YjsDocService);
  private readonly yMap = this.yjs.doc.getMap('metadata');

  // Bind single property of Y.Map to a WritableSignal
  protected readonly title = yjsSignal<string>(this.yMap, {
    key: 'title',
    initialValue: 'Untitled Document',
  });

  // Shared Y.Text CRDT
  protected readonly content = this.yjs.doc.getText('content');
}
```

---

### 2. Undo / Redo Manager Integration

```typescript
import { Component, inject } from '@angular/core';
import { injectYjsUndoManager, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-toolbar',
  template: `
    <button [disabled]="!undoRef.canUndo()" (click)="undoRef.undo()">↺ Undo</button>
    <button [disabled]="!undoRef.canRedo()" (click)="undoRef.redo()">↻ Redo</button>
  `,
})
export class ToolbarComponent {
  private readonly yjs = inject(YjsDocService);
  protected readonly undoRef = injectYjsUndoManager(this.yjs.doc.getText('content'));
}
```

---

### 3. Presence & Awareness (Avatars & Cursors)

```typescript
import { Component, inject } from '@angular/core';
import { injectYjsAwareness, injectYjsWebsocket, YjsDocService } from '@angular-helpers/yjs';

interface CollabUser {
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

@Component({
  selector: 'app-presence',
  template: `
    <div class="collaborators">
      @for (user of presence.remoteUsers(); track user.clientID) {
        <span class="badge" [style.background-color]="user.state.color">
          {{ user.state.name }}
        </span>
      }
    </div>
  `,
})
export class PresenceComponent {
  private readonly yjs = inject(YjsDocService);
  private readonly ws = injectYjsWebsocket('wss://collab.example.com', 'room-1', this.yjs.doc);

  protected readonly presence = injectYjsAwareness<CollabUser>(this.ws.provider.awareness, {
    name: 'Alice',
    color: '#3b82f6',
  });
}
```

---

### 4. Offline Persistence with IndexedDB

```typescript
import { Component, inject } from '@angular/core';
import { injectYjsIndexeddb, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-offline-doc',
  template: ` <div>Storage Hydration: {{ db.synced() ? 'Ready' : 'Syncing...' }}</div> `,
})
export class OfflineDocComponent {
  private readonly yjs = inject(YjsDocService);
  protected readonly db = injectYjsIndexeddb('my_project_db', this.yjs.doc);
}
```

---

### 5. Angular Signal Forms Interoperability

`yjsSignal` returns a standard Angular `WritableSignal<T>`, making it a first-class model driver for Angular v21/v22 Signal Forms:

```typescript
import { Component, inject } from '@angular/core';
import { form, required, FormField } from '@angular/forms/signals';
import { yjsSignal, YjsDocService } from '@angular-helpers/yjs';

interface ProjectSettings {
  name: string;
  visibility: 'public' | 'private';
}

@Component({
  selector: 'app-collab-settings-form',
  imports: [FormField],
  template: `
    <form>
      <input [control]="settingsForm.name" class="input" />
      <select [control]="settingsForm.visibility" class="select">
        <option value="public">Public</option>
        <option value="private">Private</option>
      </select>
    </form>
  `,
})
export class CollabSettingsFormComponent {
  private readonly yjs = inject(YjsDocService);
  private readonly yMap = this.yjs.doc.getMap('settings');

  // WritableSignal CRDT model powering the Signal Form directly
  private readonly model = yjsSignal<ProjectSettings>(this.yMap, {
    initialValue: { name: 'New Project', visibility: 'private' },
  });

  protected readonly settingsForm = form(this.model, (f) => {
    required(f.name);
  });
}
```

---

## 🔬 Under the Hood

| Primitive / Service    | Technical Strategy                                                   | Cognitive & Architecture Benefit                                                                   |
| :--------------------- | :------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| `yjsSignal`            | Non-destructive diff reconciliation & transaction origin matching    | Prevents cyclic feedback loops and retains CRDT node identity during signal updates.               |
| `YjsTextDirective`     | Relative position indexing via `createRelativePositionFromTypeIndex` | Preserves cursor & text selection range across concurrent remote edits without jumping.            |
| `injectYjsUndoManager` | Lifecycle-bound `Y.UndoManager` wrapped into read-only Signals       | Declarative `canUndo` and `canRedo` signals ready for UI template binding.                         |
| `injectYjsAwareness`   | Reactive signal wrapper for `y-protocols/awareness`                  | Simplifies multi-user presence, active users, and remote cursor streams.                           |
| `injectYjsWebsocket`   | Reactive wrapper for `y-websocket`                                   | Reactive connection `status` ('connecting' \| 'connected' \| 'disconnected') and `isSynced` state. |
| `injectYjsIndexeddb`   | SSR-safe local offline hydration with `y-indexeddb`                  | Smooth background hydration with reactivity for local-first applications.                          |

---

## 🛠️ Verification Checklist

- [x] **Zero feedback loops**: Local signal mutations emit transaction origin `yjs-signal` and do not echo back.
- [x] **Non-destructive diffing**: Array and Text signal mutations apply minimal splice operations, maintaining CRDT tree consistency.
- [x] **Clean lifecycle disposal**: All observers and providers automatically disconnect on host `DestroyRef`.
- [x] **SSR Graceful Degradation**: Offline IndexedDB fallbacks safely in non-browser execution environments.
