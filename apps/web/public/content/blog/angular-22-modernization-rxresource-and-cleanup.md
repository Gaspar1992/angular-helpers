---
title: 'Angular 22 Modernization: rxResource and Cleanup'
date: '2026-06-05'
author: 'Gaspar'
---

# Angular 22 Modernization: rxResource and Cleanup

With the release of Angular v22, we have undertaken a significant modernization effort across our codebase. This includes migrating our reactive APIs to utilize the powerful new `rxResource` primitive, embracing strictly typed queries with `viewChild.required()`, and cleaning up legacy component metadata.

## Embracing rxResource

Angular's `rxResource` provides a unified way to handle asynchronous data dependencies, replacing bespoke loading state tracking with a standardized `ResourceRef`.

We've introduced `injectStorageResource`, `injectBatteryResource`, and `injectNetworkInformationResource` which provide this robust pattern out of the box.

### Composing Resources

You can easily compose multiple resources together using `resourceFromSnapshots`:

```typescript
import { Component } from '@angular/core';
import { resourceFromSnapshots } from '@angular/core';
import { injectStorageResource } from '@angular-helpers/storage';
import { injectNetworkInformationResource } from '@angular-helpers/browser-web-apis';

@Component({
  selector: 'app-composed-storage',
  template: '<div>Value: {{ composed.value() }}</div>',
})
export class ComposedStorageComponent {
  network = injectNetworkInformationResource();
  storage = injectStorageResource('my_key', 'default', {
    storageType: 'local',
    serializer: 'json',
  });

  composed = resourceFromSnapshots(() => {
    const netStatus = this.network.resource.status();
    const storeStatus = this.storage.resource.status();

    if (netStatus === 'error' || storeStatus === 'error') {
      return { status: 'error', error: new Error('Error') };
    }
    if (netStatus === 'idle' || storeStatus === 'idle') {
      return { status: 'idle', value: undefined };
    }
    if (netStatus === 'loading' || storeStatus === 'loading') {
      return { status: 'loading', value: undefined };
    }

    const netVal = this.network.resource.value();
    const storeVal = this.storage.resource.value();
    return { status: 'resolved', value: !netVal?.online ? 'offline' : 'online-' + storeVal };
  });
}
```

## Strictly Typed Queries

We've migrated from the legacy `@ViewChild` decorator to signal-based queries using `viewChild.required()`. This ensures that our view queries are strictly typed and avoids runtime errors from undefined elements.

## Removing `standalone: true`

Since Angular v20, standalone components have been the default. We've performed a comprehensive cleanup to remove the redundant `standalone: true` property from all our component and directive decorators, reducing boilerplate and adhering to the latest Angular best practices.
