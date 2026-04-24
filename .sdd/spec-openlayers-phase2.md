# Spec: OpenLayers Package Phase 2 — Full Implementation

**Linked proposal**: `.sdd/proposal-openlayers-phase2.md`  
**Target package**: `@angular-helpers/openlayers@0.2.0`  
**Source branch**: `feature/openlayers-phase2` (from `feature/openlayers-scaffold`)

---

## Functional Requirements

### FR-1 — OlMapComponent completo

El componente `<ol-map>` **DEBE** soportar:

| Input        | Type         | Default       | Descripción               |
| ------------ | ------------ | ------------- | ------------------------- |
| `center`     | `Coordinate` | `[0, 0]`      | Centro inicial [lon, lat] |
| `zoom`       | `number`     | `0`           | Zoom inicial              |
| `projection` | `string`     | `'EPSG:3857'` | Proyección del mapa       |
| `rotation`   | `number`     | `0`           | Rotación en radianes      |

| Output       | Type                                       | Descripción                     |
| ------------ | ------------------------------------------ | ------------------------------- |
| `viewChange` | `ViewState`                                | Cambios de centro/zoom/rotación |
| `click`      | `{ coordinate: Coordinate; pixel: Pixel }` | Click en el mapa                |
| `dblclick`   | `{ coordinate: Coordinate; pixel: Pixel }` | Doble click                     |

**Acceptance**:

- Given un `<ol-map>` con `[center]="[2.17, 41.38]"` (Barcelona)
- When se renderiza
- Then el mapa muestra Barcelona centrada
- And `viewChange` emite cuando el usuario hace pan/zoom

### FR-2 — OlTileLayerComponent

```html
<ol-tile-layer id="osm" source="osm"> </ol-tile-layer>

<ol-tile-layer
  id="satellite"
  source="xyz"
  [url]="'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'"
>
</ol-tile-layer>
```

**Acceptance**:

- Given `<ol-tile-layer source="osm">` dentro de `<ol-map>`
- When el mapa se inicializa
- Then se añade una capa OSM visible
- And la capa se limpia en `ngOnDestroy`

### FR-3 — OlVectorLayerComponent con features reactivas

```html
<ol-vector-layer id="cities" [features]="cities()" [style]="pointStyle"> </ol-vector-layer>
```

**Acceptance**:

- Given un signal `cities` con 3 features
- When el signal cambia a 5 features
- Then la capa se actualiza sin recrear la fuente (solo clear + addFeatures)
- And el render es performante (< 16ms para < 1000 features)

### FR-4 — Controles UI declarativos

Cada control **DEBE** ser un componente standalone:

```html
<!-- En template de consumidor -->
<ol-zoom-control [delta]="1" position="top-left"></ol-zoom-control>
<ol-attribution-control [collapsible]="true"></ol-attribution-control>
<ol-scale-line-control unit="metric"></ol-scale-line-control>
<ol-rotate-control [autoHide]="true"></ol-rotate-control>
<ol-fullscreen-control></ol-fullscreen-control>
```

**Acceptance**:

- Given `<ol-zoom-control>` dentro de `<ol-map>`
- When se renderiza
- Then aparece el control de zoom de OpenLayers en el mapa
- And el control se destruye correctamente en `ngOnDestroy`

### FR-5 — Interactions via providers

```typescript
provideOpenLayers(
  withInteractions(),
  withSelectInteraction({ layers: ['cities'] }),
  withDrawInteraction({ type: 'Polygon', source: 'draw-layer' }),
);
```

**Acceptance**:

- Given `withSelectInteraction()` en providers
- When el usuario clica en una feature
- Then un signal `selectedFeatures()` se actualiza
- And un Observable `selection$` emite el evento

### FR-6 — Military symbols con milsymbol

```html
<ol-military-symbol [sidc]="'SFGPU----------'" [position]="[2.17, 41.38]" [size]="32">
</ol-military-symbol>
```

**Acceptance**:

- Given milsymbol instalado como peer dependency optional
- When se usa `<ol-military-symbol>`
- Then renderiza un canvas con el símbolo
- And si milsymbol no está instalado, lanza error claro en build

### FR-7 — Popup con content projection

```html
<ol-popup [position]="popupPosition()">
  <h3>{{ selectedFeature()?.name }}</h3>
  <p>{{ selectedFeature()?.description }}</p>
</ol-popup>
```

**Acceptance**:

- Given `<ol-popup>` con contenido proyectado
- When `position` cambia
- Then el popup se mueve en el mapa
- And el contenido se renderiza correctamente

### FR-8 — Tooltip directive

```html
<ol-vector-layer id="cities" olTooltip="name"></ol-vector-layer>
```

**Acceptance**:

- Given `olTooltip="name"` en capa
- When hover sobre una feature que tiene `properties.name`
- Then aparece un tooltip nativo con ese nombre

### FR-9 — Tests unitarios

**Acceptance**:

- OlMapService: >90% coverage
- OlLayerService: >80% coverage
- Componentes: al menos smoke tests que renderizan sin errores
- Todos los tests pasan con `npm test`

### FR-10 — READMEs actualizados

**Acceptance**:

- README.md con quick start, API de cada entry point, ejemplos
- README.es.md en español rioplatense
- Ejemplos funcionales copy-pasteables

### FR-11 — Demo en web app

**Acceptance**:

- Ruta `/demo/openlayers` accesible
- Mapa con múltiples capas (OSM + vector de ciudades)
- Controles visibles y funcionales
- Popup que abre al clicar una ciudad

### FR-12 — Blog post

**Acceptance**:

- `public/content/blog/openlayers-phase2.md` con YAML frontmatter
- Contenido: problema, objetivo, decisiones clave, API, scope
- Registrado en `src/app/blog/config/posts.data.ts`
- Visible en `/blog/openlayers-phase2`

---

## Non-Functional Requirements

### NFR-1 — Performance

- Render inicial de mapa < 100ms en laptop media
- Pan/zoom a 60fps
- < 16ms para actualizar < 1000 features en vector layer

### NFR-2 — Bundle size

- Cada entry point independiente
- Tree-shaking funcional (no side effects)
- Military entry point solo carga milsymbol si se importa

### NFR-3 — Zoneless compatibility

- Sin `NgZone.run()` en operaciones frecuentes
- Cambios via signals, no detectChanges

### NFR-4 — Accessibility

- Controles con labels ARIA donde aplique
- Popup enfocable
- Contraste mínimo AA en tooltips

### NFR-5 — Lint/format

- `npm run lint && npm run format:check` pasan

---

## Scenarios

### S-1 — Mapa básico con OSM

1. Consumidor importa: `import { OlMapComponent } from '@angular-helpers/openlayers/core'`
2. Template: `<ol-map [center]="[2.17, 41.38]" [zoom]="12"></ol-map>`
3. Se renderiza mapa de Barcelona con OSM como capa base

### S-2 — Múltiples capas

1. `<ol-map>` con `<ol-tile-layer source="osm">` y `<ol-vector-layer [features]="cities()">`
2. Tile layer en zIndex 0, vector en zIndex 1
3. Vector layer reactivo: cambio en `cities()` actualiza sin recrear tile layer

### S-3 — Draw polygon

1. `provideOpenLayers(withInteractions(), withDrawInteraction({ type: 'Polygon' }))`
2. Usuario dibuja polígono en mapa
3. `drawEnd$` Observable emite la feature creada
4. Aplicación puede añadirla a su estado

### S-4 — Select features

1. `withSelectInteraction({ layers: ['cities'] })`
2. Usuario clica una ciudad
3. `selectedFeatures()` signal se actualiza
4. Template muestra popup con datos de la ciudad

---

## Acceptance Criteria Summary

| ID   | Description            | Verification                           |
| ---- | ---------------------- | -------------------------------------- |
| AC-1 | Build pasa sin errores | `npm run build` en packages/openlayers |
| AC-2 | Tests >80% coverage    | `npm run test:coverage`                |
| AC-3 | Demo funcional         | Visitar `/demo/openlayers`             |
| AC-4 | READMEs completos      | Review de README.md y README.es.md     |
| AC-5 | Blog post visible      | `/blog/openlayers-phase2` renderiza    |
| AC-6 | No regressions         | `npm run lint && npm run format:check` |

---

## Technical Constraints

- **Angular 21+**: standalone, signals, OnPush
- **OpenLayers 10+**: peer dependency
- **milsymbol 2+**: optional peer dependency para military
- **Vitest**: tests unitarios con jsdom
- **ng-packagr**: build de paquete con secondary entries

---

## Dependencies

### Runtime (peer)

```json
{
  "@angular/core": "^21.0.0",
  "@angular/common": "^21.0.0",
  "ol": "^10.0.0",
  "milsymbol": "^2.0.0" // optional
}
```

### Dev

- `vitest`, `@angular-devkit/build-angular`, `jsdom`

---

## Edge Cases

1. **Mapa destruido mientras animación en curso**: cancelar animación en `ngOnDestroy`
2. **Feature con geometry inválida**: ignorar silenciosamente, log en dev mode
3. **Control añadido dos veces**: OpenLayers lanza error, nosotros prevenir duplicados
4. **milsymbol no instalado**: error claro en tiempo de build, no runtime
5. **Popup fuera de viewport**: clamp a bounds del mapa
