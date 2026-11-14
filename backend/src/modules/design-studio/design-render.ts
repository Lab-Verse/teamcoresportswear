import type { DesignDocument, Side, TemplateSpec } from './design-contract';
import { garmentPath, garmentPaths, garmentSeams } from './garment-geometry';
const esc = (value: string) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&apos;',
      })[c]!,
  );
export const shirtPath = garmentPaths.tee;
/** Shared, escaped SVG renderer for browser editing and authenticated server proofs. */
export function renderDesign(
  d: DesignDocument,
  spec: TemplateSpec,
  side: Side,
  assets: Record<string, string>,
  player = 0,
  guides = false,
  selected = '',
) {
  const silhouette = garmentPath(spec);
  const zones = spec.zones.filter((z) => z.side === side);
  const layers = d.layers
    .filter((l) => zones.some((z) => z.id === l.zone))
    .map((l) => {
      const z = zones.find((z) => z.id === l.zone)!;
      const sx = z.previewWidth / z.width,
        sy = z.previewHeight / z.height;
      const label =
        l.kind === 'name'
          ? d.roster[player]?.name || 'PLAYER'
          : l.kind === 'number'
            ? d.roster[player]?.number || '00'
            : l.text;
      let shape = '';
      if (l.kind === 'image')
        shape = assets[l.assetId!]
          ? `<image width="${l.width}" height="${l.height}" href="${esc(assets[l.assetId!])}" preserveAspectRatio="xMidYMid meet"/>`
          : `<rect width="${l.width}" height="${l.height}" fill="#eee" stroke="#c6010b"/><text x="2" y="8" font-size="5">Artwork unavailable</text>`;
      else if (l.kind === 'graphic') {
        const paths = {
          star: 'M50 2L62 36L98 36L69 57L80 93L50 72L20 93L31 57L2 36L38 36Z',
          bolt: 'M56 0L12 58H43L32 100L89 40H56L70 0Z',
          shield: 'M10 10L50 0L90 10V52Q90 80 50 100Q10 80 10 52Z',
          circle: 'M50 2A48 48 0 1 0 50 98A48 48 0 1 0 50 2Z',
          diamond: 'M50 0L100 50L50 100L0 50Z',
          triangle: 'M50 0L100 100H0Z',
          bar: 'M0 0H100V100H0Z',
          chevrons:
            'M0 0L50 30L100 0V20L50 50L0 20ZM0 50L50 80L100 50V70L50 100L0 70Z',
        };
        shape = `<svg width="${l.width}" height="${l.height}" viewBox="0 0 100 100"><path d="${paths[l.text as keyof typeof paths]}" fill="${esc(l.colour)}"/></svg>`;
      } else if (l.kind === 'path') {
        shape = `<polyline points="${(l.points || []).map((p) => `${p.x * l.width},${p.y * l.height}`).join(' ')}" fill="none" stroke="${esc(l.colour)}" stroke-width="${l.strokeWidth || 2}" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else
        shape = `<text x="${l.width / 2}" y="${l.height / 2}" dominant-baseline="central" text-anchor="middle" font-family="${esc(l.font)},Arial,sans-serif" font-weight="700" font-size="${Math.min(l.height * 0.85, l.width / Math.max(label.length * 0.65, 1))}" fill="${esc(l.colour)}">${esc(label)}</text>`;
      return `<g data-layer="${esc(l.id)}" data-locked="${!!l.locked}" transform="translate(${z.x + l.x * sx} ${z.y + l.y * sy}) scale(${sx} ${sy}) rotate(${l.rotation} ${l.width / 2} ${l.height / 2})"><g opacity="${l.opacity ?? 1}" transform="translate(${l.flipX ? l.width : 0} ${l.flipY ? l.height : 0}) scale(${l.flipX ? -1 : 1} ${l.flipY ? -1 : 1})">${shape}</g>${selected === l.id ? `<rect width="${l.width}" height="${l.height}" fill="none" stroke="#c6010b" stroke-width="1.5" stroke-dasharray="4 3" pointer-events="none"/>` : ''}</g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 650" role="img" aria-label="${esc(side)} garment design preview">
    <defs><clipPath id="garment-${side}"><path d="${silhouette}"/></clipPath><linearGradient id="shade-${side}"><stop stop-color="#000" stop-opacity=".10"/><stop offset=".25" stop-color="#fff" stop-opacity=".05"/><stop offset=".75" stop-color="#fff" stop-opacity=".05"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient><pattern id="dots-${side}" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="5" fill="${esc(d.accent)}"/></pattern><filter id="texture-${side}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.2126 -0.7152 -0.0722 1 0"/></filter></defs>
    <ellipse cx="300" cy="612" rx="155" ry="12" fill="#373435" opacity=".08"/>
    <path d="${silhouette}" fill="${esc(d.colour)}" stroke="#373435" stroke-opacity=".25" stroke-width="2"/>
    <g clip-path="url(#garment-${side})">${d.pattern === 'stripe' ? `<path d="M220 0H260V600H220Z" fill="${esc(d.accent)}"/>` : d.pattern === 'chevron' ? `<path d="M100 145L300 260L500 145V220L300 335L100 220Z" fill="${esc(d.accent)}"/>` : ''}<path d="${silhouette}" fill="url(#shade-${side})"/></g>
    ${spec.images[side] ? `<image href="${esc(spec.images[side])}" width="600" height="650" filter="url(#texture-${side})" clip-path="url(#garment-${side})"/>` : ''}
    <g clip-path="url(#garment-${side})">${d.pattern === 'split' ? `<rect x="300" width="300" height="650" fill="${esc(d.accent)}"/>` : d.pattern === 'diagonal' ? `<path d="M0 500L600 50V150L0 600Z" fill="${esc(d.accent)}"/>` : d.pattern === 'hoops' ? [180, 300, 420].map((y) => `<rect y="${y}" width="600" height="50" fill="${esc(d.accent)}"/>`).join('') : d.pattern === 'dots' ? `<rect width="600" height="650" fill="url(#dots-${side})"/>` : ''}</g>
    <g clip-path="url(#garment-${side})">${layers}</g>
    <g fill="none" stroke="#373435" stroke-opacity=".3" stroke-width="3">${garmentSeams(spec, side)}</g>
    ${guides ? zones.map((z) => `<rect x="${z.x}" y="${z.y}" width="${z.previewWidth}" height="${z.previewHeight}" rx="2" fill="none" stroke="#c6010b" stroke-dasharray="5 5" opacity=".6"/><text x="${z.x}" y="${z.y - 9}" fill="#534d4e" font-family="Arial" font-size="11">${z.id.includes('shoulder') ? esc(z.id.includes('-left-') ? 'Left shoulder' : 'Right shoulder') : `${esc(z.label)} · ${z.width} × ${z.height} mm`}</text>`).join('') : ''}
    ${
      guides
        ? zones
            .flatMap((z) => {
              const a = d.workAreas?.[z.id];
              return a
                ? [
                    `<rect x="${z.x + (a.x * z.previewWidth) / z.width}" y="${z.y + (a.y * z.previewHeight) / z.height}" width="${(a.width * z.previewWidth) / z.width}" height="${(a.height * z.previewHeight) / z.height}" fill="none" stroke="#257654" stroke-width="2" stroke-dasharray="8 4" pointer-events="none"/>`,
                  ]
                : [];
            })
            .join('')
        : ''
    }</svg>`;
}
