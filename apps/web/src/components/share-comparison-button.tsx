"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

export function ShareComparisonButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const data = {
      title: "So sánh thiết bị trên SpecHub",
      text: title,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(data);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2_000);
      }
    } catch {
      // The native share sheet can be dismissed without needing an error state.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50"
    >
      {copied ? <Check size={16} /> : <Share2 size={16} />}
      {copied ? "Đã sao chép" : "Chia sẻ"}
    </button>
  );
}
