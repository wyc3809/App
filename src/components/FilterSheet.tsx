"use client";

import { ASSET_TYPES, LIABILITY_TYPES } from "@/lib/categories";
import { BottomSheet } from "@/components/BottomSheet";
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
    <BottomSheet
      onClose={onClose}
      title="Filter"
      titleId="filter-title"
      footer={
        <>
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
        </>
      }
    >
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
                className={`chip min-h-9 ${value.kind === key ? "chip-active" : ""}`}
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
              className={`chip min-h-9 ${value.categories.length === 0 ? "chip-active" : ""}`}
              onClick={() => onChange({ ...value, categories: [] })}
            >
              Any
            </button>
            {categoryOptions.map((c) => (
              <button
                key={c.value}
                type="button"
                className={`chip min-h-9 ${value.categories.includes(c.value) ? "chip-active" : ""}`}
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
                className={`chip min-h-9 ${value.sort === key ? "chip-active" : ""}`}
                onClick={() => onChange({ ...value, sort: key })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}
