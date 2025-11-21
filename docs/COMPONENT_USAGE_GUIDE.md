# Component Usage Guide

This guide provides examples and best practices for using the reusable UI components in the ESTA Tracker frontend.

---

## Table of Contents

1. [PasswordField Component](#passwordfield-component)
2. [Toast Notifications](#toast-notifications)
3. [Button Styles](#button-styles)
4. [Input Styles](#input-styles)
5. [Card Styles](#card-styles)

---

## PasswordField Component

### Basic Usage

```tsx
import { PasswordField } from '../components/PasswordField';
import { useState } from 'react';

function LoginForm() {
  const [password, setPassword] = useState('');

  return (
    <PasswordField
      id="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="Enter password"
      required
    />
  );
}
```

### With Label and Strength Indicator

```tsx
<PasswordField
  id="new-password"
  value={newPassword}
  onChange={(e) => setNewPassword(e.target.value)}
  label="Create Password"
  placeholder="Minimum 8 characters"
  autoComplete="new-password"
  showStrengthIndicator
  required
/>
```

### With Error State

```tsx
<PasswordField
  id="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  label="Password"
  error={error ? "Password is required" : undefined}
  required
/>
```

### All Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `id` | string | Yes | - | Unique identifier for the input |
| `value` | string | Yes | - | Current password value |
| `onChange` | function | Yes | - | Change handler `(e: ChangeEvent<HTMLInputElement>) => void` |
| `name` | string | No | Same as `id` | HTML name attribute |
| `placeholder` | string | No | "Enter password" | Placeholder text |
| `required` | boolean | No | false | Mark as required field |
| `autoComplete` | string | No | "current-password" | Autocomplete hint |
| `label` | string | No | - | Label text to display above input |
| `showStrengthIndicator` | boolean | No | false | Show password strength bar |
| `className` | string | No | "" | Additional CSS classes |
| `error` | string | No | - | Error message to display |

### Password Strength Levels

The component automatically calculates password strength based on:
- Length (8+ characters, 12+ characters)
- Mixed case (uppercase + lowercase)
- Numbers
- Special characters

Strength levels:
- 0: No password
- 1: Weak (red)
- 2: Fair (orange)
- 3: Good (yellow)
- 4: Strong (green)

---

## Toast Notifications

### Using the useToast Hook

```tsx
import { Toast, useToast } from '../components/Toast';

function MyComponent() {
  const { toast, showToast, hideToast } = useToast();

  const handleSuccess = () => {
    showToast('Registration successful!', 'success');
  };

  const handleError = () => {
    showToast('Failed to save changes', 'error');
  };

  const handleWarning = () => {
    showToast('Your session will expire soon', 'warning');
  };

  const handleInfo = () => {
    showToast('New features available!', 'info');
  };

  return (
    <>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
      
      {/* Render the toast */}
      {toast && <Toast {...toast} onClose={hideToast} />}
    </>
  );
}
```

### Without Hook (Direct Usage)

```tsx
import { Toast } from '../components/Toast';
import { useState } from 'react';

function MyComponent() {
  const [showToast, setShowToast] = useState(false);

  return (
    <>
      <button onClick={() => setShowToast(true)}>Show Toast</button>
      
      {showToast && (
        <Toast
          message="This is a notification"
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </>
  );
}
```

### Toast Types and Use Cases

| Type | Color | Use Case | Example |
|------|-------|----------|---------|
| `success` | Green | Successful operations | "Account created successfully!" |
| `error` | Red | Failed operations or errors | "Failed to save changes" |
| `warning` | Yellow | Warnings or cautions | "Your session expires in 5 minutes" |
| `info` | Blue | General information | "New feature available" |

### Toast Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `message` | string | Yes | - | Text to display in the toast |
| `type` | 'success' \| 'error' \| 'warning' \| 'info' | No | 'info' | Toast type/color |
| `duration` | number | No | 5000 | Auto-dismiss time in ms (0 = no auto-dismiss) |
| `onClose` | function | Yes | - | Callback when toast is closed |

---

## Button Styles

### Primary Button

```tsx
<button className="btn btn-primary">
  Save Changes
</button>
```

Use for primary actions like "Submit", "Save", "Register"

### Secondary Button

```tsx
<button className="btn btn-secondary">
  Cancel
</button>
```

Use for secondary actions like "Cancel", "Back", "Skip"

### Danger Button

```tsx
<button className="btn btn-danger">
  Delete Account
</button>
```

Use for destructive actions like "Delete", "Remove", "Logout"

### Success Button

```tsx
<button className="btn btn-success">
  Approve Request
</button>
```

Use for positive confirmations like "Approve", "Accept", "Confirm"

### Disabled State

```tsx
<button className="btn btn-primary" disabled={loading}>
  {loading ? 'Processing...' : 'Submit'}
</button>
```

All button types automatically handle disabled styling with reduced opacity and cursor change.

### Button with Loading State

```tsx
<button
  type="submit"
  disabled={loading}
  className="btn btn-primary relative overflow-hidden group"
>
  <span className="relative z-10 flex items-center justify-center">
    {loading ? (
      <>
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Processing...
      </>
    ) : (
      'Submit'
    )}
  </span>
  {!loading && <span className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></span>}
</button>
```

---

## Input Styles

### Basic Input

```tsx
<input
  type="text"
  className="input w-full"
  placeholder="Enter text"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Input with Icon

```tsx
<div className="relative">
  <input
    type="email"
    className="input w-full pl-10"
    placeholder="Email address"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  </div>
</div>
```

### Input with Label

```tsx
<div>
  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
    Full Name
  </label>
  <input
    id="name"
    type="text"
    className="input w-full"
    placeholder="John Doe"
    value={name}
    onChange={(e) => setName(e.target.value)}
    required
  />
</div>
```

### Textarea

```tsx
<textarea
  className="input w-full"
  rows={4}
  placeholder="Enter description"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

---

## Card Styles

### Basic Card

```tsx
<div className="card">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-gray-600 dark:text-gray-400">Card content goes here</p>
</div>
```

### Hoverable Card

```tsx
<div className="card-hover cursor-pointer" onClick={handleClick}>
  <h3 className="text-lg font-semibold mb-2">Interactive Card</h3>
  <p className="text-gray-600 dark:text-gray-400">Click me!</p>
</div>
```

### Glass Card

```tsx
<div className="glass-card">
  <h3 className="text-lg font-semibold mb-2">Glass Effect Card</h3>
  <p className="text-gray-600 dark:text-gray-400">Semi-transparent with blur</p>
</div>
```

### Glass Card with Hover

```tsx
<div className="glass-card-hover cursor-pointer">
  <h3 className="text-lg font-semibold mb-2">Glass Interactive Card</h3>
  <p className="text-gray-600 dark:text-gray-400">Hover for effect</p>
</div>
```

---

## Utility Classes

### Gradient Header

```tsx
<h1 className="gradient-header text-4xl font-bold">
  Welcome to ESTA Tracker
</h1>
```

### Gradient Background

```tsx
<div className="gradient-bg min-h-screen">
  {/* Page content */}
</div>
```

### Animations

```tsx
{/* Fade in */}
<div className="animate-fade-in">Content</div>

{/* Fade in up */}
<div className="animate-fade-in-up">Content</div>

{/* Fade in down */}
<div className="animate-fade-in-down">Content</div>

{/* Scale in */}
<div className="animate-scale-in">Content</div>

{/* Float */}
<div className="animate-float">Content</div>

{/* Shake */}
<div className="animate-shake">Error content</div>
```

---

## Best Practices

### Accessibility

1. **Always provide labels** for form inputs
2. **Use proper ARIA attributes** on interactive elements
3. **Ensure focus indicators** are visible (already handled by button/input styles)
4. **Provide error messages** that are programmatically associated with inputs

### Dark Mode

1. **Use dark: variants** for dark mode specific styles
2. **Test all components** in both light and dark modes
3. **Ensure sufficient contrast** for text and interactive elements

### Performance

1. **Use lazy loading** for heavy components
2. **Memoize callbacks** passed to child components
3. **Avoid unnecessary re-renders** with React.memo when appropriate

### Error Handling

1. **Always handle loading states** in forms
2. **Show meaningful error messages** to users
3. **Use toast notifications** for async operation feedback
4. **Provide fallback UI** for error states

---

## Examples Repository

For more examples and live demos, check the `/packages/frontend/src/pages` directory:

- `Login.tsx` - Login form with PasswordField
- `RegisterEmployee.tsx` - Employee registration with PasswordField
- `OnboardingWizard.tsx` - Multi-step form with validation

---

**Last Updated:** 2024-11-21  
**Version:** 1.0
