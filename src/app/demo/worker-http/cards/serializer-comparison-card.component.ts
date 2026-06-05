import { Component, inject, signal } from '@angular/core';
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
  template: `
    <div class="svc-card col-span-full animate-in fade-in duration-300">
      <div class="svc-card-head">
        <h2 class="svc-card-title"><span>🧬</span> Serializer Comparison</h2>
        <span class="badge badge-warning font-black">v21.2.0</span>
      </div>
      <p class="svc-desc max-w-4xl">
        Same payload, three serializers. The
        <code class="font-mono text-xs text-warning px-2 py-0.5 bg-yellow-500/10 rounded-md"
          >auto</code
        >
        row shows which strategy
        <code class="font-mono text-xs text-warning px-2 py-0.5 bg-yellow-500/10 rounded-md"
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
            class="btn font-black px-6"
            [class.btn-primary]="selectedId() === sample.id"
            [class.btn-secondary]="selectedId() !== sample.id"
          >
            {{ sample.label }}
          </button>
        }
      </div>

      @if (selectedSample(); as s) {
        <p
          class="text-xs text-base-content/60 mb-6 italic px-4 py-2 border-l-2 border-warning/50 bg-slate-950/20 rounded-r-xl"
        >
          {{ s.description }}
        </p>
      }

      @if (results().length > 0) {
        <div class="overflow-x-auto bg-slate-950/35 rounded-2xl border border-white/5 shadow-inner">
          <table class="table w-full border-collapse text-left">
            <thead>
              <tr
                class="border-b border-white/10 text-base-content/60 text-xs font-black uppercase tracking-wider bg-slate-950/45"
              >
                <th class="p-4">Serializer</th>
                <th class="p-4">Format</th>
                <th class="p-4 text-right">Bytes</th>
                <th class="p-4 text-right">vs JSON</th>
                <th class="p-4 text-right">Time (ms)</th>
                <th class="p-4">Note</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5 font-semibold text-sm">
              @for (row of results(); track row.name) {
                <tr class="hover:bg-white/5 transition-colors">
                  <td class="p-4 font-black text-xs text-base-content">{{ row.name }}</td>
                  <td class="p-4">
                    <span class="badge badge-xs font-mono font-bold opacity-80">{{
                      row.format
                    }}</span>
                  </td>
                  <td class="p-4 text-right font-mono text-xs text-base-content/90">
                    {{ row.bytes }}
                  </td>
                  <td
                    class="p-4 text-right font-mono text-xs font-bold"
                    [class.text-green-400]="row.bytes < jsonReferenceBytes()"
                    [class.text-red-400]="
                      row.bytes > jsonReferenceBytes() && jsonReferenceBytes() > 0
                    "
                  >
                    {{ formatRatio(row.bytes) }}
                  </td>
                  <td class="p-4 text-right font-mono text-xs text-accent">
                    {{ row.elapsedMs.toFixed(3) }}
                  </td>
                  <td class="p-4 text-xs text-base-content/50 italic">{{ row.note ?? '' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: '../../services/demo.styles.css',
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
