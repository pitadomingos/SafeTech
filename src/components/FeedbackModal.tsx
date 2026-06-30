
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { FeedbackType } from '../types';
import { X, MessageSquarePlus, Bug, Lightbulb, Send, Loader2 } from 'lucide-react';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (type: FeedbackType, message: string) => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const { t } = useLanguage();
    const [type, setType] = useState<FeedbackType>('General');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setIsSubmitting(true);
        // Simulate network delay
        setTimeout(() => {
            onSubmit(type, message);
            setMessage('');
            setType('General');
            setIsSubmitting(false);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 relative transform transition-all scale-100"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <MessageSquarePlus size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{t.feedback.title}</h3>
                            <p className="text-xs text-blue-100">{t.feedback.subtitle}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">{t.feedback.typeLabel}</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'Bug', label: t.feedback.types.Bug, icon: Bug, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
                                { id: 'Improvement', label: t.feedback.types.Improvement, icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' },
                                { id: 'General', label: t.feedback.types.General, icon: MessageSquarePlus, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
                            ].map((opt) => (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setType(opt.id as FeedbackType)}
                                    className={`
                                        flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all gap-2
                                        ${type === opt.id 
                                            ? `${opt.bg} ${opt.border} ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-slate-800` 
                                            : 'border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                                    `}
                                >
                                    <opt.icon size={20} className={type === opt.id ? opt.color : 'text-slate-400'} />
                                    <span className={`text-[10px] font-bold ${type === opt.id ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                                        {opt.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">{t.feedback.messageLabel}</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 outline-none resize-none transition-all"
                            placeholder={t.feedback.msgPlaceholder}
                            required
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting || !message.trim()}
                            className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5
                                ${isSubmitting || !message.trim() ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'}
                            `}
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            {t.feedback.button}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FeedbackModal;
