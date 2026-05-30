import React, { useEffect, useState } from 'react';
import { Hammer, Coins, Power, Settings as SettingsIcon, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { getMiningState, subscribeToMiningState, recordAction, setOverlayState, MiningState, harvest } from '../lib/mining';
import MiningBridge from '../lib/MiningBridge';
import { Capacitor } from '@capacitor/core';
import { useToast } from './layout/Toast';
import { DisclosureModal } from './modals/DisclosureModal';

export function MiningDashboard() {
  const { showToast } = useToast();
  const [state, setState] = useState<MiningState | null>(null);
  const [localClicks, setLocalClicks] = useState(0);
  const [permissions, setPermissions] = useState({ overlay: false, accessibility: false });
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [isNative, setIsNative] = useState(Capacitor.isNativePlatform());

  useEffect(() => {
    if (isNative) {
      const interval = setInterval(async () => {
        const { clicks } = await MiningBridge.getAccumulatedClicks();
        if (clicks > localClicks) {
          // Trigger a small visual effect here if needed
        }
        setLocalClicks(clicks);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isNative, localClicks]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Initial load
    getMiningState(user.uid).then(setState);

    // Subscribe to changes
    const unsubscribe = subscribeToMiningState(user.uid, (newState) => {
      setState(newState);
      if (isNative && newState) {
        // Here we combine firestore data with local clicks for display
        MiningBridge.updateMiningData({
          totalProduct: newState.totalProduct + (localClicks * 0.1),
          threshold: newState.threshold
        });
      }
    });

    if (isNative) {
      MiningBridge.checkPermissions().then(setPermissions);
    }

    return () => unsubscribe();
  }, [isNative]);

  const handleToggleOverlay = async () => {
    const user = auth.currentUser;
    if (!user || !state) return;

    if (isNative) {
      const perms = await MiningBridge.checkPermissions();
      if (!perms.overlay || !perms.accessibility) {
        setShowDisclosure(true);
        return;
      }

      if (state.isOverlayActive) {
        await MiningBridge.stopOverlay();
      } else {
        await MiningBridge.startOverlay();
      }
    }

    await setOverlayState(user.uid, !state.isOverlayActive);
  };

  const handleHarvest = async () => {
    const user = auth.currentUser;
    if (!user || !state) return;

    showToast("جاري مزامنة البيانات السحابية...", "loading");

    // Before harvesting, sync all local clicks to Firebase
    let finalClicks = localClicks;
    if (isNative) {
      try {
        const { clicks } = await MiningBridge.getAccumulatedClicks({ reset: true });
        finalClicks = clicks;
        if (finalClicks > 0) {
          await recordAction(user.uid, finalClicks);
        }
      } catch (e) {
        console.error("Native sync failed", e);
      }
    }

    // Refresh state after sync
    const currentState = await getMiningState(user.uid);

    if (currentState.totalProduct < currentState.threshold) {
      showToast(`تحتاج إلى ${currentState.threshold} من المحصول على الأقل للرفع.`, "error");
      return;
    }

    try {
      const amount = await harvest(user.uid);
      showToast(`تم رفع ${amount.toFixed(2)} من محصول التعدين بنجاح!`, "success");
    } catch (e) {
      showToast("فشل عملية الرفع. يرجى المحاولة لاحقاً.", "error");
    }
  };

  if (!state) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-gray-800" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
            <Hammer size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">نظام التعدين التفاعلي</h2>
            <p className="text-sm text-gray-500">قم بتجميع المحصول من خلال التفاعل</p>
          </div>
        </div>
        <button
          onClick={handleToggleOverlay}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
            state.isOverlayActive
            ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
          }`}
        >
          <Power size={18} />
          {state.isOverlayActive ? 'إيقاف الزر العائم' : 'تفعيل الزر العائم'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-500 mb-1">إجمالي النقرات (سحابي + محلي)</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{state.totalClicks + localClicks}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="text-sm text-gray-500 mb-1">المحصول الحالي</div>
          <div className="flex items-center gap-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
            <Coins size={24} />
            {(state.totalProduct + (localClicks * 0.1)).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">التقدم نحو الرفع (Harvest)</span>
          <span className="font-medium">{Math.min(100, ((state.totalProduct + (localClicks * 0.1)) / state.threshold) * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(100, ((state.totalProduct + (localClicks * 0.1)) / state.threshold) * 100)}%` }}
          />
        </div>
      </div>

      {isNative && (!permissions.overlay || !permissions.accessibility) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl mb-6 flex gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            يتطلب نظام التعدين أذونات إضافية (الظهور فوق التطبيقات وإمكانية الوصول) ليعمل بشكل صحيح خارج التطبيق.
            <button
              onClick={() => MiningBridge.requestPermissions()}
              className="block mt-2 font-bold underline"
            >
              منح الأذونات الآن
            </button>
          </div>
        </div>
      )}

      <button
        onClick={handleHarvest}
        disabled={state.totalProduct < state.threshold}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
      >
        <Coins size={24} />
        رفع المحصول الآن
      </button>

      <div className="mt-4 text-center text-xs text-gray-400">
        سيتم توجيه المحصول المرفوع لدعم المؤسسات الخيرية والرعاية الصحية مستقبلاً.
      </div>

      {showDisclosure && (
        <DisclosureModal
          onAccept={async () => {
            setShowDisclosure(false);
            await MiningBridge.requestPermissions();
          }}
          onClose={() => setShowDisclosure(false)}
        />
      )}
    </div>
  );
}
