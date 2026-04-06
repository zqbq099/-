import { db } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { AppTransformData } from './gemini';

export interface SavedApp extends AppTransformData {
  id: string;
  createdAt: number;
}

export const saveToHistory = async (userId: string, isPremium: boolean, appData: AppTransformData) => {
  const savedApp = { 
    appName: appData.appName,
    htmlCode: appData.htmlCode,
    isSimulation: appData.isSimulation,
    messageToUser: appData.messageToUser || "",
    createdAt: Date.now() 
  };

  if (isPremium && userId) {
    // Save to Firestore
    try {
      await addDoc(collection(db, `users/${userId}/transformations`), savedApp);
    } catch (error) {
      console.error("Error saving to Firestore", error);
      // Fallback to local storage if firestore fails
      saveToLocalStorage(userId, savedApp);
    }
  } else {
    // Save to LocalStorage
    saveToLocalStorage(userId, savedApp);
  }
};

const saveToLocalStorage = (userId: string, savedApp: any) => {
  const key = `history_${userId || 'guest'}`;
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  history.push({ ...savedApp, id: Date.now().toString() });
  localStorage.setItem(key, JSON.stringify(history));
};

export const getHistory = async (userId: string, isPremium: boolean): Promise<SavedApp[]> => {
  if (isPremium && userId) {
    try {
      const q = query(collection(db, `users/${userId}/transformations`), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedApp));
    } catch (error) {
      console.error("Error fetching from Firestore", error);
      return getFromLocalStorage(userId);
    }
  } else {
    return getFromLocalStorage(userId);
  }
};

const getFromLocalStorage = (userId: string): SavedApp[] => {
  const key = `history_${userId || 'guest'}`;
  const history = JSON.parse(localStorage.getItem(key) || '[]');
  return history.sort((a: SavedApp, b: SavedApp) => b.createdAt - a.createdAt);
};

export const deleteFromHistory = async (userId: string, isPremium: boolean, appId: string) => {
  if (isPremium && userId) {
    try {
      await deleteDoc(doc(db, `users/${userId}/transformations`, appId));
    } catch (error) {
      console.error("Error deleting from Firestore", error);
      deleteFromLocalStorage(userId, appId);
    }
  } else {
    deleteFromLocalStorage(userId, appId);
  }
}

const deleteFromLocalStorage = (userId: string, appId: string) => {
  const key = `history_${userId || 'guest'}`;
  let history = JSON.parse(localStorage.getItem(key) || '[]');
  history = history.filter((app: SavedApp) => app.id !== appId);
  localStorage.setItem(key, JSON.stringify(history));
}
