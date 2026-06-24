# Specification: Browser API Injection Context Enforcement

## Intent

Ensure that all browser API injection helper functions are executed within an Angular injection context. This prevents runtime errors related to accessing `inject()` after the injection phase has completed.

## Requirements

1. All custom browser inject functions MUST call Angular's `assertInInjectionContext` at their entry point.
2. If called within a valid injection context (e.g., component constructor, field initializer, or provider factory function), the inject function MUST execute successfully.
3. If called outside a valid injection context (e.g., inside an asynchronous callback, lifecycle hook like `ngOnInit`, or event handler), the inject function MUST throw an error.

## Scenarios

### Scenario 1: Successful injection within a valid injection context

**Given** an Angular component or service initializing
**When** a browser inject function (e.g., `injectWakeLock()`) is called in the constructor or as a field initializer
**Then** the function MUST successfully retrieve or construct the target token without throwing an injection context error.

### Scenario 2: Fail-fast execution outside a valid injection context

**Given** an Angular component or service that has completed initialization
**When** a browser inject function is called within an asynchronous callback (like `setTimeout`) or an event handler (like a button click listener)
**Then** the function MUST immediately throw an error indicating that it was called outside the injection context.
