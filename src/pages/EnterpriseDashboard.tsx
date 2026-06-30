import React, { useMemo, useState } from 'react';
import { Site, Booking, EmployeeRequirement, BookingStatus, UserRole, Company } from '../types';
import { isCompanyDescendant } from '../utils/companyUtils';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend
} from 'recharts';
import { 
  Globe, TrendingUp, AlertTriangle, Users, Building2, 
  Map as MapIcon, Filter, Sparkles, FileText, Briefcase, Zap,
  Server
} from 'lucide-react';
// Fix: Removed non-existent COMPANIES member from import to avoid reference error.
import { DEPARTMENTS } from '../constants';
import { generateSafetyReport } from '../services/geminiService';
import { useLanguage } from '../contexts/LanguageContext';

interface EnterpriseDashboardProps {
  sites: Site[];
  bookings: Booking[];
  requirements: EmployeeRequirement[];
  userRole?: UserRole;
  companies?: Company[];
}

const EnterpriseDashboard: React.FC<EnterpriseDashboardProps> = ({ sites, bookings, requirements, userRole, companies = [] }) => {
  const { language, t } = useLanguage();
  
  // --- Filters State ---
  const [selectedSiteId, setSelectedSiteId] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');

  // AI State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Fix: Compute available companies dynamically or from the companies list
  const availableCompanies = useMemo(() => {
      if (companies && companies.length > 0) {
          return companies.map(c => c.name).sort();
      }
      const comps = new Set<string>();
      bookings.forEach(b => {
          if (b.employee.company) comps.add(b.employee.company);
      });
      return Array.from(comps).sort();
  }, [bookings, companies]);

  // --- FILTERING LOGIC ---
  // 1. Get filtered employees (unique) based on criteria
  const filteredEmployeeData = useMemo(() => {
      const empMap = new Map<string, { id: string, company: string, dept: string, siteId: string }>();
      
      // Populate from bookings (Primary source of employee data in this mock)
      bookings.forEach(b => {
          // Normalize siteId (default s1 if missing)
          const eSiteId = b.employee.siteId || 's1';
          
          const matchesSite = selectedSiteId === 'All' || eSiteId === selectedSiteId;
          
          const companyObj = companies.find(c => c.name === b.employee.company);
          const parentFilterObj = companies.find(c => c.name === selectedCompany);
          const matchesComp = selectedCompany === 'All' || 
                              b.employee.company === selectedCompany || 
                              (companyObj && parentFilterObj && isCompanyDescendant(companyObj.id, parentFilterObj.id, companies));
                              
          const matchesDept = selectedDept === 'All' || b.employee.department === selectedDept;

          if (matchesSite && matchesComp && matchesDept) {
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
  }, [bookings, selectedSiteId, selectedCompany, selectedDept, companies]);

  // 2. Calculate Compliance for Filtered Set
  const complianceStats = useMemo(() => {
      const stats = {
          total: filteredEmployeeData.length,
          compliant: 0,
          nonCompliant: 0,
          byDept: {} as Record<string, { total: number, compliant: number }>,
          byRac: {} as Record<string, { total: number, passed: number }>
      };

      filteredEmployeeData.forEach(emp => {
          const req = requirements.find(r => r.employeeId === emp.id);
          if (!req) return;

          const today = new Date().toISOString().split('T')[0];
          const isAsoValid = !!(req.asoExpiryDate && req.asoExpiryDate > today);
          let allRacsMet = true;

          // Check RACs
          Object.keys(req.requiredRacs).forEach(racKey => {
              if (req.requiredRacs[racKey]) {
                  // Track RAC stats globally
                  if (!stats.byRac[racKey]) stats.byRac[racKey] = { total: 0, passed: 0 };
                  stats.byRac[racKey].total++;

                  // Find valid booking
                  const validBooking = bookings.find(b => {
                      if (b.employee.id !== emp.id) return false;
                      if (b.status !== BookingStatus.PASSED) return false;
                      if (!b.expiryDate || b.expiryDate <= today) return false;
                      return b.sessionId.includes(racKey); // Simple check
                  });

                  if (validBooking) {
                      stats.byRac[racKey].passed++;
                  } else {
                      allRacsMet = false;
                  }
              }
          });

          // Department Stats
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

  // 3. Site Comparison Data (Only meaningful if "All Sites" selected, but we calculate anyway)
  const siteComparisonData = useMemo(() => {
      if (selectedSiteId !== 'All') return []; 

      return sites.map(site => {
          // Filter employees for this specific site
          const siteEmps = filteredEmployeeData.filter(e => e.siteId === site.id);
          const total = siteEmps.length;
          let comp = 0;
          
          siteEmps.forEach(emp => {
              // Re-run compliance check logic (simplified reuse)
              const req = requirements.find(r => r.employeeId === emp.id);
              if (!req) return;
              const today = new Date().toISOString().split('T')[0];
              const isAsoValid = !!(req.asoExpiryDate && req.asoExpiryDate > today);
              let allRacsMet = true;
              Object.keys(req.requiredRacs).forEach(k => {
                  if (req.requiredRacs[k]) {
                      const has = bookings.some(b => b.employee.id === emp.id && b.status === 'Passed' && b.sessionId.includes(k) && b.expiryDate && b.expiryDate > today);
                      if (!has) allRacsMet = false;
                  }
              });
              if (isAsoValid && allRacsMet) comp++;
          });

          return {
              name: site.name,
              rate: total > 0 ? ((comp / total) * 100).toFixed(1) : '0.0',
              total
          };
      }).sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
  }, [sites, filteredEmployeeData, requirements, bookings, selectedSiteId]);

  // 3b. Company Comparison Data (SYSTEM ADMIN ONLY)
  const companyComparisonData = useMemo(() => {
      if (userRole !== UserRole.SYSTEM_ADMIN || selectedCompany !== 'All') return [];
      
      const companyMap = new Map<string, {total: number, compliant: number}>();
      
      filteredEmployeeData.forEach(emp => {
          if (!companyMap.has(emp.company)) companyMap.set(emp.company, {total: 0, compliant: 0});
          const stats = companyMap.get(emp.company)!;
          stats.total++;
          
          const req = requirements.find(r => r.employeeId === emp.id);
          if (!req) return;
          const today = new Date().toISOString().split('T')[0];
          const isAsoValid = !!(req.asoExpiryDate && req.asoExpiryDate > today);
          let allRacsMet = true;
          Object.keys(req.requiredRacs).forEach(k => {
              if (req.requiredRacs[k]) {
                  const has = bookings.some(b => b.employee.id === emp.id && b.status === 'Passed' && b.sessionId.includes(k) && b.expiryDate && b.expiryDate > today);
                  if (!has) allRacsMet = false;
              }
          });
          if (isAsoValid && allRacsMet) stats.compliant++;
      });
      
      return Array.from(companyMap.entries()).map(([name, data]) => ({
          name,
          rate: data.total > 0 ? ((data.compliant / data.total) * 100).toFixed(1) : '0.0',
          total: data.total
      })).sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
  }, [filteredEmployeeData, requirements, bookings, userRole, selectedCompany]);

  // 4. Department Heatmap Data
  const deptHeatmapData = useMemo(() => {
      return Object.entries(complianceStats.byDept).map(([dept, data]: [string, { total: number, compliant: number }]) => ({
          name: dept,
          rate: data.total > 0 ? ((data.compliant / data.total) * 100) : 0,
          total: data.total
      })).sort((a, b) => a.rate - b.rate); // Worst performing first
  }, [complianceStats.byDept]);

  // 5. RAC Bottleneck Data
  const racBottleneckData = useMemo(() => {
      return Object.entries(complianceStats.byRac).map(([rac, data]: [string, { total: number, passed: number }]) => ({
          name: rac,
          failRate: data.total > 0 ? (((data.total - data.passed) / data.total) * 100) : 0
      })).sort((a, b) => b.failRate - a.failRate).slice(0, 5); // Top 5 worst
  }, [complianceStats.byRac]);

  const globalHealthScore = complianceStats.total > 0 ? (complianceStats.compliant / complianceStats.total) * 100 : 0;

  // -- AI --
  const handleGenerateExecutiveReport = async () => {
      setIsGenerating(true);
      
      const roleContext = userRole === UserRole.SYSTEM_ADMIN 
        ? 'Platform System Administrator' 
        : 'Global HSE Director';
      
      const systemScope = userRole === UserRole.SYSTEM_ADMIN
        ? 'Multi-Tenant Platform (All Client Enterprises)'
        : 'Enterprise (Single Client)';

      const context = {
          role: roleContext,
          scope: systemScope,
          filters: { site: selectedSiteId, company: selectedCompany, dept: selectedDept },
          stats: {
              globalScore: globalHealthScore.toFixed(1) + '%',
              totalWorkforce: complianceStats.total,
              companyBreakdown: companyComparisonData.map(c => `${c.name}: ${c.rate}%`),
              siteBreakdown: siteComparisonData.map(s => `${s.name}: ${s.rate}%`),
              riskDepartments: deptHeatmapData.slice(0, 3).map(d => `${d.name} (${d.rate.toFixed(1)}%)`),
              trainingBottlenecks: racBottleneckData.map(r => `${r.name} (${r.failRate.toFixed(1)}% Fail)`)
          }
      };
      const report = await generateSafetyReport(context, 'Current Quarter', language);
      setAiReport(report);
      setIsGenerating(false);
  };

  const getHealthColor = (score: number) => {
      if (score >= 90) return 'text-emerald-500';
      if (score >= 75) return 'text-yellow-500';
      return 'text-red-500';
  };

  return (
    <div className="space-y-8 pb-20 animate-fade-in-up">
        
        {/* --- FILTERS HEADER --- */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col xl:flex-row justify-between gap-6 transition-all sticky top-0 z-20">
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl shadow-lg text-white ${userRole === UserRole.SYSTEM_ADMIN ? 'bg-gradient-to-br from-slate-700 to-slate-900' : 'bg-gradient-to-br from-indigo-600 to-violet-600'}`}>
                    {userRole === UserRole.SYSTEM_ADMIN ? <Server size={28} /> : <Globe size={28} />}
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                        {userRole === UserRole.SYSTEM_ADMIN ? t.enterprise.systemTitle : t.enterprise.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {userRole === UserRole.SYSTEM_ADMIN ? t.enterprise.systemSubtitle : t.enterprise.subtitle}
                    </p>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl border border-slate-200 dark:border-slate-600">
                    <MapIcon size={16} className="text-slate-400 ml-1" />
                    <select 
                        value={selectedSiteId}
                        onChange={(e) => setSelectedSiteId(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-2"
                    >
                        <option value="All">{t.common.all} {t.enterprise.siteName}s</option>
                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl border border-slate-200 dark:border-slate-600">
                    <Building2 size={16} className="text-slate-400 ml-1" />
                    <select 
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-2"
                    >
                        <option value="All">{t.common.all} {t.common.company}s</option>
                        {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-2 rounded-xl border border-slate-200 dark:border-slate-600">
                    <Briefcase size={16} className="text-slate-400 ml-1" />
                    <select 
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer pr-2"
                    >
                        <option value="All">{t.common.all} Depts</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>
        </div>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.enterprise.globalHealth}</p>
                <div className="flex items-end gap-3">
                    <h3 className={`text-4xl font-black ${getHealthColor(globalHealthScore)}`}>{globalHealthScore.toFixed(1)}%</h3>
                    <TrendingUp size={24} className={getHealthColor(globalHealthScore)} />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.enterprise.totalWorkforce}</p>
                <div className="flex items-end gap-3">
                    <h3 className="text-4xl font-black text-slate-800 dark:text-white">{complianceStats.total}</h3>
                    <Users size={24} className="text-blue-500" />
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.enterprise.topPerformer}</p>
                {selectedSiteId === 'All' && siteComparisonData.length > 0 ? (
                    <div className="flex flex-col">
                        <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 truncate">{siteComparisonData[0].name}</h3>
                        <span className="text-sm font-bold text-slate-400">{siteComparisonData[0].rate}% Compliance</span>
                    </div>
                ) : (
                    <span className="text-sm text-slate-400 italic">Filter set to single site</span>
                )}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t.enterprise.needsAttention}</p>
                {deptHeatmapData.length > 0 ? (
                    <div className="flex flex-col">
                        <h3 className="text-xl font-black text-red-500 truncate">{deptHeatmapData[0].name}</h3>
                        <span className="text-sm font-bold text-slate-400">{deptHeatmapData[0].rate.toFixed(1)}% Compliance</span>
                    </div>
                ) : (
                    <span className="text-sm text-slate-400">{t.enterprise.noData}</span>
                )}
            </div>
        </div>

        {/* --- SYSTEM ADMIN EXCLUSIVE: TENANT COMPARISON --- */}
        {userRole === UserRole.SYSTEM_ADMIN && selectedCompany === 'All' && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700 text-white animate-fade-in-down">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <Building2 size={20} className="text-cyan-400"/> {t.enterprise.tenantMatrix}
                    </h3>
                    <span className="text-xs font-mono bg-slate-700 px-2 py-1 rounded">{t.enterprise.systemView}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {companyComparisonData.map((comp, i) => (
                        <div key={i} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600 hover:border-cyan-500/50 transition-all">
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-bold text-sm truncate">{comp.name}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${parseFloat(comp.rate) > 80 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                                    {comp.rate}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-600 h-1.5 rounded-full overflow-hidden mb-2">
                                <div className={`h-full rounded-full ${parseFloat(comp.rate) > 80 ? 'bg-green-500' : 'bg-red-500'}`} style={{width: `${comp.rate}%`}}></div>
                            </div>
                            <div className="text-[10px] text-slate-400 text-right">{comp.total} employees</div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- MAIN CHARTS AREA --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Site Comparison Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                    <MapIcon size={20} className="text-indigo-500"/> {t.enterprise.siteComparison}
                </h3>
                <div className="h-80 w-full" style={{ minWidth: 0 }}>
                    {siteComparisonData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={siteComparisonData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" domain={[0, 100]} hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#64748b' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px' }} />
                                <Bar dataKey="rate" name={t.common.complianceRate} fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20}>
                                    {siteComparisonData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={parseFloat(entry.rate) >= 90 ? '#10b981' : parseFloat(entry.rate) >= 75 ? '#f59e0b' : '#ef4444'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            {t.enterprise.selectPrompt}
                        </div>
                    )}
                </div>
            </div>

            {/* Department Risk Heatmap */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{t.enterprise.riskHeatmap}</h3>
                <p className="text-xs text-slate-500 mb-6">Lowest compliance departments shown first</p>
                
                <div className="flex-1 space-y-4 overflow-y-auto max-h-80 pr-2">
                    {deptHeatmapData.map((dept, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-white shadow-sm shrink-0 ${dept.rate >= 90 ? 'bg-emerald-500' : dept.rate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`}>
                                {dept.rate.toFixed(0)}%
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-bold text-slate-800 dark:text-white">{dept.name}</span>
                                    <span className="text-xs text-slate-400">{dept.total} staff</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${dept.rate >= 90 ? 'bg-emerald-500' : dept.rate >= 75 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                        style={{ width: `${dept.rate}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- AI & BOTTLENECKS --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* AI Executive Summary */}
            <div className="lg:col-span-2 relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${userRole === UserRole.SYSTEM_ADMIN ? 'from-slate-600 to-slate-400' : 'from-violet-500 to-fuchsia-500'}`}></div>
                <div className="p-6 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${userRole === UserRole.SYSTEM_ADMIN ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300' : 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'}`}>
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                    {userRole === UserRole.SYSTEM_ADMIN ? t.enterprise.aiAuditor : t.enterprise.aiDirector}
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {userRole === UserRole.SYSTEM_ADMIN ? t.enterprise.systemIntelligence : `${t.enterprise.companyIntelligence} ${selectedCompany}`}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={handleGenerateExecutiveReport}
                            disabled={isGenerating}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg transition-all transform hover:scale-105
                                ${isGenerating ? 'bg-slate-400' : (userRole === UserRole.SYSTEM_ADMIN ? 'bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-600 hover:to-slate-800' : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500')}
                            `}
                        >
                            {isGenerating ? <div className="animate-spin h-4 w-4 border-2 border-white/50 border-t-white rounded-full"/> : <Sparkles size={14}/>}
                            {isGenerating ? t.reports.analyzing : t.reports.generate}
                        </button>
                    </div>

                    <div className="flex-1 bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700 overflow-y-auto min-h-[200px]">
                        {aiReport ? (
                            <div className="prose prose-sm max-w-none dark:prose-invert text-slate-800 dark:text-slate-300">
                                {aiReport.split('\n').map((line, i) => (
                                    <p key={i} className={`
                                        ${line.startsWith('##') ? 'text-lg font-bold text-indigo-900 dark:text-indigo-200 mt-4 mb-2' : 'text-slate-700 dark:text-slate-300 mb-2'}
                                    `}>
                                        {line.replace(/#/g, '').replace(/\*\*/g, '')}
                                    </p>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                                <Zap size={48} className={`mb-4 ${userRole === UserRole.SYSTEM_ADMIN ? 'text-slate-300' : 'text-violet-300 dark:text-violet-900'}`} />
                                <p className="text-center font-medium">{t.enterprise.aiPrompt} <br/> {userRole === UserRole.SYSTEM_ADMIN ? t.enterprise.aiPromptSystem : t.enterprise.aiPromptEnterprise}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Training Bottlenecks */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle size={20} className="text-orange-500" /> {t.enterprise.bottlenecks}
                </h3>
                <div className="space-y-4">
                    {racBottleneckData.map((rac, i) => (
                        <div key={i} className="group p-4 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 hover:shadow-md transition-all">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-slate-800 dark:text-orange-200 text-sm">{rac.name}</span>
                                <span className="text-xs font-black text-red-500">{rac.failRate.toFixed(1)}% {t.enterprise.failure}</span>
                            </div>
                            <div className="w-full bg-orange-200 dark:bg-orange-900/30 h-2 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full rounded-full" style={{ width: `${rac.failRate}%` }}></div>
                            </div>
                        </div>
                    ))}
                    {racBottleneckData.length === 0 && <p className="text-slate-400 text-sm text-center py-4">{t.enterprise.noData}</p>}
                </div>
            </div>

        </div>
    </div>
  );
};

export default EnterpriseDashboard;
