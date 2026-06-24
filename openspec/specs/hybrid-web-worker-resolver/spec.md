# Specification: Hybrid Web Worker Resolver

## Intent

Provide a robust, dual-mode Web Worker resolver that ensures worker execution works out-of-the-box in different deployment environments (such as GitHub Pages with nested `/demo/` paths or custom base hrefs) without requiring complex manual bundler configurations. It achieves this by attempting to load from an asset URL first, and falling back to a bundled inlined Blob worker upon failure, while maintaining compatibility with Content Security Policies (CSP) via custom URL overrides.

## Requirements

1. The resolver MUST attempt to instantiate the Web Worker using the configured asset URL first.
2. The resolver MUST handle asset loading failures (such as a 404 Not Found error caused by base href mismatches on GitHub Pages or nested routes) gracefully.
3. If the asset URL fails to load, or if no asset URL is configured, the resolver MUST fall back to instantiating the worker using an inlined Blob URL generated from the compiled worker code.
4. The resolver MUST support a custom URL parameter/override to allow hosting the worker script on a specific path, satisfying strict Content Security Policies (CSP) that block `blob:` worker creation.
5. If the CSP blocks `blob:` URLs and the fallback fails, the resolver MUST propagate the error with a descriptive message suggesting the use of the custom URL override.

## Scenarios

### Scenario 1: Successful loading from a correct asset URL

**Given** a valid asset URL for the worker script is configured
**When** the worker pool service initializes the worker
**Then** the resolver MUST load and execute the worker from the asset URL.

### Scenario 2: Successful fallback to inline Blob worker on asset loading failure (404 / base href mismatch)

**Given** an asset URL that returns a 404 error (e.g., due to deployment path `/demo/` or base href mismatch on GitHub Pages) or is omitted
**When** the worker pool service initializes the worker
**Then** the resolver MUST catch the failure and MUST fall back to instantiating the worker as an inline Blob worker using the bundled source code.

### Scenario 3: CSP compatibility with custom URL parameter override

**Given** a Content Security Policy (CSP) that blocks `blob:` URLs
**When** the resolver fallback to Blob worker is blocked or fails
**Then** the resolver MUST allow resolving the worker via a custom URL parameter override (providing a path to a self-hosted asset), avoiding blockages by CSP.
