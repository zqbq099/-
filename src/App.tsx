import React, { useEffect, useState } from 'react';
import { FloatingChat } from './components/FloatingChat';
import { Navbar } from './components/layout/Navbar';
import { HistorySidebar } from './components/layout/HistorySidebar';
import { SettingsModal } from './components/modals/SettingsModal';
import { CommandPanel } from './components/modals/CommandPanel';
import { MiningDashboard } from './components/MiningDashboard';
import { auth, loginWithGoogle, loginAsGuest, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, LogIn, UserCircle, LogOut, History, Trash2, Crown, Terminal, X, Save, Settings, Hammer } from 'lucide-react';
import { getHistory, SavedApp, deleteFromHistory } from './lib/history';
import { AppTransformData } from './lib/gemini';
import { setupMiningListeners } from './lib/miningListeners';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<React.ReactNode | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SavedApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppTransformData | null>(null);
  const [showMining, setShowMining] = useState(false);
  
  // Modal States
  const [showCommandPanel, setShowCommandPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Form States
  const [customInstructions, setCustomInstructions] = useState(localStorage.getItem('mystique_custom_instructions') || '');
  const [tempInstructions, setTempInstructions] = useState(customInstructions);
  const [tempGeminiKey, setTempGeminiKey] = useState(localStorage.getItem('mystique_gemini_key') || '');
  const [tempFirebaseConfig, setTempFirebaseConfig] = useState(localStorage.getItem('mystique_firebase_config') || '');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setupMiningListeners(currentUser.uid);
      }
      if (currentUser && !currentUser.isAnonymous) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setIsPremium(userDoc.data().plan === 'premium');
          } else {
            await setDoc(doc(db, 'users', currentUser.uid), {
              uid: currentUser.uid,
              role: 'user',
              plan: 'free',
              createdAt: new Date()
            });
            setIsPremium(false);
          }
        } catch (error: any) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setIsPremium(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loadHistory = async () => {
    if (user) {
      const apps = await getHistory(user.uid, isPremium);
      setHistory(apps);
    }
  };

  useEffect(() => {
    if (showHistory) {
      loadHistory();
    }
  }, [showHistory, user, isPremium]);

  const handleGoogleLogin = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
    } catch (error: any) {
      if (error?.code === 'auth/unauthorized-domain') {
        setAuthError(
          <div className="flex flex-col gap-2">
            <p>النطاق الحالي غير مصرح به لتسجيل الدخول.</p>
            <code dir="ltr" className="bg-red-100 dark:bg-red-900/40 p-2 rounded text-sm select-all text-red-800 dark:text-red-200 font-mono text-center">
              {window.location.hostname}
            </code>
          </div>
        );
      } else {
        setAuthError(error.message || 'حدث خطأ أثناء تسجيل الدخول');
      }
    }
  };

  const handleGuestLogin = async () => {
    try {
      setAuthError(null);
      await loginAsGuest();
    } catch (error: any) {
      setAuthError(error.message || 'حدث خطأ أثناء الدخول كزائر');
    }
  };

  const togglePremium = async () => {
    if (!user || user.isAnonymous) return;
    const newPlan = isPremium ? 'free' : 'premium';
    try {
      await setDoc(doc(db, 'users', user.uid), { plan: newPlan }, { merge: true });
      setIsPremium(!isPremium);
    } catch (error) {
      console.error("Error updating plan:", error);
    }
  };

  const handleDeleteHistory = async (appId: string) => {
    if (!user) return;
    await deleteFromHistory(user.uid, isPremium, appId);
    loadHistory();
  };

  const saveCustomInstructions = () => {
    localStorage.setItem('mystique_custom_instructions', tempInstructions);
    setCustomInstructions(tempInstructions);
    setShowCommandPanel(false);
  };

  const saveSettings = () => {
    if (tempGeminiKey) localStorage.setItem('mystique_gemini_key', tempGeminiKey);
    else localStorage.removeItem('mystique_gemini_key');

    if (tempFirebaseConfig) {
      try {
        JSON.parse(tempFirebaseConfig);
        localStorage.setItem('mystique_firebase_config', tempFirebaseConfig);
      } catch (e) {
        alert("إعدادات Firebase غير صحيحة.");
        return;
      }
    } else {
      localStorage.removeItem('mystique_firebase_config');
    }
    
    setShowSettings(false);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-800 text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl">🤖</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Kon</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">قم بتسجيل الدخول للبدء في استخدام المساعد الذكي.</p>

          {authError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              تسجيل الدخول عبر جوجل
            </button>
            <button onClick={handleGuestLogin} className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors">
              <UserCircle className="w-5 h-5" />
              الدخول كزائر
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans" dir="rtl">
      <Navbar
        user={user}
        isPremium={isPremium}
        isHistoryOpen={showHistory}
        isMiningOpen={showMining}
        onToggleSettings={() => {
          setTempGeminiKey(localStorage.getItem('mystique_gemini_key') || '');
          setTempFirebaseConfig(localStorage.getItem('mystique_firebase_config') || '');
          setShowSettings(true);
        }}
        onToggleCommandPanel={() => {
          setTempInstructions(customInstructions);
          setShowCommandPanel(true);
        }}
        onToggleHistory={() => {
          setShowHistory(!showHistory);
          setShowMining(false);
        }}
        onToggleMining={() => {
          setShowMining(!showMining);
          setShowHistory(false);
        }}
        onTogglePremium={togglePremium}
        onLogout={logout}
      />

      <main className="p-6 max-w-7xl mx-auto flex gap-6">
        <div className="flex-1">
          {showMining && (
            <div className="mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
              <MiningDashboard />
            </div>
          )}
          <header className="mb-12 text-center mt-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">مرحباً بك في عالم Kon</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              يمكنك التفاعل مع المساعد الذكي من خلال النافذة العائمة. اطلب منه التحول لأي تطبيق تريده.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">مساحة عمل {i}</h3>
                <p className="text-gray-500 dark:text-gray-400">هذا النص هو مجرد عنصر نائب لتوضيح التصميم.</p>
              </div>
            ))}
          </div>
        </div>

        {showHistory && (
          <HistorySidebar
            history={history}
            isPremium={isPremium}
            onAppSelect={setSelectedApp}
            onDelete={handleDeleteHistory}
          />
        )}
      </main>

      {showCommandPanel && (
        <CommandPanel
          instructions={customInstructions}
          tempInstructions={tempInstructions}
          onTempInstructionsChange={setTempInstructions}
          onClose={() => setShowCommandPanel(false)}
          onSave={saveCustomInstructions}
        />
      )}

      {showSettings && (
        <SettingsModal
          tempGeminiKey={tempGeminiKey}
          tempFirebaseConfig={tempFirebaseConfig}
          onGeminiKeyChange={setTempGeminiKey}
          onFirebaseConfigChange={setTempFirebaseConfig}
          onClose={() => setShowSettings(false)}
          onSave={saveSettings}
        />
      )}

      <FloatingChat 
        isPremium={isPremium} 
        externalApp={selectedApp} 
        onAppSelect={setSelectedApp} 
        customInstructions={customInstructions}
      />
    </div>
  );
}
