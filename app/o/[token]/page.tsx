import { notFound } from "next/navigation";
import { ConfirmPanel } from "./confirm-panel";
import { LangSwitcher } from "@/components/lang";
import { Card, Logo } from "@/components/ui";
import { pkrLabel } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/uuid";

export const dynamic = "force-dynamic";

type Row = {
  item: string;
  quantity: number;
  unit_price: number;
  deadline_text: string | null;
  delivery_area: string | null;
  payment_method: string | null;
  status: string;
  confirmed_at: string | null;
  profiles: { business_name: string | null; display_name: string | null } | null;
};

export default async function PublicOrderPage({
  params,
}: PageProps<"/o/[token]">) {
  const { token } = await params;
  if (!isUuid(token)) notFound();

  const t = getDict(await getLocale());

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    notFound();
  }

  // Only non-sensitive fields. No customer contact, no cost breakdown, no ids.
  const { data } = await admin
    .from("orders")
    .select(
      "item, quantity, unit_price, deadline_text, delivery_area, payment_method, status, confirmed_at, profiles(business_name, display_name)",
    )
    .eq("public_token", token)
    .maybeSingle<Row>();

  if (!data) notFound();

  const seller =
    data.profiles?.business_name || data.profiles?.display_name || t.sellerWord;
  const total = (Number(data.unit_price) || 0) * (Number(data.quantity) || 1);
  const alreadyConfirmed = Boolean(data.confirmed_at);

  return (
    <main className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-md items-center justify-between gap-3 px-5 py-5">
        <Logo />
        <LangSwitcher />
      </header>

      <div className="mx-auto w-full max-w-md px-5 pb-10">
        <p className="text-center text-sm text-muted">{t.pubFrom}</p>
        <h1 className="mt-1 text-center text-2xl font-semibold tracking-tight">
          {seller}
        </h1>

        <Card className="mt-5">
          <div className="border-b border-border pb-4">
            <div className="text-lg font-semibold" dir="auto">
              {data.item}
            </div>
            {data.quantity > 1 ? (
              <div className="mt-0.5 text-sm tabular-nums text-muted">
                {data.quantity} × {pkrLabel(Number(data.unit_price) || 0)}
              </div>
            ) : null}
          </div>

          <dl className="space-y-2.5 py-4 text-sm">
            {[
              [t.pubQuantity, String(data.quantity)],
              [t.pubDeliveryBy, data.deadline_text || "-"],
              [t.pubArea, data.delivery_area || "-"],
              [t.pubPayment, data.payment_method || "-"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="text-end font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-medium">{t.pubTotal}</span>
            <span className="text-2xl font-semibold tabular-nums text-primary">
              {pkrLabel(total)}
            </span>
          </div>
        </Card>

        <div className="mt-5">
          <ConfirmPanel token={token} alreadyConfirmed={alreadyConfirmed} />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          {t.pubFootnote}
        </p>
      </div>
    </main>
  );
}
