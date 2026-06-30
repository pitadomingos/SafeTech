
import React, { useState, useMemo } from 'react';
import { TrainingSession, Room, Trainer, RacDef, SystemNotification, Booking, BookingStatus, Employee, EmployeeRequirement } from '../types';
import { Calendar, Plus, Settings, X, Save, Clock, MapPin, User, CalendarDays, ChevronLeft, ChevronRight, Globe, Trash2, Search, Filter, Users as UsersIcon, ListFilter, AlertTriangle, CheckCircle, ChevronDown, ChevronUp, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import { db } from '../services/databaseService';

interface ScheduleTrainingProps {
    sessions: TrainingSession[];
    setSessions: React.Dispatch<React.SetStateAction<TrainingSession[]>>;
    rooms: Room[];
    trainers: Trainer[];
    racDefinitions: RacDef[];
    addNotification: (notif: SystemNotification) => void;
    currentSiteId: string; 
    bookings?: Booking[];
    employees?: Employee[];
    requirements?: EmployeeRequirement[];
    onAddBookings?: (newBookings: Booking[]) => Promise<void>;
}

const ScheduleTraining: React.FC<ScheduleTrainingProps> = ({ 
    sessions, 
    setSessions, 
    rooms, 
    trainers, 
    racDefinitions, 
    addNotification, 
    currentSiteId, 
    bookings = [],
    employees = [],
    requirements = [],
    onAddBookings
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  
  // New Session State
  const [newSession, setNewSession] = useState<Partial<TrainingSession>>({
      racType: racDefinitions[0]?.name || 'RAC',
      date: '',
      startTime: '08:00',
      location: '',
      instructor: '',
      capacity: 0,
      sessionLanguage: 'Portuguese',
      siteId: currentSiteId !== 'all' ? currentSiteId : 's1' 
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false
  });

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const getSessionRacCode = (session: TrainingSession): string => {
      const foundDef = racDefinitions.find(r => r.name === session.racType || r.code === session.racType);
      if (foundDef) return foundDef.code;
      return session.racType.split(' - ')[0].replace(/\s+/g, '');
  };

  const getEligibleExpiringEmployees = (session: TrainingSession): Employee[] => {
      const sessionRacCode = getSessionRacCode(session);
      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr);

      return employees.filter(emp => {
          // Employee must be active (defaults to active if not explicitly false)
          if (emp.isActive === false) return false;

          // Site relevance: employee site must match current site filter,
          // or if filter is 'all', they must belong to the session site.
          const siteToMatch = currentSiteId !== 'all' ? currentSiteId : session.siteId;
          if (siteToMatch && emp.siteId !== siteToMatch) return false;

          // Must have this RAC in their required list
          const req = requirements.find(r => r.employeeId === emp.id);
          if (!req || !req.requiredRacs[sessionRacCode]) return false;

          // Must not be already in this session, and must not have a pending booking for this RAC
          const empBookings = bookings.filter(b => b.employee?.id === emp.id);
          const isAlreadyInSession = empBookings.some(b => b.sessionId === session.id);
          if (isAlreadyInSession) return false;

          const hasPendingBookingForRac = empBookings.some(b => {
              if (b.status !== BookingStatus.PENDING) return false;
              const bSession = sessions.find(s => s.id === b.sessionId);
              const bRacCode = bSession ? getSessionRacCode(bSession) : '';
              return bRacCode === sessionRacCode;
          });
          if (hasPendingBookingForRac) return false;

          // Expiry Check: Must have missing, expired, or expiring training (<= 60 days)
          const passedBookings = empBookings.filter(b => {
              if (b.status !== BookingStatus.PASSED) return false;
              const bSession = sessions.find(s => s.id === b.sessionId);
              const bRacCode = bSession ? getSessionRacCode(bSession) : '';
              return bRacCode === sessionRacCode;
          });

          passedBookings.sort((a, b) => new Date(b.expiryDate || '').getTime() - new Date(a.expiryDate || '').getTime());
          const latestPassed = passedBookings[0];

          if (!latestPassed || !latestPassed.expiryDate) {
              return true; // Missing or expired
          }

          const expDate = new Date(latestPassed.expiryDate);
          const diffTime = expDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return diffDays <= 60;
      });
  };

  const getEmployeeExpiryStatus = (empId: string, sessionRacCode: string): { status: 'missing' | 'expired' | 'expiring'; daysRemaining?: number; expiryDate?: string } => {
      const todayStr = new Date().toISOString().split('T')[0];
      const today = new Date(todayStr);
      const empBookings = bookings.filter(b => b.employee?.id === empId);

      const passedBookings = empBookings.filter(b => {
          if (b.status !== BookingStatus.PASSED) return false;
          const bSession = sessions.find(s => s.id === b.sessionId);
          const bRacCode = bSession ? getSessionRacCode(bSession) : '';
          return bRacCode === sessionRacCode;
      });

      passedBookings.sort((a, b) => new Date(b.expiryDate || '').getTime() - new Date(a.expiryDate || '').getTime());
      const latestPassed = passedBookings[0];

      if (!latestPassed) {
          return { status: 'missing' };
      }

      if (!latestPassed.expiryDate) {
          return { status: 'expired' };
      }

      const expDate = new Date(latestPassed.expiryDate);
      const diffTime = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
          return { status: 'expired', expiryDate: latestPassed.expiryDate };
      }

      return { status: 'expiring', daysRemaining: diffDays, expiryDate: latestPassed.expiryDate };
  };

  const getEmployeeWarnings = (emp: Employee, sessionRacCode: string): string[] => {
      const warnings: string[] = [];
      const req = requirements.find(r => r.employeeId === emp.id);
      const todayStr = new Date().toISOString().split('T')[0];

      if (!req || !req.asoExpiryDate) {
          warnings.push(t.schedule.asoMissing || "ASO Missing");
      } else if (req.asoExpiryDate <= todayStr) {
          warnings.push((t.schedule.asoExpired || "ASO Expired ({date})").replace('{date}', req.asoExpiryDate));
      }

      const foundDef = racDefinitions.find(r => r.code === sessionRacCode);
      if (foundDef?.requiresDriverLicense) {
          const dlExpiry = emp.driverLicenseExpiry || '';
          if (!dlExpiry) {
              warnings.push(t.schedule.licenseMissing || "License Missing");
          } else if (dlExpiry <= todayStr) {
              warnings.push((t.schedule.licenseExpired || "License Expired ({date})").replace('{date}', dlExpiry));
          }
      }

      return warnings;
  };

  const handlePushToSession = async (employee: Employee, session: TrainingSession) => {
      if (!onAddBookings) {
          addNotification({
              id: uuidv4(),
              type: 'alert',
              title: 'System Error',
              message: 'Database action handler is not configured.',
              timestamp: new Date(),
              isRead: false
          });
          return;
      }

      const counts = getSessionCounts(session.id);
      const isFull = counts.pending >= session.capacity;
      const status = isFull ? BookingStatus.WAITLISTED : BookingStatus.PENDING;

      const newBooking: Booking = {
          id: uuidv4(),
          sessionId: session.id,
          employee,
          status,
          trainerName: session.instructor,
          isAutoBooked: false
      };

      try {
          await onAddBookings([newBooking]);
          
          addNotification({
              id: uuidv4(),
              type: 'success',
              title: isFull ? 'Added to Waitlist' : 'Employee Scheduled',
              message: `${employee.name} has been ${isFull ? 'waitlisted' : 'scheduled'} for ${session.racType} on ${session.date}.`,
              timestamp: new Date(),
              isRead: false
          });
      } catch (err: any) {
          console.error("Failed to push employee to session:", err);
          addNotification({
              id: uuidv4(),
              type: 'alert',
              title: 'Registration Failed',
              message: err.message || 'Unknown error occurred while booking.',
              timestamp: new Date(),
              isRead: false
          });
      }
  };

  const handleAddSession = async () => {
      if (!newSession.date || !newSession.racType || !newSession.location) {
          addNotification({
              id: uuidv4(),
              type: 'warning',
              title: 'Validation Error',
              message: 'Please fill in Date, RAC Type and Location',
              timestamp: new Date(),
              isRead: false
          });
          return;
      }

      const sessionToAdd: TrainingSession = {
          id: uuidv4(),
          racType: newSession.racType || 'RAC',
          date: newSession.date || '',
          startTime: newSession.startTime || '08:00',
          location: newSession.location || 'TBD',
          instructor: newSession.instructor || 'TBD',
          capacity: newSession.capacity || 20,
          sessionLanguage: newSession.sessionLanguage || 'Portuguese',
          siteId: newSession.siteId || 's1'
      };

      try {
          const saved = await db.saveSession(sessionToAdd);
          setSessions(prev => [...prev, saved]);
          setIsModalOpen(false);
          
          addNotification({
              id: uuidv4(),
              type: 'success',
              title: 'Session Created',
              message: `${saved.racType} scheduled for ${saved.date}`,
              timestamp: new Date(),
              isRead: false
          });

          setNewSession(prev => ({ ...prev, date: '', startTime: '08:00' }));
      } catch (err: any) {
          console.error("Failed to save session:", err);
          addNotification({
              id: uuidv4(),
              type: 'alert',
              title: 'Database Error',
              message: err.message || 'Failed to save the session to the database.',
              timestamp: new Date(),
              isRead: false
          });
      }
  };

  const handleDeleteSession = (id: string) => {
      setConfirmState({
          isOpen: true,
          title: 'Cancel Session?',
          message: 'Are you sure you want to cancel this training session? This will remove it from the schedule and cannot be undone.',
          onConfirm: async () => {
              try {
                  await db.deleteSession(id);
                  setSessions(prev => prev.filter(s => s.id !== id));
                  addNotification({
                      id: uuidv4(),
                      type: 'success',
                      title: 'Session Cancelled',
                      message: 'The training session has been cancelled and removed.',
                      timestamp: new Date(),
                      isRead: false
                  });
              } catch (err: any) {
                  console.error("Failed to delete session:", err);
                  addNotification({
                      id: uuidv4(),
                      type: 'alert',
                      title: 'Database Error',
                      message: err.message || 'Failed to delete the session from the database.',
                      timestamp: new Date(),
                      isRead: false
                  });
              }
          },
          isDestructive: true
      });
  };

  // Filter & Sort Logic
  const filteredSessions = sessions.filter(s => {
      const sSiteId = s.siteId || 's1';
      if (currentSiteId !== 'all' && sSiteId !== currentSiteId) return false;

      const matchesQuery = s.racType.toLowerCase().includes(filterQuery.toLowerCase()) || 
                           s.instructor.toLowerCase().includes(filterQuery.toLowerCase()) ||
                           s.location.toLowerCase().includes(filterQuery.toLowerCase());
      return matchesQuery;
  });

  const sortedSessions = [...filteredSessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Pagination Logic
  const totalPages = Math.ceil(sortedSessions.length / itemsPerPage);
  const paginatedSessions = sortedSessions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setItemsPerPage(Number(e.target.value));
      setCurrentPage(1);
  };

  const getSessionCounts = (sessionId: string) => {
      const sessBookings = bookings.filter(b => b.sessionId === sessionId);
      return {
          pending: sessBookings.filter(b => b.status === BookingStatus.PENDING || b.status === BookingStatus.PASSED).length,
          waitlisted: sessBookings.filter(b => b.status === BookingStatus.WAITLISTED).length
      };
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in-up relative h-full">
       
       <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden border border-slate-700/50">
         <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none">
            <CalendarDays size={400} />
         </div>
         <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30 backdrop-blur-sm">
                    <Calendar size={28} className="text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-white">
                      {t.schedule.title}
                  </h2>
               </div>
               <p className="text-slate-400 text-sm max-w-xl font-medium ml-1">
                  {t.schedule.subtitle}
               </p>
            </div>
            <div className="flex gap-3">
                <button 
                    onClick={() => navigate('/settings')}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-5 py-3 rounded-xl font-bold backdrop-blur-sm border border-white/10 transition-all text-sm group"
                >
                    <Settings size={18} className="group-hover:rotate-90 transition-transform duration-500" />
                    <span>{t.nav.settings}</span>
                </button>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 text-sm"
                >
                    <Plus size={18} />
                    <span>{t.schedule.newSession}</span>
                </button>
            </div>
         </div>
       </div>

       <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden relative min-h-[600px]">
          
          <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative w-full md:w-72">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder={t.schedule.searchPlaceholder || "Search sessions..."} 
                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
                    value={filterQuery}
                    onChange={(e) => { setFilterQuery(e.target.value); setCurrentPage(1); }}
                  />
              </div>
              
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow-sm">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.schedule.rows || 'Rows'}</span>
                      <select 
                          value={itemsPerPage}
                          onChange={handlePageSizeChange}
                          className="text-sm font-bold bg-transparent outline-none text-slate-800 dark:text-white cursor-pointer"
                          title={t.schedule.rows || 'Rows'}
                          aria-label={t.schedule.rows || 'Rows'}
                      >
                           <option value={20}>20</option>
                           <option value={30}>30</option>
                           <option value={50}>50</option>
                           <option value={80}>80</option>
                           <option value={100}>100</option>
                      </select>
                  </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-slate-50/30 dark:bg-slate-900/10">
              {paginatedSessions.map((session) => {
                  const counts = getSessionCounts(session.id);
                  const isFull = counts.pending >= session.capacity;
                  
                  return (
                  <div key={session.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all relative overflow-hidden">
                      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between group relative">
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600"></div>

                          <div className="flex flex-col md:flex-row md:items-center gap-6 flex-1 pl-2">
                              <div className="flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300 w-16 h-16 rounded-2xl border border-slate-100 dark:border-slate-600 shrink-0 shadow-inner">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">{new Date(session.date).toLocaleString('default', { month: 'short' })}</span>
                                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{new Date(session.date).getDate()}</span>
                              </div>
                              
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                      <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{session.racType}</h3>
                                      {session.sessionLanguage && (
                                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${session.sessionLanguage === 'English' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' : 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'}`}>
                                              <Globe size={10} />
                                              {session.sessionLanguage === 'English' ? 'ENG' : 'PT'}
                                          </span>
                                      )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg"><Clock size={12} className="text-slate-400"/> {session.startTime}</span>
                                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg"><MapPin size={12} className="text-slate-400"/> {session.location}</span>
                                      <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-700/50 px-2 py-1 rounded-lg"><User size={12} className="text-slate-400"/> {session.instructor}</span>
                                  </div>
                              </div>
                          </div>
                          <div className="mt-4 md:mt-0 flex items-center gap-4 md:border-l border-slate-100 dark:border-slate-700 pt-4 md:pt-0 md:pl-6">
                              <div className="flex gap-4">
                                  <div className="text-center">
                                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1"><UsersIcon size={10}/> {t.schedule.capacity || 'Capacity'}</div>
                                      <div className={`text-xl font-black flex items-center justify-center gap-1 ${isFull ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                          {counts.pending} <span className="text-xs font-medium text-slate-400">/ {session.capacity}</span>
                                      </div>
                                  </div>
                                  {counts.waitlisted > 0 && (
                                      <div className="text-center">
                                          <div className="text-[10px] text-amber-500 font-bold uppercase tracking-wider mb-0.5 flex items-center justify-center gap-1"><ListFilter size={10}/> {t.schedule.waitlist || 'Waitlist'}</div>
                                          <div className="text-xl font-black text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 rounded-lg border border-amber-100 dark:border-amber-800">
                                              {counts.waitlisted}
                                          </div>
                                      </div>
                                  )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                  {/* Expiring / Missing training button */}
                                  <button 
                                    onClick={() => {
                                        setExpandedSessionId(expandedSessionId === session.id ? null : session.id);
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-tight transition-all border flex items-center gap-1.5 ${
                                        expandedSessionId === session.id
                                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                            : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-700 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                                    }`}
                                    title={t.schedule.expiringOrMissing || 'Expiring or Missing Training'}
                                  >
                                      {expandedSessionId === session.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                      <span>{t.schedule.expiring || 'Expiring'} ({getEligibleExpiringEmployees(session).length})</span>
                                  </button>
                                  
                                  <button 
                                    onClick={() => handleDeleteSession(session.id)}
                                    className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                    title="Cancel Session"
                                  >
                                      <Trash2 size={18} />
                                  </button>
                              </div>
                          </div>
                      </div>

                      {/* Expiring / Missing panel */}
                      {expandedSessionId === session.id && (
                          <div className="border-t border-slate-100 dark:border-slate-700 p-5 bg-slate-50/50 dark:bg-slate-900/10 animate-fade-in">
                              <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-sm font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                                      <AlertTriangle size={16} className="text-amber-500" />
                                      {t.schedule.expiringOrMissing || 'Expiring or Missing Training'}
                                  </h4>
                                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                      Module: {getSessionRacCode(session)}
                                  </span>
                              </div>

                              {getEligibleExpiringEmployees(session).length === 0 ? (
                                  <div className="text-center py-6 text-slate-500 text-xs font-semibold">
                                      {t.schedule.noEligibleEmployees || 'No active employees with missing, expired, or expiring training for this module on this site.'}
                                  </div>
                              ) : (
                                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                                      <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-700">
                                                  <th className="p-3">{t.schedule.thEmployee || 'Employee'}</th>
                                                  <th className="p-3">{t.schedule.thCompanyDept || 'Company / Dept'}</th>
                                                  <th className="p-3">{t.schedule.thTrainingStatus || 'Training Status'}</th>
                                                  <th className="p-3">{t.schedule.thComplianceWarnings || 'Compliance Warnings'}</th>
                                                  <th className="p-3 text-right">{t.common.actions || 'Actions'}</th>
                                              </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
                                              {getEligibleExpiringEmployees(session).map(emp => {
                                                  const expStatus = getEmployeeExpiryStatus(emp.id, getSessionRacCode(session));
                                                  const warnings = getEmployeeWarnings(emp, getSessionRacCode(session));
                                                  return (
                                                      <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                                                          <td className="p-3">
                                                              <div className="font-bold text-slate-800 dark:text-slate-200">{emp.name}</div>
                                                              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{emp.recordId}</div>
                                                          </td>
                                                          <td className="p-3 text-slate-600 dark:text-slate-400">
                                                              <div>{emp.company}</div>
                                                              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{emp.department}</div>
                                                          </td>
                                                          <td className="p-3">
                                                              {expStatus.status === 'missing' && (
                                                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-md font-bold uppercase text-[9px] tracking-wider">
                                                                      {t.schedule.statusMissing || 'Missing'}
                                                                  </span>
                                                              )}
                                                              {expStatus.status === 'expired' && (
                                                                  <span className="px-2 py-0.5 bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400 border border-red-100 dark:border-red-900/50 rounded-md font-bold uppercase text-[9px] tracking-wider" title={expStatus.expiryDate}>
                                                                      {t.schedule.statusExpired || 'Expired'}
                                                                  </span>
                                                              )}
                                                              {expStatus.status === 'expiring' && (
                                                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 rounded-md font-bold uppercase text-[9px] tracking-wider" title={`Expires on ${expStatus.expiryDate}`}>
                                                                      {(t.schedule.statusExpiring || 'Expiring ({days} days)').replace('{days}', String(expStatus.daysRemaining))}
                                                                  </span>
                                                              )}
                                                          </td>
                                                          <td className="p-3">
                                                              <div className="flex flex-wrap gap-1.5">
                                                                  {warnings.length === 0 ? (
                                                                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 px-2 py-0.5 rounded-md">
                                                                          <CheckCircle size={10} />
                                                                          {t.schedule.asoLicenseOk || 'ASO & License OK'}
                                                                      </span>
                                                                  ) : (
                                                                      warnings.map((warn, i) => (
                                                                          <span key={i} className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 px-2 py-0.5 rounded-md">
                                                                              <AlertTriangle size={10} />
                                                                              {warn}
                                                                          </span>
                                                                      ))
                                                                  )}
                                                              </div>
                                                          </td>
                                                          <td className="p-3 text-right">
                                                              <button
                                                                onClick={() => handlePushToSession(emp, session)}
                                                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all transform hover:-translate-y-0.5 flex items-center gap-1.5 ml-auto border shadow-sm ${
                                                                    isFull
                                                                        ? 'bg-amber-500 hover:bg-amber-600 border-amber-600 text-white'
                                                                        : 'bg-blue-600 hover:bg-blue-500 border-blue-700 text-white'
                                                                }`}
                                                                title={isFull ? (t.booking.registerToWaitlist || 'Add to Waitlist') : (t.schedule.actionPush || 'Push')}
                                                              >
                                                                  <UserCheck size={12} />
                                                                  {isFull ? (t.schedule.actionWaitlist || 'Waitlist') : (t.schedule.actionPush || 'Push')}
                                                              </button>
                                                          </td>
                                                      </tr>
                                                  );
                                              })}
                                          </tbody>
                                      </table>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              )})}
              
              {sortedSessions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-24 text-slate-400">
                      <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                          <Calendar size={40} className="text-slate-300 dark:text-slate-500" />
                      </div>
                      <p className="font-bold text-lg text-slate-500 dark:text-slate-400">{t.schedule.noSessions || 'No sessions scheduled'}</p>
                      <p className="text-sm text-slate-400">{t.schedule.clickNewSession || 'Click "New Session" to get started.'}</p>
                  </div>
              )}
          </div>

          {sortedSessions.length > 0 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                          {(t.schedule.pageOfTotal || 'Page {page} of {totalPages} • {total} Total')
                              .replace('{page}', String(currentPage))
                              .replace('{totalPages}', String(Math.max(1, totalPages)))
                              .replace('{total}', String(sortedSessions.length))}
                      </div>
                      
                      <div className="flex gap-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                          <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors text-slate-600 dark:text-slate-300" title={t.booking.prevPage || 'Previous Page'} aria-label="Previous Page"><ChevronLeft size={16} /></button>
                          <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors text-slate-600 dark:text-slate-300" title={t.booking.nextPage || 'Next Page'} aria-label="Next Page"><ChevronRight size={16} /></button>
                      </div>
                  </div>
              </div>
          )}
       </div>

      <ConfirmModal 
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
          isDestructive={confirmState.isDestructive}
          confirmText={t.common.confirm}
      />

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl p-0 overflow-hidden transform transition-all scale-100 border border-slate-200 dark:border-slate-700">
                
                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{t.schedule.modal.title}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t.schedule.modalSubtitle || 'Create a new training slot.'}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Close Modal" aria-label="Close Modal">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.schedule.modal.racType}</label>
                        <div className="relative">
                            <select 
                                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition-all hover:bg-slate-100 dark:hover:bg-slate-600"
                                value={String(newSession.racType)}
                                onChange={e => setNewSession({...newSession, racType: e.target.value})}
                                title={t.schedule.modal.racType || 'RAC Type'}
                                aria-label="Select RAC Type"
                            >
                                {racDefinitions.map(rac => (
                                    <option key={rac.id} value={rac.name}>{rac.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronRight size={16} className="rotate-90" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.schedule.modal.date}</label>
                            <input 
                                type="date" 
                                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white transition-all"
                                value={String(newSession.date)}
                                onChange={e => setNewSession({...newSession, date: e.target.value})}
                                title={t.schedule.modal.date || 'Date'}
                                placeholder="YYYY-MM-DD"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.schedule.modal.startTime}</label>
                            <input 
                                type="time" 
                                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white transition-all"
                                value={String(newSession.startTime)}
                                onChange={e => setNewSession({...newSession, startTime: e.target.value})}
                                title={t.schedule.modal.startTime || 'Start Time'}
                                placeholder="HH:MM"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-5">
                        <div className="col-span-2">
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.schedule.modal.location}</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white appearance-none"
                                    value={String(newSession.location)}
                                    onChange={e => {
                                        const selectedRoom = rooms.find(r => r.name === e.target.value);
                                        setNewSession({
                                            ...newSession, 
                                            location: e.target.value,
                                            capacity: selectedRoom ? selectedRoom.capacity : 0
                                        });
                                    }}
                                    title={t.schedule.modal.location || 'Location'}
                                    aria-label="Select Room"
                                >
                                    <option value="">{t.schedule.selectRoom || 'Select Room'}</option>
                                    {rooms.map(room => (
                                        <option key={room.id} value={room.name}>{room.name}</option>
                                    ))}
                                </select>
                                <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.schedule.modal.capacity}</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    className="w-full bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-xl p-3 text-sm font-bold text-slate-500 dark:text-slate-300 cursor-not-allowed outline-none text-center"
                                    value={String(newSession.capacity)}
                                    readOnly
                                    title="Capacity"
                                    placeholder="Capacity"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.schedule.modal.instructor}</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white appearance-none"
                                    value={String(newSession.instructor)}
                                    onChange={e => setNewSession({...newSession, instructor: e.target.value})}
                                    title="Select Instructor"
                                    aria-label="Select Instructor"
                                >
                                    <option value="">{t.schedule.selectInstructor || 'Select Instructor'}</option>
                                    {trainers.map(trainer => (
                                        <option key={trainer.id} value={trainer.name}>
                                            {trainer.name}
                                        </option>
                                    ))}
                                </select>
                                <User size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.schedule.modal.language}</label>
                            <div className="relative">
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white appearance-none"
                                    value={String(newSession.sessionLanguage)}
                                    onChange={e => setNewSession({...newSession, sessionLanguage: e.target.value as any})}
                                    title="Select Language"
                                    aria-label="Select Language"
                                >
                                    <option value="Portuguese">{t.schedule.modal.portuguese}</option>
                                    <option value="English">{t.schedule.modal.english}</option>
                                </select>
                                <Globe size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                    <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors"
                    >
                        {t.common.cancel}
                    </button>
                    <button 
                        onClick={handleAddSession}
                        className="px-8 py-3 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5"
                    >
                        <Save size={18} /> {t.schedule.modal.saveSession}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleTraining;
