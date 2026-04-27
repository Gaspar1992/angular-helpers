// Public types for the @angular-helpers/openlayers/overlays entry point.

import type { Binding, ComponentRef, Injector, Type } from '@angular/core';
import type Overlay from 'ol/Overlay';
import type { Coordinate } from '@angular-helpers/openlayers/core';

/**
 * Anchor of the overlay element relative to its `position` coordinate.
 * Mirrors the values accepted by `ol/Overlay#setPositioning`.
 */
export type OverlayPositioning =
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'
  | 'center-left'
  | 'center-center'
  | 'center-right'
  | 'top-left'
  | 'top-center'
  | 'top-right';

/**
 * Common positioning options shared by every popup mode.
 */
export interface OverlayConfig {
  positioning?: OverlayPositioning;
  offset?: [number, number];
  className?: string;
  autoPan?: boolean;
}

/**
 * Options for `OlPopupService.open()` — string / HTMLElement content.
 */
export interface PopupOpenOptions extends OverlayConfig {
  /** Unique id for the popup. Generated when omitted. */
  id?: string;
  /** Map coordinate where the popup is anchored. */
  position: Coordinate;
  /**
   * Popup content. A `string` is rendered as text via `textContent` (no HTML parsing).
   * Pass an `HTMLElement` when richer DOM is required.
   */
  content: string | HTMLElement;
}

/**
 * Options for `OlPopupService.openComponent()` — dynamic Angular component content.
 *
 * Internally uses `createComponent + hostElement` (Angular 16.2+) so consumers can wire
 * `inputBinding` / `outputBinding` / `twoWayBinding` declaratively.
 */
export interface PopupComponentOptions<C> extends OverlayConfig {
  id?: string;
  position: Coordinate;
  /** The component class to instantiate. */
  component: Type<C>;
  /** Bindings created via `inputBinding`, `outputBinding`, `twoWayBinding`. */
  bindings?: Binding[];
  /** Optional host directives applied to the dynamically-created component. */
  directives?: ReadonlyArray<
    Type<unknown> | { readonly type: Type<unknown>; readonly bindings?: Binding[] }
  >;
  /** Optional element injector for the component (defaults to the service's injector). */
  injector?: Injector;
}

/**
 * Handle returned by `OlPopupService.open()` and `openComponent()`.
 * Use it to close the popup imperatively without going through the service.
 */
export interface PopupHandle {
  readonly id: string;
  close(): void;
}

/**
 * Internal record tracked per managed popup. Not part of the public API.
 *
 * @internal
 */
export interface ManagedPopup {
  readonly id: string;
  readonly overlay: Overlay;
  /** Set only for popups created via `openComponent()`. */
  readonly componentRef?: ComponentRef<unknown>;
  /** Cleanup function — idempotent, callable on `close()` or service destroy. */
  readonly dispose: () => void;
}

/**
 * @deprecated Use {@link PopupOpenOptions} instead. Kept for backwards compatibility
 *   with the v0.2.x stub API and removed in a future major version.
 */
export type PopupOptions = PopupOpenOptions & {
  /** No-op flag retained for source compatibility. */
  autoClose?: boolean;
  /** Whether to render the default close button (deprecated, prefer `<ol-popup>`). */
  closeButton?: boolean;
};

/**
 * @deprecated Use {@link OverlayPositioning} instead.
 */
export type OverlayPosition = OverlayPositioning;
