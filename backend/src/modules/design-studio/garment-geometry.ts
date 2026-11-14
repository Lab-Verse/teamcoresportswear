import type { TemplateSpec, Side } from './design-contract';
export const garmentPaths = {
  tee: 'M190 85 L245 60 Q300 100 355 60 L410 85 L515 165 L460 255 L407 222 L420 575 Q300 600 180 575 L193 222 L140 255 L85 165 Z',
  polo: 'M190 85 L245 60 Q300 95 355 60 L410 85 L515 165 L460 255 L407 222 L420 575 L180 575 L193 222 L140 255 L85 165 Z',
  hoodie:
    'M180 105 L240 85 Q225 18 300 20 Q375 18 360 85 L420 105 L545 440 L477 465 L410 270 L425 585 L175 585 L190 270 L123 465 L55 440 Z',
  'long-sleeve':
    'M180 85 L245 60 Q300 100 355 60 L420 85 L545 450 L477 475 L410 245 L425 580 L175 580 L190 245 L123 475 L55 450 Z',
  jersey:
    'M210 70 L255 55 Q300 100 345 55 L390 70 Q350 180 415 225 L425 580 L175 580 L185 225 Q250 180 210 70 Z',
  shorts:
    'M170 110 Q300 95 430 110 L470 530 L315 550 L300 300 L285 550 L130 530 Z',
};
export function garmentPath(spec: TemplateSpec) {
  return garmentPaths[spec.garment || 'tee'];
}
export function garmentSeams(spec: TemplateSpec, side: Side) {
  const kind = spec.garment || 'tee';
  if (kind === 'shorts')
    return '<path d="M170 135Q300 120 430 135 M300 130V300 M182 150L166 270 M418 150L434 270"/><path d="M287 135L284 195M313 135L316 195"/>';
  if (kind === 'hoodie')
    return `<path d="M240 85Q300 160 360 85 M240 85Q255 40 300 40Q345 40 360 85 M180 558H420"/>${side === 'front' ? '<path d="M240 390H360L380 485H220Z M280 110V240M320 110V240"/>' : '<path d="M240 85Q235 200 300 215Q365 200 360 85"/>'}`;
  if (kind === 'polo' && side === 'front')
    return '<path d="M245 60L265 135L300 100L335 135L355 60 M300 100V210 M290 100V210"/><circle cx="295" cy="145" r="2"/><circle cx="295" cy="175" r="2"/>';
  return `<path d="M${kind === 'jersey' ? '255 55' : '245 60'}Q300 ${side === 'back' ? '95' : '143'} ${kind === 'jersey' ? '345 55' : '355 60'}"/>`;
}
