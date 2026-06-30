import React, { useMemo } from 'react';
import { UnsafeCondition, Company } from '../../types';
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Activity, CheckCircle, AlertOctagon, Clock, MapPin, List, ArrowLeft, TrendingUp, PieChart as PieChartIcon, BarChart as BarChartIcon, ShieldAlert, Gauge, History, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  conditions: UnsafeCondition[];
  companies: Company[];
}

export default function AnalyticsDashboard({ conditions }: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Calculate KPI metrics
  const total = conditions.length;
  const resolved = conditions.filter(c => c.state === 'Resolvido').length;
  const pending = total - resolved;
  const delayed = conditions.filter(c => c.mapStatus === 'Atrasado').length;
  
  // Advanced KPIs
  const criticalCount = conditions.filter(c => c.severity === 'Critical').length;
  const highCount = conditions.filter(c => c.severity === 'High').length;
  
  const avgResolutionDays = useMemo(() => {
    const resolvedItems = conditions.filter(c => c.resolvedAt && c.createdAt);
    if (resolvedItems.length === 0) return 0;
    const totalDays = resolvedItems.reduce((acc, c) => {
        const start = new Date(c.createdAt).getTime();
        const end = new Date(c.resolvedAt!).getTime();
        return acc + (end - start);
    }, 0);
    return Math.round(totalDays / resolvedItems.length / (1000 * 60 * 60 * 24));
  }, [conditions]);

  const riskScore = useMemo(() => {
    if (total === 0) return 0;
    const severityWeights = { 'Critical': 10, 'High': 5, 'Medium': 2, 'Low': 1 };
    const totalWeighted = conditions.reduce((acc, c) => acc + (severityWeights[c.severity || 'Medium'] || 2), 0);
    return Math.min(100, Math.round((totalWeighted / (total * 10)) * 100));
  }, [conditions, total]);

  // Pie chart: Situação dos RECs
  const pieData = [
    { name: t.safesite.dashboard.resolved, value: resolved, color: '#10b981', bgClass: 'bg-[#10b981]' },
    { name: t.safesite.dashboard.pending, value: pending, color: '#f59e0b', bgClass: 'bg-[#f59e0b]' },
    { name: t.safesite.dashboard.delayed, value: delayed, color: '#ef4444', bgClass: 'bg-[#ef4444]' }
  ];

  // Severity Data
  const severityData = useMemo(() => {
    const counts: Record<string, number> = { 'Critical': 0, 'High': 0, 'Medium': 0, 'Low': 0 };
    conditions.forEach(c => {
        const sev = c.severity || 'Medium';
        counts[sev]++;
    });
    return [
        { name: 'Critical', value: counts['Critical'], color: '#7f1d1d' },
        { name: 'High', value: counts['High'], color: '#ef4444' },
        { name: 'Medium', value: counts['Medium'], color: '#f59e0b' },
        { name: 'Low', value: counts['Low'], color: '#10b981' }
    ];
  }, [conditions]);

  // Category Data
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    conditions.forEach(c => {
        counts[c.conditionType] = (counts[c.conditionType] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 5);
  }, [conditions]);

  // Bar chart: Distribuição por Estado (Workflow State)
  const stateData = useMemo(() => {
    const counts: Record<string, number> = {
      'Criado': 0,
      'Em Correção': 0,
      'Submetido ao Gerente': 0,
      'Análise SSMA': 0,
      'Resolvido': 0
    };
    conditions.forEach(c => {
      if (counts[c.state] !== undefined) counts[c.state]++;
    });
    return [
      { name: t.safesite.workflow.created, value: counts['Criado'] },
      { name: t.safesite.workflow.inCorrection, value: counts['Em Correção'] },
      { name: t.safesite.workflow.submittedManager, value: counts['Submetido ao Gerente'] },
      { name: t.safesite.workflow.hseAnalysis, value: counts['Análise SSMA'] },
      { name: t.safesite.workflow.resolved, value: counts['Resolvido'] }
    ];
  }, [conditions, t]);

  // Line chart: Evolução Mensal (mocked trend data based on creation dates)
  const trendData = useMemo(() => {
    const counts: Record<string, number> = {};
    conditions.forEach(c => {
      const date = new Date(c.createdAt).toLocaleDateString('default', { month: 'short', day: 'numeric' });
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()).map(([date, count]) => ({
      date,
      count
    }));
  }, [conditions]);

  const MetricCard = ({ title, value, icon: Icon, colorClass, gradientClass, subtitle }: any) => (
    <div className={`relative overflow-hidden rounded-3xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-xl group transition-all duration-300 hover:-translate-y-1 ${gradientClass}`}>
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110 group-hover:rotate-12">
        <Icon size={120} className={colorClass.split(' ')[1]} />
      </div>
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${colorClass} bg-opacity-20 backdrop-blur-md border border-white/20`}>
            <Icon size={24} className={colorClass.split(' ')[1]} />
          </div>
          {subtitle && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{subtitle}</span>}
        </div>
        <div className="text-slate-600 dark:text-slate-400 text-sm font-black uppercase tracking-widest mb-1">{title}</div>
        <div className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white drop-shadow-sm">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-y-auto p-4 md:p-8 space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">{t.safesite.dashboard.title}</h1>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl">{t.safesite.dashboard.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-700 dark:text-slate-200 rounded-2xl font-bold transition-all shadow-sm hover:shadow-md"
          >
            <ArrowLeft size={18} />
            {t.safesite.nav.backToGateway}
          </button>
          <button 
            onClick={() => navigate('/safemap/global')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <MapPin size={18} />
            {t.safesite.nav.globalMap}
          </button>
          <button 
            onClick={() => navigate('/safemap/report')}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <List size={18} />
            {t.safesite.nav.reportingTable}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title={t.safesite.dashboard.totalReported} value={total} icon={Activity} colorClass="bg-indigo-100 text-indigo-600" gradientClass="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-800" subtitle="All Time" />
        <MetricCard title="Risk Exposure" value={`${riskScore}%`} icon={Gauge} colorClass="bg-rose-100 text-rose-600" gradientClass="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/20 dark:to-slate-800" subtitle="Live Score" />
        <MetricCard title="Resolution MTTR" value={avgResolutionDays} icon={History} colorClass="bg-emerald-100 text-emerald-600" gradientClass="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-slate-800" subtitle="Days to Close" />
        <MetricCard title="Critical/High" value={criticalCount + highCount} icon={ShieldAlert} colorClass="bg-amber-100 text-amber-600" gradientClass="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-800" subtitle="Open Risks" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="col-span-1 bg-white dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Condition Severity</h3>
            <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-xl"><ShieldAlert size={18} className="text-rose-500" /></div>
          </div>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 20px', fontWeight: 'bold' }} 
                  itemStyle={{ color: '#1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter">{criticalCount}</span>
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Critical</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-6">
            {severityData.map((d, i) => (
              <div key={i} className="flex flex-col p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.name}</span>
                </div>
                <span className="text-xl font-black text-slate-900 dark:text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-8">
            <div className="flex-1 bg-white dark:bg-slate-800/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Top Hazards by Category</h3>
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl"><BarChartIcon size={18} className="text-indigo-500" /></div>
            </div>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.15} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#64748b'}} />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#64748b'}} width={100} />
                    <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', padding: '12px 20px', fontWeight: 'bold'}} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} maxBarSize={30} />
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>

            <div className="flex-1 bg-slate-900 dark:bg-slate-950 p-8 rounded-3xl border border-slate-700/50 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity duration-700 transform group-hover:scale-150"><Zap size={200} className="text-white" /></div>
            <div className="relative z-10 flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-white">Reporting Activity Trend</h3>
            </div>
            <div className="h-48 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff" opacity={0.1} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '16px', backgroundColor: '#1e293b', border: '1px solid #334155', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', padding: '12px 20px', color: '#f8fafc', fontWeight: 'bold'}} itemStyle={{ color: '#818cf8' }} />
                    <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
                </ResponsiveContainer>
            </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
        <div className="col-span-1 bg-white dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Workflow Status</h3>
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-xl"><Clock size={18} className="text-amber-500" /></div>
            </div>
            <div className="flex flex-col gap-3">
                {stateData.map((d, i) => (
                    <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-tighter">
                            <span>{d.name}</span>
                            <span>{Math.round((d.value / total) * 100) || 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(d.value / total) * 100 || 0}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        
        <div className="col-span-2 bg-white dark:bg-slate-800/80 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Recent High Risk Observations</h3>
                <button onClick={() => navigate('/safemap/report')} className="text-indigo-500 font-bold text-sm hover:underline">View All</button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700">
                            <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Severity</th>
                            <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">Area</th>
                            <th className="pb-4 text-xs font-black text-slate-400 uppercase tracking-widest">State</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {conditions.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5).map((c, i) => (
                            <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                <td className="py-4 pr-4">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px]">{c.description}</p>
                                    <p className="text-[10px] text-slate-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                                </td>
                                <td className="py-4 pr-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                                        c.severity === 'Critical' ? 'bg-red-100 text-red-600' :
                                        c.severity === 'High' ? 'bg-orange-100 text-orange-600' :
                                        c.severity === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                        'bg-emerald-100 text-emerald-600'
                                    }`}>
                                        {c.severity || 'Medium'}
                                    </span>
                                </td>
                                <td className="py-4 pr-4 text-sm font-medium text-slate-600 dark:text-slate-400">{c.responsibleArea}</td>
                                <td className="py-4 text-sm font-black text-indigo-500">{c.state}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
      
    </div>
  );
}
