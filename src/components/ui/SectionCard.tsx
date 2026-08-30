"use client";

import type { ReactNode } from "react";

interface SectionCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md";
}

export function SectionCard({
  title,
  action,
  children,
  className = "",
  padding = "md",
}: SectionCardProps) {
  return (
    <section className={`card-surface ${padding === "sm" ? "p-3" : "p-4"} ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title ? <h2 className="font-display text-base font-bold">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
