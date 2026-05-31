import { registerPlugin } from '@capacitor/core';

export interface MiningBridgePlugin {
  startOverlay(): Promise<void>;
  stopOverlay(): Promise<void>;
  checkPermissions(): Promise<{ overlay: boolean, accessibility: boolean }>;
  requestPermissions(): Promise<void>;
  updateMiningData(data: { totalProduct: number, threshold: number }): Promise<void>;
  getAccumulatedData(options?: { reset: boolean }): Promise<{ clicks: number, timeMs: number }>;
  addListener(eventName: 'actionDetected', listenerFunc: () => void): Promise<any>;
}

const MiningBridge = registerPlugin<MiningBridgePlugin>('MiningBridge');

export default MiningBridge;
