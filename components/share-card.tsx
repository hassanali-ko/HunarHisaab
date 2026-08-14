"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "./ui";
import { useT } from "./lang";

export function ShareCard({
  url,
  whatsappText,
  onShared,
}: {
  url: string;
  whatsappText: string;
  onShared?: () => void;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShared?.();
    } catch {
      setCopied(false);
    }
  };

  const waHref = `https://wa.me/?text=${encodeURIComponent(`${whatsappText}\n${url}`)}`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-primary-soft/50 p-5 sm:flex-row sm:items-center">
        <div className="rounded-xl bg-white p-3">
          <QRCodeSVG value={url} size={112} level="M" />
        </div>
        <div className="text-center sm:text-start">
          <p className="font-medium">{t.shareHeading}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {t.shareBody}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onShared}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-base font-semibold text-white transition-colors hover:brightness-95"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2m0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 8.24 8.24c0 4.54-3.7 8.23-8.24 8.23m4.52-6.16c-.25-.12-1.47-.72-1.69-.81s-.39-.12-.56.12-.64.81-.79.98-.29.19-.54.06a6.7 6.7 0 0 1-1.99-1.23 7.5 7.5 0 0 1-1.38-1.72c-.14-.25-.01-.38.11-.5s.25-.29.37-.43.17-.25.25-.41a.45.45 0 0 0-.02-.43c-.06-.12-.56-1.34-.76-1.84s-.4-.42-.56-.43h-.47a.9.9 0 0 0-.65.31 2.76 2.76 0 0 0-.86 2.05c0 1.21.88 2.38 1 2.54s1.73 2.64 4.19 3.7c.59.26 1.04.4 1.4.52.59.19 1.12.16 1.55.1.47-.07 1.47-.6 1.67-1.18s.21-1.08.15-1.18-.22-.19-.47-.31"
            />
          </svg>
          {t.sendOnWhatsApp}
        </a>

        <Button type="button" variant="secondary" size="lg" onClick={copy}>
          {copied ? t.linkCopied : t.copyLink}
        </Button>
      </div>

      <p
        dir="ltr"
        className="break-all rounded-xl border border-border bg-card px-3 py-2 text-start text-xs text-muted"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {url}
      </p>
    </div>
  );
}
