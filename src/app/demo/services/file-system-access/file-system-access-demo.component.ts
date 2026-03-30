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
  styleUrl: '../demo.styles.css',
  template: `
    <section class="svc-card" aria-labelledby="fs-acc-title">
      <div class="svc-card-head">
        <h2 class="svc-card-title" id="fs-acc-title">File System Access</h2>
        <div class="svc-badges">
          @if (supported) {
            <span class="badge badge-ok">supported</span>
          } @else {
            <span class="badge badge-warn">Chrome/Edge only</span>
          }
          <span class="badge badge-secure">secure context</span>
        </div>
      </div>
      <p class="svc-desc">Open local files and preview their contents via the native file picker.</p>
      <div class="svc-controls">
        <button class="btn btn-primary" (click)="openFiles()" [disabled]="!supported">
          Open files…
        </button>
      </div>
      @for (file of openedFiles(); track file.name) {
        <div class="file-card">
          <div class="file-card-head">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-size">{{ file.size | number }} bytes</span>
          </div>
          <div class="mono-block">
            {{ file.preview }}
            @if (file.preview.length >= 300) {
              …
            }
          </div>
        </div>
      }
      @if (!supported) {
        <p class="svc-hint">File System Access API is available in Chrome/Edge on desktop.</p>
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
