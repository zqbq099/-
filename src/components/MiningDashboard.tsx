import React, { useEffect, useState } from 'react';
import { Hammer, Coins, Power, Clock, ShoppingBag, AlertCircle } from 'lucide-react';
import { auth } from '../firebase';
import { getMiningState, subscribeToMiningState, recordAction, setOverlayState, MiningState, harvest } from '../lib/mining';
import MiningBridge from '../lib/MiningBridge';
import { Capacitor } from '@capacitor/core';
import { useToast } from './layout/Toast';
import { DisclosureModal } from './modals/DisclosureModal';
import { ShopModal } from './modals/ShopModal';

export function MiningDashboard() {
  const { showToast } = useToast();
  const [state, setState] = useState<MiningState | null>(null);
  const [localData, setLocalData] = useState({ clicks: 0, timeMs: 0 });
  const [permissions, setPermissions] = useState({ overlay: false, accessibility: false });
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [isNative, setIsNative] = useState(Capacitor.isNativePlatform());

  useEffect(() => {
    if (isNative) {
      const interval = setInterval(async () => {
        try {
          const data = await MiningBridge.getAccumulatedData();
          setLocalData(data);
        } catch (e) {
          console.error("Failed to fetch native data", e);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isNative]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    getMiningState(user.uid).then(setState);

    const unsubscribe = subscribeToMiningState(user.uid, (newState) => {
      setState(newState);
      if (isNative && newState) {
        MiningBridge.updateMiningData({
          totalProduct: newState.totalProduct,
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

    if (isNative) {
      try {
        const data = await MiningBridge.getAccumulatedData({ reset: true });
        if (data.clicks > 0 || data.timeMs > 0) {
          await recordAction(user.uid, data.clicks, data.timeMs);
        }
      } catch (e) {
        console.error("Native sync failed", e);
      }
    }

    const currentState = await getMiningState(user.uid);

    if (currentState.totalProduct < currentState.threshold) {
      showToast(`تحتاج إلى ${currentState.threshold.toFixed(0)} من المحصول على الأقل للرفع.`, "error");
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

  const totalProductEstimate = state.totalProduct + (localData.clicks * 0.1) + (localData.timeMs / 1000 * 0.05);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-6 border border-gray-200 dark:border-gray-800" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600">
            <Hammer size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">نظام التعدين المطور</h2>
            <p className="text-sm text-gray-500">اربح من خلال التفاعل والوقت</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowShop(true)}
            className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 transition-colors"
            title="المتجر"
          >
            <ShoppingBag size={24} />
          </button>
          <button
            onClick={handleToggleOverlay}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
              state.isOverlayActive
              ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
            }`}
          >
            <Power size={18} />
            {state.isOverlayActive ? 'إيقاف' : 'تفعيل'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Hammer size={14} /> التفاعلات
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">{state.totalClicks + localData.clicks}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Clock size={14} /> وقت النشاط
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {((state.totalTimeMs + localData.timeMs) / 1000 / 60).toFixed(1)} <span className="text-xs font-normal">دقيقة</span>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <Coins size={14} /> المحصول
          </div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {totalProductEstimate.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-500">التقدم نحو الرفع (Harvest)</span>
          <span className="font-medium">{Math.min(100, (totalProductEstimate / state.threshold) * 100).toFixed(0)}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-500"
            style={{ width: `${Math.min(100, (totalProductEstimate / state.threshold) * 100)}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-gray-400">الحد الأدنى: {state.threshold.toFixed(0)} محصول</div>
      </div>

      {isNative && (!permissions.overlay || !permissions.accessibility) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl mb-6 flex gap-3">
          <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
          <div className="text-sm text-amber-800 dark:text-amber-300">
            يتطلب نظام التعدين أذونات إضافية ليعمل بشكل صحيح خارج التطبيق.
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
        disabled={totalProductEstimate < state.threshold}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
      >
        <Coins size={24} />
        رفع المحصول الآن
      </button>

      {showDisclosure && (
        <DisclosureModal
          onAccept={async () => {
            setShowDisclosure(false);
            await MiningBridge.requestPermissions();
          }}
          onClose={() => setShowDisclosure(false)}
        />
      )}

      {showShop && (
        <ShopModal
          onClose={() => setShowShop(false)}
          ownedIds={state.ownedEquipment}
          currentBalance={state.totalProduct}
        />
      )}
    </div>
  );
}
