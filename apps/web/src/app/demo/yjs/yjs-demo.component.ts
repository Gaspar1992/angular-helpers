import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  YjsDocService,
  yjsSignal,
  YjsTextDirective,
  injectYjsUndoManager,
  injectYjsAwareness,
  injectYjsIndexeddb,
} from '@angular-helpers/yjs';
import { Awareness } from 'y-protocols/awareness';

interface UserPresence {
  name: string;
  color: string;
  cursor?: { x: number; y: number };
}

@Component({
  selector: 'app-yjs-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, YjsTextDirective],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <!-- Header -->
      <div class="text-center space-y-4">
        <div
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20"
        >
          <span>🔄</span>
          <span>@angular-helpers/yjs</span>
          <span class="badge badge-sm badge-primary">v22.0.0</span>
        </div>
        <h1
          class="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent"
        >
          Real-Time CRDT Collaboration & Signals
        </h1>
        <p class="text-lg text-base-content/70 max-w-2xl mx-auto">
          Seamlessly synchronize Angular Signals with Yjs shared types, direct textarea directives
          with cursor preservation, UndoManager stack, presence awareness, and offline IndexedDB
          persistence with zero feedback loops.
        </p>
      </div>

      <!-- Main Interactive Panel Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Column 1 & 2: Collaborative Document & Signals -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Collaborative Editor Card -->
          <div
            class="card bg-base-200/50 backdrop-blur-md border border-base-300 shadow-xl rounded-3xl p-6 space-y-6"
          >
            <div
              class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-base-300"
            >
              <div class="flex items-center gap-3">
                <span class="text-3xl">📝</span>
                <div>
                  <h2 class="text-xl font-bold">Collaborative Document</h2>
                  <p class="text-xs text-base-content/60">
                    Y.Map & Y.Text bound to WritableSignal and [yjsText]
                  </p>
                </div>
              </div>

              <!-- Undo/Redo Toolbar -->
              <div
                class="flex items-center gap-2 bg-base-300/50 p-1.5 rounded-2xl border border-base-300"
              >
                <button
                  class="btn btn-sm btn-ghost gap-1 font-mono"
                  [disabled]="!undoRef.canUndo()"
                  (click)="undoRef.undo()"
                  title="Undo last CRDT mutation"
                >
                  <span>↺</span> Undo
                </button>
                <button
                  class="btn btn-sm btn-ghost gap-1 font-mono"
                  [disabled]="!undoRef.canRedo()"
                  (click)="undoRef.redo()"
                  title="Redo CRDT mutation"
                >
                  <span>↻</span> Redo
                </button>
                <button
                  class="btn btn-sm btn-ghost text-error font-mono text-xs"
                  [disabled]="!undoRef.canUndo() && !undoRef.canRedo()"
                  (click)="undoRef.clear()"
                >
                  Clear Stack
                </button>
              </div>
            </div>

            <!-- Fields -->
            <div class="space-y-4">
              <div>
                <label
                  class="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2"
                >
                  Document Title (yjsSignal key: 'title')
                </label>
                <input
                  type="text"
                  [value]="title()"
                  (input)="title.set($any($event.target).value)"
                  placeholder="Enter document title..."
                  class="input input-bordered w-full font-bold text-lg bg-base-100/70 focus:outline-primary"
                />
              </div>

              <div>
                <label
                  class="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2"
                >
                  Content Body ([yjsText] Directive with Cursor Preservation)
                </label>
                <textarea
                  rows="5"
                  [yjsText]="yText"
                  placeholder="Start typing collaborative notes..."
                  class="textarea textarea-bordered w-full font-mono text-sm bg-base-100/70 focus:outline-primary"
                ></textarea>
              </div>
            </div>

            <!-- Signal Output Inspector -->
            <div class="bg-base-300/40 rounded-2xl p-4 space-y-2 border border-base-300">
              <div
                class="text-xs font-semibold uppercase tracking-wider text-base-content/60 flex items-center justify-between"
              >
                <span>Live State Snapshot</span>
                <span class="badge badge-xs badge-accent">Reactive Signals</span>
              </div>
              <pre
                class="text-xs font-mono bg-base-100/80 p-3 rounded-xl overflow-x-auto text-primary"
                >{{ JSON.stringify({ title: title(), textLength: yText.length }, null, 2) }}
              </pre>
            </div>
          </div>

          <!-- Feature Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Offline Persistence Card -->
            <div
              class="card bg-base-200/50 backdrop-blur-md border border-base-300 p-5 space-y-3 rounded-2xl"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">💾</span>
                <div>
                  <h3 class="font-bold text-sm">IndexedDB Persistence</h3>
                  <span class="text-xs text-base-content/60">injectYjsIndexeddb</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs pt-2">
                <span class="text-base-content/70">Hydration Status:</span>
                <span
                  class="badge badge-sm"
                  [ngClass]="dbRef.synced() ? 'badge-success gap-1' : 'badge-warning gap-1'"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                  {{ dbRef.synced() ? 'Hydrated from IDB' : 'Hydrating...' }}
                </span>
              </div>
              <button
                class="btn btn-xs btn-outline btn-error w-full font-mono mt-1"
                (click)="dbRef.clearData()"
              >
                Clear IndexedDB Cache
              </button>
            </div>

            <!-- CRDT Architecture Specs -->
            <div
              class="card bg-base-200/50 backdrop-blur-md border border-base-300 p-5 space-y-3 rounded-2xl"
            >
              <div class="flex items-center gap-3">
                <span class="text-2xl">⚡</span>
                <div>
                  <h3 class="font-bold text-sm">CRDT Architecture</h3>
                  <span class="text-xs text-base-content/60">State-based convergence</span>
                </div>
              </div>
              <div class="space-y-1 text-xs text-base-content/70">
                <div class="flex justify-between">
                  <span>Client ID:</span>
                  <span class="font-mono text-primary font-bold">{{ yjs.doc.clientID }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Feedback Prevention:</span>
                  <span class="font-mono text-success">Active (Origin filter)</span>
                </div>
                <div class="flex justify-between">
                  <span>Cursor Tracking:</span>
                  <span class="font-mono text-accent">Relative Position Map</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Column 3: Presence & Active Collaborators -->
        <div class="space-y-6">
          <div
            class="card bg-base-200/50 backdrop-blur-md border border-base-300 shadow-xl rounded-3xl p-6 space-y-6"
          >
            <div class="flex items-center justify-between pb-4 border-b border-base-300">
              <div class="flex items-center gap-3">
                <span class="text-3xl">👥</span>
                <div>
                  <h2 class="text-xl font-bold">Awareness & Presence</h2>
                  <p class="text-xs text-base-content/60">injectYjsAwareness</p>
                </div>
              </div>
              <span class="badge badge-sm badge-primary font-mono font-bold">
                {{ presence.users().length }} online
              </span>
            </div>

            <!-- Local User Info -->
            <div class="bg-base-300/40 p-4 rounded-2xl space-y-3 border border-base-300">
              <span class="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Local Presence
              </span>
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md"
                  [style.background-color]="presence.localState()?.color"
                >
                  {{ presence.localState()?.name?.charAt(0) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="font-bold text-sm truncate">
                    {{ presence.localState()?.name }}
                  </div>
                  <div class="text-xs text-base-content/60 font-mono">
                    ClientID: {{ yjs.doc.clientID }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Remote Users List -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                  Active Remote Peers
                </span>
                <button
                  class="btn btn-xs btn-primary gap-1 font-mono"
                  (click)="simulateRemoteUserJoin()"
                >
                  <span>+</span> Simulate Join
                </button>
              </div>

              @if (presence.remoteUsers().length === 0) {
                <div
                  class="text-center py-8 px-4 bg-base-300/20 rounded-2xl border border-dashed border-base-300 text-base-content/50 text-xs space-y-1"
                >
                  <p>No remote peers connected.</p>
                  <p class="text-[11px]">Click "Simulate Join" to test live presence awareness.</p>
                </div>
              }

              <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                @for (user of presence.remoteUsers(); track user.clientID) {
                  <div
                    class="flex items-center justify-between p-3 rounded-2xl bg-base-100/60 border border-base-300 animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                        [style.background-color]="user.state.color"
                      >
                        {{ user.state.name.charAt(0) }}
                      </div>
                      <div>
                        <div class="text-xs font-bold">{{ user.state.name }}</div>
                        <div class="text-[10px] text-base-content/50 font-mono">
                          ClientID: {{ user.clientID }}
                        </div>
                      </div>
                    </div>
                    @if (!user.isLocal) {
                      <button
                        class="btn btn-ghost btn-xs text-error btn-circle"
                        (click)="removeSimulatedUser(user.clientID)"
                        title="Disconnect simulated user"
                      >
                        ✕
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class YjsDemoComponent {
  protected readonly JSON = JSON;

  // Root Yjs Document service
  protected readonly yjs = inject(YjsDocService);

  // Yjs Shared Map for document properties
  private readonly yMap = this.yjs.doc.getMap<string>('doc_properties');

  // Yjs Shared Text for collaborative content
  protected readonly yText = this.yjs.doc.getText('doc_content');

  constructor() {
    if (this.yText.length === 0) {
      this.yText.insert(
        0,
        'Architect reactive Angular applications with CRDT state management. Signals and directives automatically synchronize across users with zero feedback loops.',
      );
    }
  }

  // WritableSignal bound to single 'title' key in Yjs Shared Map
  protected readonly title = yjsSignal<string>(this.yMap, {
    key: 'title',
    initialValue: 'Collaborative Strategy Roadmap',
  });

  // UndoManager tracking both map and collaborative text
  protected readonly undoRef = injectYjsUndoManager([this.yMap, this.yText]);

  // Awareness binding with mock awareness instance
  private readonly mockAwarenessDoc = new YjsDocService().doc;
  private readonly awarenessInstance = new Awareness(this.mockAwarenessDoc);

  protected readonly presence = injectYjsAwareness<UserPresence>(this.awarenessInstance, {
    name: 'Senior Architect',
    color: '#3b82f6',
  });

  // IndexedDB persistence binding
  protected readonly dbRef = injectYjsIndexeddb('angular_helpers_yjs_demo', this.yjs.doc);

  private readonly simulatedCount = signal(1);

  simulateRemoteUserJoin(): void {
    const id = this.simulatedCount();
    this.simulatedCount.update((c) => c + 1);

    const simulatedDoc = new YjsDocService().doc;
    const remoteAwareness = new Awareness(simulatedDoc);

    const colors = ['#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    remoteAwareness.setLocalState({
      name: `Collaborator #${id}`,
      color: randomColor,
    });

    const states = new Map(this.awarenessInstance.getStates());
    const localState = remoteAwareness.getLocalState();
    if (localState) {
      states.set(remoteAwareness.clientID, localState);
    }

    // Broadcast change event
    (this.awarenessInstance as any).emit('change', [
      {
        added: [remoteAwareness.clientID],
        updated: [],
        removed: [],
      },
    ]);
  }

  removeSimulatedUser(clientID: number): void {
    const states = this.awarenessInstance.getStates();
    states.delete(clientID);
    (this.awarenessInstance as any).emit('change', [
      {
        added: [],
        updated: [],
        removed: [clientID],
      },
    ]);
  }
}
