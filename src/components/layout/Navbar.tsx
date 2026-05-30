import React from 'react';
import { Settings, Terminal, History, Crown, UserCircle, LogOut, Hammer } from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  user: User;
  isPremium: boolean;
  isHistoryOpen: boolean;
  isMiningOpen: boolean;
  onToggleSettings: () => void;
  onToggleCommandPanel: () => void;
  onToggleHistory: () => void;
  onToggleMining: () => void;
  onTogglePremium: () => void;
  onLogout: () => void;
}

export function Navbar({
  user,
  isPremium,
  isHistoryOpen,
  isMiningOpen,
  onToggleSettings,
  onToggleCommandPanel,
  onToggleHistory,
  onToggleMining,
  onTogglePremium,
  onLogout
}: NavbarProps) {
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm" dir="rtl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl">
          🤖
        </div>
        <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">Kon</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSettings}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          title="الإعدادات المتقدمة"
        >
          <Settings size={18} className="text-gray-600 dark:text-gray-400" />
          <span className="hidden sm:inline text-sm font-medium">الإعدادات</span>
        </button>

        <button
          onClick={onToggleMining}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isMiningOpen ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
          title="نظام التعدين"
        >
          <Hammer size={18} className="text-amber-600 dark:text-amber-400" />
          <span className="hidden sm:inline text-sm font-medium">التعدين</span>
        </button>

        <button
          onClick={onToggleCommandPanel}
          className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          title="لوحة الأوامر (التحكم بـ Kon)"
        >
          <Terminal size={18} className="text-purple-600 dark:text-purple-400" />
          <span className="hidden sm:inline text-sm font-medium">لوحة الأوامر</span>
        </button>

        <button
          onClick={onToggleHistory}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isHistoryOpen ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
        >
          <History size={18} />
          <span className="hidden sm:inline text-sm font-medium">سجل التحولات</span>
        </button>

        {!user.isAnonymous && (
          <button
            onClick={onTogglePremium}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium border ${isPremium ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'}`}
            title="حالة الاشتراك"
          >
            <Crown size={16} className={isPremium ? 'text-amber-500' : 'text-gray-400'} />
            <span className="hidden sm:inline">{isPremium ? 'حساب مدفوع' : 'ترقية'}</span>
          </button>
        )}

        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex items-center justify-center">
            {user.photoURL ? (
              <img src={user.photoURL} alt="User" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserCircle className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <span className="hidden sm:inline">{user.isAnonymous ? 'زائر' : user.displayName || 'مستخدم'}</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">تسجيل الخروج</span>
        </button>
      </div>
    </nav>
  );
}
