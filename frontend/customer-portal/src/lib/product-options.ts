import type { ProductVariant } from "@/types";

export type Choice = { value: string; label: string };
export type OptionGroup = {
  key: string;
  name: string;
  kind: "colour" | "size" | "other";
  choices: Choice[];
};
export type VariantOption = {
  variant: ProductVariant;
  values: Record<string, string>;
};
export type Selection = Record<string, string>;

export function productOptions(variants: ProductVariant[]) {
  const groups: OptionGroup[] = [];
  const rows: VariantOption[] = variants
    .filter((v) => v.isActive)
    .map((variant) => {
      const values: Selection = {};
      for (const a of variant.attributeValues || []) {
        const name = a.attributeKey?.name?.trim();
        const value = a.attributeValue?.value;
        if (!name || !value) continue;
        const kind = /^(colou?r)$/i.test(name)
          ? "colour"
          : /size|length/i.test(name)
            ? "size"
            : "other";
        const key = kind === "colour" ? "colour" : name.toLowerCase();
        let group = groups.find((g) => g.key === key);
        if (!group) {
          group = {
            key,
            name: kind === "colour" ? "Colour" : name,
            kind,
            choices: [],
          };
          groups.push(group);
        }
        if (!group.choices.some((c) => c.value === value))
          group.choices.push({
            value,
            label: a.attributeValue?.displayValue || value,
          });
        values[key] = value;
      }
      return { variant, values };
    });
  // Attribute-less or indistinguishable SKUs still need an explicit, valid choice.
  const signatures = rows.map((r) =>
    JSON.stringify(Object.entries(r.values).sort()),
  );
  if (
    new Set(signatures).size !== rows.length ||
    rows.some((r) => !Object.keys(r.values).length)
  ) {
    groups.push({
      key: "_style",
      name: "Design option",
      kind: "other",
      choices: rows.map((r) => ({ value: r.variant.id, label: r.variant.sku })),
    });
    rows.forEach((r) => {
      r.values._style = r.variant.id;
    });
  }
  groups.sort(
    (a, b) =>
      ({ colour: 0, other: 1, size: 2 })[a.kind] -
      { colour: 0, other: 1, size: 2 }[b.kind],
  );
  for (const g of groups.filter((g) => g.kind === "size"))
    g.choices.sort(
      (a, b) =>
        sizeOrder(a.label) - sizeOrder(b.label) ||
        a.label.localeCompare(b.label, undefined, { numeric: true }),
    );
  return { groups, rows };
}

function sizeOrder(label: string) {
  const family = /^women/i.test(label)
    ? 100
    : /^y(?=[xslm])/i.test(label)
      ? 200
      : 0;
  const size = label
    .toLowerCase()
    .replace(/^women[- ]?/, "")
    .replace(/^y(?=[xslm])/, "");
  const order = [
    "xxs",
    "xs",
    "s",
    "m",
    "l",
    "xl",
    "xxl",
    "xxxl",
    "4xl",
    "5xl",
    "6xl",
  ];
  const aliases: Record<string, string> = {
    small: "s",
    medium: "m",
    large: "l",
    "extra-large": "xl",
    "2xl": "xxl",
    "3xl": "xxxl",
  };
  const index = order.indexOf(aliases[size] || size);
  return family + (index >= 0 ? index : 50);
}

export function matches(row: VariantOption, selected: Selection) {
  return Object.entries(selected).every(
    ([key, value]) => row.values[key] === value,
  );
}
export function effectiveSelection(
  groups: OptionGroup[],
  selection: Selection,
): Selection {
  return Object.fromEntries(
    groups.flatMap((g) =>
      selection[g.key]
        ? [[g.key, selection[g.key]]]
        : g.choices.length === 1
          ? [[g.key, g.choices[0].value]]
          : [],
    ),
  );
}
export function chooseOption(
  groups: OptionGroup[],
  rows: VariantOption[],
  previous: Selection,
  key: string,
  value: string,
) {
  const next: Selection = { [key]: value };
  for (const g of groups) {
    if (g.key === key) continue;
    const old =
      previous[g.key] ||
      (g.choices.length === 1 ? g.choices[0].value : undefined);
    if (old && rows.some((r) => matches(r, { ...next, [g.key]: old })))
      next[g.key] = old;
  }
  return next;
}
export function selectedVariant(
  groups: OptionGroup[],
  rows: VariantOption[],
  selected: Selection,
) {
  if (!groups.every((g) => selected[g.key])) return undefined;
  const candidates = rows.filter((r) => matches(r, selected));
  return candidates.length === 1 ? candidates[0].variant : undefined;
}
export function swatch(value: string, label: string): string | undefined {
  if (/^#[a-f\d]{3}([a-f\d]{3})?$/i.test(value)) return value;
  const colours: Record<string, string> = {
    black: "#222222",
    white: "#ffffff",
    blue: "#346ac0",
    "royal blue": "#2458a6",
    navy: "#182b49",
    red: "#ba3037",
    burgundy: "#c6010b",
    maroon: "#702f3f",
    green: "#356a4c",
    forest: "#225943",
    yellow: "#ecc64c",
    gold: "#b99b53",
    orange: "#df823a",
    pink: "#db8fac",
    purple: "#805b9b",
    grey: "#929292",
    gray: "#929292",
    charcoal: "#18181b",
    brown: "#795443",
    beige: "#d1bca0",
    silver: "#b9bec5",
    cyan: "#42b5c8",
    turquoise: "#48aaa1",
    indigo: "#515589",
    violet: "#8253b5",
  };
  return colours[label.toLowerCase()] || colours[value.toLowerCase()];
}

function text(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}
// Display projection of existing catalogue details, never a checkout price engine.
export function productFacts(description = "") {
  const facts = [
    ...description.matchAll(
      /<p>\s*<strong>([\s\S]*?)<\/strong>([\s\S]*?)<\/p>/gi,
    ),
  ]
    .map((m) => ({ name: text(m[1]).replace(/:$/, ""), value: text(m[2]) }))
    .filter((f) => f.name && f.value);
  const tiers = [
    ...description.matchAll(
      /<li>(\d+(?:[–-]\d+|\+)?) units:\s*([A-Z]{3})\s*([\d.,]+)\s*per\s*([^<]*)<\/li>/g,
    ),
  ].map((m) => ({
    range: m[1],
    currency: m[2],
    price: Number(m[3].replace(/,/g, "")),
    unit: text(m[4]),
  }));
  const currency = facts
    .map((f) => f.name.match(/^Reference prices \(([A-Z]{3})\)$/)?.[1])
    .find(Boolean);
  if (!tiers.length && currency) {
    for (const fact of facts.filter((f) => /pricing$/i.test(f.name))) {
      for (const part of fact.value.split("|")) {
        const match = part
          .trim()
          .match(/^(\d+(?:[–-]\d+|\+)?):\s*(\d+(?:\.\d{1,4})?)$/);
        if (match && Number(match[2]) > 0)
          tiers.push({
            range: match[1],
            currency,
            price: Number(match[2]),
            unit: "unit",
          });
      }
    }
  }
  return { facts, tiers };
}
