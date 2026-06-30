
import React, { useState } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { getSafetyAdvice } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';
import { useAdvisor } from '../contexts/AdvisorContext';

// The Chat Window Component (Global)
const GeminiAdvisor: React.FC = () => {
  const { t, language } = useLanguage();
  const { isOpen, setIsOpen } = useAdvisor();
  
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse(null);
    const result = await getSafetyAdvice('General Safety', query, language);
    setResponse(result);
    setLoading(false);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 rounded-full shadow-2xl hover:shadow-indigo-500/30 transition-all hover:scale-110 flex items-center gap-2 group no-print"
        >
          <Sparkles size={24} className="animate-pulse" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap font-bold text-sm">
            {t?.advisor?.button || 'Ask AI'}
          </span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 no-print animate-fade-in-up">
          <div className="bg-white dark:bg-slate-800 w-80 md:w-96 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <h3 className="font-bold">{t?.advisor?.title || 'AI Advisor'}</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 h-64 overflow-y-auto bg-gray-50 dark:bg-slate-900 text-sm">
              {response ? (
                <div className="bg-white dark:bg-slate-700 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-slate-600 text-gray-800 dark:text-white">
                  <p className="font-medium text-blue-600 dark:text-blue-400 mb-1">{t?.advisor?.sender || 'AI'}:</p>
                  {response}
                </div>
              ) : (
                <div className="text-center text-gray-400 mt-10">
                  <p>{t?.advisor?.emptyState || 'How can I help?'}</p>
                </div>
              )}
              {loading && (
                <div className="flex justify-center mt-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
                  placeholder={t?.advisor?.placeholder || 'Type here...'}
                  className="flex-1 border dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-full px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
                <button 
                  onClick={handleAsk}
                  disabled={loading}
                  className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GeminiAdvisor;
