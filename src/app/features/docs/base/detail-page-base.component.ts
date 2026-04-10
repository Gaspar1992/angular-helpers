import type { DocTab } from '../../../ui/tabs/docs-tabs.component';

/**
 * Standard content tab definitions for detail pages.
 * Used by page components via resolver pattern.
 */
export const CONTENT_TABS: DocTab[] = [
  { id: 'api', label: 'API Reference' },
  { id: 'example', label: 'Example' },
];

export const CONTENT_TABS_WITH_DEMO: DocTab[] = [
  { id: 'api', label: 'API Reference' },
  { id: 'example', label: 'Example' },
  { id: 'demo', label: 'Demo' },
];
