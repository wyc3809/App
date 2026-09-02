"use client";

import { useState } from "react";
import { readPublicAssetBase } from "@/lib/read-public-asset-base";

/** In-app brand mark — full Maneki-neko mascot (header / splash). */
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  const [base] = useState(readPublicAssetBase);

  return (
    <img
      src={`${base}/mascot-full.png`}
      width={128}
      height={128}
      alt=""
      className={`${className} object-contain`}
      role="img"
      aria-hidden
    />
  );
}
