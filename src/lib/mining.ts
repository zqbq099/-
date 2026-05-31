import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, increment, onSnapshot } from 'firebase/firestore';

export interface MiningEquipment {
  id: string;
  name: string;
  description: string;
  price: number;
  multiplier: number;
  type: 'click' | 'time' | 'energy';
}

export const EQUIPMENTS: MiningEquipment[] = [
  {
    id: 'basic_clicker',
    name: 'الناقر الأساسي',
    description: 'يزيد من إنتاجية النقرات بنسبة 20%',
    price: 50,
    multiplier: 1.2,
    type: 'click'
  },
  {
    id: 'time_accelerator',
    name: 'مسرع الوقت',
    description: 'يزيد من إنتاجية الوقت بنسبة 50%',
    price: 150,
    multiplier: 1.5,
    type: 'time'
  },
  {
    id: 'energy_battery',
    name: 'بطارية الطاقة',
    description: 'يقلل الحد الأدنى للرفع بنسبة 10%',
    price: 100,
    multiplier: 0.9,
    type: 'energy'
  }
];

export interface MiningState {
  totalClicks: number;
  totalTimeMs: number;
  totalProduct: number;
  lastHarvest: number;
  isOverlayActive: boolean;
  threshold: number;
  ownedEquipment: string[];
}

const DEFAULT_STATE: MiningState = {
  totalClicks: 0,
  totalTimeMs: 0,
  totalProduct: 0,
  lastHarvest: Date.now(),
  isOverlayActive: false,
  threshold: 100,
  ownedEquipment: [],
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

export async function recordAction(userId: string, clicks: number = 0, timeMs: number = 0) {
  const docRef = doc(db, 'mining', userId);
  const state = await getMiningState(userId);

  let clickMultiplier = 1;
  let timeMultiplier = 1;

  state.ownedEquipment.forEach(eqId => {
    const eq = EQUIPMENTS.find(e => e.id === eqId);
    if (eq?.type === 'click') clickMultiplier *= eq.multiplier;
    if (eq?.type === 'time') timeMultiplier *= eq.multiplier;
  });

  const productFromClicks = clicks * 0.1 * clickMultiplier;
  const productFromTime = (timeMs / 1000) * 0.05 * timeMultiplier; // 0.05 per second

  try {
    await updateDoc(docRef, {
      totalClicks: increment(clicks),
      totalTimeMs: increment(timeMs),
      totalProduct: increment(productFromClicks + productFromTime),
    });
  } catch (error) {
    console.error("Error recording mining action:", error);
  }
}

export async function purchaseEquipment(userId: string, equipmentId: string) {
  const equipment = EQUIPMENTS.find(e => e.id === equipmentId);
  if (!equipment) return;

  const docRef = doc(db, 'mining', userId);
  const state = await getMiningState(userId);

  if (state.totalProduct < equipment.price) {
    throw new Error("رصيد غير كافٍ");
  }

  if (state.ownedEquipment.includes(equipmentId)) {
    throw new Error("تمتلك هذا الجهاز بالفعل");
  }

  let updates: any = {
    totalProduct: increment(-equipment.price),
    ownedEquipment: [...state.ownedEquipment, equipmentId]
  };

  if (equipment.type === 'energy') {
    updates.threshold = state.threshold * equipment.multiplier;
  }

  await updateDoc(docRef, updates);
}

export async function harvest(userId: string) {
  const docRef = doc(db, 'mining', userId);
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
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
