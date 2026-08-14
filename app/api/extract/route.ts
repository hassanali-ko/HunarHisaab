import { NextResponse } from "next/server";
import type { ExtractedOrder } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

// Newest first. If a model is unavailable the route falls through to the next.
const MODELS = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    customer_name: { type: "STRING", nullable: true },
    item: { type: "STRING", nullable: true },
    quantity: { type: "INTEGER", nullable: true },
    offered_price: { type: "NUMBER", nullable: true },
    deadline_text: { type: "STRING", nullable: true },
    delivery_area: { type: "STRING", nullable: true },
    payment_method: { type: "STRING", nullable: true },
    notes: { type: "STRING", nullable: true },
  },
  required: [
    "customer_name",
    "item",
    "quantity",
    "offered_price",
    "deadline_text",
    "delivery_area",
    "payment_method",
    "notes",
  ],
} as const;

const SYSTEM_PROMPT = `You extract order details from informal messages sent to home-based sellers in Pakistan.
Messages are usually WhatsApp text in Roman Urdu, Urdu script, English, or a mix.

Rules:
- Return null for anything not clearly stated. Never guess.
- item: a short product/service name in English, e.g. "Embroidered suit (green)", "Chocolate cake 2kg", "Bridal mehndi".
- quantity: integer count of units. Default to 1 only when the message clearly describes a single item.
- offered_price: the PRICE PER UNIT in PKR that the customer proposed. If the message gives only a total for several units, divide it by the quantity. Digits only, no currency symbol. Treat "4200 each", "4200 ka", "42 sau" as 4200.
- deadline_text: copy the deadline exactly as written ("23rd", "18 tareekh", "Friday", "agle hafte"). Do not convert it to a calendar date.
- delivery_area: area and city if present, e.g. "DHA, Lahore".
- payment_method: exactly one of "Cash", "Easypaisa", "JazzCash", "Bank transfer", or null.
- customer_name: only if the sender names themselves. A greeting like "baji" is not a name.
- notes: any other useful detail (colour, design, advance payment, occasion) in one short line. Otherwise null.`;

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return badRequest(
      "Extraction abhi available nahi hai. Fields khud bhar lein, sab kuch waise hi kaam karega.",
      503,
    );

  let text: string;
  try {
    ({ text } = await request.json());
  } catch {
    return badRequest("Invalid request body.");
  }

  if (typeof text !== "string" || text.trim().length < 4)
    return badRequest("Pehle WhatsApp message paste karein.");

  const body = {
    systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts: [{ text: text.slice(0, 4000) }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  let lastError = "Gemini se jawab nahi mila.";

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20_000),
        },
      );

      if (!res.ok) {
        lastError = `Gemini error ${res.status}`;
        continue;
      }

      const json = await res.json();
      const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof raw !== "string") {
        lastError = "Gemini ne khali jawab diya.";
        continue;
      }

      const parsed = JSON.parse(raw) as ExtractedOrder;
      return NextResponse.json({ data: normalise(parsed), model });
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Gemini request failed.";
    }
  }

  return NextResponse.json({ error: lastError }, { status: 502 });
}

const ALLOWED_PAYMENTS = ["Cash", "Easypaisa", "JazzCash", "Bank transfer"];

function normalise(raw: ExtractedOrder): ExtractedOrder {
  const str = (v: unknown) => {
    const s = typeof v === "string" ? v.trim() : "";
    return s.length > 0 ? s : null;
  };
  const positive = (v: unknown) => {
    const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const payment = str(raw.payment_method);

  return {
    customer_name: str(raw.customer_name),
    item: str(raw.item),
    quantity: positive(raw.quantity) ? Math.round(positive(raw.quantity)!) : null,
    offered_price: positive(raw.offered_price),
    deadline_text: str(raw.deadline_text),
    delivery_area: str(raw.delivery_area),
    payment_method:
      payment &&
      ALLOWED_PAYMENTS.find((p) => p.toLowerCase() === payment.toLowerCase())
        ? ALLOWED_PAYMENTS.find(
            (p) => p.toLowerCase() === payment.toLowerCase(),
          )!
        : null,
    notes: str(raw.notes),
  };
}
