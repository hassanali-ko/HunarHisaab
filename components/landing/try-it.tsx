"use client";

import { useMemo, useRef, useState } from "react";
import { parseOrder } from "@/lib/parser";
import type { ParsedOrder, Span } from "@/lib/parser/types";
import { rs } from "@/lib/format";
import { useT } from "@/components/prefs";
import { Star } from "@/components/marks";

/**
 * The live demo.
 *
 * This is the real parser, running in the visitor's own browser. No account,
 * no key, no request leaves the page. That is the whole argument of the
 * product, so it felt wrong to make anyone take it on trust.
 */

const SAMPLES = [
  "Assalam o alaikum baji, 3 green embroidered suits chahiye 23rd tak. 4200 each theek hain? delivery DHA Lahore. advance easypaisa kar doon?",
  "Baji 2 kg chocolate cake chahiye 18 tareekh ko, beti ki birthday hai. Gulberg Lahore. cash. 5500 ka ban jayega?",
  "do jorey silwane hain, sarhay char hazaar each, Model Town Lahore, juma tak",
  "ek dozen samosa kal tak, 50 rupay per piece, Johar Town, easypaisa",
  "تین سوٹ چاہیے، لاہور، ایزی پیسہ، ۴۲۰۰ روپے",
];

type Highlight = { span: Span; key: string };

/** Chips in the results panel carry colour and text. */
const FIELD_CHIP: Record<string, string> = {
  item: "bg-green-wash text-green-deep",
  quantity: "bg-indigo-wash text-indigo",
  price: "bg-marigold-wash text-marigold-ink",
  due: "bg-terracotta-wash text-terracotta",
  area: "bg-green-wash text-green-deep",
  pay: "bg-marigold-wash text-marigold-ink",
};

/**
 * The layer behind the textarea paints background only. Giving these a text
 * colour would override the transparent layer and print the message twice.
 */
const FIELD_BG: Record<string, string> = {
  item: "bg-green-wash",
  quantity: "bg-indigo-wash",
  price: "bg-marigold-wash",
  due: "bg-terracotta-wash",
  area: "bg-green-wash",
  pay: "bg-marigold-wash",
};

function highlight(text: string, hits: Highlight[]) {
  const valid = hits
    .filter((h) => h.span && h.span.end > h.span.start)
    .sort((a, b) => a.span.start - b.span.start);

  const out: React.ReactNode[] = [];
  let cursor = 0;

  for (const [i, h] of valid.entries()) {
    if (h.span.start < cursor) continue;
    if (h.span.start > cursor) {
      out.push(<span key={`t${i}`}>{text.slice(cursor, h.span.start)}</span>);
    }
    out.push(
      <mark
        key={`m${i}`}
        className={`rounded text-transparent ${FIELD_BG[h.key] ?? "bg-sunk"}`}
      >
        {text.slice(h.span.start, h.span.end)}
      </mark>,
    );
    cursor = h.span.end;
  }
  if (cursor < text.length) out.push(<span key="tail">{text.slice(cursor)}</span>);
  return out;
}

export function TryIt() {
  const t = useT();
  const [text, setText] = useState(SAMPLES[0]);
  const [sampleIndex, setSampleIndex] = useState(1);
  const mirror = useRef<HTMLDivElement>(null);

  const parsed: ParsedOrder = useMemo(() => parseOrder(text), [text]);

  const rows: [string, string | null, string][] = [
    [t.tryFieldItem, parsed.item?.value ?? null, "item"],
    [
      t.tryFieldQty,
      parsed.quantity
        ? `${parsed.quantity.value}${parsed.unit ? ` ${parsed.unit.value}` : ""}`
        : null,
      "quantity",
    ],
    [t.tryFieldPrice, parsed.unitPrice ? rs(parsed.unitPrice.value) : null, "price"],
    [t.tryFieldDue, parsed.deadlineText?.value ?? null, "due"],
    [t.tryFieldArea, parsed.deliveryArea?.value ?? null, "area"],
    [t.tryFieldPay, parsed.paymentMethod?.value ?? null, "pay"],
  ];

  const hits: Highlight[] = [
    parsed.item?.span && { span: parsed.item.span, key: "item" },
    parsed.quantity?.span && { span: parsed.quantity.span, key: "quantity" },
    parsed.unitPrice?.span && { span: parsed.unitPrice.span, key: "price" },
    parsed.deadlineText?.span && { span: parsed.deadlineText.span, key: "due" },
    parsed.deliveryArea?.span && { span: parsed.deliveryArea.span, key: "area" },
    parsed.paymentMethod?.span && { span: parsed.paymentMethod.span, key: "pay" },
  ].filter(Boolean) as Highlight[];

  const found = rows.filter(([, v]) => v).length;

  return (
    <div className="paper-card overflow-hidden">
      <div className="grid md:grid-cols-2">
        {/* the message */}
        <div className="border-b border-rule p-5 md:border-b-0 md:border-e">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-faint">
              {t.tryKicker}
            </span>
            <button
              type="button"
              onClick={() => {
                setText(SAMPLES[sampleIndex]);
                setSampleIndex((i) => (i + 1) % SAMPLES.length);
              }}
              className="rounded-full border border-rule px-2.5 py-1 text-[11.5px] font-medium text-soft transition-colors hover:bg-green-wash hover:text-green"
            >
              {t.trySample}
            </button>
          </div>

          <div className="relative">
            {/* The highlight layer sits exactly under the textarea, so the
                marks line up with the words the parser actually used. */}
            <div
              ref={mirror}
              aria-hidden="true"
              dir="auto"
              className="latin pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words rounded-xl border border-transparent p-3 text-[14.5px] leading-[1.65] text-transparent"
            >
              {highlight(text, hits)}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onScroll={(e) => {
                if (mirror.current) {
                  mirror.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              rows={5}
              dir="auto"
              spellCheck={false}
              aria-label={t.tryTitle}
              placeholder={t.tryPlaceholder}
              className="latin relative w-full resize-y rounded-xl border border-rule bg-transparent p-3 text-[14.5px] leading-[1.65] text-ink caret-green outline-none focus:border-green focus:ring-[3px] focus:ring-green-wash"
            />
          </div>

          <p className="mt-3 flex items-start gap-2 text-[12px] leading-relaxed text-faint">
            <Star size={11} className="mt-[3px] shrink-0 text-green-edge" />
            {t.tryFooter}
          </p>
        </div>

        {/* what it read */}
        <div className="bg-sunk/60 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.09em] text-faint">
              {t.appName}
            </span>
            <span className="ledger text-[11.5px] text-faint">{found}/6</span>
          </div>

          {found === 0 ? (
            <p className="py-8 text-center text-[13.5px] text-faint">
              {t.tryReadingNothing}
            </p>
          ) : (
            <dl className="space-y-0">
              {rows.map(([label, value, key]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-3 border-b border-rule/70 py-2 last:border-0"
                >
                  <dt className="text-[13px] text-soft">{label}</dt>
                  <dd
                    className={`ledger text-end text-[14px] font-medium ${
                      value ? "" : "text-faint/60"
                    }`}
                  >
                    {value ? (
                      <span className={`rounded px-1 ${FIELD_CHIP[key]}`}>{value}</span>
                    ) : (
                      "\u00b7"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
