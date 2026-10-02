import { describe, expect, it } from "vitest";
import { en } from "@/lib/i18n/en";
import { roman } from "@/lib/i18n/roman";
import { urdu } from "@/lib/i18n/urdu";
import { getDict, greeting, LOCALES } from "@/lib/i18n";

const dicts = { en, roman, urdu };

describe("translations", () => {
  it("every language has every key", () => {
    const keys = Object.keys(en);
    for (const [name, dict] of Object.entries(dicts)) {
      const missing = keys.filter((k) => !(k in dict));
      expect(missing, `${name} is missing keys`).toEqual([]);
    }
  });

  it("no language has stray keys", () => {
    const keys = new Set(Object.keys(en));
    for (const [name, dict] of Object.entries(dicts)) {
      const extra = Object.keys(dict).filter((k) => !keys.has(k));
      expect(extra, `${name} has extra keys`).toEqual([]);
    }
  });

  it("nothing is left blank", () => {
    for (const [name, dict] of Object.entries(dicts)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.trim().length, `${name}.${key} is empty`).toBeGreaterThan(0);
      }
    }
  });

  it("holds the no em dash rule across every language", () => {
    for (const [name, dict] of Object.entries(dicts)) {
      for (const [key, value] of Object.entries(dict)) {
        expect(value.includes("—"), `${name}.${key} has an em dash`).toBe(false);
      }
    }
  });

  it("covers all three locales", () => {
    expect(LOCALES.map((l) => l.code).sort()).toEqual(["en", "roman", "urdu"]);
    for (const l of LOCALES) expect(getDict(l.code).appName.length).toBeGreaterThan(0);
  });

  it("greets by time of day", () => {
    expect(greeting(en, 8)).toBe(en.greetingMorning);
    expect(greeting(en, 14)).toBe(en.greetingAfternoon);
    expect(greeting(en, 21)).toBe(en.greetingEvening);
  });
});
