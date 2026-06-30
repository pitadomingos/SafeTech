import React from 'react';
import { Shield, Users, Award, ChevronRight, Sparkles, LogOut, ArrowRightLeft, Map, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface PortalGatewayProps {
    onSelectModule: (module: 'mobilization' | 'training' | 'safemap') => void;
    activeModule: 'mobilization' | 'training' | 'safemap' | null;
}

const PortalGateway: React.FC<PortalGatewayProps> = ({ onSelectModule, activeModule }) => {
    const { user, logout } = useAuth();
    const { t } = useLanguage();

    const isModuleSelected = (moduleName: string) => {
        // Super Admin without a company sees everything
        if (user?.role === 'System Admin' && !user?.companyId) return true;
        // Otherwise respect selected modules
        return user?.selectedModules?.includes(moduleName);
    };

    // Auto-select if only one module is available
    React.useEffect(() => {
        const availableModules = [
            { name: 'Onboarding & Mobilization', id: 'mobilization' },
            { name: 'Training & Certification', id: 'training' },
            { name: 'SafeSite', id: 'safemap' }
        ].filter(m => isModuleSelected(m.name));

        if (availableModules.length === 1 && activeModule === null) {
            onSelectModule(availableModules[0].id as any);
        }
    }, [user?.selectedModules, activeModule]);

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 font-sans relative overflow-hidden text-white p-6">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#1e1b4b_0%,#020617_80%)]"></div>
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full animate-pulse-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[150px] rounded-full animate-pulse-slow"></div>
            <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[length:40px_40px]"></div>

            {/* Header / Brand */}
            <div className="relative z-10 text-center mb-12 max-w-2xl animate-fade-in-up">
                <div className="inline-block relative mb-4">
                    <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
                    <div className="relative h-16 w-16 bg-slate-900 rounded-2xl border-2 border-slate-800 flex items-center justify-center shadow-2xl">
                        <Shield size={32} className="text-indigo-400" />
                    </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-4 uppercase">
                    ZeroGate <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-amber-400">COMMAND PORTAL</span>
                </h1>
                <p className="text-slate-400 text-sm md:text-base font-medium tracking-wide uppercase tracking-[0.15em] px-4">
                    Select the operational environment to continue
                </p>
            </div>

            {/* Three Modules Grid */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl px-4 animate-fade-in-up [animation-delay:100ms]">
                
                {/* Module 1: Workforce Mobilization */}
                {isModuleSelected('Onboarding & Mobilization') && (
                    <div 
                        onClick={() => onSelectModule('mobilization')}
                        className="group bg-slate-900/40 backdrop-blur-xl hover:bg-slate-900/70 border-2 border-slate-800/80 hover:border-indigo-500/50 rounded-[2.5rem] p-8 shadow-2xl transition-all cursor-pointer transform hover:-translate-y-2 flex flex-col justify-between h-[360px] relative overflow-hidden"
                    >
                        {/* Visual Hover Glow */}
                        <div className="absolute -right-16 -top-16 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-all"></div>
                        
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-indigo-950/50 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 shadow-inner group-hover:scale-110 transition-transform">
                                <Users size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                                    Onboarding & Mobilization
                                </h3>
                                <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest text-indigo-400/80">
                                    Recruitment Suite
                                </p>
                                <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">
                                    Manage the recruit pipeline from requisition to ID verification, temporary access, clinical health checks, site safety induction, and AM confirmation.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/60 flex-wrap gap-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0 whitespace-nowrap">
                                Access Portal <ChevronRight size={14} />
                            </span>
                            <span className="text-[10px] font-black uppercase bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
                                Active Pipeline
                            </span>
                        </div>
                    </div>
                )}

                {/* Module 2: CARS Training System */}
                {isModuleSelected('Training & Certification') && (
                    <div 
                        onClick={() => onSelectModule('training')}
                        className="group bg-slate-900/40 backdrop-blur-xl hover:bg-slate-900/70 border-2 border-slate-800/80 hover:border-amber-500/50 rounded-[2.5rem] p-8 shadow-2xl transition-all cursor-pointer transform hover:-translate-y-2 flex flex-col justify-between h-[360px] relative overflow-hidden"
                    >
                        {/* Visual Hover Glow */}
                        <div className="absolute -right-16 -top-16 w-40 h-40 bg-amber-500/5 rounded-full blur-3xl group-hover:bg-amber-500/10 transition-all"></div>
                        
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-amber-950/50 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 shadow-inner group-hover:scale-110 transition-transform">
                                <Award size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase text-white tracking-tight group-hover:text-amber-300 transition-colors">
                                    Training & Certifications
                                </h3>
                                <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest text-amber-400/80">
                                    ZeroGate System
                                </p>
                                <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">
                                    Schedule training sessions, track student enrollments, input test scores, verify RAC cards, run compliance reporting, and configure site governance criteria.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/60 flex-wrap gap-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0 whitespace-nowrap">
                                Access Portal <ChevronRight size={14} />
                            </span>
                            <span className="text-[10px] font-black uppercase bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
                                Active Training
                            </span>
                        </div>
                    </div>
                )}

                {/* Module 3: SafeSite / SafeMap System */}
                {isModuleSelected('SafeSite') && (
                    <div 
                        onClick={() => onSelectModule('safemap')}
                        className="group bg-slate-900/40 backdrop-blur-xl hover:bg-slate-900/70 border-2 border-slate-800/80 hover:border-emerald-500/50 rounded-[2.5rem] p-8 shadow-2xl transition-all cursor-pointer transform hover:-translate-y-2 flex flex-col justify-between h-[360px] relative overflow-hidden"
                    >
                        {/* Visual Hover Glow */}
                        <div className="absolute -right-16 -top-16 w-40 h-40 bg-emerald-500/5 rounded-full blur-3xl group-hover:bg-emerald-500/10 transition-all"></div>
                        
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-emerald-950/50 border border-emerald-500/30 rounded-2xl flex items-center justify-center text-emerald-400 shadow-inner group-hover:scale-110 transition-transform">
                                <Map size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase text-white tracking-tight group-hover:text-emerald-300 transition-colors">
                                    SafeSite
                                </h3>
                                <p className="text-slate-400 text-xs mt-1 font-bold uppercase tracking-widest text-emerald-400/80">
                                    Incident Management
                                </p>
                                <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">
                                    Intelligent mapping of unsafe conditions. Report incidents, assign responsible teams, process workflows, and track resolutions.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/60 flex-wrap gap-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0 whitespace-nowrap">
                                Access Portal <ChevronRight size={14} />
                            </span>
                            <span className="text-[10px] font-black uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
                                Active Monitoring
                            </span>
                        </div>
                    </div>
                )}

                {/* Module 4: Global System Admin (Only for Pita without a company) */}
                {user?.role === 'System Admin' && !user?.companyId && (
                    <div 
                        onClick={() => {
                            onSelectModule('training');
                            window.location.hash = '#/system-admin';
                        }}
                        className="group bg-yellow-500/5 backdrop-blur-xl hover:bg-yellow-500/10 border-2 border-yellow-500/30 hover:border-yellow-500 rounded-[2.5rem] p-8 shadow-2xl transition-all cursor-pointer transform hover:-translate-y-2 flex flex-col justify-between h-[360px] relative overflow-hidden"
                    >
                        {/* Visual Hover Glow */}
                        <div className="absolute -right-16 -top-16 w-40 h-40 bg-yellow-500/5 rounded-full blur-3xl group-hover:bg-yellow-500/10 transition-all"></div>
                        
                        <div className="space-y-6">
                            <div className="w-14 h-14 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl flex items-center justify-center text-yellow-500 shadow-inner group-hover:scale-110 transition-transform">
                                <Zap size={28} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase text-white tracking-tight group-hover:text-yellow-400 transition-colors">
                                    Global Admin
                                </h3>
                                <p className="text-yellow-500/60 text-xs mt-1 font-bold uppercase tracking-widest">
                                    System Control Center
                                </p>
                                <p className="text-slate-400 text-sm mt-3 font-medium leading-relaxed">
                                    Manage global company registrations, infrastructure health, trial conversions, and high-level system logs.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-yellow-500/20 flex-wrap gap-y-2">
                            <span className="text-xs font-black uppercase tracking-widest text-yellow-500 group-hover:translate-x-1 transition-transform flex items-center gap-1 shrink-0 whitespace-nowrap">
                                Access Control Center <ChevronRight size={14} />
                            </span>
                            <span className="text-[10px] font-black uppercase bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full shrink-0 whitespace-nowrap">
                                Root Access
                            </span>
                        </div>
                    </div>
                )}

            </div>

            {/* Presentation Page Link */}
            <div className="relative z-10 mt-10 animate-fade-in-up [animation-delay:150ms]">
                <a 
                    href="#/presentation" 
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900 rounded-full text-xs font-bold uppercase tracking-widest text-slate-300 hover:text-white transition-all shadow-lg active:scale-95 hover:scale-105"
                >
                    <Sparkles size={14} className="text-yellow-500 animate-pulse" />
                    <span>View ZeroGate Strategy Presentation</span>
                </a>
            </div>

            {/* Portal Footer / User Info */}
            <div className="relative z-10 mt-12 flex flex-col items-center gap-4 animate-fade-in-up [animation-delay:200ms] font-mono text-xs text-slate-500">
                <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl px-5 py-3">
                    <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                        {user?.name.charAt(0) || 'U'}
                    </div>
                    <span>Logged in as: <strong className="text-slate-300">{user?.name}</strong> ({user?.role})</span>
                    <button onClick={logout} className="ml-4 p-1 text-slate-400 hover:text-red-400 transition-colors" title="Log Out">
                        <LogOut size={16} />
                    </button>
                </div>
                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    ZeroGate Platform v3.2.1-Live
                </div>
            </div>
        </div>
    );
};

export default PortalGateway;
