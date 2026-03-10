# Meal Planner App — Handoff Summary for App Prompt Architect

---

## What We're Building

A **mobile-first web app** for weekly family meal planning. The user opens the app once a week, gets AI-powered meal recommendations, selects meals for each day, and walks away with a recipe-linked meal plan and an editable, checkable shopping list — all in under 15 minutes.

---

## Core Problem

Weekly meal planning is a recurring, manual chore: browse recipes → choose meals → figure out what to buy. The app eliminates all three steps through automation and a personal recipe library that grows over time.

---

## Must-Have Features (v1)

- **Recipe library** — personal collection stored in Firebase, unified display format
- **Add recipe by photo** — Gemini reads a photo of a book/magazine recipe and extracts it
- **Add recipe from internet** — Gemini suggests/fetches web recipes; accepted ones are auto-saved to library
- **Stock photos** — auto-assigned when no recipe photo exists
- **Meal recommendations** — based on library + internet, filtered by dietary restrictions and preferences
- **Weekly meal planner** — assign meals to days, adjustable serving size
- **Auto-generated shopping list** — derived from selected meals
- **Shopping list editing** — remove items on hand, add extras
- **Checkable shopping list** — tap to check off items while in-store
- **Meal plan history** — save past weeks, repeat a previous week's plan
- **Recipe viewer** — view full recipe from the weekly plan

---

## Explicit Non-Scope (v1)

No nutrition tracking, no grocery delivery integration, no social/sharing features, no budget tracking, no multi-user household accounts.

---

## Users

- **v1:** Single user (owner)
- **Future:** Public-facing product — architecture must support multi-user at scale
- **Primary device:** Mobile phone (grocery store use case is critical)

---

## Design Direction

Clean and minimal. Neutral/white base. Food photography is the primary visual element — recipe cards lead with the photo. One-handed mobile UX.

---

## Tech Stack

| | |
|---|---|
| Frontend | React + Vite + Tailwind CSS (already scaffolded) |
| Backend / DB | Google Firebase (Firestore, Auth, Hosting) |
| AI | Google Gemini Pro (recommendations, photo extraction, internet recipe parsing) |
| Stock Photos | TBD (Unsplash API or similar) |

---

## Constraints & Notes

- Owner already has Google/Gemini account — use that ecosystem throughout
- Firebase free tier to start; aware of scaling costs for future public launch
- Built by owner using Claude Code — keep code readable and well-commented
- Minimal ongoing maintenance required after launch
- Domain name not yet chosen — pre-launch task

---

## Success Metric

Full weekly meal planning (recommendations → plan → shopping list) completed in **15 minutes or less**.
