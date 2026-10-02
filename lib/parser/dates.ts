/**
 * Deadline reading.
 *
 * Two values come out of this: the words she was given, kept exactly as
 * written, and a resolved calendar date when we are confident enough to
 * compute one. The raw words are the ones shown back to her, because "23
 * tareekh" is what she agreed to and turning it silently into a date is how
 * you end up delivering on the wrong month.
 */

export type DateHit = {
  text: string;
  /** ISO yyyy-mm-dd when resolvable, otherwise null. */
  date: string | null;
  confidence: number;
  index: number;
  length: number;
};

const WEEKDAYS: Record<string, number> = {
  sunday: 0, itwar: 0, atwar: 0, sun: 0,
  monday: 1, somwar: 1, peer: 1, mon: 1,
  tuesday: 2, mangal: 2, tue: 2, tues: 2,
  wednesday: 3, budh: 3, wed: 3,
  thursday: 4, jumeraat: 4, jumerat: 4, thu: 4, thurs: 4,
  friday: 5, juma: 5, jumma: 5, fri: 5,
  saturday: 6, hafta: 6, sanichar: 6, sat: 6,
};

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, farvari: 1,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4, mai: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

const iso = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addDays = (base: Date, n: number): Date => {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
};

/**
 * Resolves a bare day of month to the next time that day occurs, because an
 * order placed on the 28th asking for "the 3rd" means next month.
 */
function nextDayOfMonth(day: number, today: Date): string | null {
  if (day < 1 || day > 31) return null;
  const candidate = new Date(today.getFullYear(), today.getMonth(), day);
  if (candidate.getDate() !== day) return null;
  if (candidate >= stripTime(today)) return iso(candidate);
  const next = new Date(today.getFullYear(), today.getMonth() + 1, day);
  if (next.getDate() !== day) return null;
  return iso(next);
}

const stripTime = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

function nextWeekday(target: number, today: Date): string {
  const base = stripTime(today);
  let delta = (target - base.getDay() + 7) % 7;
  if (delta === 0) delta = 7;
  return iso(addDays(base, delta));
}

/**
 * Finds the deadline in a normalized message.
 * `now` is injectable so the behaviour is testable.
 */
export function findDeadline(text: string, now: Date = new Date()): DateHit | null {
  const hits: DateHit[] = [];

  const push = (
    match: RegExpMatchArray,
    date: string | null,
    confidence: number,
  ) => {
    if (match.index === undefined) return;
    hits.push({
      text: match[0].trim(),
      date,
      confidence,
      index: match.index,
      length: match[0].length,
    });
  };

  // "23 august", "5 sept"
  const dayMonth = text.match(
    /\b(\d{1,2})\s*(?:st|nd|rd|th)?\s+(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)\b/,
  );
  if (dayMonth) {
    const day = parseInt(dayMonth[1], 10);
    const mon = MONTHS[dayMonth[2]];
    let year = now.getFullYear();
    let d = new Date(year, mon, day);
    if (d < stripTime(now)) d = new Date(++year, mon, day);
    push(dayMonth, d.getDate() === day ? iso(d) : null, 0.95);
  }

  // "23 tareekh", "23 tarikh"
  const tareekh = text.match(/\b(\d{1,2})\s*(?:tareekh|tarikh|tarik)\b/);
  if (tareekh) {
    push(tareekh, nextDayOfMonth(parseInt(tareekh[1], 10), now), 0.9);
  }

  // "26 ko", "18 ko". In Urdu this is the ordinary way to name a day.
  const koDay = text.match(/\b(\d{1,2})\s+ko\b/);
  if (koDay) {
    const day = parseInt(koDay[1], 10);
    if (day >= 1 && day <= 31) push(koDay, nextDayOfMonth(day, now), 0.85);
  }

  // "23rd", "1st", only when it looks like a date not a quantity
  const ordinal = text.match(/\b(\d{1,2})(st|nd|rd|th)\b/);
  if (ordinal) {
    push(ordinal, nextDayOfMonth(parseInt(ordinal[1], 10), now), 0.8);
  }

  // weekday names
  for (const [word, dow] of Object.entries(WEEKDAYS)) {
    const re = new RegExp(`\\b${word}\\b`);
    const m = text.match(re);
    // Two letter and three letter forms are too collision prone on their own.
    if (m && word.length > 3) push(m, nextWeekday(dow, now), 0.75);
  }

  // relative days
  const relatives: [RegExp, number, number][] = [
    [/\baaj\b|\btoday\b/, 0, 0.9],
    [/\bkal\b|\btomorrow\b/, 1, 0.8],
    [/\bparson\b|\bday after tomorrow\b/, 2, 0.85],
    [/\bagle hafte\b|\bnext week\b|\bagle week\b/, 7, 0.75],
    [/\bis hafte\b|\bthis week\b/, 3, 0.6],
    [/\bagle mahine\b|\bnext month\b/, 30, 0.7],
  ];
  for (const [re, days, conf] of relatives) {
    const m = text.match(re);
    if (m) push(m, iso(addDays(stripTime(now), days)), conf);
  }

  // "5 din mein", "in 3 days"
  const inDays = text.match(/\b(\d{1,2})\s*(?:din|days?)\s*(?:mein|me|in)?\b/);
  if (inDays) {
    push(inDays, iso(addDays(stripTime(now), parseInt(inDays[1], 10))), 0.8);
  }

  // "15/8", "15-08-2026"
  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/);
  if (numeric) {
    const day = parseInt(numeric[1], 10);
    const mon = parseInt(numeric[2], 10) - 1;
    let year = numeric[3]
      ? parseInt(numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3], 10)
      : now.getFullYear();
    if (mon >= 0 && mon < 12 && day >= 1 && day <= 31) {
      let d = new Date(year, mon, day);
      if (!numeric[3] && d < stripTime(now)) d = new Date(++year, mon, day);
      push(numeric, d.getDate() === day ? iso(d) : null, 0.85);
    }
  }

  if (hits.length === 0) return null;

  // Prefer the most confident, and on a tie the one that appears first.
  hits.sort((a, b) => b.confidence - a.confidence || a.index - b.index);
  return hits[0];
}
