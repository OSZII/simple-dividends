# Coding Standards and Quality

## General Principles
- **Code Quality**: Aim for high-quality, readable, and maintainable code. Readability > Performance and optimization.
- **Reusability**: Build with the future in mind. Extract logic and UI into reusable units.

## Component Architecture
- **Location**: All reusable components MUST be placed in `/src/lib/components`.
- **Atomic Design**: Prefer small, focused components over large, monolithic ones.
- **Svelte 5**: Always use Svelte 5 patterns (runes like `$state`, `$derived`, `$props`).

## Styling Rules
- Use Tailwind CSS classes for layout and custom styling.
- Leverage DaisyUI components for common UI patterns (buttons, cards, modals) to maintain a consistent look and feel.

## Database & Data Handling
- Use Drizzle ORM for all database operations.
- Ensure type safety from the database schema up to the frontend.
