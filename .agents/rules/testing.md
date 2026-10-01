---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing Conventions

## Vitest for Testing

Use Vitest for all tests in this project.

### Test Pattern

```tsx
import { describe, it, expect } from "vitest";

describe("formatDate", () => {
  it("should format valid date", () => {
    const result = formatDate(new Date("2024-01-15"), "YYYY-MM-DD");
    expect(result).toBe("2024-01-15");
  });
});
```

### Component Testing

Tests run in `node` by default. A component test opts into jsdom with a docblock and uses Testing Library:

```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

describe("Button", () => {
  it("should render children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole("button", { name: "Click me" })).not.toBeNull();
  });
});
```

### Query Priority

Use queries in this order (most to least preferred):

1. `screen.getByRole()` - Accessible to everyone
2. `screen.getByLabelText()` - Form elements
3. `screen.getByPlaceholderText()` - When no label
4. `screen.getByText()` - Non-interactive elements
5. `screen.getByTestId()` - Last resort

### Interaction Testing

```tsx
it("should call handler when clicked", async () => {
  const handleClick = vi.fn();
  render(<Button onPress={handleClick}>Click</Button>);

  await userEvent.click(screen.getByRole("button", { name: "Click" }));

  expect(handleClick).toHaveBeenCalledOnce();
});
```

## Test Organization

Colocate tests with the code they test:

```
src/components/button/
├── index.tsx
├── styles.css.ts
└── button.test.tsx

src/features/talk/
├── to-ratio.ts
└── to-ratio.test.ts
```

## Test File Naming

- Unit tests: `<module-name>.test.ts` or `<module-name>.test.tsx`
- Integration tests: `<feature-name>.integration.test.ts`
