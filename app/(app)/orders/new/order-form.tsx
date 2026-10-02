"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Field,
  inputClass,
  Line,
  Notice,
  numberClass,
} from "@/components/ui";
import { Seam, Star, Working } from "@/components/marks";
import { useT } from "@/components/prefs";
import { pkr, rs } from "@/lib/format";
import { calculatePricing, roundToQuotable } from "@/lib/pricing";
import { parseOrder } from "@/lib/parser";
import type { ParsedOrder } from "@/lib/parser/types";
import { PAYMENT_METHODS, type PriceBookEntry, type Profile } from "@/lib/types";
import { createOrder, type SaveState } from "../actions";

const SAMPLES = [
  "Assalam o alaikum baji, 3 green embroidered suits chahiye 23rd tak. 4200 each theek hain? delivery DHA Lahore. advance easypaisa kar doon?",
  "Baji 2 kg chocolate cake chahiye 18 tareekh ko, beti ki birthday hai. Gulberg Lahore. cash. 5500 ka ban jayega?",
  "do jorey silwane hain, sarhay char hazaar each, Model Town Lahore, juma tak",
];

type Fields = Record<string, string>;

const LOW = 0.7;

export function OrderForm({
  profile,
  priceBook,
  aiReady,
}: {
  profile: Profile;
  priceBook: PriceBookEntry[];
  aiReady: boolean;
}) {
  const t = useT();
  const [tab, setTab] = useState<"paste" | "manual">("paste");
  const [source, setSource] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [parsed, setParsed] = useState<ParsedOrder | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [sampleIndex, setSampleIndex] = useState(0);

  const [fields, setFields] = useState<Fields>({
    item: "",
    item_category: "",
    quantity: "1",
    unit: "",
    unit_price: "",
    customer_name: "",
    customer_phone: "",
    deadline_text: "",
    deadline_date: "",
    delivery_area: "",
    city: "",
    payment_method: "",
    notes: "",
    material_cost: "",
    labor_hours: "",
    hourly_labor_value: String(profile.default_hourly_rate || 250),
    packaging_cost: "",
    delivery_cost: "",
    other_cost: "",
    desired_profit_percent: String(profile.default_profit_percent || 25),
  });

  const [state, action, saving] = useActionState<SaveState, FormData>(
    createOrder,
    undefined,
  );

  const set = (key: string) => (value: string) =>
    setFields((f) => ({ ...f, [key]: value }));

  /** Applies a parse result without wiping anything already typed. */
  function apply(result: ParsedOrder) {
    setParsed(result);
    setFields((f) => ({
      ...f,
      item: result.item?.value ?? f.item,
      quantity: result.quantity ? String(result.quantity.value) : f.quantity,
      unit: result.unit?.value ?? f.unit,
      unit_price: result.unitPrice ? String(result.unitPrice.value) : f.unit_price,
      customer_name: result.customerName?.value ?? f.customer_name,
      deadline_text: result.deadlineText?.value ?? f.deadline_text,
      deadline_date: result.deadlineDate?.value ?? f.deadline_date,
      delivery_area: result.deliveryArea?.value ?? f.delivery_area,
      city: result.city?.value ?? f.city,
      payment_method: result.paymentMethod?.value ?? f.payment_method,
      notes: result.notes?.value ?? f.notes,
    }));
    setReviewing(true);
  }

  /** The built in parser runs in the browser, so this is instant and local. */
  function readLocally() {
    if (source.trim().length < 2) return;
    apply(parseOrder(source));
    setAiNote(null);
  }

  async function readWithAi() {
    if (source.trim().length < 2) return;
    setAiBusy(true);
    setAiNote(null);
    const local = parseOrder(source);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: source, useAi: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.data) {
        apply(local);
        setAiNote(json.error ?? t.aiFailed);
      } else {
        apply(json.data as ParsedOrder);
        if (json.warning) setAiNote(json.warning);
      }
    } catch {
      apply(local);
      setAiNote(t.aiFailed);
    } finally {
      setAiBusy(false);
    }
  }

  function applyPriceBook(entry: PriceBookEntry) {
    setFields((f) => ({
      ...f,
      item: f.item || entry.label,
      item_category: entry.category ?? f.item_category,
      unit: entry.unit ?? f.unit,
      material_cost: String(entry.material_cost),
      labor_hours: String(entry.labor_hours),
      packaging_cost: String(entry.packaging_cost),
      unit_price: f.unit_price || String(entry.last_price),
    }));
    setReviewing(true);
  }

  const n = (k: string) => parseFloat(fields[k]) || 0;
  const p = useMemo(
    () =>
      calculatePricing({
        quantity: n("quantity") || 1,
        unit_price: n("unit_price"),
        material_cost: n("material_cost"),
        labor_hours: n("labor_hours"),
        hourly_labor_value: n("hourly_labor_value"),
        packaging_cost: n("packaging_cost"),
        delivery_cost: n("delivery_cost"),
        other_cost: n("other_cost"),
        desired_profit_percent: n("desired_profit_percent"),
        amount_paid: 0,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fields],
  );

  const hasCosts = p.totalCost > 0;
  const show = tab === "manual" || reviewing;

  // Matching price book suggestions for whatever she has typed so far.
  const suggestions = useMemo(() => {
    const q = fields.item.trim().toLowerCase();
    if (!q || q.length < 2) return priceBook.slice(0, 3);
    return priceBook
      .filter((e) => e.label.toLowerCase().includes(q.slice(0, 6)))
      .slice(0, 3);
  }, [fields.item, priceBook]);

  useEffect(() => {
    if (tab === "manual") setReviewing(true);
  }, [tab]);

  const flag = (ok: boolean | undefined) => (ok ? undefined : t.lowConfidence);
  const conf = (f: { confidence: number } | null | undefined) =>
    f ? f.confidence >= LOW : undefined;

  return (
    <form action={action} className="flex flex-col gap-5 pb-32">
      <input type="hidden" name="source_text" value={source} />
      <input type="hidden" name="parse_engine" value={parsed?.engine ?? "manual"} />
      <input type="hidden" name="deadline_date" value={fields.deadline_date} />
      <input type="hidden" name="city" value={fields.city} />
      <input type="hidden" name="item_category" value={fields.item_category} />
      <input type="hidden" name="unit" value={fields.unit} />

      <div className="flex rounded-xl border border-rule bg-raised p-1 text-[13.5px] font-medium">
        {(
          [
            ["paste", t.tabPaste],
            ["manual", t.tabManual],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`flex-1 rounded-lg px-3 py-2 transition-colors ${
              tab === key ? "bg-green text-white" : "text-soft hover:bg-green-wash"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "paste" ? (
        <Card className="flex flex-col gap-3 p-4">
          <Field label={t.messageLabel} hint={t.messageHint}>
            <textarea
              value={source}
              onChange={(e) => setSource(e.target.value)}
              rows={5}
              dir="auto"
              maxLength={4000}
              className={`${inputClass} latin resize-y leading-relaxed`}
              placeholder={t.messagePlaceholder}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={readLocally} disabled={aiBusy}>
              {t.readIt}
            </Button>
            {aiReady ? (
              <Button
                type="button"
                variant="outline"
                onClick={readWithAi}
                disabled={aiBusy}
              >
                {aiBusy ? t.reading : t.setAi}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setSource(SAMPLES[sampleIndex]);
                setSampleIndex((i) => (i + 1) % SAMPLES.length);
              }}
            >
              {t.useSample}
            </Button>
          </div>

          {aiBusy ? <Working label={t.reading} /> : null}
          {aiNote ? <Notice tone="warn">{aiNote}</Notice> : null}

          {parsed ? (
            <p className="flex items-center gap-2 text-[12px] text-faint">
              <Star size={10} className="text-green-edge" />
              {parsed.engine.includes("ai") ? t.readByAi : t.readBy}
            </p>
          ) : null}

          {!show ? (
            <button
              type="button"
              onClick={() => setReviewing(true)}
              className="self-start text-[13px] font-medium text-green underline underline-offset-4"
            >
              {t.skipToForm}
            </button>
          ) : null}
        </Card>
      ) : null}

      {show ? (
        <>
          {suggestions.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[12px] text-faint">{t.calcFromBook}</span>
              {suggestions.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => applyPriceBook(e)}
                  className="rounded-full border border-rule bg-raised px-2.5 py-1 text-[12px] font-medium text-soft transition-colors hover:border-green-edge hover:bg-green-wash hover:text-green"
                >
                  {e.label}
                </button>
              ))}
            </div>
          ) : null}

          <Card className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[16px]">{t.theOrder}</h2>
              {parsed ? (
                <span className="text-[11.5px] text-faint">{t.checkThese}</span>
              ) : null}
            </div>

            <Field label={t.fItem} flag={parsed ? flag(conf(parsed.item)) : undefined}>
              <input
                name="item"
                required
                dir="auto"
                maxLength={160}
                value={fields.item}
                onChange={(e) => set("item")(e.target.value)}
                className={inputClass}
                placeholder={t.fItemPlaceholder}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label={t.fQuantity}
                flag={parsed ? flag(conf(parsed.quantity)) : undefined}
              >
                <input
                  name="quantity"
                  type="number"
                  min="0.01"
                  step="any"
                  inputMode="decimal"
                  required
                  value={fields.quantity}
                  onChange={(e) => set("quantity")(e.target.value)}
                  className={numberClass}
                />
              </Field>
              <Field
                label={t.fUnitPrice}
                hint="PKR"
                flag={parsed ? flag(conf(parsed.unitPrice)) : undefined}
              >
                <input
                  name="unit_price"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.unit_price}
                  onChange={(e) => set("unit_price")(e.target.value)}
                  className={numberClass}
                  placeholder="4200"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.fCustomer}>
                <input
                  name="customer_name"
                  dir="auto"
                  maxLength={120}
                  value={fields.customer_name}
                  onChange={(e) => set("customer_name")(e.target.value)}
                  className={inputClass}
                  placeholder={t.fCustomerPlaceholder}
                />
              </Field>
              <Field label={t.fDeadline}>
                <input
                  name="deadline_text"
                  dir="auto"
                  maxLength={80}
                  value={fields.deadline_text}
                  onChange={(e) => set("deadline_text")(e.target.value)}
                  className={inputClass}
                  placeholder={t.fDeadlinePlaceholder}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.fArea}>
                <input
                  name="delivery_area"
                  dir="auto"
                  maxLength={160}
                  value={fields.delivery_area}
                  onChange={(e) => set("delivery_area")(e.target.value)}
                  className={inputClass}
                  placeholder={t.fAreaPlaceholder}
                />
              </Field>
              <Field label={t.fPayment}>
                <select
                  name="payment_method"
                  value={fields.payment_method}
                  onChange={(e) => set("payment_method")(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t.fPaymentSelect}</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={t.fNotes} hint={t.optional}>
              <input
                name="notes"
                dir="auto"
                maxLength={2000}
                value={fields.notes}
                onChange={(e) => set("notes")(e.target.value)}
                className={inputClass}
                placeholder={t.fNotesPlaceholder}
              />
            </Field>
          </Card>

          <Card className="flex flex-col gap-4 p-4">
            <div>
              <h2 className="text-[16px]">{t.costTitle}</h2>
              <p className="mt-1 text-[13.5px] text-marigold">{t.costSub}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.fMaterial} hint="PKR">
                <input
                  name="material_cost"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.material_cost}
                  onChange={(e) => set("material_cost")(e.target.value)}
                  className={numberClass}
                  placeholder="2200"
                />
              </Field>
              <Field label={t.fPackaging} hint="PKR">
                <input
                  name="packaging_cost"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.packaging_cost}
                  onChange={(e) => set("packaging_cost")(e.target.value)}
                  className={numberClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.fHours}>
                <input
                  name="labor_hours"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.labor_hours}
                  onChange={(e) => set("labor_hours")(e.target.value)}
                  className={numberClass}
                  placeholder="6"
                />
              </Field>
              <Field label={t.fRate} hint="PKR / hr">
                <input
                  name="hourly_labor_value"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.hourly_labor_value}
                  onChange={(e) => set("hourly_labor_value")(e.target.value)}
                  className={numberClass}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.fDelivery} hint="PKR">
                <input
                  name="delivery_cost"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.delivery_cost}
                  onChange={(e) => set("delivery_cost")(e.target.value)}
                  className={numberClass}
                />
              </Field>
              <Field label={t.fOther} hint="PKR">
                <input
                  name="other_cost"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.other_cost}
                  onChange={(e) => set("other_cost")(e.target.value)}
                  className={numberClass}
                />
              </Field>
            </div>

            <Field label={t.fProfit} hint={t.fProfitHint}>
              <input
                name="desired_profit_percent"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={fields.desired_profit_percent}
                onChange={(e) => set("desired_profit_percent")(e.target.value)}
                className={numberClass}
              />
            </Field>

            {hasCosts ? (
              <div className="rounded-2xl bg-sunk p-4">
                <dl className="divide-y divide-rule/70">
                  <Line label={t.calcCostPerUnit} value={rs(p.costPerUnit)} />
                  <Line label={t.calcYourTime} value={rs(p.laborValuePerUnit)} />
                  <Line label={t.calcTotalCost} value={rs(p.totalCost)} />
                  <Line
                    label={t.calcBreakEven}
                    value={rs(p.breakEvenPerUnit)}
                    strong
                  />
                </dl>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-green-edge bg-raised p-3">
                  <div>
                    <div className="text-[11.5px] text-soft">{t.calcSuggested}</div>
                    <div className="ledger text-[20px] font-semibold text-green">
                      {rs(roundToQuotable(p.suggestedPricePerUnit))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      set("unit_price")(
                        String(roundToQuotable(p.suggestedPricePerUnit)),
                      )
                    }
                  >
                    {t.calcUseThis}
                  </Button>
                </div>

                {p.chosenPricePerUnit > 0 ? (
                  p.belowBreakEven ? (
                    <Notice tone="bad" className="mt-3">
                      <strong className="font-semibold">
                        {t.calcLoss} {rs(Math.abs(p.profit))}.
                      </strong>{" "}
                      {t.calcLossSub}{" "}
                      <span className="ledger">{rs(p.breakEvenPerUnit)}</span>.
                    </Notice>
                  ) : (
                    <div className="mt-3 flex items-end justify-between gap-3 rounded-xl bg-raised p-3">
                      <div>
                        <div className="text-[11.5px] text-soft">{t.calcProfit}</div>
                        <div className="ledger text-[24px] font-semibold text-green">
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
                  )
                ) : null}
              </div>
            ) : (
              <Notice tone="info">{t.calcEmpty}</Notice>
            )}

            <Seam />

            <label className="flex items-center gap-2.5 text-[13.5px] text-soft">
              <input
                type="checkbox"
                name="save_to_pricebook"
                className="h-4 w-4 rounded border-rule accent-[var(--green)]"
              />
              {t.priceBookAdd}
            </label>
          </Card>

          {state?.error ? <Notice tone="bad">{state.error}</Notice> : null}
        </>
      ) : null}

      {show ? (
        <div
          className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-raised/95 p-4 backdrop-blur-sm md:bottom-0"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
            <div className="hidden flex-1 sm:block">
              <div className="text-[11.5px] text-soft">{t.total}</div>
              <div className="ledger text-[17px] font-semibold">{rs(p.revenue)}</div>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="flex-1 sm:flex-none"
            >
              {saving ? t.savingOrder : t.saveOrder}
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
