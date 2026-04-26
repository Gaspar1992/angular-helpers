// Internal types for OpenLayers interactions

import type Interaction from 'ol/interaction/Interaction';
import type { InteractionType, InteractionConfig } from '../models/interaction.types';

/**
 * Internal representation of a managed OpenLayers interaction.
 * Tracks the interaction instance, its configuration, and cleanup function.
 */
export interface ManagedInteraction {
  /** Unique identifier for this interaction instance */
  id: string;

  /** Type of interaction (select, draw, modify, etc.) */
  type: InteractionType;

  /** The OpenLayers interaction instance */
  olInteraction: Interaction;

  /** Configuration used when creating the interaction */
  config: InteractionConfig;

  /** Function to clean up and remove the interaction from the map */
  cleanup: () => void;
}
