import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  YjsDocService,
  yjsSignal,
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

interface DocState {
  title: string;
  content: string;
}

@Component({
  selector: 'app-yjs-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <!-- Header -->
      <div class="text-center space-y-4">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
          <span>🔄</span>
          <span>@angular-helpers/yjs</span>
          <span class="badge badge-sm badge-primary">v22.0.0</span>
        </div>
        <h1 class="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
          Real-Time CRDT Collaboration & Signals
        </h1>
        <p class="text-lg text-base-content/70 max-w-2xl mx-auto">
          Seamlessly synchronize Angular Signals with Yjs shared types, UndoManager stack, presence awareness, and offline IndexedDB persistence with zero feedback loops.
        </p>
      </div>

      <!-- Main Interactive Panel Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Column 1 & 2: Collaborative Document & Signals -->
        <div class="lg:col-span-2 space-y-6">

          <!-- Collaborative Editor Card -->
          <div class="card bg-base-200/50 backdrop-blur-md border border-base-300 shadow-xl rounded-3xl p-6 space-y-6">
            <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-base-300">
              <div class="flex items-center gap-3">
                <span class="text-3xl">📝</span>
                <div>
                  <h2 class="text-xl font-bold">Collaborative Document</h2>
                  <p class="text-xs text-base-content/60">Y.Map bound to WritableSignal</p>
                </div>
              </div>

              <!-- Undo/Redo Toolbar -->
              <div class="flex items-center gap-2 bg-base-300/50 p-1.5 rounded-2xl border border-base-300">
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
                <label class="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2">
                  Document Title
                </label>
                <input
                  type="text"
                  [ngModel]="docState().title"
                  (ngModelChange)="updateTitle($event)"
                  placeholder="Enter document title..."
                  class="input input-bordered w-full font-bold text-lg bg-base-100/70 focus:outline-primary"
                />
              </div>

              <div>
                <label class="block text-xs font-semibold text-base-content/70 uppercase tracking-wider mb-2">
                  Content Body
                </label>
                <textarea
                  rows="5"
                  [ngModel]="docState().content"
                  (ngModelChange)="updateContent($event)"
                  placeholder="Start typing collaborative notes..."
                  class="textarea textarea-bordered w-full font-mono text-sm bg-base-100/70 focus:outline-primary"
                ></textarea>
              </div>
            </div>

            <!-- Signal Output Inspector -->
            <div class="bg-base-300/40 rounded-2xl p-4 space-y-2 border border-base-300">
              <div class="text-xs font-semibold uppercase tracking-wider text-base-content/60 flex items-center justify-between">
                <span>Signal State Snapshot</span>
                <span class="badge badge-xs badge-accent">Live Reactive Binding</span>
              </div>
              <pre class="text-xs font-mono bg-base-100/80 p-3 rounded-xl overflow-x-auto text-primary">
{{ JSON.stringify(docState(), null, 2) }}
              </pre>
            </div>
          </div>

          <!-- Feature Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Offline Persistence Card -->
            <div class="card bg-base-200/50 backdrop-blur-md border border-base-300 p-5 space-y-3 rounded-2xl">
              <div class="flex items-center gap-3">
                <span class="text-2xl">💾</span>
                <div>
                  <h3 class="font-bold text-sm">IndexedDB Persistence</h3>
                  <span class="text-xs text-base-content/60">injectYjsIndexeddb</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-xs pt-2">
                <span>Hydration Status:</span>
                <span
                  class="badge badge-sm font-semibold"
                  [class.badge-success]="dbRef.synced()"
                  [class.badge-warning]="!dbRef.synced()"
                >
                  {{ dbRef.synced() ? 'Synced & Ready' : 'Hydrating...' }}
                </span>
              </div>
            </div>

            <!-- Network Status Card -->
            <div class="card bg-base-200/50 backdrop-blur-md border border-base-300 p-5 space-y-3 rounded-2xl">
              <div class="flex items-center gap-3">
                <span class="text-2xl">⚡</span>
                <div>
                  <h3 class="font-bold text-sm">Zero-Feedback Sync</h3>
                  <span class="text-xs text-base-content/60">Transaction Origin Protection</span>
                </div>
              </div>
              <p class="text-xs text-base-content/70">
                Signal writes tag transactions with local client origins to prevent recursive update cycles.
              </p>
            </div>
          </div>

        </div>

        <!-- Column 3: Presence & Collaborators Panel -->
        <div class="space-y-6">

          <!-- Presence Card -->
          <div class="card bg-base-200/50 backdrop-blur-md border border-base-300 shadow-xl rounded-3xl p-6 space-y-6">
            <div class="flex items-center gap-3 pb-4 border-b border-base-300">
              <span class="text-3xl">👥</span>
              <div>
                <h2 class="text-xl font-bold">Presence & Awareness</h2>
                <p class="text-xs text-base-content/60">injectYjsAwareness</p>
              </div>
            </div>

            <!-- Local User Controls -->
            <div class="space-y-4">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                Your Local Profile
              </h3>
              
              <div class="space-y-3">
                <div>
                  <label class="text-xs text-base-content/60 block mb-1">User Name</label>
                  <input
                    type="text"
                    [ngModel]="presence.localState()?.name"
                    (ngModelChange)="presence.patchLocalState({ name: $event })"
                    class="input input-sm input-bordered w-full bg-base-100/70"
                  />
                </div>

                <div>
                  <label class="text-xs text-base-content/60 block mb-1">Avatar Color</label>
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      [ngModel]="presence.localState()?.color"
                      (ngModelChange)="presence.patchLocalState({ color: $event })"
                      class="w-10 h-9 rounded-xl border border-base-300 cursor-pointer p-1 bg-base-100"
                    />
                    <span class="font-mono text-xs text-base-content/70">{{ presence.localState()?.color }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Active Collaborators List -->
            <div class="space-y-3 pt-2">
              <div class="flex items-center justify-between">
                <h3 class="text-xs font-semibold uppercase tracking-wider text-base-content/70">
                  Connected Users ({{ presence.users().length }})
                </h3>
                <button
                  class="btn btn-xs btn-outline btn-primary"
                  (click)="simulateRemoteUserJoin()"
                >
                  + Simulate User
                </button>
              </div>

              <div class="space-y-2">
                @for (user of presence.users(); track user.clientID) {
                  <div class="flex items-center justify-between p-3 rounded-2xl bg-base-100/80 border border-base-300 transition-all hover:scale-[1.01]">
                    <div class="flex items-center gap-3">
                      <div
                        class="w-4 h-4 rounded-full shadow-inner"
                        [style.background-color]="user.state.color"
                      ></div>
                      <div class="text-xs">
                        <div class="font-bold flex items-center gap-1.5">
                          <span>{{ user.state.name }}</span>
                          @if (user.isLocal) {
                            <span class="badge badge-xs badge-primary font-normal">You</span>
                          }
                        </div>
                        <div class="text-[10px] text-base-content/50 font-mono">
                          Client #{{ user.clientID }}
                        </div>
                      </div>
                    </div>

                    @if (!user.isLocal) {
                      <button
                        class="btn btn-xs btn-ghost text-error"
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
  private yjs = inject(YjsDocService);

  // Yjs Shared Map for document properties
  private yMap = this.yjs.doc.getMap<string>('doc_properties');

  constructor() {
    if (!this.yMap.has('title')) {
      this.yMap.set('title', 'Collaborative Strategy Roadmap');
    }
    if (!this.yMap.has('content')) {
      this.yMap.set(
        'content',
        'Architect reactive Angular applications with CRDT state management. Signals automatically update across users with zero feedback loops.',
      );
    }
  }

  // WritableSignal bound to Yjs Shared Map
  protected docState = yjsSignal<DocState>(this.yMap);

  updateTitle(newTitle: string): void {
    this.docState.update((current) => ({ ...current, title: newTitle }));
  }

  updateContent(newContent: string): void {
    this.docState.update((current) => ({ ...current, content: newContent }));
  }

  // UndoManager binding
  protected undoRef = injectYjsUndoManager(this.yMap);

  // Awareness binding with mock awareness instance
  private mockAwarenessDoc = new YjsDocService().doc;
  private awarenessInstance = new Awareness(this.mockAwarenessDoc);

  protected presence = injectYjsAwareness<UserPresence>(this.awarenessInstance, {
    name: 'Senior Architect',
    color: '#3b82f6',
  });

  // IndexedDB persistence binding
  protected dbRef = injectYjsIndexeddb('angular_helpers_yjs_demo', this.yjs.doc);

  private simulatedCount = signal(1);

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
