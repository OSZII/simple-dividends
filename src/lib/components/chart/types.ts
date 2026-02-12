export interface ChartPoint {
	x: number | Date;
	y: number;
}

export interface AxisTickFormat {
	(value: number | Date): string;
}

export interface TooltipData {
	x: number;
	y: number;
	data: Record<string, unknown>;
}

export type LabelPosition = 'even' | 'above';
export type TextAnchor = 'start' | 'middle' | 'end';
