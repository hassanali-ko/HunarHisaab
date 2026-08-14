import Link from "next/link";
import { OrderForm } from "./order-form";
import { LangSwitcher } from "@/components/lang";
import { Logo } from "@/components/ui";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const t = getDict(await getLocale());

  return (
    <main className="flex-1">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/dashboard">
            <Logo compact />
          </Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link href="/dashboard" className="text-sm font-medium text-muted">
              {t.cancel}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 py-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t.newOrderTitle}
        </h1>
        <p className="mt-1 text-sm text-muted">{t.newOrderSub}</p>

        <div className="mt-5">
          <OrderForm />
        </div>
      </div>
    </main>
  );
}
