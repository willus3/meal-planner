import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Recipe } from '../types/recipe';

/**
 * Lazily initialized Gemini client.
 * We initialize on first use rather than at module load so the app doesn't
 * crash on startup if the key is missing.
 */
function getModel() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not set in your .env.local file.');
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

/**
 * Converts a browser File object to a base64 string.
 * Gemini's API requires images to be sent as base64-encoded inline data.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // result looks like "data:image/jpeg;base64,/9j/4AAQ..."
      // We only want the part after the comma
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Strips markdown code fences from a Gemini response if present.
 * Gemini sometimes wraps JSON in ```json ... ``` even when told not to.
 */
function stripCodeFences(text: string): string {
  return text
    .replace(/^```(?:json)?\n?/i, '')
    .replace(/\n?```$/i, '')
    .trim();
}

/**
 * Adds a unique ID to each ingredient returned by Gemini.
 * Gemini doesn't know about our internal ID format, so we generate them here.
 */
function addIngredientIds(ingredients: Omit<Recipe['ingredients'][number], 'id'>[]): Recipe['ingredients'] {
  return ingredients.map((ing, index) => ({
    ...ing,
    id: `ing-${Date.now()}-${index}`,
  }));
}

// ─── Photo-to-Recipe ─────────────────────────────────────────────────────────

const PHOTO_EXTRACTION_PROMPT = `Analyze this recipe image and extract the following information in JSON format:
{
  "title": "recipe name",
  "description": "1-2 sentence summary of the dish",
  "prepTimeMinutes": number,
  "baseServings": number (how many people this recipe serves as written),
  "effortLevel": "Quick Weekday" or "Average" or "Long Weekend",
  "dietaryTags": array of zero or more of: "Vegetarian", "Vegan", "Keto", "Paleo", "Gluten-Free",
  "ingredients": [
    { "name": "ingredient name", "quantity": number, "unit": "unit of measure", "category": "Produce" or "Dairy" or "Meat" or "Pantry" or "Spices" or "Bakery" or "Frozen" or "Other" }
  ],
  "instructions": ["step 1 as a complete sentence", "step 2", ...]
}
Return ONLY valid JSON with no explanation, no markdown, no code blocks. If a field cannot be determined from the image, use a sensible default.`;

/**
 * Sends a recipe photo to Gemini and returns the extracted recipe data.
 * The returned object is partial — the user reviews and can edit before saving.
 *
 * @throws Error with a user-friendly message on failure
 */
export async function extractRecipeFromPhoto(
  imageFile: File
): Promise<Omit<Recipe, 'id' | 'createdAt' | 'source'>> {
  const model = getModel();
  const base64Data = await fileToBase64(imageFile);

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType: imageFile.type,
    },
  };

  let text: string;
  try {
    const result = await model.generateContent([PHOTO_EXTRACTION_PROMPT, imagePart]);
    text = result.response.text();
  } catch (err: unknown) {
    // Surface the real Gemini error so it's easier to diagnose
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Gemini API error: ${detail}`);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripCodeFences(text));
  } catch {
    // Gemini returned something we couldn't parse — still let the user fill in manually
    throw new Error("Couldn't read that photo clearly. You can enter the recipe manually instead.");
  }

  return {
    title: (parsed.title as string) ?? '',
    description: (parsed.description as string) ?? '',
    imageUrl: '',
    effortLevel: (parsed.effortLevel as Recipe['effortLevel']) ?? 'Average',
    prepTimeMinutes: (parsed.prepTimeMinutes as number) ?? 30,
    baseServings: (parsed.baseServings as number) ?? 4,
    dietaryTags: (parsed.dietaryTags as Recipe['dietaryTags']) ?? [],
    ingredients: addIngredientIds(
      (parsed.ingredients as Omit<Recipe['ingredients'][number], 'id'>[]) ?? []
    ),
    instructions: (parsed.instructions as string[]) ?? [],
  };
}

// ─── Text-to-Recipe ──────────────────────────────────────────────────────────

const TEXT_EXTRACTION_PROMPT = (text: string) =>
  `Extract the recipe from the following text and return it in JSON format.
The text may contain ads, comments, blog posts, or other irrelevant content — ignore all of that and focus only on the recipe.

Text to parse:
"""
${text}
"""

Return ONLY valid JSON with this structure:
{
  "title": "recipe name",
  "description": "1-2 sentence summary of the dish",
  "prepTimeMinutes": number,
  "baseServings": number (how many people this recipe serves as written),
  "effortLevel": "Quick Weekday" or "Average" or "Long Weekend",
  "dietaryTags": array of zero or more of: "Vegetarian", "Vegan", "Keto", "Paleo", "Gluten-Free",
  "ingredients": [
    { "name": "ingredient name", "quantity": number, "unit": "unit of measure", "category": "Produce" or "Dairy" or "Meat" or "Pantry" or "Spices" or "Bakery" or "Frozen" or "Other" }
  ],
  "instructions": ["step 1 as a complete sentence", "step 2", ...]
}
No markdown, no explanation, no code blocks. If a field cannot be determined, use a sensible default.`;

/**
 * Extracts a structured recipe from pasted text (e.g. copied from a recipe website).
 * Works well even with messy text that includes ads, comments, and other irrelevant content.
 *
 * @throws Error with a user-friendly message on failure
 */
export async function extractRecipeFromText(
  pastedText: string
): Promise<Omit<Recipe, 'id' | 'createdAt' | 'source'>> {
  const model = getModel();

  let text: string;
  try {
    const result = await model.generateContent(TEXT_EXTRACTION_PROMPT(pastedText));
    text = result.response.text();
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    throw new Error(`Gemini API error: ${detail}`);
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripCodeFences(text));
  } catch {
    throw new Error("Couldn't extract a recipe from that text. Try selecting more of the page, or enter the recipe manually.");
  }

  return {
    title: (parsed.title as string) ?? '',
    description: (parsed.description as string) ?? '',
    imageUrl: '',
    effortLevel: (parsed.effortLevel as Recipe['effortLevel']) ?? 'Average',
    prepTimeMinutes: (parsed.prepTimeMinutes as number) ?? 30,
    baseServings: (parsed.baseServings as number) ?? 4,
    dietaryTags: (parsed.dietaryTags as Recipe['dietaryTags']) ?? [],
    ingredients: addIngredientIds(
      (parsed.ingredients as Omit<Recipe['ingredients'][number], 'id'>[]) ?? []
    ),
    instructions: (parsed.instructions as string[]) ?? [],
  };
}

// ─── Internet Recipe Search ───────────────────────────────────────────────────

const INTERNET_SEARCH_PROMPT = (query: string, preferences: string, count: number) =>
  `Suggest ${count} recipes matching this request: "${query}".
The user has these dietary preferences: ${preferences || 'none specified'}.
Return ONLY a valid JSON array of recipe objects with this exact structure:
[{
  "title": "recipe name",
  "description": "1-2 sentence summary",
  "prepTimeMinutes": number,
  "baseServings": number (how many people this recipe serves as written),
  "effortLevel": "Quick Weekday" or "Average" or "Long Weekend",
  "dietaryTags": array of zero or more of: "Vegetarian", "Vegan", "Keto", "Paleo", "Gluten-Free",
  "ingredients": [
    { "name": "ingredient name", "quantity": number, "unit": "unit of measure", "category": "Produce" or "Dairy" or "Meat" or "Pantry" or "Spices" or "Bakery" or "Frozen" or "Other" }
  ],
  "instructions": ["step 1", "step 2", ...]
}]
Return only the JSON array. No markdown, no explanation, no code blocks.`;

/**
 * Asks Gemini to suggest recipes from the internet matching the user's query.
 * Accepted recipes are saved to the user's library by the caller.
 */
export async function searchInternetRecipes(
  query: string,
  dietaryPreferences: string[],
  count = 5
): Promise<Omit<Recipe, 'id' | 'createdAt' | 'source'>[]> {
  const model = getModel();
  const preferences = dietaryPreferences.join(', ');
  const prompt = INTERNET_SEARCH_PROMPT(query, preferences, count);

  let text: string;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch {
    throw new Error("Couldn't connect to Gemini. Check your API key and internet connection.");
  }

  let parsed: Record<string, unknown>[];
  try {
    parsed = JSON.parse(stripCodeFences(text));
    if (!Array.isArray(parsed)) throw new Error('Expected array');
  } catch {
    throw new Error('Search failed. Try different keywords or try again.');
  }

  return parsed.map((item) => ({
    title: (item.title as string) ?? 'Untitled Recipe',
    description: (item.description as string) ?? '',
    imageUrl: '',
    effortLevel: (item.effortLevel as Recipe['effortLevel']) ?? 'Average',
    prepTimeMinutes: (item.prepTimeMinutes as number) ?? 30,
    baseServings: (item.baseServings as number) ?? 4,
    dietaryTags: (item.dietaryTags as Recipe['dietaryTags']) ?? [],
    ingredients: addIngredientIds(
      (item.ingredients as Omit<Recipe['ingredients'][number], 'id'>[]) ?? []
    ),
    instructions: (item.instructions as string[]) ?? [],
  }));
}

// ─── AI Recommendations ───────────────────────────────────────────────────────

const RECOMMENDATIONS_PROMPT = (
  recipeSummaries: string,
  preferences: string,
  disliked: string,
  effortLevel: string,
  count: number
) =>
  `From this list of recipes, recommend ${count} that best match the user's preferences.
Available recipes:
${recipeSummaries}
User preferences:
- Dietary needs: ${preferences || 'none'}
- Disliked ingredients: ${disliked || 'none'}
- Preferred effort level: ${effortLevel}
Return ONLY a JSON array of the recipe titles you recommend, in order of best match.
Example: ["Recipe Title 1", "Recipe Title 2"]
No markdown, no explanation.`;

/**
 * Asks Gemini to recommend recipes from the user's library based on their preferences.
 * Returns an array of recipe titles (matched back to full Recipe objects by the caller).
 */
export async function getRecommendations(
  recipes: Pick<Recipe, 'title' | 'dietaryTags' | 'effortLevel'>[],
  preferences: {
    dietaryPreferences: string[];
    dislikedIngredients: string[];
    defaultEffortLevel: string;
  },
  count = 6
): Promise<string[]> {
  if (recipes.length === 0) return [];

  const model = getModel();

  // Send only title + tags to Gemini — no need to send full ingredient lists
  const recipeSummaries = recipes
    .map((r) => `- ${r.title} [${r.effortLevel}${r.dietaryTags.length ? ', ' + r.dietaryTags.join(', ') : ''}]`)
    .join('\n');

  const prompt = RECOMMENDATIONS_PROMPT(
    recipeSummaries,
    preferences.dietaryPreferences.join(', '),
    preferences.dislikedIngredients.join(', '),
    preferences.defaultEffortLevel,
    Math.min(count, recipes.length)
  );

  let text: string;
  try {
    const result = await model.generateContent(prompt);
    text = result.response.text();
  } catch {
    throw new Error('Could not get recommendations right now. Showing all recipes instead.');
  }

  try {
    const parsed = JSON.parse(stripCodeFences(text));
    if (!Array.isArray(parsed)) return [];
    return parsed as string[];
  } catch {
    return [];
  }
}
