// @angular-helpers/openlayers/interactions

// Main orchestrator service
export { OlInteractionService } from './services/interaction.service';

// State management
export { InteractionStateService } from './services/interaction-state.service';

// Specialized interaction services
export { SelectInteractionService } from './services/select-interaction.service';
export { DrawInteractionService } from './services/draw-interaction.service';
export { ModifyInteractionService } from './services/modify-interaction.service';
export { MeasurementInteractionService } from './services/measurement-interaction.service';

// Feature utilities
export { olFeatureToFeature } from './services/feature-utils';

// Declarative components
export { OlDrawInteractionComponent } from './features/draw-interaction.component';
export { OlModifyInteractionComponent } from './features/modify-interaction.component';
export { OlSelectInteractionComponent } from './features/select-interaction.component';

// Provider functions
export {
  withInteractions,
  provideInteractions,
  withSelectInteraction,
  withDrawInteraction,
  withModifyInteraction,
  withMeasurementInteraction,
} from './config/providers';

// Public types from models
export type {
  InteractionType,
  InteractionConfig,
  SelectConfig,
  DrawConfig,
  ModifyConfig,
  DragAndDropConfig,
  SelectEvent,
  DrawEndEvent,
  DrawStartEvent,
  ModifyEvent,
  InteractionState,
} from './models/interaction.types';

// Internal types (for advanced use cases)
export type { ManagedInteraction } from './services/types';
