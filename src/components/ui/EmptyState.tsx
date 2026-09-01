interface EmptyStateProps {
  message: string;
  className?: string;
  action?: React.ReactNode;
}

export function EmptyState({ message, className = "", action }: EmptyStateProps) {
  return (
    <div
      className={`card-inset flex flex-col items-center justify-center gap-3 px-4 py-10 text-center text-sm ${className}`}
      style={{ color: "var(--fg-muted)" }}
    >
      <p>{message}</p>
      {action}
    </div>
  );
}
