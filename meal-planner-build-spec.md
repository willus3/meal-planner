# Meal Planner Pro — Agent Build Specification

**Stack Profile:** React SPA (Vite + React + TypeScript, Firebase backend, Gemini AI)
**Target:** Production MVP
**Date:** 2026-03-09
**Mode:** Learner build — Learning Notes included throughout

---

## Section 0 — Integration Constraints (Existing Codebase)

This spec targets an **existing scaffolded project**. Do not start from scratch. Read and
respect the patterns already established before modifying any file.

### What already exists (preserve and build on):
| File / Directory | Status | Notes |
|---|---|---|
| `src/App.tsx` | Modify | Add auth guard; keep routing structure |
| `src/pages/Dashboard.tsx` | Modify | Keep layout; replace mock with real data |
| `src/pages/RecipeDiscovery.tsx` | Modify | Keep UI structure; replace mock with Firebase + Gemini |
| `src/pages/MealPlanner.tsx` | Modify | Keep 7-day grid UI; add Firestore persistence |
| `src/pages/ShoppingList.tsx` | Modify | Keep check-off UI; add manual item input |
| `src/components/recipes/RecipeCard.tsx` | Keep / extend | Add edit/delete actions |
| `src/components/recipes/QuickAssignModal.tsx` | Keep | No changes needed |
| `src/components/ui/PreferencesForm.tsx` | Modify | Save to Firestore instead of Zustand only |
| `src/lib/store.ts` | Refactor | Reduce to UI-only state; remove data ownership |
| `src/lib/recipes.ts` | Refactor | Keep type definitions; remove mock data after Firebase is live |
| `src/lib/utils.ts` | Keep as-is | |

### Stack versions — match exactly, do not upgrade:
- React 19.2, React Router 7, Zustand 5, Tailwind CSS 4, Vite 7, TypeScript 5.9

### Do NOT:
- Switch to Next.js, Remix, or any other framework
- Replace React Router with a different routing library
- Remove or restructure the Tailwind CSS configuration
- Rename or move existing page components (routes are already wired)
- Use `console.log` in committed code (debugging only, then remove)

### Migration strategy:
Build Firebase integration first (Feature 1). Then replace mock data feature by feature.
The app must remain runnable at every step — never leave it in a broken state between features.

---

## 1. Project Overview

Meal Planner Pro is a mobile-first web application that eliminates the weekly chore of
family meal planning. Users maintain a personal recipe library (built from photos, internet
suggestions, or manual entry), get AI-powered weekly meal recommendations, and walk away
from a 15-minute Sunday planning session with a linked meal plan and a category-organized,
checkable grocery list.

The app is backed by Google Firebase (Firestore database, Firebase Authentication, Firebase
Hosting) and uses Google Gemini Pro as the AI layer for photo-to-recipe extraction, internet
recipe discovery, and personalized meal recommendations. The architecture is designed to
support a single user in v1 but must be built with multi-user scale in mind from day one.

---

## 2. File System Structure

Build to this exact structure. Every directory and file listed below is required.

```text
meal-planner/
├── .env.example                        # Template for all required environment variables
├── .gitignore                          # Must include .env.local and firebase service keys
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── README.md
│
└── src/
    ├── main.tsx                        # App entry point — wrap with BrowserRouter, AuthProvider
    ├── App.tsx                         # Routes + auth guard + bottom nav
    ├── index.css
    │
    ├── lib/
    │   ├── firebase.ts                 # Firebase app init (Auth, Firestore, Storage)
    │   ├── utils.ts                    # Keep as-is (cn helper)
    │   └── constants.ts                # DAYS_OF_WEEK, CATEGORY_ORDER, DIETARY_OPTIONS, etc.
    │
    ├── types/
    │   ├── recipe.ts                   # Recipe, Ingredient, IngredientCategory interfaces
    │   ├── mealplan.ts                 # MealPlan, WeeklySchedule, PlannedMeal interfaces
    │   └── user.ts                     # UserPreferences interface
    │
    ├── services/
    │   ├── recipeService.ts            # Firestore CRUD: getRecipes, addRecipe, updateRecipe, deleteRecipe
    │   ├── mealPlanService.ts          # Firestore CRUD: saveWeeklyPlan, getPlans, getPlanById
    │   ├── geminiService.ts            # extractRecipeFromPhoto, searchInternetRecipes, getRecommendations
    │   └── unsplashService.ts          # fetchStockPhoto(query: string): Promise<string>
    │
    ├── hooks/
    │   ├── useAuth.ts                  # Firebase auth state + Google Sign-In / Sign-Out
    │   ├── useRecipes.ts               # Recipe library: load, add, update, delete, loading/error state
    │   ├── useMealPlan.ts              # Current week plan: load, assign, clear, generate shopping list
    │   └── usePlanHistory.ts           # Past plans: load list, load single, repeat plan
    │
    ├── store/
    │   └── uiStore.ts                  # Zustand: UI-only transient state (checked items, modal open state)
    │
    ├── components/
    │   ├── auth/
    │   │   └── AuthGuard.tsx           # Redirect to /login if not authenticated
    │   ├── ui/
    │   │   ├── Button.tsx              # Reusable button with variants (primary, secondary, danger)
    │   │   ├── Modal.tsx               # Accessible modal wrapper (focus trap, Escape to close)
    │   │   ├── LoadingSpinner.tsx      # Centered spinner for async states
    │   │   ├── Toast.tsx               # Simple success/error toast notifications
    │   │   ├── EmptyState.tsx          # Reusable empty-state illustration + CTA
    │   │   └── PreferencesForm.tsx     # MODIFY: save to Firestore user doc
    │   ├── recipes/
    │   │   ├── RecipeCard.tsx          # EXTEND: add edit/delete action buttons
    │   │   ├── RecipeForm.tsx          # Add / edit recipe form (manual entry)
    │   │   ├── PhotoUpload.tsx         # File/camera input → Gemini extraction → preview + confirm
    │   │   └── QuickAssignModal.tsx    # Keep as-is
    │   └── shopping/
    │       └── AddItemInput.tsx        # Inline input for adding manual shopping list items
    │
    └── pages/
        ├── Login.tsx                   # Google Sign-In page
        ├── Dashboard.tsx               # MODIFY: show this week's plan summary + quick actions
        ├── RecipeDiscovery.tsx         # MODIFY: real library + Gemini internet search tab
        ├── MealPlanner.tsx             # MODIFY: Firestore-backed plan + generate list button
        ├── ShoppingList.tsx            # MODIFY: add manual items + save extras to Firestore
        └── PlanHistory.tsx             # NEW: browse past weeks, repeat a plan
```

**Rules enforced throughout:**
- No data-fetching logic inside page components — delegate to hooks in `/hooks`
- No direct Firestore calls outside of `/services` — pages and hooks use service functions only
- No inline styles — Tailwind classes only
- No magic numbers or hardcoded strings — extract to `/lib/constants.ts`
- Every async operation has a loading state and an error state

---

## 3. Core Features

Each feature is a discrete, testable unit. Build them in the order listed — each one
depends on the previous.

---

### Feature 1 — Firebase Backend & Auth

**What the user experiences:** The app opens to a login screen. The user taps "Sign in with
Google" and is taken to their personal dashboard. Their data is private to them.

**Inputs:** Google OAuth credentials (handled by Firebase Auth SDK — no password UI needed)

**Outputs:**
- Authenticated Firebase user object available throughout the app via `useAuth` hook
- Firestore database structured with user-scoped collections (see data model in §7)
- All pages protected by `AuthGuard` — unauthenticated users redirected to `/login`

**Files to create / modify:**
- `src/lib/firebase.ts` — initialize Firebase app, export `auth`, `db`, `storage`
- `src/hooks/useAuth.ts` — expose `user`, `signInWithGoogle()`, `signOut()`, `loading`
- `src/components/auth/AuthGuard.tsx` — wrap protected routes
- `src/pages/Login.tsx` — single-button Google Sign-In page
- `src/App.tsx` — wrap routes in `AuthGuard`, add `/login` as public route

**Edge cases:**
- Sign-in popup blocked by browser → show instruction message
- Firebase quota exceeded → show friendly error, not raw Firebase error object
- User signs out mid-session → immediately redirect to `/login`, clear local state

> 📘 **Learning Note — Why Firebase Auth?**
> Firebase Authentication handles the hard parts of login: generating secure tokens,
> managing sessions, and refreshing credentials automatically. Google Sign-In means your
> users don't create yet another password, and you don't have to store or hash any
> passwords yourself. The `onAuthStateChanged` listener in `useAuth.ts` is how React
> "stays in sync" with the auth state — it fires every time the user logs in or out,
> so your UI always reflects the current reality.

---

### Feature 2 — Recipe Library (CRUD)

**What the user experiences:** The Recipe Discovery page shows their personal library.
They can tap a card to view the full recipe, tap an edit icon to modify it, or tap a
delete icon to remove it. An "Add Recipe" button opens the `RecipeForm`.

**Inputs:**
- `RecipeForm` fields: title, description, ingredients (list), instructions (list),
  effort level, dietary tags, optional image upload
- Edit: pre-populated form with existing recipe data
- Delete: confirmation before removing

**Outputs:**
- Recipe document created/updated/deleted in Firestore under `users/{uid}/recipes/{recipeId}`
- Recipe card grid updates immediately on change (optimistic update or re-fetch)
- If no image is provided, trigger `unsplashService.fetchStockPhoto(recipe.title)` and
  store the returned URL on the recipe document

**Files to create / modify:**
- `src/services/recipeService.ts` — `getRecipes`, `addRecipe`, `updateRecipe`, `deleteRecipe`
- `src/hooks/useRecipes.ts` — wraps service, exposes loading/error, manages local list state
- `src/components/recipes/RecipeForm.tsx` — controlled form with validation
- `src/components/recipes/RecipeCard.tsx` — add edit/delete action buttons
- `src/services/unsplashService.ts` — `fetchStockPhoto` using Unsplash API
- `src/pages/RecipeDiscovery.tsx` — replace `MOCK_RECIPES` with `useRecipes` hook data

**Edge cases:**
- Form submitted with no title → inline validation error, do not call Firestore
- Delete with a recipe currently assigned to the weekly plan → warn user before deleting
- Unsplash API fails → use a generic local fallback image (store one in `/public/assets/`)
- Empty library → show `EmptyState` with a CTA to add the first recipe

> 📘 **Learning Note — Firestore Data Model**
> Firestore is a "NoSQL document database" — think of it like a filing cabinet where
> each drawer is a Collection, and each folder inside is a Document. Your recipe library
> lives at `users/{uid}/recipes` — a sub-collection under the user's document. This
> structure means every user's recipes are isolated from other users automatically,
> and you can fetch only YOUR recipes with a simple query. Each Recipe document stores
> all its data as key-value pairs (like a JavaScript object).

---

### Feature 3 — Photo-to-Recipe (Gemini)

**What the user experiences:** On the Recipe Discovery page, a "Scan Recipe" button opens
`PhotoUpload`. The user picks a file or takes a photo with their phone camera. The app
sends the image to Gemini, which returns a structured recipe. A preview is shown for
the user to confirm or edit before saving.

**Inputs:**
- Image file (JPEG/PNG/HEIC from camera roll or camera capture)
- `accept="image/*"` and `capture="environment"` on the file input for mobile camera support

**Outputs:**
- Gemini returns a parsed `Recipe` object (title, description, ingredients array,
  instructions array, estimated effort level)
- Preview screen shows extracted data in an editable `RecipeForm` (pre-populated)
- User confirms → recipe saved to Firestore; user cancels → nothing saved

**Gemini prompt (use this exactly):**
```
Analyze this recipe image and extract the following information in JSON format:
{
  "title": "recipe name",
  "description": "1-2 sentence summary",
  "prepTimeMinutes": number,
  "effortLevel": "Quick Weekday" | "Average" | "Long Weekend",
  "dietaryTags": ["Vegetarian" | "Vegan" | "Keto" | "Paleo" | "Gluten-Free"],
  "ingredients": [
    { "name": "ingredient name", "quantity": number, "unit": "unit of measure", "category": "Produce" | "Dairy" | "Meat" | "Pantry" | "Spices" | "Bakery" | "Frozen" | "Other" }
  ],
  "instructions": ["step 1", "step 2", ...]
}
Only return valid JSON. If a field cannot be determined, use a sensible default.
```

**Files to create / modify:**
- `src/services/geminiService.ts` — `extractRecipeFromPhoto(imageFile: File): Promise<Recipe>`
- `src/components/recipes/PhotoUpload.tsx` — file input, loading state, result preview
- `src/pages/RecipeDiscovery.tsx` — add "Scan Recipe" button wired to `PhotoUpload`

**Edge cases:**
- Image is blurry or not a recipe → Gemini returns partial/empty data → show the form
  pre-filled with whatever was extracted and let the user fill in the rest manually
- File too large (>10MB) → validate client-side, show error before sending to Gemini
- Gemini API error → show toast "Couldn't read that photo. You can enter the recipe manually."
- User uploads a photo of something that isn't a recipe → same handling as blurry image

> 📘 **Learning Note — Multimodal AI**
> Gemini is a "multimodal" model, meaning it can understand both text and images in
> the same request. When you call the Gemini API with an image, you're sending the
> raw image bytes (as base64) alongside a text prompt. Gemini reads both together —
> it sees the image AND your instructions at the same time. Asking it to return JSON
> is a technique called "structured output prompting" — you tell the model exactly
> what format you want, which makes it much easier to use the result in your code.

---

### Feature 4 — Internet Recipe Discovery (Gemini)

**What the user experiences:** A "Find Online" tab on the Recipe Discovery page. The user
types what they're looking for (e.g., "quick chicken pasta" or "vegan Sunday dinner").
Gemini returns 4-6 recipe suggestions from its training knowledge. The user browses them
as cards and taps "Save to My Library" on any they want to keep.

**Inputs:**
- Text search query from the user
- User's dietary preferences (passed as context to Gemini so suggestions are relevant)

**Outputs:**
- 4-6 recipe suggestions rendered as `RecipeCard` components in a results grid
- "Save to My Library" button on each card saves that recipe to Firestore
- Saved recipes immediately appear in the user's library

**Gemini prompt (use this exactly):**
```
Suggest {{count}} recipes matching this request: "{{userQuery}}".
The user has these dietary preferences: {{dietaryPreferences}}.
Return ONLY a valid JSON array of recipe objects with this exact structure:
[{
  "title": "recipe name",
  "description": "1-2 sentence summary",
  "prepTimeMinutes": number,
  "effortLevel": "Quick Weekday" | "Average" | "Long Weekend",
  "dietaryTags": ["Vegetarian" | "Vegan" | "Keto" | "Paleo" | "Gluten-Free"],
  "ingredients": [
    { "name": "ingredient name", "quantity": number, "unit": "unit of measure", "category": "Produce" | "Dairy" | "Meat" | "Pantry" | "Spices" | "Bakery" | "Frozen" | "Other" }
  ],
  "instructions": ["step 1", "step 2", ...]
}]
Return only the JSON array, no markdown, no explanation.
```

**Files to create / modify:**
- `src/services/geminiService.ts` — add `searchInternetRecipes(query, preferences): Promise<Recipe[]>`
- `src/pages/RecipeDiscovery.tsx` — add "Find Online" tab with search input + results grid

**Edge cases:**
- Empty query submitted → show validation message, don't call Gemini
- Gemini returns malformed JSON → catch parse error, show "Search failed. Try different keywords."
- User saves a recipe that already exists in their library (same title) → show warning,
  offer to save as a copy or cancel
- No results returned → show `EmptyState` with suggestion to try broader terms

> 📘 **Learning Note — Prompt Engineering**
> The quality of what Gemini returns is entirely determined by how clearly you ask.
> "Suggest me recipes" is vague — Gemini has to guess at format, count, and structure.
> The prompt above is explicit: it tells Gemini exactly how many, what format, and what
> fields to include. Injecting the user's dietary preferences into the prompt using
> template literals ({{dietaryPreferences}}) is called "context injection" — you're
> personalizing the prompt at runtime based on the user's data.

---

### Feature 5 — AI Meal Recommendations

**What the user experiences:** On the Recipe Discovery page, a "Recommended for You" tab
(the default view) shows 5-7 recipes from their own library, selected by Gemini based on
their preferences, disliked ingredients, and default effort level. A "Refresh" button asks
Gemini for different picks.

**Inputs:**
- User's full recipe library (titles + tags — do NOT send full ingredient lists to save tokens)
- User preferences: dietary tags, disliked ingredients, default effort level, family size

**Outputs:**
- 5-7 `RecipeCard` components rendered from the user's own library
- Each card has an "+ Add to Plan" button (existing `QuickAssignModal`)
- "Refresh" button generates a new set of recommendations

**Gemini prompt (use this exactly):**
```
From this list of recipes, recommend {{count}} that best match the user's preferences.
Available recipes: {{recipeTitlesAndTags}}
User preferences:
- Dietary needs: {{dietaryPreferences}}
- Disliked ingredients: {{dislikedIngredients}}
- Preferred effort level: {{effortLevel}}
Return ONLY a JSON array of the recipe titles you recommend, in order of best match.
Example: ["Recipe Title 1", "Recipe Title 2"]
```

**Files to create / modify:**
- `src/services/geminiService.ts` — add `getRecommendations(recipes, preferences): Promise<string[]>`
- `src/hooks/useRecipes.ts` — add `getRecommended()` method that calls the service
- `src/pages/RecipeDiscovery.tsx` — wire "Recommended" tab to use `getRecommended`

**Edge cases:**
- Library has fewer than 5 recipes → show all of them, no Gemini call needed; show
  prompt encouraging user to add more recipes
- Gemini returns a title that doesn't match any recipe in the library → filter it out
  silently (fuzzy match as a fallback)
- Gemini API fails → fall back to showing all recipes filtered by dietary preferences
  client-side (the existing filtering logic)
- Library is empty → skip recommendations, show onboarding prompt to add recipes first

> 📘 **Learning Note — Token Efficiency**
> Every word you send to the Gemini API counts as "tokens" — the unit the API charges
> for and limits. Sending the full ingredient list for every recipe would be expensive
> and slow. Instead, this feature only sends titles and tags to Gemini for the
> recommendation step. The full recipe data is already in your app — you just need
> Gemini to tell you *which ones* to surface. This pattern of sending minimal context
> to the AI and resolving the full data locally is a key optimization technique.

---

### Feature 6 — Weekly Meal Planner

**What the user experiences:** The Planner page shows a 7-day grid. Each day has a meal
slot. The user taps an empty slot → `QuickAssignModal` opens → they pick a recipe and
set serving size → the slot fills in with a photo thumbnail and recipe name. The plan
auto-saves to Firestore. A "Generate Shopping List" button appears once at least one meal
is assigned.

**Inputs:**
- Recipe selection + serving count via `QuickAssignModal`
- "Clear Week" button to reset all slots
- "Generate Shopping List" button to advance to the shopping list page

**Outputs:**
- `WeeklyPlan` document saved to Firestore under `users/{uid}/mealPlans/{planId}`
- Plan loads from Firestore on page load (not just localStorage)
- Serving count stored per meal and used for ingredient scaling in the shopping list

**Files to create / modify:**
- `src/services/mealPlanService.ts` — `saveWeeklyPlan`, `getCurrentPlan`, `clearPlan`
- `src/hooks/useMealPlan.ts` — wraps service, exposes current plan state + actions
- `src/pages/MealPlanner.tsx` — replace Zustand store references with `useMealPlan` hook

**Edge cases:**
- User replaces a meal already assigned to a day → confirm if serving count should reset
- All meals cleared → update Firestore document to reflect empty state (don't delete doc)
- Network offline when saving → show "Saving..." indicator; Firestore offline persistence
  handles queueing (enable Firestore offline persistence in `firebase.ts`)
- Recipe assigned to planner is later deleted from library → show "[Recipe Deleted]"
  placeholder with a prompt to reassign

> 📘 **Learning Note — Firestore Offline Persistence**
> When you enable `enableIndexedDbPersistence()` in Firebase, Firestore caches data
> locally in the browser's IndexedDB storage. This means the app keeps working even
> when the user loses internet connection (like in a grocery store basement). Changes
> made offline are queued and automatically synced back to Firestore when connectivity
> is restored. This is one of Firebase's biggest advantages for mobile-first apps.

---

### Feature 7 — Shopping List

**What the user experiences:** The Shopping List page shows all ingredients from the week's
meals, aggregated and grouped by category (Produce, Meat, Dairy, etc.), with quantities
scaled to the serving counts. The user can check off items as they shop (checked items
go to the bottom), add extra items not in any recipe, and remove any item.

**Inputs:**
- Weekly plan from Firestore (via `useMealPlan`)
- User's recipe library (to resolve ingredient details from recipe IDs)
- Manual item input: text field + "Add" button at the top of the list
- Checkbox tap: toggles check state
- Swipe-to-delete or delete button on each item

**Outputs:**
- Aggregated, quantity-scaled ingredient list grouped by `IngredientCategory`
- Checked items visually struck-through and sorted to the bottom of their category
- Manual items saved as a separate array on the shopping list Firestore document
- "Uncheck All" button resets the entire list
- Shopping list document saved to Firestore under `users/{uid}/mealPlans/{planId}/shoppingList`

**Files to create / modify:**
- `src/services/mealPlanService.ts` — add `saveShoppingList`, `getShoppingList`
- `src/components/shopping/AddItemInput.tsx` — controlled text input with "Add" button
- `src/pages/ShoppingList.tsx` — add `AddItemInput`, wire to Firestore, add delete per item
- `src/store/uiStore.ts` — keep checked-item IDs here (transient UI state, not Firestore)

**Edge cases:**
- Same ingredient appears in two recipes (e.g., olive oil) → aggregate quantities and
  show combined amount with "From: Recipe A, Recipe B" source label (already implemented
  in existing code — preserve this logic)
- Manual item added with empty text → prevent submission
- All items checked → show a "You're all set! 🛒" completion message at the top
- User navigates away and back → checked state preserved via Zustand persistence

> 📘 **Learning Note — Separating UI State from Server State**
> Notice that checked items live in Zustand (local state), while the shopping list
> itself lives in Firestore (server state). Why? Checking off items is fast, frequent,
> and personal to the current session — saving every checkbox tap to the database would
> be overkill. The *list contents* (what you need to buy) are permanent data that
> should survive a refresh or a different device. This distinction — UI state vs.
> server state — is one of the most important architectural decisions in any app.

---

### Feature 8 — Meal Plan History & Repeat

**What the user experiences:** A "History" tab or page shows a list of past weekly plans,
each labeled with the date range (e.g., "Week of Mar 3 – Mar 9"). Tapping a plan shows
the 7-day grid for that week. A "Repeat This Week" button regenerates a new shopping list
from the same meals and makes it the current plan.

**Inputs:**
- Navigation to `/history` page
- Tap a past plan → view detail
- Tap "Repeat This Week" → confirm dialog → action

**Outputs:**
- List of past `MealPlan` documents from Firestore, sorted by date descending
- When "Repeat" is confirmed: the historical plan is copied as the current week's plan
  in Firestore, and a new shopping list is generated from it
- User is redirected to the Planner page after repeat is confirmed

**Files to create / modify:**
- `src/services/mealPlanService.ts` — add `getAllPlans`, `repeatPlan(planId)`
- `src/hooks/usePlanHistory.ts` — loads plan list, loads single plan detail
- `src/pages/PlanHistory.tsx` — plan list + detail view + repeat CTA
- `src/App.tsx` — add `/history` route + nav link

**Edge cases:**
- No history yet → show `EmptyState` ("Your past meal plans will appear here")
- Repeat a plan that includes a deleted recipe → skip that meal slot, show warning
  that X meals couldn't be restored with a list of which ones
- More than 12 weeks of history → paginate or limit to last 12 (Firestore query limit)

> 📘 **Learning Note — Firestore Queries**
> To fetch plans sorted by date, you'll use a Firestore query with `orderBy` and
> `limit`. Firestore queries require a "composite index" when you filter AND sort by
> different fields. Firebase will log a direct link in the browser console to create
> the required index automatically — click that link when you see it during development.
> It's a common first-time Firebase gotcha that trips up a lot of developers.

---

### Feature 9 — Stock Photo Fallback

**What the user experiences:** They never see a broken image or a grey placeholder.
Every recipe has a photo. If the user didn't upload one, the app automatically finds
a relevant food photo from Unsplash.

**Inputs:**
- Recipe title (used as the Unsplash search query)
- Triggered automatically when a recipe is saved without a `imageUrl`

**Outputs:**
- A relevant stock food photo URL stored on the recipe's Firestore document
- Displayed wherever the recipe card appears

**Implementation:**
- `src/services/unsplashService.ts` — `fetchStockPhoto(query: string): Promise<string>`
- Call the Unsplash `/search/photos` endpoint with `query` and `orientation=landscape`
- Return the `regular` size URL from the first result
- Called from `recipeService.addRecipe()` before saving if `imageUrl` is not provided

**Edge cases:**
- Unsplash API rate limit hit (50 req/hour on free tier) → catch 403 error, return a
  local generic food image stored in `/public/assets/recipe-placeholder.jpg`
- Unsplash returns zero results for the query → use the same local fallback
- Recipe is added via `PhotoUpload` and Gemini extracted it from a photo → use the
  original uploaded photo, do not call Unsplash

> 📘 **Learning Note — API Rate Limits**
> Most free-tier APIs limit how many requests you can make per hour or per day.
> The Unsplash free tier allows 50 requests/hour. To protect against hitting this
> limit, always have a fallback — in this case, a locally-stored placeholder image.
> A good rule: if your app can still function without an API response, it should.
> If it can't, show the user a clear, helpful error instead of a silent failure.

---

### Feature 10 — Onboarding & Preferences

**What the user experiences:** On first login, the dashboard shows the `PreferencesForm`.
The user selects dietary preferences, enters any disliked ingredients, picks their
default effort level, and sets their typical household size. These preferences are saved
to their Firestore user profile and used by the recommendation engine. A "Edit Preferences"
button on the dashboard allows changes at any time.

**Inputs:**
- `PreferencesForm`: dietary preference checkboxes, disliked ingredient tags input,
  effort level radio, family size number input (1–12)

**Outputs:**
- `UserPreferences` document saved to `users/{uid}` in Firestore
- `hasOnboarded: true` flag set on user document after first save
- Preferences loaded from Firestore on app init and passed to the recommendation engine

**Files to create / modify:**
- `src/types/user.ts` — `UserPreferences` interface
- `src/services/userService.ts` — `getUserPreferences`, `saveUserPreferences`
- `src/hooks/useAuth.ts` — extend to also load/expose user preferences
- `src/components/ui/PreferencesForm.tsx` — save to Firestore instead of Zustand

**Edge cases:**
- User skips onboarding → allow it; show a banner on subsequent visits encouraging them
  to set preferences for better recommendations
- Family size set to 0 → validate: minimum 1
- Preferences saved but network drops → Firestore offline persistence queues the write

---

## 3a. Feature Review Gates (Required)

For every feature, the agent must pause and present a review gate before continuing
to the next feature.

### After building each feature, the agent must:

1. **Summarize what was built** — plain language description of what was created,
   what files were modified, and any decisions made that weren't specified in this spec
2. **Provide a testability checklist** — specific, explicit actions the user should
   take to verify the feature works (e.g., "Tap 'Scan Recipe', select an image from
   your camera roll — you should see a loading spinner, then a pre-filled recipe form")
3. **Flag any visual or UX decisions made** — if the agent made a design call not
   specified here, call it out and ask for confirmation
4. **Present this exact stop prompt:**

```
⏸ FEATURE REVIEW — [Feature Name]

Please review the above and confirm one of the following before I continue:

✅ APPROVED — looks good, continue to the next feature
🔁 REVISE — [describe what to change]
❓ QUESTION — [ask a clarifying question]
```

Do not proceed to the next feature until the user responds with an explicit approval.
If a revision is requested, implement it and repeat the gate. One change at a time.

| Feature Type | What to Demonstrate |
|---|---|
| UI Component | Renders at mobile width; keyboard nav works |
| Form / Input | Valid submit, empty submit, invalid input, success state |
| Data list | Populated state, empty state, loading state, error state |
| Authentication | Sign-in, sign-out, session persistence on refresh |
| API Integration | Success response rendered, error response handled gracefully |
| Navigation | All links work, active states correct, back-button behavior |

---

## 4. Tech Stack & Dependencies

**Framework:** React 19 + Vite 7 (existing — do not change)
**Language:** TypeScript 5.9, strict mode enabled
**Styling:** Tailwind CSS 4 (existing — do not change)
**Routing:** React Router 7 (existing — do not change)
**State (UI):** Zustand 5 (existing — reduce to UI-only state)
**Icons:** Lucide React (existing — do not change)
**Backend / Database:** Firebase 10+ (Firestore, Auth, Storage, Hosting)
**AI:** `@google/generative-ai` SDK (Gemini Pro)
**Stock Photos:** Unsplash API (REST, no SDK needed — use `fetch`)
**Linting:** ESLint 9 (existing config — do not change)

**New packages to install:**
```bash
npm install firebase @google/generative-ai
```

No other new dependencies. Every package must be justified by a feature above.

---

## 5. Accessibility Requirements (Non-Negotiable)

These are not optional. Apply them to every component, every page, every interaction.

- All interactive elements reachable by keyboard (Tab to focus, Enter/Space to activate)
- Every `<img>` has a meaningful `alt` attribute (recipe photos: `alt={recipe.title}`)
- Decorative images use `alt=""`
- Color contrast meets WCAG 2.1 AA (4.5:1 for text, 3:1 for large text and UI components)
- All form inputs have associated `<label>` elements — never label by placeholder alone
- Focus rings visible on all focusable elements — never `outline: none` without replacement
- `Modal.tsx` must trap focus (Tab cycles within the modal) and close on Escape key
- Error messages use `role="alert"` so screen readers announce them automatically
- Page has a single `<h1>` per route; `<h2>`/`<h3>` hierarchy follows logically
- The shopping list checkboxes use `<label>` wrapping (already implemented — preserve it)
- Touch targets minimum 44×44px on all buttons and interactive elements (mobile)

---

## 6. Code Quality Standards

**Naming:**
- Variables and functions: `camelCase`
- React components: `PascalCase`
- Constants and enum-like values: `UPPER_SNAKE_CASE`
- Files: `PascalCase` for components, `camelCase` for services/hooks/utils

**Functions:**
- Max 40 lines per function — extract if longer
- One job per function (single responsibility)
- All `async` functions wrapped in `try/catch`
- No side effects inside pure utility functions

**Components:**
- Props typed via TypeScript `interface`
- No more than 5 props — use a config object if more are needed
- Side effects (data fetching, subscriptions) in hooks only — never inline in JSX
- Loading and error states handled for every async operation

**Comments:**
- Comment the *why*, not the *what*
- Every exported service function has a JSDoc block
- Complex business logic (ingredient aggregation, serving scaling) gets a plain-English
  explanation comment above it

**No-fly zones:**
- No `console.log` in committed code
- No TypeScript `any` without a documented explanation comment
- No hardcoded API keys, UIDs, or URLs — use `.env.local` for all environment variables
- No deeply nested ternaries — use early returns or named variables
- No copy-pasted logic blocks — extract to a shared utility

---

## 7. State & Data Architecture

### Firestore Data Model

```
users/
  {uid}/                              ← one document per user
    preferences:
      dietaryPreferences: string[]
      dislikedIngredients: string[]
      defaultEffortLevel: string
      familySize: number
      hasOnboarded: boolean

    recipes/                          ← sub-collection
      {recipeId}/
        title: string
        description: string
        imageUrl: string
        effortLevel: string
        prepTimeMinutes: number
        dietaryTags: string[]
        ingredients: Ingredient[]
        instructions: string[]
        createdAt: Timestamp
        source: 'manual' | 'photo' | 'internet'

    mealPlans/                        ← sub-collection
      {planId}/
        weekStartDate: Timestamp      ← always a Monday
        weekEndDate: Timestamp        ← always a Sunday
        schedule:
          Monday: { recipeId: string, servings: number } | null
          Tuesday: ...
          (etc.)
        shoppingList:
          generatedItems: ShoppingItem[]   ← auto-generated from recipes
          manualItems: ShoppingItem[]      ← user-added extras
        createdAt: Timestamp
        isActive: boolean             ← true for the current week's plan
```

### State Layers

| Layer | Tool | What lives here |
|---|---|---|
| Server state | Firestore | All persistent data: recipes, plans, preferences |
| Auth state | Firebase Auth + `useAuth` hook | Current user, sign-in/out |
| Feature state | Custom hooks (`useRecipes`, `useMealPlan`, etc.) | Loading, error, and data for each feature |
| UI state | Zustand `uiStore` | Checked shopping items, open modal ID, active tab |

### Async State Pattern

Every data-fetching hook exposes this shape:
```typescript
{
  data: T | null,
  loading: boolean,
  error: string | null
}
```
Pages check `loading` first (show spinner), then `error` (show error message), then `data`
(show content). Never render data without checking loading/error first.

---

## 8. Error Handling & Resilience

**Gemini API calls:**
- Every call wrapped in `try/catch`
- On failure: show `Toast` with a plain-language message — never show raw error objects
  to the user
- Timeout: if Gemini takes >15 seconds, show "This is taking longer than expected..."
  and offer a cancel option

**Firestore calls:**
- Every call wrapped in `try/catch`
- Offline: Firestore handles this automatically via persistence (enabled in `firebase.ts`)
- On failure: show `Toast`, log error to console in development only

**Photo upload (Feature 3):**
- Client-side validation before API call: max 10MB file size, image types only
- If file is invalid: inline error message on the upload input

**Form validation:**
- Required fields validated before any API call
- Error messages placed directly below the relevant input field
- Use `aria-describedby` to link inputs to their error messages

**Auth errors:**
- Popup blocked: "Please allow popups for this site to sign in with Google"
- Network error during sign-in: "Sign-in failed. Check your internet connection."
- Session expired: redirect to `/login` with a message "Your session expired. Please sign in again."

---

## 9. Environment & Configuration

Create `.env.example` with every required variable. Never commit `.env.local`.

```bash
# .env.example

# Firebase Configuration (from Firebase Console > Project Settings > Your Apps)
VITE_FIREBASE_API_KEY=           # Required | Your Firebase web API key
VITE_FIREBASE_AUTH_DOMAIN=       # Required | e.g., your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=        # Required | e.g., your-project-id
VITE_FIREBASE_STORAGE_BUCKET=    # Required | e.g., your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID= # Required | Numeric sender ID
VITE_FIREBASE_APP_ID=            # Required | Your Firebase app ID

# Google Gemini API
VITE_GEMINI_API_KEY=             # Required | From Google AI Studio (aistudio.google.com)

# Unsplash API (for stock recipe photos)
VITE_UNSPLASH_ACCESS_KEY=        # Required | From Unsplash Developer Dashboard
```

**Important notes:**
- In Vite, all env variables exposed to the browser MUST be prefixed with `VITE_`
- Add `.env.local` to `.gitignore` immediately (it may already be there — verify)
- Never put Firebase or Gemini keys in source code — always use `import.meta.env.VITE_*`

> 📘 **Learning Note — Environment Variables in Vite**
> In a Vite project, environment variables work differently from Node.js. In Node,
> you use `process.env.MY_VAR`. In Vite (which runs in the browser), you use
> `import.meta.env.VITE_MY_VAR`. The `VITE_` prefix is mandatory — Vite strips any
> variable without that prefix so it never accidentally leaks into the browser bundle.
> Your `.env.local` file is never committed to git, which keeps your API keys private.

---

## 10. README Requirements

The README must include all of the following sections before the project is considered complete:

1. **Project title and one-line description**
2. **Screenshots** — at least one screenshot of the app running (mobile viewport preferred)
3. **Prerequisites** — Node.js version, npm
4. **Setup** — step-by-step: clone → `npm install` → `.env.local` setup → Firebase project
   setup → `npm run dev`
5. **Firebase setup steps** — create project, enable Firestore, enable Google Auth,
   configure Firestore security rules
6. **Environment variables** — reference `.env.example` and explain where to get each key
7. **Available scripts** — `dev`, `build`, `lint`, `preview`
8. **Project structure** — brief one-line explanation of each top-level directory in `src/`
9. **Key architectural decisions** — why Firebase, why Gemini, why Zustand for UI state
10. **Known limitations** — Unsplash rate limit (50/hr), Gemini free tier quotas, v1 is
    single-user only

---

## 11. Completion Checklist

The build is not complete until every item below can be checked off. Each item is
pass/fail testable — no vague criteria.

### Auth & Setup
- [ ] User can sign in with Google on the `/login` page
- [ ] Unauthenticated users are redirected to `/login` when accessing any protected page
- [ ] User can sign out and is redirected to `/login`
- [ ] Session persists across browser refreshes (user stays logged in)
- [ ] `.env.example` is complete, `.env.local` is gitignored

### Recipe Library
- [ ] User's recipe library loads from Firestore on the Recipe Discovery page
- [ ] User can add a recipe manually via the `RecipeForm`
- [ ] User can edit an existing recipe
- [ ] User can delete a recipe (with confirmation dialog)
- [ ] Recipes without a photo display a stock image from Unsplash (or local fallback)
- [ ] Empty library shows `EmptyState` with an "Add Recipe" CTA

### Photo-to-Recipe
- [ ] "Scan Recipe" button opens a file/camera picker
- [ ] Uploading a recipe photo shows a loading state, then a pre-filled `RecipeForm`
- [ ] User can edit the extracted fields before saving
- [ ] Saving adds the recipe to Firestore and it appears in the library
- [ ] Uploading a non-recipe image shows a graceful error toast

### Internet Discovery
- [ ] "Find Online" tab shows a search input
- [ ] Typing a query and submitting shows a loading state, then recipe cards
- [ ] "Save to My Library" on a result saves it to Firestore
- [ ] Saved recipe appears in the library immediately
- [ ] Empty query is prevented with an inline error

### Recommendations
- [ ] "Recommended for You" tab shows recipes from the user's own library
- [ ] Recommendations respect the user's dietary preferences
- [ ] "Refresh" button loads a new set of recommendations
- [ ] Library with <5 recipes shows all recipes with a prompt to add more

### Meal Planner
- [ ] Each day shows assigned meal or an empty "Add Meal" slot
- [ ] Tapping an empty slot opens `QuickAssignModal`
- [ ] Assigned meal shows photo thumbnail, title, serving count, and prep time
- [ ] Removing a meal from a slot updates Firestore
- [ ] "Clear Week" resets all slots and updates Firestore
- [ ] "Generate Shopping List" button appears when at least one meal is assigned

### Shopping List
- [ ] Shopping list shows all ingredients aggregated from weekly plan, grouped by category
- [ ] Ingredient quantities are scaled to serving counts
- [ ] Duplicate ingredients across recipes are combined with a source label
- [ ] User can check off items (item strikes through and moves to bottom of its category)
- [ ] "Uncheck All" resets all checks
- [ ] User can add manual items via `AddItemInput`
- [ ] User can delete any item from the list
- [ ] Checked state persists across page navigation

### Plan History
- [ ] `/history` page shows past plans sorted by date descending
- [ ] Tapping a plan shows the 7-day grid for that week
- [ ] "Repeat This Week" copies the plan as the current plan and navigates to `/planner`
- [ ] No history shows `EmptyState`

### Preferences
- [ ] New user sees `PreferencesForm` on dashboard
- [ ] Submitting form saves preferences to Firestore `users/{uid}` document
- [ ] "Edit Preferences" button returns to the form
- [ ] Preferences are reflected in meal recommendations

### Accessibility
- [ ] All interactive elements reachable by Tab key
- [ ] All images have meaningful `alt` attributes
- [ ] Modal closes on Escape key; focus returns to trigger element
- [ ] No color-contrast violations (run Lighthouse accessibility audit)
- [ ] Shopping list checkboxes work with keyboard and screen reader

### Code Quality
- [ ] No `console.log` statements in committed code
- [ ] No TypeScript `any` without a documented comment
- [ ] All async functions have `try/catch` blocks
- [ ] ESLint passes with zero errors (`npm run lint`)
- [ ] README is written and all setup steps are verified as working
