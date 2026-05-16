import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FileSystemAccessService, PermissionsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-file-system-access-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PermissionsService, FileSystemAccessService],
  imports: [DecimalPipe],
  styleUrls: ['../demo.styles.css'],
  template: `
    <section class="svc-card" aria-labelledby="fs-acc-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="fs-acc-title">
          <span class="text-primary text-2xl">📁</span> File System Access
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success font-black">supported</span>
          } @else {
            <span class="badge badge-warning font-black">Chrome/Edge only</span>
          }
          <span class="badge badge-info font-black">secure context</span>
        </div>
      </div>
      <p class="svc-desc">
        Interact with the local file system using native system dialogs for a high-performance,
        OS-integrated experience.
      </p>

      <div class="svc-controls mb-8">
        <button class="btn btn-primary font-black" (click)="openFiles()" [disabled]="!supported">
          Select Local Files
        </button>
      </div>

      <div class="space-y-6">
        @for (file of openedFiles(); track file.name) {
          <div class="svc-result animate-in zoom-in-95 duration-500 shadow-xl">
            <div class="kv-row">
              <span class="kv-key">Resource Name</span>
              <span class="kv-val text-primary">{{ file.name }}</span>
            </div>
            <div class="kv-row">
              <span class="kv-key">Binary Size</span>
              <span class="kv-val text-secondary">{{ file.size | number }} bytes</span>
            </div>

            <label class="mt-6">Content Buffer Preview</label>
            <div
              class="mono-block font-black text-xs text-base-content/70 italic bg-base-content/5 p-5 rounded-xl border border-base-content/5 shadow-inner"
            >
              "{{ file.preview }}{{ file.preview.length >= 300 ? '...' : '' }}"
            </div>
          </div>
        }

        @if (supported && openedFiles().length === 0) {
          <div
            class="py-12 text-center bg-base-content/5 rounded-3xl border border-dashed border-base-content/10 shadow-inner"
          >
            <p class="text-[10px] font-black uppercase tracking-widest text-base-content/20 italic">
              Awaiting file input
            </p>
          </div>
        }
      </div>

      @if (!supported) {
        <div class="feedback feedback-info mt-8">
          <span class="text-2xl">ℹ️</span>
          <span>Available in Chromium-based browsers on desktop platforms.</span>
        </div>
      }
    </section>
  `,
})
export class FileSystemAccessDemoComponent {
  private readonly svc = inject(FileSystemAccessService);

  readonly supported = this.svc.isSupported();
  readonly openedFiles = signal<Array<{ name: string; size: number; preview: string }>>([]);

  async openFiles(): Promise<void> {
    if (!this.supported) return;
    try {
      const files = await this.svc.openFile({ multiple: true });
      const result = await Promise.all(
        files.map(async (f) => ({
          name: f.name,
          size: f.size,
          preview: (await f.text()).substring(0, 300),
        })),
      );
      this.openedFiles.set(result);
    } catch {
      // user cancelled or unsupported
    }
  }
}
