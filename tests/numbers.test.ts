import { describe, expect, it } from "vitest";
import { readNumber } from "@/lib/parser/numbers";

const read = (s: string) => readNumber(s.split(" "), 0)?.value ?? null;

describe("number reading", () => {
  it("reads plain digits", () => {
    expect(read("4200")).toBe(4200);
    expect(read("4,200")).toBe(4200);
    expect(read("550")).toBe(550);
  });

  it("reads the hundreds idiom", () => {
    expect(read("42 sau")).toBe(4200);
    expect(read("teen sau")).toBe(300);
    expect(read("15 sau")).toBe(1500);
  });

  it("reads thousands", () => {
    expect(read("char hazaar")).toBe(4000);
    expect(read("do hazaar")).toBe(2000);
    expect(read("5k")).toBe(5000);
    expect(read("4.2k")).toBe(4200);
  });

  it("composes thousands and hundreds", () => {
    expect(read("char hazaar do sau")).toBe(4200);
    expect(read("do hazaar paanch sau")).toBe(2500);
  });

  it("reads half and quarter words", () => {
    expect(read("dhai hazaar")).toBe(2500);
    expect(read("derh hazaar")).toBe(1500);
    expect(read("sarhay char hazaar")).toBe(4500);
    expect(read("sawa do hazaar")).toBe(2250);
    expect(read("paune char hazaar")).toBe(3750);
  });

  it("reads small counting words", () => {
    expect(read("teen")).toBe(3);
    expect(read("paanch")).toBe(5);
    expect(read("bees")).toBe(20);
  });

  it("reads lakh", () => {
    expect(read("do lakh")).toBe(200000);
  });

  it("returns null on non numbers", () => {
    expect(read("suit")).toBeNull();
    expect(read("assalam")).toBeNull();
  });

  it("does not run two separate numbers together", () => {
    const toks = "3 suits 4200".split(" ");
    const first = readNumber(toks, 0);
    expect(first?.value).toBe(3);
    expect(first?.end).toBe(1);
  });
});
