"use client";

import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="animate-fade-up">
      <p className="eyebrow">{eyebrow}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h1 className="font-display text-[1.75rem] font-bold leading-tight">{title}</h1>
        {action}
      </div>
      {description && (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
          {description}
        </p>
      )}
    </header>
  );
}
