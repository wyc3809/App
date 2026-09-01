"use client";

import { useState } from "react";
import { readPublicAssetBase } from "@/lib/read-public-asset-base";

/** In-app brand mark — same artwork as the WorthBook app icon (Maneki-neko + ledger). */
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  const [base] = useState(readPublicAssetBase);

  return (
    <img
      src={`${base}/icon-192.png`}
      width={192}
      height={192}
      alt=""
      className={`${className} rounded-[22%] object-cover`}
      role="img"
      aria-hidden
    />
  );
}
