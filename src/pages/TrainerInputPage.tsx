
import React, { useState, useMemo } from 'react';
import { Booking, BookingStatus, TrainingSession, UserRole, RacDef } from '../types';
import { 
    Save, AlertCircle, CheckCircle, Lock, Users, ClipboardList, 
    UserCheck, GraduationCap, CheckCircle2, Search, CheckSquare, 
    X, Filter, ArrowUpDown, MessageSquare, Sliders, ChevronDown, Printer, UserX, ShieldCheck,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { addMonths, format } from 'date-fns';
import { db } from '../services/databaseService';
import { useAuth } from '../contexts/AuthContext';

interface TrainerInputPageProps {
  bookings: Booking[];
  updateBookings: (updates: Booking[]) => void;
  sessions: TrainingSession[];
  userRole?: UserRole;
  currentUserName?: string;
  racDefinitions: RacDef[];
}

const TrainerInputPage: React.FC<TrainerInputPageProps> = ({ 
  bookings, 
  updateBookings, 
  sessions,
  userRole = UserRole.SYSTEM_ADMIN,
  currentUserName = '',
  racDefinitions
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionBookings, setSessionBookings] = useState<Booking[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Passed' | 'Failed' | 'Absent'>('All');
  const [sortBy, setSortBy] = useState<'Name' | 'ID' | 'Company' | 'Score'>('Name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [bulkTheory, setBulkTheory] = useState<string>('');
  const [bulkPractical, setBulkPractical] = useState<string>('');
  const [showBulkTools, setShowBulkTools] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
        case BookingStatus.PASSED: return t.common.passed;
        case BookingStatus.FAILED: return t.common.failed;
        case BookingStatus.ABSENT: return t.common.absent;
        case BookingStatus.PENDING: return t.common.pending;
        case BookingStatus.WAITLISTED: return t.common.waitlisted;
        default: return status;
    }
  };

  const availableSessions = useMemo(() => {
      let relevantSessions = sessions;
      if (userRole === UserRole.RAC_TRAINER) {
          relevantSessions = sessions.filter(s => s.instructor === currentUserName);
      }
      return relevantSessions.filter(session => {
          const count = bookings.filter(b => b.sessionId === session.id && b.status === BookingStatus.PENDING).length;
          return count > 0;
      });
  }, [sessions, bookings, userRole, currentUserName]);

  const getRacRequirements = (sessionId: string) => {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return { needsDl: false, needsPractical: true, passScore: 70 }; 
      const racCode = session.racType.split(' - ')[0].replace(/\s+/g, '');
      const def = racDefinitions.find(r => r.name === session.racType || r.code === racCode);
      return { 
        needsDl: def ? !!def.requiresDriverLicense : false, 
        needsPractical: def ? !!def.requiresPractical : true,
        passScore: def && def.passScore !== undefined ? def.passScore : 70
      };
  };

  const reqs = useMemo(() => getRacRequirements(selectedSessionId), [selectedSessionId]);
  const currentSession = sessions.find(s => s.id === selectedSessionId);

  const calculateStatus = (booking: Booking): BookingStatus => {
    if (!booking.attendance) return BookingStatus.ABSENT;
    if (reqs.needsDl && !booking.driverLicenseVerified) return BookingStatus.FAILED;
    const theory = booking.theoryScore || 0;
    const practical = booking.practicalScore || 0;
    if (theory < reqs.passScore) return BookingStatus.FAILED;
    if (reqs.needsPractical && practical < reqs.passScore) return BookingStatus.FAILED;
    return BookingStatus.PASSED;
  };

  const handleSessionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setSelectedSessionId(sId);
    if (sId) {
      const filtered = bookings.filter(b => b.sessionId === sId && b.status === BookingStatus.PENDING);
      setSessionBookings(filtered.map(b => ({
        ...b,
        attendance: b.attendance ?? false,
        theoryScore: b.theoryScore ?? 0,
        practicalScore: b.practicalScore ?? 0,
        driverLicenseVerified: b.driverLicenseVerified ?? false,
        comments: b.comments || '',
        trainerName: currentUserName || user?.name || 'TBD'
      })));
    } else {
      setSessionBookings([]);
    }
    setHasUnsavedChanges(false);
    setSuccessMsg('');
    setSearchQuery('');
  };

  const handleInputChange = (id: string, field: keyof Booking, value: any) => {
    setSessionBookings(prev => prev.map(b => {
      if (b.id !== id) return b;
      const updatedBooking = { ...b, [field]: value };
      
      // Reset scores if marked absent
      if (field === 'attendance' && value === false) {
          updatedBooking.theoryScore = 0;
          updatedBooking.practicalScore = 0;
      }

      if (reqs.needsPractical && field === 'theoryScore') {
        const score = parseInt(value) || 0;
        if (score < reqs.passScore) updatedBooking.practicalScore = 0;
      }
      updatedBooking.status = calculateStatus(updatedBooking);
      return updatedBooking;
    }));
    setHasUnsavedChanges(true);
  };

  const handleBulkAttendance = () => {
      setSessionBookings(prev => prev.map(b => {
          const updated = { ...b, attendance: true };
          updated.status = calculateStatus(updated);
          return updated;
      }));
      setHasUnsavedChanges(true);
  };

  const handleBulkScoreApply = () => {
      const tScore = parseInt(bulkTheory);
      const pScore = parseInt(bulkPractical);
      setSessionBookings(prev => prev.map(b => {
          const updated = { ...b };
          if (!isNaN(tScore)) updated.theoryScore = tScore;
          if (reqs.needsPractical && !isNaN(pScore)) updated.practicalScore = pScore;
          updated.status = calculateStatus(updated);
          return updated;
      }));
      setHasUnsavedChanges(true);
      setShowBulkTools(false);
  };

  const handleSave = async () => {
    const selectedSession = sessions.find(s => s.id === selectedSessionId);
    const sessionDateStr = selectedSession?.date || new Date().toISOString().split('T')[0];
    let racValidity = 24; 
    if (selectedSession) {
        const racCode = selectedSession.racType.split(' - ')[0].replace(/\s+/g, '');
        const def = racDefinitions.find(r => r.code === racCode || r.name === selectedSession.racType);
        if (def && def.validityMonths) racValidity = def.validityMonths;
    }
    const bookingsToSave = sessionBookings.map(b => {
        if (b.status === BookingStatus.PASSED) {
            try {
                const expiry = format(addMonths(new Date(sessionDateStr), racValidity), 'yyyy-MM-dd');
                return { ...b, resultDate: sessionDateStr, expiryDate: expiry, trainerName: currentUserName || user?.name || b.trainerName };
            } catch {
                return { ...b, resultDate: sessionDateStr, expiryDate: sessionDateStr, trainerName: currentUserName || user?.name || b.trainerName };
            }
        }
        return { ...b, trainerName: currentUserName || user?.name || b.trainerName };
    });
    updateBookings(bookingsToSave);
    await db.addLog('AUDIT', `TRAINING_RESULTS_COMMITTED: ${bookingsToSave.length} records for ${selectedSession?.racType}`, user?.name || 'Instructor', { sessionId: selectedSessionId });
    setSuccessMsg(t.trainer.saveSuccess);
    setHasUnsavedChanges(false);
    setTimeout(() => window.print(), 100);
    setTimeout(() => { setSuccessMsg(''); setSelectedSessionId(''); setSessionBookings([]); }, 1500);
  };

  const processedBookings = useMemo(() => {
      let data = [...sessionBookings];
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          data = data.filter(b => b.employee.name.toLowerCase().includes(q) || b.employee.recordId.toLowerCase().includes(q));
      }
      if (statusFilter !== 'All') {
          if (statusFilter === 'Passed') data = data.filter(b => b.status === BookingStatus.PASSED);
          else if (statusFilter === 'Failed') data = data.filter(b => b.status === BookingStatus.FAILED);
          else if (statusFilter === 'Absent') data = data.filter(b => b.status === BookingStatus.ABSENT);
      }
      data.sort((a, b) => {
          let valA: any = '', valB: any = '';
          switch(sortBy) {
              case 'Name': valA = a.employee.name; valB = b.employee.name; break;
              case 'ID': valA = a.employee.recordId; valB = b.employee.recordId; break;
              case 'Company': valA = a.employee.company; valB = b.employee.company; break;
              case 'Score': valA = a.theoryScore || 0; valB = b.theoryScore || 0; break;
          }
          if (valA < valB) return sortDir === 'asc' ? -1 : 1;
          if (valA > valB) return sortDir === 'asc' ? 1 : -1;
          return 0;
      });
      return data;
  }, [sessionBookings, searchQuery, statusFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(processedBookings.length / rowsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedSessionId, searchQuery, statusFilter, sortBy]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages > 0 ? totalPages : 1);
    }
  }, [processedBookings.length, rowsPerPage, totalPages, currentPage]);

  const handleHeaderClick = (field: typeof sortBy) => {
      if (sortBy === field) setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
      else { setSortBy(field); setSortDir('asc'); }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in-up">
      <div className="no-print bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden border border-slate-700">
         <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><GraduationCap size={200} /></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
                <h2 className="text-3xl font-black tracking-tight flex items-center gap-3"><ClipboardList size={32} className="text-yellow-500" />{t.trainer.title}</h2>
                <p className="text-slate-400 mt-2 text-sm flex items-center gap-2"><UserCheck size={16} />{t.trainer.loggedInAs} <span className="text-white font-bold">{currentUserName || user?.name || 'Admin'}</span></p>
            </div>
            {selectedSessionId && (
                <div className="flex gap-4">
                    <div className="bg-white/10 p-3 rounded-xl border border-white/10 backdrop-blur-sm text-center min-w-[100px]"><div className="text-2xl font-bold">{sessionBookings.length}</div><div className="text-[10px] uppercase text-slate-400 font-bold">{t.trainer.total}</div></div>
                    <div className="bg-green-500/20 p-3 rounded-xl border border-green-500/30 backdrop-blur-sm text-center min-w-[100px]"><div className="text-2xl font-bold text-green-400">{sessionBookings.filter(b => b.status === BookingStatus.PASSED).length}</div><div className="text-[10px] uppercase text-green-300 font-bold">{t.trainer.passing}</div></div>
                </div>
            )}
         </div>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col min-h-[600px] print:shadow-none print:border-none print:min-h-0">
          <div className="no-print p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            {availableSessions.length === 0 ? (<div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm border border-orange-200 flex items-center justify-center gap-2"><AlertCircle size={16} /><span>{t.trainer.noSessions}</span></div>) : (
                   <div className="max-w-3xl mx-auto"><label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">{t.trainer.selectSession}</label><div className="relative group"><select value={selectedSessionId} onChange={handleSessionChange} className="w-full bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl shadow-sm focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/20 p-4 pl-12 text-lg font-bold appearance-none cursor-pointer transition-all" title={t.trainer.selectSession} aria-label={t.trainer.selectSession}><option value="">{t.trainer.chooseSession}</option>{availableSessions.map(session => (<option key={session.id} value={session.id}>{session.racType} • {session.date} • {session.location} ({session.capacity} Cap)</option>))}</select><ClipboardList className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-yellow-500 transition-colors" size={24} /><ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} /></div></div>
            )}
          </div>
          {selectedSessionId && sessionBookings.length > 0 ? (
            <><div className="hidden print:block print:w-full print:bg-white text-slate-900 font-sans p-8 border-b-4 border-slate-900 mb-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
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
                        <span className="text-[8px] font-black uppercase text-slate-400 mt-1 tracking-widest">{t.trainer.systemRegister}</span>
                    </div>
                </div>

                <div className="flex justify-between items-start mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.trainer.issuingDept}</span>
                        <span className="text-sm font-bold text-slate-800 uppercase">{t.trainer.hseDeptName}</span>
                    </div>
                    <div className="text-right">
                        <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.trainer.generatedOn}</span>
                        <span className="text-xs font-bold text-slate-800 uppercase font-mono">{new Date().toLocaleString(language === 'en' ? 'en-GB' : 'pt-PT')}</span>
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 font-sans">
                        {t.trainer.printTitle}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-1">Ref: ZG-TRN-{currentSession?.id?.substring(0,8).toUpperCase() || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm border-t border-slate-200 pt-4 font-sans text-slate-800">
                    <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">{t.common.date}</span>
                        <span className="font-bold text-slate-900">{currentSession?.date}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">{t.common.time}</span>
                        <span className="font-bold text-slate-900">{currentSession?.startTime}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">{t.schedule.modal.location}</span>
                        <span className="font-bold text-slate-900">{currentSession?.location}</span>
                    </div>
                    <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">{t.schedule.modal.instructor}</span>
                        <span className="font-bold text-slate-900">{currentSession?.instructor}</span>
                    </div>
                </div>
            </div>
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col xl:flex-row gap-4 justify-between items-center bg-white dark:bg-slate-800 sticky top-0 z-20 shadow-sm no-print">
                  <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
                    <div className="relative flex-1 min-w-[200px]">
                      <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder={t.trainer.findStudent} 
                        className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600 border focus:border-blue-500 rounded-lg text-sm transition-all outline-none" 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                      />
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                      {(['All', 'Passed', 'Failed', 'Absent'] as const).map(filter => {
                        const labelMap = {
                          All: t.common.all,
                          Passed: t.common.passed,
                          Failed: t.common.failed,
                          Absent: t.common.absent
                        };
                        return (
                          <button 
                            key={filter} 
                            onClick={() => setStatusFilter(filter)} 
                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === filter ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                          >
                            {labelMap[filter]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full xl:w-auto justify-end">
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors shadow-sm">
                      <Printer size={16} /> {t.trainer.printRegister}
                    </button>
                    <button onClick={() => setShowBulkTools(!showBulkTools)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${showBulkTools ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                      <Sliders size={16} /> {t.trainer.batchOperations}
                    </button>
                  </div>
                </div>
                {showBulkTools && (
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-800 p-4 animate-fade-in-down flex flex-wrap items-center gap-4 no-print">
                    <button onClick={handleBulkAttendance} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 shadow-sm">
                      <CheckSquare size={16} /> {t.trainer.markAllPresent}
                    </button>
                    <div className="h-6 w-px bg-indigo-200 dark:bg-indigo-700 mx-2"></div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300">{t.trainer.bulkScore}</span>
                      <input type="number" placeholder={t.trainer.theoryPlaceholder} className="w-20 px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-center" value={bulkTheory} onChange={(e) => setBulkTheory(e.target.value)}/>
                      {reqs.needsPractical && (
                        <input type="number" placeholder={t.trainer.practicalPlaceholder} className="w-20 px-2 py-1.5 text-xs border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-center" value={bulkPractical} onChange={(e) => setBulkPractical(e.target.value)}/>
                      )}
                      <button onClick={handleBulkScoreApply} disabled={!bulkTheory && !bulkPractical} className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                        {t.trainer.apply}
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex-1 overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 print:bg-gray-100">
                      <tr>
                        <th onClick={() => handleHeaderClick('Name')} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 group print:text-black print:border-b print:border-black">
                          <div className="flex items-center gap-1">{t.trainer.thStudent} <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 ${sortBy === 'Name' ? 'opacity-100' : ''} no-print`}/></div>
                        </th>
                        <th onClick={() => handleHeaderClick('ID')} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 group hidden md:table-cell print:table-cell print:text-black print:border-b print:border-black">
                          <div className="flex items-center gap-1">{t.trainer.thId} <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 ${sortBy === 'ID' ? 'opacity-100' : ''} no-print`}/></div>
                        </th>
                        <th onClick={() => handleHeaderClick('Company')} className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-700 group hidden lg:table-cell print:table-cell print:text-black print:border-b print:border-black">
                          <div className="flex items-center gap-1">{t.trainer.thCompany} <ArrowUpDown size={12} className={`opacity-0 group-hover:opacity-100 ${sortBy === 'Company' ? 'opacity-100' : ''} no-print`}/></div>
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 print:text-black print:border-b print:border-black">{t.trainer.thPresent}</th>
                        {reqs.needsDl && <th className="px-4 py-3 text-center text-xs font-bold text-red-500 uppercase tracking-wider w-16 bg-red-50 dark:bg-red-900/10 print:bg-transparent print:text-black print:border-b print:border-black">{t.trainer.thDlVer}</th>}
                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24 print:text-black print:border-b print:border-black">{t.trainer.thTheory}</th>
                        {reqs.needsPractical && <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-24 print:text-black print:border-b print:border-black">{t.trainer.thPractical}</th>}
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32 print:text-black print:border-b print:border-black">{t.trainer.thStatus}</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-48 no-print">{t.trainer.thRemarks}</th>
                        <th className="hidden print:table-cell px-4 py-3 text-center text-xs font-bold text-black uppercase tracking-wider w-32 border-b border-black">{t.trainer.thSignature}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800 print:divide-gray-300">
                      {processedBookings.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((booking) => {
                        const isDisqualified = reqs.needsDl && !booking.driverLicenseVerified;
                        const isPassed = booking.status === BookingStatus.PASSED;
                        const isAbsent = booking.status === BookingStatus.ABSENT;
                        return (
                          <tr key={booking.id} className={`transition-colors ${isPassed ? 'bg-green-50/30 dark:bg-green-900/5 hover:bg-green-50/50 print:bg-transparent' : isAbsent ? 'bg-slate-50/50 opacity-80' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 print:bg-transparent'} print:break-inside-avoid`}>
                            <td className="px-4 py-3 print:py-2 print:border-b print:border-gray-200">
                              <div className="font-bold text-slate-800 dark:text-white text-sm print:text-black">{booking.employee.name}</div>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-sm font-mono text-slate-600 dark:text-slate-300 print:table-cell print:text-black print:py-2 print:border-b print:border-gray-200">{booking.employee.recordId}</td>
                            <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500 print:table-cell print:text-black print:py-2 print:border-b print:border-gray-200">{booking.employee.company}</td>
                            <td className="px-4 py-3 text-center print:py-2 print:border-b print:border-gray-200">
                              <input type="checkbox" className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer" checked={booking.attendance || false} onChange={(e) => handleInputChange(booking.id, 'attendance', e.target.checked)} title={t.trainer.thPresent} aria-label={t.trainer.thPresent} />
                            </td>
                            {reqs.needsDl && (
                              <td className="px-4 py-3 text-center bg-red-50/30 dark:bg-red-900/10 print:bg-transparent print:py-2 print:border-b print:border-gray-200">
                                <input type="checkbox" className="w-5 h-5 rounded text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer" checked={booking.driverLicenseVerified || false} disabled={isAbsent} onChange={(e) => handleInputChange(booking.id, 'driverLicenseVerified', e.target.checked)} title={t.trainer.thDlVer} aria-label={t.trainer.thDlVer} />
                              </td>
                            )}
                            <td className="px-4 py-3 print:py-2 print:border-b print:border-gray-200">
                              <input 
                                type="number" 
                                min="0" 
                                max="100" 
                                className={`w-full text-center p-1.5 text-sm font-bold border rounded-lg outline-none focus:ring-2 transition-all ${
                                  isAbsent ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : 
                                  isDisqualified ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 
                                  (booking.theoryScore || 0) >= reqs.passScore ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'
                                }`} 
                                value={isAbsent ? 0 : booking.theoryScore} 
                                disabled={isDisqualified || isAbsent} 
                                onChange={(e) => handleInputChange(booking.id, 'theoryScore', parseInt(e.target.value) || 0)}
                                title={t.trainer.thTheory}
                                placeholder={t.trainer.thTheory}
                              />
                            </td>
                            {reqs.needsPractical && (
                              <td className="px-4 py-3 relative print:py-2 print:border-b print:border-gray-200">
                                {isAbsent || isDisqualified || (booking.theoryScore || 0) < reqs.passScore ? (
                                  <div className="absolute inset-0 flex items-center justify-center print:hidden"><Lock size={14} className="text-slate-300" /></div>
                                ) : (
                                  <input 
                                    type="number" 
                                    min="0" 
                                    max="100" 
                                    className={`w-full text-center p-1.5 text-sm font-bold border rounded-lg outline-none focus:ring-2 transition-all ${
                                      (booking.practicalScore || 0) >= reqs.passScore ? 'border-green-300 bg-green-50 text-green-700' : 'border-red-300 bg-red-50 text-red-700'
                                    }`} 
                                    value={booking.practicalScore} 
                                    onChange={(e) => handleInputChange(booking.id, 'practicalScore', parseInt(e.target.value) || 0)}
                                    title={t.trainer.thPractical}
                                    placeholder={t.trainer.thPractical}
                                  />
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 print:py-2 print:border-b print:border-gray-200">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider border shadow-sm ${isPassed ? 'bg-green-100 border-green-200 text-green-700 dark:text-green-400' : isAbsent ? 'bg-slate-100 border-slate-200 text-slate-700 dark:text-slate-400' : 'bg-red-100 border-red-200 text-red-700 dark:text-red-400'}`}>
                                {isAbsent ? <UserX size={10} /> : null}{getStatusLabel(booking.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3 no-print">
                              <div className="relative">
                                <input type="text" placeholder={t.trainer.addRemarks} className="w-full bg-transparent border-b border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none text-xs py-1 text-slate-600 dark:text-slate-300" value={booking.comments || ''} onChange={(e) => handleInputChange(booking.id, 'comments', e.target.value)}/>
                                <MessageSquare size={10} className="absolute right-0 top-1.5 text-slate-300 pointer-events-none" />
                              </div>
                            </td>
                            <th className="hidden print:table-cell px-4 py-3 border-b border-black"></th>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
              </div>
              {/* Pagination Footer */}
              {processedBookings.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0 no-print">
                  <div className="flex items-center gap-2">
                    <span>{t.common.rowsPerPage}</span>
                    <select
                      title={t.common.rowsPerPage}
                      value={rowsPerPage}
                      onChange={e => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-yellow-500 cursor-pointer text-slate-700 dark:text-slate-200"
                    >
                      {[20, 30, 50, 80, 100].map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>
                      {t.trainer.showingOf
                        .replace('{start}', String(Math.min(processedBookings.length, (currentPage - 1) * rowsPerPage + 1)))
                        .replace('{end}', String(Math.min(processedBookings.length, currentPage * rowsPerPage)))
                        .replace('{total}', String(processedBookings.length))}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-500 dark:text-slate-400"
                        title={t.booking.prevPage}
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-slate-500 dark:text-slate-400"
                        title={t.booking.nextPage}
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
                <div className="hidden print:flex mt-12 pt-8 border-t-2 border-black justify-between gap-20 page-break-inside-avoid">
                  <div className="flex-1">
                    <div className="border-t border-black w-full pt-2">
                      <p className="font-bold text-sm text-black">{t.trainer.instructorSignature}</p>
                      <p className="text-xs text-gray-500">{t.trainer.certifyAccurate}</p>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="border-t border-black w-full pt-2">
                      <p className="font-bold text-sm text-black">{t.trainer.hseReviewer}</p>
                      <p className="text-xs text-gray-500">{t.trainer.validationRecord}</p>
                    </div>
                  </div>
                </div>
                <div className="sticky bottom-0 z-30 p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center no-print">
                  <div className="text-xs text-slate-500 font-medium">
                    {hasUnsavedChanges ? (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        <AlertCircle size={14}/> {t.trainer.unsavedChanges}
                      </span>
                    ) : (
                      <span className="text-green-600 flex items-center gap-1">
                        {successMsg && <CheckCircle size={14}/>} {successMsg}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={handleSave} 
                    disabled={!hasUnsavedChanges} 
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-0.5 ${hasUnsavedChanges ? 'bg-yellow-500 hover:bg-yellow-400 text-slate-900 shadow-yellow-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`}
                  >
                    <Save size={18} /> {t.trainer.saveResults}
                  </button>
                </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="bg-slate-50 dark:bg-slate-700/50 p-6 rounded-full mb-4">
                <ClipboardList size={48} className="text-slate-300 dark:text-slate-500" />
              </div>
              <p className="font-medium text-lg">{t.trainer.noPendingSelected}</p>
              <p className="text-sm">{t.trainer.chooseSessionToStart}</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default TrainerInputPage;
