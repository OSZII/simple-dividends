// DataTable components for managing tabular data with sorting and pagination
//
// Usage:
//   import { Datatable, ColumnModal, RangeDisplay } from '$lib/components/datatable';
//   import type { ColumnConfig, SortState, SortDirection } from '$lib/components/datatable';

// Main component
export { default as Datatable } from './Datatable.svelte';

// Sub-components
export { default as ColumnModal } from './ColumnModal.svelte';
export { default as RangeDisplay } from './RangeDisplay.svelte';

// Types
export type { SortDirection, ColumnConfig, SortState } from './types.js';

// Helpers
export { formatCellValue, getPaginationRange } from './helpers.js';
