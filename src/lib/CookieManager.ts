import { browser } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

export class CookieManager {
	private cookies?: Cookies;

	constructor(cookies?: Cookies) {
		this.cookies = cookies;
	}

	set<T>(key: string, value: T, durationDays: number = 365): void {
		const serialized = JSON.stringify(value);

		if (browser) {
			const expires = new Date();
			expires.setDate(expires.getDate() + durationDays);
			document.cookie = `${key}=${encodeURIComponent(serialized)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
		} else if (this.cookies) {
			this.cookies.set(key, serialized, {
				path: '/',
				maxAge: durationDays * 24 * 60 * 60,
				sameSite: 'lax',
				httpOnly: false,
				secure: false
			});
		}
	}

	get<T>(key: string): T | null {
		try {
			let value: string | undefined;

			if (browser) {
				const cookies = document.cookie.split(';');
				const cookie = cookies.find((c) => c.trim().startsWith(`${key}=`));
				value = cookie?.split('=').slice(1).join('=');
			} else if (this.cookies) {
				value = this.cookies.get(key);
			}

			if (!value) return null;

			const decoded = decodeURIComponent(value.trim());
			return JSON.parse(decoded) as T;
		} catch {
			return null;
		}
	}

	delete(key: string): void {
		if (browser) {
			document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
		} else if (this.cookies) {
			this.cookies.delete(key, { path: '/' });
		}
	}

	has(key: string): boolean {
		return this.get(key) !== null;
	}
}
