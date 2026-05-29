import { recordAction } from './mining';
import MiningBridge from './MiningBridge';
import { Capacitor } from '@capacitor/core';

export function setupMiningListeners(userId: string) {
  if (Capacitor.isNativePlatform()) {
    // Local data is kept in the Android Native layer (SharedPreferences)
    // We only sync with Firestore when the user decides to "Harvest" (رفع المحصول)
  }

  // Fallback/Web internal listener
  window.addEventListener('click', () => {
    recordAction(userId, 1);
  });
}
