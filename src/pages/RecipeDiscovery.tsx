import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, ChefHat, Camera, Globe, Loader2, Sparkles, RefreshCw, ExternalLink, Link2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useRecipes } from '../hooks/useRecipes';
import { useUserPreferencesStore } from '../lib/store';
import { extractRecipeFromUrl } from '../services/geminiService';
import { searchMealDb } from '../services/mealDbService';
import RecipeCard from '../components/recipes/RecipeCard';
import { QuickAssignModal } from '../components/recipes/QuickAssignModal';
import Modal from '../components/ui/Modal';
import RecipeForm from '../components/recipes/RecipeForm';
import PhotoUpload from '../components/recipes/PhotoUpload';
import RecipeDetail from '../components/recipes/RecipeDetail';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Recipe } from '../types/recipe';

type TabFilter = 'All' | 'FindOnline' | 'Recommended';

// Shape returned by searchInternetRecipes — no id, createdAt, or source yet
type OnlineResult = Omit<Recipe, 'id' | 'createdAt' | 'source'>;

export default function RecipeDiscovery() {
  const { recipes, loading, error, addRecipe, updateRecipe, deleteRecipe, getRecommended } = useRecipes();
  const { dietaryPreferences, dislikedIngredients, defaultEffortLevel } = useUserPreferencesStore();

  // ── Library state ──────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabFilter>('All');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [assigningRecipe, setAssigningRecipe] = useState<Recipe | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // ── Find Online state ──────────────────────────────────────────────────────
  const [onlineQuery, setOnlineQuery] = useState('');
  const [onlineResults, setOnlineResults] = useState<OnlineResult[]>([]);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  // Track which result indices have been saved so we can show a "Saved" state
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [savingIndex, setSavingIndex] = useState<number | null>(null);

  // ── URL import state ───────────────────────────────────────────────────────
  const [urlInput, setUrlInput] = useState('');
  const [urlResult, setUrlResult] = useState<OnlineResult | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlSaved, setUrlSaved] = useState(false);
  const [urlSaving, setUrlSaving] = useState(false);
  const [urlPhotoUrl, setUrlPhotoUrl] = useState('');

  // ── Online result preview state ────────────────────────────────────────────
  const [viewingOnlineResult, setViewingOnlineResult] = useState<OnlineResult | null>(null);

  // ── Recommended state ──────────────────────────────────────────────────────
  const [recommendedRecipes, setRecommendedRecipes] = useState<Recipe[]>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(false);
  const [recommendedError, setRecommendedError] = useState<string | null>(null);

  // ── Recommendations ────────────────────────────────────────────────────────

  const loadRecommendations = useCallback(async () => {
    setRecommendedLoading(true);
    setRecommendedError(null);
    try {
      const results = await getRecommended({
        dietaryPreferences,
        dislikedIngredients,
        defaultEffortLevel,
      });
      setRecommendedRecipes(results);
    } catch {
      setRecommendedError('Could not load recommendations. Please try again.');
    } finally {
      setRecommendedLoading(false);
    }
  }, [getRecommended, dietaryPreferences, dislikedIngredients, defaultEffortLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load recommendations the first time the user opens that tab
  useEffect(() => {
    if (activeTab === 'Recommended' && !recommendedLoading && recommendedRecipes.length === 0) {
      loadRecommendations();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Library filtering ──────────────────────────────────────────────────────
  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Returns true if a recipe title already exists in the user's library. */
  const isDuplicate = (title: string) =>
    recipes.some((r) => r.title.toLowerCase() === title.toLowerCase());

  // RecipeForm omits 'source' — we add it here before saving
  type FormData = Omit<Recipe, 'id' | 'createdAt' | 'source'>;

  /** Saves an emoji rating (1–5) to a library recipe. */
  const handleRate = async (recipeId: string, rating: number) => {
    try {
      await updateRecipe(recipeId, { rating });
    } catch {
      setActionError('Failed to save rating. Please try again.');
    }
  };

  // ── Library handlers ───────────────────────────────────────────────────────

  const handleAdd = async (data: FormData) => {
    setActionError(null);
    try {
      await addRecipe({ ...data, source: 'manual' });
      setShowAddForm(false);
    } catch {
      setActionError('Failed to save recipe. Please try again.');
    }
  };

  const handleEdit = async (data: FormData) => {
    if (!editingRecipe) return;
    setActionError(null);
    try {
      await updateRecipe(editingRecipe.id, data);
      setEditingRecipe(null);
    } catch {
      setActionError('Failed to update recipe. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    setActionError(null);
    try {
      await deleteRecipe(id);
      setDeleteConfirmId(null);
    } catch {
      setActionError('Failed to delete recipe. Please try again.');
    }
  };

  // ── Find Online handlers ───────────────────────────────────────────────────

  const handleOnlineSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onlineQuery.trim()) return;

    setOnlineLoading(true);
    setOnlineError(null);
    setOnlineResults([]);
    setSavedIndices(new Set());

    try {
      const results = await searchMealDb(onlineQuery);
      setOnlineResults(results);
      if (results.length === 0) {
        setOnlineError('No results found. Try different keywords — TheMealDB works best with dish names like "chicken tikka" or "beef stew".');
      }
    } catch (err) {
      setOnlineError(err instanceof Error ? err.message : 'Search failed. Try again.');
    } finally {
      setOnlineLoading(false);
    }
  };

  /**
   * Saves an internet search result to the user's Firestore library.
   * asCopy = true appends " (Copy)" to the title to avoid a duplicate name conflict.
   */
  const handleSaveToLibrary = async (index: number, data: OnlineResult, asCopy = false) => {
    setSavingIndex(index);
    setActionError(null);
    try {
      const title = asCopy ? `${data.title} (Copy)` : data.title;
      await addRecipe({ ...data, title, source: 'internet' });
      setSavedIndices((prev) => new Set(prev).add(index));
    } catch {
      setActionError('Failed to save recipe. Please try again.');
    } finally {
      setSavingIndex(null);
    }
  };

  /** Imports a recipe directly from a pasted URL via Gemini URL grounding. */
  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setUrlLoading(true);
    setUrlError(null);
    setUrlResult(null);
    setUrlSaved(false);
    setUrlPhotoUrl('');

    try {
      const result = await extractRecipeFromUrl(urlInput.trim());
      setUrlResult(result);
    } catch (err) {
      setUrlError(err instanceof Error ? err.message : 'Failed to import recipe from that URL.');
    } finally {
      setUrlLoading(false);
    }
  };

  /** Saves the URL-imported recipe result to the library. */
  const handleSaveUrlResult = async () => {
    if (!urlResult) return;
    setUrlSaving(true);
    setActionError(null);
    try {
      const title = isDuplicate(urlResult.title) ? `${urlResult.title} (Copy)` : urlResult.title;
      // Use the manually entered photo URL if provided, otherwise keep whatever Gemini extracted
      const imageUrl = urlPhotoUrl.trim() || urlResult.imageUrl;
      await addRecipe({ ...urlResult, title, imageUrl, source: 'internet' });
      setUrlSaved(true);
    } catch {
      setActionError('Failed to save recipe. Please try again.');
    } finally {
      setUrlSaving(false);
    }
  };

  // QuickAssignModal expects the old Recipe type from lib/recipes — cast is safe
  const recipeForModal = assigningRecipe as unknown as import('../lib/recipes').Recipe;

  if (loading) return <LoadingSpinner message="Loading your recipes..." />;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Page Header */}
      <div className="border-b border-gray-100 pb-6 space-y-4">

        {/* Title row + action buttons */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Recipes</h1>
            <p className="text-gray-500">
              {recipes.length > 0
                ? `${recipes.length} recipe${recipes.length === 1 ? '' : 's'} in your library`
                : 'Your personal recipe library'}
            </p>
          </div>

          {/* Action buttons — always top-right, never compete with tabs */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowPhotoUpload(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label="Scan a recipe"
            >
              <Camera size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Scan</span>
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Plus size={16} aria-hidden="true" />
              <span className="hidden sm:inline">Add Recipe</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        {/* Tab switcher — full width on all screen sizes */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          {([
            { key: 'All', label: 'My Library', shortLabel: 'Library' },
            { key: 'FindOnline', label: 'Find Online', shortLabel: 'Online' },
            { key: 'Recommended', label: 'Recommended', shortLabel: 'Picks' },
          ] as { key: TabFilter; label: string; shortLabel: string }[]).map(({ key, label, shortLabel }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={cn(
                'flex-1 py-2 px-1 rounded-md text-sm font-medium transition-colors',
                activeTab === key ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error banner */}
      {(error || actionError) && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error ?? actionError}
        </div>
      )}

      {/* ── My Library Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'All' && (
        <>
          {/* Search bar */}
          {recipes.length > 0 && (
            <div className="relative max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="search"
                placeholder="Search recipes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                aria-label="Search recipes"
              />
            </div>
          )}

          {/* Recipe grid or empty state */}
          {recipes.length === 0 ? (
            <EmptyState
              icon={<ChefHat className="w-8 h-8" />}
              title="Your recipe library is empty"
              description="Add your first recipe manually, scan one from a book, or find one online."
              action={
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Add Your First Recipe
                </button>
              }
            />
          ) : filteredRecipes.length === 0 ? (
            <EmptyState
              icon={<Search className="w-8 h-8" />}
              title="No recipes found"
              description="Try different search terms or clear your search."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe as unknown as import('../lib/recipes').Recipe}
                  onView={() => setViewingRecipe(recipe)}
                  onEdit={() => setEditingRecipe(recipe)}
                  onDelete={() => setDeleteConfirmId(recipe.id)}
                  onRate={(rating) => handleRate(recipe.id, rating)}
                  actionButton={
                    <button
                      onClick={() => setAssigningRecipe(recipe)}
                      className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-colors border border-transparent hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      + Add to Plan
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Find Online Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'FindOnline' && (
        <div className="space-y-6">

          {/* Search form */}
          <form onSubmit={handleOnlineSearch} className="flex gap-3 max-w-2xl" noValidate>
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Globe className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                type="search"
                placeholder='Try "chicken tikka", "beef stew", or "chocolate cake"'
                value={onlineQuery}
                onChange={(e) => {
                  setOnlineQuery(e.target.value);
                  if (!e.target.value) {
                    setOnlineResults([]);
                    setOnlineError(null);
                    setSavedIndices(new Set());
                  }
                }}
                className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                aria-label="Search for recipes"
                disabled={onlineLoading}
              />
            </div>
            <button
              type="submit"
              disabled={onlineLoading || !onlineQuery.trim()}
              className="px-6 py-3 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex items-center gap-2 shrink-0"
            >
              {onlineLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={16} aria-hidden="true" />
                  Search
                </>
              )}
            </button>
          </form>

          {/* Loading skeleton */}
          {onlineLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
                  <div className="h-48 bg-gray-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {onlineError && !onlineLoading && (
            <EmptyState
              icon={<Search className="w-8 h-8" />}
              title="No results found"
              description={onlineError}
            />
          )}

          {/* Results grid */}
          {!onlineLoading && onlineResults.length > 0 && (
            <>
              <p className="text-sm text-gray-500">
                {onlineResults.length} real recipe{onlineResults.length === 1 ? '' : 's'} found — click a card to preview, then save any you like.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {onlineResults.map((result, index) => {
                  const alreadySaved = savedIndices.has(index);
                  const duplicate = isDuplicate(result.title);
                  const isSaving = savingIndex === index;

                  return (
                    <RecipeCard
                      key={index}
                      recipe={{ ...result, id: `online-${index}`, createdAt: new Date(), source: 'internet' } as unknown as import('../lib/recipes').Recipe}
                      onView={() => setViewingOnlineResult(result)}
                      actionButton={
                        <div className="space-y-2">
                          {/* Real source link from TheMealDB */}
                          {result.sourceUrl && (
                            <a
                              href={result.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                              title={result.sourceUrl}
                            >
                              <ExternalLink size={11} aria-hidden="true" />
                              View original recipe
                            </a>
                          )}

                          {/* Duplicate warning */}
                          {duplicate && !alreadySaved && (
                            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                              Already in your library.{' '}
                              <button
                                onClick={() => handleSaveToLibrary(index, result, true)}
                                disabled={isSaving}
                                className="font-semibold underline hover:no-underline focus:outline-none"
                              >
                                Save as copy?
                              </button>
                            </p>
                          )}

                          {alreadySaved ? (
                            <div className="w-full py-2 bg-green-50 text-green-700 font-medium rounded-lg text-sm text-center border border-green-200">
                              ✓ Saved to Library
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSaveToLibrary(index, result)}
                              disabled={isSaving || duplicate}
                              className={cn(
                                'w-full py-2 font-medium rounded-lg text-sm transition-colors border focus:outline-none focus:ring-2 focus:ring-primary',
                                duplicate
                                  ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                                  : 'bg-primary/10 hover:bg-primary/20 text-primary border-transparent hover:border-primary/30'
                              )}
                            >
                              {isSaving ? 'Saving...' : 'Save to My Library'}
                            </button>
                          )}
                        </div>
                      }
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* Initial prompt — before any search */}
          {!onlineLoading && onlineResults.length === 0 && !onlineError && (
            <EmptyState
              icon={<Globe className="w-8 h-8" />}
              title="Search real recipes"
              description="Powered by TheMealDB — thousands of real recipes with photos. Or paste a URL below to import any recipe from any site."
            />
          )}

          {/* ── URL Import ──────────────────────────────────────────────────── */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-1">
                <Link2 size={15} aria-hidden="true" />
                Import from a URL
              </h3>
              <p className="text-xs text-gray-500">Paste a link to any recipe page and Gemini will extract the recipe for you.</p>
            </div>

            <form onSubmit={handleUrlImport} className="flex gap-3 max-w-2xl" noValidate>
              <input
                type="url"
                placeholder="https://www.allrecipes.com/recipe/..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                disabled={urlLoading}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
                aria-label="Recipe URL to import"
              />
              <button
                type="submit"
                disabled={urlLoading || !urlInput.trim()}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 flex items-center gap-2 shrink-0"
              >
                {urlLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                    Importing...
                  </>
                ) : (
                  'Import'
                )}
              </button>
            </form>

            {/* URL import error */}
            {urlError && (
              <p className="text-sm text-red-600">{urlError}</p>
            )}

            {/* URL import result */}
            {urlResult && !urlLoading && (
              <div className="max-w-xs">
                <RecipeCard
                  recipe={{ ...urlResult, id: 'url-import', createdAt: new Date(), source: 'internet' } as unknown as import('../lib/recipes').Recipe}
                  actionButton={
                    <div className="space-y-2">
                      {/* Link back to source */}
                      {urlResult.sourceUrl && (
                        <a
                          href={urlResult.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-primary hover:underline truncate"
                          title={urlResult.sourceUrl}
                        >
                          <ExternalLink size={11} aria-hidden="true" />
                          View original page
                        </a>
                      )}

                      {/* Manual photo URL — for sites that show a video instead of a photo */}
                      {!urlSaved && (
                        <div className="space-y-1 pt-1">
                          <input
                            type="url"
                            placeholder="Photo URL (optional)"
                            value={urlPhotoUrl}
                            onChange={(e) => setUrlPhotoUrl(e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                            aria-label="Optional photo URL"
                          />
                          <p className="text-[10px] text-gray-400 leading-tight">
                            No photo? On the recipe site, right-click the dish image → <strong>"Copy image address"</strong> and paste it above.
                          </p>
                        </div>
                      )}

                      {urlSaved ? (
                        <div className="w-full py-2 bg-green-50 text-green-700 font-medium rounded-lg text-sm text-center border border-green-200">
                          ✓ Saved to Library
                        </div>
                      ) : (
                        <button
                          onClick={handleSaveUrlResult}
                          disabled={urlSaving}
                          className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-colors border border-transparent hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                        >
                          {urlSaving ? 'Saving...' : 'Save to My Library'}
                        </button>
                      )}
                    </div>
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Recommended Tab ─────────────────────────────────────────────────── */}
      {activeTab === 'Recommended' && (
        <div className="space-y-6">

          {/* Header row with Refresh button */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                Gemini picks from your library based on your preferences.
              </p>
            </div>
            {recipes.length > 0 && (
              <button
                onClick={() => loadRecommendations()}
                disabled={recommendedLoading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <RefreshCw size={15} className={recommendedLoading ? 'animate-spin' : ''} aria-hidden="true" />
                Refresh
              </button>
            )}
          </div>

          {/* Empty library */}
          {recipes.length === 0 && !recommendedLoading && (
            <EmptyState
              icon={<Sparkles className="w-8 h-8" />}
              title="Add recipes to get recommendations"
              description="Once you have recipes in your library, Gemini will suggest the best ones based on your preferences."
              action={
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-primary/90 transition-colors"
                >
                  Add Your First Recipe
                </button>
              }
            />
          )}

          {/* Loading skeleton */}
          {recommendedLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm animate-pulse">
                  <div className="h-48 bg-gray-100" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error state */}
          {recommendedError && !recommendedLoading && (
            <div role="alert" className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
              {recommendedError}
            </div>
          )}

          {/* Small library nudge — shown when Gemini was skipped */}
          {!recommendedLoading && recommendedRecipes.length > 0 && recipes.length < 5 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
              You have {recipes.length} recipe{recipes.length === 1 ? '' : 's'} — add at least 5 for personalized AI recommendations.
            </div>
          )}

          {/* Results grid */}
          {!recommendedLoading && recommendedRecipes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {recommendedRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe as unknown as import('../lib/recipes').Recipe}
                  onView={() => setViewingRecipe(recipe)}
                  onRate={(rating) => handleRate(recipe.id, rating)}
                  actionButton={
                    <button
                      onClick={() => setAssigningRecipe(recipe)}
                      className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg text-sm transition-colors border border-transparent hover:border-primary/30 focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      + Add to Plan
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}

      {/* View Recipe Modal (library) */}
      <Modal
        isOpen={!!viewingRecipe}
        onClose={() => setViewingRecipe(null)}
        title={viewingRecipe?.title ?? ''}
        maxWidth="max-w-2xl"
      >
        {viewingRecipe && (
          <RecipeDetail
            recipe={viewingRecipe}
            onRate={(rating) => {
              // Optimistic local update so the emoji highlights immediately
              setViewingRecipe((prev) => prev ? { ...prev, rating } : prev);
              handleRate(viewingRecipe.id, rating);
            }}
          />
        )}
      </Modal>

      {/* Preview Online Result Modal */}
      <Modal
        isOpen={!!viewingOnlineResult}
        onClose={() => setViewingOnlineResult(null)}
        title={viewingOnlineResult?.title ?? ''}
        maxWidth="max-w-2xl"
      >
        {viewingOnlineResult && (
          <RecipeDetail
            recipe={{
              ...viewingOnlineResult,
              id: 'online-preview',
              createdAt: new Date(),
              source: 'internet',
            }}
          />
        )}
      </Modal>

      {/* Scan Recipe Modal */}
      <Modal
        isOpen={showPhotoUpload}
        onClose={() => setShowPhotoUpload(false)}
        title="Scan a Recipe"
        maxWidth="max-w-2xl"
      >
        <PhotoUpload
          onSave={async (data) => {
            setActionError(null);
            try {
              await addRecipe({ ...data, source: 'photo' });
              setShowPhotoUpload(false);
            } catch {
              setActionError('Failed to save recipe. Please try again.');
            }
          }}
          onCancel={() => setShowPhotoUpload(false)}
        />
      </Modal>

      {/* Add Recipe Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Add New Recipe"
        maxWidth="max-w-2xl"
      >
        <RecipeForm
          onSubmit={handleAdd}
          onCancel={() => setShowAddForm(false)}
          submitLabel="Add Recipe"
        />
      </Modal>

      {/* Edit Recipe Modal */}
      <Modal
        isOpen={!!editingRecipe}
        onClose={() => setEditingRecipe(null)}
        title="Edit Recipe"
        maxWidth="max-w-2xl"
      >
        {editingRecipe && (
          <RecipeForm
            initialValues={editingRecipe}
            onSubmit={handleEdit}
            onCancel={() => setEditingRecipe(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Recipe"
      >
        <div className="space-y-4">
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete{' '}
            <strong>{recipes.find((r) => r.id === deleteConfirmId)?.title}</strong>?
            This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>

      {/* Quick Assign Modal */}
      {assigningRecipe && (
        <QuickAssignModal
          recipe={recipeForModal}
          isOpen={!!assigningRecipe}
          onClose={() => setAssigningRecipe(null)}
        />
      )}
    </div>
  );
}
