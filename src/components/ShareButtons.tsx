"use client";

import { useState } from "react";
import { SHARE_CHANNELS, shareUrl, type ShareChannel } from "@/lib/share";
import { track } from "@/lib/track";

export function ShareButtons({ link, text, code }: { link: string; text: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy your link", link);
    }
  }

  function onShare(channel: ShareChannel) {
    track("share_click", { channel }, code);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {SHARE_CHANNELS.map(({ channel, label }) =>
        channel === "copy" ? (
          <button
            key={channel}
            type="button"
            onClick={() => {
              onShare("copy");
              void copy();
            }}
            className="rounded-full bg-ink px-4 py-2 text-sm text-fog transition hover:bg-bay"
          >
            {copied ? "Copied" : label}
          </button>
        ) : (
          <a
            key={channel}
            href={shareUrl(channel, text, link)}
            target={channel === "sms" || channel === "email" ? undefined : "_blank"}
            rel="noopener noreferrer"
            onClick={() => onShare(channel)}
            className="rounded-full border border-ink/25 px-4 py-2 text-sm text-ink transition hover:border-ink"
          >
            {label}
          </a>
        ),
      )}
    </div>
  );
}
