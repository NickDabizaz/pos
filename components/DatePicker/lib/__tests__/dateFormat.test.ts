import { describe, expect, it } from "vitest";

import { displayToIso, getCalendarDays, isoToDisplay, toIsoDate } from "@/components/DatePicker/lib/dateFormat";

describe("isoToDisplay", () => {
  it("converts an ISO date to dd/mm/yyyy", () => {
    expect(isoToDisplay("2026-08-17")).toBe("17/08/2026");
  });

  it("returns an empty string for an empty input", () => {
    expect(isoToDisplay("")).toBe("");
  });

  it("returns an empty string for a malformed input", () => {
    expect(isoToDisplay("17/08/2026")).toBe("");
  });
});

describe("displayToIso", () => {
  it("parses dd/mm/yyyy into an ISO date", () => {
    expect(displayToIso("17/08/2026")).toBe("2026-08-17");
  });

  it("accepts dash and dot separators", () => {
    expect(displayToIso("17-08-2026")).toBe("2026-08-17");
    expect(displayToIso("17.08.2026")).toBe("2026-08-17");
  });

  it("accepts single-digit day and month", () => {
    expect(displayToIso("7/8/2026")).toBe("2026-08-07");
  });

  it("returns null for an invalid calendar date", () => {
    expect(displayToIso("31/02/2026")).toBeNull();
  });

  it("returns null for unparseable text", () => {
    expect(displayToIso("not a date")).toBeNull();
  });
});

describe("getCalendarDays", () => {
  it("returns 42 days (6 full weeks)", () => {
    expect(getCalendarDays(2026, 7)).toHaveLength(42);
  });

  it("starts the grid on a Sunday", () => {
    const days = getCalendarDays(2026, 7);
    expect(days[0].getDay()).toBe(0);
  });

  it("includes every day of the target month", () => {
    const days = getCalendarDays(2026, 7).map(toIsoDate);
    expect(days).toContain("2026-08-01");
    expect(days).toContain("2026-08-31");
  });
});
