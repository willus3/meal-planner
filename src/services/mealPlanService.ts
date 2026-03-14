import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { MealPlan, WeeklySchedule, ShoppingItem } from '../types/mealplan';

/** Returns a Firestore collection reference for a user's meal plans. */
const plansRef = (uid: string) => collection(db, 'users', uid, 'mealPlans');

/** Returns the Monday of the week containing the given date. */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns the Sunday of the week containing the given week start date. */
function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export const EMPTY_SCHEDULE: WeeklySchedule = {
  Monday: null,
  Tuesday: null,
  Wednesday: null,
  Thursday: null,
  Friday: null,
  Saturday: null,
  Sunday: null,
};

/**
 * Returns the user's currently active meal plan, or null if none exists.
 * The active plan is the one currently being planned / in progress.
 */
export async function getCurrentPlan(uid: string): Promise<MealPlan | null> {
  const q = query(plansRef(uid), where('isActive', '==', true));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  return {
    ...data,
    id: docSnap.id,
    createdAt: (data.createdAt as Timestamp).toDate(),
  } as MealPlan;
}

/**
 * Subscribes to real-time updates on the user's active meal plan.
 * Fires immediately with the current plan, then again whenever any device
 * saves a change — enabling cross-device sync without a page refresh.
 *
 * @returns An unsubscribe function — call it to stop listening (important for cleanup).
 */
export function subscribeToActivePlan(
  uid: string,
  onData: (plan: MealPlan | null) => void,
  onError: (message: string) => void
): () => void {
  const q = query(plansRef(uid), where('isActive', '==', true));

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        onData(null);
        return;
      }
      const docSnap = snapshot.docs[0];
      const data = docSnap.data();
      onData({
        ...data,
        id: docSnap.id,
        createdAt: (data.createdAt as Timestamp).toDate(),
      } as MealPlan);
    },
    () => {
      onError('Failed to load your meal plan. Please refresh.');
    }
  );
}

/**
 * Saves the weekly schedule to Firestore.
 * - If existingPlanId is provided: updates that document's schedule field.
 * - Otherwise: creates a new active plan document for the current week.
 *
 * Returns the plan ID (new or existing) so the caller can track it.
 */
export async function saveWeeklyPlan(
  uid: string,
  schedule: WeeklySchedule,
  existingPlanId?: string
): Promise<string> {
  if (existingPlanId) {
    const planDoc = doc(db, 'users', uid, 'mealPlans', existingPlanId);
    await updateDoc(planDoc, { schedule });
    return existingPlanId;
  }

  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(weekStart);

  const ref = await addDoc(plansRef(uid), {
    weekStartDate: weekStart.toISOString(),
    weekEndDate: weekEnd.toISOString(),
    schedule,
    generatedItems: [],
    manualItems: [],
    createdAt: Timestamp.now(),
    isActive: true,
  });

  return ref.id;
}

/**
 * Clears all meals from the plan by resetting the schedule to all-null.
 * The document is kept — we never delete a plan, only clear it.
 */
export async function clearPlan(uid: string, planId: string): Promise<void> {
  const planDoc = doc(db, 'users', uid, 'mealPlans', planId);
  await updateDoc(planDoc, { schedule: EMPTY_SCHEDULE });
}

/**
 * Returns up to HISTORY_LIMIT past meal plans sorted by week start date descending.
 * Includes the current active plan so the user can see the full timeline.
 */
export async function getAllPlans(uid: string, historyLimit: number): Promise<MealPlan[]> {
  const q = query(
    plansRef(uid),
    orderBy('weekStartDate', 'desc'),
    limit(historyLimit)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      ...data,
      id: docSnap.id,
      createdAt: (data.createdAt as Timestamp).toDate(),
    } as MealPlan;
  });
}

/**
 * Creates a new active plan by copying the schedule from a historical plan.
 * Deactivates the current active plan (if any) before creating the new one.
 */
export async function repeatPlan(
  uid: string,
  historicalSchedule: WeeklySchedule,
  currentPlanId?: string
): Promise<string> {
  // Deactivate the current plan so only one plan is active at a time
  if (currentPlanId) {
    const currentDoc = doc(db, 'users', uid, 'mealPlans', currentPlanId);
    await updateDoc(currentDoc, { isActive: false });
  }

  const now = new Date();
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(weekStart);

  const ref = await addDoc(plansRef(uid), {
    weekStartDate: weekStart.toISOString(),
    weekEndDate: weekEnd.toISOString(),
    schedule: historicalSchedule,
    generatedItems: [],
    manualItems: [],
    createdAt: Timestamp.now(),
    isActive: true,
  });

  return ref.id;
}

/**
 * Saves the user's manually-added shopping list items to the active plan document.
 * Called whenever the user adds or removes a manual item.
 */
export async function saveManualItems(
  uid: string,
  planId: string,
  items: ShoppingItem[]
): Promise<void> {
  const planDoc = doc(db, 'users', uid, 'mealPlans', planId);
  await updateDoc(planDoc, { manualItems: items });
}
