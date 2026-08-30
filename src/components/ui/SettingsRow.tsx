"use client";

import type { ReactNode } from "react";
import { Toggle } from "./Toggle";

interface SettingsRowProps {
  icon: ReactNode;
  title: string;
  description?: string;
  trailing?: ReactNode;
}

export function SettingsRow({ icon, title, description, trailing }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="flex min-w-0 items-start gap-3">
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "var(--accent-soft)", color: "var(--accent)" }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          {description && (
            <p className="mt-0.5 text-xs leading-relaxed" style={{ color: "var(--fg-subtle)" }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {trailing}
    </div>
  );
}

interface SettingsToggleRowProps {
  icon: ReactNode;
  title: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

export function SettingsToggleRow({
  icon,
  title,
  description,
  checked,
  onChange,
}: SettingsToggleRowProps) {
  return (
    <SettingsRow
      icon={icon}
      title={title}
      description={description}
      trailing={<Toggle checked={checked} onChange={onChange} ariaLabel={title} />}
    />
  );
}
