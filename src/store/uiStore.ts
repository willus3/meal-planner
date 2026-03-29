import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI-only transient state — things that should survive page navigation
 * but don't need to be stored in Firestore.
 *
 * Why Zustand instead of Firestore?
 * Checking off items is a fast, per-session action. Saving every checkbox
 * tap to the database would be slow and wasteful. The list *contents* live
 * in Firestore; the check state lives here.
 */
interface UiStore {
  /** The plan ID that checkedItemIds / hiddenItemIds belong to. */
  activePlanId: string | null;
  /** IDs of shopping list items the user has checked off. */
  checkedItemIds: string[];
  /**
   * IDs of generated shopping list items the user has deleted from view.
   * Stored locally so they don't reappear on refresh without a plan change.
   */
  hiddenItemIds: string[];

  /**
   * Call before reading checked/hidden state. If the plan ID changed since
   * the last session, stale state is cleared automatically.
   */
  syncPlanId: (planId: string) => void;
  toggleItem: (id: string) => void;
  hideItem: (id: string) => void;
  clearChecked: () => void;
  /** Clears all checked and hidden state — used when a new plan is started. */
  resetShoppingUi: () => void;
}

export const useUiStore = create<UiStore>()(
  persist(
    (set, get) => ({
      activePlanId: null,
      checkedItemIds: [],
      hiddenItemIds: [],

      syncPlanId: (planId) => {
        if (get().activePlanId !== planId) {
          set({ activePlanId: planId, checkedItemIds: [], hiddenItemIds: [] });
        }
      },

      toggleItem: (id) =>
        set((state) => ({
          checkedItemIds: state.checkedItemIds.includes(id)
            ? state.checkedItemIds.filter((i) => i !== id)
            : [...state.checkedItemIds, id],
        })),

      hideItem: (id) =>
        set((state) => ({
          hiddenItemIds: [...state.hiddenItemIds, id],
          // Also uncheck it if it was checked
          checkedItemIds: state.checkedItemIds.filter((i) => i !== id),
        })),

      clearChecked: () => set({ checkedItemIds: [] }),

      resetShoppingUi: () => set({ checkedItemIds: [], hiddenItemIds: [] }),
    }),
    { name: 'meal-planner-ui' }
  )
);
