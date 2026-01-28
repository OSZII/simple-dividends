// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
		// Define the filter types
	}
	interface FilterOption {
		value: string;
		label: string;
		description?: string;
	}

	interface Filter {
		id: string;
		type: 'checkbox' | 'two_sided_slider' | "radio";
		min?: number;
		max?: number;
		stepSize?: number;
		title: string;
		infotext?: string;
		filterDescription?: string;
		sections?: any[];
		options?: FilterOption[];
		active: boolean;
		selected: string | string[] | { min: number, max: number };
	}
}

export { };
