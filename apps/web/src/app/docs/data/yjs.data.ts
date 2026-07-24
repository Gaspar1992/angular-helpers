import type { ServiceDoc } from '../models/doc-meta.model';

export const YJS_SERVICES: ServiceDoc[] = [
  {
    id: 'yjs-signal',
    name: 'yjsSignal',
    description:
      'Creates a bidirectional Angular WritableSignal synchronized with Yjs CRDT types (Y.Map, Y.Array, Y.Text). Local signal updates transact onto the Yjs document, and remote Yjs transactions automatically update the Angular Signal with zero feedback loops.',
    scope: 'provided',
    importPath: '@angular-helpers/yjs',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'realtime-crdt',
    notes: [
      'Bidirectional synchronization between Angular WritableSignal and Yjs CRDT types.',
      'Supports Y.Map, Y.Array, and Y.Text.',
      'Prevents recursive feedback loops by matching transaction origin.',
      'Automatically unbinds observers on component/service DestroyRef.',
    ],
    methods: [],
    fnVersion: {
      name: 'yjsSignal',
      importPath: '@angular-helpers/yjs',
      returnType: 'WritableSignal<T>',
      description:
        'Creates a bidirectional Angular WritableSignal synchronized with Yjs CRDT types (Y.Map, Y.Array, Y.Text).',
      fields: [
        {
          name: 'sharedType',
          type: 'Y.Map<any> | Y.Array<any> | Y.Text',
          description: 'The target Yjs shared type instance to synchronize.',
        },
        {
          name: 'options',
          type: 'YjsSignalOptions<T>',
          description:
            'Options specifying the key (for Y.Map), initial value, or custom property serializer.',
        },
      ],
      example: `import { Component, inject } from '@angular/core';
import { yjsSignal, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-yjs-demo',
  standalone: true,
  template: \`
    <input
      type="text"
      [value]="title()"
      (input)="title.set($any($event.target).value)"
    />
  \`
})
export class YjsDemoComponent {
  private yjs = inject(YjsDocService);
  private yMap = this.yjs.doc.getMap('settings');

  // Title signal automatically synced with Y.Map 'title' property
  protected title = yjsSignal<string>(this.yMap, { key: 'title', initialValue: 'Untitled Document' });
}`,
    },
    example: `import { Component, inject } from '@angular/core';
import { yjsSignal, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-yjs-demo',
  standalone: true,
  template: \`
    <div class="p-4 border rounded-xl">
      <h3 class="font-bold text-lg mb-2">Collaborative Notes</h3>
      <input
        type="text"
        [value]="title()"
        (input)="title.set($any($event.target).value)"
        class="input input-bordered w-full"
      />
    </div>
  \`
})
export class YjsDemoComponent {
  private yjs = inject(YjsDocService);
  private yMap = this.yjs.doc.getMap('settings');

  // Title signal automatically synced with Y.Map 'title' property
  protected title = yjsSignal<string>(this.yMap, { key: 'title', initialValue: 'Untitled Document' });
}`,
  },
  {
    id: 'inject-yjs-undo-manager',
    name: 'injectYjsUndoManager',
    description:
      'Creates a reactive Angular adapter for Yjs UndoManager. Exposes canUndo and canRedo read-only Signals to easily bind undo/redo UI buttons in collaborative editors.',
    scope: 'provided',
    importPath: '@angular-helpers/yjs',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'realtime-crdt',
    notes: [
      'Exposes reactive canUndo() and canRedo() read-only Signals.',
      'Supports undo(), redo(), clear(), and stopCapturing() methods.',
      'Tracks stack additions, pops, and resets automatically.',
      'Cleans up listeners and destroys UndoManager on DestroyRef.',
    ],
    methods: [],
    fnVersion: {
      name: 'injectYjsUndoManager',
      importPath: '@angular-helpers/yjs',
      returnType: 'YjsUndoRef',
      description: 'Creates an Angular reactive adapter wrapping Yjs UndoManager.',
      fields: [
        {
          name: 'typeScope',
          type: 'Y.AbstractType<any> | Y.AbstractType<any>[]',
          description: 'The Yjs shared type(s) to track for undo/redo operations.',
        },
        {
          name: 'options',
          type: 'YjsUndoOptions',
          description:
            'Optional configuration for trackedOrigins, ignoredOrigins, or captureTimeout.',
        },
      ],
      example: `import { Component, inject } from '@angular/core';
import { injectYjsUndoManager, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-collab-editor',
  standalone: true,
  template: \`
    <div class="toolbar flex gap-2">
      <button class="btn" [disabled]="!undoRef.canUndo()" (click)="undoRef.undo()">
        ↺ Undo
      </button>
      <button class="btn" [disabled]="!undoRef.canRedo()" (click)="undoRef.redo()">
        ↻ Redo
      </button>
    </div>
  \`
})
export class CollabEditorComponent {
  private yjs = inject(YjsDocService);
  private yText = this.yjs.doc.getText('document_content');

  protected undoRef = injectYjsUndoManager(this.yText);
}`,
    },
    example: `import { Component, inject } from '@angular/core';
import { injectYjsUndoManager, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-undo-demo',
  standalone: true,
  template: \`
    <button [disabled]="!undoRef.canUndo()" (click)="undoRef.undo()">Undo</button>
  \`
})
export class UndoDemoComponent {
  private yjs = inject(YjsDocService);
  protected undoRef = injectYjsUndoManager(this.yjs.doc.getMap('state'));
}`,
  },
  {
    id: 'inject-yjs-awareness',
    name: 'injectYjsAwareness',
    description:
      'Connects an Angular component or service to a Yjs Awareness protocol instance. Exposes reactive signals for local presence, active remote collaborators, and cursor/state updates.',
    scope: 'provided',
    importPath: '@angular-helpers/yjs',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'realtime-crdt',
    notes: [
      'Exposes localState(), users(), and remoteUsers() as read-only Angular Signals.',
      'Provides setLocalState() and patchLocalState() helpers.',
      'Automatically unbinds Awareness change listeners on DestroyRef.',
    ],
    methods: [],
    fnVersion: {
      name: 'injectYjsAwareness',
      importPath: '@angular-helpers/yjs',
      returnType: 'YjsAwarenessRef<TState>',
      description: 'Connects to a Yjs Awareness instance and returns reactive presence signals.',
      fields: [
        {
          name: 'awareness',
          type: 'Awareness',
          description: 'The Yjs Awareness protocol instance (from y-websocket or custom provider).',
        },
        {
          name: 'initialLocalState',
          type: 'TState',
          description: 'Optional initial presence state for the local user.',
        },
      ],
      example: `import { Component } from '@angular/core';
import { injectYjsAwareness } from '@angular-helpers/yjs';
import { Awareness } from 'y-protocols/awareness';

interface UserPresence {
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

@Component({
  selector: 'app-collab-cursors',
  standalone: true,
  template: \`
    <div class="collab-container">
      <h3>Active Collaborators ({{ presence.remoteUsers().length }})</h3>
      @for (user of presence.remoteUsers(); track user.clientID) {
        <div class="user-badge" [style.background-color]="user.state.color">
          {{ user.state.name }}
        </div>
      }
    </div>
  \`
})
export class CollabCursorsComponent {
  // Inject presence adapter for a Yjs Awareness instance
  protected presence = injectYjsAwareness<UserPresence>(awareness, {
    name: 'Gaspar',
    color: '#3b82f6'
  });

  updateCursor(x: number, y: number) {
    this.presence.patchLocalState({ cursor: { x, y } });
  }
}`,
    },
    example: `import { Component } from '@angular/core';
import { injectYjsAwareness } from '@angular-helpers/yjs';
import { Awareness } from 'y-protocols/awareness';

interface UserPresence {
  name: string;
  color: string;
}

@Component({
  selector: 'app-presence-demo',
  standalone: true,
  template: \`
    <div>Local User: {{ presence.localState()?.name }}</div>
  \`
})
export class PresenceDemoComponent {
  protected presence = injectYjsAwareness<UserPresence>(awareness, {
    name: 'Collaborator',
    color: '#10b981'
  });
}`,
  },
  {
    id: 'inject-yjs-websocket',
    name: 'injectYjsWebsocket',
    description:
      'Connects a Y.Doc to a y-websocket server. Exposes status() and isSynced() read-only Signals to track real-time WebSocket connection state.',
    scope: 'provided',
    importPath: '@angular-helpers/yjs',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers with WebSockets support',
    category: 'realtime-crdt',
    notes: [
      "Exposes status() ('connecting' | 'connected' | 'disconnected') and isSynced() Signals.",
      'Supports connect() and disconnect() methods.',
      'Cleans up listeners and destroys WebsocketProvider on DestroyRef.',
    ],
    methods: [],
    fnVersion: {
      name: 'injectYjsWebsocket',
      importPath: '@angular-helpers/yjs',
      returnType: 'YjsWebsocketRef',
      description:
        'Connects a Y.Doc to a y-websocket server endpoint and returns reactive connection signals.',
      fields: [
        {
          name: 'serverUrl',
          type: 'string',
          description: 'The WebSocket server endpoint (e.g. wss://demos.yjs.dev)',
        },
        { name: 'roomName', type: 'string', description: 'Room/document identifier key.' },
        { name: 'doc', type: 'Y.Doc', description: 'Target Y.Doc instance.' },
        {
          name: 'options?',
          type: 'YjsWebsocketOptions',
          description: 'Optional provider params or polyfills.',
        },
      ],
      example: `import { Component, inject } from '@angular/core';
import { injectYjsWebsocket, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-websocket-collab',
  standalone: true,
  template: \`
    <div class="status">Connection: {{ ws.status() }} | Synced: {{ ws.isSynced() }}</div>
  \`
})
export class WebsocketCollabComponent {
  private yjs = inject(YjsDocService);
  protected ws = injectYjsWebsocket('wss://demos.yjs.dev', 'my-room', this.yjs.doc);
}`,
    },
    example: `import { Component, inject } from '@angular/core';
import { injectYjsWebsocket, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-ws-demo',
  standalone: true,
  template: \`<div>Status: {{ ws.status() }}</div>\`
})
export class WsDemoComponent {
  private yjs = inject(YjsDocService);
  protected ws = injectYjsWebsocket('wss://demos.yjs.dev', 'demo-room', this.yjs.doc);
}`,
  },
  {
    id: 'inject-yjs-indexeddb',
    name: 'injectYjsIndexeddb',
    description:
      'Persists a Y.Doc to local IndexedDB storage using y-indexeddb. Exposes a synced() Signal to detect when local document hydration is complete.',
    scope: 'provided',
    importPath: '@angular-helpers/yjs',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers with IndexedDB support',
    category: 'realtime-crdt',
    notes: [
      'Exposes synced() Signal indicating hydration status.',
      'Includes clearData() method to wipe stored document state.',
      'SSR-safe: gracefully falls back when indexedDB is unavailable.',
    ],
    methods: [],
    fnVersion: {
      name: 'injectYjsIndexeddb',
      importPath: '@angular-helpers/yjs',
      returnType: 'YjsIndexeddbRef',
      description: 'Persists a Y.Doc to IndexedDB and returns reactive hydration signals.',
      fields: [
        { name: 'name', type: 'string', description: 'IndexedDB key identifier name.' },
        { name: 'doc', type: 'Y.Doc', description: 'Target Y.Doc instance.' },
      ],
      example: `import { Component, inject } from '@angular/core';
import { injectYjsIndexeddb, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-offline-persistence',
  standalone: true,
  template: \`
    <div class="db-status">IndexedDB Status: {{ db.synced() ? 'Ready' : 'Hydrating...' }}</div>
  \`
})
export class OfflinePersistenceComponent {
  private yjs = inject(YjsDocService);
  protected db = injectYjsIndexeddb('my_app_doc', this.yjs.doc);
}`,
    },
    example: `import { Component, inject } from '@angular/core';
import { injectYjsIndexeddb, YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-db-demo',
  standalone: true,
  template: \`<div>Synced: {{ db.synced() }}</div>\`
})
export class DbDemoComponent {
  private yjs = inject(YjsDocService);
  protected db = injectYjsIndexeddb('doc_db', this.yjs.doc);
}`,
  },
  {
    id: 'yjs-provider',
    name: 'YjsDocService',
    description:
      'Injectable Angular service providing a managed singleton Y.Doc instance with lifecycle management and cleanup helpers.',
    scope: 'provided',
    importPath: '@angular-helpers/yjs',
    requiresSecureContext: false,
    browserSupport: 'All modern browsers',
    category: 'realtime-crdt',
    notes: [
      'Provides a root-level Y.Doc instance.',
      'Cleanly destroys document on root injector disposal.',
    ],
    methods: [
      {
        name: 'doc',
        description: 'The root Y.Doc instance managed by the service.',
        signature: 'readonly doc: Y.Doc',
        returns: 'Y.Doc',
      },
    ],
    example: `import { Component, inject } from '@angular/core';
import { YjsDocService } from '@angular-helpers/yjs';

@Component({
  selector: 'app-collab-editor',
  standalone: true,
  template: \`<div>Yjs Doc ID: {{ yjs.doc.clientID }}</div>\`
})
export class CollabEditorComponent {
  protected yjs = inject(YjsDocService);
}`,
  },
];
