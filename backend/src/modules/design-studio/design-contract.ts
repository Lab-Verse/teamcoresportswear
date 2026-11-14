/** Versioned business document. Coordinates are millimetres within a print zone. */
export type Side = 'front' | 'back' | 'left' | 'right';
export type Layer = {
  id: string;
  zone: string;
  kind: 'text' | 'image' | 'name' | 'number' | 'graphic' | 'path';
  opacity?: number;
  flipX?: boolean;
  flipY?: boolean;
  locked?: boolean;
  points?: { x: number; y: number }[];
  strokeWidth?: number;
  text: string;
  assetId?: string;
  colour: string;
  font: 'Inter' | 'Barlow Condensed';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
};
export type DesignDocument = {
  schemaVersion: 1;
  templateId: string;
  colour: string;
  accent: string;
  method: string;
  pattern:
    | 'plain'
    | 'stripe'
    | 'chevron'
    | 'diagonal'
    | 'hoops'
    | 'split'
    | 'dots';
  workAreas?: Record<
    string,
    { x: number; y: number; width: number; height: number }
  >;
  layers: Layer[];
  quantities: Record<string, number>;
  roster: { name: string; number: string; size: string }[];
};
export type TemplateSpec = {
  garment?: 'tee' | 'polo' | 'hoodie' | 'long-sleeve' | 'jersey' | 'shorts';
  publicationMode?: 'production' | 'design_brief';
  fabric: string;
  fit: string;
  neckline: string;
  sizeGuide: string;
  colours: string[];
  methods: string[];
  patterns: string[];
  sizes: { label: string; colour: string; variantId: string }[];
  zones: {
    id: string;
    label: string;
    side: Side;
    width: number;
    height: number;
    x: number;
    y: number;
    previewWidth: number;
    previewHeight: number;
  }[];
  images: Partial<Record<Side, string>>;
  minimumQuantity: number;
  increment: number;
  minimumDpi: number;
  fulfilment: 'stock' | 'made_to_order';
  productionNotes: string;
  sampleApproved: boolean;
};
export type DesignIssue = { level: 'error' | 'warning'; message: string };
const hex = /^#[0-9a-f]{6}$/i;
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const finite = (v: unknown, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const text = (v: unknown, max = 120) =>
  typeof v === 'string' &&
  v.length <= max &&
  !/[\x00-\x08\x0B\x0C\x0E-\x1F]/.test(v);
export function validTemplate(s: TemplateSpec): boolean {
  return (
    !!s &&
    (s.garment === undefined ||
      ['tee', 'polo', 'hoodie', 'long-sleeve', 'jersey', 'shorts'].includes(
        s.garment,
      )) &&
    (s.publicationMode === undefined ||
      ['production', 'design_brief'].includes(s.publicationMode)) &&
    (s.publicationMode !== 'design_brief' ||
      s.fulfilment === 'made_to_order') &&
    ['stock', 'made_to_order'].includes(s.fulfilment) &&
    (
      ['fabric', 'fit', 'neckline', 'sizeGuide', 'productionNotes'] as const
    ).every((k) => text(s[k], 2000)) &&
    typeof s.sampleApproved === 'boolean' &&
    Array.isArray(s.colours) &&
    s.colours.length > 0 &&
    s.colours.length <= 30 &&
    s.colours.every((c) => hex.test(c)) &&
    Array.isArray(s.methods) &&
    s.methods.length > 0 &&
    s.methods.length <= 8 &&
    s.methods.every((m) => text(m, 60) && m.length > 0) &&
    Array.isArray(s.patterns) &&
    s.patterns.length > 0 &&
    s.patterns.every((p) =>
      [
        'plain',
        'stripe',
        'chevron',
        'diagonal',
        'hoops',
        'split',
        'dots',
      ].includes(p),
    ) &&
    (s.fulfilment !== 'stock' || s.patterns.every((p) => p === 'plain')) &&
    Array.isArray(s.sizes) &&
    s.sizes.length > 0 &&
    s.sizes.length <= 100 &&
    s.sizes.every(
      (v) =>
        !!v &&
        text(v.label, 20) &&
        /^[\w .+-]{1,20}$/.test(v.label) &&
        !['__proto__', 'prototype', 'constructor'].includes(v.label) &&
        uuid.test(v.variantId) &&
        s.colours.includes(v.colour),
    ) &&
    new Set(s.sizes.map((v) => v.label + v.colour)).size === s.sizes.length &&
    new Set(s.sizes.map((v) => v.variantId)).size === s.sizes.length &&
    s.colours.every((c) => s.sizes.some((v) => v.colour === c)) &&
    Array.isArray(s.zones) &&
    s.zones.length > 0 &&
    s.zones.length <= 8 &&
    s.zones.every((z) => !!z) &&
    new Set(s.zones.map((z) => z.id)).size === s.zones.length &&
    s.zones.every(
      (z) =>
        /^[a-z][a-z0-9-]{0,30}$/.test(z.id) &&
        text(z.label, 60) &&
        ['front', 'back', 'left', 'right'].includes(z.side) &&
        finite(z.width, 10, 1000) &&
        finite(z.height, 10, 1000) &&
        finite(z.x, 0, 600) &&
        finite(z.y, 0, 650) &&
        finite(z.previewWidth, 10, 500) &&
        finite(z.previewHeight, 10, 600) &&
        z.x + z.previewWidth <= 600 &&
        z.y + z.previewHeight <= 650,
    ) &&
    !!s.images &&
    typeof s.images === 'object' &&
    Object.keys(s.images).every((k) =>
      ['front', 'back', 'left', 'right'].includes(k),
    ) &&
    Object.values(s.images).every(
      (v) =>
        typeof v === 'string' &&
        /^\/uploads\/products\/[a-zA-Z0-9_.-]+\.(png|jpg|jpeg|webp)$/.test(v),
    ) &&
    Number.isInteger(s.minimumQuantity) &&
    finite(s.minimumQuantity, 1, 100000) &&
    Number.isInteger(s.increment) &&
    finite(s.increment, 1, 100000) &&
    finite(s.minimumDpi, 72, 600)
  );
}
export function validDocument(d: DesignDocument): boolean {
  if (
    !d ||
    d.schemaVersion !== 1 ||
    !uuid.test(d.templateId) ||
    !hex.test(d.colour) ||
    !hex.test(d.accent) ||
    !text(d.method, 60) ||
    ![
      'plain',
      'stripe',
      'chevron',
      'diagonal',
      'hoops',
      'split',
      'dots',
    ].includes(d.pattern) ||
    !Array.isArray(d.layers) ||
    d.layers.length > 120 ||
    !Array.isArray(d.roster) ||
    d.roster.length > 200 ||
    !d.quantities ||
    typeof d.quantities !== 'object' ||
    Array.isArray(d.quantities) ||
    Object.keys(d.quantities).length > 30
  )
    return false;
  return (
    (d.workAreas === undefined ||
      (!!d.workAreas &&
        typeof d.workAreas === 'object' &&
        !Array.isArray(d.workAreas) &&
        Object.keys(d.workAreas).length <= 8 &&
        Object.entries(d.workAreas).every(
          ([key, a]) =>
            /^[a-z][a-z0-9-]{0,30}$/.test(key) &&
            !!a &&
            finite(a.x, 0, 1000) &&
            finite(a.y, 0, 1000) &&
            finite(a.width, 2, 1000) &&
            finite(a.height, 2, 1000),
        ))) &&
    d.layers.every((l) => !!l) &&
    new Set(d.layers.map((l) => l.id)).size === d.layers.length &&
    new Set(d.layers.filter((l) => l.kind === 'image').map((l) => l.assetId))
      .size <= 20 &&
    d.layers.every(
      (l) =>
        uuid.test(l.id) &&
        text(l.zone, 32) &&
        ['text', 'image', 'name', 'number', 'graphic', 'path'].includes(
          l.kind,
        ) &&
        (l.opacity === undefined || finite(l.opacity, 0.05, 1)) &&
        (['flipX', 'flipY', 'locked'] as const).every(
          (k) => l[k] === undefined || typeof l[k] === 'boolean',
        ) &&
        (l.kind !== 'path' ||
          (Array.isArray(l.points) &&
            l.points.length >= 2 &&
            l.points.length <= 400 &&
            l.points.every(
              (p) => !!p && finite(p.x, 0, 1) && finite(p.y, 0, 1),
            ) &&
            finite(l.strokeWidth, 0.5, 20))) &&
        text(l.text) &&
        (l.kind !== 'image' || uuid.test(l.assetId || '')) &&
        hex.test(l.colour) &&
        ['Inter', 'Barlow Condensed'].includes(l.font) &&
        finite(l.x, 0, 1000) &&
        finite(l.y, 0, 1000) &&
        finite(l.width, 2, 1000) &&
        finite(l.height, 2, 1000) &&
        finite(l.rotation, -180, 180) &&
        (l.kind !== 'graphic' ||
          [
            'star',
            'bolt',
            'shield',
            'circle',
            'diamond',
            'triangle',
            'bar',
            'chevrons',
          ].includes(l.text)),
    ) &&
    Object.entries(d.quantities).every(
      ([k, v]) =>
        !['__proto__', 'prototype', 'constructor'].includes(k) &&
        /^[\w .+-]{1,20}$/.test(k) &&
        Number.isInteger(v) &&
        finite(v, 0, 100000),
    ) &&
    d.roster.every(
      (r) =>
        !!r &&
        text(r.name, 60) &&
        typeof r.number === 'string' &&
        /^\d{0,4}$/.test(r.number) &&
        text(r.size, 20),
    )
  );
}
export function inspectDesign(
  d: DesignDocument,
  spec: TemplateSpec,
  assets: Record<string, { width: number; height: number }> = {},
): DesignIssue[] {
  const issues: DesignIssue[] = [];
  const error = (message: string) => issues.push({ level: 'error', message });
  if (!validDocument(d))
    return [{ level: 'error', message: 'The design document is invalid.' }];
  if (
    !spec.colours.includes(d.colour) ||
    !spec.methods.includes(d.method) ||
    !spec.patterns.includes(d.pattern)
  )
    error('Choose supported colours, method and pattern.');
  const sizes = spec.sizes
    .filter((s) => s.colour === d.colour)
    .map((s) => s.label);
  for (const [id, a] of Object.entries(d.workAreas || {})) {
    const z = spec.zones.find((z) => z.id === id);
    if (!z || a.x + a.width > z.width || a.y + a.height > z.height)
      error('Keep placement guides inside the template canvas.');
  }
  const total = Object.values(d.quantities).reduce((a, b) => a + b, 0);
  if (total < spec.minimumQuantity || total % spec.increment !== 0)
    error(
      `Order at least ${spec.minimumQuantity}, in multiples of ${spec.increment}.`,
    );
  for (const [size, qty] of Object.entries(d.quantities))
    if (qty > 0 && !sizes.includes(size))
      error(`Size ${size} is not available in this colour.`);
  for (const side of ['front', 'back', 'left', 'right'])
    if (
      d.layers.filter(
        (l) => spec.zones.find((z) => z.id === l.zone)?.side === side,
      ).length > 30
    )
      error('Use at most 30 layers per side.');
  for (const l of d.layers) {
    const z = spec.zones.find((z) => z.id === l.zone);
    if (!z) {
      error('A layer uses an unavailable print area.');
      continue;
    }
    const rad = (l.rotation * Math.PI) / 180;
    const w =
      Math.abs(l.width * Math.cos(rad)) + Math.abs(l.height * Math.sin(rad));
    const h =
      Math.abs(l.width * Math.sin(rad)) + Math.abs(l.height * Math.cos(rad));
    if (
      l.x + l.width / 2 - w / 2 < -0.01 ||
      l.y + l.height / 2 - h / 2 < -0.01 ||
      l.x + l.width / 2 + w / 2 > z.width + 0.01 ||
      l.y + l.height / 2 + h / 2 > z.height + 0.01
    )
      error(
        'Keep every layer, including rotated corners, inside its print area.',
      );
    if (l.kind === 'text' && !l.text.trim())
      error('Remove or complete empty text layers.');
    if (['text', 'name', 'number'].includes(l.kind)) {
      const labels =
        l.kind === 'text'
          ? [l.text]
          : d.roster.map((r) => (l.kind === 'name' ? r.name : r.number));
      if (
        labels.some(
          (label) =>
            Math.min(
              l.height * 0.85,
              l.width / Math.max(label.length * 0.65, 1),
            ) < 3,
        )
      )
        issues.push({
          level: 'warning',
          message:
            'Some lettering is very small. Enlarge it or ask TEAM CORE to confirm readability in the production proof.',
        });
    }
    if ((l.kind === 'name' || l.kind === 'number') && !d.roster.length)
      error('Add your squad to use player names or numbers.');
    if (l.kind === 'image') {
      const a = assets[l.assetId!];
      if (!a) error('An artwork file is missing or unavailable.');
      else if (
        Math.min(a.width / (l.width / 25.4), a.height / (l.height / 25.4)) <
        spec.minimumDpi
      )
        error(
          `A logo is below ${spec.minimumDpi} DPI at this size. Reduce its printed size or upload a larger original.`,
        );
    }
  }
  if (!d.layers.length) error('Add at least one logo, graphic or text layer.');
  if (d.roster.length) {
    if (d.roster.length !== total)
      error('Squad rows must match the total shirt quantity.');
    for (const size of new Set([...sizes, ...d.roster.map((r) => r.size)]))
      if (
        d.roster.filter((r) => r.size === size).length !==
        (d.quantities[size] || 0)
      )
        error(`Squad rows for ${size} must match the size quantity.`);
    const numbers = d.roster.map((r) => r.number).filter(Boolean);
    if (new Set(numbers).size !== numbers.length)
      issues.push({
        level: 'warning',
        message: 'Some players share a number. Confirm this is intentional.',
      });
  }
  return issues.filter(
    (issue, i, all) => all.findIndex((x) => x.message === issue.message) === i,
  );
}
