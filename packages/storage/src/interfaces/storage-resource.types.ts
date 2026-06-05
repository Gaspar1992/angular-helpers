import { ResourceRef } from '@angular/core';

export interface StorageResource<T> {
  resource: ResourceRef<T | undefined>;
  set: (value: T | undefined) => void;
  update: (updater: (current: T | undefined) => T | undefined) => void;
}
