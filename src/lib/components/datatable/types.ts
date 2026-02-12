export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnConfig {
	key: string;
	label: string;
	sortable: boolean;
	enabled: boolean;
	width?: string;
	hidden?: boolean;
	align?: 'left' | 'center' | 'right';
	renderType?: 'text' | 'currency' | 'percent' | 'badge' | 'chart';
	// this is to modify values on the table confic level
	modify?: (value: any) => any;
}

export interface SortState {
	column: string | null;
	direction: SortDirection;
}
