
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, onClose, onConfirm, title, message, 
  confirmText, cancelText, isDestructive = false 
}) => {
  const { t } = useLanguage();
  const displayConfirm = confirmText || t.common.confirm;
  const displayCancel = cancelText || t.common.cancel;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 transform transition-all scale-100 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full shrink-0 ${isDestructive ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            {displayCancel}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-6 py-2 text-sm font-bold text-white rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 ${isDestructive ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'}`}
          >
            {displayConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
