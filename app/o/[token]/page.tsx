import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ConfirmPanel } from "./confirm-panel";
import { Card, Line } from "@/components/ui";
import { Logo, Seam } from "@/components/marks";
import { LangSwitcher } from "@/components/prefs";
import { rs } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/security/validate";
import type { PublicOrder } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Confirm your order",
  // A confirmation link is personal. It should not end up in an index.
  robots: { index: false, follow: false },
};

export default async function PublicConfirmPage({
  params,
}: PageProps<"/o/[token]">) {
  const { token } = await params;
  if (!uuid.safeParse(token).success) notFound();

  const { locale } = await readPrefs();
  const t = getDict(locale);

  // The viewer's own session, if any, so the page knows when the seller is
  // looking at her own link. Nobody gains any extra access by it.
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_order", {
    p_token: token,
  });
  if (error) notFound();

  const order = (Array.isArray(data) ? data[0] : data) as PublicOrder | undefined;
  if (!order) notFound();

  const confirmed = Boolean(order.confirmed_at);

  return (
    <>
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-5">
        <Logo />
        <LangSwitcher />
      </header>

      <main id="main" className="mx-auto w-full max-w-md flex-1 px-5 pb-12">
        <p className="text-center text-[13px] text-soft">{t.pubFrom}</p>
        <h1 className="mt-1 text-center text-[1.6rem] leading-tight">
          {order.business_name}
        </h1>
        <p className="mt-2 text-center text-[13.5px] text-soft">{t.pubIntro}</p>

        <Card stitched className="mt-5 p-5">
          <div className="pb-3">
            <div className="text-[17px] font-semibold" dir="auto">
              {order.item}
            </div>
            {Number(order.quantity) > 1 ? (
              <div className="ledger mt-0.5 text-[13.5px] text-soft">
                {order.quantity}
                {order.unit ? ` ${order.unit}` : ""} &times;{" "}
                {rs(Number(order.unit_price))}
              </div>
            ) : null}
          </div>

          <Seam />

          <dl className="divide-y divide-rule/70 py-2">
            <Line label={t.pubHowMany} value={String(order.quantity)} />
            <Line label={t.pubDueBy} value={order.deadline_text || "·"} />
            <Line label={t.pubDeliverTo} value={order.delivery_area || "·"} />
            <Line label={t.pubPayment} value={order.payment_method || "·"} />
          </dl>

          <div className="mt-2 flex items-center justify-between border-t border-rule pt-4">
            <span className="text-[15px] font-medium">{t.pubTotal}</span>
            <span className="ledger text-[26px] font-semibold text-green">
              {rs(Number(order.total))}
            </span>
          </div>
        </Card>

        <div className="mt-5">
          <ConfirmPanel
            token={token}
            alreadyConfirmed={confirmed}
            expired={Boolean(order.expired)}
            isOwner={Boolean(order.is_owner)}
          />
        </div>

        <p className="mt-6 text-center text-[12px] leading-relaxed text-faint">
          {t.pubFootnote}
        </p>
        <p className="mt-4 text-center text-[11.5px] text-faint/80">
          {t.pubPoweredBy}
        </p>
      </main>
    </>
  );
}
