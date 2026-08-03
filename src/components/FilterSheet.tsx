"use client";

import { X } from "lucide-react";
import { ASSET_TYPES, LIABILITY_TYPES } from "@/lib/categories";
import type { AccountCategory } from "@/lib/types";

export type HomeFilterState = {
  kind: "all" | "assets" | "liabilities";
  categories: AccountCategory[];
  sort: "name" | "value" | "updated";
};

export const DEFAULT_HOME_FILTER: HomeFilterState = {
  kind: "all",
  categories: [],
  sort: "value",
};

interface FilterSheetProps {
  open: boolean;
  value: HomeFilterState;
  onChange: (next: HomeFilterState) => void;
  onClose: () => void;
}

export function FilterSheet({ open, value, onChange, onClose }: FilterSheetProps) {
  if (!open) return null;

  const toggleCategory = (category: AccountCategory) => {
    const has = value.categories.includes(category);
    onChange({
      ...value,
      categories: has
        ? value.categories.filter((c) => c !== category)
        : [...value.categories, category],
    });
  };

  const categoryOptions =
    value.kind === "liabilities"
      ? LIABILITY_TYPES
      : value.kind === "assets"
        ? ASSET_TYPES
        : [...ASSET_TYPES, ...LIABILITY_TYPES];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close filter"
        onClick={onClose}
      />
      <div
        className="relative z-10 max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl p-5 sm:rounded-3xl"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-title"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="filter-title" className="font-display text-xl">
            Filter
          </h2>
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="label">Type</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["all", "All"],
                  ["assets", "Assets"],
                  ["liabilities", "Liabilities"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`chip ${value.kind === key ? "chip-active" : ""}`}
                  onClick={() =>
                    onChange({
                      ...value,
                      kind: key,
                      categories: [],
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Category</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={`chip ${value.categories.length === 0 ? "chip-active" : ""}`}
                onClick={() => onChange({ ...value, categories: [] })}
              >
                Any
              </button>
              {categoryOptions.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  className={`chip ${value.categories.includes(c.value) ? "chip-active" : ""}`}
                  onClick={() => toggleCategory(c.value)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="label">Sort by</p>
            <div className="flex flex-wrap gap-1">
              {(
                [
                  ["value", "Value"],
                  ["name", "Name"],
                  ["updated", "Updated"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`chip ${value.sort === key ? "chip-active" : ""}`}
                  onClick={() => onChange({ ...value, sort: key })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn-secondary flex-1"
              onClick={() => onChange(DEFAULT_HOME_FILTER)}
            >
              Reset
            </button>
            <button type="button" className="btn-primary flex-1" onClick={onClose}>
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
