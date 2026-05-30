import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ToastType = 'success' | 'error' | 'info' | 'loading';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (type !== 'loading') {
      setTimeout(() => hideToast(id), 5000);
    }
  };

  const hideToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      <div className="fixed bottom-6 left-6 z-[99999] flex flex-col gap-3 max-w-md w-full sm:w-auto" dir="rtl">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: -50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
              className={`flex items-center gap-3 p-4 rounded-2xl shadow-lg border backdrop-blur-md ${
                toast.type === 'success' ? 'bg-green-500/90 border-green-400 text-white' :
                toast.type === 'error' ? 'bg-red-500/90 border-red-400 text-white' :
                toast.type === 'loading' ? 'bg-blue-500/90 border-blue-400 text-white' :
                'bg-gray-800/90 border-gray-700 text-white'
              }`}
            >
              <div className="flex-shrink-0">
                {toast.type === 'success' && <CheckCircle size={20} />}
                {toast.type === 'error' && <AlertCircle size={20} />}
                {toast.type === 'info' && <Info size={20} />}
                {toast.type === 'loading' && <Loader2 size={20} className="animate-spin" />}
              </div>
              <p className="text-sm font-medium flex-1">{toast.message}</p>
              <button onClick={() => hideToast(toast.id)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
