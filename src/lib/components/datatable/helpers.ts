import type { ColumnConfig } from './types.js';

export function formatCellValue(value: unknown, column: ColumnConfig): string {
	if (value === null || value === undefined) return '—';

	switch (column.renderType) {
		case 'currency':
			return typeof value === 'number'
				? new Intl.NumberFormat('en-US', {
						style: 'currency',
						currency: 'USD',
						maximumFractionDigits: 2
					}).format(value)
				: String(value);
		case 'percent':
			return typeof value === 'number' ? `${(value * 100).toFixed(2)}%` : String(value);
		default:
			return String(value);
	}
}

export function getPaginationRange(current: number, totalPages: number): (number | string)[] {
	// always show 5 pages
	let showRange = 5;
	const range: (number | string)[] = [];

	if (totalPages <= showRange) {
		for (let i = 1; i <= totalPages; i++) {
			range.push(i);
		}
		return range;
	}

	for (let i = 1; i <= showRange; i++) {
		if (current < showRange - 1) {
			range.push(i);
		} else if (current + 2 >= totalPages) {
			let offset = showRange;
			range.push(totalPages - offset + i);
		} else {
			let offset = current - 3;
			range.push(offset + i);
		}
	}

	return range;
}
