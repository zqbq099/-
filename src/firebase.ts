import { initializeApp, getApps, FirebaseOptions } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, signOut } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';

// Disable noisy firestore connection warnings when working locally or if database is unprovisioned
setLogLevel('error');

const getFirebaseConfig = (): FirebaseOptions & { firestoreDatabaseId?: string } => {
  try {
    const customConfig = localStorage.getItem('mystique_firebase_config');
    if (customConfig) {
      return JSON.parse(customConfig);
    }
  } catch (e) {
    console.error("Error parsing custom firebase config", e);
  }
  return defaultFirebaseConfig;
};

const config = getFirebaseConfig();
const app = getApps().length === 0 ? initializeApp(config) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId || undefined);

export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const loginAsGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error("Error signing in anonymously", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
