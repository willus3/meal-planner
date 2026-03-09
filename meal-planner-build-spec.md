# Meal Planner Pro — Agent Build Specification
**Stack Profile:** Full-Stack JS (Next.js 14 App Router)
**Target:** Production MVP
**Date Generated:** 2026-03-09

---

## 1. Project Overview

Meal Planner Pro is a dynamic web application designed to simplify meal planning by generating dinner recipe suggestions based on predefined taste preferences, favorite recipes, and user-specified effort levels (e.g., 30-minute meals vs. 3-hour weekend projects). The app also features an editable, smart shopping list grouped by recipe and pantry items, allowing users to add loose groceries or check off ingredients they already have. The target audience is busy individuals or families looking for structured but flexible dinner prep guidance.

---

## 2. File System Structure

```text
meal-planner/
├── README.md
├── .env.example
├── package.json
├── /public
│   └── /assets
├── /src
│   ├── /app               # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx       # Landing/Dashboard
│   │   └── /recipes       # Recipe discovery
│   │   └── /planner       # Meal plan view
│   │   └── /shopping-list # Interactive list
│   ├── /components        # Reusable UI components
│   │   ├── /ui            # Base components (buttons, inputs)
│   │   ├── /recipes       # Recipe cards, filters
│   │   └── /shopping      # List items, category headers
│   ├── /hooks             # Custom React hooks
│   ├── /services          # API calls and business logic
│   ├── /lib               # Utils and configuration (e.g., supabase client)
│   ├── /styles            # Global and component styles (Tailwind)
│   └── /types             # TypeScript types / JSDoc definitions
├── /tests
│   ├── /unit
│   └── /integration
└── /docs
    └── architecture.md
```

Rules:
- No logic in `/app` routes — delegate to `/services` and `/hooks`
- No inline styles — use Tailwind CSS consistently
- No magic numbers — extract to named constants
- Each file has a single clear responsibility

---

## 3. Core Features

### Feature 1: User Onboarding & Preferences
- **What it does:** Allows users to set their dietary preferences, disliked ingredients, default time-effort levels, and family size (portion count).
- **Inputs:** Form selections (checkboxes, radio buttons, multi-select, number input for family size).
- **Outputs:** Saves user profile data to the database; updates global state.
- **Edge cases to handle:** Empty form submissions, skipping optional steps, family size less than 1.

### Feature 2: Recipe Suggestion Engine
- **What it does:** Generates a weekly dinner plan by filtering a recipe database matching user preferences and effort levels.
- **Inputs:** User profile data, active filters (e.g., "Tonight I want something under 30 mins").
- **Outputs:** A visual grid or list of suggested recipes with effort/time tags and high-level macro/ingredient summaries.
- **Edge cases to handle:** No recipes match the strict filters; user rejects a suggestion and requests a new one (reroll).

### Feature 3: The Planner View
- **What it does:** A calendar-like interface where users can drag, drop, or assign recipes to specific days of the week.
- **Inputs:** Selected recipes from the suggestion engine.
- **Outputs:** A structured weekly view saved to the user's account.
- **Edge cases to handle:** Unassigning a meal, moving a meal to a different day, handling empty days.

### Feature 4: Smart Shopping List
- **What it does:** Aggregates all ingredients from the planned recipes into a single checklist, categorized by grocery aisle (e.g., Produce, Dairy). It multiplies the base recipe quantities by the user's saved family size.
- **Inputs:** Planned recipes for the week; manual user additions (e.g., "Milk", "Paper Towels"); user's family size setting.
- **Outputs:** Categorized, quantity-scaled checklist. Users can check off items they already have to hide them.
- **Edge cases to handle:** Duplicate ingredients across two recipes (combine quantities if possible), manually deleting recipe-linked ingredients.

### Feature 5: Authentication & Persistence
- **What it does:** Secures user data and allows multi-device access.
- **Inputs:** Email/Password or OAuth login.
- **Outputs:** Authenticated session; loads user's specific meal plan and preferences.
- **Edge cases to handle:** Forgotten passwords, expired sessions, unauthenticated users trying to access the planner.

---

## 3a. Feature Review Gates (Required)

For every feature listed in Section 3, the agent must follow this build-then-pause loop before moving on to the next feature:

### After building each feature, the agent must:

1. **Summarize what was built** — in plain language, describe what the feature does, what files were created or modified, and any decisions made that weren't explicitly specified in the build spec.
2. **Provide a testability checklist** — list the specific actions the user should take to verify the feature works and looks correct. Be explicit (e.g., "Check off 'Onions' on the shopping list—it should move to the 'Got It' section").
3. **Flag any visual or UX decisions that need approval** — if the agent made a design call (color, layout, spacing, interaction pattern) that wasn't specified, call it out explicitly and ask the user to confirm or redirect.
4. **Present an explicit STOP prompt** — end every feature handoff with this exact block:

   ```text
   ⏸ FEATURE REVIEW — [Feature Name]

   Please review the above and confirm one of the following before I continue:

   ✅ APPROVED — looks good, continue to the next feature
   🔁 REVISE — [describe what to change]
   ❓ QUESTION — [ask a clarifying question]
   ```

5. **Do not proceed** to the next feature until the user responds with an explicit approval. If the user responds with a revision request, implement it and repeat the review gate for that same feature. Do not batch multiple revision rounds — one change at a time.

### Review gate scope by feature type:
| Feature Type | What to Demonstrate |
|---|---|
| **UI Component** | Screenshot or live preview; keyboard nav works; responsive at mobile/desktop |
| **Form / Input** | Valid submission, empty submission, invalid input, success state |
| **Data list / Table** | Populated state, empty state, loading state, error state |
| **Authentication** | Login success, login failure, session persistence, logout |
| **API Integration** | Success response rendered correctly, error response handled gracefully |
| **Navigation / Routing** | All links work, active state highlights, back-button behavior |

---

## 4. Tech Stack & Dependencies

**Framework:** Next.js 14 (App Router)
**Language:** TypeScript (strict mode `true`)
**Styling:** Tailwind CSS + Radix UI / shadcn/ui components (for accessible base components)
**State Management:** React Context (for user session/theme), Zustand (for shopping list / planner transient state), React Query (for server state).
**Data Layer & Auth:** Supabase (PostgreSQL + Auth)
**Testing:** Vitest + React Testing Library
**Linting:** ESLint + Prettier (config files must be committed)

Only install what you use. Every dependency must be justified by a feature requirement.

---

## 5. Accessibility Requirements (Non-Negotiable)

The following must be implemented without exception:

- All interactive elements are keyboard-navigable (Tab, Enter, Escape flows work)
- Every image has a meaningful `alt` attribute (or `alt=""` if decorative)
- Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for text, 3:1 for UI components)
- Form inputs have associated `<label>` elements — never placeholder-only
- Focus states are visible — never `outline: none` without a custom replacement
- ARIA roles and attributes used only where semantic HTML is insufficient
- Page has a logical heading hierarchy (one `<h1>`, structured `<h2>`/`<h3>` below)
- Error messages are announced to screen readers (use `aria-live` or `role="alert"`)

Run an automated accessibility audit (axe-core or Lighthouse) before considering any component complete. Fix all critical and serious issues before proceeding.

---

## 6. Code Quality Standards

**Naming:**
- Variables and functions: `camelCase`
- Components: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Files: `kebab-case` for utilities, `PascalCase` or `kebab-case` for components (be consistent)

**Functions:**
- Max 40 lines per function — extract if longer
- Single responsibility — one job per function
- No side effects in pure utility functions
- Async functions always handle errors (try/catch)

**Components:**
- Props are typed via TypeScript interfaces
- No more than 5 props without using a config object pattern
- Side effects isolated in hooks, not inline in JSX
- No direct DOM manipulation — use refs only when necessary

**Comments:**
- Comment the *why*, not the *what*
- Every exported utility function has a JSDoc block
- Complex logic includes a plain-language explanation

**No-fly zones (never do these):**
- `console.log` left in committed code
- `any` type in TypeScript without a documented reason
- Hardcoded credentials, URLs, or environment-specific values (use `.env.local`)
- Deeply nested ternaries — use early returns or helper functions
- Copy-pasted code blocks — extract to a shared utility

---

## 7. State & Data Architecture

- **Global State**: Minimal. Uses user session and theme data (React Context).
- **Server State**: React Query wrapping Supabase calls to fetch recipes, user plans, and shopping lists.
- **Local/Transient State**: Zustand to manage drag-and-drop state on the meal calendar, or toggling checkmarks on the shopping list, before writing those state changes to the database.
- **Data Shape (Core)**:
  - `Recipe`: `{ id, title, description, effortLevel, prepTimeMinutes, ingredients (array of items with qty/unit) }`
  - `MealPlan`: `{ id, userId, weekStartDate, schedule: { monday: [Recipe, Recipe...], ... } }`
  - `ShoppingList`: `{ id, userId, items: [{ ingredientId, name, quantity, unit, isChecked, category }] }`
- **Async Handling**: Every API call shows a skeleton loader or spinner and degrades gracefully via toast notifications on error.

---

## 8. Error Handling & Resilience

- Every network call has a timeout and retry strategy (handled via React Query defaults).
- User-facing errors show helpful toast messages (e.g., "Failed to save your meal plan. Try again?").
- Form validation runs client-side (Zod) before triggering API calls.
- `error.tsx` file catches boundary exceptions in Next.js routing.

---

## 9. Environment & Configuration

Create `.env.example` listing every required environment variable:
- `NEXT_PUBLIC_SUPABASE_URL` (Required) The API URL for the Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Required) Anon public key for DB interactions

Never commit `.env.local` to version control. Add it to `.gitignore` immediately.

---

## 10. README Requirements

The README must include:
1. **Project title and one-line description**
2. **Prerequisites** — Node version, PNPM/NPM/Yarn
3. **Setup** — step-by-step from `git clone` to running locally
4. **Environment variables** — reference `.env.example`
5. **Available scripts** — `dev`, `build`, `test`, `lint`
6. **Project structure** — brief explanation of each top-level directory
7. **Key architectural decisions** — why Supabase, why Next.js App Router, etc.
8. **Known limitations**

---

## 11. Completion Checklist

The agent must confirm all of the following before declaring the build complete:

- [ ] Every feature passed its Section 3a review gate with explicit user approval
- [ ] All revision requests from review gates have been implemented and re-approved
- [ ] All features in Section 3 are implemented and manually verified
- [ ] Accessibility audit run — zero critical/serious violations
- [ ] All linting passes with zero errors
- [ ] `.env.example` is complete and `.env` related files are gitignored
- [ ] README is written and setup instructions are verified
- [ ] File structure matches Section 2 exactly
