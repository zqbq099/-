import React from 'react';
import { History, Trash2 } from 'lucide-react';
import { SavedApp } from '../../lib/history';

interface HistorySidebarProps {
  history: SavedApp[];
  isPremium: boolean;
  onAppSelect: (app: any) => void;
  onDelete: (id: string) => void;
}

export function HistorySidebar({ history, isPremium, onAppSelect, onDelete }: HistorySidebarProps) {
  return (
    <div className="w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-[calc(100vh-120px)] sticky top-24 overflow-hidden" dir="rtl">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-bold flex items-center gap-2">
          <History size={18} className="text-blue-600 dark:text-blue-400" />
          سجل التحولات
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          {isPremium ? 'يتم الحفظ في السحابة (Firebase)' : 'يتم الحفظ في جهازك (مؤقت)'}
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {history.length === 0 ? (
          <div className="text-center p-6 text-gray-500 text-sm">
            لا يوجد تطبيقات محفوظة بعد. اطلب من Kon إنشاء تطبيق!
          </div>
        ) : (
          <div className="space-y-2">
            {history.map((app) => (
              <div
                key={app.id}
                className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-pointer"
                onClick={() => onAppSelect(app)}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{app.appName}</h4>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {new Date(app.createdAt).toLocaleDateString('ar-SA')} {new Date(app.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(app.id); }}
                  className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="حذف"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
