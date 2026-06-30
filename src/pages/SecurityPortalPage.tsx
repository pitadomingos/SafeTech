import React, { useState, useEffect } from 'react';
import {
    Shield, BadgeCheck, Clock, CheckCircle2, AlertTriangle,
    Search, Upload, FileText, RefreshCw, Inbox, History,
    Building2, Phone, Mail, Calendar, Briefcase, Hash,
    UserCheck, Users, Lock, Unlock, Camera, ShieldAlert,
    ShieldCheck, ShieldX, Fingerprint, Eye, X, Check,
    FileCheck, FileScan, BarChart3, TrendingUp, Zap, ClipboardList,
    Download, Ban, Coffee, Truck, User
} from 'lucide-react';
import { RecruitmentProcess, RecruitmentStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import FormBuilder from '../components/FormBuilder';
import { generateAccessDocument } from '../utils/pdfGenerator';
import { useToast } from '../contexts/ToastContext';
import { db } from '../services/databaseService';



function timeSince(iso: string, language: 'en' | 'pt') {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) {
        const mins = Math.floor(diff / 60000);
        return language === 'pt' ? `há ${mins}m` : `${mins}m ago`;
    }
    if (h < 24) {
        return language === 'pt' ? `há ${h}h` : `${h}h ago`;
    }
    const days = Math.floor(h / 24);
    return language === 'pt' ? `há ${days}d` : `${days}d ago`;
}
function fmtDate(iso: string, language: 'en' | 'pt') {
    return new Date(iso).toLocaleDateString(language === 'pt' ? 'pt-PT' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

const statusBadge: Record<string, string> = {
    [RecruitmentStatus.AM_REQUESTED]: 'bg-slate-100 text-slate-600',
    [RecruitmentStatus.HR_PENDING]: 'bg-amber-100 text-amber-700',
    [RecruitmentStatus.SECURITY_PENDING]: 'bg-blue-100 text-blue-700',
    [RecruitmentStatus.PARALLEL_CLEARANCE_PENDING]: 'bg-purple-100 text-purple-700',
    [RecruitmentStatus.CLINIC_PENDING]: 'bg-teal-100 text-teal-700',
    [RecruitmentStatus.INDUCTION_PENDING]: 'bg-indigo-100 text-indigo-700',
    [RecruitmentStatus.TRAINING_PENDING]: 'bg-orange-100 text-orange-700',
    [RecruitmentStatus.COMPLETED]: 'bg-emerald-100 text-emerald-700',
};

const BADGE_PREFIXES = ['TEMP', 'SEC', 'PRV', 'SITE', 'MAIN', 'PROC'];

function generateBadgeNo() {
    const prefix = BADGE_PREFIXES[Math.floor(Math.random() * BADGE_PREFIXES.length)];
    const num = Math.floor(1000 + Math.random() * 8999);
    return `${prefix}-ACCESS-${num}`;
}

const zoneTranslations: Record<string, { en: string; pt: string }> = {
    'Main Gate': { en: 'Main Gate', pt: 'Portaria Principal' },
    'Mine Pit': { en: 'Mine Pit', pt: 'Cava da Mina' },
    'Processing Plant': { en: 'Processing Plant', pt: 'Planta de Processamento' },
    'Workshop': { en: 'Workshop', pt: 'Oficina' },
    'Explosives Magazine': { en: 'Explosives Magazine', pt: 'Depósito de Explosivos' },
    'Admin Block': { en: 'Admin Block', pt: 'Bloco Administrativo' },
    'Fuel Depot': { en: 'Fuel Depot', pt: 'Depósito de Combustível' },
    'Canteen': { en: 'Canteen', pt: 'Refeitório' }
};

const getZoneLabel = (zone: string, lang: 'en' | 'pt') => {
    return zoneTranslations[zone]?.[lang] || zone;
};

// ─── Main Component ───────────────────────────────────────────────────────────
export function SecurityPortalPage() {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { showToast, confirm } = useToast();
    const [processes, setProcesses] = useState<RecruitmentProcess[]>([]);
    useEffect(() => {
        db.getRecruitmentProcesses().then(setProcesses).catch(err => console.error('Security: Failed to load processes:', err));
    }, []);
    const [activeTab, setActiveTab] = useState<'queue' | 'cleared' | 'badges' | 'formbuilder'>('queue');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [badgeInput, setBadgeInput] = useState('');
    const [accessNotes, setAccessNotes] = useState('');
    const [accessZones, setAccessZones] = useState<string[]>([]);
    // Temporal access fields
    const [accessStartDate, setAccessStartDate] = useState('');
    const [accessEndDate, setAccessEndDate] = useState('');
    const [canteen, setCanteen] = useState({ breakfast: false, lunch: false, supper: false, lunchPack: false });
    const [accessReason, setAccessReason] = useState('');
    const [denialReason, setDenialReason] = useState('');
    const [candidateIdNumber, setCandidateIdNumber] = useState('');
    const [areaManagerName, setAreaManagerName] = useState('');
    const [areaManagerPhone, setAreaManagerPhone] = useState('');
    const [areaManagerDept, setAreaManagerDept] = useState('');
    const [accessDurationType, setAccessDurationType] = useState<'permanent' | 'temporal'>('temporal');
    const [confirmedImages, setConfirmedImages] = useState({ front: false, right: false, left: false, back: false });

    const translateStatus = (status: RecruitmentStatus) => {
        const statuses = t.proposal?.mobilization?.statuses || {};
        return statuses[status] || status;
    };

    const ALL_ZONES = ['Main Gate', 'Mine Pit', 'Processing Plant', 'Workshop', 'Explosives Magazine', 'Admin Block', 'Fuel Depot', 'Canteen'];

    // Security queue: SECURITY_PENDING, DELIVERED (ready to exit), and PARALLEL_CLEARANCE_PENDING (where security not yet cleared)
    const queue = processes.filter(p =>
        p.status === RecruitmentStatus.SECURITY_PENDING ||
        p.status === RecruitmentStatus.DELIVERED ||
        (p.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING && !p.securityCleared)
    );
    const cleared = processes.filter(p =>
        p.securityCleared ||
        [RecruitmentStatus.INDUCTION_PENDING, RecruitmentStatus.TRAINING_PENDING, RecruitmentStatus.COMPLETED, RecruitmentStatus.DELIVERING, RecruitmentStatus.DELIVERED, RecruitmentStatus.RECEIVED].includes(p.status)
    );
    const allWithBadge = processes.filter(p => p.temporaryBadgeNumber);

    const selected = processes.find(p => p.id === selectedId) || null;

    const filtered = (list: RecruitmentProcess[]) =>
        list.filter(p =>
            !search ||
            p.candidateName.toLowerCase().includes(search.toLowerCase()) ||
            p.role.toLowerCase().includes(search.toLowerCase()) ||
            (p.temporaryBadgeNumber || '').toLowerCase().includes(search.toLowerCase())
        );

    function update(updated: RecruitmentProcess) {
        const list = processes.map(p => p.id === updated.id ? updated : p);
        setProcesses(list);
        db.saveRecruitmentProcess(updated).catch(e => console.error('Security: DB save failed:', e));
    }

    function toast(msg: string) { 
        showToast(msg, 'success');
        setSuccessMsg(msg); 
        setTimeout(() => setSuccessMsg(''), 3000); 
    }

    function resetAccessForm() {
        setBadgeInput('');
        setAccessZones([]);
        setAccessNotes('');
        setAccessStartDate('');
        setAccessEndDate('');
        setCanteen({ breakfast: false, lunch: false, supper: false, lunchPack: false });
        setAccessReason('');
        setDenialReason('');
        setCandidateIdNumber('');
        setAreaManagerName('');
        setAreaManagerPhone('');
        setAreaManagerDept('');
        setAccessDurationType('temporal');
        setConfirmedImages({ front: false, right: false, left: false, back: false });
    }

    useEffect(() => {
        resetAccessForm();
        if (selected) {
            setAccessStartDate(selected.accessStartDate || '');
            setAccessEndDate(selected.accessEndDate || '');
            setCandidateIdNumber(selected.candidateIdNumber || selected.recordId || '');
            setAreaManagerName(selected.areaManagerName || selected.requestedBy || '');
            setAreaManagerPhone(selected.areaManagerPhone || '');
            setAreaManagerDept(selected.areaManagerDepartment || selected.department || '');
            if (selected.canteen) {
                setCanteen(selected.canteen);
            }
            if (selected.accessReason) {
                setAccessReason(selected.accessReason);
            }
            if (selected.requestType === 'EquipmentAccess') {
                if (selected.accessStartDate && selected.accessEndDate) {
                    setAccessDurationType('temporal');
                } else {
                    setAccessDurationType('permanent');
                }
                
                const isCleared = selected.securityCleared || 
                    [RecruitmentStatus.INDUCTION_PENDING, RecruitmentStatus.TRAINING_PENDING, RecruitmentStatus.COMPLETED].includes(selected.status);
                setConfirmedImages({
                    front: isCleared,
                    right: isCleared,
                    left: isCleared,
                    back: isCleared
                });
            }
        }
    }, [selectedId]);

    function issueBadge(p: RecruitmentProcess) {
        if (p.requestType === 'DeliveryAccess') {
            const badge = badgeInput.trim() || generateBadgeNo();
            const docRef = `DOC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
            const updated: RecruitmentProcess = {
                ...p,
                temporaryBadgeNumber: badge,
                securityCleared: true,
                status: RecruitmentStatus.DELIVERING,
                accessDocumentRef: docRef,
                accessStatus: 'granted' as const,
                receivedAt: new Date().toISOString()
            };
            update(updated);
            toast(language === 'pt'
                ? `Entrada do Camião concedida! Matrícula: ${p.truckRegNumber}. Crachá: ${badge}`
                : `Truck Entry Granted! Reg: ${p.truckRegNumber}. Temp Badge: ${badge}`);
            generateAccessDocument(updated, language, user?.companyLogo).catch(err => console.error('PDF generation error:', err));
            resetAccessForm();
            return;
        }

        if (p.requestType === 'EquipmentAccess') {
            if (accessDurationType === 'temporal' && (!accessStartDate || !accessEndDate)) {
                showToast(language === 'pt'
                    ? 'Por favor, insira as datas de início e fim para o acesso temporário.'
                    : 'Please enter start and end dates for temporal access.', 'error');
                return;
            }
            if (!confirmedImages.front || !confirmedImages.right || !confirmedImages.left || !confirmedImages.back) {
                showToast(language === 'pt'
                    ? 'Por favor, confirme a verificação de todas as 4 imagens do equipamento.'
                    : 'Please confirm verification of all 4 equipment images.', 'error');
                return;
            }
        }

        const badge = badgeInput.trim() || generateBadgeNo();
        const docRef = `DOC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;

        const isTemp = p.requestType === 'EquipmentAccess' ? accessDurationType === 'temporal' : true;

        const commonFields = {
            temporaryBadgeNumber: badge,
            securityCleared: true,
            accessDocumentRef: docRef,
            accessStatus: 'granted' as const,
            candidateIdNumber: candidateIdNumber || p.recordId,
            areaManagerName: areaManagerName || p.requestedBy,
            areaManagerPhone,
            areaManagerDepartment: areaManagerDept || p.department,
            accessStartDate: isTemp ? (accessStartDate || new Date().toISOString().split('T')[0]) : undefined,
            accessEndDate: isTemp ? (accessEndDate || undefined) : undefined,
            canteen: p.requestType === 'EquipmentAccess' ? { breakfast: false, lunch: false, supper: false, lunchPack: false } : canteen,
            accessReason,
        };

        const getNextStageAfterClinicOrSecurity = (proc: RecruitmentProcess) => {
            if (proc.requiresInduction !== false) {
                return RecruitmentStatus.INDUCTION_PENDING;
            } else if (proc.requiresRac !== false) {
                return RecruitmentStatus.TRAINING_PENDING;
            } else {
                return RecruitmentStatus.COMPLETED;
            }
        };

        let updated: RecruitmentProcess;

        if (p.requestType === 'PersonnelAccess') {
            updated = { ...p, ...commonFields, status: RecruitmentStatus.COMPLETED };
            update(updated);
            toast(language === 'pt'
                ? `Crachá de Acesso ${badge} emitido para Pessoal. Acesso Concedido!`
                : `Access Badge ${badge} issued for Personnel. Access Granted!`);
        } else if (p.requestType === 'EquipmentAccess') {
            updated = { ...p, ...commonFields, status: RecruitmentStatus.COMPLETED };
            update(updated);
            toast(language === 'pt'
                ? `Etiqueta de Acesso ${badge} emitida para Equipamento. Acesso Concedido!`
                : `Access Tag ${badge} issued for Equipment. Access Granted!`);
        } else if (p.workerType === 'Contractor') {
            const clinicDone = p.clinicFitnessCleared === true || p.requiresMedical === false;
            const nextStatus = clinicDone
                ? getNextStageAfterClinicOrSecurity(p)
                : RecruitmentStatus.PARALLEL_CLEARANCE_PENDING;
            updated = { ...p, ...commonFields, status: nextStatus };
            update(updated);
            toast(language === 'pt'
                ? `Crachá ${badge} emitido. ${clinicDone ? 'Ambos autorizados → Indução!' : 'Aguardando liberação da Clínica.'}`
                : `Badge ${badge} issued. ${clinicDone ? 'Both cleared → Induction!' : 'Waiting for Clinic clearance.'}`);
        } else {
            const nextStatus = p.requiresMedical === false
                ? getNextStageAfterClinicOrSecurity(p)
                : RecruitmentStatus.CLINIC_PENDING;
            updated = { ...p, ...commonFields, status: nextStatus };
            update(updated);
            toast(language === 'pt'
                ? `Crachá ${badge} emitido. Encaminhado para a Clínica.`
                : `Badge ${badge} issued. Forwarded to Clinic.`);
        }

        // Auto-generate PDF document
        generateAccessDocument(updated, language, user?.companyLogo).catch(err => console.error('PDF generation error:', err));
        resetAccessForm();
    }

    function denyAccess(p: RecruitmentProcess) {
        if (!denialReason.trim()) {
            toast(language === 'pt' ? 'Por favor, insira o motivo da recusa.' : 'Please enter a reason for denial.');
            return;
        }
        const docRef = `DOC-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(1000 + Math.random() * 9000)}`;
        const isTemp = p.requestType === 'EquipmentAccess' ? accessDurationType === 'temporal' : true;
        const updated: RecruitmentProcess = {
            ...p,
            accessStatus: 'denied',
            denialReason: denialReason.trim(),
            accessDocumentRef: docRef,
            securityCleared: false,
            status: RecruitmentStatus.FAILED,
            candidateIdNumber: candidateIdNumber || p.recordId,
            areaManagerName: areaManagerName || p.requestedBy,
            areaManagerPhone,
            areaManagerDepartment: areaManagerDept || p.department,
            accessStartDate: isTemp ? (accessStartDate || new Date().toISOString().split('T')[0]) : undefined,
            accessEndDate: isTemp ? (accessEndDate || undefined) : undefined,
            canteen: p.requestType === 'EquipmentAccess' ? { breakfast: false, lunch: false, supper: false, lunchPack: false } : canteen,
            accessReason,
        };
        update(updated);
        toast(language === 'pt'
            ? `Acesso NEGADO para ${p.candidateName}. Documento gerado.`
            : `Access DENIED for ${p.candidateName}. Document generated.`);
        generateAccessDocument(updated, language, user?.companyLogo).catch(err => console.error('PDF generation error:', err));
        resetAccessForm();
    }

    function confirmExitGate(p: RecruitmentProcess) {
        const updated: RecruitmentProcess = {
            ...p,
            status: RecruitmentStatus.RECEIVED,
            receivedAt: new Date().toISOString()
        };
        update(updated);
        toast(language === 'pt'
            ? `Saída do Camião confirmada! Camião ${p.truckRegNumber} deixou o recinto.`
            : `Truck Gate Exit Confirmed! Truck ${p.truckRegNumber} has left the site.`);
        db.addLog('INFO', `DELIVERY_GATE_EXIT: Truck ${p.truckRegNumber} left site`, 'Security Gate');
        resetAccessForm();
    }

    async function revokeBadge(p: RecruitmentProcess) {
        const confirmMsg = language === 'pt'
            ? `Revogar crachá ${p.temporaryBadgeNumber} para ${p.candidateName}?`
            : `Revoke badge ${p.temporaryBadgeNumber} for ${p.candidateName}?`;
        if (!await confirm(language === 'pt' ? 'Revogar Crachá' : 'Revoke Badge', confirmMsg)) return;
        update({ ...p, temporaryBadgeNumber: undefined, securityCleared: false });
        toast(language === 'pt'
            ? `Crachá revogado para ${p.candidateName}.`
            : `Badge revoked for ${p.candidateName}.`);
    }

    const stats = [
        { label: t.securityPortal.stats.awaitingClearance, value: queue.length, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
        { label: t.securityPortal.stats.cleared, value: cleared.length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { label: t.securityPortal.stats.activeBadges, value: allWithBadge.length, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
        { label: t.securityPortal.stats.contractors, value: processes.filter(p => p.workerType === 'Contractor').length, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    ];

    const tabs = [
        { id: 'queue', label: t.securityPortal.tabs.queue, icon: ShieldAlert, count: queue.length },
        { id: 'cleared', label: t.securityPortal.tabs.cleared, icon: ShieldCheck, count: cleared.length },
        { id: 'badges', label: t.securityPortal.tabs.badges, icon: BadgeCheck, count: allWithBadge.length },
        { id: 'formbuilder', label: language === 'pt' ? 'Construtor' : 'Form Builder', icon: ClipboardList, count: undefined },
    ] as const;

    const promptParts = language === 'pt'
        ? ['Selecione um candidato', 'para emitir crachá e gerir o acesso ao site']
        : ['Select a candidate', 'to issue badge and manage site access'];

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield size={20} className="text-white" />
                        </div>
                        {t.securityPortal.title}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-14">
                        {t.securityPortal.subtitle}
                    </p>
                </div>
                <button onClick={() => { db.getRecruitmentProcesses().then(setProcesses); toast(language === 'pt' ? 'Atualizado.' : 'Refreshed.'); }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-blue-400 transition-all">
                    <RefreshCw size={13} /> {language === 'pt' ? 'Atualizar' : 'Refresh'}
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
                        {tab.count !== undefined && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* Form Builder — full-width view */}
            {activeTab === 'formbuilder' ? (
                <FormBuilder tableName="security_clearances" portalType="security" />
            ) : activeTab === 'badges' ? (
                <BadgeRegistryView processes={allWithBadge} onRevoke={revokeBadge} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left list */}
                    <div className="lg:col-span-4 space-y-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 shadow-sm">
                            <Search size={14} className="text-slate-400 shrink-0" />
                            <input type="text" placeholder={t.securityPortal.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
                        </div>

                        <div className="space-y-2">
                            {filtered(activeTab === 'queue' ? queue : cleared).map(p => (
                                <button key={p.id} onClick={() => setSelectedId(p.id)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedId === p.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-200'}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="font-black text-sm text-slate-900 dark:text-white truncate">
                                                {p.requestType === 'EquipmentAccess' ? `${p.equipmentType} (${p.equipmentId})` : p.candidateName}
                                            </div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">
                                                {p.requestType === 'EquipmentAccess' ? `${p.contractorCompany || p.primeCompany}` : `${p.role} · ${p.company}`}
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${statusBadge[p.status] || 'bg-slate-100 text-slate-600'}`}>{translateStatus(p.status)}</span>
                                                {p.requestType && (
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                                        p.requestType === 'PersonnelAccess' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                        p.requestType === 'EquipmentAccess' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                        {p.requestType === 'PersonnelAccess' ? (language === 'pt' ? 'Acesso de Pessoal' : 'Personnel Access') :
                                                         p.requestType === 'EquipmentAccess' ? (language === 'pt' ? 'Acesso de Equipamento' : 'Equipment Access') :
                                                         (language === 'pt' ? 'Recrutamento' : 'Recruitment')}
                                                    </span>
                                                )}
                                                {p.workerType === 'Contractor' && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{language === 'pt' ? 'Contratado' : 'Contractor'}</span>}
                                                {p.securityCleared && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1"><ShieldCheck size={8}/> {language === 'pt' ? 'Aprovado' : 'Cleared'}</span>}
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-slate-400 shrink-0">{timeSince(p.requestedAt, language)}</div>
                                    </div>
                                    {p.temporaryBadgeNumber && (
                                        <div className="mt-2 text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg flex items-center gap-1">
                                            <BadgeCheck size={9} /> {p.temporaryBadgeNumber}
                                        </div>
                                    )}
                                </button>
                            ))}
                            {filtered(activeTab === 'queue' ? queue : cleared).length === 0 && (
                                <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <ShieldCheck size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">{t.securityPortal.noRecords}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right detail */}
                    <div className="lg:col-span-8">
                        {selected ? (
                            <SecurityClearanceDetail
                                process={selected}
                                badgeInput={badgeInput}
                                setBadgeInput={setBadgeInput}
                                accessZones={accessZones}
                                setAccessZones={setAccessZones}
                                accessNotes={accessNotes}
                                setAccessNotes={setAccessNotes}
                                allZones={ALL_ZONES}
                                onIssueBadge={issueBadge}
                                onRevoke={revokeBadge}
                                onDenyAccess={denyAccess}
                                accessStartDate={accessStartDate}
                                setAccessStartDate={setAccessStartDate}
                                accessEndDate={accessEndDate}
                                setAccessEndDate={setAccessEndDate}
                                canteen={canteen}
                                setCanteen={setCanteen}
                                accessReason={accessReason}
                                setAccessReason={setAccessReason}
                                denialReason={denialReason}
                                setDenialReason={setDenialReason}
                                candidateIdNumber={candidateIdNumber}
                                setCandidateIdNumber={setCandidateIdNumber}
                                areaManagerName={areaManagerName}
                                setAreaManagerName={setAreaManagerName}
                                areaManagerPhone={areaManagerPhone}
                                setAreaManagerPhone={setAreaManagerPhone}
                                areaManagerDept={areaManagerDept}
                                setAreaManagerDept={setAreaManagerDept}
                                accessDurationType={accessDurationType}
                                setAccessDurationType={setAccessDurationType}
                                confirmedImages={confirmedImages}
                                setConfirmedImages={setConfirmedImages}
                                onConfirmExitGate={confirmExitGate}
                            />
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-16 text-center text-slate-400 shadow-sm h-full flex flex-col items-center justify-center">
                                <Shield size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold">{promptParts[0]}</p>
                                <p className="text-xs mt-1">{promptParts[1]}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {successMsg && (
                <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50">
                    <ShieldCheck size={18} /><span className="font-black text-sm">{successMsg}</span>
                </div>
            )}
        </div>
    );
}

// ─── Security Clearance Detail ────────────────────────────────────────────────
function SecurityClearanceDetail({
    process: p, badgeInput, setBadgeInput, accessZones, setAccessZones,
    accessNotes, setAccessNotes, allZones, onIssueBadge, onRevoke, onDenyAccess,
    accessStartDate, setAccessStartDate, accessEndDate, setAccessEndDate,
    canteen, setCanteen, accessReason, setAccessReason,
    denialReason, setDenialReason, candidateIdNumber, setCandidateIdNumber,
    areaManagerName, setAreaManagerName, areaManagerPhone, setAreaManagerPhone,
    areaManagerDept, setAreaManagerDept,
    accessDurationType, setAccessDurationType, confirmedImages, setConfirmedImages,
    onConfirmExitGate
}: {
    process: RecruitmentProcess;
    badgeInput: string; setBadgeInput: (v: string) => void;
    accessZones: string[]; setAccessZones: (v: string[]) => void;
    accessNotes: string; setAccessNotes: (v: string) => void;
    allZones: string[];
    onIssueBadge: (p: RecruitmentProcess) => void;
    onRevoke: (p: RecruitmentProcess) => void;
    onDenyAccess: (p: RecruitmentProcess) => void;
    accessStartDate: string; setAccessStartDate: (v: string) => void;
    accessEndDate: string; setAccessEndDate: (v: string) => void;
    canteen: { breakfast: boolean; lunch: boolean; supper: boolean; lunchPack: boolean };
    setCanteen: (v: { breakfast: boolean; lunch: boolean; supper: boolean; lunchPack: boolean }) => void;
    accessReason: string; setAccessReason: (v: string) => void;
    denialReason: string; setDenialReason: (v: string) => void;
    candidateIdNumber: string; setCandidateIdNumber: (v: string) => void;
    areaManagerName: string; setAreaManagerName: (v: string) => void;
    areaManagerPhone: string; setAreaManagerPhone: (v: string) => void;
    areaManagerDept: string; setAreaManagerDept: (v: string) => void;
    accessDurationType: 'permanent' | 'temporal'; setAccessDurationType: (v: 'permanent' | 'temporal') => void;
    confirmedImages: { front: boolean; right: boolean; left: boolean; back: boolean };
    setConfirmedImages: (v: { front: boolean; right: boolean; left: boolean; back: boolean }) => void;
    onConfirmExitGate: (p: RecruitmentProcess) => void;
}) {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const canIssue = p.status === RecruitmentStatus.SECURITY_PENDING ||
        (p.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING && !p.securityCleared);

    const translateStatus = (status: RecruitmentStatus) => {
        const statuses = t.proposal?.mobilization?.statuses || {};
        return statuses[status] || status;
    };

    const labelsMap: Record<string, { en: string; pt: string }> = {
        'Email': { en: 'Email', pt: 'Email' },
        'Phone': { en: 'Phone', pt: 'Telefone' },
        'Company': { en: 'Company', pt: 'Empresa' },
        'Requested': { en: 'Requested', pt: 'Solicitado' },
        'Requested By': { en: 'Requested By', pt: 'Solicitado Por' },
        'Record ID': { en: 'Record ID', pt: 'ID de Registo' },
        'Equipment ID/Tag': { en: 'Equipment ID/Tag', pt: 'ID/Etiqueta do Equipamento' },
        'Equipment Type': { en: 'Equipment Type', pt: 'Tipo de Equipamento' },
        'Contractor Company': { en: 'Contractor Company', pt: 'Empresa Contratada' },
        'Responsible Person': { en: 'Responsible Person', pt: 'Pessoa Responsável' },
        'Responsible Phone': { en: 'Responsible Phone', pt: 'Telefone Responsável' }
    };

    const docTranslations: Record<string, { en: string; pt: string }> = {
        'National ID Document': { en: 'National ID Document', pt: 'Bilhete de Identidade Nacional' },
        'Passport (Copy)': { en: 'Passport (Copy)', pt: 'Passaporte (Cópia)' },
        'Work Permit': { en: 'Work Permit', pt: 'Autorização de Trabalho' }
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                            {p.requestType === 'EquipmentAccess' ? '🚜' : p.candidateName.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                {p.requestType === 'EquipmentAccess' ? (language === 'pt' ? 'Liberação de Equipamento' : 'Equipment Clearance') : p.candidateName}
                            </h2>
                            <div className="text-sm text-blue-600 font-bold mt-0.5">
                                {p.requestType === 'EquipmentAccess' ? `ID: ${p.equipmentId} · ${p.contractorCompany || p.primeCompany}` : `${p.role} · ${p.company}`}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${statusBadge[p.status] || 'bg-slate-100 text-slate-600'}`}>{translateStatus(p.status)}</span>
                                {p.workerType === 'Contractor' && (
                                    <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">🤝 {language === 'pt' ? 'Contratado' : 'Contractor'}</span>
                                )}
                                {p.securityCleared && (
                                    <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1">
                                        <ShieldCheck size={9} /> {language === 'pt' ? 'Segurança Aprovada' : 'Security Cleared'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6 max-h-[580px] overflow-y-auto">
                {/* Info grid */}
                <div className="grid grid-cols-2 gap-3">
                    {p.requestType === 'EquipmentAccess' ? (
                        [
                            { icon: Hash, label: 'Equipment ID/Tag', value: p.equipmentId || '—' },
                            { icon: Shield, label: 'Equipment Type', value: p.equipmentType || '—' },
                            { icon: Building2, label: 'Contractor Company', value: p.contractorCompany || p.primeCompany },
                            { icon: UserCheck, label: 'Responsible Person', value: p.responsiblePersonName || '—' },
                            { icon: Phone, label: 'Responsible Phone', value: p.responsiblePersonPhone || '—' },
                            { icon: Calendar, label: 'Requested', value: fmtDate(p.requestedAt, language) },
                        ].map(item => (
                            <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
                                <item.icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] font-black text-slate-400 uppercase">{labelsMap[item.label]?.[language] || item.label}</div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.value}</div>
                                </div>
                            </div>
                        ))
                    ) : p.requestType === 'DeliveryAccess' ? (
                        [
                            { icon: User, label: language === 'pt' ? 'Motorista' : 'Driver Name', value: p.candidateName },
                            { icon: Phone, label: language === 'pt' ? 'Telefone' : 'Driver Phone', value: p.candidatePhone },
                            { icon: Building2, label: language === 'pt' ? 'Empresa' : 'Company', value: p.contractorCompany || p.primeCompany },
                            { icon: Truck, label: language === 'pt' ? 'Modelo do Camião' : 'Truck Model', value: p.truckModel || '—' },
                            { icon: Hash, label: language === 'pt' ? 'Matrícula' : 'Registration Number', value: p.truckRegNumber || '—' },
                            { icon: FileText, label: language === 'pt' ? 'Ordem de Compra (PO)' : 'PO Number', value: p.poNumber || '—' },
                        ].map(item => (
                            <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
                                <item.icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] font-black text-slate-400 uppercase">{item.label}</div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.value}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        [
                            { icon: Mail, label: 'Email', value: p.candidateEmail },
                            { icon: Phone, label: 'Phone', value: p.candidatePhone },
                            { icon: Building2, label: 'Company', value: p.contractorCompany || p.primeCompany },
                            { icon: Calendar, label: 'Requested', value: fmtDate(p.requestedAt, language) },
                            { icon: Briefcase, label: 'Requested By', value: p.requestedBy },
                            { icon: Hash, label: 'Record ID', value: p.recordId || '—' },
                        ].map(item => (
                            <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
                                <item.icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                    <div className="text-[9px] font-black text-slate-400 uppercase">{labelsMap[item.label]?.[language] || item.label}</div>
                                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.value}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Safety inspection status (equipment only) */}
                {p.requestType === 'EquipmentAccess' && (
                    <div className={`p-4 rounded-2xl border ${p.safetyInspectionCleared ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800' : 'bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800'}`}>
                        <div className="text-[10px] font-black text-slate-400 dark:text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <ShieldCheck size={14} className={p.safetyInspectionCleared ? 'text-emerald-600' : 'text-amber-600'} />
                            {t.securityPortal.clearanceDetail.safetyStatus}
                        </div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {p.safetyInspectionCleared ? (
                                <span>{t.securityPortal.clearanceDetail.passedInspection} <strong>{p.safetyInspectionRecordId || (language === 'pt' ? 'Liberado' : 'Cleared')}</strong></span>
                            ) : (
                                <span>{t.securityPortal.clearanceDetail.pendingInspection}</span>
                            )}
                        </div>
                        {p.safetyInspectionComments && (
                            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                                "{p.safetyInspectionComments}"
                            </div>
                        )}
                    </div>
                )}

                {/* Parallel clearance progress (contractor only) */}
                {p.workerType === 'Contractor' && p.requestType !== 'EquipmentAccess' && p.requestType !== 'PersonnelAccess' && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl">
                        <div className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-3">{t.securityPortal.clearanceDetail.parallelStatus}</div>
                        <div className="flex gap-4">
                            <div className={`flex-1 p-3 rounded-xl border text-center ${p.securityCleared ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                <ShieldCheck size={20} className={`mx-auto mb-1 ${p.securityCleared ? 'text-emerald-600' : 'text-slate-300'}`} />
                                <div className="text-[9px] font-black uppercase">{language === 'pt' ? 'Segurança' : 'Security'}</div>
                                <div className={`text-[10px] font-bold mt-0.5 ${p.securityCleared ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {p.securityCleared ? (language === 'pt' ? 'Aprovado ✓' : 'Cleared ✓') : (language === 'pt' ? 'Pendente' : 'Pending')}
                                </div>
                            </div>
                            <div className={`flex-1 p-3 rounded-xl border text-center ${p.clinicFitnessCleared ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                <Users size={20} className={`mx-auto mb-1 ${p.clinicFitnessCleared ? 'text-emerald-600' : 'text-slate-300'}`} />
                                <div className="text-[9px] font-black uppercase">{language === 'pt' ? 'Clínica' : 'Clinic'}</div>
                                <div className={`text-[10px] font-bold mt-0.5 ${p.clinicFitnessCleared ? 'text-emerald-600' : 'text-slate-400'}`}>
                                    {p.clinicFitnessCleared ? (language === 'pt' ? 'Aprovado ✓' : 'Cleared ✓') : (language === 'pt' ? 'Pendente' : 'Pending')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Current badge */}
                {p.temporaryBadgeNumber && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <BadgeCheck size={24} className="text-blue-600" />
                            <div>
                                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                                    {p.requestType === 'EquipmentAccess' ? t.securityPortal.clearanceDetail.activeTag : t.securityPortal.clearanceDetail.activeBadge}
                                </div>
                                <div className="font-black text-slate-900 dark:text-white text-lg">{p.temporaryBadgeNumber}</div>
                            </div>
                        </div>
                        <button onClick={() => onRevoke(p)}
                            className="flex items-center gap-1.5 text-[9px] font-black text-red-600 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 uppercase transition-all">
                            <ShieldX size={11} /> {t.securityPortal.clearanceDetail.revoke}
                        </button>
                    </div>
                )}

                {/* Equipment Images Verification */}
                {p.requestType === 'EquipmentAccess' && (
                    <div className="space-y-3 p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Camera size={11} /> {language === 'pt' ? 'Verificação de Imagens do Equipamento' : 'Equipment Image Verification'}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            {([
                                { key: 'front' as const, label: language === 'pt' ? 'Vista Frontal' : 'Front View', docType: 'Front View Image', svg: (
                                    <svg className="w-full h-16 text-blue-500 dark:text-blue-400" viewBox="0 0 100 60" fill="currentColor">
                                        <rect x="15" y="42" width="12" height="15" rx="3" fill="#1e293b" />
                                        <rect x="73" y="42" width="12" height="15" rx="3" fill="#1e293b" />
                                        <rect x="22" y="20" width="56" height="26" rx="4" fill="currentColor" opacity="0.8" />
                                        <rect x="27" y="26" width="46" height="16" rx="2" fill="#334155" />
                                        <circle cx="28" cy="34" r="3" fill="#fbbf24" />
                                        <circle cx="72" cy="34" r="3" fill="#fbbf24" />
                                        <rect x="35" y="6" width="30" height="15" rx="3" fill="currentColor" />
                                        <rect x="39" y="9" width="22" height="9" rx="1" fill="#93c5fd" opacity="0.6" />
                                    </svg>
                                )},
                                { key: 'right' as const, label: language === 'pt' ? 'Lateral Direita' : 'Side View (R)', docType: 'Side View (R)', svg: (
                                    <svg className="w-full h-16 text-blue-500 dark:text-blue-400" viewBox="0 0 100 60" fill="currentColor">
                                        <circle cx="25" cy="45" r="9" fill="#1e293b" />
                                        <circle cx="75" cy="45" r="9" fill="#1e293b" />
                                        <circle cx="25" cy="45" r="4" fill="#64748b" />
                                        <circle cx="75" cy="45" r="4" fill="#64748b" />
                                        <rect x="10" y="32" width="80" height="8" rx="2" fill="#334155" />
                                        <path d="M 40 18 L 88 18 L 88 32 L 40 32 Z" fill="currentColor" opacity="0.8" />
                                        <path d="M 15 32 L 15 20 L 28 20 L 38 32 Z" fill="currentColor" />
                                        <polygon points="18,22 26,22 32,30 18,30" fill="#93c5fd" opacity="0.6" />
                                    </svg>
                                )},
                                { key: 'left' as const, label: language === 'pt' ? 'Lateral Esquerda' : 'Side View (L)', docType: 'Side View (L)', svg: (
                                    <svg className="w-full h-16 text-blue-500 dark:text-blue-400" viewBox="0 0 100 60" fill="currentColor">
                                        <circle cx="25" cy="45" r="9" fill="#1e293b" />
                                        <circle cx="75" cy="45" r="9" fill="#1e293b" />
                                        <circle cx="25" cy="45" r="4" fill="#64748b" />
                                        <circle cx="75" cy="45" r="4" fill="#64748b" />
                                        <rect x="10" y="32" width="80" height="8" rx="2" fill="#334155" />
                                        <path d="M 12 18 L 60 18 L 60 32 L 12 32 Z" fill="currentColor" opacity="0.8" />
                                        <path d="M 85 32 L 85 20 L 72 20 L 62 32 Z" fill="currentColor" />
                                        <polygon points="82,22 74,22 68,30 82,30" fill="#93c5fd" opacity="0.6" />
                                    </svg>
                                )},
                                { key: 'back' as const, label: language === 'pt' ? 'Vista Traseira' : 'Back View', docType: 'Back View', svg: (
                                    <svg className="w-full h-16 text-blue-500 dark:text-blue-400" viewBox="0 0 100 60" fill="currentColor">
                                        <rect x="15" y="42" width="14" height="15" rx="3" fill="#1e293b" />
                                        <rect x="71" y="42" width="14" height="15" rx="3" fill="#1e293b" />
                                        <rect x="20" y="16" width="60" height="30" rx="3" fill="currentColor" opacity="0.8" />
                                        <rect x="25" y="22" width="50" height="18" fill="#334155" />
                                        <rect x="24" y="42" width="6" height="2" fill="#ef4444" />
                                        <rect x="70" y="42" width="6" height="2" fill="#ef4444" />
                                    </svg>
                                )}
                            ]).map(item => {
                                const doc = (p.amDocuments || []).find(d => d.type === item.docType);
                                const isConfirmed = confirmedImages[item.key];
                                
                                return (
                                    <div key={item.key} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-slate-700 dark:text-slate-200">{item.label}</span>
                                            <span className={`text-[8px] px-1.5 py-0.5 rounded font-black ${doc ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                                                {doc ? 'AM UPLOADED' : 'NO FILE'}
                                            </span>
                                        </div>
                                        
                                        <div className="bg-slate-100 dark:bg-slate-900/60 rounded-lg p-2 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                            {item.svg}
                                        </div>
                                        
                                        <div className="text-[9px] text-slate-400 truncate">
                                            {doc ? doc.name : '—'}
                                        </div>
                                        
                                        <button
                                            type="button"
                                            disabled={!canIssue}
                                            onClick={() => setConfirmedImages({ ...confirmedImages, [item.key]: !isConfirmed })}
                                            className={`w-full py-1.5 rounded-lg border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${
                                                isConfirmed
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            {isConfirmed ? (
                                                <>
                                                    <CheckCircle2 size={11} className="text-emerald-600" />
                                                    {language === 'pt' ? 'Confirmado' : 'Confirmed'}
                                                </>
                                            ) : (
                                                <>
                                                    <Clock size={11} />
                                                    {language === 'pt' ? 'Confirmar Vista' : 'Confirm View'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Issue Badge / Access Control form */}
                {canIssue && (
                    <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <BadgeCheck size={11} /> {p.requestType === 'EquipmentAccess' ? t.securityPortal.clearanceDetail.issueTagForm : t.securityPortal.clearanceDetail.issueBadgeForm}
                        </div>

                        {/* Badge/Tag Number */}
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                {p.requestType === 'EquipmentAccess' ? t.securityPortal.clearanceDetail.tagLabel : t.securityPortal.clearanceDetail.badgeLabel}
                            </label>
                            <div className="flex gap-2">
                                <input type="text" value={badgeInput} onChange={e => setBadgeInput(e.target.value)}
                                    placeholder={p.requestType === 'EquipmentAccess' ? t.securityPortal.clearanceDetail.tagPlaceholder : t.securityPortal.clearanceDetail.badgePlaceholder}
                                    className="flex-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                                <button type="button" onClick={() => setBadgeInput((p.requestType === 'EquipmentAccess' ? 'TAG-' : 'TEMP-') + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 8999))}
                                    title={language === 'pt' ? 'Gerar automaticamente' : 'Auto-generate'}
                                    className="px-3 py-2 bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-[9px] font-black hover:bg-blue-100 transition-all">
                                    <Zap size={13} />
                                </button>
                            </div>
                        </div>

                        {/* ID Number (for personnel/temporal) */}
                        {p.requestType !== 'EquipmentAccess' && (
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                    {language === 'pt' ? 'Número de Identificação' : 'ID Number'}
                                </label>
                                <input type="text" value={candidateIdNumber} onChange={e => setCandidateIdNumber(e.target.value)}
                                    placeholder={p.recordId || (language === 'pt' ? 'BI / Passaporte' : 'National ID / Passport')}
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                            </div>
                        )}

                        {/* Area Manager & Department */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                    {language === 'pt' ? 'Gestor de Área' : 'Area Manager'}
                                </label>
                                <input type="text" value={areaManagerName} onChange={e => setAreaManagerName(e.target.value)}
                                    placeholder={p.requestedBy || '—'}
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                    {language === 'pt' ? 'Telemóvel Gestor' : 'Manager Cell'}
                                </label>
                                <input type="text" value={areaManagerPhone} onChange={e => setAreaManagerPhone(e.target.value)}
                                    placeholder="+258..."
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                {language === 'pt' ? 'Departamento' : 'Department'}
                            </label>
                            <input type="text" value={areaManagerDept} onChange={e => setAreaManagerDept(e.target.value)}
                                placeholder={p.department || '—'}
                                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all" />
                        </div>

                        {/* Access Duration Type (Permanent / Temporal) - Equipment Access Only */}
                        {p.requestType === 'EquipmentAccess' && (
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block">
                                    {language === 'pt' ? 'Duração do Acesso' : 'Access Duration'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => {
                                        setAccessDurationType('permanent');
                                        setAccessStartDate('');
                                        setAccessEndDate('');
                                    }}
                                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                                            accessDurationType === 'permanent'
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}>
                                        <Unlock size={12} /> {language === 'pt' ? 'Permanente' : 'Permanent'}
                                    </button>
                                    <button type="button" onClick={() => setAccessDurationType('temporal')}
                                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
                                            accessDurationType === 'temporal'
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}>
                                        <Clock size={12} /> {language === 'pt' ? 'Temporário' : 'Temporal'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Access Period (Dates) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                    {language === 'pt' ? 'Data de Início' : 'Start Date'}
                                </label>
                                <input type="date" 
                                    value={accessDurationType === 'permanent' && p.requestType === 'EquipmentAccess' ? '' : accessStartDate} 
                                    onChange={e => setAccessStartDate(e.target.value)}
                                    disabled={accessDurationType === 'permanent' && p.requestType === 'EquipmentAccess'}
                                    title={language === 'pt' ? 'Data de Início' : 'Start Date'}
                                    aria-label={language === 'pt' ? 'Data de Início' : 'Start Date'}
                                    placeholder="yyyy-mm-dd"
                                    className={`w-full p-3 border rounded-xl text-sm font-bold outline-none transition-all ${
                                        accessDurationType === 'permanent' && p.requestType === 'EquipmentAccess'
                                            ? 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:border-blue-400'
                                    }`} />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                    {language === 'pt' ? 'Data de Fim' : 'End Date'}
                                </label>
                                <input type="date" 
                                    value={accessDurationType === 'permanent' && p.requestType === 'EquipmentAccess' ? '' : accessEndDate} 
                                    onChange={e => setAccessEndDate(e.target.value)}
                                    disabled={accessDurationType === 'permanent' && p.requestType === 'EquipmentAccess'}
                                    title={language === 'pt' ? 'Data de Fim' : 'End Date'}
                                    aria-label={language === 'pt' ? 'Data de Fim' : 'End Date'}
                                    placeholder="yyyy-mm-dd"
                                    className={`w-full p-3 border rounded-xl text-sm font-bold outline-none transition-all ${
                                        accessDurationType === 'permanent' && p.requestType === 'EquipmentAccess'
                                            ? 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:border-blue-400'
                                    }`} />
                            </div>
                        </div>
                        {accessDurationType === 'permanent' && p.requestType === 'EquipmentAccess' ? (
                            <div className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                <Unlock size={10} />
                                {language === 'pt' ? 'Acesso Total Sem Expiração' : 'Full Access (No Expiration)'}
                            </div>
                        ) : (
                            accessStartDate && accessEndDate && (
                                <div className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg flex items-center gap-1">
                                    <Calendar size={10} />
                                    {Math.max(1, Math.ceil((new Date(accessEndDate).getTime() - new Date(accessStartDate).getTime()) / 86400000))} {language === 'pt' ? 'dias' : 'days'}
                                </div>
                            )
                        )}

                        {/* Canteen Options */}
                        {p.requestType !== 'EquipmentAccess' && p.requestType !== 'DeliveryAccess' && (
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block flex items-center gap-1">
                                    <Coffee size={10} /> {language === 'pt' ? 'Refeitório' : 'Canteen'}
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {([
                                        { key: 'breakfast' as const, label: language === 'pt' ? 'Pequeno-Almoço' : 'Breakfast' },
                                        { key: 'lunch' as const, label: language === 'pt' ? 'Almoço' : 'Lunch' },
                                        { key: 'supper' as const, label: language === 'pt' ? 'Jantar' : 'Supper / Dinner' },
                                        { key: 'lunchPack' as const, label: language === 'pt' ? 'Marmita' : 'Lunch Pack' },
                                    ]).map(item => (
                                        <button key={item.key} type="button"
                                            onClick={() => setCanteen({ ...canteen, [item.key]: !canteen[item.key] })}
                                            className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                                canteen[item.key]
                                                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-500'
                                            }`}>
                                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center text-white text-[8px] ${
                                                canteen[item.key] ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                                            }`}>
                                                {canteen[item.key] && <Check size={10} />}
                                            </div>
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Physical Document Verification for Delivery */}
                        {p.requestType === 'DeliveryAccess' && (
                            <div className="p-4 bg-blue-50 dark:bg-slate-900/40 border border-blue-200 dark:border-slate-700 rounded-xl space-y-2">
                                <label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest block">Physical Document Check</label>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        required
                                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                                    />
                                    Confirm Physical Driver's License Checked
                                </label>
                                <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        required
                                        className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                                    />
                                    Confirm Physical Passport Checked
                                </label>
                            </div>
                        )}

                        {/* Reason of Access */}
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                {language === 'pt' ? 'Motivo do Acesso' : 'Reason of Access'}
                            </label>
                            <textarea rows={2} value={accessReason} onChange={e => setAccessReason(e.target.value)}
                                placeholder={language === 'pt' ? 'Descreva o motivo do acesso...' : 'Describe the reason for access...'}
                                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all resize-none" />
                        </div>

                        {/* Security Notes */}
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.securityPortal.clearanceDetail.securityNotes}</label>
                            <textarea rows={2} value={accessNotes} onChange={e => setAccessNotes(e.target.value)}
                                placeholder={t.securityPortal.clearanceDetail.notesPlaceholder}
                                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-blue-400 transition-all resize-none" />
                        </div>

                        {/* ── GRANT ACCESS Button ── */}
                        <button onClick={() => onIssueBadge(p)}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-emerald-500/20">
                            <BadgeCheck size={16} /> {p.requestType === 'EquipmentAccess'
                                ? t.securityPortal.clearanceDetail.issueButtonTag
                                : p.requestType === 'DeliveryAccess'
                                ? (language === 'pt' ? '✓ CONCEDER ENTRADA DE ENTREGA' : '✓ GRANT DELIVERY TRUCK ENTRY')
                                : (language === 'pt' ? '✓ CONCEDER ACESSO & GERAR DOCUMENTO' : '✓ GRANT ACCESS & GENERATE DOCUMENT')}
                        </button>

                        {/* ── DENY ACCESS Section ── */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-3">
                            <div className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5">
                                <Ban size={11} /> {language === 'pt' ? 'Negar Acesso' : 'Deny Access'}
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-red-400 uppercase mb-1 block">
                                    {language === 'pt' ? 'Motivo da Recusa *' : 'Reason for Denial *'}
                                </label>
                                <textarea rows={2} value={denialReason} onChange={e => setDenialReason(e.target.value)}
                                    placeholder={language === 'pt' ? 'Motivo obrigatório para recusa de acesso...' : 'Required reason for access denial...'}
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-xl text-sm font-bold outline-none focus:border-red-400 transition-all resize-none" />
                            </div>
                            <button onClick={() => onDenyAccess(p)}
                                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-red-500/20">
                                <ShieldX size={16} /> {language === 'pt' ? '✗ NEGAR ACESSO & GERAR DOCUMENTO' : '✗ DENY ACCESS & GENERATE DOCUMENT'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Confirm Gate Exit for Delivery */}
                {p.requestType === 'DeliveryAccess' && p.status === RecruitmentStatus.DELIVERED && (
                    <div className="space-y-4 p-5 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40">
                        <div className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                            <ShieldAlert size={14} className="text-amber-500" /> Confirm Vehicle Exit Gate Clearance
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal font-bold">
                            The Area Manager has confirmed the delivery is finished. Please verify the vehicle and driver, and log their exit from the site.
                        </p>
                        <button onClick={() => onConfirmExitGate(p)}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-amber-500/20 active:scale-95">
                            <Unlock size={16} /> Confirm Gate Exit
                        </button>
                    </div>
                )}

                {/* Download existing document */}
                {p.accessDocumentRef && (
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
                        <button onClick={() => generateAccessDocument(p, language, user?.companyLogo).catch(err => console.error('PDF error:', err))}
                            className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-black text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-xl transition-all">
                            <Download size={14} /> {language === 'pt' ? 'Baixar Documento de Acesso' : 'Download Access Document'} ({p.accessDocumentRef})
                        </button>
                    </div>
                )}

                {/* Documents from HR */}
                {((p.documents || []).length > 0 || (p.amDocuments || []).length > 0) && (
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{language === 'pt' ? 'Documentos Verificados' : 'Verified Documents'}</div>
                        <div className="space-y-2">
                            {[...(p.amDocuments || []), ...(p.documents || [])].map((doc, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-2">
                                        <FileCheck size={14} className="text-indigo-500" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{docTranslations[doc.name]?.[language] || doc.name}</div>
                                            <div className="text-[9px] text-slate-400">{doc.type} · {doc.fileSize}</div>
                                        </div>
                                    </div>
                                    <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black">
                                        {doc.status === 'Verified' ? (language === 'pt' ? 'Verificado' : 'Verified') : doc.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Badge Registry View ──────────────────────────────────────────────────────
function BadgeRegistryView({ processes, onRevoke }: { processes: RecruitmentProcess[], onRevoke: (p: RecruitmentProcess) => void }) {
    const { t, language } = useLanguage();
    const [search, setSearch] = useState('');
    const filtered = processes.filter(p =>
        !search ||
        (p.candidateName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.temporaryBadgeNumber || '').toLowerCase().includes(search.toLowerCase())
    );

    const translateStatus = (status: RecruitmentStatus) => {
        const statuses = t.proposal?.mobilization?.statuses || {};
        return statuses[status] || status;
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/10 dark:to-cyan-900/10 flex items-center justify-between gap-4">
                <div className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2"><BadgeCheck size={16} className="text-blue-600" /> {t.securityPortal.registry.title}</div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
                    <Search size={13} className="text-slate-400" />
                    <input type="text" placeholder={t.common.search} value={search} onChange={e => setSearch(e.target.value)}
                        className="bg-transparent text-xs font-bold outline-none w-40 text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.securityPortal.registry.headers.nameId}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.securityPortal.registry.headers.company}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.securityPortal.registry.headers.roleType}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.securityPortal.registry.headers.badgeTag}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.securityPortal.registry.headers.type}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.securityPortal.registry.headers.status}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => (
                            <tr key={p.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="px-5 py-3.5 font-black text-slate-900 dark:text-white whitespace-nowrap">
                                    {p.requestType === 'EquipmentAccess' ? `${p.equipmentType} (${p.equipmentId})` : p.candidateName}
                                </td>
                                <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{p.contractorCompany || p.primeCompany}</td>
                                <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                                    {p.requestType === 'EquipmentAccess' ? (language === 'pt' ? 'Equipamento' : 'Equipment') : p.role}
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className="font-black text-blue-700 dark:text-blue-400 text-xs bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg">{p.temporaryBadgeNumber}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                        p.requestType === 'PersonnelAccess' ? 'bg-indigo-100 text-indigo-700' :
                                        p.requestType === 'EquipmentAccess' ? 'bg-amber-100 text-amber-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>{p.requestType ? (
                                        p.requestType === 'PersonnelAccess' ? (language === 'pt' ? 'Acesso de Pessoal' : 'Personnel Access') :
                                        p.requestType === 'EquipmentAccess' ? (language === 'pt' ? 'Acesso de Equipamento' : 'Equipment Access') :
                                        (language === 'pt' ? 'Recrutamento' : 'Recruitment')
                                    ) : (language === 'pt' ? 'Recrutamento' : 'Recruitment')}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${statusBadge[p.status] || 'bg-slate-100 text-slate-600'}`}>{translateStatus(p.status)}</span>
                                </td>
                                <td className="px-5 py-3.5">
                                    <button onClick={() => onRevoke(p)}
                                        className="text-[9px] font-black text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition-all">{t.securityPortal.registry.revokeBtn}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                        <BadgeCheck size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">{t.securityPortal.registry.noBadges}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
