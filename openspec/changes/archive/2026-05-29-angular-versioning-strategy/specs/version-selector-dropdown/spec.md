# Specification: Version Selector Dropdown (version-selector-dropdown)

## Purpose

Define the behavior, accessibility, and visual requirements for the standalone `VersionDropdownComponent` enabling selection of documentation versions.

## Requirements

1. The `VersionDropdownComponent` MUST be a standalone component.
2. The interactive trigger button MUST:
   - Have `role="combobox"`
   - Have `aria-haspopup="listbox"`
   - Expose the reactive state of the dropdown via `aria-expanded` ("true" when open, "false" when closed).
   - Display the currently selected version.
3. The dropdown menu container MUST:
   - Have `role="listbox"`
   - Have an accessible label linked to the trigger button.
4. Each option inside the dropdown menu MUST:
   - Have `role="option"`
   - Have `aria-selected` set to "true" if it matches the current version, and "false" otherwise.
5. The component MUST support the following keyboard navigation keys:
   - **ArrowDown / ArrowUp**: Move focus or active-descendant highlight between options.
   - **Enter / Space**: Select the highlighted version and close the dropdown.
   - **Escape**: Close the dropdown without changing the version and return focus to the trigger button.
6. The component MUST align with the premium glassmorphism styling in `src/styles.css`:
   - Backdrop filter MUST use `backdrop-filter: blur(12px)` or higher.
   - Background MUST use transparent overlays, e.g., `linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, rgba(255, 255, 255, 0.01) 100%)`.
   - Borders MUST match `--c-border-subtle` or `--c-border`.
   - Border radius MUST match `--rounded-btn` (for button) and `--rounded-box` (for menu container).
   - Transitions MUST match `--t-fast`.

## Scenarios

### Scenario 1: Accessibility Attributes

```gherkin
Given the version dropdown is rendered on the screen
When the dropdown is closed
Then the trigger button MUST have [role="combobox"]
And the trigger button MUST have [aria-expanded="false"]
When the user clicks the trigger button
Then the trigger button MUST have [aria-expanded="true"]
And the dropdown list container MUST be visible with [role="listbox"]
And each version option MUST have [role="option"]
And the option matching the active version MUST have [aria-selected="true"]
```

### Scenario 2: Keyboard Navigation Flow

```gherkin
Given the trigger button has focus and the dropdown is closed
When the user presses "ArrowDown" or "Space"
Then the dropdown MUST open
And focus or active-descendant highlighting MUST move to the first option
When the user presses "ArrowDown" again
Then the highlight MUST move to the next option
When the user presses "Enter" on the highlighted option
Then the version service MUST be updated with the selected version
And the dropdown MUST close
And focus MUST return to the trigger button
```

### Scenario 3: Escape to Dismiss

```gherkin
Given the dropdown is open and an option has focus/highlight
When the user presses "Escape"
Then the dropdown MUST close
And the version MUST NOT change
And focus MUST return to the trigger button
```
