# Deployment Guide — Meal Planner Pro

This document covers everything you need to know to deploy, maintain, and update the live app.

---

## Overview

| What | Where |
|---|---|
| Live URL | https://meal-planner-51d03.web.app |
| Hosting | Firebase Hosting |
| Firebase Project | `meal-planner-51d03` |
| Firebase Console | https://console.firebase.google.com/project/meal-planner-51d03 |
| GitHub Repo | https://github.com/willus3/meal-planner |
| CI/CD | GitHub Actions (auto-deploys on push to `main`) |

---

## How Deployments Work

### Automatic (recommended)

Every time you push code to the `main` branch on GitHub, a GitHub Actions workflow runs automatically:

1. GitHub pulls the latest code
2. Runs `npm ci` (clean install of dependencies)
3. Runs `npm run build` (TypeScript check + Vite production build)
4. Deploys the `dist/` folder to Firebase Hosting
5. Live in ~2 minutes

You can watch deployments in progress at:
**https://github.com/willus3/meal-planner/actions**

### Manual (fallback)

If you need to deploy immediately from your local machine without pushing to GitHub:

```bash
npm run build
firebase deploy --only hosting
```

You must be logged into the Firebase CLI (`firebase login`) for this to work.

---

## GitHub Actions Setup

### Workflow files

Located in `.github/workflows/`:

| File | Purpose |
|---|---|
| `firebase-hosting-merge.yml` | Deploys to live channel on every push to `main` |
| `firebase-hosting-pull-request.yml` | Deploys a preview URL when a pull request is opened |

### Required GitHub Secrets

Go to **GitHub → Settings → Secrets and variables → Actions** to manage these.

| Secret | Description |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT_MEAL_PLANNER_51D03` | Auto-created by Firebase CLI. Gives GitHub Actions permission to deploy. Do not delete or modify. |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_GEMINI_API_KEY` | Google Gemini API key |
| `VITE_UNSPLASH_ACCESS_KEY` | Unsplash API access key (add when approved) |

> **Important:** The `VITE_*` secrets are injected into the build step so Vite can embed them in the JavaScript bundle. Without them, the live app will show a blank white screen with a Firebase `auth/invalid-api-key` error.

---

## API Accounts & Keys

### Firebase (Google)

- **Console:** https://console.firebase.google.com
- **Project:** `meal-planner-51d03`
- **Account:** Your Google account
- **Services in use:**
  - **Authentication** — Google Sign-In only
  - **Firestore** — Main database (recipes, meal plans, preferences)
  - **Storage** — Reserved for future photo uploads
  - **Hosting** — Serves the live app
- **Pricing:** Free Spark plan. Firestore free tier: 50,000 reads/day, 20,000 writes/day, 20,000 deletes/day. More than enough for personal use.
- **Billing alert:** Set up a budget alert in Google Cloud Console if you ever plan to go public.

### Google Gemini AI

- **Console:** https://aistudio.google.com
- **Account:** Your Google account
- **Model in use:** `gemini-2.5-flash` (stable, production-ready as of early 2026)
- **Used for:**
  - Extracting recipes from photos (multimodal)
  - Extracting recipes from pasted website text
  - Internet recipe search/suggestions
  - Personalized meal recommendations from your library
- **Pricing:** Free tier has daily request limits. Monitor usage in AI Studio.
- **Key location in code:** `src/services/geminiService.ts` → `getModel()` function
- **If you need to change the model:** Update the model string in `getModel()`. Check [Google AI for Developers](https://ai.google.dev/gemini-api/docs/models) for current model IDs.

### Unsplash (Stock Photos)

- **Console:** https://unsplash.com/developers
- **Used for:** Auto-fetching a food photo for recipes that don't have one
- **Pricing:** Free tier — 50 requests/hour. Sufficient for personal use.
- **Fallback:** If the key is missing or rate limited, the app shows a local SVG placeholder at `/public/assets/recipe-placeholder.svg`. The app works fine without this key.
- **Status:** Key pending approval (5-10 business days from account creation). Add `VITE_UNSPLASH_ACCESS_KEY` to `.env.local` and GitHub Secrets once approved.

---

## Firestore Data Model

All data is scoped under `users/{uid}/` so each user's data is completely isolated.

```
users/
  {uid}/
    preferences (fields on the user document):
      dietaryPreferences: string[]
      dislikedIngredients: string[]
      defaultEffortLevel: string
      familySize: number
      hasOnboarded: boolean

    recipes/ (sub-collection)
      {recipeId}/
        title: string
        description: string
        imageUrl: string
        effortLevel: string
        prepTimeMinutes: number
        baseServings: number
        dietaryTags: string[]
        ingredients: Ingredient[]
        instructions: string[]
        source: 'manual' | 'photo' | 'internet'
        createdAt: Timestamp

    mealPlans/ (sub-collection)
      {planId}/
        weekStartDate: string (ISO date, always a Monday)
        weekEndDate: string (ISO date, always a Sunday)
        schedule:
          Monday: { recipeId: string, servings: number } | null
          Tuesday: ...
          (etc.)
        generatedItems: ShoppingItem[]
        manualItems: ShoppingItem[]
        createdAt: Timestamp
        isActive: boolean
```

---

## Firestore Security Rules

**Current rules** (set in Firebase Console → Firestore → Rules):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

These rules ensure:
- Users can only read/write their own data
- Unauthenticated requests are rejected

**Before going public:** Review and tighten these rules. For example, add field-level validation to prevent writing malformed data.

---

## Updating the App

### Routine code change

```bash
# Make your changes in VS Code
git add .
git commit -m "your commit message"
git push origin main
# GitHub Actions deploys automatically — done
```

### Updating dependencies

```bash
npm update
npm run build   # verify nothing broke
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin main
```

### Changing the Gemini model

If Google deprecates `gemini-2.5-flash`, update this line in `src/services/geminiService.ts`:

```typescript
return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
```

Replace with the new model ID from [Google AI for Developers](https://ai.google.dev/gemini-api/docs/models). Then rebuild and deploy.

---

## Custom Domain (future)

When you're ready to use a custom domain (e.g. `mealplanner.com`):

1. Firebase Console → **Hosting** → **Add custom domain**
2. Follow the DNS verification steps (add a TXT record to your domain registrar)
3. Firebase auto-provisions an SSL certificate
4. Add the new domain to Firebase Authentication's **Authorized domains** list

---

## Local Development Reference

```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # Production build (check for errors before deploying)
npm run lint         # Check for code issues
firebase deploy --only hosting   # Manual deploy from local machine
firebase login       # Log in to Firebase CLI (required for manual deploy)
```

---

## Troubleshooting

### Blank white screen on live site

**Most likely cause:** The GitHub Actions build ran without the `VITE_*` environment variables.

**Fix:**
1. Verify all secrets are set in GitHub → Settings → Secrets and variables → Actions
2. Run a manual local deploy: `npm run build && firebase deploy --only hosting`

### `auth/invalid-api-key` error in console

The Firebase API key is missing or wrong in the build. Same fix as above.

### Shopping list items not merging (duplicate ingredients)

The aggregation key is `ingredientName-unit`. If two recipes use different spellings for the same unit (e.g. "tablespoon" vs "tbsp"), they will be normalized. If they use completely different names for the same ingredient (e.g. "chicken breast" vs "chicken"), they cannot be auto-merged. This is a known limitation.

### Gemini returns a 404 error

The model name or API version is wrong. Check `src/services/geminiService.ts` and update the model string to a currently supported model from [Google AI for Developers](https://ai.google.dev/gemini-api/docs/models).

> **Note:** `gemini-1.5-flash` with `apiVersion: 'v1'` returns a 404. Use `gemini-2.5-flash` with no apiVersion override.
