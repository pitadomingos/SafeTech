import { useState, useEffect } from 'react';
import { 
  Shield, QrCode, BookOpen, User, Lock, Activity,
  Wine, CheckCircle2, XCircle, AlertTriangle, LogOut, RefreshCw, 
  Building2, MapPin, Calendar, ShieldAlert, Check, Wifi,
  BookCheck, ShieldCheck, UserCheck, Flame, ClipboardList,
  ArrowRight, Circle
} from 'lucide-react';

// Types mimicking the main app
interface Employee {
  id: string;
  name: string;
  recordId: string;
  siteId: string;
  company: string;
  department: string;
  role: string;
  isActive: boolean;
  phoneNumber: string;
  driverLicenseNumber?: string;
  driverLicenseClass?: string;
  driverLicenseExpiry?: string;
}

interface Booking {
  id: string;
  employeeId: string;
  sessionId: string;
  status: 'Pending' | 'Approved' | 'Waitlisted' | 'Rejected';
  requestedAt: string;
}

interface TrainingSession {
  id: string;
  racCode: string;
  date: string;
  startTime: string;
  location: string;
  capacity: number;
  instructor: string;
  language: string;
  companyId: string;
  siteId: string;
}

interface EmployeeRequirement {
  id: string;
  employeeId: string;
  racCode: string;
  status: 'Valid' | 'Expired' | 'Pending';
  expiryDate: string;
  medicalStatus: 'Valid' | 'Expired' | 'Pending';
  medicalExpiry: string;
}

interface Company {
  id: string;
  name: string;
  appName?: string;
  status: 'Active' | 'Inactive';
  features?: {
    alcohol?: boolean;
  };
}

interface Site {
  id: string;
  companyId: string;
  name: string;
  location: string;
}

const API_URL = 'http://localhost:5000/api';

// I18n translations helper
const text = {
  en: {
    title: 'CARS Mobile Portal',
    subtitle: 'Safety Access Passport',
    offlineAlert: 'Sync server offline. Running in local sandbox.',
    selectEmp: 'Select Employee profile',
    enter: 'Log In',
    passport: 'Passport',
    bookings: 'Bookings',
    gate: 'Turnstile',
    profile: 'Profile',
    auth: 'Authorized',
    blocked: 'Access Blocked',
    asoText: 'ASO Occupational Medical Exam',
    validUntil: 'Valid until',
    expiredOn: 'Expired on',
    noBookings: 'No booking history.',
    requested: 'Requested on',
    status: 'Status',
    availableTraining: 'Available Training',
    bookButton: 'Request Enrollment',
    alreadyBooked: 'Requested',
    scanTitle: 'Site Access Gate',
    scanDesc: 'Scan safety passport QR code to open the turnstile.',
    scanButton: 'SCAN SAFETY QR PASSPORT',
    scanningText: 'Scanning QR Code...',
    validatingText: 'Validating safety requisitions & ASO...',
    breathalyzerTitle: 'Breathalyzer Check Required',
    breathalyzerDesc: 'Your company requires a blood alcohol concentration test to pass this turnstile.',
    blowButton: 'HOLD TO BLOW',
    blowingText: 'Blowing... Keep going!',
    processingText: 'Analyzing BAC levels...',
    gateOpen: 'GATE ACCESS GRANTED',
    gateClosed: 'GATE ACCESS DENIED',
    retry: 'Retry Access Sequence',
    simulatePass: 'Simulate Clear BAC (0.00%)',
    simulateFail: 'Simulate Positive BAC (>0.00%)',
    signout: 'Log Out Profile',
    department: 'Department',
    node: 'Enterprise Node',
    role: 'Job Role',
    langToggle: 'Mudar para Português',
    empId: 'Record ID',
    chooseProfile: 'Choose profile...',
    passportStatus: 'Passport Status',
    safetyRequisitions: 'Safety Requisitions',
    requestedTrainings: 'Requested Trainings',
    safetyCertification: 'Safety Certification',
    moduleTraining: 'Module Training',
    instructor: 'Instructor:',
    testScenarioMode: 'Test Scenario Mode',
    reasonExpiredAso: 'Expired ASO Medical Exam',
    reasonExpiredRac: 'Expired RAC Safety Certification',
    reasonNoRacs: 'No RAC requirements registered',
    reasonAllValid: 'All Credentials Valid',
    reasonNoUser: 'No User',
    accessAuthorized: 'Credentials approved. Access authorized.',
    failedBacTest: 'Failed BAC Test: {bac}% (Limit 0.00%)',
    cleanBacTest: 'Clean test (0.00% BAC). Gate authorized.',
    operationalGate: 'Operational Gate',
    statuses: {
      Pending: 'Pending',
      Approved: 'Approved',
      Waitlisted: 'Waitlisted',
      Rejected: 'Rejected'
    } as Record<string, string>,
    onboarding: 'Onboarding',
    onboardingTitle: 'Mobilization Pipeline',
    onboardingSubtitle: 'Your onboarding progress at the site',
    onboardingStage: 'Current Stage',
    onboardingNoProcess: 'No active onboarding process found. Contact your Area Manager to initiate a recruitment request.',
    onboardingStages: {
      am_requested: 'AM Requisition',
      hr_pending: 'HR Documents',
      security_pending: 'Security Badge',
      clinic_pending: 'Medical Clearance',
      induction_pending: 'HSE Induction',
      training_pending: 'RAC Training',
      completed: 'Completed'
    } as Record<string, string>,
    onboardingStageDesc: {
      am_requested: 'Your Area Manager has submitted a recruitment request.',
      hr_pending: 'HR is reviewing your documents and personal information.',
      security_pending: 'Security is processing your background check and access badge.',
      clinic_pending: 'Awaiting your occupational health medical examination.',
      induction_pending: 'HSE site induction training is being scheduled.',
      training_pending: 'RAC safety certification training is in progress.',
      completed: 'All onboarding steps are complete. You are cleared for site access.'
    } as Record<string, string>,
    onboardingProgress: 'Progress',
    onboardingRequestedBy: 'Requested by',
    onboardingRole: 'Position',
    onboardingSite: 'Site'
  },
  pt: {
    title: 'Portal Móvel CARS',
    subtitle: 'Passaporte de Acesso Seguro',
    offlineAlert: 'Servidor offline. A correr em modo local.',
    selectEmp: 'Selecione o perfil do Colaborador',
    enter: 'Entrar no Sistema',
    passport: 'Passaporte',
    bookings: 'Treinos',
    gate: 'Portaria',
    profile: 'Perfil',
    auth: 'Autorizado',
    blocked: 'Acesso Bloqueado',
    asoText: 'Exame Médico Ocupacional ASO',
    validUntil: 'Válido até',
    expiredOn: 'Expirou em',
    noBookings: 'Nenhum histórico de treinos.',
    requested: 'Requisitado em',
    status: 'Estado',
    availableTraining: 'Formações Disponíveis',
    bookButton: 'Requisitar Matrícula',
    alreadyBooked: 'Requisitado',
    scanTitle: 'Cancela de Acesso Físico',
    scanDesc: 'Leia o QR code do seu passaporte para abrir a catraca.',
    scanButton: 'LER QR CODE DO PASSAPORTE',
    scanningText: 'A ler o QR Code...',
    validatingText: 'A validar requisitos de segurança e ASO...',
    breathalyzerTitle: 'Teste de Bafômetro Requerido',
    breathalyzerDesc: 'A sua empresa exige um teste de álcool para passar por esta cancela.',
    blowButton: 'CLIQUE E SEGURE PARA SOPRAR',
    blowingText: 'A soprar... Continue!',
    processingText: 'A analisar nível de alcoolemia...',
    gateOpen: 'ACESSO AUTORIZADO',
    gateClosed: 'ACESSO NEGADO',
    retry: 'Reiniciar Sequência de Entrada',
    simulatePass: 'Simular Teste Limpo (0.00%)',
    simulateFail: 'Simular Teste Positivo (>0.00%)',
    signout: 'Terminar Sessão',
    department: 'Departamento',
    node: 'Nó Corporativo',
    role: 'Função',
    langToggle: 'Switch to English',
    empId: 'ID de Registo',
    chooseProfile: 'Escolha o perfil...',
    passportStatus: 'Estado do Passaporte',
    safetyRequisitions: 'Requisitos de Segurança',
    requestedTrainings: 'Treinos Solicitados',
    safetyCertification: 'Certificação de Segurança',
    moduleTraining: 'Formação do Módulo',
    instructor: 'Instrutor:',
    testScenarioMode: 'Modo de Cenário de Teste',
    reasonExpiredAso: 'Exame Médico ASO Expirado',
    reasonExpiredRac: 'Certificação de Segurança RAC Expirada',
    reasonNoRacs: 'Nenhum requisito RAC registado',
    reasonAllValid: 'Todas as Credenciais Válidas',
    reasonNoUser: 'Sem Utilizador',
    accessAuthorized: 'Credenciais aprovadas. Acesso autorizado.',
    failedBacTest: 'Teste de TAS Positivo: {bac}% (Limite 0.00%)',
    cleanBacTest: 'Teste limpo (0.00% TAS). Acesso autorizado.',
    operationalGate: 'Portaria Operacional',
    statuses: {
      Pending: 'Pendente',
      Approved: 'Aprovado',
      Waitlisted: 'Lista de Espera',
      Rejected: 'Rejeitado'
    } as Record<string, string>,
    onboarding: 'Integração',
    onboardingTitle: 'Pipeline de Mobilização',
    onboardingSubtitle: 'O seu progresso de integração no site',
    onboardingStage: 'Fase Atual',
    onboardingNoProcess: 'Nenhum processo de integração ativo. Contacte o seu Diretor de Área para iniciar uma requisição.',
    onboardingStages: {
      am_requested: 'Requisição do DA',
      hr_pending: 'Documentos RH',
      security_pending: 'Crachá de Segurança',
      clinic_pending: 'Exame Médico',
      induction_pending: 'Indução HSE',
      training_pending: 'Formação RAC',
      completed: 'Concluído'
    } as Record<string, string>,
    onboardingStageDesc: {
      am_requested: 'O seu Diretor de Área submeteu uma requisição de recrutamento.',
      hr_pending: 'O RH está a rever os seus documentos e dados pessoais.',
      security_pending: 'A segurança está a processar a verificação de antecedentes e o crachá de acesso.',
      clinic_pending: 'A aguardar o exame médico ocupacional.',
      induction_pending: 'A formação de indução HSE do site está a ser agendada.',
      training_pending: 'A certificação de segurança RAC está em curso.',
      completed: 'Todas as etapas de integração estão concluídas. Está autorizado para o acesso ao site.'
    } as Record<string, string>,
    onboardingProgress: 'Progresso',
    onboardingRequestedBy: 'Requisitado por',
    onboardingRole: 'Cargo',
    onboardingSite: 'Site'
  }
};

export default function App() {
  // Authentication / Demo State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [requirements, setRequirements] = useState<EmployeeRequirement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  
  // App UI State
  const [activeTab, setActiveTab] = useState<'passport' | 'bookings' | 'gate' | 'onboarding' | 'profile'>('passport');
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [lang, setLang] = useState<'en' | 'pt'>('en');
  const t = text[lang];

  // Gate simulation states
  const [gateStep, setGateStep] = useState<'idle' | 'scanning' | 'validation' | 'breathalyzer' | 'blowing' | 'processing' | 'result'>('idle');
  const [blowProgress, setBlowProgress] = useState(0);
  const [simulateFail, setSimulateFail] = useState(false);
  const [gateAccessGranted, setGateAccessGranted] = useState<boolean | null>(null);
  const [gateReason, setGateReason] = useState<string>('');

  // Time state for phone status bar
  const [timeStr, setTimeStr] = useState('12:00');

  // Load database state from shared local server
  const fetchState = async () => {
    try {
      const res = await fetch(`${API_URL}/db`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
        setBookings(data.bookings || []);
        setSessions(data.sessions || []);
        setRequirements(data.requirements || []);
        setCompanies(data.companies || []);
        setSites(data.sites || []);
        setIsServerOnline(true);
        
        // Update active logged in user state with fresh data
        if (currentUser) {
          const fresh = (data.employees || []).find((e: Employee) => e.id === currentUser.id);
          if (fresh) setCurrentUser(fresh);
        }
      }
    } catch (e) {
      setIsServerOnline(false);
    }
  };

  useEffect(() => {
    fetchState();
    // Fetch state every 3 seconds for live synchronization
    const interval = setInterval(fetchState, 3000);

    // Clock updates
    const timeInterval = setInterval(() => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timeInterval);
    };
  }, [currentUser?.id]);

  // Auth Action
  const handleLogin = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setCurrentUser(emp);
      setActiveTab('passport');
      resetGate();
    }
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    resetGate();
  };

  // Check if ASO and RACs are valid for current user
  const getUserStatus = () => {
    if (!currentUser) return { authorized: false, reason: t.reasonNoUser };

    // Find medical/ASO status
    const reqs = requirements.filter(r => r.employeeId === currentUser.id);
    const hasExpiredMedical = reqs.some(r => r.medicalStatus === 'Expired');
    const hasExpiredRac = reqs.some(r => r.status === 'Expired');

    if (hasExpiredMedical) {
      return { authorized: false, reason: t.reasonExpiredAso };
    }
    if (hasExpiredRac) {
      return { authorized: false, reason: t.reasonExpiredRac };
    }
    if (reqs.length === 0) {
      return { authorized: false, reason: t.reasonNoRacs };
    }

    return { authorized: true, reason: t.reasonAllValid };
  };

  // Book session action
  const handleBookSession = async (sessionId: string) => {
    if (!currentUser) return;
    const newBooking: Booking = {
      id: 'book-' + Math.random().toString(36).substring(2, 9),
      employeeId: currentUser.id,
      sessionId,
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBooking)
      });
      if (res.ok) {
        setBookings(prev => [...prev, newBooking]);
        fetchState();
      }
    } catch (e) {
      console.error('Failed to submit booking', e);
    }
  };

  // Reset turnstile gate state
  const resetGate = () => {
    setGateStep('idle');
    setBlowProgress(0);
    setGateAccessGranted(null);
    setGateReason('');
  };

  // Scan passport gate sequence
  const startGateValidation = () => {
    if (!currentUser) return;
    setGateStep('scanning');

    setTimeout(() => {
      setGateStep('validation');
      setTimeout(() => {
        const check = getUserStatus();
        const empCompanyObj = companies.find(c => c.name === currentUser.company || c.id === currentUser.company);
        const isAlcoholReq = empCompanyObj?.features?.alcohol ?? false;

        if (!check.authorized) {
          setGateAccessGranted(false);
          setGateReason(check.reason);
          setGateStep('result');
        } else if (isAlcoholReq) {
          setGateStep('breathalyzer');
        } else {
          setGateAccessGranted(true);
          setGateReason(t.accessAuthorized);
          setGateStep('result');
          logGateAccess('Clean (0.00 BAC)', 'Authorized');
        }
      }, 1200);
    }, 1000);
  };

  // Simulate holding and blowing into the breathalyzer
  useEffect(() => {
    let intervalId: any;
    if (gateStep === 'blowing') {
      intervalId = setInterval(() => {
        setBlowProgress(p => {
          if (p >= 100) {
            clearInterval(intervalId);
            evaluateBreathalyzerResult();
            return 100;
          }
          return p + 10;
        });
      }, 200);
    }
    return () => clearInterval(intervalId);
  }, [gateStep]);

  const evaluateBreathalyzerResult = () => {
    setGateStep('processing');
    setTimeout(() => {
      if (simulateFail) {
        const bac = parseFloat((0.15 + Math.random() * 0.15).toFixed(2)); // fail BAC
        setGateAccessGranted(false);
        setGateReason(t.failedBacTest.replace('{bac}', String(bac)));
        setGateStep('result');
        logGateAccess(`Positive BAC (${bac}%)`, 'Denied');
      } else {
        setGateAccessGranted(true);
        setGateReason(t.cleanBacTest);
        setGateStep('result');
        logGateAccess('Clean (0.00 BAC)', 'Authorized');
      }
    }, 1500);
  };

  // POST gate logs and notifications to the local server
  const logGateAccess = async (result: string, status: string) => {
    if (!currentUser) return;
    const currentSite = sites.find(s => s.id === currentUser.siteId) || { name: t.operationalGate };
    const logEntry = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      employeeName: currentUser.name,
      recordId: currentUser.recordId,
      company: currentUser.company,
      site: currentSite.name,
      module: 'Breathalyzer',
      result,
      status
    };

    try {
      await fetch(`${API_URL}/alcohol/log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logEntry)
      });
    } catch (e) {
      console.error('Failed to log gate entry', e);
    }
  };



  return (
    <div className="w-full flex justify-center items-center px-4">
      
      {/* Dynamic Smartphone Shell Frame Wrapper */}
      <div className="relative w-[390px] h-[844px] bg-slate-900 border-[12px] border-slate-950 rounded-[55px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col ring-1 ring-white/10 select-none">
        
        {/* Notch Speaker and Camera */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[30px] bg-slate-950 rounded-b-2xl z-50 flex items-center justify-center">
          <div className="w-16 h-1 bg-slate-800 rounded-full mb-2.5"></div>
        </div>

        {/* Status Bar */}
        <div className="h-12 bg-slate-950 px-6 flex justify-between items-center text-xs font-semibold text-slate-300 select-none z-40 relative">
          <span>{timeStr}</span>
          <div className="flex items-center gap-2">
            <Wifi size={14} className={isServerOnline ? "text-emerald-400" : "text-amber-400"} />
            <span className="text-[10px] uppercase font-black font-mono tracking-widest bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">5G</span>
            <div className="w-5 h-2.5 border border-slate-300 rounded-sm p-0.5 flex items-center">
              <div className="h-full w-4 bg-emerald-500 rounded-2xs"></div>
            </div>
          </div>
        </div>

        {/* Dynamic Display Screens */}
        <div className="flex-1 overflow-y-auto bg-slate-950 px-4 pt-4 pb-20 scrollbar-hide flex flex-col">
          
          {/* Server Offline Alert Banner */}
          {!isServerOnline && (
            <div className="mb-4 bg-amber-500/10 border border-amber-500/30 p-2.5 rounded-xl text-[10px] text-amber-400 font-bold flex items-center gap-2 shrink-0 animate-pulse">
              <AlertTriangle size={14} />
              <span>{t.offlineAlert}</span>
            </div>
          )}

          {/* SCREEN: LOGIN */}
          {!currentUser ? (
            <div className="flex-1 flex flex-col justify-center py-6 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
                  <Shield size={32} />
                </div>
                <h1 className="text-2xl font-black font-display tracking-tight text-white mb-1">{t.title}</h1>
                <p className="text-xs text-slate-400 font-medium">{t.subtitle}</p>
              </div>

              <div className="space-y-6 bg-slate-900/60 border border-white/5 p-6 rounded-3xl backdrop-blur-xl">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">{t.selectEmp}</label>
                  <select 
                    onChange={e => handleLogin(e.target.value)}
                    defaultValue=""
                    aria-label={t.selectEmp}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 font-bold text-sm text-white focus:border-indigo-500 outline-none appearance-none"
                  >
                    <option value="" disabled>{t.chooseProfile}</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.company})</option>
                    ))}
                    {employees.length === 0 && (
                      <option value="emp-paulo">Paulo Manjate (Vulcan)</option>
                    )}
                  </select>
                </div>

                <div className="pt-2">
                  <button 
                    onClick={() => handleLogin('emp-paulo')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-98 transition-all"
                  >
                    {t.enter}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // LOGGED IN SCREENS
            <div className="flex-1 flex flex-col h-full overflow-y-auto scrollbar-hide">
              
              {/* TAB: Passport */}
              {activeTab === 'passport' && (
                <div className="space-y-5 animate-fade-in">
                  
                  {/* Dynamic Status Card */}
                  {(() => {
                    const status = getUserStatus();
                    return (
                      <div className={`p-5 rounded-[2rem] border relative overflow-hidden shadow-xl ${
                        status.authorized 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.passportStatus}</span>
                            <h2 className="text-xl font-black font-display tracking-tight text-white mt-1 uppercase">
                              {status.authorized ? t.auth : t.blocked}
                            </h2>
                          </div>
                          <div className={`p-2.5 rounded-xl ${status.authorized ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {status.authorized ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 font-medium mt-4 flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${status.authorized ? 'bg-emerald-400' : 'bg-red-400 animate-pulse'}`}></span>
                          {status.reason}
                        </p>
                      </div>
                    );
                  })()}

                  {/* QR Passport Card */}
                  <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2rem] text-center shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><QrCode size={100} /></div>
                    <div className="bg-white p-3 rounded-2xl inline-block mb-4 shadow-inner">
                      {/* Fake QR code using CSS layout */}
                      <div className="w-32 h-32 bg-slate-950 flex flex-wrap items-center justify-center p-2 rounded-lg">
                        <QrCode size={110} className="text-white" />
                      </div>
                    </div>
                    <h3 className="font-bold text-white uppercase text-sm tracking-tight">{currentUser.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono">{t.empId}: {currentUser.recordId}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">{currentUser.company}</p>
                  </div>

                  {/* Requisition Status Matrix list */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">{t.safetyRequisitions}</h4>
                    
                    {/* ASO Medical Item */}
                    {(() => {
                      const req = requirements.find(r => r.employeeId === currentUser.id);
                      const isExpired = req?.medicalStatus === 'Expired';
                      return (
                        <div className="bg-slate-900/40 border border-white/5 px-4 py-3.5 rounded-2xl flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Activity size={18} className={isExpired ? "text-red-400" : "text-emerald-400"} />
                            <div className="text-left">
                              <div className="text-xs font-bold text-white">{t.asoText}</div>
                              <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                {isExpired ? `${t.expiredOn} ${req?.medicalExpiry}` : `${t.validUntil} ${req?.medicalExpiry || 'N/A'}`}
                              </div>
                            </div>
                          </div>
                          {isExpired ? <XCircle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                        </div>
                      );
                    })()}

                    {/* RAC Items */}
                    {requirements
                      .filter(r => r.employeeId === currentUser.id)
                      .map(req => {
                        const isExpired = req.status === 'Expired';
                        return (
                          <div key={req.id} className="bg-slate-900/40 border border-white/5 px-4 py-3.5 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Shield size={18} className={isExpired ? "text-red-400" : "text-emerald-400"} />
                              <div className="text-left">
                                <div className="text-xs font-bold text-white">{req.racCode} {t.safetyCertification}</div>
                                <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                                  {isExpired ? `${t.expiredOn} ${req.expiryDate}` : `${t.validUntil} ${req.expiryDate}`}
                                </div>
                              </div>
                            </div>
                            {isExpired ? <XCircle size={16} className="text-red-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />}
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* TAB: Bookings */}
              {activeTab === 'bookings' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* My Bookings History */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">{t.requestedTrainings}</h4>
                    
                    {bookings.filter(b => b.employeeId === currentUser.id).map(book => {
                      const session = sessions.find(s => s.id === book.sessionId) || { racCode: 'RAC', date: 'Upcoming', startTime: '' };
                      return (
                        <div key={book.id} className="bg-slate-900/50 border border-white/5 p-4 rounded-2xl flex justify-between items-center">
                          <div className="text-left">
                            <div className="font-bold text-white text-xs">{session.racCode} {t.moduleTraining}</div>
                            <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <Calendar size={12} /> {session.date} • {session.startTime}
                            </div>
                            <div className="text-[9px] text-slate-600 mt-0.5">{t.requested}: {new Date(book.requestedAt).toLocaleDateString()}</div>
                          </div>
                          
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${
                            book.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                            book.status === 'Waitlisted' ? 'bg-amber-500/15 text-amber-400 border-amber-500/20' :
                            book.status === 'Rejected' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                            'bg-slate-800 text-slate-400 border-slate-700/50 animate-pulse'
                          }`}>
                            {t.statuses[book.status] || book.status}
                          </span>
                        </div>
                      );
                    })}

                    {bookings.filter(b => b.employeeId === currentUser.id).length === 0 && (
                      <div className="text-center py-6 text-xs text-slate-500 italic bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                        {t.noBookings}
                      </div>
                    )}
                  </div>

                  {/* Available Upcoming Sessions */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1">{t.availableTraining}</h4>
                    
                    {sessions.map(sess => {
                      const isBooked = bookings.some(b => b.employeeId === currentUser.id && b.sessionId === sess.id);
                      return (
                        <div key={sess.id} className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex flex-col justify-between gap-4">
                          <div className="flex justify-between items-start">
                            <div className="text-left">
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-md">{sess.racCode}</span>
                              <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center gap-1">
                                <Calendar size={12} /> {sess.date} @ {sess.startTime}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin size={12} /> {sites.find(s => s.id === sess.siteId)?.name || 'Central Office'}
                              </div>
                            </div>
                            <div className="text-[9px] font-bold text-slate-500">{t.instructor} {sess.instructor}</div>
                          </div>

                          <button
                            disabled={isBooked}
                            onClick={() => handleBookSession(sess.id)}
                            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                              isBooked 
                                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                            }`}
                          >
                            {isBooked ? <BookCheck size={14} /> : <BookOpen size={14} />}
                            <span>{isBooked ? t.alreadyBooked : t.bookButton}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* TAB: Turnstile Access Gate Simulator */}
              {activeTab === 'gate' && (
                <div className="flex-1 flex flex-col justify-center py-4 animate-fade-in min-h-[500px]">
                  
                  {/* Gate State Idle */}
                  {gateStep === 'idle' && (
                    <div className="text-center space-y-6">
                      <div className="w-24 h-24 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center mx-auto shadow-inner relative">
                        <div className="absolute inset-1.5 rounded-full bg-red-500/20 border border-red-500/30 animate-pulse flex items-center justify-center">
                          <Lock size={32} className="text-red-400" />
                        </div>
                      </div>
                      
                      <div className="max-w-xs mx-auto">
                        <h3 className="font-bold text-white text-lg">{t.scanTitle}</h3>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">{t.scanDesc}</p>
                      </div>

                      <button 
                        onClick={startGateValidation}
                        className="mx-auto px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 active:scale-98 transition-all"
                      >
                        <QrCode size={16} />
                        <span>{t.scanButton}</span>
                      </button>
                    </div>
                  )}

                  {/* Gate State Scanning */}
                  {gateStep === 'scanning' && (
                    <div className="text-center space-y-4">
                      <RefreshCw size={40} className="text-indigo-400 animate-spin mx-auto" />
                      <p className="text-sm text-slate-300 font-medium">{t.scanningText}</p>
                    </div>
                  )}

                  {/* Gate State Validating Requisitions */}
                  {gateStep === 'validation' && (
                    <div className="text-center space-y-4">
                      <Activity size={40} className="text-emerald-400 animate-pulse mx-auto" />
                      <p className="text-sm text-slate-300 font-medium">{t.validatingText}</p>
                    </div>
                  )}

                  {/* Gate State Breathalyzer Info Screen */}
                  {gateStep === 'breathalyzer' && (
                    <div className="text-center space-y-6 animate-fade-in">
                      <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center mx-auto shadow-lg animate-pulse-slow">
                        <Wine size={36} />
                      </div>
                      
                      <div className="max-w-xs mx-auto space-y-2">
                        <h3 className="font-bold text-white text-lg">{t.breathalyzerTitle}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{t.breathalyzerDesc}</p>
                      </div>

                      {/* BAC Simulator Config */}
                      <div className="bg-slate-900 border border-white/5 p-4 rounded-2xl max-w-xs mx-auto space-y-3">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">{t.testScenarioMode}</span>
                        <div className="flex flex-col gap-2">
                          <button 
                            onClick={() => setSimulateFail(false)}
                            className={`py-2 px-3 rounded-lg font-bold text-[10px] text-left border flex items-center justify-between ${
                              !simulateFail ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span>{t.simulatePass}</span>
                            {!simulateFail && <Check size={12} />}
                          </button>
                          <button 
                            onClick={() => setSimulateFail(true)}
                            className={`py-2 px-3 rounded-lg font-bold text-[10px] text-left border flex items-center justify-between ${
                              simulateFail ? 'bg-red-500/10 border-red-500/40 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span>{t.simulateFail}</span>
                            {simulateFail && <Check size={12} />}
                          </button>
                        </div>
                      </div>

                      <button 
                        onMouseDown={() => setGateStep('blowing')}
                        onTouchStart={() => setGateStep('blowing')}
                        className="mx-auto w-40 h-40 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white font-black text-xs shadow-lg flex flex-col items-center justify-center gap-2 border-[6px] border-slate-950 ring-4 ring-amber-500/30 active:scale-95 transition-all select-none"
                      >
                        <Flame size={28} className="animate-bounce" />
                        <span>{t.blowButton}</span>
                      </button>
                    </div>
                  )}

                  {/* Gate State Blowing */}
                  {gateStep === 'blowing' && (
                    <div className="text-center space-y-6 animate-fade-in">
                      <div className="w-24 h-24 rounded-full bg-amber-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 animate-ping">
                        <Flame size={32} />
                      </div>
                      
                      <div className="max-w-xs mx-auto">
                        <p className="text-sm text-slate-300 font-bold">{t.blowingText}</p>
                        <div className="w-full bg-slate-900 h-3.5 rounded-full border border-slate-800 mt-4 overflow-hidden p-0.5">
                          <div 
                            className={`bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full transition-all duration-200 w-pct-${blowProgress}`}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gate State Processing BAC */}
                  {gateStep === 'processing' && (
                    <div className="text-center space-y-4">
                      <Wine size={40} className="text-amber-500 animate-spin mx-auto" />
                      <p className="text-sm text-slate-300 font-medium">{t.processingText}</p>
                    </div>
                  )}

                  {/* Gate State Validation Result */}
                  {gateStep === 'result' && (
                    <div className="text-center space-y-8 animate-fade-in-up">
                      <div className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-2xl relative border-4 border-slate-950 ring-4 ${
                        gateAccessGranted 
                          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/30' 
                          : 'bg-red-500/10 text-red-400 ring-red-500/30'
                      }`}>
                        {gateAccessGranted ? <CheckCircle2 size={48} /> : <XCircle size={48} />}
                      </div>

                      <div className="max-w-xs mx-auto space-y-2">
                        <h3 className={`font-black text-xl tracking-tight uppercase ${gateAccessGranted ? 'text-emerald-400' : 'text-red-400'}`}>
                          {gateAccessGranted ? t.gateOpen : t.gateClosed}
                        </h3>
                        <p className="text-xs text-slate-300 bg-slate-900 border border-white/5 p-4 rounded-2xl leading-relaxed mt-2 font-medium">
                          {gateReason}
                        </p>
                      </div>

                      <button 
                        onClick={resetGate}
                        className="mx-auto px-6 py-3.5 bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-bold text-xs rounded-xl transition-all hover:bg-slate-800"
                      >
                        {t.retry}
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* TAB: Profile & Language Settings */}
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Photo Profile Card */}
                  <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-4 relative overflow-hidden shadow-md">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-2xl uppercase">
                      {currentUser.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-white text-md tracking-tight leading-tight">{currentUser.name}</h3>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">{currentUser.recordId}</p>
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded inline-block mt-2">{currentUser.role}</p>
                    </div>
                  </div>

                  {/* Profile parameters list */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-[2rem] divide-y divide-white/5 overflow-hidden">
                    <div className="p-4 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-2"><Building2 size={16} />{t.node}</span>
                      <span className="font-bold text-white text-right truncate max-w-[180px]">{currentUser.company}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-2"><Activity size={16} />{t.department}</span>
                      <span className="font-bold text-white">{currentUser.department}</span>
                    </div>
                    <div className="p-4 flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-medium flex items-center gap-2"><UserCheck size={16} />{t.role}</span>
                      <span className="font-bold text-white">{currentUser.role}</span>
                    </div>
                  </div>

                  {/* Language Selector */}
                  <button 
                    onClick={() => setLang(lang === 'en' ? 'pt' : 'en')}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 py-4 rounded-2xl text-xs font-bold shadow-md flex items-center justify-center gap-2 active:scale-98 transition-all hover:bg-slate-800"
                  >
                    <span>{t.langToggle}</span>
                  </button>

                  {/* Sign out */}
                  <button 
                    onClick={handleSignOut}
                    className="w-full bg-red-500/15 border border-red-500/25 text-red-400 py-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 active:scale-98 transition-all hover:bg-red-500/20"
                  >
                    <LogOut size={16} />
                    <span>{t.signout}</span>
                  </button>
                </div>
              )}

              {/* TAB: Onboarding Pipeline */}
              {activeTab === 'onboarding' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Header */}
                  <div className="bg-slate-900/60 border border-white/5 p-5 rounded-[2rem] relative overflow-hidden shadow-md">
                    <div className="absolute top-0 right-0 p-4 opacity-5"><ClipboardList size={80} /></div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.onboardingTitle}</span>
                    <h2 className="text-lg font-black text-white mt-1">{t.onboardingSubtitle}</h2>
                  </div>

                  {/* Pipeline View */}
                  {(() => {
                    // Load mobilization processes from localStorage (shared with portals)
                    let processes: any[] = [];
                    try {
                      const saved = localStorage.getItem('mobilization_processes');
                      if (saved) processes = JSON.parse(saved);
                    } catch {}

                    // Find process matching current user by name (best effort match)
                    const myProcess = processes.find((p: any) =>
                      currentUser && (
                        p.candidateName?.toLowerCase() === currentUser.name?.toLowerCase() ||
                        p.candidateId === currentUser.recordId
                      )
                    );

                    if (!myProcess) {
                      return (
                        <div className="text-center py-10 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
                          <ClipboardList size={40} className="mx-auto text-slate-700 mb-3" />
                          <p className="text-xs text-slate-500 font-bold max-w-[240px] mx-auto leading-relaxed">{t.onboardingNoProcess}</p>
                        </div>
                      );
                    }

                    // Define pipeline stages and their order
                    const STAGES = [
                      { key: 'am_requested', status: 'AM_REQUESTED' },
                      { key: 'hr_pending', status: 'HR_PENDING' },
                      { key: 'security_pending', status: 'SECURITY_PENDING' },
                      { key: 'clinic_pending', status: 'CLINIC_PENDING' },
                      { key: 'induction_pending', status: 'INDUCTION_PENDING' },
                      { key: 'training_pending', status: 'TRAINING_PENDING' },
                      { key: 'completed', status: 'COMPLETED' },
                    ];

                    // Determine current stage index
                    const currentStatus = myProcess.status || 'AM_REQUESTED';
                    const currentIdx = STAGES.findIndex(s => s.status === currentStatus);
                    const progressPct = currentStatus === 'COMPLETED' ? 100 : Math.round(((currentIdx) / (STAGES.length - 1)) * 100);

                    return (
                      <div className="space-y-4">
                        {/* Process Info Card */}
                        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{t.onboardingRole}</span>
                            <span className="font-bold text-white">{myProcess.role}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400 font-medium">{t.onboardingSite}</span>
                            <span className="font-bold text-white">{myProcess.site || myProcess.company}</span>
                          </div>
                          {myProcess.requestedBy && (
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400 font-medium">{t.onboardingRequestedBy}</span>
                              <span className="font-bold text-white">{myProcess.requestedBy}</span>
                            </div>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t.onboardingProgress}</span>
                            <span className="text-[10px] font-black text-indigo-400">{progressPct}%</span>
                          </div>
                          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                progressPct === 100
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                  : 'bg-gradient-to-r from-indigo-600 to-indigo-400'
                              } w-pct-${progressPct}`}
                            />
                          </div>
                        </div>

                        {/* Stage List */}
                        <div className="space-y-0">
                          {STAGES.map((stage, idx) => {
                            const isCompleted = idx < currentIdx || currentStatus === 'COMPLETED';
                            const isCurrent = idx === currentIdx && currentStatus !== 'COMPLETED';
                            const isPending = idx > currentIdx && currentStatus !== 'COMPLETED';
                            const stageName = (t as any).onboardingStages[stage.key] || stage.key;
                            const stageDesc = (t as any).onboardingStageDesc[stage.key] || '';

                            return (
                              <div key={stage.key} className="flex gap-3">
                                {/* Vertical Line + Circle */}
                                <div className="flex flex-col items-center w-7 shrink-0">
                                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 ${
                                    isCompleted
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                      : isCurrent
                                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400 ring-4 ring-indigo-500/10'
                                        : 'bg-slate-800 border-slate-700 text-slate-600'
                                  }`}>
                                    {isCompleted ? <Check size={12} /> : isCurrent ? <ArrowRight size={12} /> : <Circle size={8} />}
                                  </div>
                                  {idx < STAGES.length - 1 && (
                                    <div className={`w-0.5 flex-1 min-h-[20px] ${
                                      isCompleted ? 'bg-emerald-500/40' : 'bg-slate-800'
                                    }`} />
                                  )}
                                </div>

                                {/* Content */}
                                <div className={`pb-4 pt-0.5 flex-1 ${
                                  isCurrent ? '' : isPending ? 'opacity-40' : ''
                                }`}>
                                  <div className={`text-xs font-bold ${
                                    isCompleted ? 'text-emerald-400' : isCurrent ? 'text-white' : 'text-slate-500'
                                  }`}>
                                    {stageName}
                                  </div>
                                  {isCurrent && (
                                    <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{stageDesc}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

        </div>

        {/* Dynamic Nav Bar (Only if user logged in) */}
        {currentUser && (
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-slate-950 border-t border-white/5 flex justify-around items-center px-2 z-50">
            <button 
              onClick={() => { setActiveTab('passport'); resetGate(); }}
              className={`flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all ${
                activeTab === 'passport' ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <QrCode size={20} />
              <span>{t.passport}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('bookings'); resetGate(); }}
              className={`flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all ${
                activeTab === 'bookings' ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <BookOpen size={20} />
              <span>{t.bookings}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('gate'); resetGate(); }}
              className={`flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all ${
                activeTab === 'gate' ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Wine size={20} />
              <span>{t.gate}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('onboarding'); resetGate(); }}
              className={`flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all ${
                activeTab === 'onboarding' ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <ClipboardList size={20} />
              <span>{t.onboarding}</span>
            </button>
            <button 
              onClick={() => { setActiveTab('profile'); resetGate(); }}
              className={`flex flex-col items-center gap-1 text-[9px] font-black uppercase tracking-wider transition-all ${
                activeTab === 'profile' ? 'text-indigo-400 scale-105' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <User size={20} />
              <span>{t.profile}</span>
            </button>
          </div>
        )}

        {/* iPhone Home Screen Indicator Bar */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-36 h-1 bg-white/20 rounded-full pointer-events-none z-50"></div>
      </div>
      
    </div>
  );
}
