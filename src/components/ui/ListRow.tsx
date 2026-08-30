"use client";

import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

interface ListRowProps {
  icon?: ReactNode;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle?: string;
  value: ReactNode;
  valueMuted?: ReactNode;
  onClick?: () => void;
  trailing?: ReactNode;
  showChevron?: boolean;
  variant?: "card" | "plain";
}

export function ListRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  value,
  valueMuted,
  onClick,
  trailing,
  showChevron = false,
  variant = "card",
}: ListRowProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      type={onClick ? "button" : undefined}
      className={`list-row w-full text-left ${variant === "plain" ? "border-0 shadow-none" : ""}`}
      onClick={onClick}
    >
      {icon && (
        <span
          className="list-row-icon"
          style={{
            background: iconBg ?? "var(--accent-soft)",
            color: iconColor ?? "var(--accent)",
          }}
        >
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{title}</p>
        {subtitle && (
          <p className="mt-0.5 truncate text-xs" style={{ color: "var(--fg-subtle)" }}>
            {subtitle}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="font-semibold tabular-nums">{value}</p>
        {valueMuted && (
          <p className="mt-0.5 text-xs tabular-nums" style={{ color: "var(--fg-subtle)" }}>
            {valueMuted}
          </p>
        )}
      </div>
      {trailing}
      {showChevron && !trailing && (
        <ChevronRight size={18} style={{ color: "var(--fg-subtle)" }} className="shrink-0" />
      )}
    </Tag>
  );
}
