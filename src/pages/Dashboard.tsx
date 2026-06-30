import React, { useState, useMemo } from 'react';
import DashboardStats from '../components/DashboardStats';
import { Booking, UserRole, EmployeeRequirement, TrainingSession, BookingStatus, RacDef, Company } from '../types';
import { 
    Calendar, Clock, MapPin, ChevronRight, Filter, Timer, User, 
    CheckCircle, XCircle, ChevronLeft, Zap, Layers, Briefcase, 
    Printer, MessageCircle, Send, ShieldAlert, AlertTriangle, ArrowRight, Activity,
    ShieldCheck, TrendingUp, Users, Building2, GraduationCap, ListFilter,
    Cloud, Upload, FileSpreadsheet, Database as DbIcon, ArrowUpRight, BarChart3,
    History
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { isSupabaseConfigured } from '../services/supabaseClient';
import RacIcon from '../components/RacIcon';

interface DashboardProps {
  bookings: Booking[];
  requirements: EmployeeRequirement[];
  sessions: TrainingSession[];
  userRole: UserRole;
  onApproveAutoBooking?: (bookingId: string) => void;
  onRejectAutoBooking?: (bookingId: string) => void;
  racDefinitions?: RacDef[];
  currentSiteId: string;
  companies?: Company[];
}

const Dashboard: React.FC<DashboardProps> = ({ 
  bookings, 
  requirements, 
  sessions, 
  userRole, 
  racDefinitions = [],
  currentSiteId,
  companies = []
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [selectedCompany, setSelectedCompany] = useState<string>('All');

  // Compute overall compliance
  const employeesWithStatus = useMemo(() => {
      const empMap = new Map<string, any>();
      bookings.forEach(b => {
          if (b.employee && !empMap.has(b.employee.id)) {
              empMap.set(b.employee.id, b.employee);
          }
      });
      const uniqueEmployees = Array.from(empMap.values());

      return uniqueEmployees.map(emp => {
          const req = requirements.find(r => r.employeeId === emp.id) || { employeeId: emp.id, asoExpiryDate: '', requiredRacs: {} };
          const today = new Date().toISOString().split('T')[0];
          const isAsoValid = !!(req.asoExpiryDate && req.asoExpiryDate > today);
          const isActive = emp.isActive ?? true;

          let allRacsMet = true;
          const mappedRacs = Object.entries(req.requiredRacs)
              .filter(([_, val]) => val === true)
              .map(([key]) => key);

          mappedRacs.forEach((key) => {
              const validBooking = bookings.find(b => {
                  if (!b.employee || b.employee.id !== emp.id) return false;
                  if (b.status === BookingStatus.PASSED) {
                      if (!b.expiryDate || b.expiryDate <= today) return false;
                      let bRacCode = '';
                      const s = sessions.find(s => s.id === b.sessionId);
                      if (s && s.racType) bRacCode = s.racType.split(' - ')[0].replace(/\s+/g, '').toUpperCase();
                      else if (b.sessionId) bRacCode = b.sessionId.split('-')[0].replace(/\s+/g, '').toUpperCase();
                      return bRacCode === key.toUpperCase();
                  }
                  return false;
              });
              if (!validBooking) allRacsMet = false;
          });

          return { ...emp, accessStatus: (isActive && isAsoValid && allRacsMet) ? 'Granted' : 'Blocked', siteId: emp.siteId || 's1' };
      });
  }, [bookings, requirements, sessions]);

  const globalStats = useMemo(() => {
      const filtered = employeesWithStatus.filter(e => currentSiteId === 'all' || e.siteId === currentSiteId);
      const total = filtered.length;
      const compliant = filtered.filter(e => e.accessStatus === 'Granted').length;
      return { total, compliant, rate: total > 0 ? Math.round((compliant / total) * 100) : 0 };
  }, [employeesWithStatus, currentSiteId]);

  const upcomingSessions = useMemo(() => {
      return [...sessions]
        .filter(s => currentSiteId === 'all' || (s.siteId || 's1') === currentSiteId)
        .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())
        .slice(0, 5); 
  }, [sessions, currentSiteId]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* --- TOP ROW: COMMAND CENTER & DATA TOOLS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Executive Overview Card */}
          <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-700/50 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:opacity-10 transition-opacity">
                  <ShieldCheck size={300} />
              </div>

              <div className="p-10 flex flex-col md:flex-row gap-12 items-center relative z-10">
                  <div className="flex flex-col items-center">
                      <div className="relative h-32 w-32 rounded-full border-4 border-emerald-500/20 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow"></div>
                          <span className="text-4xl font-black text-white">{globalStats.rate}%</span>
                      </div>
                      <span className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 text-center">Site Readiness</span>
                  </div>

                  <div className="flex-1 space-y-6">
                      <div>
                          <h2 className="text-3xl font-black text-white uppercase tracking-tight leading-tight">
                              Management <span className="text-indigo-400">Command</span>
                          </h2>
                          <p className="text-slate-400 text-sm mt-1 max-w-md font-medium leading-relaxed">
                              Overseeing Critical Activity Requisitions (RAC 01-11). Real-time compliance monitoring and workforce authorization.
                          </p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                          <button 
                            onClick={() => navigate('/booking')}
                            className="bg-white text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                          >
                            <Zap size={18} fill="currentColor" /> {t.dashboard.newRequisition}
                          </button>
                          <button 
                            onClick={() => navigate('/results')}
                            className="bg-white/10 hover:bg-white/20 border border-white/10 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all flex items-center gap-2"
                          >
                            <Activity size={18} /> View Records
                          </button>
                      </div>
                  </div>
              </div>
          </div>

          {/* Data Hub Quick Actions */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden relative">
              <div className="p-8 border-b border-slate-50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-900/20">
                  <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                          <DbIcon size={20} />
                      </div>
                      <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-xs">Data Integration Hub</h3>
                  </div>
              </div>
              
              <div className="flex-1 p-6 space-y-3">
                  <button 
                    onClick={() => navigate('/database')}
                    className="w-full group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all"
                  >
                      <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-blue-500 group-hover:scale-110 transition-transform">
                              <Users size={20}/>
                          </div>
                          <div className="text-left">
                              <div className="text-sm font-bold text-slate-800 dark:text-white">Registry Import</div>
                              <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Manual Personnel CSV</div>
                          </div>
                      </div>
                      <ArrowUpRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </button>

                  <button 
                    onClick={() => navigate('/results')}
                    className="w-full group flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all"
                  >
                      <div className="flex items-center gap-4">
                          <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-500 group-hover:scale-110 transition-transform">
                              {/* Fix: Included missing History icon component */}
                              <History size={20}/>
                          </div>
                          <div className="text-left">
                              <div className="text-sm font-bold text-slate-800 dark:text-white">Historical Records</div>
                              <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Training History CSV</div>
                          </div>
                      </div>
                      <ArrowUpRight size={18} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </button>

                  <div className="mt-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-3">
                      <Cloud className="text-emerald-500 shrink-0" size={18} />
                      <div className="text-xs">
                          <span className="font-bold text-emerald-800 dark:text-emerald-400 uppercase block tracking-wider mb-0.5">Cloud Storage Active</span>
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Supabase synchronized for site {currentSiteId === 'all' ? 'Enterprise' : currentSiteId}</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <DashboardStats 
          bookings={bookings} 
          requirements={requirements} 
          sessions={sessions} 
          racDefinitions={racDefinitions}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Quick View: Upcoming Sessions */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[400px]">
          <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <Calendar className="text-indigo-600 dark:text-indigo-400" size={20} />
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Active Schedule</h3>
             </div>
             <button onClick={() => navigate('/schedule')} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Manage All</button>
          </div>
          <div className="overflow-auto flex-1 p-4 space-y-2">
            {upcomingSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                    <div className="flex items-center gap-4">
                        <RacIcon racCode={session.racType ? session.racType.split(' - ')[0] : 'RAC01'} size={24} />
                        <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">{session.racType}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Clock size={10} /> {session.date} • {session.startTime}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-black text-slate-600 dark:text-slate-300">{session.location}</div>
                        <div className="text-[9px] text-slate-400 font-medium">Instructor: {session.instructor}</div>
                    </div>
                </div>
            ))}
            {upcomingSessions.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
                    <Calendar size={48} />
                    <p className="text-xs font-black uppercase mt-4 tracking-widest">No Active Sessions</p>
                </div>
            )}
          </div>
        </div>

        {/* Global Compliance Breakdown */}
        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-[400px]">
           <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <BarChart3 className="text-blue-600 dark:text-blue-400" size={20} />
                <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight">Compliance Trend</h3>
             </div>
             <button onClick={() => navigate('/reports')} className="text-[10px] font-black text-blue-600 uppercase hover:underline">Full Analytics</button>
           </div>
           <div className="flex-1 p-8 flex items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="grid grid-cols-2 gap-12">
                        <div className="text-center">
                            <div className="text-4xl font-black text-emerald-500 mb-1">{globalStats.compliant}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Personnel Authorized</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-black text-rose-500 mb-1">{globalStats.total - globalStats.compliant}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Access Blocked</div>
                        </div>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex">
                        <div className="bg-emerald-500 h-full" style={{ width: `${globalStats.rate}%` }}></div>
                        <div className="bg-rose-500 h-full flex-1"></div>
                    </div>
                    <p className="text-xs text-slate-500 italic max-w-xs mx-auto">
                        Target readiness: 95% compliance for high-risk operations.
                    </p>
                </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;