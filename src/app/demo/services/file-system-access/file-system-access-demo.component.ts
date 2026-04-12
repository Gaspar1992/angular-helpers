import {
  Component,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  inject,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FileSystemAccessService, PermissionsService } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-file-system-access-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [PermissionsService, FileSystemAccessService],
  imports: [DecimalPipe],
  template: `
    <section
      class="bg-base-200 border border-base-300 rounded-xl p-5 sm:p-6 mb-5"
      aria-labelledby="fs-acc-title"
    >
      <div class="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 class="text-lg sm:text-xl font-bold text-base-content m-0" id="fs-acc-title">
          File System Access
        </h2>
        <div class="flex gap-2 flex-wrap">
          @if (supported) {
            <span class="badge badge-success badge-sm">supported</span>
          } @else {
            <span class="badge badge-warning badge-sm">Chrome/Edge only</span>
          }
          <span class="badge badge-info badge-sm">secure context</span>
        </div>
      </div>
      <p class="text-sm text-base-content/80 mb-4 leading-relaxed">
        Open local files and preview their contents via the native file picker.
      </p>
      <div class="flex flex-wrap gap-2 items-center mb-4">
        <button class="btn btn-primary btn-sm" (click)="openFiles()" [disabled]="!supported">
          Open files…
        </button>
      </div>
      @for (file of openedFiles(); track file.name) {
        <div class="bg-base-300 border border-base-300 rounded-lg p-4 mb-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-base-content">{{ file.name }}</span>
            <span class="text-xs text-base-content/80">{{ file.size | number }} bytes</span>
          </div>
          <div
            class="bg-base-200 border border-base-300 rounded p-2 font-mono text-xs text-base-content break-all"
          >
            {{ file.preview }}
            @if (file.preview.length >= 300) {
              …
            }
          </div>
        </div>
      }
      @if (!supported) {
        <p class="text-xs text-base-content/80 italic">
          File System Access API is available in Chrome/Edge on desktop.
        </p>
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
