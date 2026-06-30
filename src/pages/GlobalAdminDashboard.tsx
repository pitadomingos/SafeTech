
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, CreditCard, LayoutGrid, 
  TrendingUp, Clock, AlertCircle, ChevronRight, 
  Search, ShieldCheck, Zap, BarChart3, 
  MapPin, Globe, Activity, Settings, ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { Company } from '../types';
import { useNavigate } from 'react-router-dom';

const GlobalAdminDashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await fetch('/api/companies');
        if (response.ok) {
          const data = await response.json();
          setCompanies(data.map((c: any) => ({
            ...c,
            isPaid: c.is_paid,
            registrationDate: c.registration_date,
            selectedModules: c.selected_modules || []
          })));
        } else {
          setError('Failed to load system data');
        }
      } catch (err) {
        setError('Network error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const stats = [
    { 
      label: 'Total Partners', 
      value: companies.length.toString(), 
      icon: Building2, 
      color: 'bg-indigo-500',
      trend: '+12% from last month'
    },
    { 
      label: 'Active Trials', 
      value: companies.filter(c => !c.isPaid).length.toString(), 
      icon: Clock, 
      color: 'bg-amber-500',
      trend: '4 expiring soon'
    },
    { 
      label: 'Subscribed', 
      value: companies.filter(c => c.isPaid).length.toString(), 
      icon: ShieldCheck, 
      color: 'bg-emerald-500',
      trend: '85% conversion rate'
    },
    { 
      label: 'Module Usage', 
      value: '2.4', 
      icon: LayoutGrid, 
      color: 'bg-blue-500',
      trend: 'Avg. modules per client'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Activity className="text-yellow-500 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight uppercase">
            Global <span className="text-yellow-500">System</span> Admin
          </h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs mt-2">
            SafeTech Suite Control Center • Real-time Infrastructure Monitoring
          </p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => navigate('/companies')}
                className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-2xl font-black text-sm transition-all border border-slate-700 flex items-center gap-2"
            >
                <Settings size={18} /> Manage Companies
            </button>
            <button 
                className="bg-yellow-500 hover:bg-yellow-400 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm transition-all shadow-lg shadow-yellow-500/20 flex items-center gap-2"
            >
                <Zap size={18} /> System Status
            </button>
        </div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
      >
        {stats.map((stat, i) => (
          <motion.div 
            key={i}
            variants={itemVariants}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-[2rem] relative overflow-hidden group hover:border-slate-700 transition-all"
          >
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
              <stat.icon size={24} />
            </div>
            <h3 className="text-slate-500 font-black uppercase tracking-widest text-[10px]">{stat.label}</h3>
            <div className="text-3xl font-black mt-1">{stat.value}</div>
            <div className="text-[10px] font-bold text-slate-500 mt-2 flex items-center gap-1">
                <TrendingUp size={12} className="text-emerald-500" /> {stat.trend}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Companies List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center px-4">
            <h2 className="text-xl font-black uppercase tracking-tight">Recent Registrations</h2>
            <button onClick={() => navigate('/companies')} className="text-yellow-500 text-xs font-black uppercase tracking-widest hover:underline flex items-center gap-1">
                View All <ChevronRight size={14} />
            </button>
          </div>
          
          <div className="space-y-3">
            {companies.slice(0, 5).map(company => (
                <div 
                    key={company.id}
                    className="bg-slate-900/30 border border-slate-800/50 p-5 rounded-3xl flex items-center justify-between hover:bg-slate-900/60 transition-all cursor-pointer group"
                    onClick={() => navigate('/companies')}
                >
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-700">
                            {company.logoUrl ? (
                                <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-2" />
                            ) : (
                                <Building2 size={24} className="text-slate-600" />
                            )}
                        </div>
                        <div>
                            <h4 className="font-black text-white group-hover:text-yellow-500 transition-colors">{company.name}</h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                    <Clock size={12} /> {new Date(company.registrationDate || '').toLocaleDateString()}
                                </span>
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${company.isPaid ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-amber-500/10 border-amber-500/50 text-amber-500'}`}>
                                    {company.isPaid ? 'Active Sub' : '14-Day Trial'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-wrap gap-1 justify-end max-w-[200px]">
                            {company.selectedModules?.map(mod => (
                                <span key={mod} className="text-[8px] font-black uppercase bg-slate-800 text-slate-400 px-2 py-1 rounded-md border border-slate-700">
                                    {mod.split(' ')[0]}
                                </span>
                            ))}
                        </div>
                        <div className="text-slate-600 group-hover:text-white transition-colors">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                </div>
            ))}
          </div>
        </div>

        {/* Side Panel: System Health & Quick Actions */}
        <div className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-tight px-4">System Infrastructure</h2>
            
            <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-[2.5rem] space-y-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Global Server Latency</span>
                        <span className="text-emerald-500 font-mono text-xs">24ms</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[95%]"></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Database Uptime</span>
                        <span className="text-emerald-500 font-mono text-xs">99.99%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full w-[100%]"></div>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Storage Capacity</span>
                        <span className="text-yellow-500 font-mono text-xs">42%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-yellow-500 h-full w-[42%]"></div>
                    </div>
                </div>

                <div className="pt-8 border-t border-slate-800 space-y-4">
                    <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                        <ShieldCheck size={18} className="text-yellow-500" /> Security Audit
                    </button>
                    <button className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
                        <Activity size={18} className="text-blue-500" /> Export Global Logs
                    </button>
                </div>

                <div className="p-5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                    <div className="flex items-center gap-3 text-yellow-500 mb-2">
                        <AlertCircle size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Maintenance Window</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                        Next scheduled maintenance is on July 15th at 02:00 AM UTC. Estimated downtime: 15 mins.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalAdminDashboard;
