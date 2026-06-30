
import React, { useState, useEffect } from 'react';
import { ScrollText, Filter, AlertTriangle, CheckCircle, Info, ShieldAlert, Clock, Terminal, ChevronLeft, ChevronRight, Zap, Bot, Skull, RefreshCw, Database } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/databaseService';
import { isSupabaseConfigured } from '../services/supabaseClient';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'AUDIT';

interface LogEntry {
    id: string;
    level: LogLevel;
    messageKey: string; 
    user: string;
    timestamp: string;
    aiFix?: string;
}

const CrashTrigger = () => {
    throw new Error("MANUAL SYSTEM CRASH: UAT Simulation Initiated by Admin");
};

const LogsPage: React.FC = () => {
    const { t, language } = useLanguage();
    const [filterLevel, setFilterLevel] = useState<LogLevel | 'ALL'>('ALL');
    const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [shouldCrash, setShouldCrash] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    const loadLogs = async () => {
        setIsLoading(true);
        try {
            const data = await db.getLogs();
            setAllLogs(data);
        } catch (e) {
            console.error("Failed to fetch logs:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadLogs();
    }, []);

    const getTranslatedMessage = (log: LogEntry) => {
        if (language === 'pt') {
            if (log.messageKey.includes('System Configuration')) return 'Admin do Sistema atualizou Configuração do Sistema';
            if (log.messageKey.includes('Auto-booking')) return 'Serviço de auto-agendamento executado com sucesso';
            if (log.messageKey.includes('Expiry Notification')) return 'Notificação de Expiração enviada';
            if (log.messageKey.includes('AI report')) return 'Falha ao gerar relatório IA';
            if (log.messageKey.includes('manually added')) return 'Usuário adicionou manualmente 5 agendamentos';
            if (log.messageKey.includes('logged in')) return 'Usuário fez login';
            if (log.messageKey.includes('deleted User')) return 'Admin do Sistema excluiu Usuário ID 45';
            if (log.messageKey.includes('CRASH PREVENTED')) return 'CRASH EVITADO: Loop de Renderização Infinito detectado';
        }
        return log.messageKey;
    };

    const filteredLogs = filterLevel === 'ALL' 
        ? allLogs 
        : allLogs.filter(log => log.level === filterLevel);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

    const getIcon = (level: LogLevel) => {
        switch (level) {
            case 'INFO': return <Info size={16} className="text-blue-500" />;
            case 'WARN': return <AlertTriangle size={16} className="text-yellow-500" />;
            case 'ERROR': return <ShieldAlert size={16} className="text-red-500" />;
            case 'AUDIT': return <CheckCircle size={16} className="text-green-500" />;
        }
    };

    if (shouldCrash) return <CrashTrigger />;

    return (
        <div className="space-y-6 pb-20 animate-fade-in-up h-[calc(100vh-100px)] flex flex-col">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl p-6 text-white shrink-0 relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                    <Terminal size={150} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <ScrollText size={28} className="text-purple-400" />
                            {t.logs.title}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-slate-400 text-sm font-mono">/var/log/vulcan-safety.log</span>
                             <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${isSupabaseConfigured ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                {isSupabaseConfigured ? 'Production Live' : 'Local Sandbox'}
                             </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button 
                            onClick={loadLogs}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl border border-white/10 transition-all text-xs font-bold uppercase"
                        >
                            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
                        </button>
                        <button 
                            onClick={() => setShouldCrash(true)}
                            className="flex items-center gap-2 bg-red-900/50 hover:bg-red-800 text-red-200 px-4 py-2 rounded-xl border border-red-800 transition-colors text-xs font-bold uppercase shadow-lg"
                        >
                            <Skull size={16} /> Simulate Crash
                        </button>
                        <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
                            <Filter size={16} className="text-slate-400 ml-2" />
                            <select 
                                className="bg-transparent text-white text-sm font-bold focus:outline-none p-1.5 cursor-pointer"
                                value={filterLevel}
                                onChange={(e) => { setFilterLevel(e.target.value as any); setCurrentPage(1); }}
                                title="Filter by Level"
                            >
                                <option value="ALL">{t.logs.levels.all}</option>
                                <option value="INFO">{t.logs.levels.info}</option>
                                <option value="WARN">{t.logs.levels.warn}</option>
                                <option value="ERROR">{t.logs.levels.error}</option>
                                <option value="AUDIT">{t.logs.levels.audit}</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col transition-colors relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-30 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-4">
                            <RefreshCw size={40} className="text-indigo-500 animate-spin" />
                            <span className="text-sm font-black uppercase tracking-widest text-slate-500">Retrieving Cloud Logs...</span>
                        </div>
                    </div>
                )}

                <div className="overflow-auto flex-1">
                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-gray-400 uppercase tracking-wider w-32">{t.logs.table.level}</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-gray-400 uppercase tracking-wider w-48">{t.logs.table.timestamp}</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-gray-400 uppercase tracking-wider w-48">{t.logs.table.user}</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-black dark:text-gray-400 uppercase tracking-wider">{t.logs.table.message}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700 font-mono text-xs">
                            {paginatedLogs.map((log) => {
                                const isAiFixed = !!log.aiFix;
                                return (
                                    <tr key={log.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group ${isAiFixed ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {getIcon(log.level)}
                                                <span className={`font-bold px-2 py-0.5 rounded border
                                                    ${log.level === 'INFO' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' : ''}
                                                    ${log.level === 'WARN' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800' : ''}
                                                    ${log.level === 'ERROR' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' : ''}
                                                    ${log.level === 'AUDIT' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800' : ''}
                                                `}>
                                                    {log.level}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-slate-900 dark:text-slate-400 flex items-center gap-2">
                                            <Clock size={12} className="text-slate-400" />
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-slate-900 dark:text-white font-bold flex items-center gap-2">
                                            {log.user === 'RoboTech AI' && <Bot size={14} className="text-indigo-500" />}
                                            {log.user}
                                        </td>
                                        <td className="px-6 py-3 text-slate-800 dark:text-slate-300">
                                            <div className="flex flex-col gap-1">
                                                <span className="font-medium">{getTranslatedMessage(log)}</span>
                                                {isAiFixed && (
                                                    <div className="mt-2 p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg flex gap-3 items-start animate-pulse-slow">
                                                        <div className="mt-0.5 text-cyan-600 dark:text-cyan-400"><Zap size={14} /></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-cyan-700 dark:text-cyan-300 uppercase mb-0.5 tracking-wider">Resolution Engine:</p>
                                                            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">{log.aiFix}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            
                            {paginatedLogs.length === 0 && !isLoading && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <Database size={48} className="opacity-20 mb-4" />
                                            <p>No log records found matching your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
                        <span>{t.common.page} {currentPage} {t.common.of} {Math.max(1, totalPages)} ({filteredLogs.length} total)</span>
                        <div className="h-3 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                            <span>Rows per page:</span>
                            <select
                                value={itemsPerPage}
                                onChange={e => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                title="Rows per page"
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                            >
                                {[20, 30, 50, 80, 100].map(val => (
                                    <option key={val} value={val}>{val}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} title="Previous Page" className="p-2 rounded-xl border bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronLeft size={16}/></button>
                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} title="Next Page" className="p-2 rounded-xl border bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronRight size={16}/></button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LogsPage;
