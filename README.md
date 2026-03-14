# Meal Planner Pro

A mobile-first web app for weekly family meal planning. Open it once a week, get AI-powered meal recommendations, assign meals to each day, and walk away with a recipe-linked meal plan and a category-organized, checkable grocery list — all in under 15 minutes.

---

## Features

- **Recipe Library** — Add recipes manually, scan a photo of a cookbook page, or import directly from any recipe URL. Rate recipes with an emoji scale after you cook them.
- **Find Online** — Search thousands of real recipes via TheMealDB (with photos and source links), or paste any recipe URL to have Gemini extract and save it automatically.
- **AI Meal Recommendations** — Gemini picks recipes from your library based on your dietary preferences and effort level.
- **Weekly Meal Planner** — Assign recipes to each day of the week with an adjustable serving size per meal. Syncs in real time across all your devices.
- **Shopping List** — Ingredients are automatically aggregated from your weekly plan, scaled to your planned servings, and organized by category. Add manual items too.
- **Plan History** — Browse past meal plans and repeat any week with one tap.

---

## Live App

**https://meal-planner-51d03.web.app**

---

## Screenshots

> Add screenshots here once the app is in regular use. Mobile viewport preferred.

---

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- A Google account (used for Firebase and Gemini)

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/willus3/meal-planner.git
cd meal-planner
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create your environment file

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all values. See **Environment Variables** below for where to get each one.

### 4. Start the development server

```bash
npm run dev
```

App runs at **http://localhost:5173**

---

## Firebase Setup

### 1. Create a Firebase project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** and follow the steps
3. Click **Add app** → **Web app**
4. Copy the config values into your `.env.local`

### 2. Enable Google Authentication

1. Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Google**
3. Under **Authorized domains**, add `localhost` (for dev) and your live domain

### 3. Enable Firestore Database

1. Firebase Console → **Firestore Database** → **Create database**
2. Choose **Start in production mode**
3. Select a region close to you

### 4. Firestore Security Rules

Go to **Firestore Database** → **Rules** and paste:

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

This ensures each user can only access their own data.

---

## Environment Variables

All variables must be prefixed with `VITE_` (Vite requirement for browser access).

| Variable | Where to get it |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your Apps → Web App |
| `VITE_FIREBASE_AUTH_DOMAIN` | Same as above |
| `VITE_FIREBASE_PROJECT_ID` | Same as above |
| `VITE_FIREBASE_STORAGE_BUCKET` | Same as above |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Same as above |
| `VITE_FIREBASE_APP_ID` | Same as above |
| `VITE_GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com) → Get API key |
| `VITE_UNSPLASH_ACCESS_KEY` | [Unsplash Developers](https://unsplash.com/developers) → Your Application → Keys |

> **Never commit `.env.local` to git.** It is already listed in `.gitignore`.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server at localhost:5173 |
| `npm run build` | TypeScript check + production build (output to `dist/`) |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview the production build locally |

---

## Project Structure

```
src/
├── components/
│   ├── auth/         # AuthGuard — redirects unauthenticated users to /login
│   ├── recipes/      # RecipeCard, RecipeForm, PhotoUpload, RecipeDetail, etc.
│   ├── shopping/     # AddItemInput
│   └── ui/           # Modal, LoadingSpinner, EmptyState, PreferencesForm
├── contexts/         # AuthContext — Firebase auth state shared app-wide
├── hooks/            # Custom hooks (useRecipes, useMealPlan, usePlanHistory, etc.)
├── lib/              # Firebase init, constants, Zustand store, utilities
├── pages/            # One file per route (Dashboard, RecipeDiscovery, MealPlanner, etc.)
├── services/         # All Firestore + external API calls (never called directly from components)
├── store/            # Zustand uiStore for transient UI state (checked/hidden shopping items)
└── types/            # TypeScript interfaces (Recipe, MealPlan, UserPreferences)
```

---

## Key Architectural Decisions

### Why Firebase?
Firebase provides auth, database, and file storage in one platform under the same Google account used for Gemini. Firestore's offline persistence keeps the shopping list working without a signal — important for the grocery store use case.

### Why Gemini AI?
Gemini is multimodal — it reads both text and images in the same request. This powers recipe extraction from cookbook photos, web recipe discovery, and personalized meal recommendations from your library. The current model is `gemini-2.5-flash`.

### Why Zustand for UI state?
Checked and hidden shopping list items are session-level state — they don't need to be stored in a database. Zustand with localStorage persistence keeps this fast and local, while Firestore handles all permanent data.

### No data-fetching in page components
All Firestore calls go through `/services`. Pages and components only talk to custom hooks in `/hooks`. This keeps components clean and makes the data layer easy to change independently.

---

## Known Limitations

- **Unsplash rate limit:** Free tier allows 50 requests/hour. If exceeded, recipes display a local placeholder image. Add your Unsplash key to resolve this.
- **Gemini free tier:** Has daily request quotas. Heavy use of recipe scanning and recommendations may hit limits. Monitor at [Google AI Studio](https://aistudio.google.com).
- **Single user (v1):** Built for personal use. Firestore data is scoped under `users/{uid}/` so multi-user support is architectural possible but not yet exposed via a sign-up flow.
- **No nutrition tracking, budget tracking, or grocery delivery** — out of scope for v1.

---

## Deployment

See `DEPLOYMENT.md` for full deployment details, GitHub Actions setup, and ongoing maintenance instructions.
