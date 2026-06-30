
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, BookingStatus, Booking, UserRole, TrainingSession, SystemNotification, EmployeeRequirement, RacDef, Company } from '../types';
import { DEPARTMENTS, ROLES } from '../constants';
import { 
    Plus, Trash2, Save, Settings, ShieldCheck, Calendar, UserPlus, 
    FileSignature, CheckCircle2, AlertCircle, Search, UserCheck, 
    RefreshCw, Lock, Layers, UserMinus, ArrowRight, ClipboardList, Info, Bell,
    ChevronLeft, ChevronRight
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate, useLocation } from 'react-router-dom';
import { sanitizeInput } from '../utils/security';
import { logger } from '../utils/logger';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/databaseService';

interface BookingFormProps {
  addBookings: (newBookings: Booking[]) => void;
  sessions: TrainingSession[];
  userRole: UserRole;
  existingBookings?: Booking[];
  addNotification: (notification: SystemNotification) => void; 
  currentEmployeeId?: string;
  requirements?: EmployeeRequirement[];
  racDefinitions: RacDef[];
  companies?: Company[];
}

interface RenewalBatch {
    racType: string;
    employees: Employee[];
}

const BookingForm: React.FC<BookingFormProps> = ({ addBookings, sessions, userRole, existingBookings = [], addNotification, currentEmployeeId, requirements = [], racDefinitions, companies = [] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [activeSessionId, setActiveSessionId] = useState('');
  
  const [targetRac, setTargetRac] = useState<string>('');
  const [renewalQueue, setRenewalQueue] = useState<RenewalBatch[]>([]);
  
  const isSelfService = userRole === UserRole.USER;

  const defaultCompany = useMemo(() => companies[0]?.name || 'Internal', [companies]);

  const initialRows = useMemo(() => Array.from({ length: isSelfService ? 1 : 5 }).map(() => ({
    id: uuidv4(),
    name: '',
    recordId: '',
    company: defaultCompany,
    department: DEPARTMENTS[0],
    role: ROLES[0],
    driverLicenseNumber: '',
    driverLicenseClass: '',
    driverLicenseExpiry: ''
  })), [isSelfService, defaultCompany]);

  const [rows, setRows] = useState(initialRows);
  const [submitted, setSubmitted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const totalPages = Math.ceil(rows.length / rowsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages > 0 ? totalPages : 1);
    }
  }, [rows.length, rowsPerPage, totalPages, currentPage]);

  const availableSessions = useMemo(() => {
      const sorted = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      if (isSelfService && currentEmployeeId) {
          const myReq = requirements.find(r => r.employeeId === currentEmployeeId);
          if (!myReq) return [];
          return sorted.filter(session => {
              const racKey = session.racType.split(' - ')[0].replace(/\s+/g, '');
              return myReq.requiredRacs[racKey] === true;
          });
      }
      return sorted;
  }, [sessions, isSelfService, currentEmployeeId, requirements]);

  const currentSession = useMemo(() => sessions.find(s => s.id === activeSessionId), [activeSessionId, sessions]);
  
  const currentOccupancy = useMemo(() => {
      if (!activeSessionId) return 0;
      return existingBookings.filter(b => b.sessionId === activeSessionId && (b.status === BookingStatus.PENDING || b.status === BookingStatus.PASSED)).length;
  }, [activeSessionId, existingBookings]);

  const isSessionFull = currentSession ? currentOccupancy >= currentSession.capacity : false;

  useEffect(() => {
    const state = location.state as { prefill?: any[]; targetRac?: string; remainingBatches?: RenewalBatch[] } | null;
    if (state) {
        if (state.prefill) setRows(state.prefill.map(e => ({ ...e, id: uuidv4() })));
        if (state.targetRac) {
            setTargetRac(state.targetRac);
            const match = availableSessions.find(s => s.racType.includes(state.targetRac!));
            if (match) setActiveSessionId(match.id);
        }
        if (state.remainingBatches) setRenewalQueue(state.remainingBatches);
        window.history.replaceState({}, document.title);
    }
  }, [location, availableSessions]);

  const handleRowChange = (index: number, field: keyof Employee, value: string) => {
    const safeValue = (field === 'name' || field === 'recordId') ? sanitizeInput(value) : value;
    const newRows = [...rows];
    // @ts-ignore
    newRows[index][field] = safeValue;
    setRows(newRows);
  };

  const handleIdBlur = (index: number) => {
      const enteredId = rows[index].recordId.trim().toLowerCase();
      if (!enteredId) return;
      const match = existingBookings.find(b => b.employee.recordId.toLowerCase() === enteredId)?.employee;
      if (match) {
          const newRows = [...rows];
          newRows[index] = { ...newRows[index], ...match, id: newRows[index].id };
          setRows(newRows);
      }
  };

  const addRow = () => {
    setRows([...rows, { ...initialRows[0], id: uuidv4() }]);
  };

  const checkWaitlistPressureAndNotify = (racType: string) => {
      const racCode = racType.split(' - ')[0];
      const waitlistCount = existingBookings.filter(b => {
          if (b.status !== BookingStatus.WAITLISTED) return false;
          const sess = sessions.find(s => s.id === b.sessionId);
          return sess?.racType.includes(racCode);
      }).length;

      if (waitlistCount >= 5) {
          addNotification({
              id: uuidv4(),
              type: 'warning',
              title: t.booking.demandAlertTitle,
              message: t.booking.demandAlertMsg.replace('{rac}', racCode).replace('{count}', String(waitlistCount)),
              timestamp: new Date(),
              isRead: false
          });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSessionId) {
      addNotification({ id: uuidv4(), type: 'warning', title: t.booking.inputError, message: t.booking.selectSessionWarning, timestamp: new Date(), isRead: false });
      return;
    }

    const validRows = rows.filter(r => r.name.trim() !== '' && r.recordId.trim() !== '');
    if (validRows.length === 0) return;

    const session = availableSessions.find(s => s.id === activeSessionId);
    if (!session) return;

    const capacity = session.capacity;
    let occupancyCursor = currentOccupancy;

    const newBookings: Booking[] = validRows.map(row => {
        const isOverflow = occupancyCursor >= capacity;
        occupancyCursor++;

        return {
            id: uuidv4(),
            sessionId: activeSessionId,
            employee: { ...row },
            status: isOverflow ? BookingStatus.WAITLISTED : BookingStatus.PENDING,
            isAutoBooked: false,
            trainerName: session.instructor || 'TBD'
        };
    });

    // Ensure confirmed employees exist in the employees table before creating bookings
    for (const b of newBookings) {
        const savedEmp = await db.upsertEmployee(b.employee);
        b.employee = savedEmp;
    }

    // Call the application prop handler
    addBookings(newBookings);
    
    const waitlistedCount = newBookings.filter(b => b.status === BookingStatus.WAITLISTED).length;
    const pendingCount = newBookings.length - waitlistedCount;

    await db.addLog('AUDIT', `REQUISITION_PROCESSED: ${pendingCount} Confirmed, ${waitlistedCount} Queued for ${session.racType}`, user?.name || 'System', { sessionId: activeSessionId });

    if (waitlistedCount > 0) {
        checkWaitlistPressureAndNotify(session.racType);
    }

    setSubmitted(true);
    addNotification({ 
        id: uuidv4(), 
        type: waitlistedCount > 0 ? 'warning' : 'success', 
        title: waitlistedCount > 0 ? t.booking.queueProcessedTitle : t.booking.successTitle, 
        message: waitlistedCount > 0 ? t.booking.waitlistSuccessMsg.replace('{count}', String(waitlistedCount)) : t.booking.enrollmentSuccessMsg.replace('{count}', String(newBookings.length)), 
        timestamp: new Date(), 
        isRead: false 
    });
    
    setTimeout(() => {
        setSubmitted(false);
        setRows(initialRows);
        setActiveSessionId('');
        if (renewalQueue.length === 0) navigate('/');
    }, 1500);
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in-up">
      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden border border-slate-700">
         <div className="absolute top-0 right-0 opacity-5 pointer-events-none"><ClipboardList size={300} /></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-sm border border-indigo-500/30">
                    <FileSignature size={28} className="text-indigo-400" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-white">{isSelfService ? t.booking.selfServiceTitle : t.booking.title}</h2>
               </div>
               <p className="text-slate-400 text-sm max-w-xl flex items-center gap-2 font-medium">
                  <ShieldCheck size={16} className="text-green-400" />
                  {t.booking.secureMode}
               </p>
            </div>
         </div>
      </div>

      {isSessionFull && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 p-4 rounded-2xl flex items-start gap-4 animate-fade-in-down shadow-sm">
              <div className="p-2 bg-amber-500 rounded-xl text-white shadow-lg shadow-amber-500/30 shrink-0">
                  <AlertCircle size={24} />
              </div>
              <div>
                  <h4 className="font-black text-amber-800 dark:text-amber-200 uppercase tracking-tight text-sm">{t.booking.capacityWarningTitle}</h4>
                  <p className="text-amber-700 dark:text-amber-400 text-sm font-medium leading-relaxed mt-0.5">
                      {t.booking.waitlistWarning}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase text-amber-500 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">{t.booking.occupancy}: {currentOccupancy} / {currentSession?.capacity}</span>
                  </div>
              </div>
          </div>
      )}

      {submitted && (
        <div className="bg-green-500 text-white p-4 rounded-xl shadow-lg flex items-center justify-center gap-3 animate-bounce-in">
            <CheckCircle2 size={24} />
            <span className="font-bold text-lg">{t.booking.success}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">
                  {t.booking.selectSession}
               </label>
               <div className="relative">
                   <select 
                      value={activeSessionId} 
                      onChange={(e) => setActiveSessionId(e.target.value)}
                      title={t.booking.selectSession}
                      className={`w-full bg-white dark:bg-slate-700 border-2 rounded-2xl p-4 text-xl font-bold appearance-none cursor-pointer transition-all ${isSessionFull ? 'border-amber-400' : targetRac ? 'border-indigo-500 ring-4 ring-indigo-500/10' : 'border-slate-200 dark:border-slate-600 focus:border-indigo-500'}`}
                      required
                    >
                      <option value="">-- {t.booking.chooseSession} --</option>
                      {availableSessions.map(session => (
                        <option key={session.id} value={session.id}>
                            {session.racType} • {session.date} • {session.location} (Cap: {session.capacity})
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><Calendar size={24} /></div>
               </div>
            </div>

            <div className="p-6 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-4 py-3">{t.booking.thIdNumber}</th>
                    <th className="px-4 py-3">{t.booking.thFullName}</th>
                    <th className="px-4 py-3">{t.booking.thDepartment}</th>
                    <th className="px-4 py-3">{t.booking.thCompany}</th>
                    <th className="px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {rows.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map((row, displayedIndex) => {
                    const index = (currentPage - 1) * rowsPerPage + displayedIndex;
                    return (
                      <tr key={row.id}>
                        <td className="px-2 py-3">
                          <input 
                              className="w-full bg-slate-50 dark:bg-slate-700 border-transparent focus:bg-white border focus:border-indigo-500 rounded-lg p-2 text-sm font-mono" 
                              placeholder="VUL-XXXX"
                              value={row.recordId} 
                              onChange={(e) => handleRowChange(index, 'recordId', e.target.value)}
                              onBlur={() => handleIdBlur(index)}
                          />
                        </td>
                        <td className="px-2 py-3">
                          <input className="w-full bg-slate-50 dark:bg-slate-700 border-transparent focus:bg-white border focus:border-indigo-500 rounded-lg p-2 text-sm font-bold" placeholder={t.booking.thFullName} value={row.name} onChange={(e) => handleRowChange(index, 'name', e.target.value)} />
                        </td>
                        <td className="px-2 py-3">
                          <select className="w-full bg-slate-50 dark:bg-slate-700 border-transparent rounded-lg p-2 text-xs" value={row.department} title={t.common.department} onChange={(e) => handleRowChange(index, 'department', e.target.value)}>
                              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-3">
                          <select className="w-full bg-slate-50 dark:bg-slate-700 border-transparent rounded-lg p-2 text-xs" value={row.company} title={t.common.company} onChange={(e) => handleRowChange(index, 'company', e.target.value)}>
                              {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-3 text-center">
                          <button type="button" onClick={() => setRows(rows.filter((_, i) => i !== index))} title={t.booking.deleteRow} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination Footer */}
              {rows.length > 0 && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700 rounded-2xl mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  <div className="flex items-center gap-2">
                    <span>{t.booking.rowsPerPage}</span>
                    <select
                      value={rowsPerPage}
                      onChange={e => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      title={t.booking.rowsPerPage}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-700 dark:text-slate-200"
                    >
                      {[20, 30, 50, 80, 100].map(val => (
                        <option key={val} value={val}>{val}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>
                      {t.booking.showingOf
                        .replace('{start}', String(Math.min(rows.length, (currentPage - 1) * rowsPerPage + 1)))
                        .replace('{end}', String(Math.min(rows.length, currentPage * rowsPerPage)))
                        .replace('{total}', String(rows.length))}
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
              <button type="button" onClick={addRow} className="mt-4 flex items-center gap-2 text-indigo-600 font-bold text-sm px-4 py-2 hover:bg-indigo-50 rounded-xl transition-all">
                <Plus size={16}/> {t.booking.addRow}
              </button>
            </div>

            <div className="p-8 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
              <button type="submit" className={`bg-indigo-600 hover:bg-indigo-500 text-white text-lg px-12 py-4 rounded-2xl font-black shadow-xl shadow-indigo-500/20 transition-all transform hover:-translate-y-1 ${isSessionFull ? 'from-amber-600 to-amber-500 shadow-amber-500/30' : ''}`}>
                <Save size={20} className="inline mr-2" /> {isSessionFull ? t.booking.registerToWaitlist : t.booking.submitBooking}
              </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default BookingForm;
