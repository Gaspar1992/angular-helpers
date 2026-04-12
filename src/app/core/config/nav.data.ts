export interface NavItem {
  label: string;
  path: string;
  external?: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Docs', path: '/docs' },
  { label: 'Demo', path: '/demo' },
  { label: 'Blog', path: '/blog' },
];

export const NAV_EXTERNAL_LINKS: readonly NavItem[] = [
  {
    label: 'GitHub',
    path: 'https://github.com/Gaspar1992/angular-helpers',
    external: true,
  },
];
