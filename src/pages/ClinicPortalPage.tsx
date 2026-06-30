import React, { useState, useEffect } from 'react';
import {
    Heart, Activity, Eye, CheckCircle2, AlertTriangle, X,
    Search, RefreshCw, Inbox, History, FileText,
    Building2, Phone, Mail, Calendar, Briefcase, Hash,
    Stethoscope, ClipboardList, FileCheck, FileScan, Upload,
    Pill, ShieldCheck, Users, Check, BarChart3,
    Thermometer, Brain, Bone, Ear, Weight, Star,
    Download, Printer, Award, TrendingUp, BadgeCheck, Zap
} from 'lucide-react';
import { RecruitmentProcess, RecruitmentStatus, MedicalExam, FitnessCertificate } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '../contexts/LanguageContext';
import FormBuilder from '../components/FormBuilder';
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
function addMonths(iso: string, months: number) {
    const d = new Date(iso);
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
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

// ─── Blank exam state factory ─────────────────────────────────────────────────
function blankExam(): MedicalExam {
    return { bloodPressure: '', heartRate: 0, visionTest: 'Pass', drugScreen: 'Negative', fitForWork: true, comments: '' };
}
function blankCert(examinerName: string): Omit<FitnessCertificate, 'certificateNo' | 'issuedAt' | 'validUntil'> {
    return {
        examinationType: 'Pre-Employment',
        bloodPressure: '',
        heartRate: 0,
        visionTest: 'Pass',
        drugScreen: 'Negative',
        bmi: '',
        hearing: 'Normal',
        musculoskeletal: 'Normal',
        fitForWork: true,
        restrictions: '',
        comments: '',
        issuedBy: examinerName || 'Dr. Clinical Team',
    };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ClinicPortalPage() {
    const { t, language } = useLanguage();
    const [processes, setProcesses] = useState<RecruitmentProcess[]>([]);
    useEffect(() => {
        db.getRecruitmentProcesses().then(setProcesses).catch(err => console.error('Clinic: Failed to load processes:', err));
    }, []);
    const [activeTab, setActiveTab] = useState<'queue' | 'certificates' | 'history' | 'formbuilder'>('queue');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [examinerName, setExaminerName] = useState('Dr. Site Clinic');

    const translateStatus = (status: RecruitmentStatus) => {
        const statuses = t.proposal?.mobilization?.statuses || {};
        return statuses[status] || status;
    };

    // Clinic queue: candidates waiting for medical examination
    const queue = processes.filter(p =>
        (p.requestType === 'Recruitment' || !p.requestType) &&
        (p.status === RecruitmentStatus.CLINIC_PENDING ||
        (p.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING && !p.clinicFitnessCleared))
    );
    const certified = processes.filter(p => (p.requestType === 'Recruitment' || !p.requestType) && p.fitnessCertificate);
    const history = processes.filter(p => (p.requestType === 'Recruitment' || !p.requestType) && (p.clinicFitnessCleared || p.medicalExam));
    const selected = processes.find(p => p.id === selectedId) || null;

    const filtered = (list: RecruitmentProcess[]) =>
        list.filter(p =>
            !search ||
            p.candidateName.toLowerCase().includes(search.toLowerCase()) ||
            p.role.toLowerCase().includes(search.toLowerCase()) ||
            (p.fitnessCertificate?.certificateNo || '').toLowerCase().includes(search.toLowerCase())
        );

    function update(updated: RecruitmentProcess) {
        const list = processes.map(p => p.id === updated.id ? updated : p);
        setProcesses(list);
        db.saveRecruitmentProcess(updated).catch(e => console.error('Clinic: DB save failed:', e));
    }

    function toast(msg: string) { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); }

    const stats = [
        { label: t.clinicPortal.stats.awaitingExam, value: queue.length, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-200' },
        { label: t.clinicPortal.stats.certIssued, value: certified.length, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
        { label: t.clinicPortal.stats.contractorsParallel, value: processes.filter(p => (p.requestType === 'Recruitment' || !p.requestType) && p.workerType === 'Contractor' && !p.clinicFitnessCleared && (p.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING)).length, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
        { label: t.clinicPortal.stats.totalExamined, value: history.length, color: 'text-slate-700', bg: 'bg-slate-50', border: 'border-slate-200' },
    ];

    const tabs = [
        { id: 'queue', label: t.clinicPortal.tabs.queue, icon: Stethoscope, count: queue.length },
        { id: 'certificates', label: t.clinicPortal.tabs.certificates, icon: Award, count: certified.length },
        { id: 'history', label: t.clinicPortal.tabs.history, icon: History, count: history.length },
        { id: 'formbuilder', label: language === 'pt' ? 'Construtor' : 'Form Builder', icon: ClipboardList, count: undefined },
    ] as const;

    const promptParts = language === 'pt'
        ? ['Selecione um candidato', 'para iniciar o exame médico']
        : ['Select a candidate', 'to begin medical examination'];

    return (
        <div className="p-6 max-w-[1600px] mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Stethoscope size={20} className="text-white" />
                        </div>
                        {t.clinicPortal.title}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 ml-14">
                        {t.clinicPortal.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 shadow-sm">
                        <Stethoscope size={13} className="text-teal-500" />
                        <input type="text" value={examinerName} onChange={e => setExaminerName(e.target.value)}
                            placeholder={language === 'pt' ? 'Nome do examinador' : 'Examiner name'}
                            className="text-xs font-black bg-transparent outline-none text-slate-700 dark:text-slate-300 w-40" />
                    </div>
                    <button onClick={() => { db.getRecruitmentProcesses().then(setProcesses); toast(language === 'pt' ? 'Atualizado.' : 'Refreshed.'); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-teal-400 transition-all">
                        <RefreshCw size={13} /> {language === 'pt' ? 'Atualizar' : 'Refresh'}
                    </button>
                </div>
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
                        {tab.count !== undefined && <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === tab.id ? 'bg-teal-100 text-teal-700' : 'bg-slate-200 text-slate-500'}`}>{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* Form Builder — full-width view */}
            {activeTab === 'formbuilder' ? (
                <FormBuilder tableName="clinic_examinations" portalType="clinic" />
            ) : activeTab === 'certificates' ? (
                <CertificateRegistryView processes={certified} />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left list */}
                    <div className="lg:col-span-4 space-y-3">
                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 shadow-sm">
                            <Search size={14} className="text-slate-400 shrink-0" />
                            <input type="text" placeholder={t.clinicPortal.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full bg-transparent text-sm font-bold outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400" />
                        </div>

                        <div className="space-y-2">
                            {filtered(activeTab === 'queue' ? queue : history).map(p => (
                                <button key={p.id} onClick={() => setSelectedId(p.id)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedId === p.id ? 'bg-teal-50 dark:bg-teal-900/20 border-teal-300 dark:border-teal-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-teal-200'}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="font-black text-sm text-slate-900 dark:text-white truncate">{p.candidateName}</div>
                                            <div className="text-[10px] text-slate-500 mt-0.5">{p.role} · {p.department}</div>
                                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${statusBadge[p.status] || 'bg-slate-100 text-slate-600'}`}>{translateStatus(p.status)}</span>
                                                {p.workerType === 'Contractor' && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{language === 'pt' ? 'Contratado' : 'Contractor'}</span>}
                                                {p.clinicFitnessCleared && <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check size={8}/> {language === 'pt' ? 'Aprovado' : 'Cleared'}</span>}
                                            </div>
                                        </div>
                                        <div className="text-[9px] text-slate-400 shrink-0">{timeSince(p.requestedAt, language)}</div>
                                    </div>
                                    {p.fitnessCertificate && (
                                        <div className="mt-2 text-[9px] font-black text-teal-600 bg-teal-50 dark:bg-teal-900/20 px-2 py-1 rounded-lg flex items-center gap-1">
                                            <Award size={9} /> {p.fitnessCertificate.certificateNo}
                                        </div>
                                    )}
                                </button>
                            ))}
                            {filtered(activeTab === 'queue' ? queue : history).length === 0 && (
                                <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <Stethoscope size={32} className="mx-auto mb-2 opacity-20" />
                                    <p className="text-xs">{t.clinicPortal.noRecords}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right detail */}
                    <div className="lg:col-span-8">
                        {selected ? (
                            <ClinicExaminationDetail
                                process={selected}
                                examinerName={examinerName}
                                onUpdate={update}
                                onToast={toast}
                            />
                        ) : (
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-16 text-center text-slate-400 shadow-sm h-full flex flex-col items-center justify-center">
                                <Stethoscope size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold">{promptParts[0]}</p>
                                <p className="text-xs mt-1">{promptParts[1]}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {successMsg && (
                <div className="fixed bottom-6 right-6 bg-teal-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-50">
                    <CheckCircle2 size={18} /><span className="font-black text-sm">{successMsg}</span>
                </div>
            )}
        </div>
    );
}

// ─── Examination Detail Panel ─────────────────────────────────────────────────
function ClinicExaminationDetail({ process: p, examinerName, onUpdate, onToast }: {
    process: RecruitmentProcess;
    examinerName: string;
    onUpdate: (p: RecruitmentProcess) => void;
    onToast: (msg: string) => void;
}) {
    const { t, language } = useLanguage();
    const isContractor = p.workerType === 'Contractor';
    const canExamine = p.status === RecruitmentStatus.CLINIC_PENDING ||
        (p.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING && !p.clinicFitnessCleared);

    const translateStatus = (status: RecruitmentStatus) => {
        const statuses = t.proposal?.mobilization?.statuses || {};
        return statuses[status] || status;
    };

    const labelsMap: Record<string, { en: string; pt: string }> = {
        'Email': { en: 'Email', pt: 'Email' },
        'Phone': { en: 'Phone', pt: 'Telefone' },
        'Company': { en: 'Company', pt: 'Empresa' },
        'Record ID': { en: 'Record ID', pt: 'ID de Registo' }
    };

    // Local form state (medical exam fields)
    const [form, setForm] = useState<MedicalExam>(p.medicalExam || blankExam());
    const [certForm, setCertForm] = useState(blankCert(examinerName));
    const [certMonths, setCertMonths] = useState(12);
    const [activeSection, setActiveSection] = useState<'exam' | 'cert'>('exam');

    function field(k: keyof MedicalExam) {
        return (val: unknown) => setForm(f => ({ ...f, [k]: val }));
    }

    function saveExam() {
        onUpdate({ ...p, medicalExam: { ...form, checkedAt: new Date().toISOString() } });
        onToast(language === 'pt' ? 'Dados do exame médico gravados.' : 'Medical examination data saved.');
    }

    function issueCertificate() {
        const now = new Date().toISOString();
        const cert: FitnessCertificate = {
            certificateNo: `FC-${p.recordId || uuidv4().slice(0, 6).toUpperCase()}-${new Date().getFullYear()}`,
            issuedAt: now,
            validUntil: addMonths(now, certMonths),
            issuedBy: examinerName,
            examinationType: certForm.examinationType,
            bloodPressure: certForm.bloodPressure || form.bloodPressure,
            heartRate: certForm.heartRate || form.heartRate,
            visionTest: certForm.visionTest,
            drugScreen: certForm.drugScreen,
            bmi: certForm.bmi,
            hearing: certForm.hearing,
            musculoskeletal: certForm.musculoskeletal,
            fitForWork: certForm.fitForWork,
            restrictions: certForm.restrictions,
            comments: certForm.comments,
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

        const securityDone = p.securityCleared === true;
        let nextStatus: RecruitmentStatus;
        if (isContractor) {
            nextStatus = securityDone ? getNextStageAfterClinicOrSecurity(p) : RecruitmentStatus.PARALLEL_CLEARANCE_PENDING;
        } else {
            nextStatus = getNextStageAfterClinicOrSecurity(p);
        }

        onUpdate({ ...p, fitnessCertificate: cert, clinicFitnessCleared: true, medicalExam: { ...form, checkedAt: now }, status: nextStatus });
        onToast(language === 'pt'
            ? `Certificado ${cert.certificateNo} emitido.${isContractor && !securityDone ? ' Aguardando liberação da Segurança.' : ''}`
            : `Certificate ${cert.certificateNo} issued.${isContractor && !securityDone ? ' Waiting for Security clearance.' : ''}`);
    }

    const FitToggle = ({ label, value, onChange, options }: { label: string; value: string | boolean; onChange: (v: unknown) => void; options: [unknown, string][] }) => (
        <div>
            <div className="text-[9px] font-black text-slate-400 uppercase mb-1">{label}</div>
            <div className="flex gap-1.5">
                {options.map(([val, text]) => (
                    <button key={text} type="button"
                        onClick={() => onChange(val)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black border transition-all ${JSON.stringify(value) === JSON.stringify(val)
                            ? (val === 'Negative' || val === true || val === 'Pass' || val === 'Normal' || val === 'Pre-Employment' || val === 'Periodic' || val === 'Return-to-Work')
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-red-600 text-white border-red-600'
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600'}`}
                    >{text}</button>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                            {p.candidateName.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{p.candidateName}</h2>
                            <div className="text-sm text-teal-600 font-bold mt-0.5">{p.role} · {p.company}</div>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${statusBadge[p.status] || 'bg-slate-100 text-slate-600'}`}>{translateStatus(p.status)}</span>
                                {isContractor && <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">🤝 {language === 'pt' ? 'Contratado' : 'Contractor'}</span>}
                                {p.clinicFitnessCleared && <span className="text-[9px] font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-1"><Check size={9}/> {language === 'pt' ? 'Aptidão Aprovada' : 'Fitness Cleared'}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section switcher */}
                {canExamine && (
                    <div className="flex gap-1 mt-4 p-1 bg-white/60 dark:bg-slate-800/60 rounded-xl w-fit">
                        {(['exam', 'cert'] as const).map(id => (
                            <button key={id} onClick={() => setActiveSection(id)}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${activeSection === id ? 'bg-teal-600 text-white shadow' : 'text-slate-500 hover:text-slate-700'}`}>
                                {id === 'exam' ? `🩺 ${language === 'pt' ? 'Exame Médico' : 'Medical Exam'}` : `📋 ${language === 'pt' ? 'Emitir Certificado' : 'Issue Certificate'}`}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-6 space-y-6 max-h-[580px] overflow-y-auto">
                {/* Parallel status (contractor) */}
                {isContractor && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl">
                        <div className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-3">{language === 'pt' ? 'Estado de Liberação Paralela' : 'Parallel Clearance Status'}</div>
                        <div className="flex gap-4">
                            <div className={`flex-1 p-3 rounded-xl border text-center ${p.securityCleared ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                <ShieldCheck size={20} className={`mx-auto mb-1 ${p.securityCleared ? 'text-emerald-600' : 'text-slate-300'}`} />
                                <div className="text-[9px] font-black uppercase">{language === 'pt' ? 'Segurança' : 'Security'}</div>
                                <div className={`text-[10px] font-bold mt-0.5 ${p.securityCleared ? 'text-emerald-600' : 'text-slate-400'}`}>{p.securityCleared ? (language === 'pt' ? 'Aprovado ✓' : 'Cleared ✓') : (language === 'pt' ? 'Pendente' : 'Pending')}</div>
                            </div>
                            <div className={`flex-1 p-3 rounded-xl border text-center ${p.clinicFitnessCleared ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                                <Stethoscope size={20} className={`mx-auto mb-1 ${p.clinicFitnessCleared ? 'text-emerald-600' : 'text-slate-300'}`} />
                                <div className="text-[9px] font-black uppercase">{language === 'pt' ? 'Clínica' : 'Clinic'}</div>
                                <div className={`text-[10px] font-bold mt-0.5 ${p.clinicFitnessCleared ? 'text-emerald-600' : 'text-slate-400'}`}>{p.clinicFitnessCleared ? (language === 'pt' ? 'Aprovado ✓' : 'Cleared ✓') : (language === 'pt' ? 'Pendente' : 'Pending')}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Existing certificate display */}
                {p.fitnessCertificate && (
                    <FitnessCertDisplay cert={p.fitnessCertificate} name={p.candidateName} />
                )}

                {/* MEDICAL EXAM FORM */}
                {canExamine && activeSection === 'exam' && (
                    <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Stethoscope size={11} /> {t.clinicPortal.forms.examTitle}
                        </div>

                        {/* Vitals */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.forms.bp}</label>
                                <input type="text" placeholder="e.g. 120/80" value={form.bloodPressure}
                                    onChange={e => field('bloodPressure')(e.target.value)}
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.forms.hr}</label>
                                <input type="number" placeholder="72" value={form.heartRate || ''}
                                    onChange={e => field('heartRate')(+e.target.value)}
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <FitToggle label={t.clinicPortal.forms.vision} value={form.visionTest} onChange={field('visionTest')} options={[['Pass', language === 'pt' ? 'Aprovado' : 'Pass'], ['Fail', language === 'pt' ? 'Reprovado' : 'Fail']]} />
                            <FitToggle label={t.clinicPortal.forms.drug} value={form.drugScreen} onChange={field('drugScreen')} options={[['Negative', language === 'pt' ? 'Negativo' : 'Negative'], ['Positive', language === 'pt' ? 'Positivo' : 'Positive']]} />
                        </div>

                        {isContractor && (
                            <>
                                <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-4">
                                    <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                        <BadgeCheck size={11} /> {t.clinicPortal.forms.extendedContractor}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <FitToggle label={t.clinicPortal.forms.hearing} value={form.hearing || 'Normal'} onChange={field('hearing')} options={[['Normal', language === 'pt' ? 'Normal' : 'Normal'], ['Impaired', language === 'pt' ? 'Deficiente' : 'Impaired']]} />
                                        <FitToggle label={t.clinicPortal.forms.musculoskeletal} value={form.musculoskeletal || 'Normal'} onChange={field('musculoskeletal')} options={[['Normal', language === 'pt' ? 'Normal' : 'Normal'], ['Impaired', language === 'pt' ? 'Deficiente' : 'Impaired']]} />
                                    </div>
                                </div>
                            </>
                        )}

                        <FitToggle label={t.clinicPortal.forms.fitForWork} value={form.fitForWork} onChange={field('fitForWork')} options={[[true, t.clinicPortal.forms.fit], [false, t.clinicPortal.forms.unfit]]} />

                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.forms.clinicalNotes}</label>
                            <textarea rows={3} value={form.comments} onChange={e => field('comments')(e.target.value)}
                                placeholder="Clinical observations, follow-ups..."
                                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all resize-none" />
                        </div>

                        <button onClick={saveExam}
                            className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/20">
                            <ClipboardList size={15} /> {t.clinicPortal.forms.saveExam}
                        </button>
                    </div>
                )}

                {/* CERTIFICATE ISSUE FORM */}
                {canExamine && activeSection === 'cert' && (
                    <div className="space-y-4 p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Award size={11} /> {t.clinicPortal.certificate.generateTitle}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.certificate.examType}</label>
                                <select value={certForm.examinationType}
                                    aria-label={t.clinicPortal.certificate.examType}
                                    onChange={e => setCertForm(f => ({ ...f, examinationType: e.target.value as FitnessCertificate['examinationType'] }))}
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all">
                                    <option value="Pre-Employment">{language === 'pt' ? 'Admissional' : 'Pre-Employment'}</option>
                                    <option value="Periodic">{language === 'pt' ? 'Periódico' : 'Periodic'}</option>
                                    <option value="Return-to-Work">{language === 'pt' ? 'Retorno ao Trabalho' : 'Return-to-Work'}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.certificate.validFor}</label>
                                <select value={certMonths} onChange={e => setCertMonths(+e.target.value)}
                                    aria-label={t.clinicPortal.certificate.validFor}
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all">
                                    {[6, 12, 18, 24].map(m => <option key={m} value={m}>{m} {language === 'pt' ? 'meses' : 'months'}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.forms.bp.split(' ')[0]}</label>
                                <input type="text" placeholder={form.bloodPressure || 'e.g. 120/80'} value={certForm.bloodPressure}
                                    onChange={e => setCertForm(f => ({ ...f, bloodPressure: e.target.value }))}
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all" />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.forms.hr.split(' ')[0]}</label>
                                <input type="number" placeholder={String(form.heartRate || 72)} value={certForm.heartRate || ''}
                                    onChange={e => setCertForm(f => ({ ...f, heartRate: +e.target.value }))}
                                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all" />
                            </div>
                        </div>

                        {isContractor && (
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.certificate.bmi}</label>
                                    <input type="text" placeholder="e.g. 22.5" value={certForm.bmi || ''}
                                        onChange={e => setCertForm(f => ({ ...f, bmi: e.target.value }))}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all" />
                                </div>
                                <div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.certificate.restrictions}</label>
                                    <input type="text" placeholder="e.g. No night shift" value={certForm.restrictions || ''}
                                        onChange={e => setCertForm(f => ({ ...f, restrictions: e.target.value }))}
                                        className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all" />
                                </div>
                            </div>
                        )}

                        <FitToggle label={t.clinicPortal.certificate.decision} value={certForm.fitForWork} onChange={(v) => setCertForm(f => ({ ...f, fitForWork: v as boolean }))} options={[[true, t.clinicPortal.certificate.fitForWork], [false, t.clinicPortal.certificate.unfit]]} />

                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{t.clinicPortal.certificate.comments}</label>
                            <textarea rows={2} value={certForm.comments || ''}
                                onChange={e => setCertForm(f => ({ ...f, comments: e.target.value }))}
                                placeholder={t.clinicPortal.certificate.commentsPlaceholder}
                                className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-teal-400 transition-all resize-none" />
                        </div>

                        <button onClick={issueCertificate}
                            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-xl shadow-teal-500/20">
                            <Award size={16} /> {t.clinicPortal.certificate.issueButton}
                        </button>
                    </div>
                )}

                {/* Candidate info */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { icon: Mail, label: 'Email', value: p.candidateEmail },
                        { icon: Phone, label: 'Phone', value: p.candidatePhone },
                        { icon: Building2, label: 'Company', value: p.contractorCompany || p.primeCompany },
                        { icon: Hash, label: 'Record ID', value: p.recordId || '—' },
                    ].map(item => (
                        <div key={item.label} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-100 dark:border-slate-700">
                            <item.icon size={14} className="text-slate-400 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <div className="text-[9px] font-black text-slate-400 uppercase">{labelsMap[item.label]?.[language] || item.label}</div>
                                <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{item.value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ─── Fitness Certificate Card ─────────────────────────────────────────────────
function FitnessCertDisplay({ cert, name }: { cert: FitnessCertificate; name: string }) {
    const { t, language } = useLanguage();
    const expired = new Date(cert.validUntil) < new Date();

    const labelsMap: Record<string, { en: string; pt: string }> = {
        'Certificate No': { en: 'Certificate No', pt: 'Nº do Certificado' },
        'Candidate': { en: 'Candidate', pt: 'Candidato' },
        'Issued By': { en: 'Issued By', pt: 'Emitido Por' },
        'Exam Type': { en: 'Exam Type', pt: 'Tipo de Exame' },
        'Issued': { en: 'Issued', pt: 'Emitido' },
        'Valid Until': { en: 'Valid Until', pt: 'Válido Até' },
        'Blood Pressure': { en: 'Blood Pressure', pt: 'Pressão Arterial' },
        'Heart Rate': { en: 'Heart Rate', pt: 'Frequência Cardíaca' },
        'Vision': { en: 'Vision', pt: 'Visão' },
        'Drug Screen': { en: 'Drug Screen', pt: 'Rastreio de Drogas' },
        'BMI': { en: 'BMI', pt: 'IMC' },
        'Hearing': { en: 'Hearing', pt: 'Audição' },
        'Musculoskeletal': { en: 'Musculoskeletal', pt: 'Músculo-esquelético' }
    };

    const examTypeLabel = cert.examinationType === 'Pre-Employment' ? (language === 'pt' ? 'Pré-Admissional' : 'Pre-Employment') :
                           cert.examinationType === 'Periodic' ? (language === 'pt' ? 'Periódico' : 'Periodic') :
                           (language === 'pt' ? 'Retorno ao Trabalho' : 'Return-to-Work');

    const visionLabel = cert.visionTest === 'Pass' ? (language === 'pt' ? 'Aprovado' : 'Pass') : (language === 'pt' ? 'Reprovado' : 'Fail');
    const drugLabel = cert.drugScreen === 'Negative' ? (language === 'pt' ? 'Negativo' : 'Negative') : (language === 'pt' ? 'Positivo' : 'Positive');
    const hearingLabel = cert.hearing === 'Normal' ? (language === 'pt' ? 'Normal' : 'Normal') : (language === 'pt' ? 'Deficiente' : 'Impaired');
    const musculoLabel = cert.musculoskeletal === 'Normal' ? (language === 'pt' ? 'Normal' : 'Normal') : (language === 'pt' ? 'Deficiente' : 'Impaired');

    return (
        <div className={`rounded-2xl border-2 overflow-hidden ${cert.fitForWork ? 'border-emerald-300 dark:border-emerald-700' : 'border-red-300 dark:border-red-700'}`}>
            <div className={`px-5 py-3 ${cert.fitForWork ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-red-600 to-rose-600'} text-white flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                    <Award size={18} />
                    <div className="font-black text-sm">{language === 'pt' ? 'Certificado de Aptidão' : 'Fitness Certificate'}</div>
                </div>
                <div className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20">
                    {cert.fitForWork ? t.clinicPortal.certificate.fitForWork : t.clinicPortal.certificate.unfit}
                </div>
            </div>
            <div className="p-5 bg-white dark:bg-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                        ['Certificate No', cert.certificateNo],
                        ['Candidate', name],
                        ['Issued By', cert.issuedBy],
                        ['Exam Type', examTypeLabel],
                        ['Issued', fmtDate(cert.issuedAt, language)],
                        ['Valid Until', fmtDate(cert.validUntil, language)],
                        ['Blood Pressure', cert.bloodPressure || '—'],
                        ['Heart Rate', cert.heartRate ? `${cert.heartRate} bpm` : '—'],
                        ['Vision', visionLabel],
                        ['Drug Screen', drugLabel],
                        ...(cert.bmi ? [['BMI', cert.bmi]] : []),
                        ...(cert.hearing ? [['Hearing', hearingLabel]] : []),
                        ...(cert.musculoskeletal ? [['Musculoskeletal', musculoLabel]] : []),
                    ].map(([k, v]) => (
                        <div key={k}>
                            <div className="text-[9px] font-black text-slate-400 uppercase">{labelsMap[k]?.[language] || k}</div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{v}</div>
                        </div>
                    ))}
                </div>
                {cert.restrictions && (
                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-xl text-[10px] text-amber-700 font-bold">
                        ⚠ {t.clinicPortal.certificate.restrictionsAlert} {cert.restrictions}
                    </div>
                )}
                {expired && (
                    <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl text-[10px] text-red-700 font-black">
                        ⚠ {t.clinicPortal.certificate.expiredAlert}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Certificate Registry View ────────────────────────────────────────────────
function CertificateRegistryView({ processes }: { processes: RecruitmentProcess[] }) {
    const { t, language } = useLanguage();
    const [search, setSearch] = useState('');
    const filtered = processes.filter(p =>
        !search ||
        (p.candidateName || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.fitnessCertificate?.certificateNo || '').toLowerCase().includes(search.toLowerCase())
    );

    const examTypesMap: Record<string, string> = {
        'Pre-Employment': language === 'pt' ? 'Pré-Admissional' : 'Pre-Employment',
        'Periodic': language === 'pt' ? 'Periódico' : 'Periodic',
        'Return-to-Work': language === 'pt' ? 'Retorno ao Trabalho' : 'Return-to-Work'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/10 dark:to-emerald-900/10 flex items-center justify-between gap-4">
                <div className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2"><Award size={16} className="text-teal-600" /> {t.clinicPortal.certificate.registryTitle}</div>
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
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'pt' ? 'Candidato' : 'Candidate'}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'pt' ? 'Nº do Certificado' : 'Certificate No'}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.common.company}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'pt' ? 'Emitido' : 'Issued'}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'pt' ? 'Válido Até' : 'Valid Until'}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'pt' ? 'Decisão' : 'Decision'}</th>
                            <th className="text-left px-5 py-3.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{language === 'pt' ? 'Tipo' : 'Type'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(p => {
                            const cert = p.fitnessCertificate!;
                            const expired = new Date(cert.validUntil) < new Date();
                            const examTypeLabel = examTypesMap[cert.examinationType] || cert.examinationType;
                            return (
                                <tr key={p.id} className="border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                    <td className="px-5 py-3.5 font-black text-slate-900 dark:text-white whitespace-nowrap">{p.candidateName}</td>
                                    <td className="px-5 py-3.5"><span className="font-black text-teal-700 dark:text-teal-400 text-xs bg-teal-50 dark:bg-teal-900/20 px-2.5 py-1 rounded-lg">{cert.certificateNo}</span></td>
                                    <td className="px-5 py-3.5 text-xs text-slate-600 dark:text-slate-400">{p.contractorCompany || p.primeCompany}</td>
                                    <td className="px-5 py-3.5 text-xs text-slate-600">{fmtDate(cert.issuedAt, language)}</td>
                                    <td className={`px-5 py-3.5 text-xs font-bold ${expired ? 'text-red-600' : 'text-emerald-600'}`}>{fmtDate(cert.validUntil, language)}{expired && ' ⚠'}</td>
                                    <td className="px-5 py-3.5"><span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${cert.fitForWork ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{cert.fitForWork ? (language === 'pt' ? 'Apto ✓' : 'Fit ✓') : (language === 'pt' ? 'Inapto ✗' : 'Unfit ✗')}</span></td>
                                    <td className="px-5 py-3.5 text-xs text-slate-500">{examTypeLabel}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filtered.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                        <Award size={32} className="mx-auto mb-2 opacity-20" />
                        <p className="text-xs">{t.clinicPortal.certificate.noCerts}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
