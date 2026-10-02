/**
 * Vocabulary the parser matches against.
 *
 * Everything here is written the way people type it on a phone, including the
 * common misspellings, because that is what actually arrives in a message.
 */

export const CITIES: Record<string, string> = {};
const CITY_LIST: [string, string[]][] = [
  ["Lahore", ["lahore", "lhr", "lahor"]],
  ["Karachi", ["karachi", "khi", "karachee"]],
  ["Islamabad", ["islamabad", "isb", "isl"]],
  ["Rawalpindi", ["rawalpindi", "pindi", "rwp"]],
  ["Faisalabad", ["faisalabad", "fsd", "lyallpur"]],
  ["Multan", ["multan"]],
  ["Peshawar", ["peshawar", "pesh"]],
  ["Quetta", ["quetta"]],
  ["Gujranwala", ["gujranwala", "gujranwalla"]],
  ["Sialkot", ["sialkot"]],
  ["Hyderabad", ["hyderabad"]],
  ["Sargodha", ["sargodha"]],
  ["Bahawalpur", ["bahawalpur"]],
  ["Sukkur", ["sukkur", "sukhur"]],
  ["Abbottabad", ["abbottabad", "abbotabad", "atd"]],
  ["Mardan", ["mardan"]],
  ["Sheikhupura", ["sheikhupura"]],
  ["Gujrat", ["gujrat"]],
  ["Jhang", ["jhang"]],
  ["Kasur", ["kasur"]],
  ["Okara", ["okara"]],
  ["Sahiwal", ["sahiwal"]],
  ["Wah Cantt", ["wah cantt", "wah"]],
  ["Dera Ghazi Khan", ["dera ghazi khan", "dg khan", "dgk"]],
  ["Rahim Yar Khan", ["rahim yar khan", "ryk"]],
  ["Nawabshah", ["nawabshah"]],
  ["Mirpurkhas", ["mirpurkhas", "mirpur khas"]],
  ["Chiniot", ["chiniot"]],
  ["Kohat", ["kohat"]],
  ["Khanewal", ["khanewal"]],
  ["Hafizabad", ["hafizabad"]],
  ["Mandi Bahauddin", ["mandi bahauddin", "mb din"]],
  ["Jaranwala", ["jaranwala"]],
  ["Daska", ["daska"]],
  ["Wazirabad", ["wazirabad"]],
  ["Muzaffargarh", ["muzaffargarh"]],
  ["Larkana", ["larkana"]],
  ["Jacobabad", ["jacobabad"]],
  ["Swat", ["swat", "mingora"]],
  ["Gilgit", ["gilgit"]],
  ["Muzaffarabad", ["muzaffarabad"]],
  ["Mirpur AJK", ["mirpur ajk"]],
];
for (const [canonical, variants] of CITY_LIST) {
  for (const v of variants) CITIES[v] = canonical;
}

/** Neighbourhoods and sectors, the part people actually give for delivery. */
export const AREAS: Record<string, string> = {};
const AREA_LIST: [string, string[]][] = [
  ["DHA", ["dha", "defence", "defense"]],
  ["Gulberg", ["gulberg"]],
  ["Model Town", ["model town"]],
  ["Johar Town", ["johar town"]],
  ["Bahria Town", ["bahria town", "bahria"]],
  ["Clifton", ["clifton"]],
  ["Saddar", ["saddar", "sadar"]],
  ["Cantt", ["cantt", "cantonment"]],
  ["Askari", ["askari"]],
  ["Garden Town", ["garden town"]],
  ["Faisal Town", ["faisal town"]],
  ["Iqbal Town", ["iqbal town"]],
  ["Township", ["township"]],
  ["Valencia", ["valencia"]],
  ["Wapda Town", ["wapda town"]],
  ["Nazimabad", ["nazimabad"]],
  ["North Nazimabad", ["north nazimabad"]],
  ["Gulshan-e-Iqbal", ["gulshan e iqbal", "gulshan"]],
  ["Gulistan-e-Johar", ["gulistan e johar"]],
  ["PECHS", ["pechs"]],
  ["Korangi", ["korangi"]],
  ["Malir", ["malir"]],
  ["Landhi", ["landhi"]],
  ["Tariq Road", ["tariq road"]],
  ["Shahra-e-Faisal", ["shahra e faisal", "sharea faisal"]],
  ["Bani Gala", ["bani gala"]],
  ["Satellite Town", ["satellite town"]],
  ["Chaklala", ["chaklala"]],
  ["Hayatabad", ["hayatabad"]],
  ["University Town", ["university town"]],
  ["Shadman", ["shadman"]],
  ["Samanabad", ["samanabad"]],
  ["Ichhra", ["ichhra", "ichra"]],
  ["Walton", ["walton"]],
  ["Paragon City", ["paragon city"]],
  ["State Life", ["state life"]],
  ["Lake City", ["lake city"]],
];
for (const [canonical, variants] of AREA_LIST) {
  for (const v of variants) AREAS[v] = canonical;
}

/** Islamabad style sector codes, matched by pattern rather than list. */
export const SECTOR_RE = /\b([efgiEFGI]-\d{1,2}(?:\/\d)?)\b/;

export const PAYMENT_METHODS: Record<string, string> = {
  easypaisa: "Easypaisa", "easy paisa": "Easypaisa", easypasa: "Easypaisa",
  jazzcash: "JazzCash", "jazz cash": "JazzCash", jazzcas: "JazzCash",
  nayapay: "NayaPay", "naya pay": "NayaPay",
  sadapay: "SadaPay", "sada pay": "SadaPay",
  raast: "Raast",
  cash: "Cash", naqd: "Cash", cod: "Cash", "cash on delivery": "Cash",
  bank: "Bank transfer", "bank transfer": "Bank transfer",
  ibft: "Bank transfer", iban: "Bank transfer", "account mein": "Bank transfer",
  transfer: "Bank transfer",
};

export const ADVANCE_WORDS = [
  "advance", "peshgi", "token", "booking amount", "half payment",
  "aadha abhi", "adha abhi", "pehle", "upfront",
];

/** Units of sale, with how many base pieces each one means. */
export const UNITS: Record<string, { label: string; each: number }> = {
  kg: { label: "kg", each: 1 },
  kilo: { label: "kg", each: 1 },
  gram: { label: "g", each: 1 },
  g: { label: "g", each: 1 },
  dozen: { label: "dozen", each: 12 },
  darjan: { label: "dozen", each: 12 },
  piece: { label: "piece", each: 1 },
  pieces: { label: "piece", each: 1 },
  pcs: { label: "piece", each: 1 },
  pc: { label: "piece", each: 1 },
  set: { label: "set", each: 1 },
  sets: { label: "set", each: 1 },
  packet: { label: "packet", each: 1 },
  pack: { label: "packet", each: 1 },
  plate: { label: "plate", each: 1 },
  jora: { label: "suit", each: 1 },
  jorra: { label: "suit", each: 1 },
  jorey: { label: "suit", each: 1 },
  jore: { label: "suit", each: 1 },
  pair: { label: "pair", each: 2 },
  hour: { label: "hour", each: 1 },
  ghanta: { label: "hour", each: 1 },
  month: { label: "month", each: 1 },
  mahina: { label: "month", each: 1 },
};

export type ItemEntry = {
  label: string;
  category: string;
  /**
   * True for techniques rather than products. "Embroidered suits" is a suit,
   * not an embroidery, so a modifier only wins when nothing else matched.
   */
  modifier?: boolean;
  /** Adjective form used when folded into a product label. */
  adj?: string;
};

/** Craft, food and service vocabulary, longest phrases listed first. */
export const ITEMS: Record<string, ItemEntry> = {};
type ItemSeed = [string, string, string[], { modifier?: boolean; adj?: string }?];
const ITEM_LIST: ItemSeed[] = [
  // stitching and clothing
  ["Bridal lehnga", "Stitching", ["bridal lehnga", "bridal lehenga"]],
  ["Lehnga", "Stitching", ["lehnga", "lehenga", "lehanga"]],
  ["Three piece suit", "Stitching", ["3 piece suit", "three piece suit", "3pc suit"]],
  ["Suit", "Stitching", ["suit", "suits", "jora", "jorra", "jorey", "jore"]],
  ["Kameez", "Stitching", ["kameez", "qameez", "kamiz"]],
  ["Shalwar", "Stitching", ["shalwar", "salwar"]],
  ["Dupatta", "Stitching", ["dupatta", "dopatta"]],
  ["Frock", "Stitching", ["frock", "frocks"]],
  ["Maxi", "Stitching", ["maxi"]],
  ["Abaya", "Stitching", ["abaya", "abaaya"]],
  ["Blouse", "Stitching", ["blouse"]],
  ["Kurti", "Stitching", ["kurti", "kurta"]],
  ["Sherwani", "Stitching", ["sherwani"]],
  ["Waistcoat", "Stitching", ["waistcoat", "vasket"]],
  ["Trousers", "Stitching", ["trouser", "trousers", "pajama", "pyjama"]],
  ["School uniform", "Stitching", ["school uniform", "uniform"]],
  ["Curtains", "Stitching", ["curtain", "curtains", "parday", "parde"]],
  ["Cushion covers", "Stitching", ["cushion cover", "cushion covers"]],
  // embroidery
  ["Embroidery", "Embroidery", ["embroidery", "kadhai", "karhai", "embroidered"], { modifier: true, adj: "Embroidered" }],
  ["Zari work", "Embroidery", ["zari", "zari work"], { modifier: true, adj: "Zari" }],
  ["Tilla work", "Embroidery", ["tilla", "tilla work"], { modifier: true, adj: "Tilla" }],
  ["Aari work", "Embroidery", ["aari", "aari work"], { modifier: true, adj: "Aari" }],
  ["Mirror work", "Embroidery", ["mirror work", "sheesha work"], { modifier: true, adj: "Mirror work" }],
  // food
  ["Cake", "Home food", ["cake", "cakes"]],
  ["Cupcakes", "Home food", ["cupcake", "cupcakes"]],
  ["Brownies", "Home food", ["brownie", "brownies"]],
  ["Cookies", "Home food", ["cookie", "cookies", "biscuit", "biscuits"]],
  ["Samosas", "Home food", ["samosa", "samosas", "samose"]],
  ["Spring rolls", "Home food", ["spring roll", "spring rolls", "roll", "rolls"]],
  ["Biryani", "Home food", ["biryani", "biriyani"]],
  ["Nihari", "Home food", ["nihari"]],
  ["Karahi", "Home food", ["karahi", "karhai chicken"]],
  ["Haleem", "Home food", ["haleem"]],
  ["Kheer", "Home food", ["kheer"]],
  ["Mithai", "Home food", ["mithai", "sweets"]],
  ["Pizza", "Home food", ["pizza"]],
  ["Chapli kebab", "Home food", ["chapli kebab", "chapli kabab"]],
  ["Seekh kebab", "Home food", ["seekh kebab", "seekh kabab"]],
  // mehndi and beauty
  ["Bridal mehndi", "Mehndi", ["bridal mehndi", "dulhan mehndi"]],
  ["Mehndi", "Mehndi", ["mehndi", "mehendi", "henna"]],
  ["Bridal makeup", "Beauty", ["bridal makeup", "dulhan makeup"]],
  ["Party makeup", "Beauty", ["party makeup", "makeup"]],
  ["Facial", "Beauty", ["facial"]],
  ["Threading", "Beauty", ["threading"]],
  ["Waxing", "Beauty", ["waxing"]],
  ["Haircut", "Beauty", ["haircut", "hair cut"]],
  // craft
  ["Crochet set", "Handicraft", ["crochet", "crochet set"]],
  ["Knitted sweater", "Handicraft", ["sweater", "jersey", "knitting"]],
  ["Baby booties", "Handicraft", ["booties", "bootie"]],
  ["Cap", "Handicraft", ["cap", "topi"]],
  ["Earrings", "Handicraft", ["earring", "earrings", "jhumkay", "jhumke"]],
  ["Jewellery", "Handicraft", ["jewellery", "jewelry", "zevar"]],
  ["Scrunchies", "Handicraft", ["scrunchie", "scrunchies"]],
  ["Candles", "Handicraft", ["candle", "candles"]],
  ["Soap", "Handicraft", ["soap", "soaps"]],
  ["Resin art", "Handicraft", ["resin", "resin art"]],
  ["Painting", "Handicraft", ["painting", "canvas"]],
  ["Calligraphy", "Handicraft", ["calligraphy"]],
  // services
  ["Tuition", "Tuition", ["tuition", "tutoring", "tution"]],
  ["Quran classes", "Tuition", ["quran", "qaida", "nazra"]],
  ["Maths tuition", "Tuition", ["maths tuition", "math tuition"]],
  ["English tuition", "Tuition", ["english tuition", "spoken english"]],
];
for (const [label, category, variants, extra] of ITEM_LIST) {
  for (const v of variants) ITEMS[v] = { label, category, ...(extra ?? {}) };
}

export const COLORS: Record<string, string> = {
  green: "green", hara: "green", sabz: "green",
  red: "red", lal: "red", surkh: "red",
  blue: "blue", neela: "blue", nila: "blue",
  black: "black", kala: "black", siyah: "black",
  white: "white", safed: "white",
  pink: "pink", gulabi: "pink",
  yellow: "yellow", peela: "yellow",
  orange: "orange",
  purple: "purple", baingani: "purple",
  maroon: "maroon",
  navy: "navy",
  gold: "gold", sunehri: "gold",
  silver: "silver", chandi: "silver",
  cream: "cream", beige: "beige",
  grey: "grey", gray: "grey", grai: "grey",
  brown: "brown", bhoora: "brown",
  teal: "teal", mustard: "mustard", olive: "olive", rust: "rust",
};

/** Words that mark the number before or after them as money. */
export const MONEY_MARKERS = [
  "rs", "rs.", "rupay", "rupaye", "rupees", "rupee", "pkr", "qeemat",
  "price", "rate", "paise", "/-", "₨",
];

/** Words that mark a price as being per single unit. */
export const PER_UNIT_MARKERS = [
  "each", "per", "fi", "ka ek", "ek ka", "per piece", "per unit", "prati",
];

/** Words that mark a price as covering the whole order. */
export const TOTAL_MARKERS = [
  "total", "kul", "sab", "sab mila", "mila kar", "milakar", "overall",
  "sab ka", "poora", "pura",
];
