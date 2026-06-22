// Select interaction creation service

import { inject, Injectable } from '@angular/core';
import type OLMap from 'ol/Map';
import Select from 'ol/interaction/Select';
import { click, pointerMove } from 'ol/events/condition';
import type BaseLayer from 'ol/layer/Base';
import type { Feature as OLFeature } from 'ol';
import { Style, Circle as CircleStyle, Fill, Icon, Stroke } from 'ol/style';
import {
  OlMapService,
  OlZoneHelper,
  type Style as AbstractStyle,
} from '@angular-helpers/openlayers/core';
import type { SelectConfig } from '../models/interaction.types';
import type { ManagedInteraction } from './types';
import { InteractionStateService } from './interaction-state.service';
import { olFeatureToFeature } from '@angular-helpers/openlayers/core';

/**
 * Service responsible for creating and managing Select interactions.
 */
@Injectable()
export class SelectInteractionService {
  private mapService = inject(OlMapService);
  private stateService = inject(InteractionStateService);
  private zoneHelper = inject(OlZoneHelper);

  /**
   * Creates and configures a Select interaction.
   * @param id - Unique identifier for the interaction
   * @param config - Select interaction configuration
   * @param map - OpenLayers map instance
   * @returns Promise that resolves when the interaction is created
   */
  createSelectInteraction(id: string, config: SelectConfig, map: OLMap): void {
    this.zoneHelper.runOutsideAngular(() => {
      const select = new Select({
        layers: config.layers
          ? (layer: BaseLayer) => {
              const layerId = layer.get('id');
              return config.layers?.includes(layerId) ?? false;
            }
          : undefined,
        multi: config.multi ?? false,
        hitTolerance: config.hitTolerance ?? 0,
        condition: config.condition === 'pointerMove' ? pointerMove : click,
        style: (olFeature: any, _resolution: number) => {
          const styles: any[] = [];

          // 1. Resolve feature's own custom style (same as layer style Fn)
          const abstractStyle = olFeature.get('__angular_helpers_style__') as
            | AbstractStyle
            | undefined;
          const featureStyle = new Style();
          let hasCustom = false;

          if (abstractStyle) {
            const { icon, fill, stroke } = abstractStyle;
            if (icon?.src) {
              featureStyle.setImage(
                new Icon({
                  src: icon.src,
                  ...(icon.size ? { size: icon.size } : {}),
                  ...(icon.anchor ? { anchor: icon.anchor } : {}),
                }),
              );
              hasCustom = true;
            }
            if (fill) {
              featureStyle.setFill(new Fill({ color: fill.color }));
              hasCustom = true;
            }
            if (stroke) {
              featureStyle.setStroke(new Stroke({ color: stroke.color, width: stroke.width }));
              hasCustom = true;
            }
          }

          if (!hasCustom) {
            // Fallback to standard vector default style
            featureStyle.setFill(new Fill({ color: 'rgba(25, 118, 210, 0.3)' }));
            featureStyle.setStroke(new Stroke({ color: '#1976d2', width: 2 }));
            featureStyle.setImage(
              new CircleStyle({
                radius: 8,
                fill: new Fill({ color: '#1976d2' }),
                stroke: new Stroke({ color: '#d32f2f', width: 2 }),
              }),
            );
          }

          styles.push(featureStyle);

          // 2. Add high-fidelity premium selection highlight overlay
          const geometry = olFeature.getGeometry();
          if (geometry) {
            const geomType = geometry.getType();
            if (geomType === 'Point') {
              // Outer glowing selection ring for Points
              styles.push(
                new Style({
                  image: new CircleStyle({
                    radius: 12,
                    stroke: new Stroke({
                      color: 'rgba(59, 130, 246, 0.8)',
                      width: 2,
                      lineDash: [4, 4],
                    }),
                  }),
                }),
              );
            } else {
              // Outer thick dashed highlight for Polygons/LineStrings
              styles.push(
                new Style({
                  stroke: new Stroke({
                    color: 'rgba(59, 130, 246, 0.9)',
                    width: 3,
                    lineDash: [6, 4],
                  }),
                  fill: new Fill({
                    color: 'rgba(59, 130, 246, 0.05)',
                  }),
                }),
              );
            }
          }

          return styles;
        },
      });

      // Listen to selection changes — use getFeatures().getArray() for the full
      // accumulated collection, not e.selected which only contains newly added ones
      select.on('select', (e: { selected: OLFeature[]; deselected: OLFeature[] }) => {
        const allFeatures = select
          .getFeatures()
          .getArray()
          .map((f) => olFeatureToFeature(f));

        if (config.condition === 'pointerMove') {
          // Update signal outside Angular zone. Consumers of this signal will schedule
          // targeted change detection automatically.
          this.stateService.setHoveredFeature(allFeatures.length > 0 ? allFeatures[0] : null);
        } else {
          this.zoneHelper.runInsideAngular(() => {
            this.stateService.setSelectedFeatures(allFeatures);
            this.stateService.emitSelect({
              interactionId: id,
              selected: e.selected.map((f) => olFeatureToFeature(f)),
              deselected: e.deselected.map((f) => olFeatureToFeature(f)),
            });
          });
        }
      });

      map.addInteraction(select);

      const managed: ManagedInteraction = {
        id,
        type: 'select',
        olInteraction: select,
        config,
        cleanup: () => {
          map.removeInteraction(select);
          select.dispose();
        },
      };

      this.stateService.addInteraction(managed);
    });
  }
}
