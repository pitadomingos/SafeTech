import React, { useMemo, useState, useEffect } from 'react';
import { Site, Booking, EmployeeRequirement, BookingStatus, UserRole, Company, RecruitmentProcess, RecruitmentStatus, UnsafeCondition } from '../types';
import { isCompanyDescendant } from '../utils/companyUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell
} from 'recharts';
import { 
  TrendingUp, AlertTriangle, Users, Building2, 
  Briefcase, Activity, UserCheck, Clock, ShieldCheck, GraduationCap, Globe, AlertOctagon
} from 'lucide-react';
import { DEPARTMENTS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../services/databaseService';

interface ExecutiveDashboardProps {
  sites: Site[];
  bookings: Booking[];
  requirements: EmployeeRequirement[];
  userRole?: UserRole;
  companies?: Company[];
  unsafeConditions?: UnsafeCondition[];
}

const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ bookings, requirements, companies = [], unsafeConditions = [] }) => {
  const { language, setLanguage, t } = useLanguage();
  
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  const availableCompanies = useMemo(() => {
      if (companies && companies.length > 0) {
          return companies.map(c => c.name).sort();
      }
      return [];
  }, [companies]);

  // --- MOBILIZATION (ONBOARDING) DATA ---
  const [processes, setProcesses] = useState<RecruitmentProcess[]>([]);
  useEffect(() => {
    db.getRecruitmentProcesses().then(setProcesses).catch(err => console.error('Exec: Failed to load processes:', err));
  }, []);

  const filteredProcesses = useMemo(() => {
    return processes.filter(p => {
        const companyObj = companies.find(c => c.name === p.company);
        const parentFilterObj = companies.find(c => c.name === selectedCompany);
        const matchesComp = selectedCompany === 'All' || 
                            p.company === selectedCompany || 
                            (companyObj && parentFilterObj && isCompanyDescendant(companyObj.id, parentFilterObj.id, companies));
        const matchesDept = selectedDept === 'All' || p.department === selectedDept;
        return matchesComp && matchesDept;
    });
  }, [processes, selectedCompany, selectedDept, companies]);

  const mobilizationStats = useMemo(() => {
      let total = 0;
      let completed = 0;
      let inProgress = 0;
      let failed = 0;
      
      const stageCounts = {
          hr: 0,
          security: 0,
          clinic: 0,
          induction: 0
      };

      filteredProcesses.forEach(p => {
          total++;
          if (p.status === RecruitmentStatus.COMPLETED || p.status === RecruitmentStatus.DELIVERED) {
              completed++;
          } else if (p.status === RecruitmentStatus.FAILED) {
              failed++;
          } else {
              inProgress++;
              
              if (p.status === RecruitmentStatus.HR_PENDING) stageCounts.hr++;
              if (p.status === RecruitmentStatus.SECURITY_PENDING || p.status === RecruitmentStatus.PARALLEL_CLEARANCE_PENDING) stageCounts.security++;
              if (p.status === RecruitmentStatus.CLINIC_PENDING) stageCounts.clinic++;
              if (p.status === RecruitmentStatus.INDUCTION_PENDING || p.status === RecruitmentStatus.TRAINING_PENDING) stageCounts.induction++;
          }
      });

      return { total, completed, inProgress, failed, stageCounts };
  }, [filteredProcesses]);

  const pipelineData = useMemo(() => [
      { name: 'HR Review', value: mobilizationStats.stageCounts.hr, color: '#6366f1' },
      { name: 'Security Check', value: mobilizationStats.stageCounts.security, color: '#f59e0b' },
      { name: 'Medical Clinic', value: mobilizationStats.stageCounts.clinic, color: '#ec4899' },
      { name: 'Training / HSE', value: mobilizationStats.stageCounts.induction, color: '#10b981' }
  ], [mobilizationStats]);

  // --- TRAINING (COMPLIANCE) DATA ---
  const filteredEmployeeData = useMemo(() => {
      const empMap = new Map<string, { id: string, company: string, dept: string, siteId: string }>();
      
      bookings.forEach(b => {
          const eSiteId = b.employee.siteId || 's1';
          const companyObj = companies.find(c => c.name === b.employee.company);
          const parentFilterObj = companies.find(c => c.name === selectedCompany);
          const matchesComp = selectedCompany === 'All' || 
                              b.employee.company === selectedCompany || 
                              (companyObj && parentFilterObj && isCompanyDescendant(companyObj.id, parentFilterObj.id, companies));
                              
          const matchesDept = selectedDept === 'All' || b.employee.department === selectedDept;

          if (matchesComp && matchesDept) {
              if (!empMap.has(b.employee.id)) {
                  empMap.set(b.employee.id, {
                      id: b.employee.id,
                      company: b.employee.company,
                      dept: b.employee.department,
                      siteId: eSiteId
                  });
              }
          }
      });
      return Array.from(empMap.values());
  }, [bookings, selectedCompany, selectedDept, companies]);

  const complianceStats = useMemo(() => {
      const stats = {
          total: filteredEmployeeData.length,
          compliant: 0,
          nonCompliant: 0,
          byDept: {} as Record<string, { total: number, compliant: number }>,
      };

      filteredEmployeeData.forEach(emp => {
          const req = requirements.find(r => r.employeeId === emp.id);
          if (!req) return;

          const today = new Date().toISOString().split('T')[0];
          const isAsoValid = !!(req.asoExpiryDate && req.asoExpiryDate > today);
          let allRacsMet = true;

          Object.keys(req.requiredRacs).forEach(racKey => {
              if (req.requiredRacs[racKey]) {
                  const validBooking = bookings.find(b => {
                      if (b.employee.id !== emp.id) return false;
                      if (b.status !== BookingStatus.PASSED) return false;
                      if (!b.expiryDate || b.expiryDate <= today) return false;
                      return b.sessionId.includes(racKey);
                  });

                  if (!validBooking) {
                      allRacsMet = false;
                  }
              }
          });

          if (!stats.byDept[emp.dept]) stats.byDept[emp.dept] = { total: 0, compliant: 0 };
          stats.byDept[emp.dept].total++;

          if (isAsoValid && allRacsMet) {
              stats.compliant++;
              stats.byDept[emp.dept].compliant++;
          } else {
              stats.nonCompliant++;
          }
      });

      return stats;
  }, [filteredEmployeeData, requirements, bookings]);

  const globalComplianceScore = complianceStats.total > 0 ? (complianceStats.compliant / complianceStats.total) * 100 : 0;
  const globalOnboardingScore = mobilizationStats.total > 0 ? (mobilizationStats.completed / mobilizationStats.total) * 100 : 0;

  const deptHeatmapData = useMemo(() => {
      return Object.entries(complianceStats.byDept).map(([dept, data]: [string, { total: number, compliant: number }]) => ({
          name: dept,
          rate: data.total > 0 ? ((data.compliant / data.total) * 100) : 0,
          total: data.total
      })).sort((a, b) => a.rate - b.rate);
  }, [complianceStats.byDept]);

  const getHealthColor = (score: number) => {
      if (score >= 90) return 'text-emerald-500';
      if (score >= 75) return 'text-yellow-500';
      return 'text-red-500';
  };

  // --- SAFESITE (SAFEMAP) DATA ---
  const safeSiteStats = useMemo(() => {
    let total = 0;
    let resolved = 0;
    let pending = 0;
    let delayed = 0;

    unsafeConditions.forEach(c => {
        // Filter by selected company (SafeSite conditions are linked to responsibleArea, but we'll approximate company filter)
        // For a more accurate dashboard, we'd map responsibleArea to company. 
        // Here we just use the global total if 'All' is selected.
        total++;
        if (c.state === 'Resolvido') {
            resolved++;
        } else if (c.mapStatus === 'Atrasado') {
            delayed++;
            pending++;
        } else {
            pending++;
        }
    });

    return { total, resolved, pending, delayed };
  }, [unsafeConditions, selectedCompany, selectedDept]);

  const safeSiteResolutionRate = safeSiteStats.total > 0 ? (safeSiteStats.resolved / safeSiteStats.total) * 100 : 100;

  const safeSiteLocationData = useMemo(() => {
    const locMap: Record<string, { reported: number; resolved: number }> = {};
    unsafeConditions.forEach(c => {
        const loc = c.functionLocation || 'Unknown';
        if (!locMap[loc]) locMap[loc] = { reported: 0, resolved: 0 };
        locMap[loc].reported++;
        if (c.state === 'Resolvido') locMap[loc].resolved++;
    });
    return Object.entries(locMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.reported - a.reported)
      .slice(0, 5); // top 5 locations
  }, [unsafeConditions]);

  return (
    <div className="space-y-8 pb-20 animate-fade-in-up">
        
        {/* --- HEADER & FILTERS --- */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col xl:flex-row justify-between gap-6 transition-all sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
                    <Activity size={32} />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                        Executive Dashboard
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                        Unified Macro KPIs for Onboarding & Training
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <Building2 size={18} className="text-indigo-500" />
                    <select 
                        aria-label="Company Filter"
                        title="Company Filter"
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-2"
                    >
                        <option value="All">{t.common.all} {t.common.company}s</option>
                        {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <Briefcase size={18} className="text-purple-500" />
                    <select 
                        aria-label="Department Filter"
                        title="Department Filter"
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-2"
                    >
                        <option value="All">{t.common.all} Depts</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>

                <button 
                    onClick={() => setLanguage(language === 'en' ? 'pt' : 'en')}
                    className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                >
                    <Globe size={18} className="text-slate-400" />
                    <span className="text-sm font-black uppercase tracking-widest">{language}</span>
                </button>
            </div>
        </div>

        {/* --- HIGH LEVEL KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-emerald-500/10 dark:text-emerald-500/5 group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp size={120} />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><GraduationCap size={14}/> Workforce Compliance</p>
                    <div className="flex items-end gap-3">
                        <h3 className={`text-5xl font-black tracking-tighter ${getHealthColor(globalComplianceScore)}`}>{globalComplianceScore.toFixed(1)}%</h3>
                    </div>
                    <p className="text-sm font-bold text-slate-500 mt-2">{complianceStats.compliant} of {complianceStats.total} staff ready</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-indigo-500/10 dark:text-indigo-500/5 group-hover:scale-110 transition-transform duration-500">
                    <Users size={120} />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><UserCheck size={14}/> Onboarding Success</p>
                    <div className="flex items-end gap-3">
                        <h3 className={`text-5xl font-black tracking-tighter ${getHealthColor(globalOnboardingScore)}`}>{globalOnboardingScore.toFixed(1)}%</h3>
                    </div>
                    <p className="text-sm font-bold text-slate-500 mt-2">{mobilizationStats.completed} cleared successfully</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-amber-500/10 dark:text-amber-500/5 group-hover:scale-110 transition-transform duration-500">
                    <Clock size={120} />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Activity size={14}/> In Progress Mobilization</p>
                    <div className="flex items-end gap-3">
                        <h3 className="text-5xl font-black tracking-tighter text-slate-800 dark:text-white">{mobilizationStats.inProgress}</h3>
                    </div>
                    <p className="text-sm font-bold text-slate-500 mt-2">Candidates in pipeline</p>
                </div>
            </div>

            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-red-500/10 dark:text-red-500/5 group-hover:scale-110 transition-transform duration-500">
                    <AlertTriangle size={120} />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Critical Dept Risk</p>
                    {deptHeatmapData.length > 0 ? (
                        <div className="flex flex-col mt-1">
                            <h3 className="text-2xl font-black text-red-500 tracking-tight leading-tight truncate">{deptHeatmapData[0].name}</h3>
                            <span className="text-xl font-bold text-slate-800 dark:text-white mt-2">{deptHeatmapData[0].rate.toFixed(1)}% <span className="text-sm text-slate-400 font-normal">compliance</span></span>
                        </div>
                    ) : (
                        <span className="text-sm text-slate-400">No data available</span>
                    )}
                </div>
            </div>

            {/* SafeSite KPI Card */}
            <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 text-orange-500/10 dark:text-orange-500/5 group-hover:scale-110 transition-transform duration-500">
                    <AlertOctagon size={120} />
                </div>
                <div className="relative z-10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><AlertOctagon size={14}/> SafeSite Hazards</p>
                    <div className="flex items-end gap-3">
                        <h3 className={`text-5xl font-black tracking-tighter ${getHealthColor(safeSiteResolutionRate)}`}>{safeSiteResolutionRate.toFixed(0)}%</h3>
                    </div>
                    <p className="text-sm font-bold text-slate-500 mt-2">{safeSiteStats.resolved} of {safeSiteStats.total} hazards resolved ({safeSiteStats.delayed} delayed)</p>
                </div>
            </div>
        </div>

        {/* --- MAIN CHARTS AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Onboarding Pipeline Bottlenecks */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <Users className="text-indigo-500"/> Pipeline Bottlenecks
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">Candidates currently stuck in each stage</p>
                    </div>
                </div>
                
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={pipelineData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="value" name="Candidates" radius={[8, 8, 0, 0]} maxBarSize={60}>
                                {pipelineData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Department Compliance Heatmap */}
            <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col">
                <div className="mb-6">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                        <ShieldCheck className="text-emerald-500"/> Department Training Readiness
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">Compliance rates ordered by highest risk</p>
                </div>
                
                <div className="flex-1 space-y-5 overflow-y-auto max-h-72 pr-4 custom-scrollbar">
                    {deptHeatmapData.map((dept, i) => (
                        <div key={i} className="flex items-center gap-4 group">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white shadow-md shrink-0 transition-transform group-hover:scale-105 ${dept.rate >= 90 ? 'bg-emerald-500 shadow-emerald-500/20' : dept.rate >= 75 ? 'bg-amber-500 shadow-amber-500/20' : 'bg-red-500 shadow-red-500/20'}`}>
                                {dept.rate.toFixed(0)}%
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-black text-slate-800 dark:text-white">{dept.name}</span>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-900/50 px-2 py-1 rounded-md">{dept.total} staff</span>
                                </div>
                                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-900/50 rounded-full overflow-hidden">
                                    <style>{`.dept-bar-${i} { width: ${dept.rate}%; }`}</style>
                                    <div 
                                        className={`dept-bar-${i} h-full rounded-full transition-all duration-1000 ${dept.rate >= 90 ? 'bg-emerald-500' : dept.rate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {deptHeatmapData.length === 0 && <p className="text-slate-400 text-sm py-4">No department data available.</p>}
                </div>
            </div>
            {/* SafeSite Performance by Location */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                            <AlertOctagon className="text-orange-500"/> Hazards by Location (Reported vs Resolved)
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">Top 5 critical areas by incident volume</p>
                    </div>
                </div>
                
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={safeSiteLocationData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                            <Tooltip cursor={{ fill: 'rgba(249, 115, 22, 0.05)' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                            <Bar dataKey="reported" name="Reported" fill="#f97316" radius={[4, 4, 0, 0]} maxBarSize={40} />
                            <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    </div>
  );
};

export default ExecutiveDashboard;
