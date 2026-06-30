
import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Wine, Activity, Wifi, Lock, UserX, AlertTriangle, 
  FileCode, Mail, Smartphone, XCircle, TrendingUp, BarChart3, PieChart as PieIcon,
  Map as MapIcon, Filter, Calendar, ChevronLeft, ChevronRight
} from 'lucide-react';
import { 
  AreaChart, Area, Tooltip, ResponsiveContainer, XAxis, YAxis, CartesianGrid, 
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { BreathalyzerTest, SystemNotification } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';

interface AlcoholIntegrationProps {
    addNotification?: (notif: SystemNotification) => void;
}

const AlcoholIntegration: React.FC<AlcoholIntegrationProps> = ({ addNotification }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [viewLocalSpecs, setViewLocalSpecs] = useState(false);
  
  // --- FILTERS STATE ---
  const [dateFilter, setDateFilter] = useState<'Today' | 'Week' | 'Month'>('Today');
  const [deviceFilter, setDeviceFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'PASS' | 'FAIL'>('All');

  // --- STATE FOR SIMULATION ---
  const [tests, setTests] = useState<BreathalyzerTest[]>([]);
  const [devices] = useState([
      { id: 'GT-01', name: 'Main Gate Turnstile A', status: 'Online', location: 'Gate 1' },
      { id: 'GT-02', name: 'Main Gate Turnstile B', status: 'Online', location: 'Gate 1' },
      { id: 'GT-03', name: 'Contractor Gate C', status: 'Online', location: 'Gate 2' },
      { id: 'WS-01', name: 'Workshop Entrance', status: 'Online', location: 'Workshop' },
  ]);
  const [activeAlert, setActiveAlert] = useState<BreathalyzerTest | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // --- INITIAL DATA GENERATION (History) ---
  useEffect(() => {
      // Generate some history so charts aren't empty
      const history: BreathalyzerTest[] = [];
      const now = new Date();
      const deviceIds = devices.map(d => d.id);
      
      // Generate 500 records spanning back 7 days
      for(let i = 0; i < 500; i++) {
          const timeOffset = Math.floor(Math.random() * 7 * 24 * 60); // minutes
          const date = subDays(now, Math.floor(timeOffset / (24*60)));
          
          // Higher chance of tests in morning (6am-9am)
          const hour = date.getHours();
          if (hour < 5 || hour > 20) continue; // Skip night

          const isPositive = Math.random() < 0.03; // 3% fail rate history
          const dId = deviceIds[Math.floor(Math.random() * deviceIds.length)];
          
          history.push({
              id: uuidv4(),
              deviceId: dId,
              employeeId: `VUL-${Math.floor(Math.random() * 9000) + 1000}`,
              employeeName: 'Historical Record',
              date: date.toISOString().split('T')[0],
              timestamp: format(date, 'HH:mm:ss'),
              result: isPositive ? parseFloat((Math.random() * 0.1).toFixed(3)) : 0,
              status: isPositive ? 'FAIL' : 'PASS'
          });
      }
      setTests(history.sort((a, b) => new Date(b.date + 'T' + b.timestamp).getTime() - new Date(a.date + 'T' + a.timestamp).getTime()));
  }, []);

  // --- MOCK DATA GENERATOR (Live) ---
  const generateMockTest = () => {
      const names = ['Paulo Manjate', 'Jose Cossa', 'Maria Silva', 'Antonio Sitoe', 'Sarah Connor', 'John Doe', 'Luis Tete'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      
      // 5% chance of positive test in live mode
      const isPositive = Math.random() < 0.05;
      const bac = isPositive ? (Math.random() * 0.15).toFixed(3) : '0.000';
      const now = new Date();

      return {
          id: uuidv4(),
          deviceId: randomDevice.id,
          employeeId: `VUL-${Math.floor(Math.random() * 9000) + 1000}`,
          employeeName: randomName,
          date: now.toISOString().split('T')[0],
          timestamp: now.toLocaleTimeString('en-GB', { hour12: false }),
          result: parseFloat(bac),
          status: isPositive ? 'FAIL' : 'PASS',
      } as BreathalyzerTest;
  };

  // --- SIMULATION LOOP ---
  useEffect(() => {
      if (viewLocalSpecs) return; 

      const interval = setInterval(() => {
          const newTest = generateMockTest();
          setTests(prev => [newTest, ...prev]); 

          // Trigger Alert if Positive
          if (newTest.status === 'FAIL') {
              setActiveAlert(newTest);
              handleAutomaticReporting(newTest);
          }
      }, 4000); 

      return () => clearInterval(interval);
  }, [viewLocalSpecs]);

  const handleAutomaticReporting = (test: BreathalyzerTest) => {
      setIsReporting(true);
      setTimeout(() => {
          setIsReporting(false);
          if (addNotification) {
              addNotification({
                  id: uuidv4(),
                  type: 'alert',
                  title: t.alcohol.dashboard.alert.title,
                  message: `Access denied for ${test.employeeName}. Supervisor notified via SMS/Email.`,
                  timestamp: new Date(),
                  isRead: false
              });
          }
      }, 3000);
  };

  // --- DATA FILTERING & ANALYTICS ---
  
  const filteredData = useMemo(() => {
      const today = new Date().toISOString().split('T')[0];
      const oneWeekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
      const oneMonthAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      return tests.filter(t => {
          // Date Filter
          if (dateFilter === 'Today' && t.date !== today) return false;
          if (dateFilter === 'Week' && t.date < oneWeekAgo) return false;
          if (dateFilter === 'Month' && t.date < oneMonthAgo) return false;

          // Device Filter
          if (deviceFilter !== 'All' && t.deviceId !== deviceFilter) return false;

          // Status Filter
          if (statusFilter !== 'All' && t.status !== statusFilter) return false;

          return true;
      });
  }, [tests, dateFilter, deviceFilter, statusFilter]);

  const stats = useMemo(() => {
      const total = filteredData.length;
      const positives = filteredData.filter(t => t.status === 'FAIL').length;
      const passRate = total > 0 ? ((total - positives) / total * 100).toFixed(1) : '100.0';
      const avgPerHour = total > 0 ? (total / (dateFilter === 'Today' ? new Date().getHours() + 1 : 24)).toFixed(0) : '0';

      return { total, positives, passRate, avgPerHour };
  }, [filteredData, dateFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  useEffect(() => {
      if (currentPage > totalPages) {
          setCurrentPage(totalPages > 0 ? totalPages : 1);
      }
  }, [filteredData.length, itemsPerPage, totalPages, currentPage]);

  useEffect(() => {
      setCurrentPage(1);
  }, [dateFilter, deviceFilter, statusFilter]);

  // Chart Data: Hourly Trend
  const trendData = useMemo(() => {
      const grouped: Record<string, { time: string, tests: number, violations: number }> = {};
      
      filteredData.forEach(t => {
          // Grouping Key
          let key = t.timestamp.split(':')[0] + ':00'; // Hourly by default
          if (dateFilter !== 'Today') key = t.date; // Daily if looking at week/month

          if (!grouped[key]) grouped[key] = { time: key, tests: 0, violations: 0 };
          grouped[key].tests++;
          if (t.status === 'FAIL') grouped[key].violations++;
      });

      return Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time));
  }, [filteredData, dateFilter]);

  // Chart Data: Device Distribution
  const deviceStats = useMemo(() => {
      const grouped: Record<string, number> = {};
      filteredData.forEach(t => {
          grouped[t.deviceId] = (grouped[t.deviceId] || 0) + 1;
      });
      return Object.entries(grouped).map(([name, val]) => ({ name, value: val }));
  }, [filteredData]);

  // Chart Data: Pie
  const pieData = [
      { name: t.common.passed, value: stats.total - stats.positives, color: '#10b981' },
      { name: t.common.failed, value: stats.positives, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 pb-24 animate-fade-in-up h-full">
      
      {/* --- COMMAND CENTER HEADER --- */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden border border-slate-700">
          <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
              <Activity size={300} />
          </div>
          
          {/* Top Right Controls */}
          <div className="absolute top-6 right-6 flex flex-col items-end gap-3">
              {!viewLocalSpecs && (
                  <div className="flex items-center gap-2 bg-red-500/20 px-4 py-2 rounded-full border border-red-500/50 animate-pulse">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-xs font-bold uppercase tracking-widest text-red-200">{t.alcohol.dashboard.live}</span>
                  </div>
              )}
              
              <div className="flex gap-2">
                  <button 
                    onClick={() => navigate('/tech-docs')}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                  >
                      <FileCode size={14} /> Specs
                  </button>
                  <button 
                    onClick={() => setViewLocalSpecs(!viewLocalSpecs)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors border border-white/10"
                  >
                      <Activity size={14} /> {viewLocalSpecs ? t.alcohol.dashboard.backToLive : t.alcohol.dashboard.specs}
                  </button>
              </div>
          </div>

          <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-indigo-500/20 rounded-2xl border border-indigo-500/30 backdrop-blur-md">
                      <Wine size={32} className="text-indigo-400" />
                  </div>
                  <div>
                      <h1 className="text-3xl font-black tracking-tight">{t.alcohol.dashboard.title}</h1>
                      <p className="text-slate-400">{t.alcohol.dashboard.subtitle}</p>
                  </div>
              </div>

              {!viewLocalSpecs && (
                  /* KPI ROW - DYNAMIC */
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">{t.alcohol.dashboard.kpi.total}</p>
                          <div className="text-3xl font-black text-white">{stats.total}</div>
                      </div>
                      <div className="bg-red-900/20 p-4 rounded-2xl border border-red-900/50">
                          <p className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">{t.alcohol.dashboard.kpi.violations}</p>
                          <div className="text-3xl font-black text-red-500">{stats.positives}</div>
                      </div>
                      <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Pass Rate</p>
                          <div className="text-3xl font-black text-blue-400">{stats.passRate}%</div>
                      </div>
                      <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-900/50">
                          <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">{t.alcohol.dashboard.kpi.health}</p>
                          <div className="text-3xl font-black text-emerald-500">100% <span className="text-sm text-emerald-400/60 font-normal">{t.alcohol.dashboard.online}</span></div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {!viewLocalSpecs && (
          /* --- FILTER BAR --- */
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md border border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
                      <Calendar size={16} className="text-slate-400" />
                      <select 
                          value={dateFilter} 
                          onChange={(e) => setDateFilter(e.target.value as any)}
                          title="Filter by Date"
                          className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                      >
                          <option value="Today">Today</option>
                          <option value="Week">Last 7 Days</option>
                          <option value="Month">Last 30 Days</option>
                      </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
                      <MapIcon size={16} className="text-slate-400" />
                      <select 
                          value={deviceFilter} 
                          onChange={(e) => setDeviceFilter(e.target.value)}
                          title="Filter by Device"
                          className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                      >
                          <option value="All">All Devices</option>
                          {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 p-2 rounded-lg border border-slate-200 dark:border-slate-600">
                      <Filter size={16} className="text-slate-400" />
                      <select 
                          value={statusFilter} 
                          onChange={(e) => setStatusFilter(e.target.value as any)}
                          title="Filter by Status"
                          className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                      >
                          <option value="All">All Results</option>
                          <option value="PASS">Pass Only</option>
                          <option value="FAIL">Fail Only</option>
                      </select>
                  </div>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                  {t.common.recordsFound}: {filteredData.length}
              </div>
          </div>
      )}

      {viewLocalSpecs ? (
          /* --- TECHNICAL SPECS VIEW --- */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <Lock className="text-blue-500" size={24}/> {t.alcohol.protocol.title}
                  </h3>
                  <div className="space-y-6">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-l-4 border-blue-500">
                          <h4 className="font-bold text-slate-800 dark:text-white">{t.alcohol.protocol.positiveTitle}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.alcohol.protocol.positiveDesc}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border-l-4 border-green-500">
                          <h4 className="font-bold text-slate-800 dark:text-white">{t.alcohol.protocol.resetTitle}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t.alcohol.protocol.resetDesc}</p>
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                      <MapIcon className="text-purple-500" size={24}/> {t.alcohol.features.title}
                  </h3>
                  <ul className="space-y-4">
                      <li className="flex gap-4 items-start">
                          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600"><Wifi size={18}/></div>
                          <div>
                              <h4 className="font-bold text-sm text-slate-800 dark:text-white">{t.alcohol.features.iotTitle}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{t.alcohol.features.iotDesc}</p>
                          </div>
                      </li>
                      <li className="flex gap-4 items-start">
                          <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600"><Lock size={18}/></div>
                          <div>
                              <h4 className="font-bold text-sm text-slate-800 dark:text-white">{t.alcohol.features.accessTitle}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{t.alcohol.features.accessDesc}</p>
                          </div>
                      </li>
                      <li className="flex gap-4 items-start">
                          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600"><FileCode size={18}/></div>
                          <div>
                              <h4 className="font-bold text-sm text-slate-800 dark:text-white">{t.alcohol.features.complianceTitle}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{t.alcohol.features.complianceDesc}</p>
                          </div>
                      </li>
                  </ul>
              </div>
          </div>
      ) : (
          /* --- ANALYTICS & LIVE VIEW --- */
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fade-in">
              
              {/* --- LEFT COL: ANALYTICS CHARTS --- */}
              <div className="xl:col-span-2 space-y-6">
                  
                  {/* Chart 1: Trend */}
                  <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-6">
                      <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                          <TrendingUp size={20} className="text-indigo-500" /> 
                          {dateFilter === 'Today' ? t.alcohol.dashboard.hourlyTrend : t.alcohol.dashboard.dailyTrend}
                      </h3>
                      <div className="h-64 w-full min-w-0">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={trendData}>
                                  <defs>
                                      <linearGradient id="colorTests" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                      </linearGradient>
                                      <linearGradient id="colorFails" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                  <Legend />
                                  <Area type="monotone" dataKey="tests" stroke="#6366f1" fillOpacity={1} fill="url(#colorTests)" name={t.alcohol.dashboard.kpi.total} />
                                  <Area type="monotone" dataKey="violations" stroke="#ef4444" fillOpacity={1} fill="url(#colorFails)" name={t.alcohol.dashboard.kpi.violations} />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Chart 2: Device Load */}
                      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-6">
                          <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                              <BarChart3 size={20} className="text-blue-500" /> {t.alcohol.dashboard.deviceLoad}
                          </h3>
                          <div className="h-48 w-full min-w-0">
                              <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={deviceStats} layout="vertical">
                                      <XAxis type="number" hide />
                                      <YAxis dataKey="name" type="category" width={50} tick={{fill: '#94a3b8', fontSize: 10}} />
                                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}/>
                                      <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name={t.common.testsProcessed} />
                                  </BarChart>
                              </ResponsiveContainer>
                          </div>
                      </div>

                      {/* Chart 3: Compliance Ratio */}
                      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 p-6 flex flex-col items-center">
                          <h3 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2 self-start">
                              <PieIcon size={20} className="text-emerald-500" /> {t.alcohol.dashboard.complianceRatio}
                          </h3>
                          <div className="h-48 w-full relative min-w-0">
                              <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                      <Pie
                                          data={pieData}
                                          innerRadius={60}
                                          outerRadius={80}
                                          paddingAngle={5}
                                          dataKey="value"
                                      >
                                          {pieData.map((entry, index) => (
                                              <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                          ))}
                                      </Pie>
                                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                      <Legend verticalAlign="bottom" height={36}/>
                                  </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                                  <div className="text-center">
                                      <span className="text-2xl font-black text-slate-800 dark:text-white">{stats.passRate}%</span>
                                      <div className="text-[10px] text-slate-500 uppercase font-bold">{t.common.passed}</div>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>

              {/* --- RIGHT COL: LIVE FEED --- */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex flex-col h-[650px]">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Wifi size={20} className="text-blue-500 animate-pulse" /> {t.alcohol.dashboard.liveStream}
                      </h3>
                      <div className="flex gap-2">
                          <span className="text-[10px] bg-white dark:bg-slate-700 text-slate-500 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">{t.alcohol.dashboard.mqtt}</span>
                      </div>
                  </div>
                  <div className="flex-1 overflow-auto p-0 scrollbar-hide">
                      <table className="w-full text-sm text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-500 uppercase font-bold sticky top-0 z-10 backdrop-blur-sm">
                              <tr>
                                  <th className="px-4 py-3">{t.common.time}</th>
                                  <th className="px-4 py-3">User</th>
                                  <th className="px-4 py-3 text-right">Result</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((test) => (
                                  <tr key={test.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${test.status === 'FAIL' ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                      <td className="px-4 py-3">
                                          <div className="font-mono text-slate-600 dark:text-slate-400 text-xs">{test.timestamp}</div>
                                          <div className="text-[10px] text-slate-400">{test.deviceId}</div>
                                      </td>
                                      <td className="px-4 py-3">
                                          <div className="font-bold text-slate-800 dark:text-white text-xs truncate max-w-[120px]">{test.employeeName}</div>
                                          <div className="text-[10px] text-slate-500">{test.employeeId}</div>
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                          {test.status === 'PASS' ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] font-bold">
                                                  OK
                                              </span>
                                          ) : (
                                              <div className="flex flex-col items-end">
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold animate-pulse">
                                                      FAIL
                                                  </span>
                                                  <span className="text-[10px] font-mono text-red-500 font-bold">{test.result.toFixed(3)}</span>
                                              </div>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  
                  {/* Pagination Footer */}
                  {filteredData.length > 0 && (
                      <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                              <select
                                  value={itemsPerPage}
                                  onChange={e => {
                                      setItemsPerPage(Number(e.target.value));
                                      setCurrentPage(1);
                                  }}
                                  title="Rows per page"
                                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                              >
                                  {[20, 30, 50, 80, 100].map(val => (
                                      <option key={val} value={val}>{val}</option>
                                  ))}
                              </select>
                              <span>/ page</span>
                          </div>
                          <div className="flex items-center gap-2">
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                  Page {currentPage} of {totalPages || 1}
                              </span>
                              <div className="flex gap-1">
                                  <button
                                      disabled={currentPage === 1}
                                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-colors text-slate-600 dark:text-slate-300"
                                      title="Previous Page"
                                  >
                                      <ChevronLeft size={12} />
                                  </button>
                                  <button
                                      disabled={currentPage === totalPages}
                                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                      className="p-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-50 transition-colors text-slate-600 dark:text-slate-300"
                                      title="Next Page"
                                  >
                                      <ChevronRight size={12} />
                                  </button>
                                </div>
                          </div>
                      </div>
                  )}
                  
                  {/* Device Status Footer */}
                  <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                          <span className="font-bold uppercase tracking-wider">{t.alcohol.dashboard.deviceHealth}</span>
                          <span className="text-emerald-500 font-bold">100% {t.alcohol.dashboard.online}</span>
                      </div>
                      <div className="flex gap-1 h-1.5 w-full">
                          {devices.map(d => (
                              <div key={d.id} className="flex-1 bg-emerald-500 rounded-full opacity-80" title={d.name}></div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- ALERT MODAL (SIMULATED) --- */}
      {activeAlert && (
          <div className="fixed inset-0 z-50 bg-red-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border-2 border-red-500 relative">
                  
                  {/* Header */}
                  <div className="bg-red-600 p-6 flex justify-between items-center text-white">
                      <div className="flex items-center gap-3">
                          <AlertTriangle size={32} className="animate-bounce" />
                          <div>
                              <h2 className="text-xl font-black uppercase tracking-wider">{t.alcohol.dashboard.alert.title}</h2>
                              <p className="text-xs text-red-100">{t.alcohol.dashboard.alert.desc}</p>
                          </div>
                      </div>
                      <button onClick={() => setActiveAlert(null)} title="Close" className="p-2 hover:bg-white/20 rounded-full transition-colors"><XCircle size={24} /></button>
                  </div>

                  <div className="p-8">
                      <div className="flex gap-6 mb-8">
                          <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-400 shadow-inner border border-slate-300 dark:border-slate-600">
                              <UserX size={48} />
                          </div>
                          <div>
                              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{activeAlert.employeeName}</h3>
                              <p className="text-sm font-mono text-slate-500 mb-4">{activeAlert.employeeId}</p>
                              <div className="inline-flex items-center gap-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800">
                                  <span className="text-xs font-bold uppercase">{t.alcohol.dashboard.alert.measured}</span>
                                  <span className="text-lg font-black">{activeAlert.result.toFixed(3)}%</span>
                              </div>
                          </div>
                      </div>

                      {/* Automated Actions Log */}
                      <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-700 pb-2">{t.alcohol.dashboard.actions}</h4>
                          
                          <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                              <div className="p-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full"><Lock size={14}/></div>
                              <span dangerouslySetInnerHTML={{ __html: t.alcohol.dashboard.actionLog.locked.replace('Locked', '<strong>Locked</strong>').replace('Bloqueado', '<strong>Bloqueado</strong>') }}></span>
                          </div>

                          <div className={`flex items-center gap-3 text-sm transition-all duration-500 ${isReporting ? 'opacity-50' : 'opacity-100 text-slate-700 dark:text-slate-300'}`}>
                              <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full">
                                  {isReporting ? <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div> : <Mail size={14}/>}
                              </div>
                              <span>
                                  {isReporting ? t.alcohol.dashboard.actionLog.generating : t.alcohol.dashboard.actionLog.logged}
                              </span>
                          </div>

                          <div className={`flex items-center gap-3 text-sm transition-all duration-500 delay-150 ${isReporting ? 'opacity-30' : 'opacity-100 text-slate-700 dark:text-slate-300'}`}>
                              <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-full"><Smartphone size={14}/></div>
                              <span>
                                  {isReporting ? t.alcohol.dashboard.actionLog.contacting : <strong>{t.alcohol.dashboard.actionLog.sent}</strong>}
                              </span>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
                      <button 
                        onClick={() => setActiveAlert(null)}
                        className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white rounded-lg font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                      >
                          {t.alcohol.dashboard.close}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default AlcoholIntegration;
