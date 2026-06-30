
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { Booking, BookingStatus, UserRole, TrainingSession, Employee, EmployeeRequirement, RacDef, SystemNotification } from '../types';
import { 
  Upload, FileSpreadsheet, Search, Filter, Download, 
  CheckCircle2, XCircle, Award, Users, TrendingUp,
  FileText, Calendar, User, MapPin,
  ChevronLeft, ChevronRight, Briefcase, QrCode, Printer, Phone, AlertTriangle, X, Clock, CreditCard, UserX, ListFilter, LayoutList, Info, Rocket, FileDown, RefreshCw
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { format, addMonths, isValid, parseISO } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';
import { OPS_KEYS } from '../constants';
import { db, isUUID } from '../services/databaseService';
import { useAuth } from '../contexts/AuthContext';

import { parseCsv } from '../utils/csvParser';

interface ResultsPageProps {
  bookings: Booking[];
  updateBookingStatus: (id: string, status: BookingStatus) => void;
  importBookings?: (newBookings: Booking[], sideEffects?: { employee: Employee, aso: string, ops: Record<string, boolean> }[]) => void;
  userRole: UserRole;
  sessions: TrainingSession[];
  currentEmployeeId?: string;
  racDefinitions: RacDef[];
  addNotification: (notif: SystemNotification) => void;
  currentSiteId: string;
  onRefresh?: () => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ bookings, updateBookingStatus, importBookings, userRole, sessions, currentEmployeeId, racDefinitions, addNotification, currentSiteId, onRefresh }) => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const initialQuery = searchParams.get('q') || '';
  const [filter, setFilter] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [trainerFilter, setTrainerFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [racFilter, setRacFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [viewMode, setViewMode] = useState<'All' | 'Waitlist'>('All');
  const [isPromoting, setIsPromoting] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();
  
  const isAdmin = userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.RAC_ADMIN || userRole === UserRole.SITE_ADMIN;

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) setFilter(query);
    if (location.state?.filterWaitlist) {
        setViewMode('Waitlist');
        setStatusFilter('waitlisted');
    }
  }, [searchParams, location.state]);

  useEffect(() => {
      setCurrentPage(1);
  }, [filter, statusFilter, trainerFilter, dateFilter, racFilter, viewMode]);

  const uniqueTrainers = useMemo(() => {
      const trainers = new Set<string>();
      bookings.forEach(b => {
          if (b.trainerName) trainers.add(b.trainerName);
      });
      return Array.from(trainers).sort();
  }, [bookings]);

  const getTranslatedRacName = (rawInput: string) => {
      if (!rawInput) return '';
      let code = rawInput;
      if (code.includes(' - ')) code = code.split(' - ')[0];
      else if (code.includes('|')) code = code.split('|')[0];
      const cleanCode = code.replace(/\s+/g, '').toUpperCase().replace('(IMP)', '');
      // @ts-ignore
      const translated = t.racDefs?.[cleanCode];
      if (translated) return translated;
      const def = racDefinitions.find(r => r.code.replace(/\s+/g, '').toUpperCase() === cleanCode);
      if (def) return def.name;
      return rawInput;
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const siteId = b.employee.siteId || 's1';
      if (currentSiteId !== 'all' && siteId !== currentSiteId) return false;
      if (userRole === UserRole.USER && currentEmployeeId) {
          if (b.employee.id !== currentEmployeeId) return false;
      }
      if (viewMode === 'Waitlist' && b.status !== BookingStatus.WAITLISTED) return false;
      
      const session = sessions.find(s => s.id === b.sessionId);
      const bookingDate = session ? session.date : (b.resultDate || '');
      const bookingTrainer = b.trainerName || (session ? session.instructor : 'TBD');
      
      let bookingRacCode = '';
      if (session) bookingRacCode = session.racType.split(' - ')[0].replace(' ', '');
      else if (b.sessionId && typeof b.sessionId === 'string' && b.sessionId.includes('RAC')) bookingRacCode = b.sessionId.split(' - ')[0].replace(' ', '');
      
      if (!bookingRacCode && b.sessionId && typeof b.sessionId === 'string' && b.sessionId.includes('|')) bookingRacCode = b.sessionId.split('|')[0];
      
      bookingRacCode = bookingRacCode.replace(/(\(imp\))/gi, '').replace(/\s+/g, '').toUpperCase();

      const matchesSearch = String(b.employee.name).toLowerCase().includes(filter.toLowerCase()) || 
                           String(b.employee.recordId).toLowerCase().includes(filter.toLowerCase());
      const matchesStatus = statusFilter === 'All' ? true : b.status.toLowerCase() === statusFilter.toLowerCase();
      const matchesTrainer = trainerFilter === 'All' ? true : bookingTrainer === trainerFilter;
      const matchesDate = dateFilter === '' ? true : bookingDate === dateFilter;
      const matchesRac = racFilter === 'All' ? true : bookingRacCode === racFilter.toUpperCase();

      return matchesSearch && matchesStatus && matchesTrainer && matchesDate && matchesRac;
    });
  }, [bookings, filter, statusFilter, trainerFilter, dateFilter, racFilter, sessions, userRole, currentEmployeeId, currentSiteId, viewMode]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  const handlePromote = async (booking: Booking) => {
      setIsPromoting(booking.id);
      try {
          await db.promoteFromWaitlist(booking.id, booking.sessionId, booking.employee.id);
          await db.addLog('AUDIT', `PROMOTED_FROM_WAITLIST: ${booking.employee.recordId}`, user?.name || 'Admin');
          addNotification({
              id: uuidv4(),
              type: 'success',
              title: 'Personnel Promoted',
              message: `${booking.employee.name} moved to Confirmed Seat.`,
              timestamp: new Date(),
              isRead: false
          });
          if (onRefresh) onRefresh();
      } catch (err) {
          console.error(err);
      } finally {
          setIsPromoting(null);
      }
  };

  const handleDownloadTemplate = () => {
    const headers = ['Record ID', 'Full Name', 'Company', 'Department', 'Role', 'RAC Code (e.g. RAC01)', 'Evaluation Date (YYYY-MM-DD)', 'Theory Score', 'Practical Score', 'Attendance (Yes/No)', 'Status (Passed/Failed)', 'Trainer Name', 'Classroom/Location'];
    const sample = ['VUL-5001', 'Sample Employee', 'Vulcan', 'Operations', 'Operator', 'RAC01', format(new Date(), 'yyyy-MM-dd'), '85', '90', 'Yes', 'Passed', 'John Doe', 'Auditorium A'];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), sample.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "training_records_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        const rows = parseCsv(text);
        
        const newImportedBookings: Booking[] = [];
        const sideEffects: { employee: Employee, aso: string, ops: Record<string, boolean> }[] = [];

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            if (!cols) continue;
            
            const recordId = cols[0];
            const name = cols[1];
            const company = cols[2];
            const racCode = cols[5]?.toUpperCase();
            const resultDate = cols[6];
            const theoryScore = parseInt(cols[7]) || 0;
            const status = (cols[10] || 'Passed') as BookingStatus;
            const classroom = cols[12] || 'Imported Historical Data';

            if (recordId && racCode) {
                const employee: Employee = {
                    id: uuidv4(),
                    recordId,
                    name: name || 'Unknown',
                    company: company || 'Unknown',
                    department: cols[3] || 'N/A',
                    role: cols[4] || 'N/A',
                    isActive: true,
                    // Ensure siteId is a UUID or null. Mock ID "s1" is not a valid UUID.
                    siteId: isUUID(currentSiteId) ? currentSiteId : undefined
                };

                const def = racDefinitions.find(r => r.code === racCode);
                let expiryDate = '';
                if (status === BookingStatus.PASSED && resultDate) {
                    try {
                        const parsedDate = parseISO(resultDate);
                        if (isValid(parsedDate)) {
                            expiryDate = format(addMonths(parsedDate, def?.validityMonths || 24), 'yyyy-MM-dd');
                        }
                    } catch (e) {
                        console.error("Invalid date in CSV row", i);
                    }
                }

                newImportedBookings.push({
                    id: uuidv4(),
                    sessionId: `HISTORICAL-${racCode}-${resultDate}`, 
                    employee,
                    status,
                    resultDate,
                    expiryDate,
                    theoryScore,
                    practicalScore: parseInt(cols[8]) || 0,
                    attendance: cols[9]?.toLowerCase() === 'yes',
                    trainerName: cols[11] || 'CSV Import',
                    comments: `Classroom: ${classroom}`
                });

                sideEffects.push({
                    employee,
                    aso: '',
                    ops: { [racCode]: true }
                });
            }
        }

        if (newImportedBookings.length > 0 && importBookings) {
            try {
                await importBookings(newImportedBookings, sideEffects);
                addNotification({
                    id: uuidv4(),
                    type: 'success',
                    title: 'Sync Complete',
                    message: `Successfully updated ${newImportedBookings.length} records in the cloud.`,
                    timestamp: new Date(),
                    isRead: false
                });
                if (onRefresh) onRefresh();
            } catch (err: any) {
                console.error("Import failed:", err);
                const readableError = err?.message || (typeof err === 'string' ? err : 'Database rejected the records.');
                addNotification({
                    id: uuidv4(),
                    type: 'alert',
                    title: 'Upload Failed',
                    message: readableError,
                    timestamp: new Date(),
                    isRead: false
                });
            }
        }
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportData = () => {
      const headers = ['ID', 'Name', 'Company', 'Department', 'Role', 'Training', 'Date', 'Trainer', 'Status', 'Expiry'];
      const csvRows = filteredBookings.map(b => {
          const session = sessions.find(s => s.id === b.sessionId);
          const rac = session ? session.racType : b.sessionId;
          const date = session ? session.date : (b.resultDate || '');
          const trainer = b.trainerName || (session ? session.instructor : 'TBD');
          return [b.employee.recordId, `"${b.employee.name}"`, b.employee.company, b.employee.department, b.employee.role, `"${rac}"`, date, `"${trainer}"`, b.status, b.expiryDate || ''];
      });
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...csvRows.map(r => r.join(','))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `training_records_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in-up h-full flex flex-col">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.common.stats.totalRecords}</p>
                <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{filteredBookings.length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.common.stats.passRate}</p>
                <div className="text-3xl font-black text-emerald-500 mt-1">
                    {filteredBookings.length > 0 ? (filteredBookings.filter(b => b.status === BookingStatus.PASSED).length / filteredBookings.length * 100).toFixed(1) : '0.0'}%
                </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Waiting List</p>
                <div className="text-3xl font-black text-amber-500 mt-1">{bookings.filter(b => b.status === BookingStatus.WAITLISTED).length}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Training Sessions</p>
                <div className="text-3xl font-black text-blue-500 mt-1">{sessions.length}</div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between sticky top-0 z-30 transition-all backdrop-blur-md bg-white/90">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                    <button 
                        onClick={() => { setViewMode('All'); setStatusFilter('All'); }}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'All' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-slate-500'}`}
                    >
                        <LayoutList size={14} className="inline mr-2" /> {t.results.viewAll}
                    </button>
                    <button 
                        onClick={() => { setViewMode('Waitlist'); setStatusFilter('waitlisted'); }}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${viewMode === 'Waitlist' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-500'}`}
                    >
                        <ListFilter size={14} className="inline mr-2" /> {t.results.viewWaitlist}
                    </button>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder={t.results.searchPlaceholder} 
                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2">
                {isAdmin && (
                    <>
                        <button 
                            onClick={handleDownloadTemplate}
                            className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-2.5 rounded-xl hover:bg-slate-200 transition-all"
                            title="Download Import Template"
                        >
                            <FileSpreadsheet size={20} />
                        </button>
                        <button 
                            onClick={() => fileInputRef.current?.click()} 
                            disabled={isImporting}
                            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isImporting ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                            {isImporting ? 'Processing' : 'Upload Records'}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".csv" title="Import CSV File" onChange={handleFileUpload} />
                    </>
                )}
                <button 
                    onClick={handleExportData} 
                    className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"
                >
                    <Download size={16} /> {t.results.export}
                </button>
            </div>
        </div>

        <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Personnel Identity</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Module / Requirement</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Operations</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/50">
                        {paginatedBookings.map((booking) => {
                            const session = sessions.find(s => s.id === booking.sessionId);
                            const racName = getTranslatedRacName(session ? session.racType : booking.sessionId);
                            const isWaitlisted = booking.status === BookingStatus.WAITLISTED;

                            return (
                                <tr key={booking.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group ${isWaitlisted ? 'bg-amber-50/30 dark:bg-amber-900/5' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                                {booking.employee.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-slate-900 dark:text-white">{booking.employee.name}</div>
                                                <div className="text-[10px] text-slate-500 font-mono tracking-tighter uppercase">{booking.employee.recordId} • {booking.employee.company}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                                            {racName}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
                                            <Calendar size={14} className="text-slate-300" />
                                            {session ? session.date : (booking.resultDate || '-')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm ${
                                            booking.status === BookingStatus.PASSED ? 'bg-green-50 text-green-700 border-green-200' :
                                            booking.status === BookingStatus.WAITLISTED ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                                            booking.status === BookingStatus.FAILED ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-blue-50 text-blue-700 border-blue-200'
                                        }`}>
                                            {booking.status === BookingStatus.PASSED && <CheckCircle2 size={12} />}
                                            {booking.status === BookingStatus.FAILED && <XCircle size={12} />}
                                            {booking.status === BookingStatus.WAITLISTED && <Clock size={12} />}
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end items-center gap-2">
                                            {isWaitlisted && isAdmin ? (
                                                <button 
                                                    onClick={() => handlePromote(booking)}
                                                    disabled={isPromoting === booking.id}
                                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                                                >
                                                    {isPromoting === booking.id ? <RefreshCw size={12} className="animate-spin" /> : <Rocket size={12} />}
                                                    PROMOTE
                                                </button>
                                            ) : (
                                                <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                    <button onClick={() => navigate(`/verify/${booking.employee.recordId}`)} title="Verify QR" className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><QrCode size={16}/></button>
                                                    <button title="View Details" className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"><FileText size={16}/></button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex flex-wrap items-center gap-4">
                    <span>Page {currentPage} of {Math.max(1, totalPages)} • Displaying {paginatedBookings.length} of {filteredBookings.length} Records</span>
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
                            className="bg-white dark:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                            {[20, 30, 50, 80, 100].map(val => (
                                <option key={val} value={val}>{val}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} title="Previous Page" className="p-2 rounded-xl border bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronLeft size={18} /></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} title="Next Page" className="p-2 rounded-xl border bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 transition-colors"><ChevronRight size={18} /></button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ResultsPage;
