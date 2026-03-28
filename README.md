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
npm install @angular-helpers/security
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
- � **Device/browser API wrappers** with fallback checks.

**📥 Installation:**

```bash
npm install @angular-helpers/browser-web-apis
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
npm install

# Generate local SSL certificates
npm run ssl:generate

# Start demo app over HTTPS
npm run start:https
```

### Use in Your Project

```bash
# Install the packages you need
npm install @angular-helpers/security
npm install @angular-helpers/browser-web-apis
```

For modern Angular standalone integration, check each package's own README.

---

## 📊 Comparison

| Feature              | Angular Helpers  | Manual Implementation | Other Libraries |
| -------------------- | ---------------- | --------------------- | --------------- |
| **ReDoS Protection** | ✅ Built-in      | ❌ Manual             | ⚠️ Partial      |
| **Browser APIs**     | ✅ Unified       | ❌ Fragmented         | ⚠️ Limited      |
| **TypeScript**       | ✅ Full support  | ⚠️ Partial            | ❌ Minimal      |
| **Testing**          | ✅ Included      | ❌ Manual             | ⚠️ Basic        |
| **Documentation**    | ✅ Comprehensive | ❌ Missing            | ⚠️ Basic        |
| **Support**          | ✅ Active        | ❌ Team-owned only    | ⚠️ Varies       |

---

## 🛠️ Development

### Available Scripts

```bash
# Generate SSL certificates (local/CI)
npm run ssl:generate

# Local HTTPS development (required for secure browser APIs)
npm run start:https

# Build all packages
npm run build:packages

# Browser tests on Chromium
npm run test:browser

# Browser tests for CI (Chromium, 1 worker)
npm run test:browser:ci

# Cross-browser smoke tests (Firefox + WebKit)
npm run test:browser:cross

# Workspace linting
npm run lint
```

### Project Structure

```
angular-helpers/
├── packages/
│   ├── security/          # 📦 @angular-helpers/security
│   └── browser-web-apis/  # 📦 @angular-helpers/browser-web-apis
├── src/                   # 🚀 Demo application
├── docs/                  # 📚 Documentation
└── scripts/               # 🔧 Automation scripts
```

---

## 📈 Roadmap

### Planned 🚧

- **@angular-helpers/storage** - Unified storage helpers.
- **@angular-helpers/network** - Connectivity and network-state tools.
- **@angular-helpers/performance** - Performance monitoring helpers.
- **@angular-helpers/pwa** - Service Worker and PWA capabilities.

### In Progress 🔄

- Runtime and bundle-size improvements.
- More real-world examples and demos.
- Better CLI integration and scaffolding flows.

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

## 🔗 Useful Links

- **🐛 Issues & Feature Requests**: [GitHub Issues](https://github.com/Gaspar1992/angular-helpers/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/Gaspar1992/angular-helpers/discussions)
- **📦 NPM Organization**: [npmjs.com/org/angular-helpers](https://www.npmjs.com/org/angular-helpers)

---

<div align="center">

**⭐ If Angular Helpers helps your team, consider starring the repository.**

Made with ❤️ by the Angular Helpers Team

</div>
