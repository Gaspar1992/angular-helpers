# Proposal: OpenLayers Package Phase 2 — Full Implementation

**Branch**: `feature/openlayers-phase2`  
**Target**: `@angular-helpers/openlayers@0.2.0`  
**Depends on**: `feature/openlayers-scaffold` (Phase 1 merged)

---

## Problem

El scaffold del paquete OpenLayers está listo (Phase 1), pero carece de:

- Componentes de capas completamente funcionales (solo hay stub de vector-layer)
- Componentes de controles UI (zoom, attribution, scale-line, rotate)
- Interacciones (select, draw, modify, drag-and-drop)
- Soporte military completo (símbolos MIL-STD-2525)
- Tests unitarios
- Demo funcional en la web app
- Documentación y blog post

Sin estos elementos, el paquete no es usable para consumidores reales.

---

## Objective

Hacer `@angular-helpers/openlayers` **feature-complete** para un MVP usable:

- Componentes funcionales para las capas más comunes (tile, vector, image)
- Controles UI declarativos (zoom, attribution, scale-line, rotate, fullscreen)
- Interacciones básicas habilitables vía providers
- Soporte military con milsymbol
- Tests unitarios con >80% coverage
- Demo interactivo en la web app
- READMEs (EN/ES) + blog post

---

## Scope

### Included

| Entry Point    | Work                                                                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core`         | Finalizar OlMapComponent con todos los inputs/salidas; OlMapService con métodos de utilidad completos                                                                     |
| `layers`       | OlTileLayerComponent (OSM, XYZ, WMS); OlVectorLayerComponent con features reactivas; OlImageLayerComponent; OlLayerGroupComponent                                         |
| `controls`     | OlZoomControlComponent; OlAttributionControlComponent; OlScaleLineControlComponent; OlRotateControlComponent; OlFullscreenControlComponent; OlOverviewMapControlComponent |
| `interactions` | OlSelectInteractionProvider; OlDrawInteractionProvider; OlModifyInteractionProvider; OlDragAndDropInteractionProvider                                                     |
| `overlays`     | OlPopupComponent con content projection; OlTooltipDirective                                                                                                               |
| `military`     | Integración con `milsymbol` para renderizar símbolos MIL-STD-2525; OlMilitarySymbolComponent                                                                              |

### Testing

- Unit tests para todos los servicios (Vitest)
- Component harnesses para testing de componentes
- Coverage >80%

### Documentation

- README.md y README.es.md actualizados
- Blog post en `public/content/blog/openlayers-phase2.md`
- Entrada en `src/app/blog/config/posts.data.ts`

### Demo

- Ruta `/demo/openlayers` con mapa funcional
- Controles activos
- Capas múltiples
- Popup de ejemplo

### Excluded

- Plugins de terceros no oficiales de OpenLayers
- Soportes de proyección custom (solo EPSG:4326 y EPSG:3857)
- Heatmap layer (Phase 3)
- WebGL tile layers (Phase 3)
- Offline/tile caching (Phase 3)

---

## Approach

### Arquitectura

- **Standalone components** con signals para estado
- **OnPush** change detection en todos los componentes
- **Zoneless-safe**: todo fuera de NgZone donde aplique
- **Hybrid API**: Inputs/Outputs para templates + Servicios para programático

### Patrón de Providers

Continuar usando `provideOpenLayers()` + `withLayers()`, `withControls()`, etc.

### Imports

- Cross-entry: absolutos (`@angular-helpers/openlayers/core`)
- Intra-entry: relativos (`../services/`)

---

## Risks

| Risk                         | Mitigation                                     |
| ---------------------------- | ---------------------------------------------- |
| OpenLayers bundle size       | Peer dependency + tree-shaking por entry point |
| milsymbol bundle size        | Lazy load en military entry point              |
| Tests con canvas/OpenLayers  | Mocks de canvas + stub services                |
| Complejidad de interacciones | Feature providers simples, internos complejos  |

---

## Assumptions

- OpenLayers 10.x como peer dependency
- Angular 21.x+
- milsymbol 2.x para military (optional peer dep)

---

## Open Questions

1. ¿Popup como componente o overlay genérico? → Decisión: componente con content projection
2. ¿Tooltip como directive o componente? → Decisión: directive `olTooltip`
3. ¿Select interaction devuelve features como signals o stream? → Signals para template, Observable para programático

---

## Success Criteria

- [ ] Build pasa: `npm run build` en packages/openlayers
- [ ] Tests pasan: `npm test` en packages/openlayers (>80% coverage)
- [ ] Demo funciona: `/demo/openlayers` muestra mapa con controles y capas
- [ ] Lint pasa: `npm run lint && npm run format:check`
- [ ] Blog post publicado y renderizado
