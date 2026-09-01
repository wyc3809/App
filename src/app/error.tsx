"use client";

import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/context";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl">{t("error.title")}</h1>
      <p className="max-w-sm text-sm" style={{ color: "var(--fg-muted)" }}>
        {t("error.message")}
      </p>
      <button type="button" className="btn-primary" onClick={reset}>
        {t("error.retry")}
      </button>
    </div>
  );
}
