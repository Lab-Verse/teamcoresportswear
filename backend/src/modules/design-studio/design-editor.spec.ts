import { randomUUID } from 'crypto';
import {
  validDocument,
  validTemplate,
  inspectDesign,
  DesignDocument,
  TemplateSpec,
} from './design-contract';
import { renderDesign } from './design-render';
import { garmentPaths } from './garment-geometry';
const spec: TemplateSpec = {
  garment: 'hoodie',
  publicationMode: 'design_brief',
  fabric: 'To confirm',
  fit: 'To confirm',
  neckline: 'Hood',
  sizeGuide: 'To confirm',
  colours: ['#ffffff'],
  methods: ['Print'],
  patterns: ['plain', 'diagonal', 'dots'],
  sizes: [{ label: 'M', colour: '#ffffff', variantId: randomUUID() }],
  zones: [
    {
      id: 'front',
      label: 'Full front',
      side: 'front',
      width: 490,
      height: 565,
      x: 55,
      y: 20,
      previewWidth: 490,
      previewHeight: 565,
    },
  ],
  images: { front: '/uploads/products/test.png' },
  minimumQuantity: 1,
  increment: 1,
  minimumDpi: 150,
  fulfilment: 'made_to_order',
  sampleApproved: false,
  productionNotes: 'Design brief',
};
function document(): DesignDocument {
  return {
    schemaVersion: 1,
    templateId: randomUUID(),
    colour: '#ffffff',
    accent: '#c6010b',
    method: 'Print',
    pattern: 'plain',
    layers: [
      {
        id: randomUUID(),
        kind: 'path',
        zone: 'front',
        text: 'Freehand',
        colour: '#c6010b',
        font: 'Inter',
        x: 10,
        y: 10,
        width: 200,
        height: 100,
        rotation: 0,
        points: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        strokeWidth: 3,
      },
    ],
    quantities: { M: 1 },
    roster: [],
  };
}
describe('full surface design editor', () => {
  it('accepts safe pen paths and full-garment templates', () => {
    expect(validTemplate(spec)).toBe(true);
    expect(inspectDesign(document(), spec)).toEqual([]);
  });
  it('rejects unbounded strokes and malicious coordinate values', () => {
    const d = document();
    d.layers[0].points![0].x = Infinity;
    expect(validDocument(d)).toBe(false);
    d.layers[0].points = Array.from({ length: 401 }, () => ({ x: 0, y: 0 }));
    expect(validDocument(d)).toBe(false);
  });
  it('rejects invalid opacity and transforms', () => {
    const d = document();
    d.layers[0].opacity = 2;
    expect(validDocument(d)).toBe(false);
    d.layers[0].opacity = 0.5;
    d.layers[0].flipX = true;
    expect(validDocument(d)).toBe(true);
  });
  it('checks user placement rectangles against the real template', () => {
    const d = document();
    d.workAreas = { front: { x: 450, y: 0, width: 100, height: 100 } };
    expect(
      inspectDesign(d, spec).some((i) =>
        i.message.includes('placement guides'),
      ),
    ).toBe(true);
  });
  it('renders distinct garment silhouettes and clips artwork', () => {
    for (const garment of Object.keys(
      garmentPaths,
    ) as (keyof typeof garmentPaths)[]) {
      const svg = renderDesign(document(), { ...spec, garment }, 'front', {});
      expect(svg).toContain(garmentPaths[garment]);
      expect(svg).toContain('clip-path="url(#garment-front)"');
      expect(svg).toContain('<polyline');
    }
  });
  it('keeps old documents valid and escapes text in exports', () => {
    const d = document();
    d.layers[0] = {
      ...d.layers[0],
      kind: 'text',
      text: '<script>alert(1)</script>',
    };
    delete d.layers[0].points;
    delete d.layers[0].strokeWidth;
    expect(validDocument(d)).toBe(true);
    const svg = renderDesign(d, spec, 'front', {});
    expect(svg).not.toContain('<script>');
    expect(svg).toContain('&lt;script&gt;');
  });
  it('keeps editor selection out of production exports', () => {
    const d = document();
    expect(renderDesign(d, spec, 'front', {})).not.toContain(
      'stroke-dasharray="4 3"',
    );
    expect(
      renderDesign(d, spec, 'front', {}, 0, true, d.layers[0].id),
    ).toContain('stroke-dasharray="4 3"');
  });
});
