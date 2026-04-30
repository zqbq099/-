import React, { useEffect, useState } from 'react';
import { FloatingChat } from './components/FloatingChat';
import { auth, loginWithGoogle, loginAsGuest, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, LogIn, UserCircle, LogOut, History, Trash2, Crown, Terminal, X, Save } from 'lucide-react';
import { getHistory, SavedApp, deleteFromHistory } from './lib/history';
import { AppTransformData } from './lib/gemini';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<SavedApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<AppTransformData | null>(null);
  
  // Command Panel State
  const [showCommandPanel, setShowCommandPanel] = useState(false);
  const [customInstructions, setCustomInstructions] = useState(localStorage.getItem('mystique_custom_instructions') || '');
  const [tempInstructions, setTempInstructions] = useState(customInstructions);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
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
        } catch (error) {
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
      setAuthError(error.message || 'حدث خطأ أثناء تسجيل الدخول');
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
          <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">المتحول</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            قم بتسجيل الدخول للبدء في استخدام المساعد الذكي القادر على التحول لأي تطبيق.
          </p>

          {authError && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6">
              {authError}
            </div>
          )}

          <div className="space-y-4">
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 px-4 rounded-xl font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              تسجيل الدخول عبر جوجل
            </button>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">أو</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            <button
              onClick={handleGuestLogin}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors"
            >
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
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-xl">
            🤖
          </div>
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">المتحول</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              setTempInstructions(customInstructions);
              setShowCommandPanel(true);
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
            title="لوحة الأوامر (التحكم بالمتحول)"
          >
            <Terminal size={18} className="text-purple-600 dark:text-purple-400" />
            <span className="hidden sm:inline text-sm font-medium">لوحة الأوامر</span>
          </button>

          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${showHistory ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}`}
          >
            <History size={18} />
            <span className="hidden sm:inline text-sm font-medium">سجل التحولات</span>
          </button>

          {!user.isAnonymous && (
            <button 
              onClick={togglePremium}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium border ${isPremium ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'}`}
              title="زر تجريبي لتغيير حالة الاشتراك"
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
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">تسجيل الخروج</span>
          </button>
        </div>
      </nav>

      <main className="p-6 max-w-7xl mx-auto flex gap-6">
        <div className="flex-1">
          <header className="mb-12 text-center mt-8">
            <h2 className="text-3xl font-bold mb-4 text-gray-800 dark:text-gray-100">مرحباً بك في عالم المتحول</h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              يمكنك التفاعل مع المساعد الذكي من خلال النافذة العائمة. اطلب منه التحول لأي تطبيق تريده.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">مساحة عمل {i}</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  هذا النص هو مجرد عنصر نائب لتوضيح كيف تطفو نافذة الدردشة فوق محتوى التطبيق الأساسي.
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* History Sidebar */}
        {showHistory && (
          <div className="w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-col h-[calc(100vh-120px)] sticky top-24 overflow-hidden">
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
                  لا يوجد تطبيقات محفوظة بعد. اطلب من المتحول إنشاء تطبيق!
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((app) => (
                    <div key={app.id} className="group flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all cursor-pointer" onClick={() => setSelectedApp(app)}>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">{app.appName}</h4>
                        <p className="text-xs text-gray-500 truncate mt-0.5">
                          {new Date(app.createdAt).toLocaleDateString('ar-SA')} {new Date(app.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteHistory(app.id); }}
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
        )}
      </main>

      {/* Command Panel Modal */}
      {showCommandPanel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Terminal size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">لوحة الأوامر (Command Panel)</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">تحكم بسلوك المتحول دون قيد أو شرط</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCommandPanel(false)}
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
                  اكتب هنا أي أوامر أو قواعد تريد من المتحول الالتزام بها دائماً. هذه الأوامر لها الأولوية القصوى وستغير طريقة تفكيره وتصرفاته.
                </p>
                <textarea
                  value={tempInstructions}
                  onChange={(e) => setTempInstructions(e.target.value)}
                  placeholder="مثال: لا تستخدم اللون الأحمر أبداً، اجعل كل التطبيقات بأسلوب سايبربانك، تحدث معي بلهجة عامية..."
                  className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-mono text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  dir="auto"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
              <button
                onClick={() => setShowCommandPanel(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={saveCustomInstructions}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors shadow-md shadow-purple-500/20"
              >
                <Save size={16} />
                حفظ الأوامر
              </button>
            </div>
          </div>
        </div>
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


