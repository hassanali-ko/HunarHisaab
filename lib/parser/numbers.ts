/**
 * Number reading for Roman Urdu, Urdu and English.
 *
 * The hard part is not digits, it is the way people actually quote money in
 * Pakistan. "42 sau" is 4200. "sarhay char hazaar" is 4500. "dhai hazaar" is
 * 2500. A parser that only reads digits misses most of a real message.
 */

export const UNIT_WORDS: Record<string, number> = {
  zero: 0, sifar: 0,
  ek: 1, aik: 1, ik: 1, one: 1,
  do: 2, two: 2,
  teen: 3, tin: 3, three: 3,
  char: 4, chaar: 4, four: 4,
  paanch: 5, panch: 5, panj: 5, five: 5,
  chay: 6, che: 6, cheh: 6, chhay: 6, six: 6,
  saat: 7, sat: 7, seven: 7,
  aath: 8, ath: 8, eight: 8,
  nau: 9, no: 9, nine: 9,
  das: 10, dus: 10, ten: 10,
  gyarah: 11, igarah: 11, eleven: 11,
  barah: 12, bara: 12, twelve: 12,
  terah: 13, thirteen: 13,
  chaudah: 14, chodah: 14, fourteen: 14,
  pandrah: 15, pandra: 15, fifteen: 15,
  solah: 16, sola: 16, sixteen: 16,
  satrah: 17, seventeen: 17,
  atharah: 18, atharan: 18, eighteen: 18,
  unnees: 19, nineteen: 19,
  bees: 20, bis: 20, twenty: 20,
  pachees: 25, pachchees: 25,
  tees: 30, this: 30, thirty: 30,
  chalees: 40, forty: 40,
  pachaas: 50, pachas: 50, fifty: 50,
  saath: 60, sixty: 60,
  sattar: 70, seventy: 70,
  assi: 80, eighty: 80,
  nabbe: 90, nabbay: 90, ninety: 90,
};

export const MULTIPLIER_WORDS: Record<string, number> = {
  sau: 100, soo: 100, hundred: 100,
  hazaar: 1000, hazar: 1000, hazzar: 1000, thousand: 1000, k: 1000,
  lakh: 100000, lac: 100000,
  crore: 10000000, karor: 10000000,
};

/** Words that shift the number that follows by a quarter or a half. */
export const FRACTION_PREFIX: Record<string, number> = {
  sarhay: 0.5, sarhe: 0.5, saadhe: 0.5, sadhe: 0.5,
  sawa: 0.25, sava: 0.25,
  paune: -0.25, pone: -0.25,
};

/** Standalone fraction words. */
export const FRACTION_WORDS: Record<string, number> = {
  aadha: 0.5, adha: 0.5, half: 0.5,
  derh: 1.5, dedh: 1.5, dhedh: 1.5,
  dhai: 2.5, dhaai: 2.5, adhai: 2.5,
};

export type NumberMatch = {
  value: number;
  /** token index where the phrase starts */
  start: number;
  /** token index just past the phrase */
  end: number;
  /** true when written with digits rather than words */
  fromDigits: boolean;
};

const DIGIT_RE = /^(\d+(?:,\d{3})*(?:\.\d+)?|\d*\.\d+)(k|kg)?$/i;

function digitValue(token: string): { value: number; isK: boolean } | null {
  const m = token.match(DIGIT_RE);
  if (!m) return null;
  const raw = m[1].replace(/,/g, "");
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return null;
  // Only a bare "k" is a thousands multiplier. "kg" is a weight unit.
  const isK = (m[2] ?? "").toLowerCase() === "k";
  return { value: isK ? n * 1000 : n, isK };
}

/**
 * Reads the longest number phrase starting at `i`.
 * Returns null when the token there does not begin a number.
 */
export function readNumber(tokens: string[], i: number): NumberMatch | null {
  let total = 0;
  let current = 0;
  let seen = false;
  let fromDigits = false;
  let pendingFraction = 0;
  let j = i;

  while (j < tokens.length) {
    const tok = tokens[j];

    if (FRACTION_PREFIX[tok] !== undefined) {
      // "sarhay" with nothing numeric after it is not a number.
      pendingFraction = FRACTION_PREFIX[tok];
      seen = true;
      j += 1;
      continue;
    }

    if (FRACTION_WORDS[tok] !== undefined) {
      current += FRACTION_WORDS[tok];
      seen = true;
      j += 1;
      continue;
    }

    const digits = digitValue(tok);
    if (digits) {
      // A second digit group that is not part of a multiplier chain ends the
      // phrase, so "3 suits 4200" does not become one number.
      if (seen && current !== 0 && !pendingFraction) break;
      current += digits.value + pendingFraction;
      pendingFraction = 0;
      fromDigits = true;
      seen = true;
      j += 1;
      continue;
    }

    if (UNIT_WORDS[tok] !== undefined) {
      if (seen && current !== 0 && !pendingFraction) break;
      current += UNIT_WORDS[tok] + pendingFraction;
      pendingFraction = 0;
      seen = true;
      j += 1;
      continue;
    }

    const mult = MULTIPLIER_WORDS[tok];
    if (mult !== undefined) {
      if (!seen && mult < 1000) break;
      const base = current === 0 ? 1 : current;
      if (mult >= 1000) {
        total += base * mult;
        current = 0;
      } else {
        current = base * mult;
      }
      seen = true;
      j += 1;
      continue;
    }

    break;
  }

  if (!seen) return null;
  const value = total + current;
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, start: i, end: j, fromDigits };
}

/** Every number phrase in the token list, left to right. */
export function findNumbers(tokens: string[]): NumberMatch[] {
  const out: NumberMatch[] = [];
  let i = 0;
  while (i < tokens.length) {
    const m = readNumber(tokens, i);
    if (m && m.end > m.start) {
      out.push(m);
      i = m.end;
    } else {
      i += 1;
    }
  }
  return out;
}
