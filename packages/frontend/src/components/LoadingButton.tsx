import { ButtonHTMLAttributes } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  children: React.ReactNode;
}

/**
 * Button component with loading state
 * 
 * Features:
 * - Built-in loading spinner
 * - Customizable loading text
 * - Multiple variants
 * - Accessible loading state
 * - Prevents double-submission
 */
export function LoadingButton({
  loading = false,
  loadingText,
  variant = 'primary',
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  const baseClasses = 'btn relative overflow-hidden group';
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
    success: 'btn-success',
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`.trim()}
      aria-busy={loading}
      aria-live="polite"
    >
      <span className="relative z-10 flex items-center justify-center">
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-5 w-5 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {loading ? loadingText || 'Loading...' : children}
      </span>
      {!loading && (
        <span className="absolute inset-0 shimmer-bg opacity-0 group-hover:opacity-100 transition-opacity"></span>
      )}
    </button>
  );
}
