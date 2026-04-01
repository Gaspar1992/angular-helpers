import type { Feature } from '../shared/models/feature.model';
import type { Stat } from '../shared/models/stat.model';
import type { PackageInfo } from '../shared/models/package-info.model';
import type { CodeExample } from '../shared/models/code-example.model';

export const HOME_FEATURES: readonly Feature[] = [
  {
    icon: '⚡',
    title: 'Signal-based',
    desc: 'Reactive APIs built on Angular signals and OnPush. No zone.js, no surprises.',
  },
  {
    icon: '🎯',
    title: 'Strongly Typed',
    desc: 'Strict TypeScript throughout. Every service, every callback, every return value.',
  },
  {
    icon: '🛡️',
    title: 'Off-main-thread',
    desc: 'Regex and HTTP run in isolated Web Workers. ReDoS protection and non-blocking requests.',
  },
  {
    icon: '🌳',
    title: 'Tree-shakable',
    desc: 'Opt-in provider model. Include only what you use. Production bundles stay lean.',
  },
  {
    icon: '🔒',
    title: 'Permission-aware',
    desc: 'Permission checks and secure-context validation built into every browser service.',
  },
  {
    icon: '♻️',
    title: 'Lifecycle-safe',
    desc: 'DestroyRef on every service. Workers, streams, and timers always clean up.',
  },
];

export const HOME_STATS: readonly Stat[] = [
  { value: '37', label: 'Browser API services' },
  { value: '3', label: 'Focused packages' },
  { value: '9', label: 'Signal primitives' },
  { value: 'MIT', label: 'Open source' },
];

// prettier-ignore
export const HOME_CODE_EXAMPLES: readonly CodeExample[] = [
  {
    title: 'app.config.ts',
    html: `<span class="c-kw">import</span> <span class="c-brace">{</span> provideBrowserWebApis <span class="c-brace">}</span> <span class="c-kw">from</span>
  <span class="c-str">'@angular-helpers/browser-web-apis'</span><span class="c-punc">;</span>
<span class="c-kw">import</span> <span class="c-brace">{</span> provideSecurity <span class="c-brace">}</span> <span class="c-kw">from</span>
  <span class="c-str">'@angular-helpers/security'</span><span class="c-punc">;</span>

<span class="c-kw">export const</span> <span class="c-var">appConfig</span> <span class="c-punc">=</span> <span class="c-brace">{</span>
  providers<span class="c-punc">:</span> <span class="c-brace">[</span>
    provideBrowserWebApis<span class="c-punc">({</span>
      enableGeolocation<span class="c-punc">:</span> <span class="c-bool">true</span><span class="c-punc">,</span>
      enableCamera<span class="c-punc">:</span> <span class="c-bool">true</span><span class="c-punc">,</span>
      enableWebStorage<span class="c-punc">:</span> <span class="c-bool">true</span><span class="c-punc">,</span>
      <span class="c-cmt">// ... 34 more APIs</span>
    <span class="c-punc">}),</span>
    provideSecurity<span class="c-punc">({</span>
      enableRegexSecurity<span class="c-punc">:</span> <span class="c-bool">true</span><span class="c-punc">,</span>
    <span class="c-punc">}),</span>
  <span class="c-brace">]</span>
<span class="c-brace">};</span>`,
  },
  {
    title: 'map.component.ts',
    html: `<span class="c-kw">export class</span> <span class="c-type">MapComponent</span> <span class="c-brace">{</span>
  <span class="c-kw">private</span> geo <span class="c-punc">=</span> inject<span class="c-punc">(</span>GeolocationService<span class="c-punc">);</span>
  position <span class="c-punc">=</span> signal<span class="c-punc">&lt;</span>GeolocationPosition <span class="c-punc">|</span> <span class="c-bool">null</span><span class="c-punc">&gt;(</span><span class="c-bool">null</span><span class="c-punc">);</span>

  <span class="c-kw">async</span> <span class="c-fn">locate</span><span class="c-punc">() {</span>
    <span class="c-kw">const</span> pos <span class="c-punc">=</span> <span class="c-kw">await</span> <span class="c-kw">this</span><span class="c-punc">.</span>geo
      <span class="c-punc">.</span>getCurrentPosition<span class="c-punc">({</span>
        enableHighAccuracy<span class="c-punc">:</span> <span class="c-bool">true</span>
      <span class="c-punc">});</span>
    <span class="c-kw">this</span><span class="c-punc">.</span>position<span class="c-punc">.</span>set<span class="c-punc">(</span>pos<span class="c-punc">);</span>
  <span class="c-punc">}</span>
<span class="c-brace">}</span>`,
  },
];

export const HOME_PACKAGES: readonly PackageInfo[] = [
  {
    icon: '🌐',
    name: 'browser-web-apis',
    npmPackage: '@angular-helpers/browser-web-apis',
    description:
      '37 typed Angular services covering Camera, Geolocation, Storage, WebSocket, Bluetooth, NFC, Payments, Gamepad, and 29 more. Plus 9 signal-based inject() primitives.',
    highlights: [
      'Geolocation · Camera · MediaDevices · MediaRecorder',
      'WebSocket · WebWorker · ServerSentEvents · BroadcastChannel',
      'Clipboard · Notifications · WebStorage · FileSystemAccess',
      'Bluetooth · NFC · USB · Gamepad · Payments · +21 more',
    ],
    highlightsLabel: 'Included services',
    installCmd: 'npm i @angular-helpers/browser-web-apis',
    docsLink: '/docs/browser-web-apis',
    badge: null,
  },
  {
    icon: '🛡️',
    name: 'security',
    npmPackage: '@angular-helpers/security',
    description:
      'Stop ReDoS before it starts. Runs regular expressions in an isolated Web Worker with timeout protection, complexity analysis, and a fluent builder API.',
    highlights: [
      'Worker-isolated regex execution',
      'Configurable timeout (default 5 000 ms)',
      'Pattern complexity analysis',
      'RegexSecurityBuilder fluent API',
    ],
    highlightsLabel: 'Security features',
    installCmd: 'npm i @angular-helpers/security',
    docsLink: '/docs/security',
    badge: null,
  },
  {
    icon: '🚀',
    name: 'worker-http',
    npmPackage: '@angular-helpers/worker-http',
    description:
      'Move HTTP to a Web Worker. Off-main-thread request pipelines with configurable interceptors, WebCrypto HMAC signing, and pluggable serialization.',
    highlights: [
      'Off-main-thread HTTP pipelines',
      'Typed RPC bridge (transport layer)',
      'WebCrypto HMAC request signing',
      'Pluggable serializers (TOON, seroval)',
    ],
    highlightsLabel: 'Worker HTTP features',
    installCmd: 'npm i @angular-helpers/worker-http',
    docsLink: null,
    badge: 'Preview',
  },
];
