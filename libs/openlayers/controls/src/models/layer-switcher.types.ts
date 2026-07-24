// Layer switcher types for @angular-helpers/openlayers/controls

/**
 * Item representing a layer in the layer switcher UI
 */
export interface LayerSwitcherItem {
  /** Unique identifier for the layer */
  id: string;
  /** Display name for the layer */
  name: string;
  /** Type of the layer */
  type: 'vector' | 'tile' | 'image' | 'heatmap';
  /** Whether the layer is currently visible */
  visible: boolean;
  /** Opacity of the layer (0-1) */
  opacity: number;
}

/**
 * Position options for the layer switcher control
 */
export type LayerSwitcherPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
