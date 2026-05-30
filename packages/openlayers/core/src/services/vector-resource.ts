import { resource, type ResourceRef, type ResourceOptions, type Signal } from '@angular/core';
import GeoJSON from 'ol/format/GeoJSON';
import type { Feature } from '../models/types';
import type OLFeature from 'ol/Feature';
import { olFeatureToFeature } from '../utils/feature-utils';

export interface VectorResourceOptions {
  /** Optional custom fetch options */
  fetchOptions?: RequestInit;
}

/**
 * Creates an Angular resource for fetching and decoding GeoJSON into OpenLayers Features.
 * Must be called in an injection context.
 *
 * @param url The URL signal or string to fetch data from
 * @param options Additional vector resource options
 * @returns An Angular Resource containing an array of parsed Features
 */
export function createVectorResource(
  url: Signal<string | undefined>,
  options?: VectorResourceOptions,
): ResourceRef<Feature[] | undefined> {
  return resource({
    loader: async ({ abortSignal }) => {
      const fetchUrl = url();
      if (!fetchUrl) return [];
      const cacheKey = 'ol-vector-cache-v1';
      const isBrowser = typeof caches !== 'undefined';
      let response: Response | undefined;
      let cache: Cache | undefined;

      if (isBrowser) {
        cache = await caches.open(cacheKey);
        const cachedResponse = await cache.match(fetchUrl);
        if (cachedResponse) {
          response = cachedResponse;
        }
      }

      if (!response) {
        response = await fetch(fetchUrl, {
          ...options?.fetchOptions,
          signal: abortSignal,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch vector data: ${response.statusText}`);
        }

        if (isBrowser && cache) {
          await cache.put(fetchUrl, response.clone());
        }
      }
      // We process the text since GeoJSON readFeatures accepts string or object.
      // Doing text() might be slightly faster before passing to OL's parser.
      const data = await response.text();
      const format = new GeoJSON();

      // We parse the GeoJSON string into OpenLayers features.
      const olFeatures = format.readFeatures(data) as OLFeature[];

      // Convert to our generic Feature interface expected by OlVectorLayer
      return olFeatures.map((f) => olFeatureToFeature(f));
    },
  });
}
