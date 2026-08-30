interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  ariaLabel: string;
}

export function Toggle({ checked, onChange, ariaLabel }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className="relative h-7 w-12 shrink-0 rounded-full transition"
      style={{ background: checked ? "var(--accent)" : "var(--bg-muted)" }}
      onClick={() => onChange(!checked)}
    >
      <span
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition"
        style={{ left: checked ? "1.35rem" : "0.15rem" }}
      />
    </button>
  );
}
