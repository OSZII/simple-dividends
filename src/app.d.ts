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
		label: string;
		title: string;
		infotext?: string;
		filterDescription?: string;
		options: FilterOption[];
		active: boolean;
		selected: string[];
	}
}

export { };
