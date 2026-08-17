import { describe, expect, it } from "vitest";

import { matchesSearch } from "@/lib/textSearch";

describe("matchesSearch", () => {
  it("matches everything when the query is empty", () => {
    expect(matchesSearch(["Beras 5kg", "BRG-0001"], "")).toBe(true);
    expect(matchesSearch(["Beras 5kg", "BRG-0001"], "   ")).toBe(true);
  });

  it("matches case-insensitively against any field", () => {
    expect(matchesSearch(["Beras 5kg", "BRG-0001"], "beras")).toBe(true);
    expect(matchesSearch(["Beras 5kg", "BRG-0001"], "0001")).toBe(true);
  });

  it("returns false when no field contains the query", () => {
    expect(matchesSearch(["Beras 5kg", "BRG-0001"], "minyak")).toBe(false);
  });

  it("skips undefined fields without throwing", () => {
    expect(matchesSearch([undefined, "BRG-0001"], "0001")).toBe(true);
    expect(matchesSearch([undefined, undefined], "0001")).toBe(false);
  });
});
