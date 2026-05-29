import { recordAction } from './mining';
import MiningBridge from './MiningBridge';
import { Capacitor } from '@capacitor/core';

export function setupMiningListeners(userId: string) {
  if (Capacitor.isNativePlatform()) {
    // We don't record to DB on every action to save resources.
    // The native side handles the immediate UI update in the overlay.
    // We will pull and sync periodically or on app resume.

    setInterval(async () => {
      const { clicks } = await MiningBridge.getAccumulatedClicks();
      if (clicks > 0) {
        await recordAction(userId, clicks);
      }
    }, 30000); // Sync every 30 seconds
  }

  // Fallback/Web internal listener
  window.addEventListener('click', () => {
    recordAction(userId, 1);
  });
}
