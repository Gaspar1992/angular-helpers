// @angular-helpers/openlayers/interactions

export { OlInteractionService } from './services/interaction.service';
export { withInteractions, provideInteractions } from './config/providers';
export type {
  InteractionType,
  InteractionConfig,
  SelectConfig,
  DrawConfig,
  SelectEvent,
} from './models/interaction.types';
