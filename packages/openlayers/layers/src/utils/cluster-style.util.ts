import { Style, Circle as CircleStyle, Fill, Stroke, Text } from 'ol/style';
import type OLFeature from 'ol/Feature';
import type { ClusterConfig } from '../models/layer.types';

export function createClusterStyleFn(
  clusterCfg: ClusterConfig | undefined,
  styleFn: ((olFeature: any, resolution: number) => any) | undefined,
  defaultStyle: Style,
) {
  return (olFeature: OLFeature, resolution: number): any => {
    const features = olFeature.get('features') as OLFeature[] | undefined;
    const size = features ? features.length : 0;

    // Render cluster badge
    if (size > 1) {
      const showCount = clusterCfg?.showCount ?? true;
      return new Style({
        image: new CircleStyle({
          radius: 15 + Math.min(size * 2, 15),
          fill: new Fill({ color: 'rgba(255, 100, 100, 0.8)' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
        text: showCount
          ? new Text({
              text: String(size),
              fill: new Fill({ color: '#fff' }),
            })
          : undefined,
      });
    }

    // Single feature in cluster: unwrap and call styleFn
    const originalFeature = features?.[0];
    if (originalFeature) {
      // 1. Feature level override
      if (clusterCfg?.featureStyle) {
        // OpenLayers styles are mutable. Clone before modifying geometry to prevent global breakage.
        const style = clusterCfg.featureStyle as any; // Cast since it might be abstract
        if (style instanceof Style) {
          const origGeom = originalFeature.getGeometry();
          if (origGeom) {
            const clonedStyle = style.clone();
            clonedStyle.setGeometry(origGeom);
            return clonedStyle;
          }
        }
        return style;
      }

      // 2. Original Layer style
      if (styleFn) {
        const style = styleFn(originalFeature, resolution);
        if (style instanceof Style) {
          const origGeom = originalFeature.getGeometry();
          if (origGeom) {
            const clonedStyle = style.clone();
            clonedStyle.setGeometry(origGeom);
            return clonedStyle;
          }
        }
        return style;
      }
    }

    // 3. Fallback to styleFn or default
    return styleFn ? styleFn(olFeature, resolution) : defaultStyle;
  };
}
