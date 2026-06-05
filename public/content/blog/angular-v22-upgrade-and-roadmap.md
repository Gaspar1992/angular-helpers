---
title: 'Angular v22 Upgrade and Roadmap'
date: '2026-06-05'
author: 'Gaspar'
---

# Angular v22 Upgrade and Roadmap

As we adopt Angular v22, we are rolling out a series of powerful enhancements across the `@angular-helpers` monorepo. This update brings a refined focus on reactivity, performance, and developer experience.

## Storage

- **`injectStorageResource`**: A new reactive wrapper leveraging Angular's `rxResource` to provide unified state tracking (loading, error, resolved) for your asynchronous storage transports, including IndexedDB and Web Workers.
- **Entity Store Enhancements**: Continued improvements to immutability and offline synchronization capabilities.

## Browser Web APIs

- **`injectBatteryResource` & `injectNetworkInformationResource`**: New reactive primitives powered by `rxResource` that seamlessly track device battery state and network connectivity status.
- **Resource Composition**: Improved guides on composing these low-level hardware sensors with your application logic using `resourceFromSnapshots`.

## OpenLayers

- **Signal-Driven Maps**: Migrating map state management fully to signals.
- **Cleanup**: Removal of legacy `@ViewChild` decorators in favor of `viewChild.required()`.

## Forms

- **Typed Reactive Forms**: Deep integration with modern Angular typed forms and signals for dynamic validations.
- **Template Simplification**: Migrating to the latest Angular control flow (`@if`, `@for`, `@switch`) to reduce template complexity and remove legacy structural directives.

Stay tuned for more updates as we continue to push the boundaries of modern Angular development!
