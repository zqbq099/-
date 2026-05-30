import React from 'react';
import { Settings, X, Save } from 'lucide-react';

interface SettingsModalProps {
  tempGeminiKey: string;
  tempFirebaseConfig: string;
  onGeminiKeyChange: (val: string) => void;
  onFirebaseConfigChange: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function SettingsModal({
  tempGeminiKey,
  tempFirebaseConfig,
  onGeminiKeyChange,
  onFirebaseConfigChange,
  onClose,
  onSave
}: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400">
              <Settings size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">إعدادات النظام والبيئة</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">إدارة مفاتيح API وبيانات الاستضافة اللامركزية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 p-4 rounded-xl text-sm leading-relaxed">
            <p className="font-bold mb-1">Kon المستقل - Offline PWA 🚀</p>
            <p>يمكنك استضافة Kon بنفسك وتشغيله كـ تطبيق متكامل. لحماية بياناتك، أدخل مفاتيحك الخاصة لتظل مخزنة محلياً في جهازك ولن تشارك مع أي خادم آخر.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              مفتاح Gemini API (مطلوب)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              احصل عليه مجاناً من <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-500 underline">Google AI Studio</a>
            </p>
            <input
              type="password"
              value={tempGeminiKey}
              onChange={(e) => onGeminiKeyChange(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              إعدادات Firebase (اختياري لتخزين البيانات)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              قم بإنشاء مشروع في <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-500 underline">Firebase</a>، انسخ الـ config (بصيغة JSON) والصقه هنا لتخزين سجلاتك وتطبيقاتك في قاعدة بياناتك الخاصة.
            </p>
            <textarea
              value={tempFirebaseConfig}
              onChange={(e) => onFirebaseConfigChange(e.target.value)}
              placeholder='{
  "apiKey": "...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}'
              className="w-full h-48 p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              dir="ltr"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md shadow-blue-500/20"
          >
            <Save size={16} />
            حفظ وإعادة تشغيل
          </button>
        </div>
      </div>
    </div>
  );
}
