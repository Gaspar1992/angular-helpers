export const EN = {
  nav: {
    docs: 'Docs',
    demo: 'Demo',
    blog: 'Blog',
    github: 'GitHub',
  },
  home: {
    badge: 'Angular 20+  ·  Signals  ·  TypeScript',
    heroTitle: 'Browser APIs.\nDone right.',
    heroHighlight: 'Done right.',
    heroSub:
      'Every Angular app solves the same browser problems. We solved them once — typed, tested, tree-shakable.',
    ctaStart: 'Get started',
    ctaDemo: 'Live demo',
    ctaGitHub: 'GitHub',
    whyEyebrow: 'Why Angular Helpers?',
    whyTitle: "Everything you need.\nNothing you don't.",
    packagesEyebrow: 'Three focused libraries',
    packagesTitle: 'Pick what you need.',
    ctaSectionTitle: 'Ready to start?',
    ctaSectionSub: 'Read the docs or explore the live interactive demo.',
    ctaReadDocs: 'Read the docs',
    ctaOpenDemo: 'Open demo',
  },
  features: {
    signalBased: {
      title: 'Signal-based',
      desc: 'Reactive APIs built on Angular signals and OnPush. No zone.js, no surprises.',
    },
    stronglyTyped: {
      title: 'Strongly Typed',
      desc: 'Strict TypeScript throughout. Every service, every callback, every return value.',
    },
    offMainThread: {
      title: 'Off-main-thread',
      desc: 'Regex and HTTP run in isolated Web Workers. ReDoS protection and non-blocking requests.',
    },
    treeShakable: {
      title: 'Tree-shakable',
      desc: 'Opt-in provider model. Include only what you use. Production bundles stay lean.',
    },
    permissionAware: {
      title: 'Permission-aware',
      desc: 'Permission checks and secure-context validation built into every browser service.',
    },
    lifecycleSafe: {
      title: 'Lifecycle-safe',
      desc: 'DestroyRef on every service. Workers, streams, and timers always clean up.',
    },
  },
  stats: {
    browserApiServices: 'Browser API services',
    focusedPackages: 'Focused packages',
    signalPrimitives: 'Signal primitives',
    openSource: 'Open source',
  },
  demo: {
    internalHarnessNote: 'Internal harness — not part of the public demo',
  },
  blog: {
    pageTitle: 'Blog',
    pageSubtitle: 'Thoughts on Angular development, library design, and the web platform.',
    readMore: 'Read article',
  },
  docs: {
    pageTitle: 'Documentation',
  },
  footer: {
    madeWith: 'Made with',
    and: 'and',
    by: 'by',
    allRightsReserved: 'All rights reserved.',
  },
} as const;

export type Translations = typeof EN;
