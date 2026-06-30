import React, { useState, useRef, useEffect } from 'react';
import {
    Users, FileText, Upload, Check, X, Clock, CheckCircle2,
    AlertTriangle, Eye, ChevronRight, Search, Filter, Download,
    FileScan, FileCheck, BadgeCheck, BarChart3, TrendingUp,
    UserCheck, RefreshCw, Inbox, History, Star, Building2,
    Phone, Mail, Calendar, Briefcase, Hash, Shield, ChevronDown
} from 'lucide-react';
import { RecruitmentProcess, RecruitmentStatus, RecruitDocument } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '../contexts/LanguageContext';
import FormBuilder from '../components/FormBuilder';
import { db } from '../services/databaseService';



// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeSince(iso: string, isPt: boolean) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return isPt ? `Há ${Math.floor(diff / 60000)}m` : `${Math.floor(diff / 60000)}m ago`;
    if (h < 24) return isPt ? `Há ${h}h` : `${h}h ago`;
    const days = Math.floor(h / 24);
    return isPt ? `Há ${days}d` : `${days}d ago`;
}
function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function HRPortalPage() {
    const { t, language } = useLanguage();
    const isPt = language === 'pt';

    const statusBadge: Record<string, string> = {
        [RecruitmentStatus.AM_REQUESTED]:              'bg-slate-100 text-slate-600',
        [RecruitmentStatus.HR_PENDING]:                'bg-amber-100 text-amber-700',
        [RecruitmentStatus.SECURITY_PENDING]:          'bg-blue-100 text-blue-700',
        [RecruitmentStatus.PARALLEL_CLEARANCE_PENDING]:'bg-purple-100 text-purple-700',
        [RecruitmentStatus.CLINIC_PENDING]:            'bg-teal-100 text-teal-700',
        [RecruitmentStatus.INDUCTION_PENDING]:         'bg-indigo-100 text-indigo-700',
        [RecruitmentStatus.TRAINING_PENDING]:          'bg-orange-100 text-orange-700',
        [RecruitmentStatus.COMPLETED]:                 'bg-emerald-100 text-emerald-700',
    };

    const translateStatus = (status: RecruitmentStatus) => {
        const statuses = t.proposal?.mobilization?.statuses || {};
        return statuses[status] || status;
    };

    const [processes, setProcesses] = useState<RecruitmentProcess[]>([]);
    useEffect(() => {
        db.getRecruitmentProcesses().then(setProcesses).catch(err => console.error('HR: Failed to load processes:', err));
    }, []);
    const [activeTab, setActiveTab] = useState<'queue' | 'history' | 'documents' | 'formbuilder'>('queue');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [uploading, setUploading] = useState<Record<string, boolean>>({});
    const fileRefs = { id: useRef<HTMLInputElement>(null), passport: useRef<HTMLInputElement>(null), permit: useRef<HTMLInputElement>(null) };

    // HR sees: AM_REQUESTED (to receive), HR_PENDING (to process), and done ones
    const queue = processes.filter(p =>
        (p.status === RecruitmentStatus.AM_REQUESTED || p.status === RecruitmentStatus.HR_PENDING) &&
        (p.requestType === 'Recruitment' || !p.requestType)
    );
    const history = processes.filter(p =>
        p.status !== RecruitmentStatus.AM_REQUESTED && p.status !== RecruitmentStatus.HR_PENDING &&
        (p.requestType === 'Recruitment' || !p.requestType)
    );
    const all = [...queue, ...history];
    const selected = processes.find(p => p.id === selectedId) || null;

    const filtered = (list: RecruitmentProcess[]) =>
        list.filter(p =>
            !search ||
            p.candidateName.toLowerCase().includes(search.toLowerCase()) ||
            p.role.toLowerCase().includes(search.toLowerCase()) ||
            p.company.toLowerCase().includes(search.toLowerCase())
        );

    function update(updated: RecruitmentProcess) {
        const list = processes.map(p => p.id === updated.id ? updated : p);
        setProcesses(list);
        db.saveRecruitmentProcess(updated).catch(e => console.error('HR: DB save failed:', e));
    }

    const [successMsg, setSuccessMsg] = useState('');
    function toast(msg: string) {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(''), 3000);
    }

    // Receive from AM → set HR_PENDING
    function receiveRequest(p: RecruitmentProcess) {
        update({ ...p, status: RecruitmentStatus.HR_PENDING, receivedAt: new Date().toISOString() });
        toast(isPt ? `${p.candidateName} recebido na fila de RH.` : `${p.candidateName} received into HR queue.`);
    }

    // HR uploads a doc
    function handleDocUpload(process: RecruitmentProcess, docType: 'ID' | 'Passport' | 'Work Permit', e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(u => ({ ...u, [docType]: true }));
        setTimeout(() => {
            const newDoc: RecruitDocument = {
                name: file.name,
                type: docType,
                uploadedAt: new Date().toISOString(),
                fileSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
                status: 'Verified',
                uploadedBy: 'HR'
            };
            update({ ...process, documents: [...(process.documents || []), newDoc] });
            setUploading(u => ({ ...u, [docType]: false }));
            toast(isPt ? `${docType} carregado e verificado.` : `${docType} uploaded and verified.`);
        }, 1200);
        e.target.value = '';
    }

    // Approve → forward to Security
    function approveToSecurity(p: RecruitmentProcess) {
        const nextStatus = (p.workerType === 'Contractor' && p.requiresMedical !== false)
            ? RecruitmentStatus.PARALLEL_CLEARANCE_PENDING
            : RecruitmentStatus.SECURITY_PENDING;
        update({ ...p, status: nextStatus });
        toast(isPt 
            ? `${p.candidateName} encaminhado para ${(p.workerType === 'Contractor' && p.requiresMedical !== false) ? 'Segurança + Clínica (Paralelo)' : 'Segurança'}.` 
            : `${p.candidateName} forwarded to ${(p.workerType === 'Contractor' && p.requiresMedical !== false) ? 'Security + Clinic (Parallel)' : 'Security'}.`
        );
    }

    // Reject / Return to AM
    function returnToAM(p: RecruitmentProcess) {
        update({ ...p, status: RecruitmentStatus.AM_REQUESTED });
        toast(isPt ? `${p.candidateName} devolvido ao Diretor de Área para revisão.` : `${p.candidateName} returned to Area Manager for revision.`);
    }

    const stats = [
        { label: t.hrPortal.stats.pendingAm, value: processes.filter(p => p.status === RecruitmentStatus.AM_REQUESTED && (p.requestType === 'Recruitment' || !p.requestType)).length, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
        { label: t.hrPortal.stats.inHrReview, value: processes.filter(p => p.status === RecruitmentStatus.HR_PENDING && (p.requestType === 'Recruitment' || !p.requestType)).length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
        { label: t.hrPortal.stats.approvedMonth, value: processes.filter(p => p.status !== RecruitmentStatus.AM_REQUESTED && p.status !== RecruitmentStatus.HR_PENDING && (p.requestType === 'Recruitment' || !p.requestType)).length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { label: t.hrPortal.stats.totalPipeline, value: processes.filter(p => p.requestType === 'Recruitment' || !p.requestType).length, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    ];

    const tabs = [
        { id: 'queue', label: t.hrPortal.tabs.queue, icon: Inbox, count: queue.length },
        { id: 'history', label: t.hrPortal.tabs.history, icon: History, count: history.length },
        { id: 'documents', label: t.hrPortal.tabs.documents, icon: FileText, count: all.reduce((a, p) => a + (p.documents?.length || 0) + (p.amDocuments?.length || 0), 0) },
        { id: 'formbuilder', label: isPt ? 'Construtor' : 'Form Builder', icon: FileCheck, count: undefined },
    ] as const;

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Users size={20} className="text-white" />
                        </div>
                        {t.hrPortal.title}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-14">
                        {t.hrPortal.subtitle}
                    </p>
                </div>
                <button onClick={() => { db.getRecruitmentProcesses().then(setProcesses); toast(isPt ? 'Atualizado.' : 'Refreshed.'); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-indigo-400 transition-all">
                    <RefreshCw size={13} /> {t.clinicPortal.refresh || 'Refresh'}
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(s => (
                    <div key={s.label} className={`${s.bg} dark:bg-slate-800/60 border ${s.border} dark:border-slate-700 rounded-[1.5rem] p-4 shadow-sm`}>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        <tab.icon size={13} /> {tab.label}
                        {tab.count !== undefined && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500'}`}>{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* Form Builder — full-width view */}
            {activeTab === 'formbuilder' ? (
                <FormBuilder tableName="hr_documents" portalType="hr" />
            ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left list */}
                <div className="lg:col-span-4 space-y-3">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 shadow-sm">
                        <Search size={14} className="text-slate-400 shrink-0" />
                        <input type="text" placeholder={t.hrPortal.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
                    </div>

                    <div className="space-y-2">
                        {filtered(activeTab === 'queue' ? queue : activeTab === 'history' ? history : all).map(p => (
                            <button key={p.id} onClick={() => setSelectedId(p.id)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedId === p.id ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-200'}`}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-black text-sm text-slate-900 dark:text-white truncate">{p.candidateName}</div>
                                        <div className="text-[10px] text-slate-500 mt-0.5">{p.role} · {p.department}</div>
                                        <div className="flex items-center gap-1.5 mt-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${statusBadge[p.status] || 'bg-slate-100 text-slate-600'}`}>{translateStatus(p.status)}</span>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${p.workerType === 'Contractor' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {p.workerType === 'Contractor' ? (isPt ? 'Contratado' : 'Contractor') : (isPt ? 'Principal' : 'Prime')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-slate-400 shrink-0">{timeSince(p.requestedAt, isPt)}</div>
                                </div>
                            </button>
                        ))}
                        {filtered(activeTab === 'queue' ? queue : activeTab === 'history' ? history : all).length === 0 && (
                            <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <Inbox size={32} className="mx-auto mb-2 opacity-20" />
                                <p className="text-xs">{t.hrPortal.noRecords}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right detail */}
                <div className="lg:col-span-8">
                    {selected ? (
                        <HRCandidateDetail
                            process={selected}
                            onReceive={receiveRequest}
                            onApprove={approveToSecurity}
                            onReturn={returnToAM}
                            onUpload={handleDocUpload}
                            uploading={uploading}
                            fileRefs={fileRefs}
                        />
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-16 text-center text-slate-400 shadow-sm h-full flex flex-col items-center justify-center">
                            <UserCheck size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="text-sm font-bold">{t.hrPortal.selectCandidatePrompt}</p>
                        </div>
                    )}
                </div>
            </div>
            )}

            {/* Toast */}
            {successMsg && (
                <div className="fixed bottom-6 right-6 bg-indigo-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50">
                    <CheckCircle2 size={18} />
                    <span className="font-black text-sm">{successMsg}</span>
                </div>
            )}
        </div>
    );
}

// ─── Candidate Detail Panel ───────────────────────────────────────────────────
function HRCandidateDetail({
    process: p, onReceive, onApprove, onReturn, onUpload, uploading, fileRefs
}: {
    process: RecruitmentProcess;
    onReceive: (p: RecruitmentProcess) => void;
    onApprove: (p: RecruitmentProcess) => void;
    onReturn: (p: RecruitmentProcess) => void;
    onUpload: (p: RecruitmentProcess, type: 'ID' | 'Passport' | 'Work Permit', e: React.ChangeEvent<HTMLInputElement>) => void;
    uploading: Record<string, boolean>;
    fileRefs: Record<string, React.RefObject<HTMLInputElement>>;
}) {
    const { t, language } = useLanguage();
    const isPt = language === 'pt';
    const isContractor = p.workerType === 'Contractor';
    const allDocs = [...(p.amDocuments || []), ...(p.documents || [])];
    const isActionable = p.status === RecruitmentStatus.AM_REQUESTED || p.status === RecruitmentStatus.HR_PENDING;

    const statusBadge: Record<string, string> = {
        [RecruitmentStatus.AM_REQUESTED]:              'bg-slate-100 text-slate-600',
        [RecruitmentStatus.HR_PENDING]:                'bg-amber-100 text-amber-700',
        [RecruitmentStatus.SECURITY_PENDING]:          'bg-blue-100 text-blue-700',
        [RecruitmentStatus.PARALLEL_CLEARANCE_PENDING]:'bg-purple-100 text-purple-700',
        [RecruitmentStatus.CLINIC_PENDING]:            'bg-teal-100 text-teal-700',
        [RecruitmentStatus.INDUCTION_PENDING]:         'bg-indigo-100 text-indigo-700',
        [RecruitmentStatus.TRAINING_PENDING]:          'bg-orange-100 text-orange-700',
        [RecruitmentStatus.COMPLETED]:                 'bg-emerald-100 text-emerald-700',
    };

    const translateStatus = (status: RecruitmentStatus) => {
        const statuses = t.proposal?.mobilization?.statuses || {};
        return statuses[status] || status;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Candidate header */}
            <div className="px-6 py-5 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/10 dark:to-violet-900/10 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                            {p.candidateName.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{p.candidateName}</h2>
                            <div className="text-sm text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">{p.role} · {p.department}</div>
                            <div className="flex items-center gap-2 mt-1.5">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${statusBadge[p.status] || 'bg-slate-100 text-slate-600'}`}>{translateStatus(p.status)}</span>
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${isContractor ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {isContractor ? '🤝 ' + (isPt ? 'Contratado' : 'Contractor') : '🏢 ' + (isPt ? 'Principal' : 'Prime')}
                                </span>
                            </div>
                        </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex flex-col gap-2 shrink-0">
                        {p.status === RecruitmentStatus.AM_REQUESTED && (
                            <button onClick={() => onReceive(p)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg shadow-indigo-500/20">
                                <Inbox size={13} /> {t.hrPortal.candidateDetail.receiveBtn}
                            </button>
                        )}
                        {p.status === RecruitmentStatus.HR_PENDING && (
                            <>
                                <button onClick={() => onApprove(p)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-xl transition-all shadow-lg shadow-emerald-500/20">
                                    <CheckCircle2 size={13} /> {t.hrPortal.candidateDetail.approveBtn}
                                </button>
                                <button onClick={() => onReturn(p)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-black uppercase rounded-xl transition-all">
                                    <X size={13} /> {t.hrPortal.candidateDetail.returnBtn}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6 max-h-[580px] overflow-y-auto">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: Mail, label: 'Email', value: p.candidateEmail },
                        { icon: Phone, label: isPt ? 'Telefone' : 'Phone', value: p.candidatePhone },
                        { icon: Building2, label: isContractor ? (isPt ? 'Empresa Contratada' : 'Contractor Co.') : (isPt ? 'Empresa' : 'Company'), value: p.contractorCompany || p.primeCompany },
                        { icon: Calendar, label: isPt ? 'Solicitado' : 'Requested', value: fmtDate(p.requestedAt) },
                        { icon: Briefcase, label: isPt ? 'Solicitado Por' : 'Requested By', value: p.requestedBy },
                        { icon: Hash, label: isPt ? 'ID de Registo' : 'Record ID', value: p.recordId || '—' },
                    ].map(item => (
                        <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
                            <item.icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <div className="text-[9px] font-black text-slate-400 uppercase">{item.label}</div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Required RACs */}
                <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.hrPortal.candidateDetail.requiredRac}</div>
                    <div className="flex flex-wrap gap-2">
                        {(p.requiredRacs || []).map(rac => (
                            <span key={rac} className="text-[10px] font-black bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                {rac}
                            </span>
                        ))}
                        {(p.requiredRacs || []).length === 0 && <span className="text-xs text-slate-400">{t.hrPortal.candidateDetail.noRacs}</span>}
                    </div>
                </div>

                {/* AM Uploaded documents (read-only for HR to review) */}
                {(p.amDocuments || []).length > 0 && (
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <FileScan size={11} /> {t.hrPortal.candidateDetail.amDocs}
                        </div>
                        <div className="space-y-2">
                            {(p.amDocuments || []).map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <FileCheck size={14} className="text-emerald-600" />
                                        <div>
                                            <div className="text-xs font-black text-slate-800 dark:text-slate-200">{doc.name}</div>
                                            <div className="text-[9px] text-slate-400">{doc.type} · {doc.fileSize} · {timeSince(doc.uploadedAt, isPt)}</div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                        <Check size={9} /> {isPt ? 'Verificado' : doc.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* HR Document Upload section */}
                {isActionable && p.status === RecruitmentStatus.HR_PENDING && (
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <Upload size={11} /> {t.hrPortal.candidateDetail.hrDocs}
                        </div>
                        <div className="space-y-2">
                            {(['ID', 'Passport', 'Work Permit'] as const).map(docType => {
                                const existing = (p.documents || []).find(d => d.type === docType && d.uploadedBy === 'HR');
                                return (
                                    <div key={docType} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-xl">
                                        <div className="flex items-center gap-2">
                                            <FileScan size={14} className={existing ? 'text-emerald-500' : 'text-slate-400'} />
                                            <div>
                                                <div className="text-xs font-black text-slate-700 dark:text-slate-300">{isPt ? (docType === 'ID' ? 'Documento de Identidade' : docType === 'Passport' ? 'Passaporte (Cópia)' : 'Autorização de Trabalho') : docType}</div>
                                                {existing ? (
                                                    <div className="text-[9px] text-emerald-600 font-bold">{existing.name} · {existing.fileSize}</div>
                                                ) : (
                                                    <div className="text-[9px] text-slate-400">{t.hrPortal.candidateDetail.pdfJpg}</div>
                                                )}
                                            </div>
                                        </div>
                                        {existing ? (
                                            <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-black flex items-center gap-1"><Check size={9}/> {isPt ? 'Carregado' : 'Uploaded'}</span>
                                        ) : (
                                            <label className="cursor-pointer">
                                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="sr-only"
                                                    onChange={e => onUpload(p, docType, e)} />
                                                <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase border transition-colors flex items-center gap-1 ${uploading[docType] ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}>
                                                    {uploading[docType] ? <RefreshCw size={9} className="animate-spin"/> : <Upload size={9}/>}
                                                    {uploading[docType] ? (isPt ? 'A carregar...' : 'Uploading...') : (isPt ? 'Carregar' : 'Upload')}
                                                </span>
                                            </label>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Previously uploaded HR docs (history view) */}
                {(p.documents || []).filter(d => d.uploadedBy === 'HR').length > 0 && p.status !== RecruitmentStatus.HR_PENDING && (
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t.hrPortal.candidateDetail.verifiedDocs}</div>
                        <div className="space-y-2">
                            {(p.documents || []).filter(d => d.uploadedBy === 'HR').map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <FileCheck size={14} className="text-indigo-500" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{doc.name}</div>
                                            <div className="text-[9px] text-slate-400">{doc.type} · {doc.fileSize}</div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black">{t.hrPortal.candidateDetail.verifiedByHr}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Contractor info */}
                {isContractor && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
                        <div className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <AlertTriangle size={11} /> {t.hrPortal.candidateDetail.contractorWorkflow}
                        </div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
                            {t.hrPortal.candidateDetail.contractorDesc}
                        </p>
                        {p.contractorCompany && (
                            <div className="mt-2 text-xs font-black text-amber-700">{isPt ? 'Empresa Contratada: ' : 'Contractor Company: '}{p.contractorCompany}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
