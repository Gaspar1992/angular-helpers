import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OLFeature from 'ol/Feature';
import { Style, Stroke, Circle as CircleStyle, Fill } from 'ol/style';
import { Point, LineString } from 'ol/geom';
import type OLMap from 'ol/Map';
import type { ClusterConfig } from '../models/layer.types';
import { olFeatureToFeature } from '@angular-helpers/openlayers/core';

export class SpiderficationManager {
  private spiderSource = new VectorSource();
  private spiderLayer = new VectorLayer({
    source: this.spiderSource,
    zIndex: 9999,
    properties: { 'is-spider-layer': true },
  });
  private mapClickListenerRegistered = false;
  private map: OLMap | null = null;
  private layerCache: Map<string, any>;

  constructor(layerCache: Map<string, any>) {
    this.layerCache = layerCache;
  }

  register(map: OLMap) {
    if (this.mapClickListenerRegistered) return;
    this.mapClickListenerRegistered = true;
    this.map = map;
    map.addLayer(this.spiderLayer);

    // Unspiderfy on map movement or zoom
    map.on('movestart', () => this.unspiderfy());

    map.on('singleclick', (e) => {
      let handled = false;
      let keepSpiderOpen = false;

      map.forEachFeatureAtPixel(e.pixel, (f, l) => {
        if (handled) return;

        // Check if we clicked a spider item
        if (l === this.spiderLayer) {
          const originalOlFeature = f.get('spider-feature') as OLFeature;
          if (originalOlFeature) {
            const layerId = f.get('cluster-layer-id');
            const layerObj = this.layerCache.get(layerId);
            if (layerObj) {
              const clusterCfg = layerObj.get('cluster-config') as ClusterConfig;
              if (clusterCfg?.onSpiderfyClick) {
                // Use olFeatureToFeature so coordinates are properly extracted!
                const feat = olFeatureToFeature(originalOlFeature);
                clusterCfg.onSpiderfyClick(feat);
              }
            }
          }
          handled = true;
          keepSpiderOpen = true; // Keep spider open when clicking a leg
          return;
        }

        // Check if we clicked a cluster
        if (!l) return;
        const features = f.get('features');
        if (features && features.length > 1) {
          const clusterCfg = l.get('cluster-config') as ClusterConfig;
          if (clusterCfg?.spiderfyOnSelect) {
            keepSpiderOpen = true;
            handled = true;

            // Execute layer manipulations outside the synchronous event loop
            setTimeout(() => {
              this.spiderfy(map, f as OLFeature, features, l as VectorLayer<any>, clusterCfg);
            });
          }
        }
      });

      // Cleanup existing spider layer if we clicked anything else
      if (!keepSpiderOpen) {
        this.unspiderfy();
      }
    });
  }

  private unspiderfy() {
    this.spiderSource.clear();
  }

  private spiderfy(
    map: OLMap,
    clusterFeature: OLFeature,
    features: OLFeature[],
    parentLayer: VectorLayer<any>,
    cfg: ClusterConfig,
  ) {
    this.unspiderfy();
    const count = features.length;
    const centerGeom = clusterFeature.getGeometry();
    if (!centerGeom || centerGeom.getType() !== 'Point') return;

    const centerCoords = (centerGeom as Point).getCoordinates();
    const resolution = map.getView().getResolution() ?? 1;

    const baseRadius = 30; // 30 pixels
    const radius = baseRadius + count * 2;
    const angleStep = (2 * Math.PI) / count;

    const spiderFeatures: OLFeature[] = [];
    const styleFn = parentLayer.get('style-fn') as (f: any, r: number) => any;

    features.forEach((f, i) => {
      let x: number, y: number;

      if (count <= 8) {
        // Circle layout for small number of features
        const angle = i * angleStep;
        x = centerCoords[0] + radius * Math.cos(angle) * resolution;
        y = centerCoords[1] + radius * Math.sin(angle) * resolution;
      } else {
        // Spiral layout (caracol) for many features
        const initialRadius = 20;
        const legLength = 15;
        const spiralAngleStep = 0.5;

        const angle = i * spiralAngleStep;
        const r = initialRadius + legLength * (angle / Math.PI);
        x = centerCoords[0] + r * Math.cos(angle) * resolution;
        y = centerCoords[1] + r * Math.sin(angle) * resolution;
      }

      const legGeom = new Point([x, y]);

      // Create leg line
      const lineFeature = new OLFeature(new LineString([centerCoords, [x, y]]));
      lineFeature.setStyle(
        new Style({ stroke: new Stroke({ color: 'rgba(0,0,0,0.5)', width: 2 }) }),
      );
      spiderFeatures.push(lineFeature);

      // Create point feature
      const pointFeature = new OLFeature(legGeom);

      // Determine style for the spider leg point
      let pointStyle: any = undefined;
      if (cfg?.featureStyle) {
        pointStyle = cfg.featureStyle;
      } else if (styleFn) {
        pointStyle = styleFn(f, resolution);
      }

      // Ensure we always have a visible style even if the original feature has none
      if (!pointStyle || (Array.isArray(pointStyle) && pointStyle.length === 0)) {
        pointStyle = new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({ color: '#3399CC' }),
            stroke: new Stroke({ color: '#fff', width: 2 }),
          }),
        });
      }
      pointFeature.setStyle(pointStyle);

      pointFeature.set('spider-feature', f);
      pointFeature.set('cluster-layer-id', parentLayer.get('id'));

      spiderFeatures.push(pointFeature);
    });

    this.spiderSource.addFeatures(spiderFeatures);
  }
}
