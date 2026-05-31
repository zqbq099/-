import React from 'react';
import { X, ShoppingBag, CheckCircle2, Coins } from 'lucide-react';
import { EQUIPMENTS, MiningEquipment, purchaseEquipment } from '../../lib/mining';
import { useToast } from '../layout/Toast';
import { auth } from '../../firebase';

interface ShopModalProps {
  onClose: () => void;
  ownedIds: string[];
  currentBalance: number;
}

export function ShopModal({ onClose, ownedIds, currentBalance }: ShopModalProps) {
  const { showToast } = useToast();

  const handlePurchase = async (eq: MiningEquipment) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await purchaseEquipment(user.uid, eq.id);
      showToast(`تم شراء ${eq.name} بنجاح!`, "success");
    } catch (e: any) {
      showToast(e.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" dir="rtl">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingBag size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">متجر المعدات</h2>
              <p className="text-xs text-gray-500">قم بترقية قدراتك في التعدين</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">رصيدك الحالي</span>
            <div className="flex items-center gap-1 text-xl font-bold text-blue-600 dark:text-blue-400">
              <Coins size={20} />
              {currentBalance.toFixed(2)}
            </div>
          </div>

          {EQUIPMENTS.map((eq) => {
            const isOwned = ownedIds.includes(eq.id);
            return (
              <div key={eq.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{eq.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{eq.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {isOwned ? (
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <CheckCircle2 size={18} />
                      تم الشراء
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePurchase(eq)}
                      disabled={currentBalance < eq.price}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-800 text-white rounded-xl text-sm font-bold transition-colors"
                    >
                      {eq.price} محصول
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
