# Meal Planner App — Requirements Document

**Version:** 1.0
**Date:** 2026-03-09
**Owner:** Will
**Status:** Draft — ready for development

---

## 1. The Problem Being Solved

Meal planning for a family is a weekly, recurring chore. The current process involves manually browsing recipes, deciding what to make for the week, and then cross-referencing ingredients to build a grocery list from scratch. This is time-consuming and mentally taxing — and it happens every single week.

The goal is to eliminate that friction with an app that handles the heavy lifting: suggesting meals, building the plan, and generating the shopping list automatically.

---

## 2. Goals & Success Metrics

**Primary goal:** Complete the full weekly meal planning process — from zero to a finalized meal plan and shopping list — in 15 minutes or less.

**Success looks like:**
- Open the app on Sunday (or any chosen day)
- Review and select from personalized meal recommendations
- Confirm the weekly plan
- Edit the auto-generated shopping list to reflect what's already in the house
- Walk out the door with a checkable shopping list and a week's worth of recipes ready to go

**Longer-term goal:** Eventually open the app to other users / the general public.

---

## 3. Users & Audience

**Version 1:** Single user (the app owner). No multi-user access needed in v1.

**Future:** Designed to scale to public users — architecture should support this from the start.

**Key user characteristics:**
- Uses the app primarily on a **mobile phone** (especially while grocery shopping)
- Plans meals for a **variable number of people** (serving size is selectable, not fixed)
- May have **dietary restrictions** to account for (e.g., allergies, preferences)
- Does all planning alone — no household collaboration needed in v1

---

## 4. Core Features — Version 1 Scope

Everything in this list must be working for v1 to be considered usable.

### Recipe Library
- Store recipes in a personal library with a consistent visual format
- Each recipe displays: name, photo, ingredients, steps, serving size, dietary tags
- **Add by photo:** Take or upload a photo of a recipe (from a book or magazine) — the app uses AI to extract the recipe and save it in the standard format
- **Add from internet:** Gemini can suggest or fetch recipes from the web; accepted suggestions are automatically parsed and saved to the personal library in the same format
- If no photo is available for a recipe, the app uses a stock food photo automatically

### Meal Recommendations
- The app suggests meals for the week based on:
  - Recipes already in the personal library
  - Internet sources (via Gemini), which are then saved to the library if selected
- Recommendations respect dietary restrictions and food preferences

### Weekly Meal Planning
- User reviews suggestions and selects meals for each day of the week
- Serving size is adjustable per plan (not locked to a fixed household size)
- Dietary restrictions are factored into what gets recommended

### Shopping List
- Auto-generated from the selected weekly meal plan
- User can:
  - Remove items they already have at home
  - Add extra items (non-recipe purchases)
  - Check off items one by one while shopping in-store
- Shopping list is mobile-friendly and usable in a grocery store

### Meal Plan History
- Completed weekly plans are saved automatically
- User can browse past weeks and **repeat a previous week's plan** — the app regenerates the shopping list for it

### Recipe View
- During the week, user can open any meal from the plan and view the full recipe

---

## 5. Out of Scope — Version 1

These are intentionally excluded from v1. They may be considered for future versions.

- Nutritional information / calorie tracking
- Grocery delivery service integrations (Instacart, etc.)
- Sharing meal plans with family members or friends
- Budget tracking for groceries
- Social features (public recipe discovery, user-generated content)
- Multi-user household accounts

---

## 6. Design & Branding

- **Style:** Clean and minimal
- **Visual tone:** Neutral base (white/light background) with food photography as the primary visual element
- Recipe cards should lead with the photo — the imagery carries the visual weight
- Mobile-first layout — designed to be used comfortably one-handed in a grocery store
- No domain name chosen yet — this is a task to complete before launch

---

## 7. Technical Stack & Integrations

| Layer | Technology |
|---|---|
| App type | Web app (mobile-first, runs in browser) |
| Frontend | React + Vite (already scaffolded) |
| Styling | Tailwind CSS (already configured) |
| Backend / Database | Google Firebase (Firestore, Auth, Hosting) |
| AI / Intelligence | Google Gemini Pro |
| Image analysis | Gemini (photo-to-recipe extraction) |
| Recipe suggestions | Gemini (personal library + internet) |
| Stock photos | Third-party stock photo API (TBD — e.g., Unsplash) |

**Notes:**
- Firebase and Gemini are already part of the owner's Google account
- Both have free tiers; owner is aware of usage-based costs at scale
- Architecture should be built to support public multi-user access in the future, even if v1 is single-user

---

## 8. Content & Data

- **Starting point:** No existing digital recipe library — will be built up over time through use
- **Recipe sources:**
  1. Manual photo upload (books, magazines)
  2. Internet suggestions via Gemini (auto-saved when accepted)
  3. Manual entry (if needed)
- All recipes are stored in a single unified format regardless of source
- Stock photos are used when no recipe-specific photo is available

---

## 9. Launch, Maintenance & Ownership

- **Built by:** Owner (Will), using Claude Code as development assistant
- **Timeline:** As soon as possible — no fixed deadline, but urgency is high
- **Maintenance preference:** Minimal upkeep — the app should largely run itself after launch
- **Initial launch:** Personal use only
- **Future launch:** Public-facing product (domain name TBD — selecting one is a pre-launch task)
- **Hosting:** Firebase Hosting

---

## 10. Open Tasks / Pre-Launch Checklist

- [ ] Choose and register a domain name
- [ ] Set up Firebase project and configure environment
- [ ] Set up Gemini API access
- [ ] Determine stock photo source (Unsplash API or similar)
- [ ] Design recipe card UI and overall layout
- [ ] Define dietary restriction tag system
- [ ] Plan data model (recipes, meal plans, shopping lists)
