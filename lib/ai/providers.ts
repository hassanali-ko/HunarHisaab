import "server-only";

import type { ParsedOrder } from "@/lib/parser/types";

/**
 * Optional AI assist.
 *
 * The built in parser handles the common shapes on its own. A provider is
 * only reached for the leftovers, and only when someone has deliberately
 * added their own key. Nothing here is required for the product to work.
 */

export type ProviderId = "gemini" | "openai" | "anthropic";

export type ProviderInfo = {
  id: ProviderId;
  label: string;
  /** Where to get a key, shown in settings. */
  keyUrl: string;
  /** Shape of a valid key, used for a cheap sanity check before saving. */
  keyPattern: RegExp;
  defaultModel: string;
  /** Models worth offering, newest first. */
  models: string[];
};

export const PROVIDERS: Record<ProviderId, ProviderInfo> = {
  gemini: {
    id: "gemini",
    label: "Google Gemini",
    keyUrl: "https://aistudio.google.com/apikey",
    keyPattern: /^(AIza[\w-]{30,}|AQ\.[\w-]{20,})$/,
    defaultModel: "gemini-flash-latest",
    models: ["gemini-flash-latest", "gemini-3-flash-preview", "gemini-2.5-flash"],
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    keyUrl: "https://platform.openai.com/api-keys",
    keyPattern: /^sk-[\w-]{20,}$/,
    defaultModel: "gpt-5-mini",
    models: ["gpt-5-mini", "gpt-5", "gpt-4.1-mini"],
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic Claude",
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyPattern: /^sk-ant-[\w-]{20,}$/,
    defaultModel: "claude-haiku-4-5-20251001",
    models: ["claude-haiku-4-5-20251001", "claude-sonnet-5-5"],
  },
};

export const isProviderId = (v: unknown): v is ProviderId =>
  typeof v === "string" && v in PROVIDERS;

const SYSTEM = `You pull order details out of informal messages sent to home based sellers in Pakistan.
Messages arrive in Roman Urdu, Urdu script, English, or a mix.

Rules:
- Return null for anything not clearly stated. Never guess.
- item: short product or service name in English, for example "Embroidered suit (green)".
- quantity: whole number of units.
- unit_price: price PER UNIT in PKR, digits only. If the message gives a total for several units, divide by the quantity.
- deadline_text: copy the deadline exactly as written. Do not convert it to a calendar date.
- delivery_area: area and city, for example "DHA, Lahore".
- payment_method: exactly one of Cash, Easypaisa, JazzCash, NayaPay, SadaPay, Raast, Bank transfer, or null.
- customer_name: only when the sender names themselves. A greeting such as "baji" is not a name.
- notes: one short line for any other useful detail such as colour, occasion, or an advance offer.`;

const SHAPE = {
  customer_name: "string or null",
  item: "string or null",
  quantity: "integer or null",
  unit_price: "number or null",
  deadline_text: "string or null",
  delivery_area: "string or null",
  payment_method: "string or null",
  notes: "string or null",
};

export type AiFields = {
  customer_name?: string | null;
  item?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  deadline_text?: string | null;
  delivery_area?: string | null;
  payment_method?: string | null;
  notes?: string | null;
};

const TIMEOUT_MS = 20_000;

function userPrompt(message: string, draft: ParsedOrder): string {
  const known = {
    item: draft.item?.value ?? null,
    quantity: draft.quantity?.value ?? null,
    unit_price: draft.unitPrice?.value ?? null,
    deadline_text: draft.deadlineText?.value ?? null,
    delivery_area: draft.deliveryArea?.value ?? null,
    payment_method: draft.paymentMethod?.value ?? null,
  };
  return [
    `Message:\n${message.slice(0, 4000)}`,
    ``,
    `A rule based pass already found this. Correct it only where it is clearly wrong, and fill what is null:`,
    JSON.stringify(known, null, 2),
    ``,
    `Reply with JSON only, matching this shape:`,
    JSON.stringify(SHAPE, null, 2),
  ].join("\n");
}

function extractJson(text: string): AiFields | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(body.slice(start, end + 1)) as AiFields;
  } catch {
    return null;
  }
}

async function callGemini(
  key: string,
  model: string,
  message: string,
  draft: ParsedOrder,
): Promise<AiFields | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userPrompt(message, draft) }] }],
        generationConfig: { temperature: 0, responseMimeType: "application/json" },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`Gemini returned ${res.status}`);
  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === "string" ? extractJson(text) : null;
}

async function callOpenAI(
  key: string,
  model: string,
  message: string,
  draft: ParsedOrder,
): Promise<AiFields | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt(message, draft) },
      ],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`OpenAI returned ${res.status}`);
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  return typeof text === "string" ? extractJson(text) : null;
}

async function callAnthropic(
  key: string,
  model: string,
  message: string,
  draft: ParsedOrder,
): Promise<AiFields | null> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0,
      system: SYSTEM,
      messages: [{ role: "user", content: userPrompt(message, draft) }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`Anthropic returned ${res.status}`);
  const json = await res.json();
  const text = json?.content?.[0]?.text;
  return typeof text === "string" ? extractJson(text) : null;
}

export async function askProvider(
  provider: ProviderId,
  key: string,
  model: string,
  message: string,
  draft: ParsedOrder,
): Promise<AiFields | null> {
  switch (provider) {
    case "gemini":
      return callGemini(key, model, message, draft);
    case "openai":
      return callOpenAI(key, model, message, draft);
    case "anthropic":
      return callAnthropic(key, model, message, draft);
  }
}
