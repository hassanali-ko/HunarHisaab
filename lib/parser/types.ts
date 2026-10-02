/**
 * Shapes shared across the parser.
 *
 * Every extracted field carries a confidence score and the slice of the
 * original message it came from, so the review screen can show her exactly
 * which words produced which number instead of asking her to trust a box.
 */

export type Span = { start: number; end: number; text: string };

export type Field<T> = {
  value: T;
  /** 0 to 1. Below 0.6 the review screen flags the field for a second look. */
  confidence: number;
  span: Span | null;
};

export type ParsedOrder = {
  customerName: Field<string> | null;
  item: Field<string> | null;
  quantity: Field<number> | null;
  unit: Field<string> | null;
  unitPrice: Field<number> | null;
  /** True when the price in the message was a total for the whole order. */
  priceWasTotal: boolean;
  deadlineText: Field<string> | null;
  deadlineDate: Field<string> | null;
  deliveryArea: Field<string> | null;
  city: Field<string> | null;
  paymentMethod: Field<string> | null;
  advanceOffered: boolean;
  notes: Field<string> | null;
  /** Which engine produced this: the built in parser or an AI provider. */
  engine: string;
  /** Rough share of the message the parser understood, 0 to 1. */
  coverage: number;
};

export const emptyParse = (engine: string): ParsedOrder => ({
  customerName: null,
  item: null,
  quantity: null,
  unit: null,
  unitPrice: null,
  priceWasTotal: false,
  deadlineText: null,
  deadlineDate: null,
  deliveryArea: null,
  city: null,
  paymentMethod: null,
  advanceOffered: false,
  notes: null,
  engine,
  coverage: 0,
});

export const field = <T>(
  value: T,
  confidence: number,
  span: Span | null = null,
): Field<T> => ({ value, confidence: Math.max(0, Math.min(1, confidence)), span });
