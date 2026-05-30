import React from 'react';
import { Terminal, X, Save } from 'lucide-react';

interface CommandPanelProps {
  instructions: string;
  tempInstructions: string;
  onTempInstructionsChange: (val: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function CommandPanel({
  instructions,
  tempInstructions,
  onTempInstructionsChange,
  onClose,
  onSave
}: CommandPanelProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Terminal size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">لوحة الأوامر (Command Panel)</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">تحكم بسلوك Kon دون قيد أو شرط</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              التعليمات المخصصة (Custom Instructions)
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              اكتب هنا أي أوامر أو قواعد تريد من Kon الالتزام بها دائماً. هذه الأوامر لها الأولوية القصوى وستغير طريقة تفكيره وتصرفاته.
            </p>
            <textarea
              value={tempInstructions}
              onChange={(e) => onTempInstructionsChange(e.target.value)}
              placeholder="مثال: لا تستخدم اللون الأحمر أبداً، اجعل كل التطبيقات بأسلوب سايبربانك، تحدث معي بلهجة عامية..."
              className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              dir="auto"
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
            className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md shadow-purple-500/20"
          >
            <Save size={16} />
            حفظ الأوامر
          </button>
        </div>
      </div>
    </div>
  );
}
