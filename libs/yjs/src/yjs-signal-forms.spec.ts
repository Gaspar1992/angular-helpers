import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { form, required } from '@angular/forms/signals';
import { yjsSignal } from './yjs-signal';
import { injectYjsUndoManager } from './yjs-undo';
import { TestBed } from '@angular/core/testing';

interface CollaborativeProfile {
  name: string;
  role: string;
}

describe('Yjs & Angular Signal Forms Interoperability', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should drive an Angular Signal Form directly from a yjsSignal model', () => {
    const doc = new Y.Doc();
    const yMap = doc.getMap('profile');
    yMap.set('name', 'Alice');
    yMap.set('role', 'Developer');

    TestBed.runInInjectionContext(() => {
      // 1. Create Yjs-backed WritableSignal model
      const profileModel = yjsSignal<CollaborativeProfile>(yMap);

      // 2. Initialize Angular Signal Form with the Yjs model
      const profileForm = form(profileModel, (f) => {
        required(f.name);
        required(f.role);
      });

      expect(profileForm.name().value()).toBe('Alice');
      expect(profileForm.role().value()).toBe('Developer');
      expect(profileForm.name().valid()).toBe(true);
      expect(profileForm.role().valid()).toBe(true);

      // 3. User edits a field in the form UI
      profileForm.name().value.set('Alice Smith');

      // Verify Yjs shared type transacted automatically
      expect(yMap.get('name')).toBe('Alice Smith');
      expect(profileModel().name).toBe('Alice Smith');

      // 4. Remote peer changes role via CRDT
      yMap.set('role', 'Principal Architect');

      // Signal form reactively reflects the remote CRDT update
      expect(profileForm.role().value()).toBe('Principal Architect');
      expect(profileModel().role).toBe('Principal Architect');
    });
  });

  it('should support Undo/Redo operations seamlessly across Signal Forms', () => {
    const doc = new Y.Doc();
    const yMap = doc.getMap('profile');
    yMap.set('name', 'Initial');
    yMap.set('role', 'Dev');

    TestBed.runInInjectionContext(() => {
      const profileModel = yjsSignal<CollaborativeProfile>(yMap);
      const undoRef = injectYjsUndoManager(yMap);

      const profileForm = form(profileModel);

      // User performs edit 1
      profileForm.name().value.set('Edit 1');
      expect(profileForm.name().value()).toBe('Edit 1');
      expect(undoRef.canUndo()).toBe(true);

      // User performs edit 2
      undoRef.stopCapturing();
      profileForm.name().value.set('Edit 2');
      expect(profileForm.name().value()).toBe('Edit 2');

      // Undo edit 2 -> should return to Edit 1
      undoRef.undo();
      expect(profileForm.name().value()).toBe('Edit 1');
      expect(yMap.get('name')).toBe('Edit 1');

      // Redo -> should return to Edit 2
      undoRef.redo();
      expect(profileForm.name().value()).toBe('Edit 2');
      expect(yMap.get('name')).toBe('Edit 2');
    });
  });
});
