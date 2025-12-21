# Component Templates

Templates for React components with validation, error handling, and interactivity.

---

## Form Component with Validation {#component-form}

Template for a client-side form component with field-level validation, error display, and loading states.

```typescript
"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Form component with field-level validation and error display.
 *
 * Features:
 * - Field-level validation
 * - Loading states during submission
 * - Error display (field-level and general)
 * - Redirect on success
 */
export function ResourceForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    field1: "",
    field2: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    field1?: string;
    field2?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Clear previous errors
      setFieldErrors({});
      setGeneralError(null);

      // Validate fields
      const errors: { field1?: string; field2?: string } = {};

      if (!formData.field1) {
        errors.field1 = "Field1 is required";
      }

      if (!formData.field2) {
        errors.field2 = "Field2 is required";
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setIsLoading(true);

      try {
        const response = await fetch("/api/resource", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          setGeneralError(data.error || "An error occurred");
          return;
        }

        // Success - redirect or update UI
        router.push("/success-path");
        router.refresh();
      } catch {
        setGeneralError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [formData, router],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* General error banner */}
      {generalError && (
        <div
          role="alert"
          className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"
        >
          {generalError}
        </div>
      )}

      {/* Field 1 */}
      <Input
        type="text"
        name="field1"
        label="Field 1"
        value={formData.field1}
        onChange={(e) =>
          setFormData({ ...formData, field1: e.target.value })
        }
        error={fieldErrors.field1}
        required
        disabled={isLoading}
      />

      {/* Field 2 */}
      <Input
        type="text"
        name="field2"
        label="Field 2"
        value={formData.field2}
        onChange={(e) =>
          setFormData({ ...formData, field2: e.target.value })
        }
        error={fieldErrors.field2}
        required
        disabled={isLoading}
      />

      {/* Submit button */}
      <Button
        type="submit"
        isLoading={isLoading}
        disabled={isLoading}
        className="w-full"
      >
        Submit
      </Button>
    </form>
  );
}
```

**Usage Notes:**
- Replace `ResourceForm` with your component name
- Replace `field1`, `field2` with your actual form fields
- Add custom validation logic as needed
- Replace `/api/resource` with your actual API endpoint
- Replace `/success-path` with your redirect destination
- Add additional fields following the same pattern

**See also:** `pattern-error-client`

---

## Interactive Display Component {#component-display}

Template for a display component with optional interactive actions (buttons, callbacks).

```typescript
"use client";

import { useState, useCallback } from "react";

interface ResourceCardProps {
  resource: {
    id: string;
    name: string;
    status: string;
    // ... other fields
  };
  onAction?: (id: string) => void;
}

/**
 * Display component with optional interactive actions.
 *
 * Renders resource data with status badge and optional action button.
 *
 * @param resource - The resource data to display
 * @param onAction - Optional callback invoked when action button is clicked
 */
export function ResourceCard({ resource, onAction }: ResourceCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = useCallback(async () => {
    if (!onAction) return;

    setIsLoading(true);
    try {
      await onAction(resource.id);
    } finally {
      setIsLoading(false);
    }
  }, [resource.id, onAction]);

  return (
    <div className="p-4 bg-surface rounded-lg border border-border">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium text-foreground">{resource.name}</h3>
          <p className="text-sm text-foreground-secondary mt-1">
            Status: {resource.status}
          </p>
        </div>
        {onAction && (
          <button
            onClick={handleAction}
            disabled={isLoading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Action"}
          </button>
        )}
      </div>
    </div>
  );
}
```

**Usage Notes:**
- Replace `ResourceCard` with your component name
- Update the `resource` interface with your actual data structure
- Replace `onAction` callback name and behavior as needed
- Add additional display fields following the same pattern
- Use `Button` component from UI library if preferred

**See also:** `pattern-error-client`
