import type { Coordinate } from '@angular-helpers/openlayers/core';

export type OverlayPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'
  | 'left-center'
  | 'right-center';
export interface OverlayConfig {
  position?: OverlayPosition;
  offset?: [number, number];
}
export interface PopupOptions {
  id?: string;
  content: string | HTMLElement;
  position: Coordinate;
  autoClose?: boolean;
  closeButton?: boolean;
}
