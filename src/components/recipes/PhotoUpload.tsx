import { useRef, useState } from 'react';
import { Camera, Upload, AlertCircle, RotateCcw, ClipboardPaste } from 'lucide-react';
import { extractRecipeFromPhoto, extractRecipeFromText } from '../../services/geminiService';
import RecipeForm from './RecipeForm';
import { MAX_PHOTO_SIZE_BYTES } from '../../lib/constants';
import type { Recipe } from '../../types/recipe';

type Step = 'idle' | 'loading' | 'preview' | 'error';
type InputMode = 'photo' | 'text';
type FormData = Omit<Recipe, 'id' | 'createdAt' | 'source'>;

interface PhotoUploadProps {
  onSave: (data: FormData) => Promise<void>;
  onCancel: () => void;
}

/**
 * Multi-step component for scanning a recipe from a photo or pasted text.
 *
 * Modes:
 *  📷 Photo — photograph a recipe from a book or magazine
 *  📋 Paste Text — copy all text from a recipe website and paste it here
 *
 * Steps (both modes):
 *  idle → loading → preview → (save) or error → retry
 */
export default function PhotoUpload({ onSave, onCancel }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>('idle');
  const [inputMode, setInputMode] = useState<InputMode>('photo');
  const [pastedText, setPastedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [extractedData, setExtractedData] = useState<FormData | null>(null);

  // ── Photo handling ────────────────────────────────────────────────────────

  const handleFileSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select an image file (JPG, PNG, HEIC, etc.).');
      setStep('error');
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setErrorMessage('That image is too large. Please use a photo under 10 MB.');
      setStep('error');
      return;
    }

    setStep('loading');
    try {
      const data = await extractRecipeFromPhoto(file);
      setExtractedData(data);
      setStep('preview');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Couldn't read that photo. Try entering the recipe manually."
      );
      setStep('error');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    e.target.value = '';
  };

  // ── Text handling ─────────────────────────────────────────────────────────

  const handleTextSubmit = async () => {
    if (!pastedText.trim()) return;

    setStep('loading');
    try {
      const data = await extractRecipeFromText(pastedText);
      setExtractedData(data);
      setStep('preview');
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Couldn't extract a recipe from that text. Try selecting more of the page."
      );
      setStep('error');
    }
  };

  // ── Shared ────────────────────────────────────────────────────────────────

  const handleSave = async (data: FormData) => {
    await onSave(data);
  };

  const reset = () => {
    setStep('idle');
    setExtractedData(null);
    setErrorMessage('');
    setPastedText('');
  };

  // ── Step 2: Loading ───────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-5">
        <div
          className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"
          role="status"
          aria-label="Analyzing recipe"
        />
        <div className="text-center">
          <p className="font-semibold text-gray-900">Analyzing your recipe...</p>
          <p className="text-sm text-gray-500 mt-1">Gemini is reading it. This takes a few seconds.</p>
        </div>
      </div>
    );
  }

  // ── Step 3: Preview ───────────────────────────────────────────────────────
  if (step === 'preview' && extractedData) {
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <span className="text-green-600 text-lg" aria-hidden="true">✓</span>
          <p className="text-sm text-green-800">
            Recipe extracted! Review the details below and make any corrections before saving.
          </p>
        </div>
        <RecipeForm
          initialValues={extractedData}
          onSubmit={handleSave}
          onCancel={reset}
          submitLabel="Save to My Library"
        />
      </div>
    );
  }

  // ── Step 4: Error ─────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-red-800">Something went wrong</p>
            <p className="text-sm text-red-700 mt-0.5">{errorMessage}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-2 flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Try Again
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Enter Manually
          </button>
        </div>
      </div>
    );
  }

  // ── Step 1: Idle ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Mode switcher */}
      <div className="flex bg-gray-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => setInputMode('photo')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'photo' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Camera size={15} aria-hidden="true" />
          Photo
        </button>
        <button
          type="button"
          onClick={() => setInputMode('text')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors ${
            inputMode === 'text' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardPaste size={15} aria-hidden="true" />
          Paste from Website
        </button>
      </div>

      {/* ── Photo mode ── */}
      {inputMode === 'photo' && (
        <>
          <p className="text-sm text-gray-500">
            Photograph a recipe from a cookbook, magazine, or printed card. Gemini will extract the details automatically.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="sr-only"
            aria-label="Upload recipe photo"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileInputChange}
              className="sr-only"
              id="camera-input"
              aria-label="Take photo with camera"
            />
            <label
              htmlFor="camera-input"
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer focus-within:ring-2 focus-within:ring-primary"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Camera className="text-primary w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-gray-700">Take a Photo</span>
              <span className="text-xs text-gray-400 text-center">Open camera to photograph a recipe</span>
            </label>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                <Upload className="text-gray-500 w-6 h-6" aria-hidden="true" />
              </div>
              <span className="text-sm font-medium text-gray-700">Upload Photo</span>
              <span className="text-xs text-gray-400 text-center">Choose from your camera roll or files</span>
            </button>
          </div>
        </>
      )}

      {/* ── Paste text mode ── */}
      {inputMode === 'text' && (
        <>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800 space-y-1">
            <p className="font-semibold">How to copy a recipe from any website:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-700">
              <li>Open the recipe page in your browser</li>
              <li>Select all text on the page (Ctrl+A on desktop, or tap-hold → Select All on mobile)</li>
              <li>Copy it (Ctrl+C) and paste it below</li>
            </ol>
            <p className="text-blue-600 text-xs pt-1">Gemini will ignore ads and filler text and extract just the recipe.</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="recipe-text" className="block text-sm font-semibold text-gray-700">
              Paste recipe text here
            </label>
            <textarea
              id="recipe-text"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste the full page text here..."
              rows={8}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <button
            type="button"
            onClick={handleTextSubmit}
            disabled={!pastedText.trim()}
            className="w-full py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Extract Recipe
          </button>
        </>
      )}

      <div className="pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="w-full px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
