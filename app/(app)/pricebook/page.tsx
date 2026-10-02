import type { Metadata } from "next";
import { Card, Line, Notice } from "@/components/ui";
import { rs } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { getPriceBook, requireOnboarded } from "@/lib/data";

export const metadata: Metadata = { title: "Price book" };
export const dynamic = "force-dynamic";

export default async function PriceBookPage() {
  const { supabase, user } = await requireOnboarded();
  const { locale } = await readPrefs();
  const t = getDict(locale);
  const entries = await getPriceBook(supabase, user.id);

  return (
    <>
      <h1 className="text-[1.6rem] leading-tight">{t.priceBookTitle}</h1>
      <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-soft">
        {t.priceBookSub}
      </p>

      {entries.length === 0 ? (
        <Notice tone="info" className="mt-5">
          {t.priceBookEmpty}
        </Notice>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {entries.map((e) => (
            <Card key={e.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-semibold">{e.label}</h2>
                  {e.category ? (
                    <p className="mt-0.5 text-[12px] text-faint">{e.category}</p>
                  ) : null}
                </div>
                <span className="ledger shrink-0 rounded-full bg-sunk px-2 py-0.5 text-[11px] text-soft">
                  {e.times_used} {t.priceBookTimes}
                </span>
              </div>

              <dl className="mt-3 divide-y divide-rule/70">
                <Line label={t.fMaterial} value={rs(e.material_cost)} />
                <Line label={t.fHours} value={String(e.labor_hours)} />
                {e.packaging_cost > 0 ? (
                  <Line label={t.fPackaging} value={rs(e.packaging_cost)} />
                ) : null}
                <Line label={t.priceBookLast} value={rs(e.last_price)} strong />
              </dl>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
