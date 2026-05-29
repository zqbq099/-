import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';

export interface MiningState {
  totalClicks: number;
  totalProduct: number;
  lastHarvest: number;
  isOverlayActive: boolean;
  threshold: number;
}

const DEFAULT_STATE: MiningState = {
  totalClicks: 0,
  totalProduct: 0,
  lastHarvest: Date.now(),
  isOverlayActive: false,
  threshold: 100, // Number of clicks/actions to reach a harvest
};

export async function getMiningState(userId: string): Promise<MiningState> {
  try {
    const docRef = doc(db, 'mining', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { ...DEFAULT_STATE, ...docSnap.data() } as MiningState;
    } else {
      await setDoc(docRef, DEFAULT_STATE);
      return DEFAULT_STATE;
    }
  } catch (error) {
    console.error("Error fetching mining state:", error);
    return DEFAULT_STATE;
  }
}

export function subscribeToMiningState(userId: string, callback: (state: MiningState) => void) {
  const docRef = doc(db, 'mining', userId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ ...DEFAULT_STATE, ...doc.data() } as MiningState);
    }
  });
}

export async function recordAction(userId: string, incrementValue: number = 1) {
  const docRef = doc(db, 'mining', userId);
  try {
    await updateDoc(docRef, {
      totalClicks: increment(incrementValue),
      totalProduct: increment(incrementValue * 0.1), // Example: 0.1 currency per click
    });
  } catch (error) {
    console.error("Error recording mining action:", error);
  }
}

export async function harvest(userId: string) {
  const docRef = doc(db, 'mining', userId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      // Reset product but keep total clicks for history
      await updateDoc(docRef, {
        totalProduct: 0,
        lastHarvest: Date.now()
      });
      return data.totalProduct;
    }
  } catch (error) {
    console.error("Error harvesting:", error);
  }
  return 0;
}

export async function setOverlayState(userId: string, isActive: boolean) {
  const docRef = doc(db, 'mining', userId);
  try {
    await updateDoc(docRef, { isOverlayActive: isActive });
  } catch (error) {
    console.error("Error setting overlay state:", error);
  }
}
