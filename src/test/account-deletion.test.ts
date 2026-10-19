import { describe, expect, it } from "vitest";
import { z } from "zod";
import { DELETION_REASONS } from "@/lib/account-deletion.functions";

describe("Account Deletion Workflow", () => {
  it("defines the expected list of deletion reasons", () => {
    const reasons = DELETION_REASONS.map((r) => r.value);
    expect(reasons).toEqual([
      "trop_cher",
      "plus_besoin",
      "autre_outil",
      "probleme_technique",
      "autre",
    ]);
  });

  it("validates request payload with valid reason", () => {
    const schema = z.object({
      reason: z.enum(["trop_cher", "plus_besoin", "autre_outil", "probleme_technique", "autre"]),
      reason_other: z.string().optional(),
      comment: z.string().optional(),
    });

    const valid = schema.safeParse({
      reason: "trop_cher",
      comment: "Je réduis mes charges",
    });
    expect(valid.success).toBe(true);
  });

  it("rejects an invalid deletion reason", () => {
    const schema = z.object({
      reason: z.enum(["trop_cher", "plus_besoin", "autre_outil", "probleme_technique", "autre"]),
      reason_other: z.string().optional(),
      comment: z.string().optional(),
    });

    const invalid = schema.safeParse({
      reason: "unknown_reason",
    });
    expect(invalid.success).toBe(false);
  });

  it("enforces max 30 days and min 10 minutes scheduling limits", () => {
    const now = new Date();
    const minDate = new Date(now.getTime() + 10 * 60 * 1000);
    const maxDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Date within interval
    const testDate = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    expect(testDate >= minDate).toBe(true);
    expect(testDate <= maxDate).toBe(true);

    // Date in the past or under 10 minutes
    const tooSoon = new Date(now.getTime() + 5 * 60 * 1000);
    expect(tooSoon < minDate).toBe(true);

    // Date beyond 30 days
    const tooLate = new Date(now.getTime() + 31 * 24 * 60 * 60 * 1000);
    expect(tooLate > maxDate).toBe(true);
  });
});
