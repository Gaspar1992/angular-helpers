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
    <div class="bg-base-200 border border-base-content/5 rounded-3xl p-8 col-span-full">
      <div class="flex items-center justify-between mb-6 flex-wrap gap-2">
        <h2 class="text-xl font-bold text-warning m-0 flex items-center gap-2">
          🧬 Serializer Comparison
        </h2>
        <span class="badge badge-warning font-semibold">v21.2.0</span>
      </div>
      <p class="text-sm text-base-content/70 mb-8 max-w-4xl">
        Same payload, three serializers. The
        <code class="font-mono text-xs bg-base-content/5 text-warning px-2 py-0.5 rounded-md"
          >auto</code
        >
        row shows which strategy
        <code class="font-mono text-xs bg-base-content/5 text-warning px-2 py-0.5 rounded-md"
          >createAutoSerializer()</code
        >
        picked. TOON wins on uniform arrays of objects with primitive values; seroval handles
        complex types; structured-clone is the zero-overhead default.
      </p>

      <div class="flex flex-wrap gap-3 mb-8">
        @for (sample of samples; track sample.id) {
          <button
            type="button"
            (click)="run(sample)"
            [disabled]="status() === 'running'"
            class="btn btn-sm font-bold px-4"
            [class.btn-primary]="selectedId() === sample.id"
            [class.btn-ghost]="selectedId() !== sample.id"
            [class.bg-base-content/5]="selectedId() !== sample.id"
          >
            {{ sample.label }}
          </button>
        }
      </div>

      @if (selectedSample(); as s) {
        <p class="text-xs text-base-content/40 mb-6 italic px-2 border-l-2 border-warning/30">
          {{ s.description }}
        </p>
      }

      @if (results().length > 0) {
        <div
          class="overflow-x-auto bg-base-content/5 rounded-2xl border border-base-content/5 shadow-inner"
        >
          <table class="table table-sm">
            <thead class="bg-base-content/5 text-base-content/60">
              <tr>
                <th class="py-3">Serializer</th>
                <th class="py-3">Format</th>
                <th class="text-right py-3">Bytes</th>
                <th class="text-right py-3">vs JSON</th>
                <th class="text-right py-3">Time (ms)</th>
                <th class="py-3">Note</th>
              </tr>
            </thead>
            <tbody>
              @for (row of results(); track row.name) {
                <tr class="border-base-content/5 hover:bg-base-content/5 transition-colors">
                  <td class="font-bold text-xs text-base-content/90">{{ row.name }}</td>
                  <td>
                    <span class="badge badge-xs font-mono opacity-70">{{ row.format }}</span>
                  </td>
                  <td class="text-right font-mono text-xs">{{ row.bytes }}</td>
                  <td
                    class="text-right font-mono text-xs"
                    [class.text-success]="row.bytes < jsonReferenceBytes()"
                  >
                    {{ formatRatio(row.bytes) }}
                  </td>
                  <td class="text-right font-mono text-xs">{{ row.elapsedMs.toFixed(2) }}</td>
                  <td class="text-xs text-base-content/50 italic">{{ row.note ?? '' }}</td>
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
