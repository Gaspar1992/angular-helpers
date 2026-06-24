# Specification: OpenLayers Core Improvements (openlayers-core)

## Purpose

Define the requirements for geodesic-correct sector geometries, specifically ensuring that radial edges (the straight lines connecting the center to the arc points) are densified when generating large-scale military or tactical geometries.

## Requirements

1. The geometry generator (`createSector`) MUST generate geodesic-correct sector geometries.
2. When the sector radius is large (>100 km), the radial edges of the sector (connecting the center point to the start and end points of the arc) MUST be densified.
3. The densification MUST add intermediate vertices (between 8 to 16 steps/points) along the geodesic path for each radial edge to prevent distortions at large scales on a map projection.
4. The generation logic MUST use geodesic calculation (e.g., great circle path / bearing calculations) to determine the coordinates of the intermediate vertices.

## Scenarios

### Scenario: Densified radial edges

```gherkin
Given a request to create a sector geometry using `createSector`
When the radius of the sector is large (greater than 100 km)
Then the generated geometry coordinates MUST include intermediate vertices along the start and end radial edges
And each radial edge MUST contain between 8 and 16 densified points distributed along the geodesic line
And the intermediate points MUST accurately lie on the geodesic path between the center and the arc endpoints
```
