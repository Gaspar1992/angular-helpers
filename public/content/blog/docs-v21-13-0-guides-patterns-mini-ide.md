# docs v21.13.0: Guides & Patterns section with interactive Mini-IDE visualizer

We are thrilled to announce the release of **docs v21.13.0**, introducing a massive upgrade to our documentation ecosystem: the **Guides & Patterns** section.

Rather than showing simple interactive demos or bare API listings, we are shifting our documentation philosophy towards **production-ready software architecture**. To present these complex systems cleanly, we have custom-built a glassmorphic **interactive Mini-IDE Explorer widget** directly into our documentation interface.

---

## The Philosophy: Concepts > Code

Historically, documentation websites only present two extremes: a dry reference table of inputs, outputs, and methods, or a monolithic "Code Playground" containing a single large file. In the real world, no senior engineer writes large components with inline styles, raw business logic, and database operations in one file.

To bridge this gap, every helper in the `@angular-helpers` ecosystem now comes with architectural implementation guides mapped directly to clean, **decoupled multi-file structures**. This allows you to learn not just _what_ an API does, but _how_ to compose it into a robust, maintainable application architecture.

---

## The Interactive Mini-IDE Component

To present multiple files cleanly without cluttering the viewport with vertical scrolling, we designed a custom interactive file explorer panel:

1. **📂 Explorer Sidebar**: Displays a folder-tree layout of the real-world files (e.g. `product-repository.interface.ts`, `product-indexeddb.repository.ts`, `product-list.component.html`) with filetype badges (`TS`, `HTML`).
2. **💻 Active Code Visor**: Shows the selected file's source code with full syntax highlighting. Switching between files triggers a smooth, hardware-accelerated `fade-in` animation.
3. **Adaptive Grid**: Dynamically collapses to a horizontal tabbed layout on mobile devices to preserve horizontal reading space.

---

## Restructured Architectural Guides

Here is a breakdown of the production-ready architectures we have documented across all packages in this release:

### 1. Storage & Immutability (Hexagonal Architecture)

We document a complete **Hexagonal Port-and-Adapter architecture** using `injectEntityStore` and Angular signals:

- **`product.model.ts`**: Pure domain entity representation.
- **`product-repository.interface.ts`**: Clean repository Port abstract interface using correct reactive Signal typing.
- **`product-indexeddb.repository.ts`**: High-performance infrastructure Adapter implementing the repository interface via IndexedDB.
- **`product-list.component.ts` & `.html`**: Completely decoupled Angular standalone component leveraging the repository adapter.

### 2. Off-Thread ReDoS-Safe Validations (Security)

Learn how to use `RegexSecurityService` in combination with reactive forms to secure regular expressions:

- Enforce strict **2-second timeouts** on regular expression execution off the main thread inside Web Workers.
- Pre-checks structural regex vulnerabilities without execution to protect main thread responsiveness.

### 3. Thread-Isolated Pipelines (Worker HTTP)

Document custom HTTP pipelines inside background workers (`provideWorkerHttpClient`):

- Run logging, caching, and cryptographic **HMAC-SHA256 request signing** off-thread.
- Protect confidential API secret keys from XSS attacks by locking key materials inside sandboxed workers.

### 4. Interactive GIS Dashboards (OpenLayers)

See how to coordinate GIS components reactively:

- Map dynamic coordinates to OpenLayers features dynamically using computed signals.
- Render dynamic popups over coordinate marks using content projection.

---

## Verification & Robustness

Every single guide example has been meticulously audited to ensure compile-time accuracy. We fixed an architectural typing bug in our interface definitions, ensuring all abstract repository interfaces compile perfectly using Angular's native reactive typings:

```typescript
export interface ProductRepository {
  products$: Signal<Product[]>;
  totalValue$: Signal<number>;
  save(product: Product): void;
  delete(id: string): void;
}
```

All **472 unit tests** inside the monorepo pass flawlessly, and the development environment serves under local SSL out of the box!

Explore the live documentation and patterns today at **https://localhost:4200/**!
