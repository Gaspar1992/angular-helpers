import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  createAutoSerializer,
  createSerovalSerializer,
  createToonSerializer,
  structuredCloneSerializer,
} from '@angular-helpers/worker-http/serializer';
import { SERIALIZER_SAMPLES } from '../shared/samples';
import type { SerializerResult, SerializerSample } from '../shared/models';
import { byteSize } from '../shared/utils';
import { WorkerHttpDemoLogService } from '../shared/log.service';

@Component({
  selector: 'app-worker-http-serializer-comparison-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-base-200 border border-base-300 rounded-xl p-6 col-span-full">
      <div class="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 class="text-lg font-bold text-base-content m-0 flex items-center gap-2">
          🧬 Serializer Comparison
        </h2>
        <span class="badge badge-warning">v21.2.0</span>
      </div>
      <p class="text-sm text-base-content/80 mb-4">
        Same payload, three serializers. The
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded">auto</code> row shows
        which strategy
        <code class="font-mono text-xs bg-base-300 px-1.5 py-0.5 rounded"
          >createAutoSerializer()</code
        >
        picked. TOON wins on uniform arrays of objects with primitive values; seroval handles
        complex types; structured-clone is the zero-overhead default.
      </p>

      <div class="flex flex-wrap gap-2 mb-4">
        @for (sample of samples; track sample.id) {
          <button
            type="button"
            (click)="run(sample)"
            [disabled]="status() === 'running'"
            class="btn btn-sm"
            [class.btn-primary]="selectedId() === sample.id"
            [class.btn-ghost]="selectedId() !== sample.id"
          >
            {{ sample.label }}
          </button>
        }
      </div>

      @if (selectedSample(); as s) {
        <p class="text-xs text-base-content/60 mb-3 italic">{{ s.description }}</p>
      }

      @if (results().length > 0) {
        <div class="overflow-x-auto">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Serializer</th>
                <th>Format</th>
                <th class="text-right">Bytes</th>
                <th class="text-right">vs JSON</th>
                <th class="text-right">Time (ms)</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              @for (row of results(); track row.name) {
                <tr>
                  <td class="font-mono text-xs">{{ row.name }}</td>
                  <td>
                    <span class="badge badge-xs">{{ row.format }}</span>
                  </td>
                  <td class="text-right font-mono">{{ row.bytes }}</td>
                  <td class="text-right font-mono">{{ formatRatio(row.bytes) }}</td>
                  <td class="text-right font-mono">{{ row.elapsedMs.toFixed(2) }}</td>
                  <td class="text-xs text-base-content/70">{{ row.note ?? '' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
})
export class SerializerComparisonCardComponent {
  private readonly log = inject(WorkerHttpDemoLogService);

  protected readonly samples = SERIALIZER_SAMPLES;
  protected readonly status = signal<'idle' | 'running' | 'done'>('idle');
  protected readonly results = signal<readonly SerializerResult[]>([]);
  protected readonly selectedId = signal<SerializerSample['id'] | null>(null);
  protected readonly selectedSample = signal<SerializerSample | null>(null);
  protected readonly jsonReferenceBytes = signal<number>(0);

  async run(sample: SerializerSample): Promise<void> {
    this.status.set('running');
    this.selectedId.set(sample.id);
    this.selectedSample.set(sample);
    this.results.set([]);
    this.jsonReferenceBytes.set(0);

    try {
      const data = sample.build();
      const jsonBytes = byteSize(JSON.stringify(data));
      this.jsonReferenceBytes.set(jsonBytes);

      const out: SerializerResult[] = [];

      out.push(measure('JSON.stringify', 'json', () => JSON.stringify(data), 'baseline'));
      out.push(
        measure(
          'structuredClone',
          structuredCloneSerializer.serialize(data).format,
          () => structuredCloneSerializer.serialize(data).data,
          'native postMessage path',
        ),
      );

      try {
        const seroval = await createSerovalSerializer();
        out.push(
          measure('seroval', 'seroval', () => seroval.serialize(data).data, 'full type fidelity'),
        );
      } catch {
        out.push({
          name: 'seroval',
          format: 'n/a',
          bytes: 0,
          elapsedMs: 0,
          note: 'peer dep missing',
        });
      }

      try {
        const toon = await createToonSerializer();
        const t0 = performance.now();
        const payload = toon.serialize(data);
        const t1 = performance.now();
        out.push({
          name: 'TOON',
          format: payload.format,
          bytes: byteSize(payload.data),
          elapsedMs: t1 - t0,
          note: toonNoteFor(data),
        });
      } catch {
        out.push({ name: 'TOON', format: 'n/a', bytes: 0, elapsedMs: 0, note: 'peer dep missing' });
      }

      const auto = await createAutoSerializer();
      const t0 = performance.now();
      const autoPayload = auto.serialize(data);
      const t1 = performance.now();
      out.push({
        name: 'auto',
        format: autoPayload.format,
        bytes: byteSize(autoPayload.data),
        elapsedMs: t1 - t0,
        note: 'router pick',
      });

      this.results.set(out);
      this.status.set('done');
      this.log.log('Serializer', `Compared "${sample.label}" (${jsonBytes} JSON bytes)`, 'success');
    } catch (err) {
      this.status.set('idle');
      this.log.log('Serializer', `Error: ${err}`, 'error');
    }
  }

  protected formatRatio(bytes: number): string {
    const ref = this.jsonReferenceBytes();
    if (!ref || !bytes) return '—';
    const ratio = bytes / ref;
    const pct = Math.round((1 - ratio) * 100);
    if (pct === 0) return 'same';
    return pct > 0 ? `−${pct}%` : `+${-pct}%`;
  }
}

function measure(
  name: string,
  format: string,
  encode: () => unknown,
  note?: string,
): SerializerResult {
  const t0 = performance.now();
  const out = encode();
  const t1 = performance.now();
  return { name, format, bytes: byteSize(out), elapsedMs: t1 - t0, note };
}

function toonNoteFor(data: unknown): string {
  if (Array.isArray(data) && data.length >= 5) return 'tabular form';
  if (Array.isArray(data)) return 'short array — auto would skip';
  return 'non-array — auto would skip';
}
