
import React, { useState, useEffect, useMemo } from 'react';
import { 
    GitMerge, Database, ChevronRight, RefreshCw, Zap, Activity, 
    Users, HardHat, ShieldCheck, Lock, Share2, Network, Cpu, Key, 
    Terminal, ToggleRight, ToggleLeft, Copy, X, Settings, Save, 
    SmartphoneIcon, ExternalLink, Plus, GlobeLock, Laptop, Info,
    CheckCircle2, History, AlertCircle, Code, ChevronDown, Check,
    XCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/databaseService';
import { v4 as uuidv4 } from 'uuid';
import { RAW_HR_SOURCE, RAW_CONTRACTOR_SOURCE } from '../constants';
import { DataConnector, AppGateway } from '../types';

const INITIAL_CONNECTORS: DataConnector[] = [
    {
        id: 'sf-hr',
        name: 'SuccessFactors (HR)',
        type: 'Database',
        source: 'Vulcan Global HR',
        status: 'Healthy',
        color: 'blue',
        config: { baseUrl: 'https://api.successfactors.com/v1', apiKey: '********', syncFrequency: 'Daily' },
        mapping: { 'personnel_no': 'recordId', 'display_name': 'name', 'org_unit': 'department', 'job_title': 'role' },
        moduleMapping: { 'aso_date': 'medicalExpiry', 'training_matrix': 'requiredRacs' }
    },
    {
        id: 'cc-contract',
        name: 'Célula de Contrato',
        type: 'API',
        source: 'Contractor Management DB',
        status: 'Idle',
        color: 'orange',
        config: { baseUrl: 'https://contractors.vulcan.co.mz/api', apiKey: '', syncFrequency: 'Daily' },
        mapping: { 'id_externo': 'recordId', 'nome_completo': 'name', 'empresa_mae': 'company', 'funcao': 'role' },
        moduleMapping: { 'validade_aso': 'medicalExpiry', 'perfil_treino': 'requiredRacs' }
    }
];

const INITIAL_GATEWAYS: AppGateway[] = [
    { id: 'gw-access', name: 'Site Access Controller', type: 'Access Control App', lastActive: 'Real-time', status: 'Authorized', key: 'cars_live_pk_9921_x23', description: 'Third-party system managing gate turnstiles.' },
    { id: 'gw-breath', name: 'Alco-Sensor IoT Hub', type: 'Breathalyzer System', lastActive: '10 mins ago', status: 'Authorized', key: 'cars_live_pk_1029_b72', description: 'Integration for automated BAC checks at entry points.' },
];

const IntegrationHub: React.FC = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'Connectors' | 'Gateways' | 'SyncLog'>('Connectors');
    const [isSyncing, setIsSyncing] = useState<string | null>(null);
    const [includeModules, setIncludeModules] = useState(false);
    const [connectors, setConnectors] = useState<DataConnector[]>([]);
    const [gateways, setGateways] = useState<AppGateway[]>(INITIAL_GATEWAYS);
    const [editingConnector, setEditingConnector] = useState<DataConnector | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [syncLogs, setSyncLogs] = useState<any[]>([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false);
    
    // API Registry Preview State
    const [expandedApi, setExpandedApi] = useState<number | null>(null);
    const [copiedPath, setCopiedPath] = useState<string | null>(null);

    // Gateway Creation State
    const [isAddGatewayModalOpen, setIsAddGatewayModalOpen] = useState(false);
    const [newGateway, setNewGateway] = useState({ name: '', type: 'Mobile App', description: '' });

    useEffect(() => {
        const load = async () => {
            const saved = await db.getConnectors();
            if (saved && saved.length > 0) {
                setConnectors(saved);
            } else {
                setConnectors(INITIAL_CONNECTORS);
            }
            if (activeTab === 'SyncLog') loadSyncLogs();
        };
        load();
    }, [activeTab]);

    const loadSyncLogs = async () => {
        setIsLoadingLogs(true);
        const logs = await db.getLogs();
        // Filter for sync related logs
        setSyncLogs(logs.filter(l => l.messageKey.includes('SYNC') || l.messageKey.includes('INTEGRATION')));
        setIsLoadingLogs(false);
    };

    const handleSaveConfig = async () => {
        if (!editingConnector) return;
        setIsTesting(true);
        setTimeout(async () => {
            const finalStatus = editingConnector.config.baseUrl?.includes('http') ? 'Healthy' : 'Error';
            const updated = connectors.map(c => c.id === editingConnector.id ? { ...editingConnector, status: finalStatus as any } : c);
            setConnectors(updated);
            await db.saveConnector({ ...editingConnector, status: finalStatus as any });
            setIsTesting(false);
            setEditingConnector(null);
            await db.addLog('INFO', `GATEWAY_LINK_ESTABLISHED: ${editingConnector.name}`, 'Admin');
        }, 1500);
    };

    const handleRunSync = async (id: string) => {
        setIsSyncing(id);
        const connector = connectors.find(c => c.id === id);
        try {
            const sourceData = id === 'sf-hr' ? RAW_HR_SOURCE : RAW_CONTRACTOR_SOURCE;
            const result = await db.syncExternalData(id, sourceData, includeModules);
            await db.addLog('AUDIT', `SYNC_COMPLETED: ${connector?.name}`, 'System', { 
                added: result.added, 
                updated: result.updated,
                scope: includeModules ? 'Matrix' : 'Identity' 
            });
        } catch (e) {
            await db.addLog('ERROR', `SYNC_FAILED: ${connector?.name}`, 'System');
        } finally {
            setIsSyncing(null);
            if (activeTab === 'SyncLog') loadSyncLogs();
        }
    };

    const handleCreateGateway = () => {
        if (!newGateway.name) return;
        const app: AppGateway = {
            id: `gw-${uuidv4().slice(0, 8)}`,
            name: newGateway.name,
            type: newGateway.type,
            description: newGateway.description,
            status: 'Authorized',
            lastActive: 'Never',
            key: `cars_live_pk_${Math.random().toString(36).substring(7)}_${Math.floor(Math.random() * 999)}`
        };
        setGateways([...gateways, app]);
        setIsAddGatewayModalOpen(false);
        setNewGateway({ name: '', type: 'Mobile App', description: '' });
        db.addLog('AUDIT', `PROVISIONED_GATEWAY: ${app.name}`, 'Admin');
    };

    const revokeGateway = (id: string) => {
        setGateways(gateways.filter(g => g.id !== id));
        db.addLog('WARN', `REVOKED_GATEWAY_ACCESS: ID ${id}`, 'Admin');
    };

    const handleCopyPath = (path: string) => {
        navigator.clipboard.writeText(path);
        setCopiedPath(path);
        setTimeout(() => setCopiedPath(null), 2000);
    };

    const apiRegistry = [
        { 
            method: 'GET', 
            path: '/api/v1/verify/{recordId}', 
            desc: 'Validate employee site access and RAC credentials for turnstiles.',
            example: { status: "GRANTED", personnel: { name: "Paulo Manjate", company: "Vulcan" }, checks: { aso: "OK", racs: ["RAC01", "RAC02"] } }
        },
        { 
            method: 'GET', 
            path: '/api/v1/sync/matrix', 
            desc: 'Fetch site compliance matrix for offline caching in handheld devices.',
            example: { site_id: "s1", last_updated: "2024-06-20T10:00:00Z", matrix_version: "2.5" }
        },
        { 
            method: 'POST', 
            path: '/api/v1/alcohol/log', 
            desc: 'Hardware-level integration for logging Breathalyzer results to employee profile.',
            example: { success: true, record_id: "VUL-1001", action: "GATE_LOCKED", bac: 0.082 }
        }
    ];

    return (
        <div className="space-y-6 pb-24 animate-fade-in-up">
            <div className="bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
                    <Network size={400} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg">
                            <GitMerge size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase italic">Integration <span className="text-indigo-400">Hub</span></h1>
                            <p className="text-slate-400 font-medium tracking-wide uppercase text-[10px]">Cloud Data Normalization & Consumer Gateways</p>
                        </div>
                    </div>
                    <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                        {[
                            { id: 'Connectors', label: 'Connectors', icon: GitMerge },
                            { id: 'Gateways', label: 'Gateways', icon: Share2 },
                            { id: 'SyncLog', label: 'Sync Log', icon: History }
                        ].map((tab) => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {activeTab === 'Connectors' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-12 space-y-4">
                        <div className="bg-[#0f172a] border border-[#1e293b] p-6 rounded-[2.5rem] flex items-center justify-between shadow-2xl">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-[#1e293b] rounded-2xl text-indigo-400 border border-[#334155] shadow-inner">
                                    <Cpu size={28} />
                                </div>
                                <div>
                                    <h4 className="font-black text-white uppercase tracking-tight text-lg">Deep Sync Service</h4>
                                    <p className="text-sm text-slate-400 font-medium">Enable training result fetching from production sources (HR/Contracts)</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIncludeModules(!includeModules)}
                                className={`flex items-center gap-4 px-6 py-3 rounded-2xl border-2 transition-all font-black text-xs uppercase tracking-widest ${
                                    includeModules 
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                    : 'bg-[#1e293b] border-[#334155] text-slate-400 hover:text-indigo-400'
                                }`}
                            >
                                {includeModules ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                <span className="w-32 text-center">{includeModules ? 'Matrix Enabled' : 'Profile Only'}</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {connectors.map((conn) => (
                                <div key={conn.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm p-8 group hover:shadow-xl transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
                                                conn.color === 'blue' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                                {conn.id === 'sf-hr' ? <Users size={32} /> : <HardHat size={32} />}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{conn.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{conn.type}</span>
                                                    <span className={`text-[10px] font-bold uppercase ${conn.status === 'Healthy' ? 'text-emerald-500' : 'text-slate-400'}`}>{conn.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setEditingConnector(conn)} className="p-2 bg-slate-50 dark:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Settings size={18} /></button>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                                            <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Endpoint URL</div>
                                            <div className="text-sm font-mono text-slate-600 dark:text-slate-300 truncate">{conn.config.baseUrl || 'Not Configured'}</div>
                                        </div>
                                        <button 
                                            onClick={() => handleRunSync(conn.id)}
                                            disabled={isSyncing !== null}
                                            className="w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-50"
                                        >
                                            {isSyncing === conn.id ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                                            {isSyncing === conn.id ? 'Processing...' : 'Run Manual Sync'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'Gateways' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-[#0f172a] border border-[#1e293b] p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-10 top-0 opacity-5"><Share2 size={300} /></div>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-[#1e293b] rounded-2xl text-blue-400 border border-[#334155]">
                                <GlobeLock size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">External App Gateways</h3>
                                <p className="text-slate-400 font-medium">Provision third-party apps to consume CARS verification data.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            {gateways.map(app => (
                                <div key={app.id} className="bg-slate-900/50 border border-slate-700 p-6 rounded-3xl hover:border-blue-500/50 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700 shadow-inner">
                                                {app.type.includes('Mobile') ? <SmartphoneIcon size={24}/> : <Laptop size={24}/>}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white text-lg">{app.name}</h4>
                                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{app.type} • Status: <span className="text-emerald-500">{app.status}</span></p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 rounded-md text-[10px] font-black uppercase border border-blue-500/20">Consumer</span>
                                    </div>
                                    
                                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">{app.description}</p>
                                    
                                    <div className="bg-black/40 p-4 rounded-xl border border-slate-800 font-mono text-[11px] flex justify-between items-center text-slate-400 mb-6 group-hover:border-slate-600 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Key size={14} className="text-blue-500" />
                                            <span>{app.key}</span>
                                        </div>
                                        <button className="hover:text-white transition-colors" onClick={() => navigator.clipboard.writeText(app.key)}><Copy size={14}/></button>
                                    </div>

                                    <div className="flex gap-3">
                                        <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all flex items-center justify-center gap-2">
                                            <Activity size={14} /> Traffic
                                        </button>
                                        <button onClick={() => revokeGateway(app.id)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-red-500/20 transition-all flex items-center justify-center gap-2">
                                            <X size={14} /> Revoke
                                        </button>
                                    </div>
                                </div>
                            ))}

                            <button 
                                onClick={() => setIsAddGatewayModalOpen(true)}
                                className="border-2 border-dashed border-slate-700 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-blue-500/50 hover:text-blue-400 transition-all bg-slate-900/30 group"
                            >
                                <div className="p-4 bg-slate-800 rounded-full group-hover:bg-blue-500/10 group-hover:scale-110 transition-all">
                                    <Plus size={32} />
                                </div>
                                <span className="font-black text-sm uppercase tracking-[0.2em]">Register New Application</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <Terminal className="text-indigo-600" size={24} />
                            <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Consumer API Endpoint Registry</h4>
                        </div>
                        <div className="space-y-4">
                            {apiRegistry.map((api, i) => (
                                <div key={i} className="flex flex-col rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden group hover:border-indigo-200 transition-all">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4 p-5 bg-slate-50 dark:bg-slate-900/50">
                                        <span className="w-16 text-center py-1 bg-indigo-600 text-white rounded-md font-black text-[10px] tracking-widest shrink-0">{api.method}</span>
                                        <span className="font-mono text-sm text-slate-900 dark:text-indigo-300 flex-1">{api.path}</span>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => handleCopyPath(api.path)}
                                                className={`p-2 rounded-lg transition-all ${copiedPath === api.path ? 'bg-emerald-100 text-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-300 hover:text-indigo-600 shadow-sm'}`}
                                                title="Copy Path"
                                            >
                                                {copiedPath === api.path ? <Check size={14}/> : <Copy size={14}/>}
                                            </button>
                                            <button 
                                                onClick={() => setExpandedApi(expandedApi === i ? null : i)}
                                                className={`p-2 rounded-lg transition-all bg-white dark:bg-slate-800 text-slate-300 hover:text-indigo-600 shadow-sm ${expandedApi === i ? 'rotate-180 text-indigo-600' : ''}`}
                                                title="View Example Response"
                                            >
                                                <ChevronDown size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    {expandedApi === i && (
                                        <div className="bg-slate-950 p-6 animate-fade-in-down border-t border-slate-800">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Response Schema (200 OK)</span>
                                                <div className="flex gap-1">
                                                    <div className="w-2 h-2 rounded-full bg-red-500 opacity-50"></div>
                                                    <div className="w-2 h-2 rounded-full bg-yellow-500 opacity-50"></div>
                                                    <div className="w-2 h-2 rounded-full bg-green-500 opacity-50"></div>
                                                </div>
                                            </div>
                                            <pre className="text-indigo-400 font-mono text-xs overflow-x-auto">
                                                {JSON.stringify(api.example, null, 2)}
                                            </pre>
                                        </div>
                                    )}
                                    
                                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800">
                                        <span className="text-xs text-slate-500 font-medium italic">{api.desc}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'SyncLog' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                                    <History size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Centralized Sync History</h3>
                                    <p className="text-xs text-slate-500">Audit trail of all data normalization events</p>
                                </div>
                            </div>
                            <button 
                                onClick={loadSyncLogs}
                                disabled={isLoadingLogs}
                                className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all shadow-sm"
                            >
                                <RefreshCw size={14} className={isLoadingLogs ? 'animate-spin' : ''}/> Refresh Logs
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto scrollbar-hide">
                            {syncLogs.length > 0 ? (
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10 border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Type</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-mono text-[11px]">
                                        {syncLogs.map((log) => (
                                            <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-bold text-slate-900 dark:text-indigo-400">{log.messageKey}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {log.level === 'ERROR' ? (
                                                        <span className="flex items-center gap-1.5 text-red-500 font-black"><XCircle size={14}/> FAILED</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-emerald-500 font-black"><CheckCircle2 size={14}/> SUCCESS</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                                        <span>Origin: {log.user}</span>
                                                        <span className="mx-1">•</span>
                                                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 rounded">{log.level}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                    <Database size={48} className="mb-4" />
                                    <p className="font-bold">No synchronization events recorded yet.</p>
                                    <p className="text-xs">Run a manual sync in the Connectors tab to populate this log.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em]">
                                <ShieldCheck size={14} /> immutable ledger active
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* REGISTER APP MODAL */}
            {isAddGatewayModalOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Provision Third-Party App</h3>
                            <button onClick={() => setIsAddGatewayModalOpen(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Application Name</label>
                                <input 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    placeholder="e.g. Field Guardian Mobile"
                                    value={newGateway.name}
                                    onChange={e => setNewGateway({...newGateway, name: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">App Type</label>
                                    <select 
                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                        value={newGateway.type}
                                        onChange={e => setNewGateway({...newGateway, type: e.target.value})}
                                    >
                                        <option>Mobile App</option>
                                        <option>IoT Gateway</option>
                                        <option>Web Service</option>
                                        <option>Security Kiosk</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Initial Status</label>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl p-4 text-sm font-black flex items-center gap-2 border border-emerald-100 dark:border-emerald-800">
                                        <CheckCircle2 size={18}/> AUTHORIZED
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Usage Description</label>
                                <textarea 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all h-24 resize-none"
                                    placeholder="Briefly describe what this app will use CARS data for..."
                                    value={newGateway.description}
                                    onChange={e => setNewGateway({...newGateway, description: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                            <button 
                                onClick={handleCreateGateway}
                                disabled={!newGateway.name}
                                className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                            >
                                <Zap size={18}/> PROVISION ACCESS
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editingConnector && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{editingConnector.name} Gateway</h3>
                            <button onClick={() => setEditingConnector(null)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base API URL</label>
                                <input 
                                    type="text" 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    value={editingConnector.config.baseUrl || ''}
                                    onChange={e => setEditingConnector({ ...editingConnector, config: { ...editingConnector.config, baseUrl: e.target.value } })}
                                />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Auth Token</label>
                                <input 
                                    type="password" 
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 transition-all"
                                    value={editingConnector.config.apiKey || ''}
                                    onChange={e => setEditingConnector({ ...editingConnector, config: { ...editingConnector.config, apiKey: e.target.value } })}
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                            <button onClick={handleSaveConfig} disabled={isTesting} className="px-10 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
                                {isTesting ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                                SAVE CONFIGURATION
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default IntegrationHub;
