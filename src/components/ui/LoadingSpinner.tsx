interface LoadingSpinnerProps {
  /** Optional message displayed below the spinner. */
  message?: string;
}

/**
 * Full-page centered loading spinner.
 * Used while Firebase checks auth state on initial page load.
 */
export default function LoadingSpinner({ message }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-50">
      <div
        className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
        role="status"
        aria-label={message ?? 'Loading'}
      />
      {message && (
        <p className="text-sm text-gray-500">{message}</p>
      )}
    </div>
  );
}
