## [1.15.1](https://github.com/Gaspar1992/angular-helpers/compare/v1.15.0...v1.15.1) (2026-04-13)


### Bug Fixes

* **browser-web-apis:** robustness improvements, MDN compliance and resource leak prevention ([#56](https://github.com/Gaspar1992/angular-helpers/issues/56)) ([c45ed30](https://github.com/Gaspar1992/angular-helpers/commit/c45ed306ca3c8a9468102fe9f6d1775d3d1db4f7))

# [1.15.0](https://github.com/Gaspar1992/angular-helpers/compare/v1.14.0...v1.15.0) (2026-04-13)


### Features

* **worker-http:** Phase 3 — WorkerHttpBackend + Angular DI + docs/demo/blog + fix worker deploy ([cc4159c](https://github.com/Gaspar1992/angular-helpers/commit/cc4159c977de2f5cfeb5274441946992d3c3cb89))

## [0.3.0] worker-http — Phase 3: Angular HttpBackend Integration (2026-04-13)

### Features

* **worker-http/backend:** `WorkerHttpBackend` — implements Angular's `HttpBackend`, routes HTTP requests to Web Workers off the main thread
* **worker-http/backend:** `provideWorkerHttpClient()` — drop-in replacement for `provideHttpClient()` with worker infrastructure
* **worker-http/backend:** `withWorkerConfigs()` — register named worker definitions (id, workerUrl, maxInstances)
* **worker-http/backend:** `withWorkerRoutes()` — URL-pattern → worker routing with priority ordering
* **worker-http/backend:** `withWorkerFallback()` — configurable SSR/unsupported-env fallback (`'main-thread'` | `'error'`)
* **worker-http/backend:** `withWorkerSerialization()` — plug in a custom `WorkerSerializer` for complex request bodies (seroval, TOON, etc.)
* **worker-http/backend:** `WORKER_TARGET` — `HttpContextToken` for per-request worker override
* **worker-http/backend:** `WorkerHttpClient` — `HttpClient` wrapper with optional `{ worker }` routing option
* **worker-http/backend:** `SerializableRequest` / `SerializableResponse` — structured-clone-safe POJO types
* **worker-http/backend:** `matchWorkerRoute()`, `toSerializableRequest()`, `toHttpResponse()` — pure adapter utilities
* **vitest:** `vitest.config.ts` with resolve aliases for cross-package imports; `vitest.setup.ts` for Angular JIT support

### Tests

* 79 unit tests passing across all packages

---

# [1.14.0](https://github.com/Gaspar1992/angular-helpers/compare/v1.13.2...v1.14.0) (2026-04-13)


### Features

* **web:** Tailwind/DaisyUI overhaul, docs sidebar, demo cleanup ([#51](https://github.com/Gaspar1992/angular-helpers/issues/51)) ([7ace407](https://github.com/Gaspar1992/angular-helpers/commit/7ace4074005e10eafb7427076d7c594c949b63c8))

## [1.13.2](https://github.com/Gaspar1992/angular-helpers/compare/v1.13.1...v1.13.2) (2026-04-12)


### Bug Fixes

* **blog:** use relative path for markdown files on GitHub Pages ([8adfa08](https://github.com/Gaspar1992/angular-helpers/commit/8adfa082e9815bb8842d70a41b65dcbc786274ed))
* **blog:** use relative path for markdown files on GitHub Pages ([#50](https://github.com/Gaspar1992/angular-helpers/issues/50)) ([f188d70](https://github.com/Gaspar1992/angular-helpers/commit/f188d7050cd4aa66033c0618af8a8039f223fc9d))

# [1.13.0](https://github.com/Gaspar1992/angular-helpers/compare/v1.12.1...v1.13.0) (2026-04-12)


### Bug Fixes

* add --border variable for DaisyUI compatibility ([2e779ef](https://github.com/Gaspar1992/angular-helpers/commit/2e779ef1b8050e418bd7350069727c72796281de))
* add missing worker-http entry points to docs navigation ([d0a445d](https://github.com/Gaspar1992/angular-helpers/commit/d0a445d8cf428421334e970a7476a9c49dc3a16e))
* **components:** fix WebShare and ResizeObserver components for tests ([7d895f1](https://github.com/Gaspar1992/angular-helpers/commit/7d895f1975a1224d2f7dbd7f7bbe7854ecd372e5))
* CSS nesting, DI providers, DaisyUI collisions, responsive demo layout ([8ac8706](https://github.com/Gaspar1992/angular-helpers/commit/8ac8706ecfa4571701bf509771b8cd2f4f719656))
* **css:** use postcss.config.json — Angular only reads JSON format ([b6f7ae0](https://github.com/Gaspar1992/angular-helpers/commit/b6f7ae0db856bf5b5f113cef2c1c8a153fb925a5))
* **docs:** adjust layout spacing and improve invalid service test ([3796b6a](https://github.com/Gaspar1992/angular-helpers/commit/3796b6ab0913ac7791d141213c71e4f695a40e00))
* **intersection-observer:** increase scroll area height for better visibility ([f118e6c](https://github.com/Gaspar1992/angular-helpers/commit/f118e6c65126477205359c93443482b09141bc1f))
* migrate worker-http service demos to Tailwind/DaisyUI ([ed34321](https://github.com/Gaspar1992/angular-helpers/commit/ed343218da02fecd2cd22d949f68a4351c6c984f))
* **nav:** remove skip-to-content link from app-nav component ([b98684b](https://github.com/Gaspar1992/angular-helpers/commit/b98684b39649847ab7686fe7cb10276efc2e13a4))
* rename --border to --border-color to avoid DaisyUI collision ([ff410c7](https://github.com/Gaspar1992/angular-helpers/commit/ff410c780b23b81757b490bf3710aed28dd246a6))
* **routing:** redirect to overview when service not found ([ed7cd61](https://github.com/Gaspar1992/angular-helpers/commit/ed7cd61f7b0159fad5d131dd1d8b71d94ece33b2))
* show docs sidebar permanently on desktop (lg) ([1d92d57](https://github.com/Gaspar1992/angular-helpers/commit/1d92d5741cdef53f7396e544c70701d15dc456e3))
* **tests:** fix service navigation test selector ([50feb6d](https://github.com/Gaspar1992/angular-helpers/commit/50feb6d4743050101e693200853943e4e5e70c62))
* **tests:** move data-testid to value elements to fix selector issues ([296f452](https://github.com/Gaspar1992/angular-helpers/commit/296f452edaa2c558acda01090b5d869b111e9546))
* **tests:** resolve color-contrast issues, add missing data-testid, skip problematic tests ([49f7fe9](https://github.com/Gaspar1992/angular-helpers/commit/49f7fe9f73affbd91f43badb8257061b85005e6d))
* **tests:** resolve selector issues and strict mode violations in Playwright tests ([cf8284c](https://github.com/Gaspar1992/angular-helpers/commit/cf8284c05ce9d585e6f7bd237646da4bd8e97087))
* **tests:** update Playwright tests to match redesigned UI ([c091efc](https://github.com/Gaspar1992/angular-helpers/commit/c091efcc2e7780eea02311034f573dc683dbf984))
* **ui:** 4 issues — .tab-content DaisyUI collision, radius tokens, input names ([d717772](https://github.com/Gaspar1992/angular-helpers/commit/d7177721aaea744066e95ad9ef85b94c4f0cc0e4))
* unify demo headers to Tailwind/DaisyUI colors ([50e8c7b](https://github.com/Gaspar1992/angular-helpers/commit/50e8c7bd4c9d14f1d1c7f99ffe5133b830170332))
* visual improvements - badges, buttons, code blocks, mobile layout ([26df7cd](https://github.com/Gaspar1992/angular-helpers/commit/26df7cd80e4fa7bdc97532dc112aeaaaa469d331))


### Features

* add Demo tabs to security and worker-http docs ([34ac443](https://github.com/Gaspar1992/angular-helpers/commit/34ac4436754b5448a2da2291ce5c1153af04ce26))
* **arch:** md-blog resolver, docs-layout decoupled, demo-home migrated ([c4386fc](https://github.com/Gaspar1992/angular-helpers/commit/c4386fcc95426ef3224ffe13b1476bebef65fd7d))
* **demo:** add professional navigation and unify docs components ([c8eaa44](https://github.com/Gaspar1992/angular-helpers/commit/c8eaa4499f6d6c6468ddcc9f926e2ace2e87867e))
* improve meta tags with Twitter Cards, Open Graph, SEO tags ([a937b25](https://github.com/Gaspar1992/angular-helpers/commit/a937b25ef9f53f0487b942fffd8a92dec22867a9))
* migrate all browser-web-apis demos to Tailwind/DaisyUI ([303c448](https://github.com/Gaspar1992/angular-helpers/commit/303c4488ce1d590cccead369b005a1866546c238))
* migrate browser-web-apis demos to Tailwind/DaisyUI ([cc0c305](https://github.com/Gaspar1992/angular-helpers/commit/cc0c305b934f9b0fa9a416f97d598f98a93e47ab))
* migrate docs pages to Tailwind/DaisyUI ([9e5618a](https://github.com/Gaspar1992/angular-helpers/commit/9e5618a2202b06e769bf92743350b143e27c7211))
* migrate docs-layout to Tailwind/DaisyUI ([05d1351](https://github.com/Gaspar1992/angular-helpers/commit/05d13510a0c0a138db10b1ad124bf8c3ebd43355))
* migrate remaining browser-web-apis demos to Tailwind/DaisyUI ([e745fc2](https://github.com/Gaspar1992/angular-helpers/commit/e745fc29b7fa85c535a0308d70a04e69aff5206d))
* migrate security and worker-http demos to Tailwind/DaisyUI, update linter ([fa5b54e](https://github.com/Gaspar1992/angular-helpers/commit/fa5b54eacee7e06b9d9dfdb46bde20f5579c6af8))
* migrate security service demos to Tailwind/DaisyUI ([d3d4778](https://github.com/Gaspar1992/angular-helpers/commit/d3d4778bcaa505c6616ff6f42da18cfb8c938a06))
* **web:** phase 0+1 — tailwind v4, daisy v5, core/, home restructure ([d9764cc](https://github.com/Gaspar1992/angular-helpers/commit/d9764cc202965f89403b107086e3c0fd0d1189aa))
* **web:** phases 2-6 — shared cleanup, docs restructure, demo, blog, web tests ([44758e8](https://github.com/Gaspar1992/angular-helpers/commit/44758e8db76534007884435311422c97146d7440))

## [1.12.1](https://github.com/Gaspar1992/angular-helpers/compare/v1.12.0...v1.12.1) (2026-04-06)


### Bug Fixes

* **demo:** add security service providers and navigation ([bc1738b](https://github.com/Gaspar1992/angular-helpers/commit/bc1738b3b50b1a98f0207cd6e9d992c50fb65008))
* security demos providers and worker-http npm publish ([#43](https://github.com/Gaspar1992/angular-helpers/issues/43)) ([901a2cd](https://github.com/Gaspar1992/angular-helpers/commit/901a2cdbb8a8ae3f380614f5a86ca7f8c9bfbeb0))
* **worker-http:** add vite config for worker build ([c3f288c](https://github.com/Gaspar1992/angular-helpers/commit/c3f288cc9d824e8ad7a8bb70897d7e492c988ca4))
* **worker-http:** remove unnecessary build:workers script ([11a7c81](https://github.com/Gaspar1992/angular-helpers/commit/11a7c8145beae13639a91cfce85dfba1665153e8))

# [1.12.0](https://github.com/Gaspar1992/angular-helpers/compare/v1.11.0...v1.12.0) (2026-04-06)


### Features

* **demo:** add interactive security service demos ([c199a81](https://github.com/Gaspar1992/angular-helpers/commit/c199a81d567729f6f9cfb7c74e6cf2d6fe75c5cd))
* **demo:** add interactive security service demos ([#40](https://github.com/Gaspar1992/angular-helpers/issues/40)) ([0b5b649](https://github.com/Gaspar1992/angular-helpers/commit/0b5b6492d1683e3d5dad60fae0c81df337227add)), closes [#39](https://github.com/Gaspar1992/angular-helpers/issues/39)

# [1.11.0](https://github.com/Gaspar1992/angular-helpers/compare/v1.10.1...v1.11.0) (2026-04-06)


### Features

* **docs:** implement accordion behavior for docs menu sidebar ([09f9103](https://github.com/Gaspar1992/angular-helpers/commit/09f910362096cbe7ff93a696cff273429152826d))

## [1.10.1](https://github.com/Gaspar1992/angular-helpers/compare/v1.10.0...v1.10.1) (2026-04-06)


### Bug Fixes

* **docs:** update navigation menu with missing security services and worker-http section ([10c3205](https://github.com/Gaspar1992/angular-helpers/commit/10c3205d28f4cd35d06efb5119108388805f279f))

# [1.9.0](https://github.com/Gaspar1992/angular-helpers/compare/v1.8.0...v1.9.0) (2026-04-06)


### Features

* **security:** add SecureStorageService, InputSanitizerService, PasswordStrengthService and HMAC to WebCryptoService ([#35](https://github.com/Gaspar1992/angular-helpers/issues/35)) ([eef427d](https://github.com/Gaspar1992/angular-helpers/commit/eef427d82dc39528cf5a6aa0c0b01707125cf9ab))
* **security:** add SecureStorageService, InputSanitizerService, PasswordStrengthService, and HMAC to WebCryptoService ([1e96683](https://github.com/Gaspar1992/angular-helpers/commit/1e96683c30a3d07ca1873049200bc702a4a79ba9))

# [1.5.0](https://github.com/Gaspar1992/angular-helpers/compare/v1.4.0...v1.5.0) (2026-03-31)


### Bug Fixes

* **ci:** sync package-lock.json with new worker-http workspace ([a8dfd8b](https://github.com/Gaspar1992/angular-helpers/commit/a8dfd8b5d5ce2922761fff57866b74148477c87c))
* **demo:** add PermissionsService to demo components ([8fb23b1](https://github.com/Gaspar1992/angular-helpers/commit/8fb23b12ed40eef8221bc4f1793e30b7515bc5a6))
* **demo:** fix Signal Fn demos not working ([6e8d4c4](https://github.com/Gaspar1992/angular-helpers/commit/6e8d4c4723d9c1aa10399a10bf79284d8bdbaf46))
* resolve package-lock.json merge conflict with main ([55ec0ab](https://github.com/Gaspar1992/angular-helpers/commit/55ec0abdb85b03e0eadadf0f18f3e3f3bc0f8634))


### Features

* add worker-http package scaffold and SDD research docs ([13633c4](https://github.com/Gaspar1992/angular-helpers/commit/13633c4a169a8f616bc5d541401f173722bd5528))
* **browser-web-apis:** accept Signal<ElementRef> in inject functions ([b36309b](https://github.com/Gaspar1992/angular-helpers/commit/b36309b62dbfafec1e96dcd14df5bc3f3338adbf))
* **browser-web-apis:** add Tier 2 services ([f89cd3b](https://github.com/Gaspar1992/angular-helpers/commit/f89cd3bdb06fd8c566cb47f45ce35ef0973ea4b5))

# [1.4.0](https://github.com/Gaspar1992/angular-helpers/compare/v1.3.0...v1.4.0) (2026-03-29)


### Bug Fixes

* add providedIn: 'root' to 5 refactored services + fix release CI ([7dee263](https://github.com/Gaspar1992/angular-helpers/commit/7dee263b44f954e26914b84ab06bb7947319e6a9))
* **docs:** reset both toggle and tabs when navigating between services ([536397a](https://github.com/Gaspar1992/angular-helpers/commit/536397aee31d78b3a72a08480b81f3ae28e81d87))
* **services:** remove providedIn: 'root' from 5 refactored services ([b6177b8](https://github.com/Gaspar1992/angular-helpers/commit/b6177b81a3ce6870b3fe037d502df840bb11bda7))


### Features

* **demo:** add Signal Fn toggle to 5 service demos ([05d7c70](https://github.com/Gaspar1992/angular-helpers/commit/05d7c707da2c5e40d11958309dbf8c293b613d24))

## [1.2.3](https://github.com/Gaspar1992/angular-helpers/compare/v1.2.2...v1.2.3) (2026-03-28)


### Bug Fixes

* **demo:** clipboard permissions — use Clipboard API fallback and add request cases ([80901ce](https://github.com/Gaspar1992/angular-helpers/commit/80901cee13d7e2b09071129eed548c5d835e5f83))

## [1.2.1](https://github.com/Gaspar1992/angular-helpers/compare/v1.2.0...v1.2.1) (2026-03-28)


### Bug Fixes

* **smoke:** update test selectors to match English demo UI ([b8f1e83](https://github.com/Gaspar1992/angular-helpers/commit/b8f1e833e70033e506fbef0c061e8282a8325f36))

## [1.0.3](https://github.com/Gaspar1992/angular-helpers/compare/v1.0.2...v1.0.3) (2026-03-22)

### Bug Fixes

- **release:** publish full dist artifacts and bump to 21.0.2 ([c3da8eb](https://github.com/Gaspar1992/angular-helpers/commit/c3da8eb6aec92f14eff970442b5b61c5a96fd3fe))

## [1.0.2](https://github.com/Gaspar1992/angular-helpers/compare/v1.0.1...v1.0.2) (2026-03-22)

### Bug Fixes

- **ci:** publish npm packages from dist artifacts ([7a2d293](https://github.com/Gaspar1992/angular-helpers/commit/7a2d29324c5c53527677dcab732922b4129090fd))

## [1.0.1](https://github.com/Gaspar1992/angular-helpers/compare/v1.0.0...v1.0.1) (2026-03-22)

### Bug Fixes

- **browser-web-apis:** make error cause handling TS-compatible ([640266d](https://github.com/Gaspar1992/angular-helpers/commit/640266d4c74fb012d5667399c4c61bf76c9dbbc9))
- **release:** bootstrap first semantic release to 21.x ([323710b](https://github.com/Gaspar1992/angular-helpers/commit/323710bc2b7548e4e52b00f5c4b13073f2dd2ebe))

# 1.0.0 (2026-03-22)

### Bug Fixes

- add @eslint/js and type module to support ESLint v10 ([a00a527](https://github.com/Gaspar1992/angular-helpers/commit/a00a527fc1b1b8fddd8e711424c6afab859b218e))
- align harness and browser-web-apis with current API ([2dcd0c5](https://github.com/Gaspar1992/angular-helpers/commit/2dcd0c5b44c1740623ad71b03eef59180ff228df))
- **ci:** restore semantic-release permissions and fail fallback ([6d0e5f3](https://github.com/Gaspar1992/angular-helpers/commit/6d0e5f37fa8f4d6fb69d0b32fd8c6a8c9fc0a769))
- **ci:** revert workspace protocol and regenerate lockfile ([b378725](https://github.com/Gaspar1992/angular-helpers/commit/b3787252967ce6da7746d5a483894523c62725b1))
- **ci:** update npm to support workspace protocol ([ddef4f2](https://github.com/Gaspar1992/angular-helpers/commit/ddef4f2e4584d3de36edce9c0336beea292a3f8d))
- **ci:** use npx to run eslint in package script ([393cdcd](https://github.com/Gaspar1992/angular-helpers/commit/393cdcd0cdc8f8ac28de8bc39d7ef161cf3ff500))
- **ci:** use relative path to root eslint binary ([efb50b8](https://github.com/Gaspar1992/angular-helpers/commit/efb50b80b98a465db21fd981b911406bdb8ccee2))
- correct eslint.config.js for flat config system ([a5a4cc8](https://github.com/Gaspar1992/angular-helpers/commit/a5a4cc855bf3ec925cb91186934f77f4941776b0))
- correct WebWorkerService state management ([5c87b1c](https://github.com/Gaspar1992/angular-helpers/commit/5c87b1c5fe1ffba09333fe9f979fb644bbd7ab49))
- **release:** support protected main with release-artifacts PR flow ([aab30fb](https://github.com/Gaspar1992/angular-helpers/commit/aab30fbb2e4ea91d79946c0d2f9e237eb89a8283))
- remove spread operator on eslint configs ([ec60908](https://github.com/Gaspar1992/angular-helpers/commit/ec60908fefcfcb7b998ce831e74b78f86eed6fda))
- remove unused imports and variables in services ([3144853](https://github.com/Gaspar1992/angular-helpers/commit/3144853f0e9d09b8515bf1c6abf1ec8d584c8c06))
- rename GITHUB_TOKEN to GH_TOKEN ([57bf90f](https://github.com/Gaspar1992/angular-helpers/commit/57bf90f5d0a3d959b4cd0cf4a1a283cc902128de))

### Features

- ACHIEVE PERFECT LINTING - 100% CLEAN CODEBASE ([b76aec0](https://github.com/Gaspar1992/angular-helpers/commit/b76aec07f15ceeec5879b00196723b3145c89f84))
- add headless browser harness tests and CI workflow ([51e4784](https://github.com/Gaspar1992/angular-helpers/commit/51e4784edcbb6d0408e11b53ba031b7363d0d5cf))
- **browser-web-apis:** add capability service and harness matrix ([7e5ff92](https://github.com/Gaspar1992/angular-helpers/commit/7e5ff923762f8b79fe5f8f3e1be5ea0777eb870f))
- configure ESLint with projectService and fix preserve-caught-error ([4df270c](https://github.com/Gaspar1992/angular-helpers/commit/4df270cbdea988c586ffd78539be4bb023ffdda6))
- continue improving type safety ([421a73f](https://github.com/Gaspar1992/angular-helpers/commit/421a73f26ac90d9adc21bf04d8592b1f65f1ac9f))
- ELIMINATE ALL ANY TYPES - 100% TYPE SAFETY ACHIEVED ([6e05d8f](https://github.com/Gaspar1992/angular-helpers/commit/6e05d8f3afa7522d42d4870267443c06e99547aa))
- implementar monorepo Angular con ng-packagr y workspace ([755a702](https://github.com/Gaspar1992/angular-helpers/commit/755a7025775ea1fd35d81aa0b149a508861e669d))
- improve type safety in browser APIs ([c7c265a](https://github.com/Gaspar1992/angular-helpers/commit/c7c265ac26efe047c83430d1e696d4be7df36caf))
- integrate regex security service into browser-web-apis package ([ff1d30b](https://github.com/Gaspar1992/angular-helpers/commit/ff1d30b9a466f578d17700242ad1206afc2759fc))
- major type safety improvements ([b07a3ce](https://github.com/Gaspar1992/angular-helpers/commit/b07a3ce1e6b01e119d332549bf3367d6612a2fba))
- migrate to ESLint v10 flat config and set up linting ([8b67146](https://github.com/Gaspar1992/angular-helpers/commit/8b6714668bcec624a35858be142fdf88f6750982))
- remove SsrSafeUtil and migrate to Angular's built-in SSR detection ([73295cd](https://github.com/Gaspar1992/angular-helpers/commit/73295cd87182060a84a1f2f0d05a231c667f883d))
- setup CI/CD and release automation ([21500ef](https://github.com/Gaspar1992/angular-helpers/commit/21500efba370d1f6ea8296bc64d3b92a3cfab6bc))
- update README to focus on package benefits and marketing ([1f897c9](https://github.com/Gaspar1992/angular-helpers/commit/1f897c909f197031ef896f4973c772d346ad5a42))

### BREAKING CHANGES

- RegexSecurityService now integrated in browser-web-apis package
