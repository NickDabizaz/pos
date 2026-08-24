import { describe, expect, it } from "vitest";

import {
  calculateSelisih,
  calculateTotalKasDiharapkan,
  getSelisihStatus,
} from "@/app/tutup-kasir/lib/calculations";

describe("calculateTotalKasDiharapkan", () => {
  it("adds the opening float to cash sales", () => {
    expect(calculateTotalKasDiharapkan({ modalawal: 200000, totaltunai: 450000 })).toBe(650000);
  });
});

describe("calculateSelisih", () => {
  it("is positive when actual cash exceeds the expected amount", () => {
    expect(calculateSelisih(700000, 650000)).toBe(50000);
  });

  it("is negative when actual cash is short of the expected amount", () => {
    expect(calculateSelisih(600000, 650000)).toBe(-50000);
  });

  it("is zero when actual cash matches exactly", () => {
    expect(calculateSelisih(650000, 650000)).toBe(0);
  });
});

describe("getSelisihStatus", () => {
  it("classifies a zero difference as PAS", () => {
    expect(getSelisihStatus(0)).toBe("PAS");
  });

  it("classifies a positive difference as SURPLUS", () => {
    expect(getSelisihStatus(1)).toBe("SURPLUS");
  });

  it("classifies a negative difference as MINUS", () => {
    expect(getSelisihStatus(-1)).toBe("MINUS");
  });
});
