import { describe, expect, it } from "vitest";
import { parseOrder } from "@/lib/parser";

const NOW = new Date(2026, 7, 14); // 14 Aug 2026
const parse = (msg: string) => parseOrder(msg, { now: NOW });

describe("real WhatsApp messages", () => {
  it("reads the stitching order", () => {
    const r = parse(
      "Assalam o alaikum baji, 3 green embroidered suits chahiye 23rd tak. 4200 each theek hain? delivery DHA Lahore. advance easypaisa kar doon?",
    );
    expect(r.item?.value).toMatch(/suit/i);
    expect(r.item?.value).toContain("green");
    expect(r.quantity?.value).toBe(3);
    expect(r.unitPrice?.value).toBe(4200);
    expect(r.deadlineText?.value.toLowerCase()).toContain("23");
    expect(r.deliveryArea?.value).toBe("DHA, Lahore");
    expect(r.paymentMethod?.value).toBe("Easypaisa");
    expect(r.advanceOffered).toBe(true);
  });

  it("reads the cake order", () => {
    const r = parse(
      "Baji AoA, beti ki birthday hai 18 tareekh ko. 2 kg chocolate cake chahiye, gulab ka design. Gulberg Lahore deliver ho jayega? Cash de dungi. 5500 ka ban jayega?",
    );
    expect(r.item?.value).toMatch(/cake/i);
    expect(r.unitPrice?.value).toBe(5500);
    expect(r.deliveryArea?.value).toBe("Gulberg, Lahore");
    expect(r.paymentMethod?.value).toBe("Cash");
    expect(r.notes?.value).toContain("birthday");
  });

  it("reads the mehndi booking", () => {
    const r = parse(
      "Salam, mehndi function 26 ko hai. Dulhan ke full hands aur feet. Bahria Town Rawalpindi. JazzCash pe advance bhej doon?",
    );
    expect(r.item?.value).toMatch(/mehndi/i);
    expect(r.deliveryArea?.value).toBe("Bahria Town, Rawalpindi");
    expect(r.paymentMethod?.value).toBe("JazzCash");
    expect(r.advanceOffered).toBe(true);
  });

  it("handles the hundreds idiom for price", () => {
    const r = parse("do jorey chahiye, 25 sau each, Model Town Lahore");
    expect(r.quantity?.value).toBe(2);
    expect(r.unitPrice?.value).toBe(2500);
  });

  it("splits a total across the quantity", () => {
    const r = parse("4 frocks banwane hain, total 12000 rupay, Johar Town");
    expect(r.quantity?.value).toBe(4);
    expect(r.unitPrice?.value).toBe(3000);
    expect(r.priceWasTotal).toBe(true);
  });

  it("expands a dozen into pieces", () => {
    const r = parse("ek dozen samosa chahiye kal tak, 50 rupay per piece");
    expect(r.quantity?.value).toBe(12);
    expect(r.unitPrice?.value).toBe(50);
  });

  it("reads Urdu script", () => {
    const r = parse("تین سوٹ چاہیے، لاہور، ایزی پیسہ");
    expect(r.item?.value).toMatch(/suit/i);
    expect(r.quantity?.value).toBe(3);
    expect(r.paymentMethod?.value).toBe("Easypaisa");
  });

  it("reads Eastern Arabic digits", () => {
    const r = parse("۵ cupcakes چاہیے، ۸۰۰ روپے");
    expect(r.quantity?.value).toBe(5);
    expect(r.unitPrice?.value).toBe(800);
  });

  it("does not mistake a phone number for a price", () => {
    const r = parse("2 suits chahiye 3500 each, mera number 03001234567 hai");
    expect(r.unitPrice?.value).toBe(3500);
  });

  it("reads an Islamabad sector", () => {
    const r = parse("tuition chahiye beta ke liye, F-10 Islamabad, 8000 per month");
    expect(r.deliveryArea?.value).toContain("F-10");
    expect(r.unitPrice?.value).toBe(8000);
  });

  it("flags urgency", () => {
    const r = parse("urgent 2 kurti chahiye kal tak please");
    expect(r.notes?.value).toContain("Urgent");
  });

  it("survives a message with nothing useful", () => {
    const r = parse("assalam o alaikum baji kaisi hain aap");
    expect(r.coverage).toBeLessThan(0.3);
    expect(r.unitPrice).toBeNull();
  });

  it("keeps the deadline words she was given", () => {
    const r = parse("5 suits 23 tareekh tak chahiye");
    expect(r.deadlineText?.value).toMatch(/23/);
    expect(r.deadlineDate?.value).toBe("2026-08-23");
  });

  it("rolls a past day of month into next month", () => {
    const r = parse("cake chahiye 5 tareekh ko");
    expect(r.deadlineDate?.value).toBe("2026-09-05");
  });

  it("resolves relative days", () => {
    expect(parse("kal tak chahiye").deadlineDate?.value).toBe("2026-08-15");
    expect(parse("parson chahiye").deadlineDate?.value).toBe("2026-08-16");
  });

  it("resolves the next weekday", () => {
    // 14 Aug 2026 is a Friday, so next Friday is the 21st.
    expect(parse("juma tak chahiye").deadlineDate?.value).toBe("2026-08-21");
  });
});

describe("spans point back at the original text", () => {
  it("marks where the price came from", () => {
    const msg = "3 suits chahiye 4200 each";
    const r = parse(msg);
    const s = r.unitPrice?.span;
    expect(s).toBeTruthy();
    expect(msg.slice(s!.start, s!.end)).toBe("4200");
  });

  it("marks where the quantity came from", () => {
    const msg = "teen suits chahiye";
    const r = parse(msg);
    const s = r.quantity?.span;
    expect(msg.slice(s!.start, s!.end)).toBe("teen");
  });
});

describe("the N ko date idiom", () => {
  it("reads a bare day followed by ko", () => {
    const r = parse("bridal mehndi chahiye 26 ko, F-10 islamabad");
    expect(r.deadlineDate?.value).toBe("2026-08-26");
    expect(r.quantity?.value).not.toBe(26);
  });

  it("does not swallow a price", () => {
    const r = parse("2 suits 4200 each 26 ko chahiye");
    expect(r.unitPrice?.value).toBe(4200);
    expect(r.deadlineDate?.value).toBe("2026-08-26");
  });
});
