import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderForm } from "../../new/order-form";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { getPriceBook, requireOnboarded } from "@/lib/data";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Edit order" };
export const dynamic = "force-dynamic";

export default async function EditOrderPage({
  params,
}: PageProps<"/orders/[id]/edit">) {
  const { id } = await params;
  const { supabase, user, profile } = await requireOnboarded();
  const { locale } = await readPrefs();
  const t = getDict(locale);

  const [{ data }, priceBook, { count }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).eq("user_id", user.id).maybeSingle(),
    getPriceBook(supabase, user.id),
    supabase
      .from("ai_credentials")
      .select("user_id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  if (!data) notFound();
  const order = data as Order;

  return (
    <>
      <h1 className="text-[1.6rem] leading-tight">{t.editOrderTitle}</h1>
      <p className="mt-1 text-[14px] text-soft">
        <Link href={`/orders/${order.id}`} className="hover:text-green">
          {order.item}
        </Link>
      </p>
      <div className="mt-5">
        <OrderForm
          profile={profile}
          priceBook={priceBook}
          aiReady={(count ?? 0) > 0}
          initial={order}
        />
      </div>
    </>
  );
}
