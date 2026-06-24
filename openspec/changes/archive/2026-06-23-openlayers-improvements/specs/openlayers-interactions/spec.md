# Specification: OpenLayers Interactions Improvements (openlayers-interactions)

## Purpose

Define the behavior and performance requirements for hover selection interaction within the Angular OpenLayers components.

## Requirements

1. The interaction component (`OlSelectInteractionComponent`) MUST expose a `hoverEvent` output using Angular's reactive `output()` function.
2. The underlying state service (`InteractionStateService`) MUST track the currently hovered feature.
3. The selection service (`OlSelectInteractionService`) MUST listen to map pointer move events to determine the hovered feature.
4. The selection event emissions MUST NOT flood Angular's change detection. The `hoverEvent` output MUST only emit a new value when the hovered feature ID actually changes (i.e. transitioning from one feature to another, or from a feature to none, or vice versa).
5. The hover detection and event routing MUST handle pointer move events efficiently, avoiding execution of change detection cycle unless the state changes.

## Scenarios

### Scenario: Emitting hover events on pointer move

```gherkin
Given a map with multiple features rendered
And the `OlSelectInteractionComponent` is active
When the user moves the pointer over a feature with ID "feature-1"
Then the state service MUST record "feature-1" as the hovered feature
And the `hoverEvent` output MUST emit "feature-1" exactly once
When the user moves the pointer within the boundaries of "feature-1"
Then the state service MUST NOT emit any additional `hoverEvent` updates
And Angular change detection MUST NOT be triggered for these redundant pointer moves
When the user moves the pointer away from "feature-1" to empty space
Then the state service MUST track the hovered feature as null/none
And the `hoverEvent` output MUST emit null exactly once
```
