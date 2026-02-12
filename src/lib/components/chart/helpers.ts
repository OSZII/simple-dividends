import type { ChartPoint } from './types.js';

/** Format a number as USD currency */
export function formatCurrency(value: number): string {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 2
	}).format(value);
}

/** Format a number as a percentage (expects 0-1 range) */
export function formatPercent(value: number): string {
	return `${(value * 100).toFixed(2)}%`;
}

/** Format a date as a short label (e.g. "Jan 23") */
export function formatDateShort(date: Date): string {
	return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format a date as month/year (e.g. "Jan '24") */
export function formatDateMonthYear(date: Date): string {
	return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/** Compute the extent [min, max] from an array of chart points on a given axis */
export function extent(data: ChartPoint[], axis: 'x' | 'y'): [number, number] {
	if (data.length === 0) return [0, 0];

	const values = data.map((d) => {
		const v = d[axis];
		return v instanceof Date ? v.getTime() : v;
	});

	return [Math.min(...values), Math.max(...values)];
}

/** Linearly interpolate between two values */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/** Clamp a value between min and max */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}
