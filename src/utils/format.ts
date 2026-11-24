import type { AreaUnit, DatasetId } from '../types.ts';

export function formatPropertyPrice(datasetId: DatasetId, value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (datasetId === 'hyderabad') {
    if (value >= 100) {
      return `₹${(value / 100).toFixed(2)} Cr (₹${value.toFixed(1)} L)`;
    }
    return `₹${value.toFixed(2)} L`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(2)}M ($${value.toFixed(1)}k)`;
  }
  return `$${value.toFixed(1)}k`;
}

export function formatShortPrice(datasetId: DatasetId, value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (datasetId === 'hyderabad') {
    return `₹${value.toFixed(1)}L`;
  }
  return `$${value.toFixed(1)}k`;
}

export function formatDeltaPrice(datasetId: DatasetId, delta: number): string {
  if (!Number.isFinite(delta)) return '—';
  const sign = delta >= 0 ? '+' : '-';
  const abs = Math.abs(delta);
  if (datasetId === 'hyderabad') {
    return `${sign}₹${abs.toFixed(2)}L`;
  }
  return `${sign}$${abs.toFixed(1)}k`;
}

export function formatRatePerSqFt(
  datasetId: DatasetId,
  ratePerSqFt: number,
  unit: AreaUnit = 'sqft'
): string {
  if (!Number.isFinite(ratePerSqFt)) return '—';
  const effectiveRate = unit === 'sqyd' ? Math.round(ratePerSqFt * 9) : ratePerSqFt;
  const suffix = unit === 'sqyd' ? '/sq.yd.' : '/sq.ft.';
  if (datasetId === 'hyderabad') {
    return `₹${effectiveRate.toLocaleString('en-IN')}${suffix}`;
  }
  return `$${effectiveRate.toLocaleString('en-US')}${suffix}`;
}

export function formatAreaValue(areaSqFt: number, unit: AreaUnit): string {
  if (!Number.isFinite(areaSqFt)) return '—';
  if (unit === 'sqyd') {
    return `${Math.round(areaSqFt / 9).toLocaleString()} sq.yds.`;
  }
  return `${areaSqFt.toLocaleString()} sq.ft.`;
}
