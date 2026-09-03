"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/**
 * Logs a page view on mount and, via one delegated listener, any click on an
 * element carrying `data-cta`. Server-rendered links stay plain <a> tags.
 */
export function PageView({ path, refCode }: { path: string; refCode?: string | null }) {
  useEffect(() => {
    track("page_view", { path, ref: refCode ?? null });
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-cta]");
      if (el) track("cta_click", { cta: el.dataset.cta, href: el.getAttribute("href") });
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [path, refCode]);
  return null;
}
