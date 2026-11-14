import { describe, expect, it } from "vitest";
import {
  chooseOption,
  effectiveSelection,
  productFacts,
  productOptions,
  selectedVariant,
  swatch,
} from "./product-options";
import type { ProductVariant } from "@/types";
const variant = (id: string, colour: string, size: string, isActive = true) =>
  ({
    id,
    sku: id,
    isActive,
    attributeValues: [
      { attributeKey: { name: "Color" }, attributeValue: { value: colour } },
      { attributeKey: { name: "Size" }, attributeValue: { value: size } },
    ],
  }) as ProductVariant;
describe("visual product configuration", () => {
  it("resolves exact real variants and removes incompatible choices when switching colour", () => {
    const { groups, rows } = productOptions([
      variant("red-s", "Red", "S"),
      variant("red-m", "Red", "M"),
      variant("blue-m", "Blue", "M"),
      variant("hidden", "Blue", "S", false),
    ]);
    expect(selectedVariant(groups, rows, { colour: "Red" })).toBeUndefined();
    expect(
      selectedVariant(groups, rows, { colour: "Red", size: "S" })?.id,
    ).toBe("red-s");
    const next = chooseOption(
      groups,
      rows,
      { colour: "Red", size: "S" },
      "colour",
      "Blue",
    );
    expect(next).toEqual({ colour: "Blue" });
    expect(selectedVariant(groups, rows, { ...next, size: "M" })?.id).toBe(
      "blue-m",
    );
    expect(
      selectedVariant(groups, rows, { colour: "Blue", size: "S" }),
    ).toBeUndefined();
  });
  it("preselects single material choices without guessing a scissor length", () => {
    const variants = ['4.5"', '6.0"'].map(
      (value, i) =>
        ({
          id: String(i),
          sku: String(i),
          isActive: true,
          attributeValues: [
            {
              attributeKey: { name: "Scissor Steel / Material" },
              attributeValue: { value: "J2 Stainless Steel" },
            },
            {
              attributeKey: { name: "Size (Inches)" },
              attributeValue: { value },
            },
          ],
        }) as ProductVariant,
    );
    const { groups, rows } = productOptions(variants);
    const selected = effectiveSelection(groups, {});
    expect(selected["scissor steel / material"]).toBe("J2 Stainless Steel");
    expect(selectedVariant(groups, rows, selected)).toBeUndefined();
    expect(
      selectedVariant(groups, rows, { ...selected, "size (inches)": '6.0"' })
        ?.id,
    ).toBe("1");
  });
  it("keeps hex colour labels readable and does not fabricate unknown colours", () => {
    const v = variant("one", "#c6010b", "M");
    v.attributeValues![0].attributeValue!.displayValue = "Burgundy";
    const { groups } = productOptions([v]);
    expect(groups[0].choices[0].label).toBe("Burgundy");
    expect(swatch("#c6010b", "Burgundy")).toBe("#c6010b");
    expect(swatch("Custom", "Custom")).toBeUndefined();
  });
  it("requires a distinguishing choice for duplicate combinations", () => {
    const { groups, rows } = productOptions([
      variant("a", "Red", "M"),
      variant("b", "Red", "M"),
    ]);
    const selected = effectiveSelection(groups, {});
    expect(selectedVariant(groups, rows, selected)).toBeUndefined();
    expect(
      selectedVariant(groups, rows, { ...selected, _style: "b" })?.id,
    ).toBe("b");
  });
  it("extracts reference tiers and specifications as text", () => {
    const { facts, tiers } = productFacts(
      "<p><strong>Material:</strong> Cotton &amp; polyester</p><ul><li>1–50 units: USD 13.00 per Piece (FOB)</li></ul>",
    );
    expect(facts).toEqual([{ name: "Material", value: "Cotton & polyester" }]);
    expect(tiers[0]).toEqual({
      range: "1–50",
      currency: "USD",
      price: 13,
      unit: "Piece (FOB)",
    });
  });
  it("shows structured pricing only with an explicit catalogue currency", () => {
    const pricing =
      "<p><strong>Tracksuit Pricing:</strong> 1-49: 45.00 | 50-99: 43.00</p>";
    expect(productFacts(pricing).tiers).toHaveLength(0);
    expect(
      productFacts(
        pricing +
          "<p><strong>Reference prices (USD):</strong> Confirm with TEAM CORE</p>",
      ).tiers,
    ).toHaveLength(2);
  });
});
