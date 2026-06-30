import React, { useState, useEffect } from 'react';
import { 
    Users, Briefcase, FileText, ShieldAlert, CheckCircle, CheckCircle2, AlertTriangle, 
    Send, Smartphone, Mail, Download, ShieldCheck, HelpCircle, 
    Upload, File, Check, RefreshCw, BadgeAlert, Plus, Trash2, Calendar, 
    Heart, Eye, Activity, Info, Clock, CheckSquare, Square, ChevronRight, UserMinus,
    BarChart2, FileCheck, FileScan, X, TrendingUp, Zap
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMessages } from '../contexts/MessageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/databaseService';
import { RecruitmentProcess, RecruitmentStatus, RecruitDocument, MedicalExam, FitnessCertificate, Employee, BookingStatus, Company, RacDef } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '../contexts/ToastContext';
import { generateRecruitmentStagesPDF } from '../utils/pdfGenerator';

const MobilizationDashboard: React.FC<{ companies?: Company[]; racDefinitions?: RacDef[] }> = ({ companies = [], racDefinitions = [] }) => {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { addMessage } = useMessages();
    const { showToast, confirm, showAlert } = useToast();

    const isVehicleType = (type: string) => {
        return ['Haul Truck', 'Light Vehicle'].includes(type);
    };
    
    // Core Workflow State
    const [processes, setProcesses] = useState<RecruitmentProcess[]>([]);

    // Load processes from PostgreSQL on mount
    useEffect(() => {
        db.getRecruitmentProcesses().then(data => {
            setProcesses(data);
        }).catch(err => console.error('Failed to load recruitment processes:', err));
    }, []);

    // DB-aware helpers: save changed process to PostgreSQL alongside local state update
    const persistAndSetProcesses = async (updated: RecruitmentProcess[], changedProcess: RecruitmentProcess) => {
        setProcesses(updated);
        try { await db.saveRecruitmentProcess(changedProcess); } catch (e) { console.error('DB save failed:', e); }
    };
    const persistNewProcess = async (newProc: RecruitmentProcess, allUpdated: RecruitmentProcess[]) => {
        setProcesses(allUpdated);
        try { await db.saveRecruitmentProcess(newProc); } catch (e) { console.error('DB save failed:', e); }
    };
    const removeAndDeleteProcess = async (id: string) => {
        const updated = processes.filter(p => p.id !== id);
        setProcesses(updated);
        try { await db.deleteRecruitmentProcess(id); } catch (e) { console.error('DB delete failed:', e); }
        return updated;
    };

    // Active tab in Mobilization: 'AM' | 'HR' | 'Security' | 'Clinic' | 'Environment'
    const [activeTab, setActiveTab] = useState<'AM' | 'HR' | 'Security' | 'Clinic' | 'Environment'>('AM');

    // Dynamically filter tabs based on active user privileges (Unified Role Access)
    const allowedTabs = React.useMemo(() => {
        if (!user) return ['AM'];
        
        // System and Enterprise/Site Admins have full access for presentation audits
        if (user.role === 'System Admin' || user.role === 'Enterprise Admin' || user.role === 'Site Admin') {
            return ['AM', 'HR', 'Security', 'Clinic', 'Environment'];
        }
        
        const dept = (user.department || '').toLowerCase();
        const title = (user.jobTitle || '').toLowerCase();
        
        const tabs: string[] = [];
        
        // Area Manager (Dept Admin, or supervisor/manager title)
        if (user.role === 'Department Admin' || title.includes('supervisor') || title.includes('manager')) {
            tabs.push('AM');
        }
        
        // HR Dept
        if (dept.includes('hr') || title.includes('hr') || title.includes('recruitment')) {
            tabs.push('HR');
        }
        
        // Security
        if (dept.includes('security') || title.includes('security') || title.includes('guard')) {
            tabs.push('Security');
        }
        
        // Clinic / Medical
        if (dept.includes('clinic') || dept.includes('medical') || title.includes('doctor') || title.includes('nurse')) {
            tabs.push('Clinic');
        }
        
        // HSE Environment (Induction)
        if (dept.includes('hse') || dept.includes('environment') || title.includes('safety') || title.includes('trainer')) {
            tabs.push('Environment');
        }
        
        return tabs.length > 0 ? tabs : ['AM'];
    }, [user]);

    // Force activeTab to switch to first allowed tab if user switches to a role with restricted privileges
    useEffect(() => {
        if (!allowedTabs.includes(activeTab as any)) {
            setActiveTab(allowedTabs[0] as any);
        }
    }, [allowedTabs, activeTab]);

    const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
    const [isAddRequestOpen, setIsAddRequestOpen] = useState(false);
    
    // New Request State Form
    const [requestType, setRequestType] = useState<'Recruitment' | 'PersonnelAccess' | 'EquipmentAccess' | 'DeliveryAccess'>('Recruitment');
    const [equipmentType, setEquipmentType] = useState('Excavator');
    const [equipmentId, setEquipmentId] = useState('');
    const [respPersonName, setRespPersonName] = useState('');
    const [respPersonPhone, setRespPersonPhone] = useState('');
    
    // Delivery fields
    const [truckModel, setTruckModel] = useState('');
    const [truckRegNumber, setTruckRegNumber] = useState('');
    const [poNumber, setPoNumber] = useState('');

    // Dynamic stages flags
    const [requiresMedical, setRequiresMedical] = useState(true);
    const [requiresInduction, setRequiresInduction] = useState(true);
    const [requiresRac, setRequiresRac] = useState(true);

    const [newRequest, setNewRequest] = useState({
        candidateName: '',
        candidateEmail: '',
        candidatePhone: '',
        workerType: 'Prime' as 'Prime' | 'Contractor',
        primeCompany: 'Vulcan Resources Mozambique',
        contractorCompany: '',
        department: 'Mine Operations',
        role: 'Operator',
        requiredRacs: [] as string[]
    });

    const primeCompanies = companies.filter(c => c.tier === 'Prime' || !c.tier);
    const contractorCompanies = companies.filter(c => c.tier === 'Sub');

    // Fallback lists if companies prop is empty (e.g. during lazy loading)
    const FALLBACK_PRIME = ['Vulcan Resources Mozambique'];
    const FALLBACK_CONTRACTORS = ['Mota-Engil Africa', 'Belabel Logistics', 'Escopil Engineering', 'Jachris Services', 'NBM Construction'];
    const primeList = primeCompanies.length > 0 ? primeCompanies.map(c => c.name) : FALLBACK_PRIME;
    const contractorList = contractorCompanies.length > 0 ? contractorCompanies.map(c => c.name) : FALLBACK_CONTRACTORS;

    // HR Upload Simulations State
    const [hrUploads, setHrUploads] = useState<{ id: boolean; passport: boolean; permit: boolean }>({ id: false, passport: false, permit: false });
    const [hrUploading, setHrUploading] = useState<{ id: boolean; passport: boolean; permit: boolean }>({ id: false, passport: false, permit: false });

    // AM uploads for new request form (simulated file picker state)
    const [amUploadState, setAmUploadState] = useState<{
        candidateId: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
        fitnessCert: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
        insurance: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
        manifesto: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
        photoFront: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
        photoRight: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
        photoLeft: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
        photoBack: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
        driverLicense: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
        passport: { uploaded: boolean; fileName: string; fileSize: string; uploading: boolean };
    }>({
        candidateId: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        fitnessCert: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        insurance: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        manifesto: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        photoFront: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        photoRight: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        photoLeft: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        photoBack: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        driverLicense: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        passport: { uploaded: false, fileName: '', fileSize: '', uploading: false },
    });

    const handleAmFileSelect = (
        docKey: 'candidateId' | 'fitnessCert' | 'insurance' | 'manifesto' | 'photoFront' | 'photoRight' | 'photoLeft' | 'photoBack' | 'driverLicense' | 'passport', 
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAmUploadState(prev => ({ ...prev, [docKey]: { ...prev[docKey], uploading: true, fileName: file.name, fileSize: `${(file.size / 1024).toFixed(1)} KB` } }));
        setTimeout(() => {
            setAmUploadState(prev => ({ ...prev, [docKey]: { ...prev[docKey], uploading: false, uploaded: true } }));
        }, 900);
    };

    const resetAmUploads = () => {
        setAmUploadState({
            candidateId: { uploaded: false, fileName: '', fileSize: '', uploading: false },
            fitnessCert: { uploaded: false, fileName: '', fileSize: '', uploading: false },
            insurance: { uploaded: false, fileName: '', fileSize: '', uploading: false },
            manifesto: { uploaded: false, fileName: '', fileSize: '', uploading: false },
            photoFront: { uploaded: false, fileName: '', fileSize: '', uploading: false },
            photoRight: { uploaded: false, fileName: '', fileSize: '', uploading: false },
            photoLeft: { uploaded: false, fileName: '', fileSize: '', uploading: false },
            photoBack: { uploaded: false, fileName: '', fileSize: '', uploading: false },
            driverLicense: { uploaded: false, fileName: '', fileSize: '', uploading: false },
            passport: { uploaded: false, fileName: '', fileSize: '', uploading: false },
        });
        setEquipmentId('');
        setRespPersonName('');
        setRespPersonPhone('');
        setTruckModel('');
        setTruckRegNumber('');
        setPoNumber('');
    };

    // Security State
    const [badgeNo, setBadgeNo] = useState('');

    // Clinic Medical State
    const [medBP, setMedBP] = useState('120/80');
    const [medHR, setMedHR] = useState(72);
    const [medVision, setMedVision] = useState<'Pass' | 'Fail'>('Pass');
    const [medDrugs, setMedDrugs] = useState<'Negative' | 'Positive'>('Negative');
    const [medFit, setMedFit] = useState(true);
    const [medComments, setMedComments] = useState('');
    const [inductionDate, setInductionDate] = useState('');
    // Extended contractor clinic fields
    const [medBMI, setMedBMI] = useState('');
    const [medHearing, setMedHearing] = useState<'Normal' | 'Impaired'>('Normal');
    const [medMusculo, setMedMusculo] = useState<'Normal' | 'Impaired'>('Normal');
    const [medRestrictions, setMedRestrictions] = useState('');
    const [showFitnessCert, setShowFitnessCert] = useState(false);

    // Environment Induction Checklist
    const [indGeneral, setIndGeneral] = useState(false);
    const [indEnv, setIndEnv] = useState(false);
    const [indEvac, setIndEvac] = useState(false);
    const [indPPE, setIndPPE] = useState(false);
    // Sync processes to PostgreSQL whenever they change (skip initial load)
    const isInitialLoad = React.useRef(true);
    const prevProcessesRef = React.useRef<RecruitmentProcess[]>([]);
    useEffect(() => {
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            prevProcessesRef.current = processes;
            return;
        }
        // Find changed/new processes and persist them
        const prevIds = new Set(prevProcessesRef.current.map(p => p.id));
        const currentIds = new Set(processes.map(p => p.id));
        
        // Save changed or new processes
        for (const proc of processes) {
            const prev = prevProcessesRef.current.find(p => p.id === proc.id);
            if (!prev || JSON.stringify(prev) !== JSON.stringify(proc)) {
                db.saveRecruitmentProcess(proc).catch(e => console.error('DB sync failed:', e));
            }
        }
        // Delete removed processes
        for (const prevProc of prevProcessesRef.current) {
            if (!currentIds.has(prevProc.id)) {
                db.deleteRecruitmentProcess(prevProc.id).catch(e => console.error('DB delete failed:', e));
            }
        }
        prevProcessesRef.current = processes;
    }, [processes]);

    const filteredProcesses = React.useMemo(() => {
        if (activeTab === 'AM') return processes;
        if (activeTab === 'HR') return processes.filter(p => p.status === RecruitmentStatus.AM_REQUESTED || p.status === RecruitmentStatus.HR_PENDING);
        if (activeTab === 'Security') return processes.filter(p => p.status === RecruitmentStatus.SECURITY_PENDING || p.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING || p.status === RecruitmentStatus.DELIVERED);
        if (activeTab === 'Clinic') return processes.filter(p => p.status === RecruitmentStatus.CLINIC_PENDING || p.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING);
        if (activeTab === 'Environment') return processes.filter(p => p.status === RecruitmentStatus.INDUCTION_PENDING || p.status === RecruitmentStatus.SAFETY_PENDING || p.status === RecruitmentStatus.FAILED);
        return processes;
    }, [processes, activeTab]);

    const activeProcess = processes.find(p => p.id === selectedProcessId);

    // Auto-select first process for details if none selected
    useEffect(() => {
        if (!selectedProcessId && filteredProcesses.length > 0) {
            setSelectedProcessId(filteredProcesses[0].id);
        } else if (selectedProcessId && !filteredProcesses.find(p => p.id === selectedProcessId)) {
            setSelectedProcessId(filteredProcesses.length > 0 ? filteredProcesses[0].id : null);
        }
    }, [filteredProcesses, selectedProcessId]);

    // Available RAC categories — read from Training app definitions, fallback to hardcoded
    const AVAILABLE_RACS = React.useMemo(() => {
        if (racDefinitions.length > 0) {
            return racDefinitions.map(r => ({
                code: r.code,
                name: `${r.code} - ${r.name}`
            }));
        }
        // Fallback if no racDefinitions passed
        return [
            { code: 'RAC01', name: 'RAC 01 - Working at Height' },
            { code: 'RAC02', name: 'RAC 02 - Vehicles & Mobile Eq.' },
            { code: 'RAC03', name: 'RAC 03 - Energy Isolation (LOTO)' },
            { code: 'RAC05', name: 'RAC 05 - Confined Spaces' },
            { code: 'RAC08', name: 'RAC 08 - Electrical Safety' },
            { code: 'RAC11', name: 'RAC 11 - Mine Traffic Rules' },
            { code: 'PTS', name: 'PTS - Work Permit Issuer' },
            { code: 'ART', name: 'ART - Risk Assessment' }
        ];
    }, [racDefinitions]);

    const getNextStageAfterClinicOrSecurity = (proc: RecruitmentProcess) => {
        if (proc.requiresInduction !== false) {
            return RecruitmentStatus.INDUCTION_PENDING;
        } else if (proc.requiresRac !== false) {
            return RecruitmentStatus.TRAINING_PENDING;
        } else {
            return RecruitmentStatus.COMPLETED;
        }
    };

    // Helper: Determine bottleneck department and responsible party
    const getBottleneckInfo = (status: RecruitmentStatus) => {
        const cert = t.proposal.mobilization.certificate || {
            deptHR: 'HR Department',
            deptClinic: 'Occupational Clinic',
            deptHSE: 'Environment / HSE',
            deptSecurity: 'Security Office',
            deptAM: 'Area Manager'
        };
        switch(status) {
            case RecruitmentStatus.AM_REQUESTED:
                return { dept: cert.deptHR, role: language === 'pt' ? 'Especialista de RH' : 'HR Specialist', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
            case RecruitmentStatus.HR_PENDING:
                return { dept: cert.deptHR, role: language === 'pt' ? 'Especialista de RH' : 'HR Specialist', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
            case RecruitmentStatus.SECURITY_PENDING:
                return { dept: cert.deptSecurity, role: language === 'pt' ? 'Controlador de Segurança' : 'Security Controller', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
            case RecruitmentStatus.PARALLEL_CLEARANCE_PENDING:
                return { dept: language === 'pt' ? 'Segurança + Clínica' : 'Security + Clinic', role: language === 'pt' ? 'Segurança e Clínica (Paralelo)' : 'Security & Clinic (Parallel)', bg: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
            case RecruitmentStatus.CLINIC_PENDING:
                return { dept: cert.deptClinic, role: language === 'pt' ? 'Médico do Trabalho' : 'Clinic Doctor', bg: 'bg-red-500/10 text-red-500 border-red-500/20' };
            case RecruitmentStatus.INDUCTION_PENDING:
                return { dept: cert.deptHSE, role: language === 'pt' ? 'Instrutor de Segurança' : 'Safety Inductor', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' };
            case RecruitmentStatus.TRAINING_PENDING:
                return { dept: language === 'pt' ? 'Sistema de Treino RACS' : 'CARS Training System', role: language === 'pt' ? 'Responsável de Treino RAC' : 'RAC Training Lead', bg: 'bg-violet-500/10 text-violet-500 border-violet-500/20' };
            case RecruitmentStatus.COMPLETED:
                return { dept: cert.deptAM, role: language === 'pt' ? 'Gestor de Área (Confirmação)' : 'Area Manager (Receipt confirmation)', bg: 'bg-purple-500/10 text-purple-500 border-purple-500/20' };
            case RecruitmentStatus.RECEIVED:
                return { dept: language === 'pt' ? 'Nenhum' : 'None', role: language === 'pt' ? 'Mobilizado' : 'Mobilized', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/10' };
            case RecruitmentStatus.SAFETY_PENDING:
                return { dept: language === 'pt' ? 'Equipa de Segurança' : 'Safety Team', role: language === 'pt' ? 'Inspetor de Segurança' : 'Safety Inspector', bg: 'bg-orange-500/10 text-orange-500 border-orange-500/20' };
            case RecruitmentStatus.FAILED:
                return { dept: language === 'pt' ? 'Equipa de Segurança' : 'Safety Team', role: language === 'pt' ? 'Inspeção Recusada (Acesso Negado)' : 'Inspection Failed (Access Denied)', bg: 'bg-red-500/10 text-red-500 border-red-500/20' };
            case RecruitmentStatus.DELIVERING:
                return { dept: cert.deptAM, role: language === 'pt' ? 'Gestor de Área (Entrega Ativa)' : 'Area Manager (Active Delivery)', bg: 'bg-blue-500/10 text-blue-500 border-blue-500/20' };
            case RecruitmentStatus.DELIVERED:
                return { dept: cert.deptSecurity, role: language === 'pt' ? 'Segurança (Portão de Saída)' : 'Security (Exit Gate Check)', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/20' };
        }
    };

    // Stage descriptions
    const getStageNumber = (status: RecruitmentStatus): number => {
        switch(status) {
            case RecruitmentStatus.AM_REQUESTED: return 1;
            case RecruitmentStatus.HR_PENDING: return 2;
            case RecruitmentStatus.SECURITY_PENDING: return 3;
            case RecruitmentStatus.PARALLEL_CLEARANCE_PENDING: return 3;
            case RecruitmentStatus.CLINIC_PENDING: return 4;
            case RecruitmentStatus.INDUCTION_PENDING: return 4;
            case RecruitmentStatus.TRAINING_PENDING: return 5;
            case RecruitmentStatus.COMPLETED: return 5;
            case RecruitmentStatus.RECEIVED: return 6;
            case RecruitmentStatus.SAFETY_PENDING: return 2;
            case RecruitmentStatus.FAILED: return 2;
        }
    };

    const getPersonnelSteps = () => {
        const st = t.proposal.mobilization.steps || {};
        return [
            { step: 1, title: st.requisition || 'Requisition', desc: st.submittedByAm || 'Submitted by AM', activeStatus: [] },
            { step: 2, title: st.securityReview || 'Security Review', desc: st.accessClearance || 'Access clearance', activeStatus: [RecruitmentStatus.SECURITY_PENDING] },
            { step: 3, title: st.accessGranted || 'Access Granted', desc: st.badgeIssued || 'Badge issued', activeStatus: [RecruitmentStatus.COMPLETED, RecruitmentStatus.RECEIVED] }
        ];
    };

    const getPersonnelStageNumber = (status: RecruitmentStatus) => {
        switch(status) {
            case RecruitmentStatus.SECURITY_PENDING: return 2;
            case RecruitmentStatus.COMPLETED: return 3;
            case RecruitmentStatus.RECEIVED: return 3;
            default: return 1;
        }
    };

    const getEquipmentSteps = () => {
        const st = t.proposal.mobilization.steps || {};
        return [
            { step: 1, title: st.requisition || 'Requisition', desc: st.submittedByAm || 'Submitted by AM', activeStatus: [] },
            { step: 2, title: st.safetyInspection || 'Safety Inspection', desc: st.physicalCheck || 'Physical check', activeStatus: [RecruitmentStatus.SAFETY_PENDING, RecruitmentStatus.FAILED] },
            { step: 3, title: st.securityTag || 'Security Tag', desc: st.permitTagIssuance || 'Permit & Tag issuance', activeStatus: [RecruitmentStatus.SECURITY_PENDING] },
            { step: 4, title: st.accessIssued || 'Access Issued', desc: st.authorized || 'Authorized', activeStatus: [RecruitmentStatus.COMPLETED, RecruitmentStatus.RECEIVED] }
        ];
    };

    const getEquipmentStageNumber = (status: RecruitmentStatus) => {
        switch(status) {
            case RecruitmentStatus.SAFETY_PENDING: return 2;
            case RecruitmentStatus.FAILED: return 2;
            case RecruitmentStatus.SECURITY_PENDING: return 3;
            case RecruitmentStatus.COMPLETED: return 4;
            case RecruitmentStatus.RECEIVED: return 4;
            default: return 1;
        }
    };

    const getDeliverySteps = () => {
        return [
            { step: 1, title: 'Requisition', desc: 'Submitted by AM', activeStatus: [] },
            { step: 2, title: 'Gate Entry', desc: 'Doc verification', activeStatus: [RecruitmentStatus.SECURITY_PENDING] },
            { step: 3, title: 'Delivering', desc: 'Active on site', activeStatus: [RecruitmentStatus.DELIVERING] },
            { step: 4, title: 'Exit Gate', desc: 'Vehicle exit check', activeStatus: [RecruitmentStatus.DELIVERED] },
            { step: 5, title: 'Completed', desc: 'Left site', activeStatus: [RecruitmentStatus.RECEIVED, RecruitmentStatus.COMPLETED] }
        ];
    };

    const getDeliveryStageNumber = (status: RecruitmentStatus) => {
        switch(status) {
            case RecruitmentStatus.SECURITY_PENDING: return 2;
            case RecruitmentStatus.DELIVERING: return 3;
            case RecruitmentStatus.DELIVERED: return 4;
            case RecruitmentStatus.RECEIVED: return 5;
            case RecruitmentStatus.COMPLETED: return 5;
            default: return 1;
        }
    };

    const getProcessTimeline = (process: RecruitmentProcess) => {
        const type = process.requestType || 'Recruitment';
        if (type === 'PersonnelAccess') {
            const stageNum = getPersonnelStageNumber(process.status);
            const steps = getPersonnelSteps();
            return { steps, stageNum };
        } else if (type === 'EquipmentAccess') {
            const stageNum = getEquipmentStageNumber(process.status);
            const steps = getEquipmentSteps();
            return { steps, stageNum };
        } else if (type === 'DeliveryAccess') {
            const stageNum = getDeliveryStageNumber(process.status);
            const steps = getDeliverySteps();
            return { steps, stageNum };
        } else {
            const st = t.proposal.mobilization.steps || {};
            
            const steps = [
                { step: 1, title: st.requisition || 'Requisition', desc: st.requestedByAm || 'Requested by AM', activeStatus: [RecruitmentStatus.AM_REQUESTED] },
                { step: 2, title: st.hrDocuments || 'HR Documents', desc: st.idPassportVerified || 'ID, Passport verified', activeStatus: [RecruitmentStatus.HR_PENDING] },
                { step: 3, title: st.accessCard || 'Access Card', desc: st.temporaryAccess || 'Temporary Access', activeStatus: [RecruitmentStatus.SECURITY_PENDING, RecruitmentStatus.PARALLEL_CLEARANCE_PENDING] }
            ];

            let currentStep = 4;
            
            if (process.requiresMedical !== false) {
                steps.push({
                    step: currentStep++,
                    title: st.medicals || 'Medicals',
                    desc: st.vitalsFitExam || 'Vitals & Fit Exam',
                    activeStatus: [RecruitmentStatus.CLINIC_PENDING]
                });
            }

            if (process.requiresInduction !== false) {
                steps.push({
                    step: currentStep++,
                    title: st.induction || 'Induction',
                    desc: st.safetyOrientation || 'Safety Orientation',
                    activeStatus: [RecruitmentStatus.INDUCTION_PENDING]
                });
            }

            if (process.requiresRac !== false) {
                steps.push({
                    step: currentStep++,
                    title: 'RAC Training',
                    desc: 'Safety Standards',
                    activeStatus: [RecruitmentStatus.TRAINING_PENDING]
                });
            }

            steps.push({
                step: currentStep,
                title: st.mobilized || 'Mobilized',
                desc: st.carsActive || 'CARS Active',
                activeStatus: [RecruitmentStatus.COMPLETED, RecruitmentStatus.RECEIVED]
            });

            let stageNum = 1;
            const currentStatus = process.status;
            
            const activeStep = steps.find(s => s.activeStatus.includes(currentStatus));
            if (activeStep) {
                stageNum = activeStep.step;
            } else {
                if (currentStatus === RecruitmentStatus.RECEIVED || currentStatus === RecruitmentStatus.COMPLETED) {
                    stageNum = steps.length;
                } else if (currentStatus === RecruitmentStatus.AM_REQUESTED) {
                    stageNum = 1;
                } else if (currentStatus === RecruitmentStatus.HR_PENDING) {
                    stageNum = 2;
                } else if (currentStatus === RecruitmentStatus.SECURITY_PENDING || currentStatus === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING) {
                    stageNum = 3;
                } else {
                    stageNum = 1;
                }
            }

            return { steps, stageNum };
        }
    };

    const translateStatus = (status: RecruitmentStatus) => {
        const statuses = t.proposal.mobilization.statuses;
        switch (status) {
            case RecruitmentStatus.AM_REQUESTED:
                return statuses['AM Requested'] || 'Requisition Submitted';
            case RecruitmentStatus.HR_PENDING:
                return statuses['HR Pending'] || 'HR Verification';
            case RecruitmentStatus.SECURITY_PENDING:
                return statuses['Security Pending'] || 'Badge Issuance';
            case RecruitmentStatus.CLINIC_PENDING:
                return statuses['Clinic Pending'] || 'Medical Clearance';
            case RecruitmentStatus.INDUCTION_PENDING:
                return statuses['Induction Pending'] || 'HSE Induction';
            case RecruitmentStatus.TRAINING_PENDING:
                return statuses['Training Pending'] || 'RAC Training';
            case RecruitmentStatus.COMPLETED:
                return statuses['Completed'] || 'Certification Ready';
            case RecruitmentStatus.RECEIVED:
                return statuses['Received'] || 'Mobilized';
            case RecruitmentStatus.PARALLEL_CLEARANCE_PENDING:
                return language === 'pt' ? 'Liberação em Paralelo' : 'Parallel Clearance';
            case RecruitmentStatus.SAFETY_PENDING:
                return language === 'pt' ? 'Inspeção de Segurança' : 'Safety Inspection';
            case RecruitmentStatus.FAILED:
                return language === 'pt' ? 'Falhado' : 'Failed';
            default:
                return status;
        }
    };

    // --- WORKFLOW ACTIONS ---

    // Stage 1: Area Manager requests recruit / access / equipment / delivery
    const handleCreateRequest = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation check
        if (requestType === 'Recruitment') {
            if (!newRequest.candidateName || !newRequest.candidateEmail) return;
            if (newRequest.workerType === 'Contractor') {
                if (!amUploadState.candidateId.uploaded || !amUploadState.fitnessCert.uploaded) {
                    showAlert(
                        language === 'pt' ? 'Documentação Pendente' : 'Pending Documentation',
                        language === 'pt' 
                            ? 'Por favor, faça o upload do Documento de Identificação e do Certificado de Aptidão Física de Terceiros.'
                            : 'Please upload both the ID Document and Third-Party Fitness Certificate.'
                    );
                    return;
                }
            }
        } else if (requestType === 'PersonnelAccess') {
            if (!newRequest.candidateName || !newRequest.candidateEmail) return;
            if (!amUploadState.candidateId.uploaded) {
                showAlert(
                    language === 'pt' ? 'Documento em Falta' : 'Missing Document',
                    language === 'pt'
                        ? 'Por favor, faça o upload do Bilhete de Identidade, Passaporte ou DIRE.'
                        : 'Please upload National ID, Passport or DIRE document.'
                );
                return;
            }
        } else if (requestType === 'DeliveryAccess') {
            if (!newRequest.candidateName || !truckModel || !truckRegNumber || !poNumber) return;
            if (!amUploadState.driverLicense.uploaded) {
                showAlert(
                    language === 'pt' ? 'Documentos em Falta' : 'Missing Documents',
                    language === 'pt'
                        ? 'Por favor, faça o upload da Carta de Condução.'
                        : 'Please upload the Driver\'s License.'
                );
                return;
            }
        } else if (requestType === 'EquipmentAccess') {
            if (!equipmentId || !respPersonName) return;
            
            const missingDocs: string[] = [];
            if (!amUploadState.insurance.uploaded) missingDocs.push(language === 'pt' ? 'Seguro de Responsabilidade Civil' : 'Liability Insurance');
            if (isVehicleType(equipmentType) && !amUploadState.manifesto.uploaded) missingDocs.push(language === 'pt' ? 'Manifesto de Carga' : 'Manifesto');
            if (!amUploadState.photoFront.uploaded) missingDocs.push(language === 'pt' ? 'Foto Vista Frontal' : 'Front View Photo');
            if (!amUploadState.photoRight.uploaded) missingDocs.push(language === 'pt' ? 'Foto Vista Lat. Dir.' : 'Side View (R) Photo');
            if (!amUploadState.photoLeft.uploaded) missingDocs.push(language === 'pt' ? 'Foto Vista Lat. Esq.' : 'Side View (L) Photo');
            if (!amUploadState.photoBack.uploaded) missingDocs.push(language === 'pt' ? 'Foto Vista Traseira' : 'Back View Photo');

            if (missingDocs.length > 0) {
                showAlert(
                    language === 'pt' ? 'Documentos Obrigatórios em Falta' : 'Required Documents Missing',
                    language === 'pt'
                        ? `Por favor, carregue os seguintes documentos para a liberação de segurança: ${missingDocs.join(', ')}`
                        : `Please upload the following required documents for safety clearance: ${missingDocs.join(', ')}`
                );
                return;
            }
        }

        const effectiveCompany = newRequest.workerType === 'Contractor' || requestType === 'EquipmentAccess' || requestType === 'DeliveryAccess'
            ? newRequest.contractorCompany || newRequest.primeCompany
            : newRequest.primeCompany;
            
        const recordPrefix = effectiveCompany.toLowerCase().includes('mota') ? 'ME'
            : effectiveCompany.toLowerCase().includes('belabel') ? 'BL'
            : effectiveCompany.toLowerCase().includes('escopil') ? 'ESC'
            : effectiveCompany.toLowerCase().includes('jachris') ? 'JAC'
            : 'VUL';
        const newEmpId = `emp-${uuidv4().slice(0, 8)}`;
        const recordId = `${recordPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

        const amDocs: RecruitDocument[] = [];
        
        if (requestType === 'EquipmentAccess') {
            if (amUploadState.insurance.uploaded) {
                amDocs.push({
                    name: amUploadState.insurance.fileName,
                    type: 'Insurance',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.insurance.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
            if (isVehicleType(equipmentType) && amUploadState.manifesto.uploaded) {
                amDocs.push({
                    name: amUploadState.manifesto.fileName,
                    type: 'Manifesto',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.manifesto.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
            if (amUploadState.photoFront.uploaded) {
                amDocs.push({
                    name: amUploadState.photoFront.fileName,
                    type: 'Front View Image',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.photoFront.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
            if (amUploadState.photoRight.uploaded) {
                amDocs.push({
                    name: amUploadState.photoRight.fileName,
                    type: 'Side View (R)',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.photoRight.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
            if (amUploadState.photoLeft.uploaded) {
                amDocs.push({
                    name: amUploadState.photoLeft.fileName,
                    type: 'Side View (L)',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.photoLeft.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
            if (amUploadState.photoBack.uploaded) {
                amDocs.push({
                    name: amUploadState.photoBack.fileName,
                    type: 'Back View',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.photoBack.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
        } else if (requestType === 'DeliveryAccess') {
            if (amUploadState.driverLicense.uploaded) {
                amDocs.push({
                    name: amUploadState.driverLicense.fileName,
                    type: 'Driver License',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.driverLicense.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
            if (amUploadState.passport.uploaded) {
                amDocs.push({
                    name: amUploadState.passport.fileName,
                    type: 'Passport',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.passport.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
        } else {
            if (amUploadState.candidateId.uploaded) {
                amDocs.push({
                    name: amUploadState.candidateId.fileName,
                    type: 'AM ID Upload',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.candidateId.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
            if (requestType === 'Recruitment' && amUploadState.fitnessCert.uploaded) {
                amDocs.push({
                    name: amUploadState.fitnessCert.fileName,
                    type: 'Fitness Certificate',
                    uploadedAt: new Date().toISOString(),
                    fileSize: amUploadState.fitnessCert.fileSize,
                    status: 'Verified',
                    uploadedBy: 'AM'
                });
            }
        }

        let requestObj: RecruitmentProcess;

        if (requestType === 'Recruitment') {
            requestObj = {
                id: `rp-${uuidv4().slice(0, 8)}`,
                candidateName: newRequest.candidateName,
                candidateEmail: newRequest.candidateEmail,
                candidatePhone: newRequest.candidatePhone || '+258 84 000 0000',
                workerType: newRequest.workerType,
                primeCompany: newRequest.primeCompany,
                contractorCompany: newRequest.workerType === 'Contractor' ? effectiveCompany : undefined,
                company: effectiveCompany,
                department: newRequest.department,
                role: newRequest.role,
                requiredRacs: newRequest.requiredRacs,
                status: RecruitmentStatus.AM_REQUESTED,
                requestedBy: user?.name || 'Area Manager',
                requestedAt: new Date().toISOString(),
                documents: [],
                amDocuments: amDocs,
                nudgeCount: 0,
                employeeId: newEmpId,
                recordId: recordId,
                requestType: 'Recruitment',
                requiresMedical,
                requiresInduction,
                requiresRac
            };
        } else if (requestType === 'PersonnelAccess') {
            requestObj = {
                id: `rp-${uuidv4().slice(0, 8)}`,
                candidateName: newRequest.candidateName,
                candidateEmail: newRequest.candidateEmail,
                candidatePhone: newRequest.candidatePhone || '+258 84 000 0000',
                workerType: newRequest.workerType,
                primeCompany: newRequest.primeCompany,
                contractorCompany: newRequest.workerType === 'Contractor' ? effectiveCompany : undefined,
                company: effectiveCompany,
                department: newRequest.department,
                role: 'Personnel Access (' + newRequest.role + ')',
                requiredRacs: [],
                status: RecruitmentStatus.SECURITY_PENDING, // Directly to Security
                requestedBy: user?.name || 'Area Manager',
                requestedAt: new Date().toISOString(),
                documents: [],
                amDocuments: amDocs,
                nudgeCount: 0,
                employeeId: newEmpId,
                recordId: recordId,
                requestType: 'PersonnelAccess'
            };
        } else if (requestType === 'DeliveryAccess') {
            requestObj = {
                id: `rp-${uuidv4().slice(0, 8)}`,
                candidateName: newRequest.candidateName,
                candidateEmail: newRequest.candidateEmail || 'driver.delivery@vulcan.co.mz',
                candidatePhone: newRequest.candidatePhone || '+258 84 000 0000',
                workerType: 'Contractor',
                primeCompany: newRequest.primeCompany,
                contractorCompany: effectiveCompany,
                company: effectiveCompany,
                department: newRequest.department,
                role: 'Delivery Driver',
                requiredRacs: [],
                status: RecruitmentStatus.SECURITY_PENDING,
                requestedBy: user?.name || 'Area Manager',
                requestedAt: new Date().toISOString(),
                documents: [],
                amDocuments: amDocs,
                nudgeCount: 0,
                recordId: recordId,
                requestType: 'DeliveryAccess',
                truckModel: truckModel,
                truckRegNumber: truckRegNumber,
                poNumber: poNumber,
                requiresMedical: false,
                requiresInduction: false,
                requiresRac: false
            };
        } else { // EquipmentAccess
            requestObj = {
                id: `rp-${uuidv4().slice(0, 8)}`,
                candidateName: `Equipment: ${equipmentType} (${equipmentId})`,
                candidateEmail: 'equipment.access@vulcan.co.mz',
                candidatePhone: respPersonPhone || '+258 84 000 0000',
                workerType: 'Contractor',
                primeCompany: newRequest.primeCompany,
                contractorCompany: effectiveCompany,
                company: effectiveCompany,
                department: newRequest.department,
                role: 'Equipment Access (' + equipmentType + ')',
                requiredRacs: [],
                status: RecruitmentStatus.SAFETY_PENDING, // Direct to Safety Inspection
                requestedBy: user?.name || 'Area Manager',
                requestedAt: new Date().toISOString(),
                documents: [],
                amDocuments: amDocs,
                nudgeCount: 0,
                recordId: recordId,
                requestType: 'EquipmentAccess',
                equipmentType: equipmentType,
                equipmentId: equipmentId,
                responsiblePersonName: respPersonName,
                responsiblePersonPhone: respPersonPhone,
                safetyInspectionCleared: false
            };
        }

        const updated = [requestObj, ...processes];
        setProcesses(updated);
        setSelectedProcessId(requestObj.id);
        setIsAddRequestOpen(false);
        resetAmUploads();
        setNewRequest({
            candidateName: '',
            candidateEmail: '',
            candidatePhone: '',
            workerType: 'Prime',
            primeCompany: primeList[0] || 'Vulcan Resources Mozambique',
            contractorCompany: '',
            department: 'Mine Operations',
            role: 'Operator',
            requiredRacs: []
        });

        // Notifications
        if (requestType === 'Recruitment') {
            addMessage({
                type: 'EMAIL',
                recipient: 'hr.specialist@vulcan.co.mz',
                recipientName: 'HR Specialist',
                subject: `ACTION REQUIRED: New Recruitment Requested - ${requestObj.candidateName}`,
                content: `Dear HR Onboarding Team,\n\nArea Manager ${requestObj.requestedBy} has submitted a mobilization request for candidate ${requestObj.candidateName} as a ${requestObj.role} in ${requestObj.department}.\n\nBest regards,\nCARS Onboarding Gateway`
            });
            db.addLog('INFO', `RECRUITMENT_REQUISITION: ${requestObj.candidateName} requested by ${requestObj.requestedBy}`, user?.name || 'AM');
        } else if (requestType === 'PersonnelAccess') {
            addMessage({
                type: 'EMAIL',
                recipient: 'security.turnstiles@vulcan.co.mz',
                recipientName: 'Security Team',
                subject: `ACTION REQUIRED: Personnel Access Request - ${requestObj.candidateName}`,
                content: `Dear Security Team,\n\nArea Manager ${requestObj.requestedBy} has submitted a Personnel Access Request for ${requestObj.candidateName}.\n\nBest regards,\nCARS Onboarding Gateway`
            });
            db.addLog('INFO', `PERSONNEL_ACCESS_REQUISITION: ${requestObj.candidateName} requested by ${requestObj.requestedBy}`, user?.name || 'AM');
        } else if (requestType === 'DeliveryAccess') {
            addMessage({
                type: 'EMAIL',
                recipient: 'security.gate@vulcan.co.mz',
                recipientName: 'Security Gate Team',
                subject: `ACTION REQUIRED: Delivery Access Request - PO ${requestObj.poNumber}`,
                content: `Dear Security Gate Team,\n\nArea Manager ${requestObj.requestedBy} has requested entry clearance for delivery truck (Reg: ${requestObj.truckRegNumber}, PO: ${requestObj.poNumber}) driven by ${requestObj.candidateName}.\n\nPlease verify physical documents on arrival.\n\nBest regards,\nCARS Gateway`
            });
            db.addLog('INFO', `DELIVERY_ACCESS_REQUISITION: Driver ${requestObj.candidateName} for PO ${requestObj.poNumber} requested by ${requestObj.requestedBy}`, user?.name || 'AM');
        } else {
            addMessage({
                type: 'EMAIL',
                recipient: 'safety.inspections@vulcan.co.mz',
                recipientName: 'Safety Team',
                subject: `ACTION REQUIRED: Equipment Access Inspection - ${equipmentType} (${equipmentId})`,
                content: `Dear Safety Team,\n\nArea Manager ${requestObj.requestedBy} has requested site access for equipment: ${equipmentType} (ID: ${equipmentId}).\n\nPlease conduct a physical safety inspection.\n\nBest regards,\nCARS Onboarding Gateway`
            });
            db.addLog('INFO', `EQUIPMENT_ACCESS_REQUISITION: ${equipmentType} (${equipmentId}) requested by ${requestObj.requestedBy}`, user?.name || 'AM');
        }
    };

    // Nudge Action: Area Manager pushes responsible department
    const handleNudge = (id: string) => {
        const process = processes.find(p => p.id === id);
        if (!process) return;

        const bottleneck = getBottleneckInfo(process.status);
        const nudgeCount = (process.nudgeCount || 0) + 1;

        const updated = processes.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    nudgeCount,
                    lastNudgeAt: new Date().toISOString()
                };
            }
            return p;
        });

        setProcesses(updated);

        // Send simulated notification based on bottleneck
        let recipientContact = '';
        let recipientName = bottleneck.role;
        let content = '';

        if (process.status === RecruitmentStatus.HR_PENDING || process.status === RecruitmentStatus.AM_REQUESTED) {
            recipientContact = 'hr.onboarding@vulcan.co.mz';
            content = `URGENT REMINDER: Area Manager is waiting for HR document verification for recruit ${process.candidateName}. Please complete document uploads.`;
        } else if (process.status === RecruitmentStatus.SECURITY_PENDING) {
            recipientContact = 'security.badge@vulcan.co.mz';
            content = `URGENT REMINDER: Temporary access badge is pending for recruit ${process.candidateName}. Please issue badge credentials.`;
        } else if (process.status === RecruitmentStatus.CLINIC_PENDING) {
            recipientContact = 'clinic.medicals@vulcan.co.mz';
            content = `URGENT REMINDER: Occupational medical clearance exam is pending for ${process.candidateName}. Please schedule clinical checks.`;
        } else if (process.status === RecruitmentStatus.INDUCTION_PENDING) {
            recipientContact = 'hse.induction@vulcan.co.mz';
            content = `URGENT REMINDER: Site HSE/Environment induction is pending for recruit ${process.candidateName}. Please certify physical orientation.`;
        } else if (process.status === RecruitmentStatus.TRAINING_PENDING) {
            recipientContact = 'training.center@vulcan.co.mz';
            content = `SYSTEM REMINDER: Recruit ${process.candidateName} is scheduled for RACS trainings. Please synchronize passed test credentials.`;
        }

        addMessage({
            type: 'EMAIL',
            recipient: recipientContact,
            recipientName: recipientName,
            subject: `EXPEDITE REMINDER: Onboarding Pending - ${process.candidateName}`,
            content: `Dear ${recipientName},\n\nThis is an automated reminder regarding the onboarding pipeline for ${process.candidateName}.\n\nStage: ${process.status}\nRequested By: ${process.requestedBy}\nNudge Level: #${nudgeCount}\n\nArea Manager has requested that you process your department's actions as a matter of priority.\n\nMessage Detail:\n"${content}"\n\nAccess the portal: http://localhost:3000/#/recruitment\n\nThank you,\nOnboarding Tracking Service`
        });

        db.addLog('WARN', `AM_NUDGE_TRIGGERED: Target ${bottleneck.role} for ${process.candidateName}`, user?.name || 'AM');
    };

    // Stage 1 -> Stage 2: HR accepts the requisition request
    const handleAcceptRequisition = (id: string) => {
        const process = processes.find(p => p.id === id);
        if (!process) return;

        const updated = processes.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    status: RecruitmentStatus.HR_PENDING
                };
            }
            return p;
        });

        setProcesses(updated);

        // Notify HR onboarding specialist
        addMessage({
            type: 'EMAIL',
            recipient: 'hr.specialist@vulcan.co.mz',
            recipientName: 'HR Specialist',
            subject: `ONBOARDING STARTED: Requisition Accepted - ${process.candidateName}`,
            content: `Dear Area Manager,\n\nHR has accepted your recruitment request for ${process.candidateName}. The onboarding process has officially started and we are now verifying identification documents.\n\nBest regards,\nHR Department`
        });

        db.addLog('INFO', `REQUISITION_ACCEPTED: Onboarding started for ${process.candidateName}`, 'HR Department');
    };

    // Stage 2: HR completes upload and review
    const handleSimulateUpload = (id: string, docType: 'id' | 'passport' | 'permit') => {
        const process = processes.find(p => p.id === id);
        if (!process) return;

        setHrUploading(prev => ({ ...prev, [docType]: true }));
        setTimeout(() => {
            setHrUploading(prev => ({ ...prev, [docType]: false }));
            
            const docName = `${process.candidateName.toLowerCase().replace(/\s+/g, '_')}_${docType === 'id' ? 'national_id' : docType === 'passport' ? 'passport' : 'work_permit'}.pdf`;
            const docTypeMapped: 'ID' | 'Passport' | 'Work Permit' = docType === 'id' ? 'ID' : docType === 'passport' ? 'Passport' : 'Work Permit';
            const newDoc: RecruitDocument = {
                name: docName,
                type: docTypeMapped,
                uploadedAt: new Date().toISOString(),
                fileSize: docType === 'passport' ? '2.9 MB' : docType === 'permit' ? '1.7 MB' : '1.4 MB',
                status: 'Verified'
            };

            setProcesses(prev => prev.map(p => {
                if (p.id === id) {
                    const filteredDocs = (p.documents || []).filter(d => d.type !== docTypeMapped);
                    return {
                        ...p,
                        documents: [...filteredDocs, newDoc]
                    };
                }
                return p;
            }));
        }, 1200);
    };

    const handleCompleteHR = (id: string) => {
        const process = processes.find(p => p.id === id);
        if (!process) return;

        if (!process.documents || process.documents.length === 0) {
            showAlert(
                language === 'pt' ? 'Documento em Falta' : 'Missing Document',
                language === 'pt'
                    ? 'Por favor, faça o upload de pelo menos um documento para continuar.'
                    : 'Please upload at least one document to proceed.'
            );
            return;
        }

        // Contractors go to parallel Security + Clinic; Prime goes sequential to Security
        const nextStatus = process.workerType === 'Contractor'
            ? RecruitmentStatus.PARALLEL_CLEARANCE_PENDING
            : RecruitmentStatus.SECURITY_PENDING;

        const updated = processes.map(p => {
            if (p.id === id) {
                return { ...p, status: nextStatus, securityCleared: false, clinicFitnessCleared: false };
            }
            return p;
        });

        setProcesses(updated);

        if (process.workerType === 'Contractor') {
            addMessage({
                type: 'EMAIL',
                recipient: 'security.turnstiles@vulcan.co.mz',
                recipientName: 'Security Access Control',
                subject: `ACTION REQUIRED: Issue Access Card (Contractor) - ${process.candidateName}`,
                content: `Dear Security Department,\n\nHR documentation has been verified for contractor ${process.candidateName} (${process.company}).\n\nThis is a CONTRACTOR request — both Security (access) and Clinic (fitness) must clear this candidate simultaneously before Induction.\n\nPlease issue a Temporary Access Card promptly.\n\nBest regards,\nCARS Automated Onboarding Gateway`
            });
            addMessage({
                type: 'EMAIL',
                recipient: 'mine.clinic@vulcan.co.mz',
                recipientName: 'Occupational Health Clinic',
                subject: `ACTION REQUIRED: Fitness Verification (Contractor) - ${process.candidateName}`,
                content: `Dear Clinical Staff,\n\nHR documentation has been verified for contractor ${process.candidateName} (${process.company}).\n\nThis is a CONTRACTOR request — the candidate must undergo a full Pre-Employment fitness evaluation and receive a Fitness Certificate before proceeding to induction.\n\nBoth Security and Clinic clearances are required simultaneously.\n\nBest regards,\nCARS Automated Onboarding Gateway`
            });
        } else {
            addMessage({
                type: 'EMAIL',
                recipient: 'security.turnstiles@vulcan.co.mz',
                recipientName: 'Security Access Control',
                subject: `ACTION REQUIRED: Issue Access Card - ${process.candidateName}`,
                content: `Dear Security Department,\n\nHR documentation has been uploaded and verified for new recruit ${process.candidateName} (${process.company}).\n\nPlease assign a Temporary Access Card / Badge Number.\n\nBest regards,\nCARS Automated Onboarding Gateway`
            });
        }

        db.addLog('INFO', `HR_STAGE_COMPLETED: ${process.workerType} candidate ${process.candidateName} → ${nextStatus}`, 'HR Department');
    };

    // Stage 3: Security issues temporary badge
    const handleIssueBadge = (id: string) => {
        if (!badgeNo.trim()) {
            showAlert(
                language === 'pt' ? 'Badge Inválido' : 'Invalid Badge',
                language === 'pt'
                    ? 'Por favor, insira o número do cartão de acesso temporário.'
                    : 'Please enter a Temporary Badge Number.'
            );
            return;
        }

        const process = processes.find(p => p.id === id);
        if (!process) return;

        const isParallel = process.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING;

        const updated = processes.map(p => {
            if (p.id === id) {
                const securityDone = true;
                const clinicDone = p.clinicFitnessCleared || false;
                const nextStatus = isParallel
                    ? (clinicDone ? RecruitmentStatus.INDUCTION_PENDING : RecruitmentStatus.PARALLEL_CLEARANCE_PENDING)
                    : RecruitmentStatus.CLINIC_PENDING;
                return {
                    ...p,
                    temporaryBadgeNumber: badgeNo,
                    securityCleared: true,
                    status: nextStatus
                };
            }
            return p;
        });

        setProcesses(updated);
        setBadgeNo('');

        const freshProcess = updated.find(p => p.id === id)!;

        if (isParallel && freshProcess.status === RecruitmentStatus.INDUCTION_PENDING) {
            addMessage({
                type: 'EMAIL', recipient: 'hse.inductions@vulcan.co.mz', recipientName: 'HSE Environment Team',
                subject: `INDUCTION READY: Both Clearances Received - ${process.candidateName}`,
                content: `Dear HSE Team,\n\nContractor ${process.candidateName} has cleared both Security and Clinic. Induction may now proceed.`
            });
        } else if (!isParallel) {
            addMessage({
                type: 'EMAIL', recipient: 'mine.clinic@vulcan.co.mz', recipientName: 'Occupational Health Clinic',
                subject: `ACTION REQUIRED: Medical Clearance Request - ${process.candidateName}`,
                content: `Dear Clinical Staff,\n\nTemporary site access badge (${badgeNo}) has been issued for recruit ${process.candidateName}.\n\nThe candidate is authorized to report to the Medical Center for physical suitability evaluation, drug screening, and vital checks.\n\nBest regards,\nCARS Onboarding Gateway`
            });
        }

        db.addLog('INFO', `SECURITY_ACCESS_GRANTED: Badge ${badgeNo} for ${process.candidateName} (parallel=${isParallel})`, 'Security Department');
    };

    // Stage 4: Clinic clearance — handles both CLINIC_PENDING (prime) and PARALLEL_CLEARANCE_PENDING (contractor)
    const handleCompleteClinic = (id: string, isContractor = false) => {
        const process = processes.find(p => p.id === id);
        if (!process) return;

        const medicalExam: MedicalExam = {
            bloodPressure: medBP,
            heartRate: Number(medHR),
            visionTest: medVision,
            drugScreen: medDrugs,
            fitForWork: medFit,
            checkedAt: new Date().toISOString(),
            comments: medComments || 'Vitals cleared by clinical doctor.'
        };

        let fitnessCertificate: FitnessCertificate | undefined;
        let nextStatus: RecruitmentStatus;

        if (isContractor) {
            // Generate Fitness Certificate for contractor
            fitnessCertificate = {
                certificateNo: `FIT-${process.recordId || uuidv4().slice(0, 8)}-${new Date().getFullYear()}`,
                issuedAt: new Date().toISOString(),
                validUntil: new Date(Date.now() + 365 * 24 * 3600000).toISOString(),
                issuedBy: user?.name || 'Occupational Health Physician',
                examinationType: 'Pre-Employment',
                bloodPressure: medBP,
                heartRate: Number(medHR),
                visionTest: medVision,
                drugScreen: medDrugs,
                bmi: medBMI,
                hearing: medHearing,
                musculoskeletal: medMusculo,
                fitForWork: medFit,
                restrictions: medRestrictions || undefined,
                comments: medComments || undefined
            };
            // In parallel: check if security already cleared
            const securityDone = process.securityCleared || false;
            nextStatus = securityDone ? RecruitmentStatus.INDUCTION_PENDING : RecruitmentStatus.PARALLEL_CLEARANCE_PENDING;
        } else {
            if (!inductionDate) {
                showAlert(
                    language === 'pt' ? 'Data de Integração em Falta' : 'Induction Date Missing',
                    language === 'pt'
                        ? 'Por favor, especifique uma data para a Integração de Segurança/Ambiente.'
                        : 'Please specify a date for the Safety/Environment Induction.'
                );
                return;
            }
            nextStatus = RecruitmentStatus.INDUCTION_PENDING;
        }

        const updated = processes.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    status: nextStatus,
                    medicalExam,
                    fitnessCertificate,
                    clinicFitnessCleared: true,
                    inductionDate: isContractor ? undefined : inductionDate
                };
            }
            return p;
        });

        setProcesses(updated);
        setShowFitnessCert(isContractor);
        setMedBP('120/80'); setMedHR(72); setMedVision('Pass');
        setMedDrugs('Negative'); setMedFit(true); setMedComments('');
        setMedBMI(''); setMedHearing('Normal'); setMedMusculo('Normal');
        setMedRestrictions(''); setInductionDate('');

        const freshProcess = updated.find(p => p.id === id)!;

        if (freshProcess.status === RecruitmentStatus.INDUCTION_PENDING) {
            addMessage({
                type: 'EMAIL', recipient: 'hse.inductions@vulcan.co.mz', recipientName: 'HSE Environment Team',
                subject: `ACTION REQUIRED: HSE Induction Ready - ${process.candidateName}`,
                content: `Dear Environment & Safety Team,\n\nRecruit ${process.candidateName} has passed clinical evaluation and is ready for Site HSE Induction.\n\nPlease coordinate the physical orientation session.\n\nBest regards,\nCARS Onboarding Coordinator`
            });
        }

        db.addLog('INFO', `CLINIC_EXAM_COMPLETED: ${isContractor ? 'Fitness Certificate issued' : 'Fit-for-work cleared'} for ${process.candidateName}`, 'Occupational Clinic');
    };

    // Stage 5a: Environment Induction sign-off
    const handleConfirmInduction = async (id: string) => {
        if (!indGeneral || !indEnv || !indEvac || !indPPE) {
            showAlert(
                language === 'pt' ? 'Orientação Incompleta' : 'Orientation Incomplete',
                language === 'pt'
                    ? 'Todos os passos de orientação de segurança devem ser verificados e assinalados.'
                    : 'All safety orientation steps must be verified and checked.'
            );
            return;
        }

        const process = processes.find(p => p.id === id);
        if (!process) return;

        let empId = process.employeeId;
        let recordId = process.recordId;
        const nextStatus = process.requiresRac === false ? RecruitmentStatus.COMPLETED : RecruitmentStatus.TRAINING_PENDING;

        if (nextStatus === RecruitmentStatus.COMPLETED) {
            try {
                const dbReg = await registerProcessInDatabase(process);
                empId = dbReg.empId;
                recordId = dbReg.recordId;
            } catch (err) {
                console.error(err);
            }
        }

        const updated = processes.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    status: nextStatus,
                    inductionConfirmed: true,
                    employeeId: empId,
                    recordId: recordId,
                    trainingCompletedAt: nextStatus === RecruitmentStatus.COMPLETED ? new Date().toISOString() : undefined
                };
            }
            return p;
        });

        setProcesses(updated);
        setIndGeneral(false);
        setIndEnv(false);
        setIndEvac(false);
        setIndPPE(false);

        if (nextStatus === RecruitmentStatus.COMPLETED) {
            addMessage({
                type: 'EMAIL',
                recipient: 'area.manager@vulcan.co.mz',
                recipientName: process.requestedBy,
                subject: `SUCCESS: Onboarding Complete (RAC Skipped) - ${process.candidateName}`,
                content: `Dear ${process.requestedBy},\n\nWe are pleased to inform you that the onboarding process for ${process.candidateName} has been completed successfully.\n\nSummary of Credentials:\n- HR Verification: PASSED\n- Security Access: ACTIVE (Badge ${process.temporaryBadgeNumber})\n- Clinic Medical Check: CLEARED Fit-for-Work\n- HSE Site Induction: SIGNED OFF\n- CARS RAC Modules: Bypassed\n\nYou can now log in to the CARS Mobilization dashboard to download the Final Certificate.\n\nKeep working safely,\nCARS Gateway`
            });
            db.addLog('INFO', `HSE_INDUCTION_COMPLETED: Safety checklist certified for ${process.candidateName}. RAC Training bypassed.`, 'Environment & HSE');
        } else {
            // Notify RACS / CARS Training Department
            addMessage({
                type: 'EMAIL',
                recipient: 'cars.training@vulcan.co.mz',
                recipientName: 'CARS Training Coordinator',
                subject: `ACTION REQUIRED: Initialize RAC Certification - ${process.candidateName}`,
                content: `Dear CARS Training Administrator,\n\nCandidate ${process.candidateName} has successfully completed safety and environmental induction.\n\nThe required RAC training modules requested for this employee are: ${process.requiredRacs.join(', ') || 'General Safety'}.\n\nPlease schedule training evaluation sessions. Once training scores are logged and passed, the certificate will be made available for download.\n\nBest regards,\nCARS Automated Onboarding Gateway`
            });
            db.addLog('INFO', `HSE_INDUCTION_COMPLETED: Safety checklist certified for ${process.candidateName}`, 'Environment & HSE');
        }
    };

    const handleConfirmDeliveryFinished = (id: string) => {
        const process = processes.find(p => p.id === id);
        if (!process) return;

        const updated = processes.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    status: RecruitmentStatus.DELIVERED
                };
            }
            return p;
        });

        setProcesses(updated);

        addMessage({
            type: 'EMAIL',
            recipient: 'security.gate@vulcan.co.mz',
            recipientName: 'Security Gate Team',
            subject: `DELIVERY COMPLETED: Ready for Exit - PO ${process.poNumber}`,
            content: `Dear Security Gate Team,\n\nArea Manager has confirmed that delivery driver ${process.candidateName} has finished unloading and is headed to the exit gate.\n\nPlease verify and record the vehicle exit.\n\nBest regards,\nCARS Onboarding Coordinator`
        });

        db.addLog('INFO', `DELIVERY_COMPLETED: Driver ${process.candidateName} for PO ${process.poNumber} completed unloading. Headed to exit.`, user?.name || 'AM');
        showToast(language === 'pt' ? 'Entrega marcada como concluída' : 'Delivery marked as completed', 'success');
    };

    // Helper: Register the recruit as an active employee in the CARS system database
    const registerProcessInDatabase = async (p: RecruitmentProcess) => {
        const empId = p.employeeId || `emp-${uuidv4().slice(0, 8)}`;
        const recordId = p.recordId || `VUL-${p.company.includes('Mota') ? 'ME' : p.company.includes('Belabel') ? 'BL' : 'VUL'}-${Math.floor(1000 + Math.random() * 9000)}`;

        const employeePayload: Employee = {
            id: empId,
            name: p.candidateName,
            recordId: recordId,
            company: p.company,
            department: p.department,
            role: p.role,
            isActive: true,
            siteId: 's-moatize',
            phoneNumber: p.candidatePhone
        };

        const newBookings: any[] = [];
        const requiredRacsObject: Record<string, boolean> = {};

        p.requiredRacs.forEach((rac, index) => {
            requiredRacsObject[rac] = true;
            newBookings.push({
                id: `bk-auto-${uuidv4().slice(0, 8)}`,
                sessionId: `sess-${rac.toLowerCase()}-${index}`,
                employee: employeePayload,
                status: BookingStatus.PASSED,
                resultDate: new Date().toISOString().split('T')[0],
                expiryDate: new Date(Date.now() + 365 * 2 * 24 * 3600000).toISOString().split('T')[0], // 2 years validity
                attendance: true,
                theoryScore: 95,
                practicalScore: 95,
                driverLicenseVerified: true
            });
        });

        await db.bulkUpsertEmployees([employeePayload]);
        await db.bulkUpsertBookings(newBookings);
        await db.bulkUpsertRequirements([{
            employeeId: empId,
            asoExpiryDate: new Date(Date.now() + 365 * 24 * 3600000).toISOString().split('T')[0], // 1 year ASO
            requiredRacs: requiredRacsObject
        }]);

        return { empId, recordId };
    };

    // Stage 5b: Simulate CARS RAC training completion (Passed certification)
    const handleSimulateTraining = async (id: string) => {
        const process = processes.find(p => p.id === id);
        if (!process) return;

        try {
            const { empId, recordId } = await registerProcessInDatabase(process);

            // Update process status to COMPLETED
            const updated = processes.map(p => {
                if (p.id === id) {
                    return {
                        ...p,
                        status: RecruitmentStatus.COMPLETED,
                        trainingCompletedAt: new Date().toISOString(),
                        employeeId: empId,
                        recordId: recordId
                    };
                }
                return p;
            });
            setProcesses(updated);

            // Send process complete notification to Area Manager
            addMessage({
                type: 'EMAIL',
                recipient: 'area.manager@vulcan.co.mz',
                recipientName: process.requestedBy,
                subject: `SUCCESS: Onboarding & RAC Training Complete - ${process.candidateName}`,
                content: `Dear ${process.requestedBy},\n\nWe are pleased to inform you that the onboarding process and mandatory RAC certifications for ${process.candidateName} have been completed successfully.\n\nSummary of Credentials:\n- HR Verification: PASSED\n- Security Access: ACTIVE (Badge ${process.temporaryBadgeNumber})\n- Clinic Medical Check: CLEARED Fit-for-Work\n- HSE Site Induction: SIGNED OFF\n- CARS RAC Modules: PASSED (${process.requiredRacs.join(', ') || 'N/A'})\n\nYou can now log in to the CARS Mobilization dashboard to download the Final Certificate and confirm the official receipt of the employee.\n\nKeep working safely,\nCARS Training & Compliance System`
            });

            db.addLog('INFO', `CARS_TRAINING_PASSED: Certified for ${process.candidateName}`, 'CARS System');

        } catch (e) {
            console.error('Error simulating training sync', e);
        }
    };

    // Stage 6: Area Manager confirms receipt of employee (Final Promotion)
    const handleConfirmReceipt = async (id: string) => {
        const process = processes.find(p => p.id === id);
        if (!process) return;

        try {
            const { empId, recordId } = await registerProcessInDatabase(process);

            const finalProcess = {
                ...process,
                status: RecruitmentStatus.RECEIVED,
                receivedAt: new Date().toISOString(),
                employeeId: empId,
                recordId: recordId
            };

            const updated = processes.map(p => {
                if (p.id === id) {
                    return finalProcess;
                }
                return p;
            });

            setProcesses(updated);

            // SMS notification to the recruit
            addMessage({
                type: 'SMS',
                recipient: process.candidatePhone,
                recipientName: process.candidateName,
                content: `CARS ACCESS NOTICE: Welcome ${process.candidateName}! Your mobilization has been finalized. Your temporary badge ${process.temporaryBadgeNumber} is now fully activated for site entry. Report to ${process.department} supervisor.`
            });

            db.addLog('AUDIT', `EMPLOYEE_MOBILIZATION_SUCCESS: ${process.candidateName} fully onboarded and received`, 'Area Manager');

            // Auto generate Stages PDF
            try {
                await generateRecruitmentStagesPDF(finalProcess, language, user?.companyLogo);
                showToast(
                    language === 'pt' ? 'Relatório de Mobilização gerado com sucesso!' : 'Mobilization report generated successfully!',
                    'success'
                );
            } catch (pdfErr) {
                console.error("PDF generation failed", pdfErr);
            }

            showAlert(
                language === 'pt' ? 'Mobilização Concluída' : 'Mobilization Complete',
                t.proposal.mobilization.confirmReceiptMsg.replace('{name}', process.candidateName)
            );
        } catch (e) {
             console.error('Error confirming receipt', e);
        }
    };

    // Download Stages report
    const handleDownloadStagesReport = async (id: string) => {
        const process = processes.find(p => p.id === id);
        if (!process) return;
        try {
            await generateRecruitmentStagesPDF(process, language, user?.companyLogo);
            showToast(
                language === 'pt' ? 'Relatório descarregado com sucesso!' : 'Report downloaded successfully!',
                'success'
            );
        } catch (pdfErr) {
            console.error("PDF generation failed", pdfErr);
            showToast(
                language === 'pt' ? 'Erro ao gerar o relatório PDF' : 'Error generating PDF report',
                'error'
            );
        }
    };

    // Clean process (for reset)
    const handleResetProcesses = async () => {
        if (await confirm(
            language === 'pt' ? 'Reiniciar Pipeline' : 'Reset Pipeline',
            t.proposal.mobilization.resetConfirm,
            { isDestructive: true }
        )) {
            try {
                await db.deleteAllRecruitmentProcesses();
                setProcesses([]);
                setSelectedProcessId(null);
                showToast(
                    language === 'pt' ? 'Pipeline reiniciado com sucesso' : 'Pipeline reset successfully',
                    'success'
                );
            } catch (err) {
                console.error('Failed to reset processes:', err);
                showToast(
                    language === 'pt' ? 'Erro ao reiniciar' : 'Failed to reset',
                    'error'
                );
            }
        }
    };

    // Remove candidate
    const handleDeleteProcess = async (id: string) => {
        if (await confirm(
            language === 'pt' ? 'Excluir Solicitação' : 'Delete Request',
            t.proposal.mobilization.deleteConfirm,
            { isDestructive: true }
        )) {
            const updated = processes.filter(p => p.id !== id);
            setProcesses(updated);
            if (selectedProcessId === id && updated.length > 0) {
                setSelectedProcessId(updated[0].id);
            } else if (updated.length === 0) {
                setSelectedProcessId(null);
            }
            showToast(
                language === 'pt' ? 'Solicitação excluída' : 'Request deleted',
                'success'
            );
        }
    };

    const isSubmitDisabled = () => {
        if (requestType === 'Recruitment') {
            if (!newRequest.candidateName || !newRequest.candidateEmail) return true;
            if (newRequest.workerType === 'Contractor') {
                return !amUploadState.candidateId.uploaded || !amUploadState.fitnessCert.uploaded;
            }
            return false;
        } else if (requestType === 'PersonnelAccess') {
            if (!newRequest.candidateName || !newRequest.candidateEmail) return true;
            return !amUploadState.candidateId.uploaded;
        } else if (requestType === 'DeliveryAccess') {
            if (!newRequest.candidateName || !newRequest.candidatePhone || !truckModel || !truckRegNumber || !poNumber) return true;
            return !amUploadState.driverLicense.uploaded;
        } else if (requestType === 'EquipmentAccess') {
            if (!equipmentId || !respPersonName) return true;
            
            const manifestoOk = !isVehicleType(equipmentType) || amUploadState.manifesto.uploaded;
            return !amUploadState.insurance.uploaded || 
                   !manifestoOk ||
                   !amUploadState.photoFront.uploaded ||
                   !amUploadState.photoRight.uploaded ||
                   !amUploadState.photoLeft.uploaded ||
                   !amUploadState.photoBack.uploaded;
        }
        return true;
    };

    const getSubmitButtonLabel = () => {
        if (requestType === 'Recruitment') {
            if (newRequest.workerType === 'Contractor' && (!amUploadState.candidateId.uploaded || !amUploadState.fitnessCert.uploaded)) {
                return '⚠ Upload Documents First';
            }
        } else if (requestType === 'PersonnelAccess') {
            if (!amUploadState.candidateId.uploaded) {
                return '⚠ Upload ID Document First';
            }
        } else if (requestType === 'DeliveryAccess') {
            if (!newRequest.candidateName || !newRequest.candidatePhone || !truckModel || !truckRegNumber || !poNumber) {
                return '⚠ Fill All Fields';
            }
            if (!amUploadState.driverLicense.uploaded) {
                return '⚠ Upload Driver\'s License First';
            }
        } else if (requestType === 'EquipmentAccess') {
            const manifestoOk = !isVehicleType(equipmentType) || amUploadState.manifesto.uploaded;
            const missing = !amUploadState.insurance.uploaded || 
                            !manifestoOk ||
                            !amUploadState.photoFront.uploaded ||
                            !amUploadState.photoRight.uploaded ||
                            !amUploadState.photoLeft.uploaded ||
                            !amUploadState.photoBack.uploaded;
            if (missing) {
                return '⚠ Upload Required Documents';
            }
        }
        return 'Submit Request';
    };

    return (
        <>
            <div className="space-y-6 pb-20 animate-fade-in no-print">
            {/* Header banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-indigo-800/40">
                <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-indigo-500/10 blur-[80px] rounded-full"></div>
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg border border-indigo-400/20">
                            <Users size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase italic">{t.proposal.mobilization.title.split(' & ')[0]} <span className="text-indigo-400">& {t.proposal.mobilization.title.split(' & ')[1]}</span></h1>
                            <p className="text-indigo-300 font-bold uppercase tracking-widest text-[10px]">{t.proposal.mobilization.subtitle}</p>
                        </div>
                    </div>

                    {/* Department / View Switcher */}
                    <div className="flex flex-wrap gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800/60 shadow-inner">
                        {[
                            { id: 'AM', label: t.proposal.mobilization.tabs.AM, color: 'indigo' },
                            { id: 'HR', label: t.proposal.mobilization.tabs.HR, color: 'blue' },
                            { id: 'Security', label: t.proposal.mobilization.tabs.Security, color: 'amber' },
                            { id: 'Clinic', label: t.proposal.mobilization.tabs.Clinic, color: 'red' },
                            { id: 'Environment', label: t.proposal.mobilization.tabs.Environment, color: 'emerald' }
                        ].filter(tab => allowedTabs.includes(tab.id as any)).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                                    activeTab === tab.id 
                                    ? 'bg-indigo-600 text-white shadow-lg' 
                                    : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content Workspace Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Panel: Candidate List & Detailed Tracker */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
                        
                        {/* Panel Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <Briefcase className="text-indigo-600 dark:text-indigo-400" size={20} />
                                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">{t.proposal.mobilization.pipeline}</h3>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setIsAddRequestOpen(true)}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow hover:scale-105 transition-all flex items-center gap-1.5"
                                >
                                    <Plus size={14} /> {t.proposal.mobilization.newRequest}
                                </button>
                                <button 
                                    onClick={handleResetProcesses}
                                    className="border border-slate-200 dark:border-slate-600 text-slate-500 px-3 py-2 rounded-xl text-xs font-black uppercase hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                    title={t.proposal.mobilization.resetDemo}
                                >
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Candidate Pipeline Cards */}
                        <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                            {filteredProcesses.map(p => {
                                const bottleneck = getBottleneckInfo(p.status);
                                const stageNum = getStageNumber(p.status);
                                return (
                                    <div 
                                        key={p.id}
                                        onClick={() => setSelectedProcessId(p.id)}
                                        className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                            selectedProcessId === p.id 
                                            ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-500/50 shadow-md' 
                                            : 'bg-slate-50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg">
                                                {p.candidateName.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {p.candidateName}
                                                    {p.nudgeCount && p.nudgeCount > 0 ? (
                                                        <span className="flex items-center gap-0.5 text-[9px] bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded-full">
                                                            <BadgeAlert size={10}/> Nudged {p.nudgeCount}x
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <div className="text-xs text-slate-500 font-medium">
                                                    {p.company} • <span className="font-bold">{p.role}</span> ({p.department})
                                                </div>
                                            </div>
                                        </div>
                                                   {/* Stages Stepper Quick View */}
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                                                {(() => {
                                                    const { steps, stageNum } = getProcessTimeline(p);
                                                    const isFailed = p.status === RecruitmentStatus.FAILED;
                                                    return steps.map((s, idx) => {
                                                        const isComplete = stageNum > s.step || ((p.status === RecruitmentStatus.RECEIVED || p.status === RecruitmentStatus.COMPLETED) && s.step === steps.length);
                                                        const isActive = stageNum === s.step;
                                                        return (
                                                            <div 
                                                                key={idx} 
                                                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black font-mono transition-all ${
                                                                    isComplete 
                                                                    ? 'bg-emerald-500 text-white' 
                                                                    : isActive 
                                                                    ? isFailed ? 'bg-red-500 text-white shadow' : 'bg-indigo-600 text-white animate-pulse' 
                                                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                                                                }`}
                                                                title={s.title}
                                                            >
                                                                {s.step}
                                                            </div>
                                                        );
                                                    });
                                                })()}
                                            </div>
                                            <div className="text-right flex flex-col items-end">
                                                {/* Status & Bottleneck Indicator */}
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${bottleneck.bg}`}>
                                                    {p.status === RecruitmentStatus.RECEIVED ? (t.proposal.mobilization.statuses['Received'] || 'Mobilized') : bottleneck.dept}
                                                </span>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                    {p.status === RecruitmentStatus.RECEIVED ? (t.proposal.mobilization.steps?.onsite || 'Onsite') : `${t.proposal.mobilization.steps?.current || 'Current'}: ${translateStatus(p.status)}`}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredProcesses.length === 0 && (
                                <div className="p-12 text-center text-slate-400">
                                    <Briefcase size={48} className="mx-auto mb-4 opacity-25"/>
                                    <p className="font-bold">{t.proposal.mobilization.steps?.noActiveRecruitment || 'No active recruitment processes in the system.'}</p>
                                    <p className="text-xs mt-1">{t.proposal.mobilization.steps?.clickNewRequest || 'Click "New Request" to initiate a process.'}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stage Tracker & Visual Workflow Details */}
                    {activeProcess && (
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-8">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.proposal.mobilization.steps?.timelineStepper || 'Onboarding Timeline & Stepper'}</h4>
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{(t.proposal.mobilization.steps?.candidateLabel || 'Candidate') + ': ' + activeProcess.candidateName}</p>
                                </div>
                                <button aria-label="Remove process" title="Remove process" onClick={() => handleDeleteProcess(activeProcess.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    <UserMinus size={18} />
                                </button>
                            </div>

                            {/* Detailed Step Progression Graph */}
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-2 relative">
                                {(() => {
                                    const { steps, stageNum } = getProcessTimeline(activeProcess);
                                    const isFailed = activeProcess.status === RecruitmentStatus.FAILED;
                                    return steps.map((s, idx) => {
                                        const isComplete = stageNum > s.step || ((activeProcess.status === RecruitmentStatus.RECEIVED || activeProcess.status === RecruitmentStatus.COMPLETED) && s.step === steps.length);
                                        const isActive = stageNum === s.step;
                                        
                                        return (
                                            <div key={idx} className="flex flex-col items-center text-center relative space-y-3 flex-1">
                                                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-black transition-all ${
                                                    isFailed && isActive
                                                    ? 'bg-red-500 border-red-500 text-white ring-4 ring-red-500/20 shadow'
                                                    : isComplete 
                                                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' 
                                                    : isActive 
                                                    ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse shadow-lg ring-4 ring-indigo-500/20' 
                                                    : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                                                }`}>
                                                    {isComplete ? <Check size={20}/> : s.step}
                                                </div>
                                                <div>
                                                    <div className={`text-xs font-black uppercase ${isActive ? (isFailed ? 'text-red-500' : 'text-indigo-600 dark:text-indigo-400') : 'text-slate-700 dark:text-slate-300'}`}>{s.title}</div>
                                                    <div className="text-[9px] text-slate-400 font-medium leading-tight mt-0.5">{s.desc}</div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>

                            {/* Action Card specific to AM view (Bottleneck Analysis) */}
                            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-1">
                                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Active Bottleneck Department</div>
                                    {activeProcess.status === RecruitmentStatus.RECEIVED ? (
                                        <div className="text-emerald-500 font-black text-lg flex items-center gap-2">
                                            <ShieldCheck size={22}/> Complete! Employee is active and onsite.
                                        </div>
                                    ) : (
                                        <div className="text-slate-800 dark:text-white font-black text-lg flex items-center gap-2">
                                            <Clock className="text-indigo-500" size={20}/>
                                            Pending: <span className="text-indigo-600 dark:text-indigo-400">{getBottleneckInfo(activeProcess.status).role}</span>
                                        </div>
                                    )}
                                    <p className="text-xs text-slate-500 leading-normal max-w-md">
                                        The onboarding process automatically pauses here until the responsible specialist processes their department approvals.
                                    </p>
                                </div>
                                {activeProcess.status !== RecruitmentStatus.RECEIVED && (
                                    <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-center">
                                        {activeProcess.requestType === 'DeliveryAccess' && activeProcess.status === RecruitmentStatus.DELIVERING ? (
                                            <button 
                                                onClick={() => handleConfirmDeliveryFinished(activeProcess.id)}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Check size={14}/> Confirm Delivery Finished
                                            </button>
                                        ) : activeProcess.status !== RecruitmentStatus.COMPLETED && (
                                            <button 
                                                onClick={() => handleNudge(activeProcess.id)}
                                                className="bg-red-500 hover:bg-red-600 text-white font-black text-xs uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg shadow-red-500/10 hover:shadow-red-500/20 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Send size={14}/> Nudge Department
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Functional Dashboards & simulated notifications */}
                <div className="lg:col-span-4 space-y-6">
                    
                    {/* Active Dashboard panel depending on functional tab */}
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        
                        {/* Tab Indicator */}
                        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex items-center gap-3">
                            <span className="w-3.5 h-3.5 rounded-full bg-indigo-500 animate-ping"></span>
                            <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-xs">
                                {activeTab === 'AM' && 'Area Manager Portal'}
                                {activeTab === 'HR' && 'HR Document Review'}
                                {activeTab === 'Security' && 'Security Access Desk'}
                                {activeTab === 'Clinic' && 'Occupational Clinic'}
                                {activeTab === 'Environment' && 'HSE Induction Portal'}
                            </h4>
                        </div>

                        <div className="p-6">
                            {/* --- AREA MANAGER PANEL --- */}
                            {activeTab === 'AM' && (
                                <div className="space-y-5">
                                    {/* Pipeline Analytics Charts */}
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <BarChart2 size={15} className="text-indigo-500" />
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pipeline Overview</span>
                                        </div>
                                        {[
                                            { label: 'Requisition', status: RecruitmentStatus.AM_REQUESTED, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
                                            { label: 'HR Docs', status: RecruitmentStatus.HR_PENDING, color: 'bg-indigo-500', textColor: 'text-indigo-600 dark:text-indigo-400' },
                                            { label: 'Security', status: RecruitmentStatus.SECURITY_PENDING, color: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
                                            { label: 'Clinic', status: RecruitmentStatus.CLINIC_PENDING, color: 'bg-red-500', textColor: 'text-red-600 dark:text-red-400' },
                                            { label: 'Induction', status: RecruitmentStatus.INDUCTION_PENDING, color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400' },
                                            { label: 'Training', status: RecruitmentStatus.TRAINING_PENDING, color: 'bg-violet-500', textColor: 'text-violet-600 dark:text-violet-400' },
                                            { label: 'Mobilized', status: RecruitmentStatus.RECEIVED, color: 'bg-slate-400', textColor: 'text-slate-500 dark:text-slate-400' },
                                        ].map(({ label, status, color, textColor }) => {
                                            const count = processes.filter(p => p.status === status).length;
                                            const pct = processes.length > 0 ? Math.round((count / processes.length) * 100) : 0;
                                            return (
                                                <div key={status} className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase w-14 shrink-0">{label}</span>
                                                    <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div className={`h-full rounded-full transition-all duration-700 ${color} w-pct-${pct}`} />
                                                    </div>
                                                    <span className={`text-[10px] font-black w-5 text-right ${count > 0 ? textColor : 'text-slate-300 dark:text-slate-600'}`}>{count}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Summary Stats row */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { label: 'Total', value: processes.length, color: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/40' },
                                            { label: 'Active', value: processes.filter(p => p.status !== RecruitmentStatus.RECEIVED).length, color: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/40' },
                                            { label: 'Mobilized', value: processes.filter(p => p.status === RecruitmentStatus.RECEIVED).length, color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' },
                                        ].map((s, i) => (
                                            <div key={i} className={`rounded-xl border p-3 text-center ${s.color}`}>
                                                <div className="text-xl font-black">{s.value}</div>
                                                <div className="text-[9px] font-black uppercase tracking-widest opacity-70">{s.label}</div>
                                            </div>
                                        ))}
                                    </div>

                                    {activeProcess && activeProcess.status === RecruitmentStatus.COMPLETED && (
                                        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 p-5 rounded-2xl space-y-4">
                                            <div className="flex gap-3 text-emerald-800 dark:text-emerald-400">
                                                <ShieldCheck size={20} className="shrink-0"/>
                                                <div>
                                                    <div className="font-bold text-sm">Onboarding Complete!</div>
                                                    <div className="text-xs">RAC certifications and medical fit tests passed. Ready for site receipt.</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleConfirmReceipt(activeProcess.id)}
                                                    className="flex-1 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow"
                                                >
                                                    Confirm Receipt
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {activeProcess && activeProcess.status === RecruitmentStatus.RECEIVED && (
                                        <div className="space-y-3">
                                            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold text-center">
                                                ✓ Onboarding completed. Recipient has arrived on-site.
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDownloadStagesReport(activeProcess.id)}
                                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl transition-colors shadow flex items-center justify-center gap-2"
                                            >
                                                <Download size={14}/> Download Stages Report
                                            </button>
                                        </div>
                                    )}

                                    <button 
                                        onClick={() => setIsAddRequestOpen(true)}
                                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
                                    >
                                        <Plus size={18}/> Request New Recruitment
                                    </button>
                                </div>
                            )}

                            {/* --- HR DASHBOARD --- */}
                            {activeTab === 'HR' && (
                                <div className="space-y-6">
                                    {!activeProcess || (activeProcess.status !== RecruitmentStatus.AM_REQUESTED && activeProcess.status !== RecruitmentStatus.HR_PENDING) ? (
                                        <div className="text-center p-8 text-slate-400 text-xs">
                                            <Info size={32} className="mx-auto mb-2 opacity-30" />
                                            No candidates currently pending HR review or acceptance. Select a candidate with "AM Requested" or "HR Pending" status in the list.
                                        </div>
                                    ) : activeProcess.status === RecruitmentStatus.AM_REQUESTED ? (
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <h5 className="font-bold text-sm text-slate-800 dark:text-white uppercase">{activeProcess.candidateName}</h5>
                                                <p className="text-[10px] text-amber-500 uppercase font-black tracking-widest">New Onboarding Requisition</p>
                                            </div>

                                            {/* AM Documents — read-only for HR review */}
                                            {activeProcess.amDocuments && activeProcess.amDocuments.length > 0 && (
                                                <div className="space-y-2 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                                                    <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <FileCheck size={12} /> AM-Uploaded Documents (Read-Only)
                                                    </div>
                                                    {activeProcess.amDocuments.map((doc, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                                            <div className="flex items-center gap-2">
                                                                <FileScan size={13} className="text-blue-500 shrink-0" />
                                                                <div>
                                                                    <div className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate max-w-[130px]">{doc.name}</div>
                                                                    <div className="text-[9px] text-slate-400">{doc.type} · {doc.fileSize}</div>
                                                                </div>
                                                            </div>
                                                            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                                                <Check size={9}/> Verified
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Requisition details</div>
                                                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="text-slate-500 font-bold">Company:</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black">{activeProcess.company}</span>
                                                </div>
                                                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="text-slate-500 font-bold">Department:</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black">{activeProcess.department}</span>
                                                </div>
                                                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="text-slate-500 font-bold">Role:</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black">{activeProcess.role}</span>
                                                </div>
                                                <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                                                    <span className="text-slate-500 font-bold">Requested By:</span>
                                                    <span className="text-slate-800 dark:text-slate-200 font-black">{activeProcess.requestedBy}</span>
                                                </div>
                                                <div className="flex justify-between py-1.5">
                                                    <span className="text-slate-500 font-bold">Required RACs:</span>
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-black">{activeProcess.requiredRacs.join(', ') || 'None'}</span>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleAcceptRequisition(activeProcess.id)}
                                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all animate-pulse"
                                            >
                                                <CheckCircle2 size={18}/> Accept Requisition & Start Onboarding
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <h5 className="font-bold text-sm text-slate-800 dark:text-white uppercase">{activeProcess.candidateName}</h5>
                                                <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">{activeProcess.role}</p>
                                            </div>

                                            {/* AM Documents — read-only for HR */}
                                            {activeProcess.amDocuments && activeProcess.amDocuments.length > 0 && (
                                                <div className="space-y-2 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                                                    <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <FileCheck size={12} /> AM-Uploaded Documents
                                                    </div>
                                                    {activeProcess.amDocuments.map((doc, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                                            <div className="flex items-center gap-2">
                                                                <FileScan size={13} className="text-blue-500 shrink-0" />
                                                                <div>
                                                                    <div className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate max-w-[130px]">{doc.name}</div>
                                                                    <div className="text-[9px] text-slate-400">{doc.type} · {doc.fileSize}</div>
                                                                </div>
                                                            </div>
                                                            <span className="text-[9px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                                                <Check size={9}/> AM Verified
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* HR Document checklist — enforces National ID */}
                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">HR Document Verification</div>
                                                
                                                {[
                                                    { key: 'id' as const, label: 'National ID card', typeMapped: 'ID', required: true },
                                                    { key: 'passport' as const, label: 'Valid Passport', typeMapped: 'Passport', required: false },
                                                    { key: 'permit' as const, label: 'Work Permit (Dire)', typeMapped: 'Work Permit', required: false }
                                                ].map(doc => {
                                                    const isUploaded = (activeProcess.documents || []).some(d => d.type === doc.typeMapped);
                                                    return (
                                                        <div key={doc.key} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{doc.label}</span>
                                                                {doc.required && <span className="text-[9px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded font-black uppercase">Required</span>}
                                                            </div>
                                                            {isUploaded ? (
                                                                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-black uppercase flex items-center gap-1"><Check size={10}/> Uploaded</span>
                                                            ) : (
                                                                <button 
                                                                    onClick={() => handleSimulateUpload(activeProcess.id, doc.key)}
                                                                    disabled={hrUploading[doc.key]}
                                                                    className="text-[9px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded-lg font-black uppercase border border-indigo-100 transition-colors"
                                                                >
                                                                    {hrUploading[doc.key] ? 'Uploading...' : 'Upload'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <button 
                                                onClick={() => handleCompleteHR(activeProcess.id)}
                                                disabled={!(activeProcess.documents || []).some(d => d.type === 'ID')}
                                                className="w-full bg-slate-950 text-white dark:bg-indigo-600 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                                            >
                                                {!(activeProcess.documents || []).some(d => d.type === 'ID') 
                                                    ? '⚠ Upload National ID to Proceed'
                                                    : 'Complete HR Phase'
                                                }
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- SECURITY DASHBOARD --- */}
                            {activeTab === 'Security' && (
                                <div className="space-y-6">
                                    {!activeProcess || (
                                        activeProcess.status !== RecruitmentStatus.SECURITY_PENDING &&
                                        activeProcess.status !== RecruitmentStatus.PARALLEL_CLEARANCE_PENDING
                                    ) ? (
                                        <div className="text-center p-8 text-slate-400 text-xs">
                                            <Info size={32} className="mx-auto mb-2 opacity-30" />
                                            No candidates currently pending temporary access badges.
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            <div className="space-y-1">
                                                <h5 className="font-bold text-sm text-slate-800 dark:text-white uppercase">{activeProcess.candidateName}</h5>
                                                <p className="text-[10px] text-amber-500 uppercase font-black tracking-widest">{activeProcess.company}</p>
                                            </div>

                                            {/* Parallel clearance banner for contractors */}
                                            {activeProcess.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING && (
                                                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-4 space-y-3">
                                                    <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                                                        <Zap size={14} className="shrink-0" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Parallel Contractor Clearance</span>
                                                    </div>
                                                    <p className="text-[10px] text-orange-700 dark:text-orange-300 leading-relaxed">
                                                        This is a <strong>Contractor</strong> onboarding. Security and Clinic are clearing this candidate simultaneously. Both departments must complete before Induction begins.
                                                    </p>
                                                    <div className="flex gap-3 mt-2">
                                                        <div className={`flex-1 rounded-xl p-2.5 text-center text-[9px] font-black uppercase ${activeProcess.securityCleared ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'}`}>
                                                            🔐 Security: {activeProcess.securityCleared ? '✓ Done' : 'Pending'}
                                                        </div>
                                                        <div className={`flex-1 rounded-xl p-2.5 text-center text-[9px] font-black uppercase ${activeProcess.clinicFitnessCleared ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-red-100 dark:bg-red-900/30 text-red-700'}`}>
                                                            🏥 Clinic: {activeProcess.clinicFitnessCleared ? '✓ Done' : 'Pending'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {activeProcess.temporaryBadgeNumber ? (
                                                <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl p-4 text-center">
                                                    <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Badge Issued</div>
                                                    <div className="text-xl font-black text-emerald-700 dark:text-emerald-400">{activeProcess.temporaryBadgeNumber}</div>
                                                    <div className="text-[9px] text-emerald-500 mt-1">Access Granted — Awaiting Clinic</div>
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Temporary Badge ID</label>
                                                    <input 
                                                        type="text" 
                                                        placeholder="e.g. TEMP-ACCESS-5509"
                                                        value={badgeNo}
                                                        onChange={e => setBadgeNo(e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-sm font-bold outline-none focus:border-amber-500 transition-all"
                                                    />
                                                    <button 
                                                        onClick={() => handleIssueBadge(activeProcess.id)}
                                                        className="w-full bg-amber-500 text-slate-950 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/10 hover:bg-amber-400 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <ShieldCheck size={16}/> Issue Badge &amp; Grant Access
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- CLINIC DASHBOARD --- */}
                            {activeTab === 'Clinic' && (() => {
                                const isContractorParallel = activeProcess?.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING;
                                const isPrimePending = activeProcess?.status === RecruitmentStatus.CLINIC_PENDING;
                                const showClinic = activeProcess && (isContractorParallel || isPrimePending);
                                return (
                                <div className="space-y-6">
                                    {!showClinic ? (
                                        <div className="text-center p-8 text-slate-400 text-xs">
                                            <Info size={32} className="mx-auto mb-2 opacity-30" />
                                            No candidates currently pending vital health exams.
                                        </div>
                                    ) : (
                                        <div className="space-y-5">
                                            <div className="space-y-1">
                                                <h5 className="font-bold text-sm text-slate-800 dark:text-white uppercase">{activeProcess!.candidateName}</h5>
                                                <p className={`text-[10px] uppercase font-black tracking-widest ${isContractorParallel ? 'text-orange-500' : 'text-red-500'}`}>
                                                    {isContractorParallel ? '⚡ Contractor Fitness Verification' : 'Medical Verification'}
                                                </p>
                                            </div>

                                            {/* Parallel status for contractors */}
                                            {isContractorParallel && (
                                                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl p-4">
                                                    <div className="flex gap-3">
                                                        <div className={`flex-1 rounded-xl p-2.5 text-center text-[9px] font-black uppercase ${activeProcess!.securityCleared ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'}`}>
                                                            🔐 Security: {activeProcess!.securityCleared ? '✓ Done' : 'Pending'}
                                                        </div>
                                                        <div className={`flex-1 rounded-xl p-2.5 text-center text-[9px] font-black uppercase ${activeProcess!.clinicFitnessCleared ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700' : 'bg-red-100 dark:bg-red-900/30 text-red-700'}`}>
                                                            🏥 Clinic: {activeProcess!.clinicFitnessCleared ? '✓ Done' : 'Pending'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* AM Documents visible to Clinic */}
                                            {activeProcess!.amDocuments && activeProcess!.amDocuments.length > 0 && (
                                                <div className="space-y-2 bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/40">
                                                    <div className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                                        <FileScan size={12} /> Pre-Employment Documents (AM Submitted)
                                                    </div>
                                                    {activeProcess!.amDocuments.map((doc, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-rose-100 dark:border-rose-900/30">
                                                            <div className="flex items-center gap-2">
                                                                <FileCheck size={13} className={doc.type === 'Fitness Certificate' ? 'text-rose-500' : 'text-slate-400'} />
                                                                <div>
                                                                    <div className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate max-w-[130px]">{doc.name}</div>
                                                                    <div className="text-[9px] text-slate-400">{doc.type} · {doc.fileSize}</div>
                                                                </div>
                                                            </div>
                                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black flex items-center gap-1 ${
                                                                doc.type === 'Fitness Certificate'
                                                                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                                                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                                            }`}>
                                                                <Check size={9}/> {doc.type === 'Fitness Certificate' ? 'Fitness Cert' : 'ID Verified'}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* If clinic already done, show the generated certificate */}
                                            {activeProcess!.fitnessCertificate && (
                                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                                                            <FileCheck size={16}/>
                                                            <span className="text-xs font-black uppercase tracking-widest">Fitness Certificate Issued</span>
                                                        </div>
                                                        <span className="text-[9px] bg-emerald-600 text-white px-2 py-1 rounded-full font-black">
                                                            {activeProcess!.fitnessCertificate.certificateNo}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                        <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                                            <div className="text-slate-400 font-bold">BP</div>
                                                            <div className="font-black">{activeProcess!.fitnessCertificate.bloodPressure}</div>
                                                        </div>
                                                        <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                                            <div className="text-slate-400 font-bold">HR</div>
                                                            <div className="font-black">{activeProcess!.fitnessCertificate.heartRate} bpm</div>
                                                        </div>
                                                        <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                                            <div className="text-slate-400 font-bold">Vision</div>
                                                            <div className={`font-black ${activeProcess!.fitnessCertificate.visionTest === 'Pass' ? 'text-emerald-600' : 'text-red-600'}`}>{activeProcess!.fitnessCertificate.visionTest}</div>
                                                        </div>
                                                        <div className="bg-white dark:bg-slate-800 rounded-lg p-2">
                                                            <div className="text-slate-400 font-bold">Drug Screen</div>
                                                            <div className={`font-black ${activeProcess!.fitnessCertificate.drugScreen === 'Negative' ? 'text-emerald-600' : 'text-red-600'}`}>{activeProcess!.fitnessCertificate.drugScreen}</div>
                                                        </div>
                                                    </div>
                                                    <div className={`text-center py-2 rounded-xl font-black text-sm ${activeProcess!.fitnessCertificate.fitForWork ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
                                                        {activeProcess!.fitnessCertificate.fitForWork ? '✓ FIT FOR WORK' : '✗ NOT FIT FOR WORK'}
                                                    </div>
                                                    <div className="text-[9px] text-emerald-600 text-center">
                                                        Valid until: {new Date(activeProcess!.fitnessCertificate.validUntil).toLocaleDateString()}
                                                        &nbsp;·&nbsp;Issued by: {activeProcess!.fitnessCertificate.issuedBy}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Medical form — only show if not yet cleared */}
                                            {!activeProcess!.clinicFitnessCleared && (
                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Vital Signs &amp; Examination</div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Blood Pressure</label>
                                                        <input type="text" aria-label="Blood Pressure" placeholder="120/80" value={medBP} onChange={e => setMedBP(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Heart Rate (bpm)</label>
                                                        <input type="number" aria-label="Heart Rate" placeholder="72" value={medHR} onChange={e => setMedHR(Number(e.target.value))} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Vision Test</label>
                                                        <select aria-label="Vision Test" value={medVision} onChange={e => setMedVision(e.target.value as any)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold">
                                                            <option>Pass</option><option>Fail</option>
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Drug Screen</label>
                                                        <select aria-label="Drug Screen" value={medDrugs} onChange={e => setMedDrugs(e.target.value as any)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold">
                                                            <option>Negative</option><option>Positive</option>
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Extended contractor-specific fields */}
                                                {isContractorParallel && (
                                                    <>
                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div>
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">BMI</label>
                                                                <input type="text" placeholder="e.g. 22.5" value={medBMI} onChange={e => setMedBMI(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Hearing</label>
                                                                <select aria-label="Hearing" value={medHearing} onChange={e => setMedHearing(e.target.value as any)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold">
                                                                    <option>Normal</option><option>Impaired</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Musculo.</label>
                                                                <select aria-label="Musculoskeletal" value={medMusculo} onChange={e => setMedMusculo(e.target.value as any)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold">
                                                                    <option>Normal</option><option>Impaired</option>
                                                                </select>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Restrictions (if any)</label>
                                                            <input type="text" placeholder="e.g. No heavy lifting" value={medRestrictions} onChange={e => setMedRestrictions(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold" />
                                                        </div>
                                                    </>
                                                )}

                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Fit for Work?</label>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setMedFit(true)} className={`flex-1 py-2 rounded-lg text-xs font-black border transition-all ${medFit ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>✓ FIT</button>
                                                        <button onClick={() => setMedFit(false)} className={`flex-1 py-2 rounded-lg text-xs font-black border transition-all ${!medFit ? 'bg-red-600 text-white border-red-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>✗ NOT FIT</button>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Comments</label>
                                                    <textarea value={medComments} onChange={e => setMedComments(e.target.value)} rows={2} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold resize-none" placeholder="Clinical notes..." />
                                                </div>

                                                {!isContractorParallel && (
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Scheduled Induction Date</label>
                                                        <input type="date" aria-label="Scheduled Induction Date" title="Scheduled Induction Date" value={inductionDate} onChange={e => setInductionDate(e.target.value)} className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            )}

                                            {!activeProcess!.clinicFitnessCleared && (
                                            <button 
                                                onClick={() => handleCompleteClinic(activeProcess!.id, isContractorParallel)}
                                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
                                                    isContractorParallel 
                                                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                                }`}
                                            >
                                                {isContractorParallel ? '🏥 Issue Fitness Certificate' : 'Cleared — Book Induction'}
                                            </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                );
                            })()}

                            {/* --- ENVIRONMENT PORTAL --- */}
                            {activeTab === 'Environment' && (
                                <div className="space-y-6">
                                    {!activeProcess || activeProcess.status !== RecruitmentStatus.INDUCTION_PENDING ? (
                                        <div className="text-center p-8 text-slate-400 text-xs">
                                            <Info size={32} className="mx-auto mb-2 opacity-30" />
                                            No candidates currently awaiting environmental and safety induction.
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="space-y-1">
                                                <h5 className="font-bold text-sm text-slate-800 dark:text-white uppercase">{activeProcess.candidateName}</h5>
                                                <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest">Scheduled Date: {activeProcess.inductionDate}</p>
                                            </div>

                                            {/* Induction checklists */}
                                            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Induction Sign-off list</div>
                                                
                                                {[
                                                    { state: indGeneral, setState: setIndGeneral, label: 'General Site Safety Orientation' },
                                                    { state: indEnv, setState: setIndEnv, label: 'Environmental Rules & Waste' },
                                                    { state: indEvac, setState: setIndEvac, label: 'Emergency Evacuation Assembly' },
                                                    { state: indPPE, setState: setIndPPE, label: 'Personal Protective Equipment Check' }
                                                ].map((item, idx) => (
                                                    <div 
                                                        key={idx}
                                                        onClick={() => item.setState(!item.state)}
                                                        className="flex items-center gap-3 cursor-pointer p-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors"
                                                    >
                                                        {item.state ? (
                                                            <CheckSquare className="text-emerald-500" size={18} />
                                                        ) : (
                                                            <Square className="text-slate-300 dark:text-slate-600" size={18} />
                                                        )}
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                                                    </div>
                                                ))}
                                            </div>

                                            <button 
                                                onClick={() => handleConfirmInduction(activeProcess.id)}
                                                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                            >
                                                Certify Induction Complete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Simulation tools for RACS Training stage */}
                    {activeProcess && activeProcess.status === RecruitmentStatus.TRAINING_PENDING && (
                        <div className="bg-[#0f172a] border border-[#1e293b] rounded-[2.5rem] p-6 text-white space-y-4 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5"><RefreshCw size={100} /></div>
                            <div className="flex items-center gap-3">
                                <Clock className="text-indigo-400" size={20}/>
                                <h5 className="font-bold text-xs uppercase tracking-wider text-indigo-400">CARS System Interfacing</h5>
                            </div>
                            <p className="text-xs text-slate-400 leading-normal">
                                Recruit is awaiting compliance training for: <span className="font-bold text-slate-200">{activeProcess.requiredRacs.join(', ') || 'N/A'}</span>.
                            </p>
                            <button 
                                onClick={() => handleSimulateTraining(activeProcess.id)}
                                className="w-full bg-indigo-600 text-white font-black text-xs uppercase tracking-widest py-3.5 rounded-xl hover:bg-indigo-500 shadow-md hover:shadow-lg transition-all"
                            >
                                Simulate CARS RACS Passed
                            </button>
                        </div>
                    )}

                    {/* Exporter for completed onboarding process */}
                    {activeProcess && (activeProcess.status === RecruitmentStatus.COMPLETED || activeProcess.status === RecruitmentStatus.RECEIVED) && (
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <Download size={18}/>
                                <h5 className="font-black text-xs uppercase tracking-wide">Credential Certificate</h5>
                            </div>
                            
                            {/* Certificate Preview Card */}
                            <div className="border border-slate-100 dark:border-slate-700 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 font-mono text-[10px] space-y-3 relative overflow-hidden select-none">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><ShieldCheck size={60} /></div>
                                <div className="text-center font-bold border-b border-dashed border-slate-200 dark:border-slate-700 pb-2 text-[11px]">
                                    CARS ONBOARDING COMPLIANCE
                                </div>
                                <div className="space-y-1">
                                    <div>NAME: {activeProcess.candidateName}</div>
                                    <div>COMP: {activeProcess.company}</div>
                                    <div>ROLE: {activeProcess.role}</div>
                                    <div>DEPT: {activeProcess.department}</div>
                                    <div>BADGE: {activeProcess.temporaryBadgeNumber}</div>
                                </div>
                                <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-2 space-y-0.5">
                                    <div className="text-emerald-500">✓ HR IDENTITY: VERIFIED</div>
                                    <div className="text-emerald-500">✓ BADGE ACCESS: ENROLLED</div>
                                    <div className="text-emerald-500">✓ CLINIC VITALS: PASSED</div>
                                    <div className="text-emerald-500">✓ HSE INDUCTION: PASSED</div>
                                    <div className="text-emerald-500">✓ RAC CODES: PASSED ({activeProcess.requiredRacs.join(', ')})</div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    window.print();
                                }}
                                className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-slate-800"
                            >
                                <Download size={14}/> Exporter (Print Credential)
                            </button>
                        </div>
                    )}

                </div>

            </div>

            {/* ADD CANDIDATE REQUEST FORM MODAL */}
            {isAddRequestOpen && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
                    <form onSubmit={handleCreateRequest} className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                {requestType === 'Recruitment' && 'Request Recruitment'}
                                {requestType === 'PersonnelAccess' && 'Request Personnel Access'}
                                {requestType === 'EquipmentAccess' && 'Request Equipment Access'}
                            </h3>
                            <button type="button" aria-label="Close request form" title="Close request form" onClick={() => setIsAddRequestOpen(false)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><UserMinus size={24} /></button>
                        </div>
                        
                        <div className="p-8 space-y-5 max-h-[450px] overflow-y-auto">
                            {/* Request Type Selector */}
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Request Type</label>
                                <div className="flex rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-700">
                                    {[
                                        { id: 'Recruitment', label: 'Recruitment' },
                                        { id: 'PersonnelAccess', label: 'Personnel' },
                                        { id: 'EquipmentAccess', label: 'Equipment' },
                                        { id: 'DeliveryAccess', label: 'Delivery' }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => {
                                                const targetType = t.id as any;
                                                setRequestType(targetType);
                                                resetAmUploads();
                                                if (targetType === 'Recruitment') {
                                                    setRequiresMedical(true);
                                                    setRequiresInduction(true);
                                                    setRequiresRac(true);
                                                } else {
                                                    setRequiresMedical(false);
                                                    setRequiresInduction(false);
                                                    setRequiresRac(false);
                                                }
                                            }}
                                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider transition-all ${
                                                requestType === t.id
                                                ? 'bg-indigo-600 text-white shadow-inner'
                                                : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {requestType === 'Recruitment' || requestType === 'PersonnelAccess' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                                {requestType === 'PersonnelAccess' ? 'Person Name' : 'Candidate Name'}
                                            </label>
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder={requestType === 'PersonnelAccess' ? 'e.g. Joaquim Chissano' : 'e.g. Mateus Nhaca'}
                                                value={newRequest.candidateName}
                                                onChange={e => setNewRequest({...newRequest, candidateName: e.target.value})}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Email Address</label>
                                            <input 
                                                required 
                                                type="email" 
                                                placeholder="candidate@work.com"
                                                value={newRequest.candidateEmail}
                                                onChange={e => setNewRequest({...newRequest, candidateEmail: e.target.value})}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Phone Number */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Phone Number</label>
                                        <input 
                                            type="text" 
                                            placeholder="+258 84..."
                                            value={newRequest.candidatePhone}
                                            onChange={e => setNewRequest({...newRequest, candidatePhone: e.target.value})}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                        />
                                    </div>

                                    {/* Worker Type + Company */}
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Worker Type</label>
                                            <div className="flex rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-700">
                                                {(['Prime', 'Contractor'] as const).map(wt => (
                                                    <button
                                                        key={wt}
                                                        type="button"
                                                        onClick={() => setNewRequest({ ...newRequest, workerType: wt, contractorCompany: '' })}
                                                        className={`flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all ${
                                                            newRequest.workerType === wt
                                                            ? wt === 'Prime'
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-amber-500 text-white'
                                                            : 'bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600'
                                                        }`}
                                                    >
                                                        {wt === 'Prime' ? '🏢 Prime Employee' : '🤝 Contractor'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Prime Company</label>
                                            <select
                                                aria-label="Prime Company"
                                                value={newRequest.primeCompany}
                                                onChange={e => setNewRequest({ ...newRequest, primeCompany: e.target.value })}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            >
                                                {primeList.map(c => <option key={c}>{c}</option>)}
                                            </select>
                                        </div>

                                        {newRequest.workerType === 'Contractor' && (
                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Contractor Company</label>
                                                <select
                                                    aria-label="Contractor Company"
                                                    required
                                                    value={newRequest.contractorCompany}
                                                    onChange={e => setNewRequest({ ...newRequest, contractorCompany: e.target.value })}
                                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-amber-500 transition-all"
                                                >
                                                    <option value="">— Select Contractor —</option>
                                                    {contractorList.map(c => <option key={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Department</label>
                                            <select 
                                                aria-label="Department"
                                                value={newRequest.department}
                                                onChange={e => setNewRequest({...newRequest, department: e.target.value})}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            >
                                                <option>Mine Operations</option>
                                                <option>Plant Maintenance</option>
                                                <option>HSE</option>
                                                <option>Logistics</option>
                                                <option>Administration</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">
                                                {requestType === 'PersonnelAccess' ? 'Purpose of Access' : 'Job Role'}
                                            </label>
                                            <input 
                                                type="text" 
                                                placeholder={requestType === 'PersonnelAccess' ? 'e.g. Visitor, Audit, Tech Support' : 'e.g. Haul Truck Driver'}
                                                value={newRequest.role}
                                                onChange={e => setNewRequest({...newRequest, role: e.target.value})}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {requestType === 'Recruitment' && (
                                        <>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Workflow Stages Required</label>
                                                <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={requiresMedical}
                                                            onChange={e => setRequiresMedical(e.target.checked)}
                                                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                                                        />
                                                        Medical Exam
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={requiresInduction}
                                                            onChange={e => setRequiresInduction(e.target.checked)}
                                                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                                                        />
                                                        HSE Induction
                                                    </label>
                                                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={requiresRac}
                                                            onChange={e => setRequiresRac(e.target.checked)}
                                                            className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" 
                                                        />
                                                        RAC Training
                                                    </label>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-3 block">Required RAC Training Modules</label>
                                                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    {AVAILABLE_RACS.map(rac => {
                                                        const isSelected = newRequest.requiredRacs.includes(rac.code);
                                                        return (
                                                            <div 
                                                                key={rac.code}
                                                                onClick={() => {
                                                                    const updated = isSelected 
                                                                        ? newRequest.requiredRacs.filter(r => r !== rac.code) 
                                                                        : [...newRequest.requiredRacs, rac.code];
                                                                    setNewRequest({...newRequest, requiredRacs: updated});
                                                                }}
                                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs font-bold ${
                                                                    isSelected 
                                                                    ? 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400' 
                                                                    : 'hover:bg-white dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-transparent'
                                                                }`}
                                                            >
                                                                <input type="checkbox" aria-label={rac.name} checked={isSelected} readOnly className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500" />
                                                                <span>{rac.code}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            ) : requestType === 'DeliveryAccess' ? (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Driver Name</label>
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder="e.g. John Doe"
                                                value={newRequest.candidateName}
                                                onChange={e => setNewRequest({...newRequest, candidateName: e.target.value})}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Driver Phone Number</label>
                                            <input 
                                                required
                                                type="text" 
                                                placeholder="+258 84..."
                                                value={newRequest.candidatePhone}
                                                onChange={e => setNewRequest({...newRequest, candidatePhone: e.target.value})}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Truck Model</label>
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder="e.g. Scania G460"
                                                value={truckModel}
                                                onChange={e => setTruckModel(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Reg. Number</label>
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder="e.g. MMM-123-MC"
                                                value={truckRegNumber}
                                                onChange={e => setTruckRegNumber(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">PO Number</label>
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder="e.g. PO-789012"
                                                value={poNumber}
                                                onChange={e => setPoNumber(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Contractor Company (Owner)</label>
                                        <select
                                            aria-label="Contractor Company Owner"
                                            required
                                            value={newRequest.contractorCompany}
                                            onChange={e => setNewRequest({ ...newRequest, contractorCompany: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-amber-500 transition-all"
                                        >
                                            <option value="">— Select Contractor —</option>
                                            {contractorList.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* Equipment Access Form Fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Equipment Type</label>
                                            <select
                                                aria-label="Equipment Type"
                                                value={equipmentType}
                                                onChange={e => setEquipmentType(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            >
                                                <option>Excavator</option>
                                                <option>Haul Truck</option>
                                                <option>Crane</option>
                                                <option>Light Vehicle</option>
                                                <option>Bulldozer</option>
                                                <option>Drill Rig</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Equipment ID / Tag</label>
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder="e.g. TRK-401 or EX-901"
                                                value={equipmentId}
                                                onChange={e => setEquipmentId(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Contractor Company */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Contractor Company (Owner)</label>
                                        <select
                                            aria-label="Contractor Company Owner"
                                            required
                                            value={newRequest.contractorCompany}
                                            onChange={e => setNewRequest({ ...newRequest, contractorCompany: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-amber-500 transition-all"
                                        >
                                            <option value="">— Select Contractor —</option>
                                            {contractorList.map(c => <option key={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    {/* Responsible Person Name & Phone */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Responsible Person</label>
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder="e.g. Alberto Manjate"
                                                value={respPersonName}
                                                onChange={e => setRespPersonName(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Contact Phone</label>
                                            <input 
                                                required 
                                                type="text" 
                                                placeholder="+258 84..."
                                                value={respPersonPhone}
                                                onChange={e => setRespPersonPhone(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Department */}
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Department</label>
                                        <select 
                                            aria-label="Department"
                                            value={newRequest.department}
                                            onChange={e => setNewRequest({...newRequest, department: e.target.value})}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-2xl p-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                        >
                                            <option>Mine Operations</option>
                                            <option>Plant Maintenance</option>
                                            <option>HSE</option>
                                            <option>Logistics</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* ─── AM Required Documents ─── */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Upload size={13} className="text-indigo-500" />
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {requestType === 'Recruitment' && newRequest.workerType === 'Prime' ? 'Optional Documents' : 'Required Documents'}
                                    </label>
                                </div>

                                <div className={`border rounded-2xl p-4 space-y-3 ${
                                    (requestType === 'Recruitment' && newRequest.workerType === 'Prime')
                                    ? 'bg-slate-50 dark:bg-slate-900/20 border-slate-200 dark:border-slate-700'
                                    : 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40'
                                }`}>
                                    <p className="text-[10px] font-bold leading-normal">
                                        {requestType === 'Recruitment' && newRequest.workerType === 'Contractor' && '⚠ Both National ID/Passport/DIRE and Fitness Certificate are mandatory for Contractors.'}
                                        {requestType === 'Recruitment' && newRequest.workerType === 'Prime' && 'ℹ Uploading documents is optional for Prime employees.'}
                                        {requestType === 'PersonnelAccess' && '⚠ National ID, Passport or DIRE is mandatory for Access Card clearance.'}
                                        {requestType === 'EquipmentAccess' && '⚠ Equipment Insurance and Photos (including Manifesto for Vehicles) are mandatory.'}
                                    </p>

                                    {requestType === 'EquipmentAccess' ? (
                                        <div className="space-y-3">
                                            {/* Insurance Upload */}
                                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <FileCheck size={16} className={amUploadState.insurance.uploaded ? 'text-emerald-500' : 'text-slate-400'} />
                                                    <div>
                                                        <div className="text-xs font-black text-slate-700 dark:text-slate-200">Liability Insurance</div>
                                                        {amUploadState.insurance.uploaded ? (
                                                            <div className="text-[9px] text-emerald-600 font-bold truncate max-w-[140px]">{amUploadState.insurance.fileName}</div>
                                                        ) : (
                                                            <div className="text-[9px] text-slate-400">PDF, JPG or PNG · max 10 MB</div>
                                                        )}
                                                    </div>
                                                </div>
                                                {amUploadState.insurance.uploaded ? (
                                                    <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                                        <Check size={9}/> Uploaded
                                                    </span>
                                                ) : (
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            className="sr-only"
                                                            onChange={e => handleAmFileSelect('insurance', e)}
                                                        />
                                                        <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase border transition-colors ${
                                                            amUploadState.insurance.uploading
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                        }`}>
                                                            {amUploadState.insurance.uploading ? 'Uploading...' : 'Upload'}
                                                        </span>
                                                    </label>
                                                )}
                                            </div>

                                            {/* Manifesto Upload (Conditionally for vehicles) */}
                                            {isVehicleType(equipmentType) && (
                                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        <FileText size={16} className={amUploadState.manifesto.uploaded ? 'text-emerald-500' : 'text-slate-400'} />
                                                        <div>
                                                            <div className="text-xs font-black text-slate-700 dark:text-slate-200">Manifesto / Logbook</div>
                                                            {amUploadState.manifesto.uploaded ? (
                                                                <div className="text-[9px] text-emerald-600 font-bold truncate max-w-[140px]">{amUploadState.manifesto.fileName}</div>
                                                            ) : (
                                                                <div className="text-[9px] text-slate-400">Required for Vehicles · PDF, JPG, PNG</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {amUploadState.manifesto.uploaded ? (
                                                        <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                                            <Check size={9}/> Uploaded
                                                        </span>
                                                    ) : (
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                className="sr-only"
                                                                onChange={e => handleAmFileSelect('manifesto', e)}
                                                            />
                                                            <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase border transition-colors ${
                                                                amUploadState.manifesto.uploading
                                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                            }`}>
                                                                {amUploadState.manifesto.uploading ? 'Uploading...' : 'Upload'}
                                                            </span>
                                                        </label>
                                                    )}
                                                </div>
                                            )}

                                            {/* Photo Grid */}
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Equipment Photos (4 Views Required)</div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {/* Front Photo */}
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between gap-2">
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                                        <span>Front View</span>
                                                        {amUploadState.photoFront.uploaded && <Check size={12} className="text-emerald-500"/>}
                                                    </div>
                                                    {amUploadState.photoFront.uploaded ? (
                                                        <div className="text-[9px] text-emerald-600 font-bold truncate">{amUploadState.photoFront.fileName}</div>
                                                    ) : (
                                                        <div className="text-[9px] text-slate-400">Front view photo</div>
                                                    )}
                                                    <label className="cursor-pointer text-center mt-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="sr-only"
                                                            onChange={e => handleAmFileSelect('photoFront', e)}
                                                        />
                                                        <span className={`block text-[9px] py-1 rounded-lg font-black uppercase border transition-colors ${
                                                            amUploadState.photoFront.uploading
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                        }`}>
                                                            {amUploadState.photoFront.uploading ? 'Uploading...' : amUploadState.photoFront.uploaded ? 'Change' : 'Upload'}
                                                        </span>
                                                    </label>
                                                </div>

                                                {/* Back Photo */}
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between gap-2">
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                                        <span>Back View</span>
                                                        {amUploadState.photoBack.uploaded && <Check size={12} className="text-emerald-500"/>}
                                                    </div>
                                                    {amUploadState.photoBack.uploaded ? (
                                                        <div className="text-[9px] text-emerald-600 font-bold truncate">{amUploadState.photoBack.fileName}</div>
                                                    ) : (
                                                        <div className="text-[9px] text-slate-400">Back view photo</div>
                                                    )}
                                                    <label className="cursor-pointer text-center mt-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="sr-only"
                                                            onChange={e => handleAmFileSelect('photoBack', e)}
                                                        />
                                                        <span className={`block text-[9px] py-1 rounded-lg font-black uppercase border transition-colors ${
                                                            amUploadState.photoBack.uploading
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                        }`}>
                                                            {amUploadState.photoBack.uploading ? 'Uploading...' : amUploadState.photoBack.uploaded ? 'Change' : 'Upload'}
                                                        </span>
                                                    </label>
                                                </div>

                                                {/* Left Side Photo */}
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between gap-2">
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                                        <span>Side View (L)</span>
                                                        {amUploadState.photoLeft.uploaded && <Check size={12} className="text-emerald-500"/>}
                                                    </div>
                                                    {amUploadState.photoLeft.uploaded ? (
                                                        <div className="text-[9px] text-emerald-600 font-bold truncate">{amUploadState.photoLeft.fileName}</div>
                                                    ) : (
                                                        <div className="text-[9px] text-slate-400">Left view photo</div>
                                                    )}
                                                    <label className="cursor-pointer text-center mt-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="sr-only"
                                                            onChange={e => handleAmFileSelect('photoLeft', e)}
                                                        />
                                                        <span className={`block text-[9px] py-1 rounded-lg font-black uppercase border transition-colors ${
                                                            amUploadState.photoLeft.uploading
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                        }`}>
                                                            {amUploadState.photoLeft.uploading ? 'Uploading...' : amUploadState.photoLeft.uploaded ? 'Change' : 'Upload'}
                                                        </span>
                                                    </label>
                                                </div>

                                                {/* Right Side Photo */}
                                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col justify-between gap-2">
                                                    <div className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center justify-between">
                                                        <span>Side View (R)</span>
                                                        {amUploadState.photoRight.uploaded && <Check size={12} className="text-emerald-500"/>}
                                                    </div>
                                                    {amUploadState.photoRight.uploaded ? (
                                                        <div className="text-[9px] text-emerald-600 font-bold truncate">{amUploadState.photoRight.fileName}</div>
                                                    ) : (
                                                        <div className="text-[9px] text-slate-400">Right view photo</div>
                                                    )}
                                                    <label className="cursor-pointer text-center mt-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="sr-only"
                                                            onChange={e => handleAmFileSelect('photoRight', e)}
                                                        />
                                                        <span className={`block text-[9px] py-1 rounded-lg font-black uppercase border transition-colors ${
                                                            amUploadState.photoRight.uploading
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                        }`}>
                                                            {amUploadState.photoRight.uploading ? 'Uploading...' : amUploadState.photoRight.uploaded ? 'Change' : 'Upload'}
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    ) : requestType === 'DeliveryAccess' ? (
                                        <div className="space-y-3">
                                            {/* Driver's License Upload */}
                                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <FileCheck size={16} className={amUploadState.driverLicense.uploaded ? 'text-emerald-500' : 'text-slate-400'} />
                                                    <div>
                                                        <div className="text-xs font-black text-slate-700 dark:text-slate-200">Driver's License</div>
                                                        {amUploadState.driverLicense.uploaded ? (
                                                            <div className="text-[9px] text-emerald-600 font-bold truncate max-w-[140px]">{amUploadState.driverLicense.fileName}</div>
                                                        ) : (
                                                            <div className="text-[9px] text-slate-400">PDF, JPG or PNG · max 10 MB</div>
                                                        )}
                                                    </div>
                                                </div>
                                                {amUploadState.driverLicense.uploaded ? (
                                                    <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                                        <Check size={9}/> Uploaded
                                                    </span>
                                                ) : (
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            className="sr-only"
                                                            onChange={e => handleAmFileSelect('driverLicense', e)}
                                                        />
                                                        <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase border transition-colors ${
                                                            amUploadState.driverLicense.uploading
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                        }`}>
                                                            {amUploadState.driverLicense.uploading ? 'Uploading...' : 'Upload'}
                                                        </span>
                                                    </label>
                                                )}
                                            </div>

                                            {/* Passport Upload */}
                                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <FileScan size={16} className={amUploadState.passport.uploaded ? 'text-emerald-500' : 'text-slate-400'} />
                                                    <div>
                                                        <div className="text-xs font-black text-slate-700 dark:text-slate-200">Driver's Passport</div>
                                                        {amUploadState.passport.uploaded ? (
                                                            <div className="text-[9px] text-emerald-600 font-bold truncate max-w-[140px]">{amUploadState.passport.fileName}</div>
                                                        ) : (
                                                            <div className="text-[9px] text-slate-400">PDF, JPG or PNG · max 10 MB</div>
                                                        )}
                                                    </div>
                                                </div>
                                                {amUploadState.passport.uploaded ? (
                                                    <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                                        <Check size={9}/> Uploaded
                                                    </span>
                                                ) : (
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            className="sr-only"
                                                            onChange={e => handleAmFileSelect('passport', e)}
                                                        />
                                                        <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase border transition-colors ${
                                                            amUploadState.passport.uploading
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                        }`}>
                                                            {amUploadState.passport.uploading ? 'Uploading...' : 'Upload'}
                                                        </span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Candidate National ID / Details */}
                                            <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <div className="flex items-center gap-2">
                                                    <FileScan size={16} className={amUploadState.candidateId.uploaded ? 'text-emerald-500' : 'text-slate-400'} />
                                                    <div>
                                                        <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                                                            {requestType === 'EquipmentAccess' ? 'Contractor & Responsible Details' : 'National ID, Passport or DIRE'}
                                                        </div>
                                                        {amUploadState.candidateId.uploaded ? (
                                                            <div className="text-[9px] text-emerald-600 font-bold truncate max-w-[140px]">{amUploadState.candidateId.fileName}</div>
                                                        ) : (
                                                            <div className="text-[9px] text-slate-400">PDF, JPG or PNG · max 10 MB</div>
                                                        )}
                                                    </div>
                                                </div>
                                                {amUploadState.candidateId.uploaded ? (
                                                    <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                                        <Check size={9}/> Uploaded
                                                    </span>
                                                ) : (
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept=".pdf,.jpg,.jpeg,.png"
                                                            className="sr-only"
                                                            onChange={e => handleAmFileSelect('candidateId', e)}
                                                        />
                                                        <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase border transition-colors ${
                                                            amUploadState.candidateId.uploading
                                                            ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                        }`}>
                                                            {amUploadState.candidateId.uploading ? 'Uploading...' : 'Upload'}
                                                        </span>
                                                    </label>
                                                )}
                                            </div>

                                            {/* Third-Party Fitness Certificate */}
                                            {requestType === 'Recruitment' && (
                                                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
                                                    <div className="flex items-center gap-2">
                                                        <FileCheck size={16} className={amUploadState.fitnessCert.uploaded ? 'text-emerald-500' : 'text-slate-400'} />
                                                        <div>
                                                            <div className="text-xs font-black text-slate-700 dark:text-slate-200">Third-Party Fitness Certificate</div>
                                                            {amUploadState.fitnessCert.uploaded ? (
                                                                <div className="text-[9px] text-emerald-600 font-bold truncate max-w-[140px]">{amUploadState.fitnessCert.fileName}</div>
                                                            ) : (
                                                                <div className="text-[9px] text-slate-400">Issued by certified medical facility</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {amUploadState.fitnessCert.uploaded ? (
                                                        <span className="text-[9px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                                            <Check size={9}/> Uploaded
                                                        </span>
                                                    ) : (
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                className="sr-only"
                                                                onChange={e => handleAmFileSelect('fitnessCert', e)}
                                                            />
                                                            <span className={`text-[9px] px-3 py-1.5 rounded-lg font-black uppercase border transition-colors ${
                                                                amUploadState.fitnessCert.uploading
                                                                ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-wait'
                                                                : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border-indigo-100'
                                                            }`}>
                                                                {amUploadState.fitnessCert.uploading ? 'Uploading...' : 'Upload'}
                                                            </span>
                                                        </label>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                            <button 
                                type="button" 
                                onClick={() => { setIsAddRequestOpen(false); resetAmUploads(); }}
                                className="px-6 py-3 border border-slate-200 dark:border-slate-600 text-slate-500 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitDisabled()}
                                className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-black text-xs uppercase tracking-widest shadow shadow-indigo-600/20 active:scale-95 transition-all"
                            >
                                {getSubmitButtonLabel()}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            </div>

            {/* DYNAMIC PROFESSIONAL PRINT-ONLY CERTIFICATE */}
            {activeProcess && (
                <div className="hidden print:block print:w-full print:bg-white text-slate-900 font-sans p-10 max-w-[210mm] mx-auto select-none">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b-4 border-slate-900 pb-6 mb-8">
                        <div className="flex items-center gap-4">
                            <img src="https://vulcanrealestate.com/wp-content/themes/vulcanrealestate/images/logomark-vulcan.svg" alt="Vulcan Logo" className="h-16 object-contain" />
                            <div>
                                <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">VULCAN</h1>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resources Mozambique</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end text-right">
                            <div className="flex items-center gap-2 text-indigo-600">
                                <ShieldCheck size={28} className="text-indigo-600" />
                                <span className="text-xl font-black tracking-tighter text-slate-900">ZeroGate</span>
                            </div>
                            <span className="text-[8px] font-black uppercase text-slate-400 mt-1 tracking-widest">Access Control System</span>
                        </div>
                    </div>

                    {/* Department and Metadata */}
                    <div className="flex justify-between items-start mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <div>
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.proposal.mobilization.certificate?.issuingDept || 'Issuing Department'}</span>
                            <span className="text-sm font-bold text-slate-800 uppercase">
                                {activeProcess.status === 'HR_PENDING' && (t.proposal.mobilization.certificate?.deptHR || 'Human Resources Department')}
                                {activeProcess.status === 'CLINIC_PENDING' && (t.proposal.mobilization.certificate?.deptClinic || 'Occupational Health Clinic')}
                                {(activeProcess.status === 'INDUCTION_PENDING' || activeProcess.status === 'SAFETY_PENDING' || activeProcess.status === 'FAILED') && (t.proposal.mobilization.certificate?.deptHSE || 'HSE (Health, Safety & Environment) Department')}
                                {(activeProcess.status === 'SECURITY_PENDING' || activeProcess.status === 'COMPLETED') && (t.proposal.mobilization.certificate?.deptSecurity || 'Security & Access Control Department')}
                                {activeProcess.status === 'AM_REQUESTED' && (t.proposal.mobilization.certificate?.deptAM || 'Onboarding & Mobilization Office')}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.proposal.mobilization.certificate?.documentStatus || 'Document Status'}</span>
                            <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${
                                activeProcess.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                                {translateStatus(activeProcess.status)}
                            </span>
                        </div>
                    </div>

                    {/* Certificate Title */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                            {activeProcess.requestType === 'EquipmentAccess' ? (t.proposal.mobilization.certificate?.titleEquipment || 'Equipment Access Mobilization Certificate') : (t.proposal.mobilization.certificate?.titleWorkforce || 'Workforce Access Mobilization Certificate')}
                        </h2>
                        <p className="text-xs text-slate-500 font-mono mt-1">Ref: ZG-MOB-{activeProcess.id.substring(0,8).toUpperCase()}</p>
                    </div>

                    {/* Details Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden mb-8">
                        <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 font-black text-xs uppercase tracking-widest text-slate-700">
                            {activeProcess.requestType === 'EquipmentAccess' ? (t.proposal.mobilization.certificate?.detailsEquipment || 'Equipment & Contractor Details') : (t.proposal.mobilization.certificate?.detailsPersonnel || 'Personnel Onboarding Details')}
                        </div>
                        
                        {activeProcess.requestType === 'EquipmentAccess' ? (
                            <table className="w-full text-left text-sm font-bold divide-y divide-slate-100">
                                <tbody>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400 w-1/3">{t.proposal.mobilization.certificate?.eqType || 'Equipment Type'}</td>
                                        <td className="px-6 py-3 text-slate-800">{activeProcess.equipmentType || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400">{t.proposal.mobilization.certificate?.eqId || 'Equipment Tag / ID'}</td>
                                        <td className="px-6 py-3 text-slate-800 font-mono">{activeProcess.equipmentId || activeProcess.candidateName}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400">{t.proposal.mobilization.certificate?.contractorCo || 'Contractor Company'}</td>
                                        <td className="px-6 py-3 text-slate-800">{activeProcess.company}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400">{t.proposal.mobilization.certificate?.respPerson || 'Responsible Person'}</td>
                                        <td className="px-6 py-3 text-slate-800">{activeProcess.responsiblePersonName || 'N/A'} ({activeProcess.responsiblePersonPhone || 'N/A'})</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400">{t.proposal.mobilization.certificate?.mobStage || 'Mobilization Stage'}</td>
                                        <td className="px-6 py-3 text-slate-800">{activeProcess.department}</td>
                                    </tr>
                                </tbody>
                            </table>
                        ) : (
                            <table className="w-full text-left text-sm font-bold divide-y divide-slate-100">
                                <tbody>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400 w-1/3">{t.proposal.mobilization.certificate?.fullName || 'Full Name'}</td>
                                        <td className="px-6 py-3 text-slate-800">{activeProcess.candidateName}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400">{t.proposal.mobilization.certificate?.badgeNo || 'Personnel ID / Badge'}</td>
                                        <td className="px-6 py-3 text-slate-800 font-mono">{activeProcess.temporaryBadgeNumber || (language === 'pt' ? 'Pendente' : 'Pending')}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400">{t.proposal.mobilization.certificate?.employingCo || 'Employing Company'}</td>
                                        <td className="px-6 py-3 text-slate-800">{activeProcess.company} ({activeProcess.workerType || 'Prime'})</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400">{t.proposal.mobilization.certificate?.workDept || 'Work Department'}</td>
                                        <td className="px-6 py-3 text-slate-800">{activeProcess.department}</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-3 bg-slate-50 text-slate-400">{t.proposal.mobilization.certificate?.jobRole || 'Job Role'}</td>
                                        <td className="px-6 py-3 text-slate-800">{activeProcess.role}</td>
                                    </tr>
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Workflow Checklist Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                            <div>
                                <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">{t.proposal.mobilization.certificate?.gate1 || 'Gate 1: Identity & Contracts'}</span>
                                <span className="text-xs font-black text-slate-700 uppercase">{t.proposal.mobilization.certificate?.gate1Sub || 'HR DOCUMENT CHECK'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-emerald-600">
                                <CheckCircle size={16} />
                                <span className="text-xs font-bold">{t.proposal.mobilization.certificate?.verified || 'VERIFIED'}</span>
                            </div>
                        </div>

                        {activeProcess.requestType !== 'EquipmentAccess' ? (
                            <>
                                <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                                    <div>
                                        <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">{t.proposal.mobilization.certificate?.gate2 || 'Gate 2: Occupational Health'}</span>
                                        <span className="text-xs font-black text-slate-700 uppercase">{t.proposal.mobilization.certificate?.gate2Sub || 'Clinic Vitals Check'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        {activeProcess.status === 'HR_PENDING' || activeProcess.status === 'CLINIC_PENDING' || activeProcess.status === 'AM_REQUESTED' ? (
                                            <span className="text-xs font-bold text-amber-500">{t.proposal.mobilization.certificate?.pending || 'PENDING'}</span>
                                        ) : (
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <CheckCircle size={16} />
                                                <span className="text-xs font-bold">{t.proposal.mobilization.certificate?.cleared || 'CLEARED'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                                    <div>
                                        <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">{t.proposal.mobilization.certificate?.gate3 || 'Gate 3: HSE Competence'}</span>
                                        <span className="text-xs font-black text-slate-700 uppercase">{t.proposal.mobilization.certificate?.gate3Sub || 'Induction & Safety Training'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-4">
                                        {['HR_PENDING', 'CLINIC_PENDING', 'INDUCTION_PENDING', 'AM_REQUESTED'].includes(activeProcess.status) ? (
                                            <span className="text-xs font-bold text-amber-500">{t.proposal.mobilization.certificate?.pending || 'PENDING'}</span>
                                        ) : (
                                            <div className="flex items-center gap-2 text-emerald-600">
                                                <CheckCircle size={16} />
                                                <span className="text-xs font-bold">{t.proposal.mobilization.certificate?.cleared || 'CLEARED'} ({activeProcess.requiredRacs ? activeProcess.requiredRacs.join(', ') : 'RAC01'})</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                                <div>
                                    <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">{t.proposal.mobilization.certificate?.gate2Eq || 'Gate 2: Physical Inspection'}</span>
                                    <span className="text-xs font-black text-slate-700 uppercase">{t.proposal.mobilization.certificate?.gate2EqSub || 'HSE Safety Inspection'}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-4">
                                    {activeProcess.safetyInspectionCleared ? (
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <CheckCircle size={16} />
                                            <span className="text-xs font-bold">{t.proposal.mobilization.certificate?.cleared || 'CLEARED'} (Ref: {activeProcess.safetyInspectionRecordId})</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs font-bold text-amber-500">{t.proposal.mobilization.certificate?.pending || 'PENDING'}</span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                            <div>
                                <span className="block text-[8px] uppercase font-black text-slate-400 tracking-widest mb-1">{t.proposal.mobilization.certificate?.gate4 || 'Gate 4: Site Access'}</span>
                                <span className="text-xs font-black text-slate-700 uppercase">{t.proposal.mobilization.certificate?.gate4Sub || 'Security Badge / Tag'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                {activeProcess.status === 'Completed' ? (
                                    <div className="flex items-center gap-2 text-emerald-600">
                                        <CheckCircle size={16} />
                                        <span className="text-xs font-bold">{t.proposal.mobilization.certificate?.activeGranted || 'ACTIVE & GRANTED'}</span>
                                    </div>
                                ) : (
                                    <span className="text-xs font-bold text-amber-500">{t.proposal.mobilization.certificate?.pendingSecurity || 'PENDING SECURITY ISSUANCE'}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer / Signatures */}
                    <div className="flex justify-between items-end mt-16 pt-10 border-t border-slate-200 text-xs font-bold uppercase text-slate-400">
                        <div className="flex-1 max-w-[200px] border-t border-slate-300 pt-2 text-left">
                            <span className="block text-slate-800 font-bold">{t.proposal.mobilization.certificate?.issuingAuthority || 'Issuing Authority'}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">{t.proposal.mobilization.certificate?.officerSign || 'Onboarding Officer Sign'}</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-[9px] font-black text-slate-400 tracking-widest">{t.proposal.mobilization.certificate?.printedBy || 'Printed By'}</span>
                            <span className="block text-[10px] text-slate-800 font-mono mt-0.5">{user?.name} ({user?.role})</span>
                        </div>
                        <div className="flex-1 max-w-[200px] border-t border-slate-300 pt-2 text-right">
                            <span className="block text-slate-800 font-bold">{t.proposal.mobilization.certificate?.traineeRep || 'Trainee / Representative'}</span>
                            <span className="block text-[10px] text-slate-400 font-normal">{t.proposal.mobilization.certificate?.traineeSign || 'Acknowledgment Sign'}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MobilizationDashboard;
