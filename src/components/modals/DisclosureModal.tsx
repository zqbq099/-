import React from 'react';
import { ShieldCheck, AlertTriangle, X } from 'lucide-react';

interface DisclosureModalProps {
  onAccept: () => void;
  onClose: () => void;
}

export function DisclosureModal({ onAccept, onClose }: DisclosureModalProps) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
            <ShieldCheck size={48} />
          </div>

          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">إفصاح هام حول إمكانية الوصول</h2>

          <div className="space-y-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed text-right bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
            <p>
              يستخدم تطبيق <strong>Kon</strong> خدمة إمكانية الوصول (Accessibility Service) للأغراض التالية فقط:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>اكتشاف التفاعل مع الشاشة (النقر والتمرير) في تطبيقات أخرى لتشغيل نظام التعدين التفاعلي.</li>
              <li>تحديث "محصول التعدين" في الزر العائم بناءً على نشاطك.</li>
            </ul>
            <div className="flex gap-2 items-start text-amber-600 dark:text-amber-400 font-medium mt-4">
              <AlertTriangle size={20} className="flex-shrink-0" />
              <p>نحن لا نقوم بجمع أو تسجيل أي بيانات شخصية، كلمات مرور، أو معلومات مالية. يتم استخدام الخدمة حصراً لحساب عدد النقرات لأغراض التعدين فقط.</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex flex-col gap-3">
          <button
            onClick={onAccept}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold text-lg transition-all shadow-lg shadow-blue-500/20"
          >
            موافق، أرغب في منح الإذن
          </button>
          <button
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 py-2 text-sm font-medium"
          >
            ليس الآن
          </button>
        </div>
      </div>
    </div>
  );
}
