// OlPopupService

import {
  ApplicationRef,
  createComponent,
  DestroyRef,
  EnvironmentInjector,
  Injectable,
  inject,
  type ComponentRef,
} from '@angular/core';
import Overlay from 'ol/Overlay';
import type OLMap from 'ol/Map';
import type { Coordinate as OLCoordinate } from 'ol/coordinate';
import { OlMapService, OlZoneHelper } from '@angular-helpers/openlayers/core';
import type {
  ManagedPopup,
  OverlayConfig,
  PopupComponentOptions,
  PopupHandle,
  PopupOpenOptions,
} from '../models/overlay.types';

/** Internal queued call awaiting `OlMapService.onReady`. */
interface PendingCall {
  readonly kind: 'open' | 'openComponent';
  readonly options: PopupOpenOptions | PopupComponentOptions<unknown>;
}

/**
 * Manages OpenLayers popup overlays anchored to map coordinates.
 *
 * Three content modes:
 *  - `open()`           — string text or `HTMLElement`
 *  - `openComponent()`  — dynamic Angular component via `createComponent + hostElement`
 *  - The `<ol-popup>` component delegates `open()` internally for declarative usage.
 *
 * All calls are idempotent by `id`. Calls made before the underlying `ol/Map` is ready
 * are queued and replayed in order once `OlMapService.onReady` fires.
 */
@Injectable()
export class OlPopupService {
  private readonly mapService = inject(OlMapService);
  private readonly zoneHelper = inject(OlZoneHelper);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly appRef = inject(ApplicationRef);

  private readonly popups = new Map<string, ManagedPopup>();
  private readonly pending: PendingCall[] = [];
  private flushSubscribed = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.closeAll());
  }

  /**
   * Open a popup with `string` or `HTMLElement` content.
   *
   * Idempotent by `id`: a second call with the same id updates `position` and
   * `content` of the existing popup instead of creating a duplicate.
   */
  open(options: PopupOpenOptions): PopupHandle {
    const id = options.id ?? generateId('popup');
    const map = this.mapService.getMap();
    if (!map) {
      this.queue({ kind: 'open', options: { ...options, id } });
      return { id, close: () => this.close(id) };
    }
    this.createOrUpdate(id, options, map);
    return { id, close: () => this.close(id) };
  }

  /**
   * Open a popup whose content is a dynamically-instantiated Angular component.
   *
   * Uses `createComponent({ environmentInjector, hostElement, bindings, directives })`
   * (Angular 16.2+) and attaches the host view to `ApplicationRef` so change detection
   * reaches the rendered component.
   *
   * Idempotent by `id`: a previous `ComponentRef` registered under the same id is
   * destroyed before the new one is created.
   */
  openComponent<C>(options: PopupComponentOptions<C>): PopupHandle {
    const id = options.id ?? generateId('popup');
    const map = this.mapService.getMap();
    if (!map) {
      this.queue({
        kind: 'openComponent',
        options: { ...options, id } as PopupComponentOptions<unknown>,
      });
      return { id, close: () => this.close(id) };
    }
    this.createOrUpdateComponent(id, options, map);
    return { id, close: () => this.close(id) };
  }

  /** Close and dispose a single popup by id. No-op when the id is unknown. */
  close(id: string): void {
    const managed = this.popups.get(id);
    if (!managed) return;
    managed.dispose();
    this.popups.delete(id);
  }

  /** Close every managed popup. */
  closeAll(): void {
    const ids = [...this.popups.keys()];
    for (const id of ids) {
      this.close(id);
    }
    this.pending.length = 0;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private queue(call: PendingCall): void {
    this.pending.push(call);
    if (this.flushSubscribed) return;
    this.flushSubscribed = true;
    this.mapService.onReady((map) => this.flushPending(map));
  }

  private flushPending(map: OLMap): void {
    const pending = this.pending.splice(0);
    for (const call of pending) {
      if (call.kind === 'open') {
        this.createOrUpdate(
          (call.options as PopupOpenOptions).id!,
          call.options as PopupOpenOptions,
          map,
        );
      } else {
        this.createOrUpdateComponent(
          (call.options as PopupComponentOptions<unknown>).id!,
          call.options as PopupComponentOptions<unknown>,
          map,
        );
      }
    }
  }

  private createOrUpdate(id: string, options: PopupOpenOptions, map: OLMap): void {
    const existing = this.popups.get(id);
    if (existing && !existing.componentRef) {
      // Update position / element of an existing string/HTMLElement popup in place.
      this.zoneHelper.runOutsideAngular(() => {
        existing.overlay.setPosition(options.position as OLCoordinate);
        replaceElementContent(existing.overlay.getElement() as HTMLElement, options.content);
        applyOverlayConfig(existing.overlay, options);
      });
      return;
    }
    if (existing) {
      // Type changed (was a component popup) — dispose and recreate.
      this.close(id);
    }

    this.zoneHelper.runOutsideAngular(() => {
      const element = buildContentElement(options.content, options.className);
      const overlay = new Overlay({
        element,
        position: options.position as OLCoordinate,
        positioning: options.positioning ?? 'bottom-center',
        offset: options.offset ?? [0, 0],
        autoPan: options.autoPan ?? false,
      });
      map.addOverlay(overlay);

      const dispose = (): void => {
        this.zoneHelper.runOutsideAngular(() => {
          map.removeOverlay(overlay);
        });
      };
      this.popups.set(id, { id, overlay, dispose });
    });
  }

  private createOrUpdateComponent<C>(
    id: string,
    options: PopupComponentOptions<C>,
    map: OLMap,
  ): void {
    // Always recreate component popups on a second call — simpler and safer than
    // trying to re-bind inputs on an already-created ref.
    if (this.popups.has(id)) {
      this.close(id);
    }

    this.zoneHelper.runOutsideAngular(() => {
      const hostElement = document.createElement('div');
      if (options.className) hostElement.className = options.className;

      const ref: ComponentRef<C> = createComponent(options.component, {
        environmentInjector: this.envInjector,
        elementInjector: options.injector,
        hostElement,
        bindings: options.bindings,
        directives: options.directives?.map((d) =>
          typeof d === 'function' ? d : { type: d.type, bindings: d.bindings ?? [] },
        ),
      });
      this.appRef.attachView(ref.hostView);

      const overlay = new Overlay({
        element: hostElement,
        position: options.position as OLCoordinate,
        positioning: options.positioning ?? 'bottom-center',
        offset: options.offset ?? [0, 0],
        autoPan: options.autoPan ?? false,
      });
      map.addOverlay(overlay);

      const dispose = (): void => {
        this.zoneHelper.runOutsideAngular(() => {
          map.removeOverlay(overlay);
          this.appRef.detachView(ref.hostView);
          ref.destroy();
        });
      };
      this.popups.set(id, { id, overlay, componentRef: ref, dispose });
    });
  }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildContentElement(content: string | HTMLElement, className?: string): HTMLElement {
  const wrapper = document.createElement('div');
  if (className) wrapper.className = className;
  replaceElementContent(wrapper, content);
  return wrapper;
}

function replaceElementContent(element: HTMLElement, content: string | HTMLElement): void {
  while (element.firstChild) element.removeChild(element.firstChild);
  if (typeof content === 'string') {
    element.textContent = content;
  } else {
    element.appendChild(content);
  }
}

function applyOverlayConfig(overlay: Overlay, config: OverlayConfig): void {
  if (config.positioning) overlay.setPositioning(config.positioning);
  if (config.offset) overlay.setOffset(config.offset);
}
