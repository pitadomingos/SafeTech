
import React, { useState, useMemo } from 'react';
import { Booking, BookingStatus, TrainingSession, RacDef, EmployeeRequirement, Site, Company } from '../types';
import { DEPARTMENTS } from '../constants';
import { generateSafetyReport } from '../services/geminiService';
import { 
  FileText, Calendar, Sparkles, BarChart3, Printer, UserX, 
  AlertCircle, UserCheck, TrendingUp, Users, CheckCircle2, XCircle,
  Award, Filter, Map, ShieldCheck, Timer, Activity,
  ChevronRight, ArrowUpRight, ArrowDownRight, Layers, LayoutDashboard,
  Zap, RefreshCw, GraduationCap, Building2, UserMinus, Search, History,
  Download, DownloadCloud, FileDown, Shield, CheckCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface ReportsPageProps {
  bookings: Booking[];
  requirements: EmployeeRequirement[];
  sessions: TrainingSession[];
  sites: Site[];
  currentSiteId: string;
  racDefinitions: RacDef[];
  companies: Company[];
}

type ReportTab = 'Executive' | 'Performance' | 'Behavioral';

const ReportsPage: React.FC<ReportsPageProps> = ({ 
    bookings, 
    requirements,
    sessions, 
    sites, 
    currentSiteId, 
    racDefinitions,
    companies
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ReportTab>('Executive');
  const [selectedDept, setSelectedDept] = useState('All');
  const [localSelectedSite, setLocalSelectedSite] = useState('All');
  const effectiveSiteId = currentSiteId !== 'all' ? currentSiteId : localSelectedSite;

  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- BRANDING LOGIC ---
  const currentCompany = useMemo(() => {
    const match = companies.find(c => c.name === user?.company || c.id === user?.company);
    return match || companies[0];
  }, [companies, user]);

  // --- DATA PROCESSING HELPERS ---

  const getRacCode = (b: Booking) => {
    const session = sessions.find(s => s.id === b.sessionId);
    const rawName = session ? session.racType : b.sessionId;
    return rawName.split(' - ')[0].replace(/\s+/g, '').toUpperCase();
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
       if (selectedDept !== 'All' && b.employee.department !== selectedDept) return false;
       const bSite = b.employee.siteId || 's1';
       if (effectiveSiteId !== 'All' && bSite !== effectiveSiteId) return false;
       return true;
    });
  }, [bookings, selectedDept, effectiveSiteId]);

  // --- 1. INSTRUCTOR PERFORMANCE METRICS ---
  const instructorMetrics = useMemo(() => {
      const stats = {} as Record<string, { name: string, total: number, passed: number, absent: number, avgTheory: number, totalScore: number }>;
      
      filteredBookings.forEach(b => {
          const name = b.trainerName || 'N/A';
          if (!stats[name]) stats[name] = { name, total: 0, passed: 0, absent: 0, avgTheory: 0, totalScore: 0 };
          
          stats[name].total++;
          if (b.status === BookingStatus.PASSED) stats[name].passed++;
          if (b.status === BookingStatus.ABSENT) stats[name].absent++;
          if (b.theoryScore) {
              stats[name].totalScore += b.theoryScore;
          }
      });

      return Object.values(stats).map(s => ({
          ...s,
          passRate: s.total - s.absent > 0 ? ((s.passed / (s.total - s.absent)) * 100).toFixed(1) : '0.0',
          absentRate: s.total > 0 ? ((s.absent / s.total) * 100).toFixed(1) : '0.0',
          avgTheory: s.total - s.absent > 0 ? Math.round(s.totalScore / (s.total - s.absent)) : 0
      })).sort((a, b) => b.total - a.total);
  }, [filteredBookings]);

  // --- 2. NO-SHOW & BEHAVIORAL ANALYTICS ---
  const behavioralStats = useMemo(() => {
      const absents = filteredBookings.filter(b => b.status === BookingStatus.ABSENT);
      
      const byRac = {} as Record<string, number>;
      const byCompany = {} as Record<string, { name: string, count: number, totalRequests: number }>;
      const byEmployee = {} as Record<string, { id: string, name: string, count: number, company: string, lastMiss: string }>;

      // 1. Process Absents
      absents.forEach(a => {
          const code = getRacCode(a);
          byRac[code] = (byRac[code] || 0) + 1;
          
          const eId = a.employee.id;
          if (!byEmployee[eId]) byEmployee[eId] = { id: a.employee.recordId, name: a.employee.name, count: 0, company: a.employee.company, lastMiss: a.resultDate || 'TBD' };
          byEmployee[eId].count++;
      });

      // 2. Process Company Weights (Relative to their total requests)
      filteredBookings.forEach(b => {
          const comp = b.employee.company;
          if (!byCompany[comp]) byCompany[comp] = { name: comp, count: 0, totalRequests: 0 };
          byCompany[comp].totalRequests++;
          if (b.status === BookingStatus.ABSENT) byCompany[comp].count++;
      });

      const companyImpact = Object.values(byCompany).map(c => ({
          ...c,
          weight: c.totalRequests > 0 ? ((c.count / c.totalRequests) * 100).toFixed(1) : '0.0'
      })).sort((a, b) => b.count - a.count);

      return {
          absentTotal: absents.length,
          absentByRac: Object.entries(byRac).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count),
          companyImpact,
          repeatOffenders: Object.values(byEmployee).filter(e => e.count >= 2).sort((a, b) => b.count - a.count),
          latestAbsents: absents.slice(0, 15)
      };
  }, [filteredBookings]);

  const stats = useMemo(() => {
     const total = filteredBookings.length;
     const passed = filteredBookings.filter(b => b.status === BookingStatus.PASSED).length;
     const absents = filteredBookings.filter(b => b.status === BookingStatus.ABSENT).length;
     const passRate = total - absents > 0 ? ((passed / (total - absents)) * 100).toFixed(1) : '0.0';
     const absentRate = total > 0 ? ((absents / total) * 100).toFixed(1) : '0.0';

     return { total, passed, absents, passRate, absentRate };
  }, [filteredBookings]);

  const handleGenerateReport = async () => {
     setIsGenerating(true);
     const context = {
        metrics: {
            totalBookings: stats.total,
            passRate: stats.passRate + '%',
            absentRate: stats.absentRate + '%',
            instructorCount: instructorMetrics.length,
            topInstructor: instructorMetrics[0]?.name,
            frequentAbsentees: behavioralStats.repeatOffenders.length,
            highestAbsentCompany: behavioralStats.companyImpact[0]?.name
        }
     };
     const result = await generateSafetyReport(context, 'Monthly', language);
     setAiReport(result);
     setIsGenerating(false);
  };

  const handleDownloadPdf = () => {
      window.print();
  };

  return (
    <div className="space-y-8 pb-32 animate-fade-in-up">
       
       {/* --- HEADER COMMAND BAR --- */}
       <div className="no-print bg-slate-950 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
              <BarChart3 size={400} />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg">
                      <TrendingUp size={32} />
                  </div>
                  <div>
                      <h1 className="text-3xl font-black tracking-tight uppercase italic">Safety <span className="text-indigo-400">Intelligence</span></h1>
                      <p className="text-slate-400 font-medium tracking-wide uppercase text-[10px]">Workforce Behavioral & Proficiency Audit</p>
                  </div>
              </div>
              <div className="flex gap-3">
                  <div className="flex gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                    {(['Executive', 'Performance', 'Behavioral'] as ReportTab[]).map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab}
                        </button>
                    ))}
                  </div>
                  <button 
                    onClick={handleDownloadPdf}
                    className="flex items-center gap-2 bg-white text-slate-900 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                  >
                      <FileDown size={18} /> Export PDF
                  </button>
              </div>
          </div>
       </div>

       {/* --- PRINT ONLY HEADER (DYNAMIC BRANDING) --- */}
       <div className="hidden print:flex flex-col mb-10 pb-6 border-b-4 border-slate-900">
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
                    <span className="text-[8px] font-black uppercase text-slate-400 mt-1 tracking-widest">Safety System Audit</span>
                </div>
            </div>

            <div className="flex justify-between items-start mb-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Issuing Department</span>
                    <span className="text-sm font-bold text-slate-800 uppercase">HSE Department (Health, Safety & Environment)</span>
                </div>
                <div className="text-right">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">Generated On</span>
                    <span className="text-xs font-bold text-slate-800 uppercase font-mono">{new Date().toLocaleString('en-GB')}</span>
                </div>
            </div>

            <div className="text-center mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                    ZeroGate Safety Intelligence & Behavioral Audit Report
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-1">Ref: ZG-REP-{new Date().toISOString().slice(0,10).replace(/-/g, '')}</p>
            </div>

            <div className="grid grid-cols-4 gap-6 bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 font-sans">
                <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pass Rate</span>
                    <span className="text-2xl font-black text-slate-900">{stats.passRate}%</span>
                </div>
                <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Absence Rate</span>
                    <span className="text-2xl font-black text-rose-600">{stats.absentRate}%</span>
                </div>
                <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Audit</span>
                    <span className="text-2xl font-black text-slate-900">{stats.total}</span>
                </div>
                <div className="text-center">
                    <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Site Scope</span>
                    <span className="text-2xl font-black text-indigo-600">{effectiveSiteId === 'All' ? 'GLOBAL' : sites.find(s => s.id === effectiveSiteId)?.name}</span>
                </div>
            </div>
       </div>

       {/* --- TOP LEVEL KPIS --- */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:hidden">
          <ReportStatCard title="Compliance Rate" value={`${stats.passRate}%`} icon={ShieldCheck} trend="+1.2%" color="indigo" sub="Success vs Fail" />
          <ReportStatCard title="No-Show Rate" value={`${stats.absentRate}%`} icon={UserX} trend={stats.absentRate > '10' ? "CRITICAL" : "NORMAL"} color={stats.absentRate > '10' ? "amber" : "emerald"} sub="Personnel Absences" />
          <ReportStatCard title="Total Audited" value={stats.total} icon={Users} trend="Active Flow" color="blue" sub="Total Requisitions" />
          <ReportStatCard title="Repeat Absentees" value={behavioralStats.repeatOffenders.length} icon={AlertCircle} trend="Behavioral Risk" color="rose" sub="2+ Missed Sessions" />
       </div>

       {/* --- EXECUTIVE TAB --- */}
       {(activeTab === 'Executive' || true) && (
          <div className={`${activeTab === 'Executive' ? 'block' : 'hidden print:block'} space-y-8`}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
                          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8">Quarterly Training Demand</h3>
                          <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={behavioralStats.absentByRac.slice(0, 8)}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                    <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorCount)" name="Demand Volume" />
                                </AreaChart>
                            </ResponsiveContainer>
                          </div>
                      </div>
                      
                      <div className="no-print bg-[#0f172a] p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden border border-slate-800">
                          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                              <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-4">
                                      <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                                          <Sparkles size={24} className="text-indigo-400" />
                                      </div>
                                      <h3 className="text-2xl font-black uppercase tracking-tight">Automated Risk Synthesis</h3>
                                  </div>
                                  <p className="text-slate-400 text-sm leading-relaxed mb-6">Gemini Safety Advisor uses real-time behavioral data to predict operational bottlenecks and instructor bias.</p>
                                  <button onClick={handleGenerateReport} disabled={isGenerating} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                                      {isGenerating ? <RefreshCw className="animate-spin" size={16}/> : <Sparkles size={16}/>}
                                      {isGenerating ? 'Synthesizing...' : 'Generate AI Summary'}
                                  </button>
                              </div>
                              <div className="w-full md:w-1/3 bg-white/5 p-6 rounded-3xl border border-white/10 text-center">
                                  <div className="text-4xl font-black text-indigo-400 mb-1">{stats.passRate}%</div>
                                  <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Global Accuracy</div>
                              </div>
                          </div>
                          {aiReport && (
                            <div className="mt-8 p-6 bg-black/40 rounded-2xl border border-indigo-500/20 text-indigo-100 text-sm leading-relaxed animate-fade-in-down max-h-60 overflow-y-auto font-light">
                                 {aiReport}
                            </div>
                          )}
                      </div>
                  </div>

                  <div className="space-y-8">
                      <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700">
                          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Workforce Status</h3>
                          <div className="h-64 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={[{ name: 'Compliant', value: stats.passed, color: '#10b981' }, { name: 'Failed', value: stats.total - stats.passed - stats.absents, color: '#ef4444' }, { name: 'Absent', value: stats.absents, color: '#f59e0b' }]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {(props: any) => props.data.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">{stats.total}</span>
                                <span className="text-[8px] font-black text-slate-400 uppercase">Records</span>
                            </div>
                          </div>
                      </div>
                      <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-800">
                          <h4 className="font-black text-indigo-900 dark:text-indigo-300 uppercase text-xs tracking-widest mb-4">Absence Hotspots</h4>
                          <div className="space-y-3">
                              {behavioralStats.absentByRac.slice(0, 4).map((r, i) => (
                                  <div key={i} className="flex justify-between items-center text-sm">
                                      <span className="font-bold text-slate-700 dark:text-slate-300">{r.name}</span>
                                      <span className="text-rose-500 font-black">{r.count} Faltas</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
       )}

       {/* --- PERFORMANCE TAB (INSTRUCTORS) --- */}
       {(activeTab === 'Performance' || true) && (
          <div className={`${activeTab === 'Performance' ? 'block' : 'hidden print:block'} animate-fade-in space-y-8`}>
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden page-break-before">
                  <div className="p-8 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex justify-between items-center">
                      <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Faculty Performance Leaderboard</h3>
                          <p className="text-sm text-slate-500 font-medium">Auditing training quality and student success rates by instructor</p>
                      </div>
                      <div className="hidden print:block p-2 bg-indigo-100 rounded-lg text-indigo-700 font-black text-[10px] uppercase">Internal Audit Only</div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              <tr>
                                  <th className="px-8 py-4">Instructor</th>
                                  <th className="px-8 py-4">Students Trained</th>
                                  <th className="px-8 py-4">Authorization Rate</th>
                                  <th className="px-8 py-4">Avg. Score</th>
                                  <th className="px-8 py-4">Absence Weight</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-bold text-sm">
                              {instructorMetrics.map((m, i) => (
                                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                      <td className="px-8 py-5">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-xs uppercase font-black">{m.name.charAt(0)}</div>
                                              <span className="text-slate-900 dark:text-white">{m.name}</span>
                                          </div>
                                      </td>
                                      <td className="px-8 py-5 text-slate-600 dark:text-slate-400">{m.total} Personnel</td>
                                      <td className="px-8 py-5">
                                          <div className="flex items-center gap-2">
                                              <div className="w-16 bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                  <div className="bg-emerald-500 h-full" style={{ width: `${m.passRate}%` }}></div>
                                              </div>
                                              <span className="text-emerald-600">{m.passRate}%</span>
                                          </div>
                                      </td>
                                      <td className="px-8 py-5 text-slate-900 dark:text-white font-mono">{m.avgTheory}%</td>
                                      <td className="px-8 py-5 text-rose-500 font-mono">{m.absentRate}%</td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
       )}

       {/* --- BEHAVIORAL TAB (ABSENTEEISM) --- */}
       {(activeTab === 'Behavioral' || true) && (
          <div className={`${activeTab === 'Behavioral' ? 'block' : 'hidden print:block'} animate-fade-in space-y-8`}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Chart: Company Absences */}
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Absenteeism Weight (By Company)</h3>
                              <p className="text-xs text-slate-500">Comparing absolute no-shows per tenant</p>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-xl text-orange-500"><Building2 size={20}/></div>
                      </div>
                      <div className="h-64 flex-1">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={behavioralStats.companyImpact.slice(0, 10)}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 'bold'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px' }} />
                                <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={32} name="Total Absences" />
                            </BarChart>
                        </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Top Repeat Offenders */}
                  <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Habitual Repeat Offenders</h3>
                              <p className="text-xs text-slate-500 font-medium">Personnel with multiple missed training slots</p>
                          </div>
                          <div className="p-3 bg-red-50 rounded-xl text-red-500"><UserMinus size={20}/></div>
                      </div>
                      <div className="space-y-4 max-h-[300px] overflow-y-auto scrollbar-hide">
                          {behavioralStats.repeatOffenders.map((e, i) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 dark:border-rose-900/20 group">
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-lg bg-rose-500 text-white flex items-center justify-center font-black group-hover:rotate-6 transition-transform">{e.name.charAt(0)}</div>
                                      <div>
                                          <div className="font-bold text-slate-900 dark:text-white text-sm">{e.name}</div>
                                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{e.id} • {e.company}</div>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <div className="bg-rose-600 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg shadow-rose-500/20">{e.count} FALTAS</div>
                                      <div className="text-[8px] text-slate-400 mt-1 uppercase font-bold">Last: {e.lastMiss}</div>
                                  </div>
                              </div>
                          ))}
                          {behavioralStats.repeatOffenders.length === 0 && (
                              <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
                                  <ShieldCheck size={48} className="opacity-20" />
                                  <p className="font-bold uppercase text-xs tracking-widest">No recurrent absenteeism detected</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>

              {/* Master Absence Table */}
              <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-xl overflow-hidden page-break-before">
                  <div className="p-8 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                      <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Master Absence Registry (No-Show Audit)</h3>
                          <p className="text-sm text-slate-500 font-medium">Traceable log of all missed training requisitions for disciplinary review</p>
                      </div>
                      <div className="p-2 bg-amber-100 rounded-lg text-amber-700 font-black text-[10px] uppercase tracking-widest border border-amber-200">Attention Required</div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                              <tr>
                                  <th className="px-8 py-4">Personnel</th>
                                  <th className="px-8 py-4">Company</th>
                                  <th className="px-8 py-4">Module</th>
                                  <th className="px-8 py-4">Scheduled Date</th>
                                  <th className="px-8 py-4">Status</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-800 font-bold text-sm">
                              {behavioralStats.latestAbsents.map((a, i) => (
                                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                      <td className="px-8 py-5">
                                          <div className="text-slate-900 dark:text-white">{a.employee.name}</div>
                                          <div className="text-[10px] text-slate-400 font-mono tracking-tighter">{a.employee.recordId} • {a.employee.role}</div>
                                      </td>
                                      <td className="px-8 py-5 text-slate-500 uppercase text-xs tracking-wide">{a.employee.company}</td>
                                      <td className="px-8 py-5">
                                          <div className="flex items-center gap-2">
                                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded text-[10px] font-black text-slate-600 border border-slate-200 dark:border-slate-700 uppercase">{getRacCode(a)}</span>
                                          </div>
                                      </td>
                                      <td className="px-8 py-5 text-slate-400 font-mono text-xs">{a.resultDate || 'TBD'}</td>
                                      <td className="px-8 py-5">
                                          <span className="text-rose-500 uppercase text-[10px] font-black flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 rounded-full border border-rose-100">
                                              <XCircle size={12}/> NO-SHOW
                                          </span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                    End of Absenteeism Registry • CARS Compliance Layer v2.5
                  </div>
              </div>
          </div>
       )}

       {/* --- PRINT ONLY FOOTER --- */}
       <div className="hidden print:flex justify-between items-end mt-20 pt-10 border-t-2 border-slate-200 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
            <div>
                <p>Confidential Audit Report</p>
                <p>System Authority: {user?.name || 'Authorized Admin'}</p>
            </div>
            <div className="text-right">
                <p>Document Ref: HSE-RPT-{Math.random().toString(36).substring(7).toUpperCase()}</p>
                <p>Page 01 of 01</p>
            </div>
       </div>

    </div>
  );
};

const ReportStatCard = ({ title, value, icon: Icon, trend, color, sub }: any) => {
    const colorClasses: Record<string, string> = {
        indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800",
        emerald: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800",
        amber: "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800",
        blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800",
        rose: "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800"
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-700 relative group overflow-hidden hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-4 rounded-2xl shadow-inner ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full ${trend === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 dark:bg-slate-700 text-slate-500'}`}>
                    {trend}
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter group-hover:scale-110 transition-transform origin-left">{value}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{title}</p>
                <div className="h-1 w-12 bg-slate-100 dark:bg-slate-700 rounded-full mt-4 group-hover:w-full transition-all duration-700"></div>
                <p className="text-[9px] text-slate-500 italic mt-2">{sub}</p>
            </div>
        </div>
    );
}

export default ReportsPage;
