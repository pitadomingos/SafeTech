import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Search, Calendar, User, Shield, MapPin, XCircle, 
  ChevronLeft, ChevronRight, Check, Clock, PlayCircle
} from 'lucide-react';
import { Booking, TrainingSession, BookingStatus, UserRole, Site, RacDef } from '../types';

interface BookingsPageProps {
  bookings: Booking[];
  sessions: TrainingSession[];
  updateBookingStatus: (id: string, status: BookingStatus) => Promise<void>;
  userRole: UserRole;
  sites: Site[];
  racDefinitions: RacDef[];
  currentSiteId: string;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({
  bookings,
  sessions,
  updateBookingStatus,
  userRole,
  sites,
  racDefinitions,
  currentSiteId
}) => {
  const { t } = useLanguage();
  const tb = (t as any).bookings || {};
  
  // Pagination & Filter States
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [racFilter, setRacFilter] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [activeRegistryTab, setActiveRegistryTab] = useState<'current' | 'history'>('current');

  // Reset to page 1 on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilter, statusFilter, racFilter, rowsPerPage]);

  useEffect(() => {
    setStatusFilter('All');
    setCurrentPage(1);
  }, [activeRegistryTab]);

  // Filter logic
  const filteredBookings = bookings.filter(b => {
    // 1. Search filter (Name or Record ID or Company)
    const matchSearch = 
      b.employee.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.employee.recordId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      b.employee.company.toLowerCase().includes(searchFilter.toLowerCase());

    // 2. Status filter
    const matchStatus = statusFilter === 'All' || b.status.toLowerCase() === statusFilter.toLowerCase();

    // 3. RAC Module filter (retrieve session to check rac type)
    const session = sessions.find(s => s.id === b.sessionId);
    const racCode = session ? session.racType : (b.sessionId.startsWith('HISTORICAL-') ? b.sessionId.split('-')[1] : 'Unknown');
    const matchRac = racFilter === 'All' || racCode === racFilter;

    // 4. Site-level isolation
    const matchSite = currentSiteId === 'all' || !session || session.siteId === currentSiteId;

    // 5. Registry Tab filter
    const matchTab = activeRegistryTab === 'current'
      ? (b.status === BookingStatus.PENDING || b.status === BookingStatus.WAITLISTED)
      : (b.status === BookingStatus.PASSED || b.status === BookingStatus.FAILED || b.status === BookingStatus.ABSENT);

    return matchSearch && matchStatus && matchRac && matchSite && matchTab;
  });

  // Sort bookings so Pending and Waitlisted are at the top, then newest
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const statusWeight = (s: BookingStatus) => {
      if (s === BookingStatus.PENDING) return 0;
      if (s === BookingStatus.WAITLISTED) return 1;
      return 2;
    };
    
    const weightA = statusWeight(a.status);
    const weightB = statusWeight(b.status);
    
    if (weightA !== weightB) return weightA - weightB;
    
    // Sort by requested date if available
    const dateA = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
    const dateB = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Pagination slicing
  const totalPages = Math.ceil(sortedBookings.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedBookings = sortedBookings.slice(startIndex, startIndex + rowsPerPage);

  const getStatusBadgeClass = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PASSED:
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
      case BookingStatus.FAILED:
        return 'bg-red-500/10 border-red-500/25 text-red-400';
      case BookingStatus.PENDING:
        return 'bg-blue-500/10 border-blue-500/25 text-blue-400 animate-pulse';
      case BookingStatus.WAITLISTED:
        return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
      case BookingStatus.ABSENT:
        return 'bg-slate-500/10 border-slate-500/25 text-slate-400';
      default:
        return 'bg-indigo-500/10 border-indigo-500/25 text-indigo-400';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.PASSED: return t.common.passed;
      case BookingStatus.FAILED: return t.common.failed;
      case BookingStatus.PENDING: return t.common.pending;
      case BookingStatus.WAITLISTED: return t.common.waitlisted;
      case BookingStatus.ABSENT: return t.common.absent;
      default: return String(status);
    }
  };

  const formatRequestedDate = (dateStr?: string) => {
    if (!dateStr) return tb.historical || 'Historical / Bulk';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB') + ' ' + date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in-up h-full flex flex-col">
      {/* Metrics Header row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.totalRequisitions || 'Total Requisitions'}</p>
          <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">{bookings.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.pendingApprovals || 'Pending Approvals'}</p>
          <div className="text-3xl font-black text-blue-500 mt-1">{bookings.filter(b => b.status === BookingStatus.PENDING).length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.waitlistedTrainees || 'Waitlisted Trainees'}</p>
          <div className="text-3xl font-black text-amber-500 mt-1">{bookings.filter(b => b.status === BookingStatus.WAITLISTED).length}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.passedClasses || 'Passed Classes'}</p>
          <div className="text-3xl font-black text-emerald-500 mt-1">{bookings.filter(b => b.status === BookingStatus.PASSED).length}</div>
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between sticky top-0 z-30 transition-all backdrop-blur-md bg-white/90">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={tb.searchPlaceholder || 'Search Name, ID, Company...'} 
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm w-64 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              title="Search bookings"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              title="Filter by status"
            >
              <option value="All">{tb.allStatuses || 'All Statuses'}</option>
              <option value="Pending">{t.common.pending}</option>
              <option value="Waitlisted">{t.common.waitlisted}</option>
              <option value="Passed">{t.common.passed}</option>
              <option value="Failed">{t.common.failed}</option>
              <option value="Absent">{t.common.absent}</option>
            </select>
          </div>

          {/* RAC Module Filter */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2">
            <Shield size={14} className="text-slate-400" />
            <select
              value={racFilter}
              onChange={(e) => setRacFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              title="Filter by RAC module"
            >
              <option value="All">{tb.allRacs || 'All RAC Modules'}</option>
              {racDefinitions.map(r => (
                <option key={r.id} value={r.code}>{r.code} - {r.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Registry Tab Switcher */}
        <div className="flex border-b border-slate-100 dark:border-slate-700/50 px-6 bg-slate-50/50 dark:bg-slate-900/10">
          <button
            onClick={() => setActiveRegistryTab('current')}
            className={`px-6 py-4 font-bold text-sm border-b-2 transition-all ${
              activeRegistryTab === 'current'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tb.currentBookingsTab || 'Current Bookings'}
          </button>
          <button
            onClick={() => setActiveRegistryTab('history')}
            className={`px-6 py-4 font-bold text-sm border-b-2 transition-all ${
              activeRegistryTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
          >
            {tb.historyTab || 'History'}
          </button>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.thTrainee || 'Trainee'}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.thRac || 'RAC Module'}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.thBookedAt || 'Booked At'}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.thSchedule || 'Session Schedule'}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.thRoomTrainer || 'Room & Trainer'}</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">{tb.thStatus || 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {paginatedBookings.map((b) => {
                const session = sessions.find(s => s.id === b.sessionId);
                const racCode = session ? session.racType : (b.sessionId.startsWith('HISTORICAL-') ? b.sessionId.split('-')[1] : 'RAC');
                
                return (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                    {/* Trainee Cell */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-bold shrink-0">
                          <User size={14} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{b.employee.name}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="font-mono">{b.employee.recordId}</span>
                            <span>•</span>
                            <span className="truncate">{b.employee.company}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* RAC Module Cell */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        {racCode}
                      </span>
                    </td>

                    {/* Booked At Cell */}
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs font-mono">
                      {formatRequestedDate(b.requestedAt)}
                    </td>

                    {/* Session Schedule Cell */}
                    <td className="px-6 py-4">
                      {session ? (
                        <div className="text-xs space-y-0.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <Calendar size={12} className="text-slate-400" />
                            {session.date}
                          </div>
                          <div className="text-slate-400 flex items-center gap-1 font-mono text-[10px]">
                            <Clock size={12} />
                            {session.startTime}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">{tb.historicalSession || 'Historical Session'}</span>
                      )}
                    </td>

                    {/* Room & Trainer Cell */}
                    <td className="px-6 py-4">
                      <div className="text-xs space-y-0.5">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <MapPin size={12} className="text-slate-400" />
                          {session ? session.location : (tb.historicalRecord || 'Historical Record')}
                        </div>
                        <div className="text-slate-400 text-[10px]">
                          {b.trainerName || (session ? session.instructor : 'TBD')}
                        </div>
                      </div>
                    </td>

                    {/* Status Badge Cell */}
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border ${getStatusBadgeClass(b.status)}`}>
                        {getStatusLabel(b.status)}
                      </span>
                    </td>

                  </tr>
                );
              })}
              {paginatedBookings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                    {tb.noRecords || 'No requisitions found matching the active filters.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Custom Pagination Footer */}
        {filteredBookings.length > 0 && (
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400">{t.common.rowsPerPage}</span>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-300 font-bold outline-none cursor-pointer font-mono"
                title="Select rows per page"
              >
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={80}>80</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-4">
              <span>
                {tb.showing || 'Showing'} {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filteredBookings.length)} {tb.of || 'of'} {filteredBookings.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Previous page"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-2 font-bold text-slate-700 dark:text-slate-300 font-mono">
                  {tb.page || 'Page'} {currentPage} {tb.of || 'of'} {totalPages || 1}
                </span>
                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Next page"
                  aria-label="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
