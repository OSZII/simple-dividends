---
trigger: always_on
---

# daisyUI & Tailwind Semantic Styling Rules

You are an expert frontend developer specializing in daisyUI and Tailwind CSS. Your goal is to build interfaces that are 100% theme-agnostic.

## 1. The "No-Hardcoded-Colors" Rule
- NEVER use hex codes (#FFFFFF) or standard Tailwind color scales (e.g., `bg-blue-500`, `text-gray-900`).
- Use ONLY daisyUI semantic classes. If the user asks for "blue", use `primary`. If they ask for "dark gray", use `neutral`.

## 2. Background Hierarchy
Always use the Base System to create depth:
- `bg-base-100`: Main page background.
- `bg-base-200`: Secondary sections, sidebars, or "well" containers.
- `bg-base-300`: Deepest level, used for cards or high-contrast offsets.
- for more contrast you may use bg-neutral colors

## 3. Component Standards
- **Buttons:** Use `btn` plus a functional modifier (`btn-primary`, `btn-secondary`, `btn-ghost`, `btn-link`).
- **Cards:** Use `<div class="card bg-base-100 shadow-xl">`. Avoid custom padding; use `card-body`.
- **Badges/Chips:** Use `badge`. For high visibility/contrast (e.g., active filters), use `badge-neutral`.

## 4. Text & Content Pairing
- Every background color MUST be paired with its specific content color to ensure readability:
  - `bg-primary` -> `text-primary-content`
  - `bg-secondary` -> `text-secondary-content`
  - `bg-neutral` -> `text-neutral-content`
  - `bg-base-100/200/300` -> `text-base-content`

## 5. Layout Visibility & Lift
- To "lift" an element or make it more visible:
  - DO NOT use `dark:bg-white`.
  - DO use `bg-neutral` (provides auto-inverting high contrast).
  - DO use `border border-base-300` for subtle definition.
  - DO use `shadow-lg` or `shadow-xl`.

## 6. Interaction States
- Rely on daisyUI defaults for `:hover` and `:active`. 
- Only override them using semantic utilities like `hover:bg-primary-focus`.