import { assertQuantity, minorAmount, roundMoney } from './commerce-rules';

describe('storefront commerce rules', () => {
  it('converts configured payment currencies without silently losing precision', () => {
    expect(minorAmount(1250.5, 'PKR')).toBe(125050);
    expect(minorAmount(1250, 'JPY')).toBe(1250);
    expect(() => minorAmount(1.001, 'PKR')).toThrow();
    expect(() => minorAmount(1.5, 'JPY')).toThrow();
    expect(() => minorAmount(1, 'ISK')).toThrow();
    expect(() => minorAmount(0, 'PKR')).toThrow();
    expect(() => minorAmount(Infinity, 'PKR')).toThrow();
  });
  it('enforces minimums and increments, including fractional and excessive input', () => {
    expect(() => assertQuantity(6, 6, 4)).not.toThrow();
    expect(() => assertQuantity(10, 6, 4)).not.toThrow();
    for (const value of [0, 5, 7, 6.5, 1000001, NaN]) {
      expect(() => assertQuantity(value, 6, 4)).toThrow();
    }
  });
  it('rounds server totals at currency boundaries', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(100.125)).toBe(100.13);
  });
});
