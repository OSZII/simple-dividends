# CLAUDE.md - Simple Dividends

## Project Overview

Simple Dividends is a dividend tracking and stock research web application. It provides a dividend calendar, stock screener with 45+ sortable/filterable columns, price charts, and financial health analysis for dividend-paying stocks.

## Tech Stack

- **Framework**: Svelte 5 (runes: `$state`, `$derived`, `$props`) + SvelteKit 2
- **Styling**: Tailwind CSS 4 + daisyUI 5 (theme-agnostic semantic classes only)
- **UI Components**: Bits UI (headless accessible components), Phosphor Svelte (icons)
- **Charts**: LayerCake (D3-based reactive charts)
- **Database**: PostgreSQL via Drizzle ORM + postgres.js driver
- **Validation**: Valibot for runtime query/schema validation
- **State**: Runed (Svelte 5 state management)
- **Build**: Vite 7, adapter-node for deployment
- **Language**: TypeScript (strict mode)
- **Node**: >=22.12 required

## Project Structure

```
src/
  routes/                    # SvelteKit pages and layouts
    +page.svelte             # Main stock screener dashboard
    +page.server.ts          # Server-side data loading
    +layout.svelte           # Root layout with navbar
    layout.css               # Global Tailwind styles
  lib/
    components/              # Reusable UI components
      chart/                 # LayerCake chart components (Line, Area, Bar, Tooltip, etc.)
      datatable/             # Data table with column management
      filters/               # Filter UI (checkbox, radio, range slider, chips)
      layout/                # Layout components (Navbar, PageLayout)
    server/
      db/
        schema.ts            # Drizzle ORM schema (stocks, dividends, splits, stock_history, etc.)
        index.ts             # Database connection initialization
        util.ts              # DB mapping utilities
      scripts/               # Data import and calculation scripts
        importFromStockTickers.ts
        importHistoryFromStockTickers.ts
        importQuoteSummary.ts
        calculateDividendMetrics.ts
        calculateRecessionReturns.ts
      cache.ts               # LRU cache (1000 items, 500MB, 24h TTL in prod)
    stocks.remote.ts         # SvelteKit remote functions (server queries callable from client)
    CookieManager.ts         # Universal cookie handling (browser + SSR)
    index.ts                 # Shared utility functions
  hooks.server.ts            # Server hooks, cron job scheduling
  app.d.ts                   # TypeScript type definitions
drizzle/                     # Database migration files (24+ versions)
scripts/                     # Standalone import scripts (sectors, countries, stock info)
static/                      # Static assets
.agent/rules/                # AI agent style/standards guidelines
```

## Common Commands

```bash
# Development
npm run dev                  # Start dev server
npm run build                # Production build
npm run preview              # Preview production build

# Code Quality
npm run check                # TypeScript type checking (svelte-check)
npm run check:watch          # Type checking in watch mode
npm run lint                 # Check formatting (Prettier)
npm run format               # Auto-format code (Prettier)

# Database
npm run db:push              # Push schema changes to database
npm run db:generate          # Generate migration files
npm run db:migrate           # Run pending migrations
npm run db:studio            # Open Drizzle Studio GUI
npm run db:calculate-dividend-metrics  # Recalculate dividend metrics
```

## Architecture Patterns

### Data Flow

The app uses SvelteKit's experimental **remote functions** instead of REST APIs. Server-side query functions in `src/lib/stocks.remote.ts` are called directly from Svelte components. These functions use Valibot for input validation and return typed results.

```
Client Component → remote function call → Valibot validation → Drizzle query → PostgreSQL
```

### Database Schema

Seven tables defined in `src/lib/server/db/schema.ts`:
- **stocks**: Primary table with 50+ columns (dividends, valuation, price, earnings, financial health, recession data)
- **dividends**: Historical dividend payment records
- **stock_history**: Historical price data for charting
- **dividend_calendar**: Upcoming dividend dates
- **splits**: Stock split records
- **sectors**, **countries**, **currency**: Reference/lookup tables

Custom enums: `valuation_status`, `payment_frequency`, `dividend_safety`

### Caching

An LRU cache (`src/lib/server/cache.ts`) wraps database queries. In production: 1000 items max, 500MB limit, 24-hour TTL. In development: effectively disabled (1 item, 1ms TTL).

### Cron Jobs (Production Only)

Defined in `src/hooks.server.ts`:
- Hourly Mon-Fri: Import stock data
- Sunday 00:30: Import stock price history
- Sunday 01:00: Calculate recession returns
- Saturday 01:00: Import quote summaries
- Sunday 00:00: Calculate dividend metrics

Scripts can also be triggered manually via `?script=import-stocks` query parameter.

### Cookie-Based Preferences

`CookieManager` provides a universal API for reading/writing cookies that works in both browser and SSR contexts. Used for persisting column visibility/order preferences to avoid hydration mismatches.

## Code Conventions

### Svelte 5 Runes

Always use Svelte 5 patterns:
- `$state()` for reactive state
- `$derived()` for computed values
- `$props()` for component props
- Never use legacy Svelte 4 syntax (`export let`, `$:`, stores)

### Styling Rules

- **Never** use hex colors or standard Tailwind color scales (`bg-blue-500`, `text-gray-900`)
- **Always** use daisyUI semantic classes: `primary`, `secondary`, `neutral`, `base-100/200/300`
- Background depth: `base-100` (page) > `base-200` (sections) > `base-300` (cards/offsets)
- Pair backgrounds with content colors: `bg-primary` with `text-primary-content`
- Use `bg-neutral` + `shadow-lg` + `border-base-300` to lift elements
- Use Tailwind utilities for layout; avoid writing raw CSS
- Use daisyUI component classes: `btn`, `btn-primary`, `card`, `badge`, etc.

### Component Architecture

- All reusable components go in `src/lib/components/`
- Prefer small, focused (atomic) components over monolithic ones
- Use Bits UI for complex interactive components (dropdowns, dialogs, tabs)
- Use Phosphor Svelte for icons

### Database & Data

- All database operations use Drizzle ORM
- Type safety flows from DB schema to frontend via Drizzle type inference
- Validate inputs with Valibot at the server boundary

### Formatting (Prettier)

- Tabs for indentation
- Single quotes
- No trailing commas
- 100 character line width
- Svelte and Tailwind Prettier plugins active

## Environment Variables

```
DATABASE_URL="postgres://user:password@host:port/db-name"  # Required
```

Set in `.env` file (see `.env.example`). Accessed server-side via `$env/dynamic/private`.

## Testing

No test framework is configured. Code quality is enforced through:
- `npm run check` - TypeScript/Svelte type checking
- `npm run lint` - Prettier formatting checks
- Drizzle ORM strict mode for type-safe database operations
