import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Line, Notice, Sheet, StatusPill } from "@/components/ui";
import { Seam } from "@/components/marks";
import { ShareCard } from "@/components/share-card";
import {
  DangerZone,
  PaymentPanel,
  StatusControls,
} from "./controls";
import { longDate, pkr, rs } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { calculatePricing } from "@/lib/pricing";
import { getSiteUrl } from "@/lib/site-url";
import { requireOnboarded } from "@/lib/data";
import { statusLabel, type Order } from "@/lib/types";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, user, profile } = await requireOnboarded();
  const { locale } = await readPrefs();
  const t = getDict(locale);

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) notFound();
  const order = data as Order;
  const p = calculatePricing(order);

  const site = await getSiteUrl();
  const shareUrl = `${site}/o/${order.public_token}`;
  const linkLive =
    !order.share_expires_at || new Date(order.share_expires_at) > new Date();

  const waText = [
    `${t.pubFrom} ${profile.business_name ?? profile.display_name ?? ""}`.trim(),
    `${order.item}${order.quantity > 1 ? ` x${order.quantity}` : ""} — ${rs(p.revenue)}`.replace(
      "—",
      "·",
    ),
    t.pubIntro,
  ].join("\n");

  const confirmed = Boolean(order.confirmed_at);

  return (
    <>
      {query?.new === "1" ? (
        <Notice tone="good" className="mb-4">
          {t.orderSaved}
        </Notice>
      ) : null}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[1.5rem] leading-tight">{order.item}</h1>
          <p className="mt-1 text-[13.5px] text-soft">
            {[order.customer_name, order.delivery_area]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <StatusPill status={order.status} label={statusLabel(order.status, t)} />
      </div>

      <div className="mt-4">
        <StatusControls orderId={order.id} status={order.status} />
      </div>

      {confirmed ? (
        <Card className="mt-5 border-green-edge bg-green-wash p-4">
          <p className="font-medium text-green-deep">{t.wasConfirmed}</p>
          <p className="mt-1 text-[13.5px] text-green-deep/80">
            {t.wasConfirmedOn} {longDate(order.confirmed_at)}
          </p>
        </Card>
      ) : order.status !== "cancelled" && linkLive ? (
        <Card stitched className="mt-5 p-4">
          <ShareCard
            url={shareUrl}
            whatsappText={waText}
            phone={order.customer_phone}
          />
        </Card>
      ) : !linkLive ? (
        <Notice tone="info" className="mt-5">
          {t.revokeLinkDone}
        </Notice>
      ) : null}

      <Sheet className="mt-5" title={t.theOrder}>
        <Card className="p-4">
          <dl className="divide-y divide-rule/70">
            <Line label={t.fQuantity} value={`${order.quantity}${order.unit ? ` ${order.unit}` : ""}`} />
            <Line label={t.fUnitPrice} value={rs(p.chosenPricePerUnit)} />
            <Line label={t.total} value={rs(p.revenue)} strong />
            <Line label={t.fDeadline} value={order.deadline_text || "·"} />
            <Line label={t.fPayment} value={order.payment_method || "·"} />
            {order.notes ? <Line label={t.fNotes} value={order.notes} /> : null}
          </dl>
          <Seam className="my-4" />
          <PaymentPanel
            orderId={order.id}
            total={p.revenue}
            paid={p.amountPaid}
          />
        </Card>
      </Sheet>

      <Sheet className="mt-5" title={t.theNumbers}>
        <Card className="p-4">
          <dl className="divide-y divide-rule/70">
            <Line label={t.calcCostPerUnit} value={rs(p.costPerUnit)} />
            <Line label={t.calcYourTime} value={rs(p.laborValuePerUnit)} />
            <Line label={t.calcTotalCost} value={rs(p.totalCost)} />
            <Line label={t.calcBreakEven} value={rs(p.breakEvenPerUnit)} />
          </dl>

          <div className="mt-4 flex items-end justify-between gap-3 rounded-xl bg-sunk p-3">
            <div>
              <div className="text-[11.5px] text-soft">{t.calcProfit}</div>
              <div
                className={`ledger text-[22px] font-semibold ${
                  p.profit >= 0 ? "text-green" : "text-terracotta"
                }`}
              >
                {rs(p.profit)}
              </div>
            </div>
            <div className="text-end text-[11.5px] text-soft">
              <div className="ledger">
                {pkr(p.marginPercent)}% {t.calcMargin}
              </div>
              {p.effectiveHourlyRate > 0 ? (
                <div className="mt-0.5">
                  <span className="ledger font-medium text-ink">
                    {rs(p.effectiveHourlyRate)}
                  </span>{" "}
                  {t.calcPerHour}
                </div>
              ) : null}
            </div>
          </div>
        </Card>
      </Sheet>

      {order.source_text ? (
        <Sheet className="mt-5" title={t.originalMessage}>
          <Card className="p-4">
            <p
              dir="auto"
              className="latin rounded-2xl rounded-ss-sm bg-[#dcf8c6] p-3.5 text-start text-[14.5px] leading-relaxed text-[#1d2521]"
            >
              {order.source_text}
            </p>
          </Card>
        </Sheet>
      ) : null}

      <div className="mt-8">
        <DangerZone orderId={order.id} canRevoke={!confirmed && linkLive} />
      </div>

      <p className="mt-6 text-center">
        <Link href="/orders" className="text-[13px] text-faint hover:text-green">
          {t.back}
        </Link>
      </p>
    </>
  );
}
