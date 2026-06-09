---
name: angular-performance-tuner
description: Guidelines and instructions for tuning Angular application performance, ensuring zoneless safety, and enforcing accessibility standards.
---

# Angular Performance Tuner Skill

This skill provides a set of rules, patterns, and best practices for optimizing Angular applications. It focuses on leveraging the default `ChangeDetectionStrategy.OnPush` behavior, designing for zoneless-safety, and maintaining high accessibility (a11y) compliance.

---

## 1. OnPush Change Detection

Using `ChangeDetectionStrategy.OnPush` is a key technique for reducing change detection cycles and boosting performance. In Angular 22, components default to `OnPush` change detection automatically when no strategy is specified. With `OnPush`, change detection is skipped unless explicitly triggered.

### Rules and Requirements

- **Leverage Implicit OnPush**: Do **NOT** set `changeDetection: ChangeDetectionStrategy.OnPush` explicitly in component decorators, as it is the default in Angular 22+ and acts as redundant boilerplate. Only specify `ChangeDetectionStrategy.Eager` if you need to explicitly opt-out.
- **Immutability First**: Never mutate objects or arrays directly. When updating state, create new references (using the spread operator or helper functions) to ensure `OnPush` components detect changes via `@Input` bindings.
- **Leverage Signals**: Use Angular Signals (`signal`, `computed`) for local and shared state. Changes to signals read in templates automatically trigger change detection for that component and its ancestors.
- **Async Pipe**: For RxJS streams in templates, always use the `async` pipe. It handles subscriptions, unsubscriptions, and automatically marks the view for change detection.

### Common Pitfalls and Solutions

- _Pitfall:_ Mutating a property inside an input object (e.g., `this.user.name = 'New Name'`) does not trigger change detection.
  - _Solution:_ Replace the object reference: `this.user = { ...this.user, name: 'New Name' };` or use a signal: `user.update(u => ({ ...u, name: 'New Name' }))`.
- _Pitfall:_ Asynchronous operations outside the Angular Zone or without template signal/observable bindings fail to update the view.
  - _Solution:_ Explicitly inject `ChangeDetectorRef` and call `cdr.markForCheck()` after side effects, or migrate the state to Signals.

---

## 2. Zoneless Safety

Angular 18+ introduces zoneless support, removing the reliance on `zone.js` for triggering change detection. Designing components and services to be zoneless-safe ensures they work efficiently with or without `zone.js`.

### Rules and Requirements

- **Do Not Rely on Zone.js Side Effects**: Avoid assuming that `setTimeout`, `setInterval`, native Promises, or event listeners will automatically trigger global change detection.
- **Reactive State via Signals**: Use Signals for template-bound state. In a zoneless application, template updates are scheduled specifically when a Signal notifies the view that its value has changed.
- **Convert RxJS to Signals**: Use `toSignal` from `@angular/core/rxjs-interop` to bind RxJS Observables to templates. This ensures zoneless-safe rendering.
- **Native Scheduler API**: If you need to perform manual scheduling or run microtasks, use standard Angular APIs (like `afterNextRender` or `afterRender`) rather than native microtask/macrotask timing hacks.
- **Clean Subscriptions**: In non-Signal async flows, ensure proper cleanup using `takeUntilDestroyed()` or manual subscription management to avoid memory leaks that degrade performance.

---

## 3. Accessibility (a11y)

Optimized applications must also be usable and accessible. Following accessibility standards ensures compliance with WCAG AA guidelines.

### Focus Management

- **Logical Tab Order**: Use semantic HTML tags. Ensure custom components do not disrupt tab flow. Use `tabindex` carefully.
- **Focus Trapping**: Implement focus trapping in modals, dialogs, and dropdowns. When active, keyboard navigation (`Tab` / `Shift+Tab`) must not escape the container.
- **Restore Focus**: When a modal or temporary container is closed, restore focus to the triggering element.
- **Programmatic Focus**: Use `ElementRef.nativeElement.focus()` in lifecycle hooks or event handlers to guide screen readers when elements are dynamically loaded or routes change.

### Semantic HTML and ARIA

- **Use Semantic HTML Elements**: Prefer `<button>`, `<a>`, `<main>`, `<nav>`, and `<header>` over generic `<div>` or `<span>` styled to look like them.
- **ARIA Roles and Attributes**:
  - Apply `role` attributes where semantics are missing (e.g., `role="dialog"`).
  - Use state attributes like `aria-expanded`, `aria-checked`, and `aria-hidden` dynamically bound to component state.
  - Always provide an `aria-label` or `aria-labelledby` for interactive elements that do not contain visible text.
- **Accessible Forms**: Ensure all `<input>` elements are associated with a `<label>` (using `for` or wrapping). Do not rely solely on `placeholder` text for labeling inputs.
- **Contrast and Scalability**: Define relative units (`rem`, `em`) for layouts and ensure font sizes scale. Verify color contrast ratios meet WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text).
