/**
 * Message normalisation.
 *
 * WhatsApp text from a Pakistani phone arrives in a mix of scripts: Latin
 * Roman Urdu, Urdu script, Eastern Arabic digits, and the odd emoji. This
 * flattens all of that to something the rules can match on while keeping an
 * index map back to the original string, so spans stay accurate.
 */

const EASTERN_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
  "۰": "0", "۱": "1", "۲": "2", "۳": "3", "۴": "4",
  "۵": "5", "۶": "6", "۷": "7", "۸": "8", "۹": "9",
};

/** Urdu script words we can map straight onto their Roman Urdu equivalent. */
const URDU_WORDS: Record<string, string> = {
  "ایک": "ek", "دو": "do", "تین": "teen", "چار": "char", "پانچ": "paanch",
  "چھ": "chay", "سات": "saat", "آٹھ": "aath", "نو": "nau", "دس": "das",
  "بیس": "bees", "سو": "sau", "ہزار": "hazaar", "لاکھ": "lakh",
  "آدھا": "aadha", "ڈیڑھ": "derh", "ڈھائی": "dhai", "ساڑھے": "sarhay",
  "روپے": "rupay", "قیمت": "qeemat", "پیسے": "paise",
  "چاہیے": "chahiye", "چاہئیں": "chahiye", "بنا": "bana", "بنانا": "banana",
  "تاریخ": "tareekh", "تک": "tak", "کل": "kal", "پرسوں": "parson",
  "ہفتے": "hafte", "ہفتہ": "hafta", "مہینے": "mahine", "دن": "din",
  "ایڈوانس": "advance", "پیشگی": "peshgi", "نقد": "cash",
  "ڈیلیوری": "delivery", "پتہ": "address",
  "جوڑا": "jora", "جوڑے": "jorey", "سوٹ": "suit", "قمیض": "kameez",
  "شلوار": "shalwar", "دوپٹہ": "dupatta", "کڑھائی": "kadhai",
  "کیک": "cake", "سموسے": "samosa", "مہندی": "mehndi", "ٹیوشن": "tuition",
  "لاہور": "lahore", "کراچی": "karachi", "اسلام آباد": "islamabad",
  "راولپنڈی": "rawalpindi", "فیصل آباد": "faisalabad", "ملتان": "multan",
  "پشاور": "peshawar", "کوئٹہ": "quetta",
  "ایزی پیسہ": "easypaisa", "جاز کیش": "jazzcash", "بینک": "bank",
  "سبز": "green", "ہرا": "green", "لال": "red", "سرخ": "red",
  "نیلا": "blue", "کالا": "black", "سفید": "white", "گلابی": "pink",
};

export type Normalized = {
  /** Lower case, Latin digits, single spaced. Rules run against this. */
  text: string;
  /** original.length aligned map: normalized index -> original index */
  map: number[];
  original: string;
};

/**
 * Collapses the message to a matchable form and records, for every character
 * in the result, where it came from in the input.
 */
export function normalize(input: string): Normalized {
  const original = input ?? "";
  let text = "";
  const map: number[] = [];

  const pushChar = (ch: string, origIndex: number) => {
    text += ch;
    map.push(origIndex);
  };

  const pushRun = (s: string, origIndex: number) => {
    for (const ch of s) pushChar(ch, origIndex);
  };

  // Urdu multi word phrases first, longest match wins.
  const urduKeys = Object.keys(URDU_WORDS).sort((a, b) => b.length - a.length);

  let i = 0;
  while (i < original.length) {
    let matched = false;

    for (const key of urduKeys) {
      if (original.startsWith(key, i)) {
        pushRun(URDU_WORDS[key], i);
        i += key.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const ch = original[i];

    if (EASTERN_DIGITS[ch]) {
      pushChar(EASTERN_DIGITS[ch], i);
      i += 1;
      continue;
    }

    // Urdu full stop and comma behave like Latin punctuation for our purposes.
    if (ch === "۔") {
      pushChar(".", i);
      i += 1;
      continue;
    }
    if (ch === "،") {
      pushChar(",", i);
      i += 1;
      continue;
    }

    const code = ch.codePointAt(0) ?? 0;
    // Drop emoji and pictographs, they only confuse the number rules.
    if (code >= 0x1f000 || (code >= 0x2600 && code <= 0x27bf)) {
      const size = String.fromCodePoint(code).length;
      if (text.length && text[text.length - 1] !== " ") pushChar(" ", i);
      i += size;
      continue;
    }

    if (/\s/.test(ch)) {
      if (text.length && text[text.length - 1] !== " ") pushChar(" ", i);
      i += 1;
      continue;
    }

    pushChar(ch.toLowerCase(), i);
    i += 1;
  }

  // Trim while keeping the map aligned.
  let start = 0;
  let end = text.length;
  while (start < end && text[start] === " ") start += 1;
  while (end > start && text[end - 1] === " ") end -= 1;

  return {
    text: text.slice(start, end),
    map: map.slice(start, end),
    original,
  };
}

/** Maps a range in normalized space back to the original message. */
export function toOriginalSpan(
  n: Normalized,
  start: number,
  end: number,
): { start: number; end: number; text: string } {
  if (start >= n.map.length) {
    return { start: 0, end: 0, text: "" };
  }
  const oStart = n.map[start];
  const lastIdx = Math.min(end, n.map.length) - 1;
  const oEnd = (n.map[lastIdx] ?? oStart) + 1;
  return {
    start: oStart,
    end: oEnd,
    text: n.original.slice(oStart, oEnd).trim(),
  };
}
