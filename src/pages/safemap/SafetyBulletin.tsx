import React from 'react';
import { motion } from 'motion/react';
import { MessageSquare, AlertCircle, Info, CheckCircle2, Calendar, User, ArrowRight, Share2, Download } from 'lucide-react';

interface Bulletin {
    id: string;
    title: string;
    type: 'Alert' | 'Best Practice' | 'Information' | 'Success Story';
    content: string;
    date: string;
    author: string;
    priority: 'Low' | 'Medium' | 'High';
}

const bulletins: Bulletin[] = [
    {
        id: '1',
        title: 'Safe Handling of Chemical Agents in Workshop B',
        type: 'Alert',
        content: 'Following a recent observation of improper storage, all personnel must review the SDS for sulfuric acid. Ensure secondary containment is always used.',
        date: '2026-06-28',
        author: 'John Safety',
        priority: 'High'
    },
    {
        id: '2',
        title: 'New Personal Protective Equipment Standard',
        type: 'Information',
        content: 'The new high-visibility vest standard has been released. Old vests are still valid for 3 months, but new orders will receive the reinforced model.',
        date: '2026-06-25',
        author: 'Ana Ferreira',
        priority: 'Medium'
    },
    {
        id: '3',
        title: 'Zero Incident Milestone Reached!',
        type: 'Success Story',
        content: 'Congratulations to the Mine Operations team for reaching 500,000 man-hours without a Lost Time Incident (LTI). Let\'s keep it up!',
        date: '2026-06-20',
        author: 'Global CEO',
        priority: 'Low'
    }
];

export default function SafetyBulletin() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Safety Bulletin</h1>
                    <p className="text-slate-500 font-medium">Critical safety alerts and company-wide communications.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none">
                        <MessageSquare size={18} /> New Announcement
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {bulletins.map((bulletin, idx) => (
                    <motion.div 
                        key={bulletin.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl flex flex-col group"
                    >
                        <div className={`h-2 w-full ${
                            bulletin.type === 'Alert' ? 'bg-red-500' :
                            bulletin.type === 'Best Practice' ? 'bg-emerald-500' :
                            bulletin.type === 'Information' ? 'bg-blue-500' : 'bg-amber-500'
                        }`} />
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                                    bulletin.type === 'Alert' ? 'bg-red-100 text-red-600' :
                                    bulletin.type === 'Best Practice' ? 'bg-emerald-100 text-emerald-600' :
                                    bulletin.type === 'Information' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'
                                }`}>
                                    {bulletin.type}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${
                                    bulletin.priority === 'High' ? 'text-red-500' : 'text-slate-400'
                                }`}>
                                    {bulletin.priority} Priority
                                </span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 group-hover:text-indigo-500 transition-colors">{bulletin.title}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 line-clamp-3 leading-relaxed">
                                {bulletin.content}
                            </p>
                            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><User size={10}/> {bulletin.author}</span>
                                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Calendar size={12}/> {new Date(bulletin.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button title="Share" className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"><Share2 size={16} /></button>
                                    <button title="Download" className="p-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all"><Download size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-125"><Info size={180} /></div>
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-3xl font-black tracking-tighter mb-4">Safety Culture Feedback</h2>
                    <p className="text-slate-400 font-medium mb-6 leading-relaxed">
                        Have a suggestion or feedback about safety procedures? Share your thoughts with the SSMA team anonymously or identified. Your input saves lives.
                    </p>
                    <button className="px-6 py-3 bg-white text-slate-900 rounded-2xl font-bold hover:bg-yellow-500 transition-all flex items-center gap-2">
                        Submit Feedback <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
}
