
import React, { useState, useMemo } from 'react';
import { Feedback, FeedbackStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { 
    MessageSquare, CheckCircle, XCircle, Clock, 
    Filter, Search, AlertCircle, ThumbsUp, Trash2, 
    Zap, Bug, Lightbulb, ChevronRight, User, Calendar,
    Save, X, Edit3, CornerDownRight
} from 'lucide-react';

interface FeedbackAdminPageProps {
    feedbackList: Feedback[];
    onUpdateFeedback: (id: string, updates: Partial<Feedback>) => void;
    onDeleteFeedback: (id: string) => void;
}

const FeedbackAdminPage: React.FC<FeedbackAdminPageProps> = ({ feedbackList, onUpdateFeedback, onDeleteFeedback }) => {
    const { t } = useLanguage();
    
    // -- FILTERS --
    const [filterStatus, setFilterStatus] = useState<string>('All');
    const [filterType, setFilterType] = useState<string>('All');
    const [searchQuery, setSearchQuery] = useState('');
    
    // -- SELECTION STATE --
    const [selectedFeedbackId, setSelectedFeedbackId] = useState<string | null>(null);
    
    // -- EDITING NOTES STATE --
    const [noteDraft, setNoteDraft] = useState('');

    // Derived State
    const selectedFeedback = useMemo(() => 
        feedbackList.find(f => f.id === selectedFeedbackId), 
    [feedbackList, selectedFeedbackId]);

    // Initialize draft when selection changes
    React.useEffect(() => {
        if (selectedFeedback) {
            setNoteDraft(selectedFeedback.adminNotes || '');
        }
    }, [selectedFeedbackId, selectedFeedback]);

    const filteredList = useMemo(() => {
        return feedbackList.filter(item => {
            const matchesStatus = filterStatus === 'All' || item.status === filterStatus;
            const matchesType = filterType === 'All' || item.type === filterType;
            const matchesSearch = item.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  item.userName.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesType && matchesSearch;
        }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [feedbackList, filterStatus, filterType, searchQuery]);

    // -- HELPERS --
    const getStatusColor = (status: FeedbackStatus) => {
        switch (status) {
            case 'New': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
            case 'In Progress': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
            case 'Resolved': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
            case 'Dismissed': return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600';
            default: return 'bg-slate-100 text-slate-600';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'Bug': return <Bug size={16} className="text-red-500" />;
            case 'Improvement': return <Lightbulb size={16} className="text-yellow-500" />;
            default: return <MessageSquare size={16} className="text-blue-500" />;
        }
    };

    const handleSaveNote = () => {
        if (selectedFeedbackId) {
            onUpdateFeedback(selectedFeedbackId, { adminNotes: noteDraft });
        }
    };

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (selectedFeedbackId) {
            onUpdateFeedback(selectedFeedbackId, { status: e.target.value as FeedbackStatus });
        }
    };

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 pb-6 animate-fade-in-up">
            
            {/* --- LEFT COLUMN: LIST & FILTERS --- */}
            <div className={`flex flex-col gap-6 transition-all duration-500 ${selectedFeedback ? 'w-1/2' : 'w-full'}`}>
                
                {/* Header Stats */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white border border-slate-700 shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-black tracking-tight">{t.feedback.adminTitle}</h2>
                            <p className="text-slate-400 text-sm mt-1">{t.feedback.manage}</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-center">
                                <span className="block text-xl font-bold">{feedbackList.filter(f => f.status === 'New').length}</span>
                                <span className="text-[10px] uppercase text-slate-400 font-bold">{t.feedback.status.New}</span>
                            </div>
                            <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-center">
                                <span className="block text-xl font-bold text-amber-400">{feedbackList.filter(f => f.status === 'In Progress').length}</span>
                                <span className="text-[10px] uppercase text-slate-400 font-bold">{t.feedback.status.InProgress}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center sticky top-0 z-10">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input 
                            type="text" 
                            placeholder={t.common.search}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select 
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm rounded-lg px-3 py-2 outline-none font-medium"
                        >
                            <option value="All">{t.common.all} Status</option>
                            <option value="New">{t.feedback.status.New}</option>
                            <option value="In Progress">{t.feedback.status.InProgress}</option>
                            <option value="Resolved">{t.feedback.status.Resolved}</option>
                        </select>
                        <select 
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm rounded-lg px-3 py-2 outline-none font-medium"
                        >
                            <option value="All">{t.common.all}</option>
                            <option value="Bug">{t.feedback.types.Bug}</option>
                            <option value="Improvement">{t.feedback.types.Improvement}</option>
                            <option value="General">{t.feedback.types.General}</option>
                        </select>
                    </div>
                </div>

                {/* Grid List */}
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                    {filteredList.map(item => (
                        <div 
                            key={item.id}
                            onClick={() => setSelectedFeedbackId(item.id)}
                            className={`
                                group relative bg-white dark:bg-slate-800 p-5 rounded-xl border-l-4 shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5
                                ${selectedFeedbackId === item.id ? 'border-l-indigo-500 ring-2 ring-indigo-500/20' : item.isActionable ? 'border-l-orange-500' : 'border-l-slate-300 dark:border-l-slate-600'}
                                border-y border-r border-slate-100 dark:border-slate-700
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-slate-50 dark:bg-slate-700 rounded-md">
                                        {getTypeIcon(item.type)}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{item.type}</span>
                                    {item.isActionable && (
                                        <span className="flex items-center gap-1 text-[10px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded border border-orange-200">
                                            <Zap size={8} fill="currentColor" /> {t.feedback.actionable.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                            </div>
                            
                            <h4 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{item.message}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{item.message}</p>
                            
                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <User size={12} /> {item.userName}
                                    <span className="mx-1">•</span>
                                    {new Date(item.timestamp).toLocaleDateString()}
                                </div>
                                <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </div>
                    ))}
                    
                    {filteredList.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p>{t.feedback.noSelection}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- RIGHT COLUMN: INSPECTOR PANEL --- */}
            {selectedFeedback ? (
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-slide-in-right">
                    
                    {/* Panel Header */}
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="flex gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm border ${selectedFeedback.type === 'Bug' ? 'bg-red-50 border-red-100 text-red-500' : 'bg-blue-50 border-blue-100 text-blue-500'}`}>
                                {getTypeIcon(selectedFeedback.type)}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold uppercase text-slate-400 tracking-wider">ID: {selectedFeedback.id.slice(0,8)}</span>
                                    <span className="text-xs text-slate-300">|</span>
                                    <span className="text-xs font-mono text-slate-500">{new Date(selectedFeedback.timestamp).toLocaleString()}</span>
                                </div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                    {selectedFeedback.type}
                                    {selectedFeedback.isActionable && <Zap size={18} className="text-orange-500 fill-orange-500" />}
                                </h2>
                            </div>
                        </div>
                        <button onClick={() => setSelectedFeedbackId(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8">
                        
                        {/* Status Control */}
                        <div className="flex flex-col md:flex-row gap-6 mb-8">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">{t.feedback.workflow}</label>
                                <div className="relative">
                                    <select 
                                        value={selectedFeedback.status}
                                        onChange={handleStatusChange}
                                        className={`w-full appearance-none pl-4 pr-10 py-3 rounded-xl border-2 font-bold text-sm outline-none cursor-pointer transition-all ${
                                            selectedFeedback.status === 'Resolved' ? 'border-green-200 bg-green-50 text-green-700' :
                                            selectedFeedback.status === 'In Progress' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                                            selectedFeedback.status === 'Dismissed' ? 'border-slate-200 bg-slate-50 text-slate-600' :
                                            'border-blue-200 bg-blue-50 text-blue-700'
                                        }`}
                                    >
                                        <option value="New">{t.feedback.status.New}</option>
                                        <option value="In Progress">{t.feedback.status.InProgress}</option>
                                        <option value="Resolved">{t.feedback.status.Resolved}</option>
                                        <option value="Dismissed">{t.feedback.status.Dismissed}</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <ChevronRight className="rotate-90 opacity-50" size={16} />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">{t.feedback.priority}</label>
                                <button 
                                    onClick={() => onUpdateFeedback(selectedFeedback.id, { isActionable: !selectedFeedback.isActionable })}
                                    className={`w-full py-3 px-4 rounded-xl border-2 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                        selectedFeedback.isActionable 
                                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm' 
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                                    }`}
                                >
                                    <Zap size={16} className={selectedFeedback.isActionable ? 'fill-current' : ''} />
                                    {selectedFeedback.isActionable ? t.feedback.markedActionable : t.feedback.markActionable}
                                </button>
                            </div>
                        </div>

                        {/* Message Body */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 mb-8">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600">
                                    {selectedFeedback.userName.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{selectedFeedback.userName}</div>
                                    <div className="text-xs text-slate-500">{t.feedback.submittedBy}</div>
                                </div>
                            </div>
                            <p className="text-slate-800 dark:text-slate-200 leading-relaxed text-base whitespace-pre-wrap">
                                "{selectedFeedback.message}"
                            </p>
                        </div>

                        {/* Admin Comments Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <Edit3 size={18} />
                                <h3 className="font-bold text-sm uppercase tracking-wider">{t.feedback.internalNotes}</h3>
                            </div>
                            
                            <div className="relative">
                                <textarea
                                    value={noteDraft}
                                    onChange={(e) => setNoteDraft(e.target.value)}
                                    placeholder="Add technical notes, reproduction steps, or resolution details here..."
                                    className="w-full h-32 p-4 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none resize-none transition-all"
                                />
                                <div className="absolute bottom-3 right-3">
                                    <button 
                                        onClick={handleSaveNote}
                                        className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg"
                                        title={t.common.save}
                                    >
                                        <Save size={16} />
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-1">
                                <CornerDownRight size={12} />
                                {t.feedback.visibleAdmin}
                            </p>
                        </div>

                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                        <button 
                            onClick={() => { onDeleteFeedback(selectedFeedback.id); setSelectedFeedbackId(null); }}
                            className="text-red-500 hover:text-red-600 text-sm font-bold flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <Trash2 size={16} /> {t.feedback.deleteRecord}
                        </button>
                        
                        <div className="text-xs text-slate-400 font-mono">
                            REV: {selectedFeedback.id.slice(0,8).toUpperCase()}
                        </div>
                    </div>

                </div>
            ) : null}

        </div>
    );
};

export default FeedbackAdminPage;
