import type { Metadata } from "next";
import { OrderForm } from "./order-form";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { getPriceBook, requireOnboarded } from "@/lib/data";

export const metadata: Metadata = { title: "New order" };
export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const { supabase, user, profile } = await requireOnboarded();
  const { locale } = await readPrefs();
  const t = getDict(locale);

  const [priceBook, { count }] = await Promise.all([
    getPriceBook(supabase, user.id),
    supabase
      .from("ai_credentials")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  return (
    <>
      <h1 className="text-[1.6rem] leading-tight">{t.newOrderTitle}</h1>
      <p className="mt-1 text-[14px] text-soft">{t.newOrderSub}</p>
      <div className="mt-5">
        <OrderForm
          profile={profile}
          priceBook={priceBook}
          aiReady={(count ?? 0) > 0}
        />
      </div>
    </>
  );
}
