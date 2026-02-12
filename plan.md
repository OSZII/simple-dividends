# Fix SSR Flash Issues Plan

## Problem

Two separate SSR hydration issues are causing visual "flashing" on page load:

1. **Column Preferences Flash**: Column order/visibility preferences stored in `localStorage` (via `PersistedState`) aren't available during SSR, causing columns to render with default config, then re-render with user preferences after hydration.

2. **Chart Component Flash**: LayerCake charts need DOM measurements to render. During SSR they're empty, then pop in after client hydration when the DOM is available.

## Solution Overview

1. **Cookie-Based Preferences**: Replace `localStorage` with cookies so preferences are available during SSR via SvelteKit's server-side `load` function
2. **Chart Loading State**: Add skeleton/loading state to Chart component that displays during SSR and hides once the chart is mounted on the client

---

## Part 1: Cookie Manager Implementation

### Step 1: Create CookieManager Utility

**File**: `/src/lib/CookieManager.ts`

Create a universal cookie manager class that works on both client and server:

```typescript
/**
 * CookieManager - Universal cookie handling for client and server
 *
 * Features:
 * - Works in both browser (document.cookie) and server (Request headers)
 * - Configurable expiration durations
 * - Type-safe serialization/deserialization
 * - Automatic cleanup of expired values
 *
 * Usage:
 *   // Client-side
 *   const manager = new CookieManager();
 *   manager.set('key', { data: 'value' }, 7); // 7 days
 *   const value = manager.get<MyType>('key');
 *
 *   // Server-side (in +page.server.ts load function)
 *   const manager = new CookieManager(event.cookies);
 *   const value = manager.get<MyType>('key');
 */

import { browser } from '$app/environment';
import type { Cookies } from '@sveltejs/kit';

export interface CookieOptions {
  expires?: number; // Days until expiration
  path?: string;
  sameSite?: 'strict' | 'lax' | 'none';
  secure?: boolean;
}

export class CookieManager {
  private cookies?: Cookies; // SvelteKit cookies object (server-side)

  constructor(cookies?: Cookies) {
    this.cookies = cookies;
  }

  /**
   * Set a cookie with optional expiration
   * @param key Cookie name
   * @param value Data to store (will be JSON.stringify'd)
   * @param durationDays Days until expiration (default: 365)
   */
  set<T>(key: string, value: T, durationDays: number = 365): void {
    const serialized = JSON.stringify(value);

    if (browser) {
      // Client-side: use document.cookie
      const expires = new Date();
      expires.setDate(expires.getDate() + durationDays);

      document.cookie = `${key}=${encodeURIComponent(serialized)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    } else if (this.cookies) {
      // Server-side: use SvelteKit cookies
      this.cookies.set(key, serialized, {
        path: '/',
        maxAge: durationDays * 24 * 60 * 60, // Convert days to seconds
        sameSite: 'lax',
        httpOnly: false, // Must be false so client JS can read it
        secure: false // Set to true in production with HTTPS
      });
    }
  }

  /**
   * Get a cookie value
   * @param key Cookie name
   * @returns Parsed value or null if not found/invalid
   */
  get<T>(key: string): T | null {
    try {
      let value: string | undefined;

      if (browser) {
        // Client-side: parse document.cookie
        const cookies = document.cookie.split(';');
        const cookie = cookies.find(c => c.trim().startsWith(`${key}=`));
        value = cookie?.split('=')[1];
      } else if (this.cookies) {
        // Server-side: use SvelteKit cookies
        value = this.cookies.get(key);
      }

      if (!value) return null;

      const decoded = decodeURIComponent(value);
      return JSON.parse(decoded) as T;
    } catch (error) {
      console.error(`Failed to parse cookie "${key}":`, error);
      return null;
    }
  }

  /**
   * Delete a cookie
   * @param key Cookie name
   */
  delete(key: string): void {
    if (browser) {
      // Client-side: set expiration to past date
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    } else if (this.cookies) {
      // Server-side: use SvelteKit delete
      this.cookies.delete(key, { path: '/' });
    }
  }

  /**
   * Check if a cookie exists
   * @param key Cookie name
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
}
```

### Step 2: Update Server-Side Load Function

**File**: `/src/routes/+page.server.ts` (check if exists, otherwise create)

```typescript
import { CookieManager } from '$lib/CookieManager';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
  const cookieManager = new CookieManager(cookies);

  // Get column preferences from cookie (server-side)
  const columnPreferences = cookieManager.get<PersistedColumnPrefs>('column-preferences');

  return {
    // ... existing data (stocks, count, pageSize, sectors)
    columnPreferences // Pass to client
  };
};
```

**Note**: If `+page.server.ts` already exists, just add the `columnPreferences` retrieval and return it.

### Step 3: Update +page.svelte to Use Cookies

**File**: `/src/routes/+page.svelte`

Changes:
1. Remove `PersistedState` import and usage
2. Use server-provided `columnPreferences` from `data` prop
3. Use `CookieManager` client-side to persist changes
4. Initialize `columns` with SSR-friendly data

**Before** (lines 10, 23-42, 326-340):
```typescript
import { PersistedState } from 'runed';

const persistedColumnPrefs = new PersistedState<PersistedColumnPrefs | null>(
  'column-preferences',
  null,
  { /* serializer config */ }
);

let columns = $state<ColumnConfig[]>(
  applyPersistedPrefs(DEFAULT_COLUMNS, persistedColumnPrefs.current)
);

$effect(() => {
  const prefs = columns.map((c) => ({ key: c.key, enabled: c.enabled }));
  untrack(() => {
    persistedColumnPrefs.current = { prefs, savedAt: Date.now() };
  });
});
```

**After**:
```typescript
import { CookieManager } from '$lib/CookieManager';

const cookieManager = new CookieManager();

// Initialize columns with server-provided preferences (SSR-safe)
let columns = $state<ColumnConfig[]>(
  applyPersistedPrefs(DEFAULT_COLUMNS, data.columnPreferences)
);

// Persist changes to cookie whenever columns change
$effect(() => {
  const prefs = columns.map((c) => ({ key: c.key, enabled: c.enabled }));

  untrack(() => {
    cookieManager.set('column-preferences', {
      prefs,
      savedAt: Date.now()
    }, 7); // 7 days expiration
  });
});
```

---

## Part 2: Chart Loading State

### Step 4: Add Loading State to Chart Component

**File**: `/src/lib/components/chart/Chart.svelte`

Add a loading skeleton that shows during SSR and hides once the chart is mounted:

**Before**:
```svelte
<script lang="ts">
  import { LayerCake, Svg } from 'layercake';
  import Line from './Line.svelte';
  import Baseline from './Baseline.svelte';
  import type { ChartPoint } from './types.js';

  // ... props
</script>

{#if data.length > 1}
  <LayerCake x="x" y="y" {data}>
    <Svg>
      <Line {stroke} {strokeWidth} />
      {#if baseline !== undefined}
        <Baseline ... />
      {/if}
    </Svg>
  </LayerCake>
{/if}
```

**After**:
```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { LayerCake, Svg } from 'layercake';
  import Line from './Line.svelte';
  import Baseline from './Baseline.svelte';
  import { CircleNotch } from 'phosphor-svelte';
  import type { ChartPoint } from './types.js';

  interface Props {
    data: ChartPoint[];
    stroke?: string;
    strokeWidth?: number;
    baseline?: number;
    baselineStroke?: string;
    baselineStrokeWidth?: number;
    baselineStrokeDasharray?: string;
  }

  let {
    data,
    stroke = '#ab00d6',
    strokeWidth = 2,
    baseline,
    baselineStroke = '#666',
    baselineStrokeWidth = 1,
    baselineStrokeDasharray = '4,4'
  }: Props = $props();

  let mounted = $state(false);

  onMount(() => {
    // Delay slightly to ensure DOM is ready for LayerCake measurements
    requestAnimationFrame(() => {
      mounted = true;
    });
  });
</script>

<div class="relative w-full h-full">
  {#if !mounted}
    <!-- Loading skeleton (shown during SSR and initial render) -->
    <div class="absolute inset-0 flex items-center justify-center bg-base-200/10">
      <CircleNotch size={16} class="animate-spin text-base-content/30" />
    </div>
  {:else if data.length > 1}
    <!-- Actual chart (shown after mount) -->
    <LayerCake x="x" y="y" {data}>
      <Svg>
        <Line {stroke} {strokeWidth} />
        {#if baseline !== undefined}
          <Baseline
            value={baseline}
            stroke={baselineStroke}
            strokeWidth={baselineStrokeWidth}
            strokeDasharray={baselineStrokeDasharray}
          />
        {/if}
      </Svg>
    </LayerCake>
  {/if}
</div>
```

**Key Changes**:
- Import `onMount` and `CircleNotch` icon
- Add `mounted` state (false by default)
- Set `mounted = true` in `onMount` after `requestAnimationFrame`
- Show loading spinner when `!mounted`
- Show chart when `mounted && data.length > 1`
- Wrap in `<div class="relative w-full h-full">` for positioning

---

## Implementation Order

1. **Create CookieManager** (`/src/lib/CookieManager.ts`)
2. **Update +page.server.ts** (add `columnPreferences` to server load)
3. **Update +page.svelte** (replace `PersistedState` with `CookieManager`)
4. **Update Chart.svelte** (add loading state with `onMount`)
5. **Test**:
   - Refresh page → no column flash, no chart flash
   - Change column order/visibility → persists across refresh
   - Chart displays smoothly after load

---

## Verification

After implementation, test the following:

### Column Preferences (SSR)
1. ✅ Open page → columns appear in correct order immediately (no flash)
2. ✅ Open column modal → reorder columns
3. ✅ Refresh page → new order persists (no flash back to default)
4. ✅ Toggle column visibility → refresh → visibility persists
5. ✅ Check DevTools Network tab → HTML response contains correct column order in initial render
6. ✅ Check that cookies are set (DevTools > Application > Cookies)

### Chart Component (Client Hydration)
1. ✅ Refresh page → spinner shows briefly, then chart appears (no empty space)
2. ✅ Chart data displays correctly after mount
3. ✅ Baseline renders if provided
4. ✅ No console errors or hydration warnings

### Cross-Browser
1. ✅ Test in Chrome, Firefox, Safari
2. ✅ Test with cookies disabled (should gracefully degrade)
3. ✅ Test with JavaScript disabled (SSR should still work)

---

## Benefits

### Column Preferences via Cookies
- ✅ **Zero flash**: Columns render correctly on first paint (SSR)
- ✅ **Consistent UX**: Same columns across page navigations
- ✅ **Progressive enhancement**: Works without JS (for SSR)
- ✅ **Universal**: Same API for client and server code

### Chart Loading State
- ✅ **No layout shift**: Skeleton reserves space for chart
- ✅ **Clear feedback**: User knows content is loading
- ✅ **Smooth transition**: Fade from spinner to chart
- ✅ **SSR-safe**: No hydration errors from missing DOM

---

## Trade-offs

### Cookies vs localStorage
- **Pros**: Available during SSR, works without client JS, survives tab close
- **Cons**: Sent with every request (~4KB limit per cookie), slightly slower to parse
- **Mitigation**: Only store minimal data (column keys + enabled state), not full config

### Client-Side Chart Mount
- **Limitation**: Chart will always require client-side JS (LayerCake needs DOM)
- **Mitigation**: Loading state provides smooth UX and prevents layout shift
- **Alternative**: Consider static SVG placeholder for true SSR, but LayerCake doesn't support this

---

## Critical Files

1. `/src/lib/CookieManager.ts` - New utility class
2. `/src/routes/+page.server.ts` - Server load function (may need to create)
3. `/src/routes/+page.svelte` - Replace PersistedState with CookieManager
4. `/src/lib/components/chart/Chart.svelte` - Add loading state

---

## Migration Notes

If user already has localStorage data saved:

**Option 1: One-time migration** (add to +page.svelte):
```typescript
import { browser } from '$app/environment';

// Migrate localStorage → cookie once
if (browser) {
  const oldData = localStorage.getItem('column-preferences');
  if (oldData && !cookieManager.has('column-preferences')) {
    try {
      const parsed = JSON.parse(oldData);
      cookieManager.set('column-preferences', parsed, 7);
      localStorage.removeItem('column-preferences'); // Clean up
    } catch (e) {
      console.warn('Failed to migrate column preferences');
    }
  }
}
```

**Option 2: Fresh start** (simpler):
- Just deploy the new code
- Users' column preferences will reset to defaults once
- They can reconfigure and it will persist via cookies
