
import React, { useState } from 'react';
import { useMessages } from '../contexts/MessageContext';
import { Mail, Smartphone, Search, Trash2, Clock, CheckCircle2, User, Send } from 'lucide-react';
import { format } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';

const MessageLogPage: React.FC = () => {
  const { messages, clearMessages } = useMessages();
  const { t, language } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(messages.length > 0 ? messages[0].id : null);
  const [filter, setFilter] = useState('');

  const filteredMessages = messages.filter(m => 
    m.recipientName.toLowerCase().includes(filter.toLowerCase()) ||
    m.recipient.includes(filter) ||
    m.content.toLowerCase().includes(filter.toLowerCase())
  );

  const selectedMessage = messages.find(m => m.id === selectedId);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-t-2xl border-b border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <Send className="text-blue-500" size={28} />
            {t.communications.title}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t.communications.subtitle}</p>
        </div>
        <button 
          onClick={clearMessages}
          className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 size={14} /> {t.communications.clear}
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-b-2xl border border-t-0 border-slate-200 dark:border-slate-700">
        
        {/* Sidebar List */}
        <div className="w-1/3 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder={t.communications.search}
                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">{t.communications.empty}</div>
            ) : (
              filteredMessages.map(msg => (
                <div 
                  key={msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className={`p-4 border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${selectedId === msg.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      {msg.type === 'SMS' 
                        ? <Smartphone size={14} className="text-purple-500" /> 
                        : <Mail size={14} className="text-blue-500" />}
                      <span className="font-bold text-sm text-slate-800 dark:text-white truncate max-w-[120px]">{msg.recipientName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{format(msg.timestamp, 'HH:mm')}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{msg.subject || msg.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Preview Area */}
        <div className="w-2/3 p-8 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 relative">
          {!selectedMessage ? (
            <div className="text-center text-slate-400">
              <Send size={48} className="mx-auto mb-4 opacity-20" />
              <p>{t.communications.select}</p>
            </div>
          ) : (
            <>
              {selectedMessage.type === 'SMS' ? (
                // iPhone Simulation
                <div className="w-[320px] h-[600px] bg-black rounded-[40px] p-3 shadow-2xl border-4 border-slate-800 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-20"></div>
                  <div className="w-full h-full bg-slate-100 rounded-[32px] overflow-hidden flex flex-col relative">
                    {/* iOS Header */}
                    <div className="bg-slate-100/90 backdrop-blur-sm p-4 pt-10 border-b border-slate-200 flex flex-col items-center z-10">
                        <div className="w-10 h-10 bg-slate-300 rounded-full flex items-center justify-center mb-1 text-slate-500">
                            <User size={20} />
                        </div>
                        <span className="text-xs font-medium text-slate-900 uppercase font-black">{language === 'pt' ? 'RACS' : 'CARS'} SAFETY</span>
                        <span className="text-[10px] text-slate-400">{t.communications.sms} • Today {format(selectedMessage.timestamp, 'HH:mm')}</span>
                    </div>
                    {/* Message Body */}
                    <div className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
                        <div className="self-start max-w-[80%] bg-slate-200 rounded-2xl rounded-tl-none px-4 py-2 text-sm text-slate-800 shadow-sm">
                            {selectedMessage.content}
                        </div>
                        <div className="text-[10px] text-slate-400 self-start ml-2">{t.communications.gateway}</div>
                    </div>
                    {/* iOS Input Area */}
                    <div className="p-3 bg-slate-100 border-t border-slate-200">
                        <div className="h-8 rounded-full border border-slate-300 bg-white"></div>
                    </div>
                  </div>
                </div>
              ) : (
                // Email Client Simulation
                <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700 h-full flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">{selectedMessage.subject}</h3>
                        <div className="flex gap-3 text-sm">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                {language === 'pt' ? 'RA' : 'CA'}
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 dark:text-white">{language === 'pt' ? 'RACS' : 'CARS'} Safety System <span className="text-slate-400 font-normal">&lt;no-reply@cars-system.com&gt;</span></div>
                                <div className="text-slate-500 dark:text-slate-400">{t.communications.to}: {selectedMessage.recipientName} &lt;{selectedMessage.recipient}&gt;</div>
                            </div>
                            <div className="ml-auto text-xs text-slate-400">
                                {format(selectedMessage.timestamp, 'MMM dd, yyyy, h:mm a')}
                            </div>
                        </div>
                    </div>
                    <div className="p-8 flex-1 overflow-y-auto font-serif text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.content}
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-400 text-center">
                        {t.communications.automated}
                    </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageLogPage;
