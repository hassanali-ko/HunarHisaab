/**
 * The built in order parser.
 *
 * Runs entirely on the server with no network call and no API key. For the
 * messages this product actually sees, a tuned set of rules beats a general
 * model on the things that matter here: it is instant, it costs nothing, it
 * never sends a customer's message to a third party, and the same input
 * always gives the same output.
 *
 * An AI provider can be layered on top for the genuinely messy cases, but
 * nothing in the product requires one.
 */

import { normalize, toOriginalSpan, type Normalized } from "./normalize";
import { findNumbers, type NumberMatch } from "./numbers";
import { findDeadline } from "./dates";
import {
  ADVANCE_WORDS,
  AREAS,
  CITIES,
  COLORS,
  ITEMS,
  MONEY_MARKERS,
  PAYMENT_METHODS,
  PER_UNIT_MARKERS,
  SECTOR_RE,
  TOTAL_MARKERS,
  UNITS,
} from "./lexicon";
import { emptyParse, field, type ParsedOrder } from "./types";

type Token = { text: string; start: number; end: number };

function tokenize(n: Normalized): Token[] {
  const out: Token[] = [];
  const re = /[^\s]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(n.text)) !== null) {
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/**
 * Strips surrounding punctuation so "4200/-" reads as a number and
 * "Rawalpindi." matches the city list. The uncleaned form is kept alongside
 * it, because markers like "/-" are themselves a signal that a number is money.
 */
const clean = (s: string) =>
  s.replace(/^[^\w\d₨]+/, "").replace(/[^\w\d%]+$/, "");

const PHONE_RE = /^0?3\d{2}[- ]?\d{7}$/;

function joinRange(tokens: Token[], a: number, b: number): string {
  return tokens.slice(a, b).map((t) => t.text).join(" ");
}

export type ParseOptions = { now?: Date };

export function parseOrder(message: string, opts: ParseOptions = {}): ParsedOrder {
  const now = opts.now ?? new Date();
  const n = normalize(message);
  const result = emptyParse("builtin");
  if (!n.text) return result;

  const rawTokens = tokenize(n);
  const tokens = rawTokens.map((t) => ({ ...t, raw: t.text, text: clean(t.text) }));
  const words = tokens.map((t) => t.text);
  const rawWords = tokens.map((t) => t.raw);
  const lowered = n.text;

  const span = (a: number, b: number) =>
    toOriginalSpan(n, tokens[a].start, tokens[Math.max(a, b - 1)].end);

  /** Token indices already claimed, so one number is not read twice. */
  const claimed = new Set<number>();

  // ---------------------------------------------------------------- deadline
  const deadline = findDeadline(lowered, now);
  if (deadline) {
    const dSpan = toOriginalSpan(
      n,
      deadline.index,
      deadline.index + deadline.length,
    );
    result.deadlineText = field(dSpan.text || deadline.text, deadline.confidence, dSpan);
    if (deadline.date) {
      result.deadlineDate = field(deadline.date, deadline.confidence, dSpan);
    }
    // Block the tokens the date used from being read as money.
    tokens.forEach((t, i) => {
      if (t.start >= deadline.index && t.end <= deadline.index + deadline.length) {
        claimed.add(i);
      }
    });
  }

  // ------------------------------------------------------------------- phone
  tokens.forEach((t, i) => {
    if (PHONE_RE.test(t.text.replace(/[^\d]/g, "")) || t.text.replace(/\D/g, "").length >= 10) {
      claimed.add(i);
    }
  });

  // ------------------------------------------------------------------ numbers
  const numbers = findNumbers(words).filter((num) => {
    for (let i = num.start; i < num.end; i += 1) if (claimed.has(i)) return false;
    return true;
  });

  const nearby = (idx: number, radius: number): string => {
    const a = Math.max(0, idx - radius);
    const b = Math.min(rawWords.length, idx + radius + 1);
    return rawWords.slice(a, b).join(" ");
  };

  const hasMarker = (text: string, markers: string[]) =>
    markers.some((mk) => text.includes(mk));

  type Scored = NumberMatch & { priceScore: number; qtyScore: number };
  const scored: Scored[] = numbers.map((num) => {
    const before = num.start > 0 ? words[num.start - 1] : "";
    const after = num.end < words.length ? words[num.end] : "";
    const context = nearby(num.start, 3);

    let priceScore = 0;
    let qtyScore = 0;

    if (hasMarker(context, MONEY_MARKERS)) priceScore += 3;
    if (/^(ka|ke|kay|ki)$/.test(after)) priceScore += 1.5;
    if (hasMarker(context, PER_UNIT_MARKERS)) priceScore += 1.5;
    if (num.value >= 500) priceScore += 2;
    else if (num.value >= 150) priceScore += 1;
    if (num.value < 60) priceScore -= 2;
    if (/^(rs|pkr|rupay|rupees)$/.test(before)) priceScore += 3;

    // A number sitting right before a unit or a known item is a count.
    if (UNITS[after]) qtyScore += 3;
    if (ITEMS[after]) qtyScore += 3;
    if (after && ITEMS[`${after} ${words[num.end + 1] ?? ""}`.trim()]) qtyScore += 3;
    if (num.value <= 50 && Number.isInteger(num.value)) qtyScore += 1.5;
    if (num.value > 200) qtyScore -= 3;
    if (/^(piece|pieces|pcs|adad)$/.test(after)) qtyScore += 2;

    return { ...num, priceScore, qtyScore };
  });

  // ---------------------------------------------------------------- quantity
  const qtyCandidates = scored
    .filter((s) => s.qtyScore > 0 && s.qtyScore >= s.priceScore)
    .sort((a, b) => b.qtyScore - a.qtyScore);

  let quantity = 1;
  if (qtyCandidates.length > 0) {
    const q = qtyCandidates[0];
    const unitTok = words[q.end];
    const unitDef = UNITS[unitTok];
    quantity = q.value;
    if (unitDef && unitDef.each > 1) quantity = q.value * unitDef.each;
    result.quantity = field(
      quantity,
      Math.min(0.95, 0.55 + q.qtyScore / 12),
      span(q.start, q.end),
    );
    if (unitDef) {
      result.unit = field(unitDef.label, 0.85, span(q.end, q.end + 1));
    }
    for (let i = q.start; i < q.end; i += 1) claimed.add(i);
  }

  // ------------------------------------------------------------------- price
  const priceCandidates = scored
    .filter((s) => {
      for (let i = s.start; i < s.end; i += 1) if (claimed.has(i)) return false;
      return s.priceScore > 0;
    })
    .sort((a, b) => b.priceScore - a.priceScore || b.value - a.value);

  if (priceCandidates.length > 0) {
    const p = priceCandidates[0];
    const context = nearby(p.start, 4);
    const isTotal =
      hasMarker(context, TOTAL_MARKERS) && !hasMarker(context, PER_UNIT_MARKERS);

    let unitPrice = p.value;
    if (isTotal && quantity > 1) {
      unitPrice = p.value / quantity;
      result.priceWasTotal = true;
    }

    result.unitPrice = field(
      Math.round(unitPrice * 100) / 100,
      Math.min(0.95, 0.5 + p.priceScore / 10),
      span(p.start, p.end),
    );
    for (let i = p.start; i < p.end; i += 1) claimed.add(i);
  }

  // -------------------------------------------------------------------- item
  type ItemHit = { entry: (typeof ITEMS)[string]; start: number; end: number };
  const itemHits: ItemHit[] = [];
  const covered = new Set<number>();

  for (let size = 3; size >= 1; size -= 1) {
    for (let i = 0; i + size <= words.length; i += 1) {
      let overlaps = false;
      for (let k = i; k < i + size; k += 1) if (covered.has(k)) overlaps = true;
      if (overlaps) continue;
      const hit = ITEMS[joinRange(tokens, i, i + size)];
      if (hit) {
        itemHits.push({ entry: hit, start: i, end: i + size });
        for (let k = i; k < i + size; k += 1) covered.add(k);
      }
    }
  }

  const products = itemHits.filter((h) => !h.entry.modifier);
  const modifiers = itemHits.filter((h) => h.entry.modifier);
  // In "green embroidered suits" the product is the head noun at the end, so
  // when several products match we take the last one.
  const product = products.length
    ? products.reduce((a, b) => (b.start > a.start ? b : a))
    : null;
  const chosen = product ?? modifiers[0] ?? null;

  if (chosen) {
    const anchor = chosen.start;
    const prev = anchor > 0 ? words[anchor - 1] : "";
    const prev2 = anchor > 1 ? words[anchor - 2] : "";
    const colour = COLORS[prev] ?? COLORS[prev2] ?? null;

    const technique = product && modifiers.length ? modifiers[0].entry.adj : null;
    const base = technique
      ? `${technique} ${chosen.entry.label.toLowerCase()}`
      : chosen.entry.label;
    const label = colour ? `${base} (${colour})` : base;

    result.item = field(label, product ? 0.9 : 0.75, span(chosen.start, chosen.end));
  }

  // -------------------------------------------------------------- place
  let cityHit: string | null = null;
  let citySpan: [number, number] | null = null;
  for (let size = 3; size >= 1 && !cityHit; size -= 1) {
    for (let i = 0; i + size <= words.length; i += 1) {
      const phrase = joinRange(tokens, i, i + size);
      if (CITIES[phrase]) {
        cityHit = CITIES[phrase];
        citySpan = [i, i + size];
        break;
      }
    }
  }
  if (cityHit && citySpan) {
    result.city = field(cityHit, 0.9, span(citySpan[0], citySpan[1]));
  }

  let areaHit: string | null = null;
  let areaSpan: [number, number] | null = null;
  for (let size = 3; size >= 1 && !areaHit; size -= 1) {
    for (let i = 0; i + size <= words.length; i += 1) {
      const phrase = joinRange(tokens, i, i + size);
      if (AREAS[phrase]) {
        areaHit = AREAS[phrase];
        areaSpan = [i, i + size];
        break;
      }
    }
  }
  const sector = n.text.match(SECTOR_RE);
  if (!areaHit && sector) {
    areaHit = sector[1].toUpperCase();
  }

  if (areaHit || cityHit) {
    const label = areaHit && cityHit ? `${areaHit}, ${cityHit}` : areaHit ?? cityHit!;
    const sp = areaSpan
      ? span(areaSpan[0], areaSpan[1])
      : citySpan
        ? span(citySpan[0], citySpan[1])
        : null;
    result.deliveryArea = field(label, areaHit && cityHit ? 0.92 : 0.8, sp);
  }

  // ----------------------------------------------------------------- payment
  for (let size = 2; size >= 1; size -= 1) {
    let found = false;
    for (let i = 0; i + size <= words.length; i += 1) {
      const phrase = joinRange(tokens, i, i + size);
      const hit = PAYMENT_METHODS[phrase];
      if (hit) {
        result.paymentMethod = field(hit, 0.9, span(i, i + size));
        found = true;
        break;
      }
    }
    if (found) break;
  }

  result.advanceOffered = ADVANCE_WORDS.some((w) => lowered.includes(w));

  // ------------------------------------------------------------------- notes
  const noteBits: string[] = [];
  const occasions: [RegExp, string][] = [
    [/\bbirthday\b|\bsalgirah\b/, "birthday"],
    [/\bshadi\b|\bwedding\b/, "wedding"],
    [/\bmangni\b|\bengagement\b/, "engagement"],
    [/\bnikah\b/, "nikah"],
    [/\beid\b/, "Eid"],
    [/\bmayun\b/, "mayun"],
    [/\bbarat\b|\bbaraat\b/, "baraat"],
    [/\bwalima\b/, "walima"],
    [/\baqeeqa\b/, "aqeeqa"],
  ];
  for (const [re, label] of occasions) {
    if (re.test(lowered)) noteBits.push(`For ${label}`);
  }
  if (result.advanceOffered) noteBits.push("Advance offered");
  const designWords = ["design", "gulab", "rose", "floral", "pattern", "print"];
  if (designWords.some((w) => lowered.includes(w))) noteBits.push("Specific design requested");
  if (/\burgent\b|\bjaldi\b|\basap\b/.test(lowered)) noteBits.push("Urgent");

  if (noteBits.length) {
    result.notes = field(noteBits.join(". "), 0.7, null);
  }

  // ---------------------------------------------------------------- coverage
  const filled = [
    result.item,
    result.quantity,
    result.unitPrice,
    result.deadlineText,
    result.deliveryArea,
    result.paymentMethod,
  ].filter(Boolean).length;
  result.coverage = filled / 6;

  return result;
}

export { normalize } from "./normalize";
export type { ParsedOrder, Field, Span } from "./types";
