# 🚀 Angular Helpers

A suite of Angular libraries that helps you build secure, browser-integrated applications with a clean developer experience.

---

## 📦 Available Packages

### 🔐 `@angular-helpers/security`

_Advanced regular expression security and ReDoS prevention_

🌐 **Documentation**: https://gaspar1992.github.io/angular-helpers/docs/security

**🎯 What it solves:**

- **ReDoS (Regular Expression Denial of Service)** attacks caused by malicious or expensive patterns.
- Safe validation of complex regular expressions without blocking your app.
- Controlled regex execution with timeout and security analysis.

**✨ Key features:**

- 🛡️ **ReDoS prevention** with automatic risky pattern checks.
- ⚡ **Web Worker execution** to avoid blocking the main thread.
- 🕐 **Configurable timeout** to limit expensive regex operations.
- 📊 **Risk analysis** with complexity metrics and recommendations.
- 🏗️ **Builder pattern** for fluent secure-regex configuration.

**💡 Example usage:**

```typescript
// Safe regex validation for user input
const result = await securityService.testRegex(userInput, text, {
  timeout: 5000,
  safeMode: true,
});

// Builder pattern for complex patterns
const { pattern, security } = RegexSecurityService.builder()
  .pattern('\\d+')
  .timeout(3000)
  .safeMode()
  .build();
```

**📥 Installation:**

```bash
pnpm add @angular-helpers/security
```

---

### 🌐 `@angular-helpers/browser-web-apis`

_Unified and safe browser API access with permissions and robust error handling_

🌐 **Documentation**: https://gaspar1992.github.io/angular-helpers/docs/browser-web-apis

**🎯 What it solves:**

- **API fragmentation** across browsers.
- **Permission complexity** for sensitive browser features.
- **Compatibility checks** that usually require repetitive boilerplate.
- **Inconsistent error handling** across web APIs.

**✨ Key features:**

- 📸 **Camera** access and stream control.
- 🗺️ **Geolocation** with watch support and typed errors.
- 🔔 **Notifications** with permission-aware behavior.
- 📋 **Clipboard** utilities.
- 🎥 **Media Devices** enumeration and media access.
- 🔐 **Centralized permission utilities**.
- ✅ **Device/browser API wrappers** with fallback checks.
- ⚡ **Signal Fn primitives** — 14 zero-boilerplate reactive inject functions (`injectPageVisibility`, `injectResizeObserver`, `injectIntersectionObserver`, `injectNetworkInformation`, `injectScreenOrientation`, `injectMutationObserver`, `injectPerformanceObserver`, `injectIdleDetector`, `injectGamepad`, `injectClipboard`, `injectGeolocation`, `injectBattery`, `injectWakeLock`, `injectEyeDropper`) with automatic cleanup and `viewChild` signal support.
- 🔒 **Web Locks** — Cross-tab resource coordination.
- 💾 **Storage Manager** — Storage quotas and persistence.
- 📦 **Compression Streams** — Gzip/deflate compression.

**📥 Installation:**

```bash
pnpm add @angular-helpers/browser-web-apis
```

---

### 🚀 `@angular-helpers/worker-http`

_Angular HTTP over Web Workers — off-main-thread HTTP pipelines_

🌐 **Documentation**: https://gaspar1992.github.io/angular-helpers/docs/worker-http

**🎯 What it solves:**

- **Main-thread blocking** from heavy HTTP payloads and serialization.
- **Request signing complexity** with WebCrypto HMAC.
- **Serialization overhead** with pluggable format support.

**✨ Key features:**

- 🔀 **Off-main-thread HTTP** pipelines via Web Workers.
- 🔌 **Typed RPC bridge** for structured worker communication.
- 🔐 **WebCrypto HMAC** request signing.
- 📦 **Pluggable serializers** (TOON, seroval, auto-detect).
- 📡 **Telemetry hooks** for APM / metrics integration.
- 🌍 **SSR + hydration** — automatic fallback with transfer cache support.
- 🛠️ **`ng add` schematic** for zero-config setup.

**📥 Installation:**

```bash
pnpm add @angular-helpers/worker-http
```

---

### 🗺️ `@angular-helpers/openlayers`

_A modern Angular wrapper for OpenLayers with modular architecture and standalone components_

🌐 **Documentation**: https://gaspar1992.github.io/angular-helpers/docs/openlayers

**🎯 What it solves:**

- **Imperative OpenLayers API** — wraps it in declarative Angular components.
- **Bundle bloat** — modular sub-entry points import only what you need.
- **Military mapping** — ellipses, sectors, NATO symbology out of the box.

**✨ Key features:**

- 🗺️ **Standalone components** for maps, layers, controls, interactions, and overlays.
- 📡 **Signals integration** — native Angular signals for reactive state.
- 🎯 **Modular loading** — `core`, `layers`, `controls`, `interactions`, `overlays`, `military` sub-entries.
- 🪖 **Military features** — ellipses, sectors, donuts, MIL-STD-2525 symbols via `milsymbol`.
- 💬 **Popups & tooltips** — declarative and programmatic overlay API.

**📥 Installation:**

```bash
pnpm add @angular-helpers/openlayers ol
```

---

## 🎯 Why Angular Helpers?

### ⚡ Immediate Productivity

- Unified APIs for common browser capabilities.
- Strict TypeScript support and better autocomplete.
- Practical examples and ready-to-use patterns.
- End-to-end browser test coverage in CI.

### 🛡️ Security by Default

- ReDoS prevention tools for regex-heavy flows.
- Permission-aware wrappers for sensitive APIs.
- Worker-based isolation for expensive operations.
- Predictable error handling paths.

### 🔄 Modern Stack Alignment

- Built for modern Angular versions and patterns.
- Browser-focused utilities tested with Playwright.
- Actively maintained workflows and test harnesses.

---

## 🚀 Quick Start

### Workspace Setup

```bash
# Clone the repository
git clone https://github.com/Gaspar1992/angular-helpers
cd angular-helpers

# Install dependencies
pnpm install

# Generate local SSL certificates
pnpm run ssl:generate

# Start demo app over HTTPS
pnpm run start:https
```

### Use in Your Project

```bash
# Install the packages you need
pnpm add @angular-helpers/security
pnpm add @angular-helpers/browser-web-apis
pnpm add @angular-helpers/worker-http
pnpm add @angular-helpers/openlayers ol
```

For modern Angular standalone integration, check each package's own README.

---

## 📊 Comparison

| Feature              | Angular Helpers  | Manual Implementation | Other Libraries |
| -------------------- | ---------------- | --------------------- | --------------- |
| **ReDoS Protection** | ✅ Built-in      | ❌ Manual             | ⚠️ Partial      |
| **Browser APIs**     | ✅ Unified       | ❌ Fragmented         | ⚠️ Limited      |
| **Worker HTTP**      | ✅ Drop-in       | ❌ Complex            | ❌ None         |
| **OpenLayers**       | ✅ Declarative   | ❌ Imperative         | ⚠️ Limited      |
| **TypeScript**       | ✅ Full support  | ⚠️ Partial            | ❌ Minimal      |
| **Testing**          | ✅ Included      | ❌ Manual             | ⚠️ Basic        |
| **Documentation**    | ✅ Comprehensive | ❌ Missing            | ⚠️ Basic        |
| **Support**          | ✅ Active        | ❌ Team-owned only    | ⚠️ Varies       |

---

## 🛠️ Development

### Available Scripts

```bash
# Generate SSL certificates (local/CI)
pnpm run ssl:generate

# Local HTTPS development (required for secure browser APIs)
pnpm run start:https

# Build all packages
pnpm run build:packages

# Unit tests
pnpm test

# Browser tests on Chromium
pnpm run test:browser

# Browser tests for CI (Chromium, 1 worker)
pnpm run test:browser:ci

# Cross-browser smoke tests (Firefox + WebKit)
pnpm run test:browser:cross

# Workspace linting
pnpm run lint
```

### Project Structure

```
angular-helpers/
├── packages/
│   ├── security/          # 📦 @angular-helpers/security
│   ├── browser-web-apis/  # 📦 @angular-helpers/browser-web-apis
│   ├── worker-http/       # 📦 @angular-helpers/worker-http
│   └── openlayers/        # 📦 @angular-helpers/openlayers
├── src/                   # 🚀 Demo application
├── public/content/blog/   # ✍️ Blog articles
├── docs/                  # 📚 Documentation
└── scripts/               # 🔧 Automation scripts
```

---

## 📈 Roadmap

### Planned 🚧

- **@angular-helpers/pwa** — Service Worker and PWA capabilities.
- **@angular-helpers/storage** — Unified storage helpers.

### In Progress 🔄

- **@angular-helpers/openlayers** — heatmap layers, clustering, draw interactions, and geodesic-correct geometry.
- Runtime and bundle-size improvements across all packages.
- More real-world examples and demos.

---

## 🤝 Contributing

Contributions are welcome.

### Getting Started

```bash
# Fork and clone
git clone https://github.com/your-user/angular-helpers
# or fork from https://github.com/Gaspar1992/angular-helpers
cd angular-helpers

# Create a feature branch
git checkout -b feature/your-feature

# Commit and push
git commit -m "feat: add your feature"
git push origin feature/your-feature
```

### Contribution Guides

- 📖 [SSR/SSG Implementation](./docs/ssr-ssg-implementation.md)

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## � Blog

Articles about library design decisions, Angular patterns, and the evolution of Angular Helpers.
They live as Markdown files in [`public/content/blog/`](./public/content/blog/) and are rendered on the [web](https://gaspar1992.github.io/angular-helpers/blog).

| Date       | Article                                                                                                                                                                  |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-04-27 | [openlayers v0.4.0: Military symbology — Ellipse, Sector, Donut, and lazy-loaded MIL-STD-2525](./public/content/blog/openlayers-military.md)                             |
| 2026-04-27 | [openlayers v0.3.0: Overlays — Popups, Tooltips, and Dynamic Angular Components on the Map](./public/content/blog/openlayers-overlays.md)                                |
| 2026-04-27 | [openlayers v0.2.0: SRP-refactored interactions, Circle draw, and a native-style toolbar](./public/content/blog/openlayers-interactions-srp.md)                          |
| 2026-04-26 | [worker-http v21.2.0: TOON serializer — 30–60% smaller postMessage payloads](./public/content/blog/worker-http-toon-serializer.md)                                       |
| 2026-04-26 | [worker-http v21.1: per-request cancellation with AbortSignal and typed timeouts](./public/content/blog/worker-http-cancellation.md)                                     |
| 2026-04-25 | [worker-http v1.0.0: The Journey from Proof-of-Concept to Production](./public/content/blog/worker-http-v1-0.md)                                                         |
| 2026-04-24 | [OpenLayers for Angular — Phase 2 Complete](./public/content/blog/openlayers-phase2.md)                                                                                  |
| 2026-04-21 | [worker-http v0.7.0: hardening — cancellation that actually cancels, real timeouts, and a latent AES bug](./public/content/blog/worker-http-hardening.md)                |
| 2026-04-21 | [security v21.3: JWT, HIBP, rate limiter, and a two-paradigm forms bridge](./public/content/blog/security-utilities-expansion.md)                                        |
| 2026-04-19 | [browser-web-apis v21.11: Signal-based Injection & Composition-First API](./public/content/blog/browser-web-apis-v21-11-signal-injection.md)                             |
| 2026-04-19 | [browser-web-apis v21.11: log levels, experimental policy, and composition-first providers](./public/content/blog/log-levels-and-experimental-policy.md)                 |
| 2026-04-18 | [browser-web-apis v21.9: signal primitives for clipboard, geolocation, battery, and wake-lock](./public/content/blog/signal-primitives-for-browser-apis.md)              |
| 2026-04-18 | [browser-web-apis v21.8: WebWorker request/response with timeout, signals for status](./public/content/blog/web-worker-request-response.md)                              |
| 2026-04-18 | [browser-web-apis v21.7: WebStorage that survives Safari private mode + a unified API](./public/content/blog/web-storage-safari-private-and-unified-api.md)              |
| 2026-04-18 | [browser-web-apis v21.6: stateful WebSocket client with signals, request/response, and a real reconnect](./public/content/blog/websocket-stateful-client.md)             |
| 2026-04-18 | [browser-web-apis v21.10: Web Locks, Storage Manager, Compression Streams](./public/content/blog/three-new-web-apis-locks-storage-compression.md)                        |
| 2026-04-13 | [worker-http v0.3.0: Angular HttpBackend integration — HTTP off the main thread](./public/content/blog/worker-http-backend-phase3.md)                                    |
| 2026-04-13 | [browser-web-apis v21.5: real tree-shaking, bug fixes, and signal consistency](./public/content/blog/browser-web-apis-v21-5-improvements.md)                             |
| 2026-04-13 | [browser-web-apis: robustness deep-dive — spec compliance, leak prevention, and unified architecture](./public/content/blog/browser-web-apis-robustness-improvements.md) |
| 2026-04-12 | [Redesigning the web & our vision as a library ecosystem](./public/content/blog/web-redesign-and-library-vision.md)                                                      |

---

## �🔗 Useful Links

- **🐛 Issues & Feature Requests**: [GitHub Issues](https://github.com/Gaspar1992/angular-helpers/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Gaspar1992/angular-helpers/discussions)
- **📦 NPM Organization**: [npmjs.com/org/angular-helpers](https://www.npmjs.com/org/angular-helpers)

---

<div align="center">

**⭐ If Angular Helpers helps your team, consider starring the repository.**

Made with ❤️ by the Angular Helpers Team

</div>
