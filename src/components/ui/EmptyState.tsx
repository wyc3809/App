interface EmptyStateProps {
  message: string;
  className?: string;
}

export function EmptyState({ message, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`card-inset flex items-center justify-center px-4 py-10 text-center text-sm ${className}`}
      style={{ color: "var(--fg-muted)" }}
    >
      {message}
    </div>
  );
}
