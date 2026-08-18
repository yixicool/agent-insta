import { formatIsoDate, formatPrice, formatScore, formatWeight } from './format';

describe('formatPrice', () => {
  it('renders USD with thousands separator', () => {
    expect(
      formatPrice({ amount: 1099.99, currency: 'USD', region: '美国 MSRP', variant: '标准套装' }),
    ).toBe('US$1,099.99');
  });

  it('omits decimals for whole CNY amounts', () => {
    expect(
      formatPrice({ amount: 2998, currency: 'CNY', region: '中国大陆官方价', variant: '标准套装' }),
    ).toBe('¥2,998');
  });
});

describe('formatIsoDate', () => {
  it('renders Chinese date form', () => {
    expect(formatIsoDate('2026-05-28')).toBe('2026 年 5 月 28 日');
  });

  it('accepts full ISO timestamps', () => {
    expect(formatIsoDate('2026-05-28T10:00:00.000Z')).toBe('2026 年 5 月 28 日');
  });

  it('returns input unchanged when unparseable so data issues stay visible', () => {
    expect(formatIsoDate('未公开')).toBe('未公开');
  });
});

describe('formatScore and formatWeight', () => {
  it('drops decimals for whole scores', () => {
    expect(formatScore(82)).toBe('82');
    expect(formatScore(82.5)).toBe('82.5');
    expect(formatScore(Number.NaN)).toBe('—');
  });

  it('appends gram unit', () => {
    expect(formatWeight(145)).toBe('145 g');
  });
});
