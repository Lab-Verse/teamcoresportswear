import { BadRequestException } from '@nestjs/common';
const zeroDecimal = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
]);
export function minorAmount(value: number, currency: string): number {
  if (!/^[A-Z]{3}$/.test(currency) || !Number.isFinite(value) || value <= 0)
    throw new BadRequestException('Invalid payment amount or currency');
  // ISK and UGX have special Stripe rules; do not accept them without explicit support.
  if (['ISK', 'UGX'].includes(currency))
    throw new BadRequestException('Currency is not enabled for checkout');
  const multiplier = zeroDecimal.has(currency) ? 1 : 100;
  const minor = Math.round(value * multiplier);
  if (
    Math.abs(minor - value * multiplier) > 0.00001 ||
    !Number.isSafeInteger(minor)
  )
    throw new BadRequestException(
      'Amount cannot be represented in the payment currency',
    );
  return minor;
}
export function assertQuantity(
  quantity: number,
  minimum: number,
  increment: number,
) {
  if (
    !Number.isInteger(quantity) ||
    quantity < minimum ||
    quantity > 1000000 ||
    (quantity - minimum) % increment !== 0
  )
    throw new BadRequestException(
      `Quantity must start at ${minimum} and increase by ${increment}`,
    );
}
export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
