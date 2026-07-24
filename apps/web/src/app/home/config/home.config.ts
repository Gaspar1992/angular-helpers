import { PACKAGES, TOTAL_SERVICE_COUNT, INJECT_FN_COUNT } from '../../core/config/packages.data';
import type { Feature } from '../models/feature.model';
import type { Stat } from '../models/stat.model';

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
  { value: String(TOTAL_SERVICE_COUNT), label: 'Browser API services' },
  { value: String(PACKAGES.length), label: 'Focused packages' },
  { value: String(INJECT_FN_COUNT), label: 'Signal primitives' },
  { value: 'MIT', label: 'Open source' },
];

export { PACKAGES as HOME_PACKAGES };

// prettier-ignore
export const HOME_CODE_TABS = [
  {
    title: 'geolocation.ts',
    raw: `import { Component, inject } from '@angular/core';
import { GeolocationService } from '@angular-helpers/browser-web-apis';

@Component({
  template: \`
    @if (geo.loading()) {
      <p>Locating...</p>
    } @else if (geo.coords()) {
      <p>You are at: {{ geo.coords().lat }}, {{ geo.coords().lon }}</p>
    }
  \`
})
export class MapComponent {
  // Pure magic: Inject and you get reactive state.
  geo = inject(GeolocationService);

  constructor() {
    this.geo.requestPermissionAndWatch();
  }
}`,
    html: `<span class="c-kw">import</span> <span class="c-brace">{</span> Component, inject <span class="c-brace">}</span> <span class="c-kw">from</span> <span class="c-str">'@angular/core'</span><span class="c-punc">;</span>
<span class="c-kw">import</span> <span class="c-brace">{</span> GeolocationService <span class="c-brace">}</span> <span class="c-kw">from</span> <span class="c-str">'@angular-helpers/browser-web-apis'</span><span class="c-punc">;</span>

<span class="c-kw">@Component</span><span class="c-punc">({</span>
  template<span class="c-punc">:</span> <span class="c-str">\`
    @if (geo.loading()) {
      &lt;p&gt;Locating...&lt;/p&gt;
    } @else if (geo.coords()) {
      &lt;p&gt;You are at: {{ geo.coords().lat }}, {{ geo.coords().lon }}&lt;/p&gt;
    }
  \`</span>
<span class="c-punc">})</span>
<span class="c-kw">export class</span> <span class="c-type">MapComponent</span> <span class="c-brace">{</span>
  <span class="c-com">// Pure magic: Inject and you get reactive state.</span>
  <span class="c-var bg-base-content/5 px-1 rounded">geo <span class="c-punc">=</span> inject<span class="c-punc">(</span>GeolocationService<span class="c-punc">);</span></span>

  <span class="c-fn">constructor</span><span class="c-punc">() {</span>
    <span class="c-kw">this</span><span class="c-punc">.</span>geo<span class="c-punc">.</span>requestPermissionAndWatch<span class="c-punc">();</span>
  <span class="c-punc">}</span>
<span class="c-brace">}</span>`,
  },
  {
    title: 'security.ts',
    raw: `import { Component, computed } from '@angular/core';
import { form, required } from '@angular/forms/signals';
import { strongPassword, hibpPassword, safeHtml } from '@angular-helpers/security';

@Component({ /* ... */ })
export class SecurityDemoComponent {
  model = { password: '', bio: '' };

  login = form({
    password: ['', [required, strongPassword(), hibpPassword()]],
    bio: ['', [safeHtml()]]
  });
}`,
    html: `<span class="c-kw">import</span> <span class="c-brace">{</span> Component, computed <span class="c-brace">}</span> <span class="c-kw">from</span> <span class="c-str">'@angular/core'</span><span class="c-punc">;</span>
<span class="c-kw">import</span> <span class="c-brace">{</span> form, required <span class="c-brace">}</span> <span class="c-kw">from</span> <span class="c-str">'@angular/forms/signals'</span><span class="c-punc">;</span>
<span class="c-kw">import</span> <span class="c-brace">{</span> strongPassword, hibpPassword, safeHtml <span class="c-brace">}</span> <span class="c-kw">from</span> <span class="c-str">'@angular-helpers/security'</span><span class="c-punc">;</span>

<span class="c-kw">@Component</span><span class="c-punc">({</span> <span class="c-com">/* ... */</span> <span class="c-punc">})</span>
<span class="c-kw">export class</span> <span class="c-type">SecurityDemoComponent</span> <span class="c-brace">{</span>
  model <span class="c-punc">=</span> <span class="c-brace">{</span> password<span class="c-punc">:</span> <span class="c-str">''</span><span class="c-punc">,</span> bio<span class="c-punc">:</span> <span class="c-str">''</span> <span class="c-brace">}</span><span class="c-punc">;</span>

  <span class="c-var bg-base-content/5 px-1 rounded">login <span class="c-punc">=</span> form<span class="c-punc">({</span>
    password<span class="c-punc">:</span> <span class="c-punc">[</span><span class="c-str">''</span><span class="c-punc">,</span> <span class="c-punc">[</span>required<span class="c-punc">,</span> strongPassword<span class="c-punc">(),</span> hibpPassword<span class="c-punc">()]],</span>
    bio<span class="c-punc">:</span> <span class="c-punc">[</span><span class="c-str">''</span><span class="c-punc">,</span> <span class="c-punc">[</span>safeHtml<span class="c-punc">()]]</span>
  <span class="c-punc">});</span></span>
<span class="c-brace">}</span>`,
  },
  {
    title: 'storage.ts',
    raw: `import { injectStorageSignal } from '@angular-helpers/storage';

@Component({
  template: \`
    @if (prefs.loading()) {
      <p>Loading...</p>
    } @else {
      <div [class.dark]="prefs().theme === 'dark'">
        <button (click)="toggle()">Toggle Theme</button>
      </div>
    }
  \`
})
export class PrefsComponent {
  // Persisted in async L2 storage & synced across tabs!
  prefs = injectStorageSignal('user_prefs', { theme: 'light' }, { crossTabSync: true });

  toggle() {
    this.prefs.update(state => ({
      theme: state.theme === 'light' ? 'dark' : 'light'
    }));
  }
}`,
    html: `<span class="c-kw">import</span> <span class="c-brace">{</span> injectStorageSignal <span class="c-brace">}</span> <span class="c-kw">from</span> <span class="c-str">'@angular-helpers/storage'</span><span class="c-punc">;</span>

<span class="c-kw">@Component</span><span class="c-punc">({</span>
  template<span class="c-punc">:</span> <span class="c-str">\`
    @if (prefs.loading()) {
      &lt;p&gt;Loading...&lt;/p&gt;
    } @else {
      &lt;div [class.dark]="prefs().theme === 'dark'"&gt;
        &lt;button (click)="toggle()"&gt;Toggle Theme&lt;/button&gt;
      &lt;/div&gt;
    }
  \`</span>
<span class="c-punc">})</span>
<span class="c-kw">export class</span> <span class="c-type">PrefsComponent</span> <span class="c-brace">{</span>
  <span class="c-com">// Persisted in async L2 storage & synced across tabs!</span>
  <span class="c-var bg-base-content/5 px-1 rounded">prefs <span class="c-punc">=</span> injectStorageSignal<span class="c-punc">(</span><span class="c-str">'user_prefs'</span><span class="c-punc">,</span> <span class="c-brace">{</span> theme<span class="c-punc">:</span> <span class="c-str">'light'</span> <span class="c-brace">}</span><span class="c-punc">,</span> <span class="c-brace">{</span> crossTabSync<span class="c-punc">:</span> <span class="c-kw">true</span> <span class="c-brace">}</span><span class="c-punc">);</span></span>

  <span class="c-fn">toggle</span><span class="c-punc">() {</span>
    <span class="c-kw">this</span><span class="c-punc">.</span>prefs<span class="c-punc">.</span>update<span class="c-punc">(</span>state <span class="c-punc">=&gt;</span> <span class="c-punc">({</span>
      theme<span class="c-punc">:</span> state<span class="c-punc">.</span>theme <span class="c-punc">===</span> <span class="c-str">'light'</span> <span class="c-punc">?</span> <span class="c-str">'dark'</span> <span class="c-punc">:</span> <span class="c-str">'light'</span>
    <span class="c-punc">}));</span>
  <span class="c-punc">}</span>
<span class="c-brace">}</span>`,
  },
];
