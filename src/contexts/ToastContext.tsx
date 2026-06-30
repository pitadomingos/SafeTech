import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  resolve?: (value: boolean) => void;
}

interface AlertState {
  isOpen: boolean;
  title: string;
  message: string;
  okText?: string;
  resolve?: () => void;
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  confirm: (title: string, message: string, options?: { confirmText?: string; cancelText?: string; isDestructive?: boolean }) => Promise<boolean>;
  showAlert: (title: string, message: string, okText?: string) => Promise<void>;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
  });
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const confirm = (
    title: string,
    message: string,
    options?: { confirmText?: string; cancelText?: string; isDestructive?: boolean }
  ): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        isDestructive: options?.isDestructive,
        resolve,
      });
    });
  };

  const showAlert = (title: string, message: string, okText?: string): Promise<void> => {
    return new Promise(resolve => {
      setAlertState({
        isOpen: true,
        title,
        message,
        okText,
        resolve,
      });
    });
  };

  const handleConfirmClose = (value: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(value);
    }
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  const handleAlertClose = () => {
    if (alertState.resolve) {
      alertState.resolve();
    }
    setAlertState(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <ToastContext.Provider value={{ showToast, confirm, showAlert }}>
      {children}

      {/* Toast List Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => {
          let bgClass = 'bg-slate-900 border-slate-800 text-white';
          let Icon = Info;
          let iconColor = 'text-blue-400';

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-950/90 border-emerald-800/50 text-emerald-100 backdrop-blur-md';
            Icon = CheckCircle2;
            iconColor = 'text-emerald-400';
          } else if (toast.type === 'error') {
            bgClass = 'bg-red-950/90 border-red-900/50 text-red-100 backdrop-blur-md';
            Icon = XCircle;
            iconColor = 'text-red-400';
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-950/90 border-amber-900/50 text-amber-100 backdrop-blur-md';
            Icon = AlertTriangle;
            iconColor = 'text-amber-400';
          }

          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 p-4 rounded-2xl border shadow-2xl pointer-events-auto animate-slide-in-right ${bgClass}`}
            >
              <Icon className={`shrink-0 mt-0.5 ${iconColor}`} size={18} />
              <div className="flex-1 text-xs font-bold leading-normal">{toast.message}</div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-slate-400 hover:text-white transition-colors"
                title="Dismiss toast"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog Overlay */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden transform animate-scale-in">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full shrink-0 ${confirmState.isDestructive ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400'}`}>
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    {confirmState.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {confirmState.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700/80 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => handleConfirmClose(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {confirmState.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleConfirmClose(true)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-md transition-all active:scale-95 ${
                  confirmState.isDestructive
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'
                }`}
              >
                {confirmState.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Dialog Overlay */}
      {alertState.isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full overflow-hidden transform animate-scale-in">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 rounded-full shrink-0">
                  <Info size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight mb-2">
                    {alertState.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    {alertState.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700/80 flex justify-end">
              <button
                type="button"
                onClick={handleAlertClose}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/20 transition-all active:scale-95"
              >
                {alertState.okText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
