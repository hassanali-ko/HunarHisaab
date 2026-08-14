"use client";

import { useActionState, useMemo, useState } from "react";
import { Button, Card, Field, inputClass } from "@/components/ui";
import { useT } from "@/components/lang";
import { pkr, pkrLabel } from "@/lib/format";
import { calculatePricing, roundToNiceprice } from "@/lib/pricing";
import { SAMPLE_MESSAGES } from "@/lib/demo";
import { PAYMENT_METHODS, type ExtractedOrder } from "@/lib/types";
import { createOrder, type SaveState } from "../actions";

type Fields = {
  customer_name: string;
  item: string;
  quantity: string;
  unit_price: string;
  deadline_text: string;
  delivery_area: string;
  payment_method: string;
  notes: string;
  material_cost: string;
  labor_hours: string;
  hourly_labor_value: string;
  packaging_cost: string;
  delivery_cost: string;
  other_cost: string;
  desired_profit_percent: string;
};

const EMPTY: Fields = {
  customer_name: "",
  item: "",
  quantity: "1",
  unit_price: "",
  deadline_text: "",
  delivery_area: "",
  payment_method: "",
  notes: "",
  material_cost: "",
  labor_hours: "",
  hourly_labor_value: "200",
  packaging_cost: "",
  delivery_cost: "",
  other_cost: "",
  desired_profit_percent: "25",
};

export function OrderForm() {
  const t = useT();
  const [tab, setTab] = useState<"paste" | "manual">("paste");
  const [sourceText, setSourceText] = useState("");
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState(false);
  const [sampleIndex, setSampleIndex] = useState(0);

  const [state, formAction, saving] = useActionState<SaveState, FormData>(
    createOrder,
    undefined,
  );

  const set = (key: keyof Fields) => (value: string) =>
    setFields((f) => ({ ...f, [key]: value }));

  const pricing = useMemo(
    () =>
      calculatePricing({
        quantity: parseFloat(fields.quantity) || 1,
        material_cost: parseFloat(fields.material_cost) || 0,
        labor_hours: parseFloat(fields.labor_hours) || 0,
        hourly_labor_value: parseFloat(fields.hourly_labor_value) || 0,
        packaging_cost: parseFloat(fields.packaging_cost) || 0,
        delivery_cost: parseFloat(fields.delivery_cost) || 0,
        other_cost: parseFloat(fields.other_cost) || 0,
        desired_profit_percent: parseFloat(fields.desired_profit_percent) || 0,
        unit_price: parseFloat(fields.unit_price) || 0,
      }),
    [fields],
  );

  const hasCosts = pricing.totalCost > 0;

  async function runExtract() {
    if (sourceText.trim().length < 4) {
      setExtractError(t.messageHint);
      return;
    }
    setExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: sourceText }),
      });
      const json = await res.json();

      if (!res.ok) {
        setExtractError(json.error ?? t.fillManually);
        setExtracted(true);
        return;
      }

      const d = json.data as ExtractedOrder;
      setFields((f) => ({
        ...f,
        customer_name: d.customer_name ?? f.customer_name,
        item: d.item ?? f.item,
        quantity: d.quantity ? String(d.quantity) : f.quantity,
        unit_price: d.offered_price ? String(d.offered_price) : f.unit_price,
        deadline_text: d.deadline_text ?? f.deadline_text,
        delivery_area: d.delivery_area ?? f.delivery_area,
        payment_method: d.payment_method ?? f.payment_method,
        notes: d.notes ?? f.notes,
      }));
      setExtracted(true);
    } catch {
      setExtractError(t.fillManually);
      setExtracted(true);
    } finally {
      setExtracting(false);
    }
  }

  const showDetails = tab === "manual" || extracted;
  const numberInput = `${inputClass} tabular-nums`;

  return (
    <form action={formAction} className="flex flex-col gap-5 pb-28">
      <input type="hidden" name="source_text" value={sourceText} />

      <div className="flex rounded-xl border border-border bg-card p-1 text-sm font-medium">
        {(
          [
            ["paste", t.tabPaste],
            ["manual", t.tabManual],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex-1 rounded-lg px-3 py-2 transition-colors ${
              tab === value
                ? "bg-primary text-white"
                : "text-muted hover:bg-primary-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "paste" ? (
        <Card className="flex flex-col gap-3">
          <Field label={t.messageLabel} hint={t.messageHint}>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              rows={5}
              dir="auto"
              className={`${inputClass} resize-y leading-relaxed`}
              placeholder={t.messagePlaceholder}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={runExtract} disabled={extracting}>
              {extracting ? t.extracting : t.extractBtn}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setSourceText(SAMPLE_MESSAGES[sampleIndex]);
                setSampleIndex((i) => (i + 1) % SAMPLE_MESSAGES.length);
                setExtractError(null);
              }}
            >
              {t.sampleBtn}
            </Button>
          </div>

          {extractError ? (
            <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
              {extractError}
            </p>
          ) : null}

          {!showDetails ? (
            <button
              type="button"
              onClick={() => setExtracted(true)}
              className="self-start text-sm font-medium text-primary underline underline-offset-4"
            >
              {t.fillManually}
            </button>
          ) : null}
        </Card>
      ) : null}

      {showDetails ? (
        <>
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">{t.detailsTitle}</h2>
              {tab === "paste" ? (
                <span className="text-xs text-muted">{t.reviewHint}</span>
              ) : null}
            </div>

            <Field label={t.itemLabel}>
              <input
                name="item"
                required
                dir="auto"
                value={fields.item}
                onChange={(e) => set("item")(e.target.value)}
                className={inputClass}
                placeholder={t.itemPlaceholder}
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.qtyLabel}>
                <input
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={fields.quantity}
                  onChange={(e) => set("quantity")(e.target.value)}
                  className={numberInput}
                />
              </Field>
              <Field label={t.priceLabel} hint="PKR">
                <input
                  name="unit_price"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.unit_price}
                  onChange={(e) => set("unit_price")(e.target.value)}
                  className={numberInput}
                  placeholder="4200"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.customerLabel}>
                <input
                  name="customer_name"
                  dir="auto"
                  value={fields.customer_name}
                  onChange={(e) => set("customer_name")(e.target.value)}
                  className={inputClass}
                  placeholder="Ayesha"
                />
              </Field>
              <Field label={t.deadlineLabel}>
                <input
                  name="deadline_text"
                  dir="auto"
                  value={fields.deadline_text}
                  onChange={(e) => set("deadline_text")(e.target.value)}
                  className={inputClass}
                  placeholder="23rd"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.areaLabel}>
                <input
                  name="delivery_area"
                  dir="auto"
                  value={fields.delivery_area}
                  onChange={(e) => set("delivery_area")(e.target.value)}
                  className={inputClass}
                  placeholder="DHA, Lahore"
                />
              </Field>
              <Field label={t.paymentLabel}>
                <select
                  name="payment_method"
                  value={fields.payment_method}
                  onChange={(e) => set("payment_method")(e.target.value)}
                  className={inputClass}
                >
                  <option value="">{t.selectPlaceholder}</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label={t.notesLabel} hint={t.optional}>
              <input
                name="notes"
                dir="auto"
                value={fields.notes}
                onChange={(e) => set("notes")(e.target.value)}
                className={inputClass}
                placeholder={t.notesPlaceholder}
              />
            </Field>
          </Card>

          <Card className="flex flex-col gap-4">
            <div>
              <h2 className="font-semibold">{t.calcTitle}</h2>
              <p className="mt-1 text-sm text-accent">{t.timeIsCost}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.materialLabel} hint="PKR">
                <input
                  name="material_cost"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.material_cost}
                  onChange={(e) => set("material_cost")(e.target.value)}
                  className={numberInput}
                  placeholder="2200"
                />
              </Field>
              <Field label={t.packagingLabel} hint="PKR">
                <input
                  name="packaging_cost"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.packaging_cost}
                  onChange={(e) => set("packaging_cost")(e.target.value)}
                  className={numberInput}
                  placeholder="120"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.hoursLabel}>
                <input
                  name="labor_hours"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.labor_hours}
                  onChange={(e) => set("labor_hours")(e.target.value)}
                  className={numberInput}
                  placeholder="6"
                />
              </Field>
              <Field label={t.hourlyLabel} hint={t.hourlyHint}>
                <input
                  name="hourly_labor_value"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.hourly_labor_value}
                  onChange={(e) => set("hourly_labor_value")(e.target.value)}
                  className={numberInput}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t.deliveryLabel} hint="PKR">
                <input
                  name="delivery_cost"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.delivery_cost}
                  onChange={(e) => set("delivery_cost")(e.target.value)}
                  className={numberInput}
                  placeholder="350"
                />
              </Field>
              <Field label={t.otherLabel} hint="PKR">
                <input
                  name="other_cost"
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={fields.other_cost}
                  onChange={(e) => set("other_cost")(e.target.value)}
                  className={numberInput}
                />
              </Field>
            </div>

            <Field label={t.profitPctLabel} hint={t.profitPctHint}>
              <input
                name="desired_profit_percent"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={fields.desired_profit_percent}
                onChange={(e) => set("desired_profit_percent")(e.target.value)}
                className={numberInput}
              />
            </Field>

            {hasCosts ? (
              <div className="rounded-2xl bg-primary-soft/60 p-4">
                <dl className="space-y-2 text-sm">
                  {[
                    [t.costPerUnit, pkrLabel(pricing.costPerUnit)],
                    [t.timeValuePerUnit, pkrLabel(pricing.laborValuePerUnit)],
                    [t.totalCost, pkrLabel(pricing.totalCost)],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4">
                      <dt className="text-muted">{k}</dt>
                      <dd className="font-medium tabular-nums">{v}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 border-t border-primary/15 pt-2">
                    <dt className="text-muted">{t.breakEven}</dt>
                    <dd className="font-semibold tabular-nums">
                      {pkrLabel(pricing.breakEvenPerUnit)}
                    </dd>
                  </div>
                </dl>

                <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-card p-3">
                  <div>
                    <div className="text-xs text-muted">{t.suggestedPrice}</div>
                    <div className="text-xl font-semibold tabular-nums text-primary">
                      {pkrLabel(roundToNiceprice(pricing.suggestedPricePerUnit))}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      set("unit_price")(
                        String(roundToNiceprice(pricing.suggestedPricePerUnit)),
                      )
                    }
                  >
                    {t.applyPrice}
                  </Button>
                </div>

                {pricing.chosenPricePerUnit > 0 ? (
                  <div
                    className={`mt-3 rounded-xl p-3 ${
                      pricing.belowBreakEven ? "bg-accent-soft" : "bg-card"
                    }`}
                  >
                    {pricing.belowBreakEven ? (
                      <p className="text-sm font-medium text-accent">
                        {t.lossWarn} {t.lossBreakEven}:{" "}
                        <span className="tabular-nums">
                          {pkrLabel(pricing.breakEvenPerUnit)}
                        </span>
                      </p>
                    ) : (
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <div className="text-xs text-muted">
                            {t.orderProfit}
                          </div>
                          <div className="text-2xl font-semibold tabular-nums text-primary">
                            {pkrLabel(pricing.profit)}
                          </div>
                        </div>
                        <div className="text-end text-xs text-muted">
                          <div className="tabular-nums">
                            {pkr(pricing.marginPercent)}% {t.marginWord}
                          </div>
                          <div className="mt-0.5">
                            <span className="tabular-nums">
                              {pkrLabel(pricing.profitPerUnit)}
                            </span>{" "}
                            {t.perUnit}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="rounded-xl bg-primary-soft/40 px-3 py-2.5 text-sm text-muted">
                {t.calcEmptyHint}
              </p>
            )}
          </Card>

          {state?.error ? (
            <p className="rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
              {state.error}
            </p>
          ) : null}
        </>
      ) : null}

      {showDetails ? (
        <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
          <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
            <div className="hidden flex-1 sm:block">
              <div className="text-xs text-muted">{t.totalEarning}</div>
              <div className="text-lg font-semibold tabular-nums">
                {pkrLabel(pricing.revenue)}
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={saving}
              className="flex-1 sm:flex-none"
            >
              {saving ? t.saving : t.saveOrder}
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
