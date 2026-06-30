import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { UserRole, User } from '../types';
import { UserCheck, X, Sliders, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PresentationRoleSwitcher: React.FC = () => {
    const { user, login, logout } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [isActive, setIsActive] = useState(false);

    // Keep active state synchronized with local storage flag
    useEffect(() => {
        const checkActive = () => {
            const active = localStorage.getItem('presentation_active') === 'true';
            setIsActive(active);
        };
        checkActive();
        
        // Listen to storage events to keep in sync if changed across tabs
        window.addEventListener('storage', checkActive);
        
        // Check frequently in case page navigations change state internally
        const interval = setInterval(checkActive, 1000);
        
        return () => {
            window.removeEventListener('storage', checkActive);
            clearInterval(interval);
        };
    }, []);

    if (!isActive) return null;

    const sw = t.proposal.switcher;

    // Filter to the key 6 demo users specified in the strategy
    const switcherUsers: User[] = [
        // Pita (System Admin)
        {
            id: 1337,
            name: "Pita Domingos",
            email: "p.domingos@vulcan.com",
            role: UserRole.SYSTEM_ADMIN,
            status: 'Active',
            company: 'Vulcan Resources Mozambique',
            jobTitle: 'Lead System Architect',
            siteId: 'all'
        },
        // Carlos (Enterprise Admin)
        {
            id: 2,
            name: 'Carlos Macuácua',
            email: 'c.macuacua@vulcan.com',
            role: UserRole.ENTERPRISE_ADMIN,
            status: 'Active' as const,
            company: 'Vulcan Resources Mozambique',
            jobTitle: 'HSE Director',
            siteId: 'all'
        },
        // Ana Bila (Site Admin)
        {
            id: 3,
            name: 'Ana Bila',
            email: 'a.bila@vulcan.com',
            role: UserRole.SITE_ADMIN,
            status: 'Active' as const,
            company: 'Vulcan Resources Mozambique',
            jobTitle: 'Site Safety Manager',
            siteId: 's-moatize'
        },
        // Hélio Tembe (Dept Admin / AM)
        {
            id: 6,
            name: 'Hélio Tembe',
            email: 'h.tembe@vulcan.com',
            role: UserRole.DEPT_ADMIN,
            status: 'Active' as const,
            company: 'Vulcan Resources Mozambique',
            jobTitle: 'Mine Ops Supervisor',
            siteId: 's-moatize'
        },
        // António Sitoe (Trainer)
        {
            id: 7,
            name: 'António Sitoe',
            email: 'a.sitoe@vulcan.com',
            role: UserRole.RAC_TRAINER,
            status: 'Active' as const,
            company: 'Vulcan Resources Mozambique',
            jobTitle: 'Senior RAC Trainer',
            siteId: 's-moatize'
        },
        // Jessica Bata (Safety Officer / User)
        {
            id: 9,
            name: 'Jessica Bata',
            email: 'jessica@vulcan.com',
            role: UserRole.USER,
            status: 'Active' as const,
            company: 'Vulcan Resources Mozambique',
            jobTitle: 'Safety Officer',
            siteId: 's-nacala'
        }
    ];

    const handleSwitch = (selectedUser: User) => {
        login(selectedUser);
        setIsOpen(false);
        // Force refresh data in local views or trigger alert
        const toast = document.createElement('div');
        toast.className = "fixed top-20 right-4 z-[9999] bg-gradient-to-r from-emerald-600 to-indigo-600 text-white font-mono px-6 py-3 rounded-2xl shadow-2xl border border-emerald-400/20 text-xs font-black uppercase tracking-widest animate-bounce";
        toast.innerText = `${sw.switchedTo}: ${selectedUser.name} (${selectedUser.role})`;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    };

    const handleExit = () => {
        localStorage.removeItem('presentation_active');
        setIsActive(false);
        
        const preUserStr = localStorage.getItem('pre_presentation_user');
        if (preUserStr) {
            try {
                login(JSON.parse(preUserStr));
            } catch {
                login(switcherUsers[0]);
            }
            localStorage.removeItem('pre_presentation_user');
        } else {
            login(switcherUsers[0]);
        }
        
        navigate('/');
    };

    return (
        <div className="no-print fixed bottom-6 right-6 z-[999] font-sans">
            {/* Floating Bubble */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-2 border-indigo-500/50 hover:border-indigo-400 text-white px-4 py-3.5 rounded-full shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_40px_rgba(99,102,241,0.5)] transition-all hover:scale-105 active:scale-95 group"
                title="Open Presentation Role Switcher"
            >
                <div className="relative">
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Sliders size={18} className="text-indigo-400 group-hover:rotate-45 transition-transform duration-300" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] pr-1">{sw.demoSwitcher}</span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute bottom-16 right-0 w-80 bg-slate-950/95 border-2 border-indigo-500/30 rounded-[2rem] shadow-2xl backdrop-blur-xl p-5 overflow-hidden animate-fade-in-up text-left ring-1 ring-white/10">
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-white/10 pb-3.5 mb-3.5">
                        <div>
                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">{sw.console}</span>
                            <h3 className="text-sm font-black text-white leading-tight uppercase">{sw.activePersona}</h3>
                        </div>
                        <button 
                            onClick={() => setIsOpen(false)}
                            title="Close"
                            className="p-1.5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Current User Info */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-3 mb-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black"><UserCheck size={20} /></div>
                        <div className="overflow-hidden">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">{sw.activeProfile}</span>
                            <div className="text-xs font-bold text-white truncate leading-normal">{user?.name || sw.guestUser}</div>
                            <div className="text-[8px] font-black text-emerald-400 uppercase tracking-wider leading-none mt-0.5">{user?.role || sw.noRole}</div>
                        </div>
                    </div>

                    {/* Switchable Users List */}
                    <div className="space-y-1.5 max-h-60 overflow-y-auto scrollbar-hide mb-4">
                        {switcherUsers.map((u) => {
                            const isCurrent = u.name === user?.name;
                            return (
                                <button
                                    key={u.id}
                                    onClick={() => handleSwitch(u)}
                                    disabled={isCurrent}
                                    className={`w-full text-left p-2.5 rounded-xl flex items-center gap-3 transition-all ${
                                        isCurrent 
                                        ? 'bg-slate-900 border border-indigo-500/20 opacity-50 cursor-default' 
                                        : 'hover:bg-white/5 border border-transparent hover:border-slate-800'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                                        isCurrent 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-slate-900 text-slate-400 group-hover:text-white'
                                    }`}>
                                        {u.name.charAt(0)}
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                        <div className="text-xs font-bold text-slate-200 truncate">{u.name}</div>
                                        <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{u.role}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-white/10 pt-4 mt-1">
                        <button
                            onClick={() => {
                                navigate('/presentation');
                                setIsOpen(false);
                            }}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                        >
                            <Play size={12} />
                            <span>{sw.slidesDeck}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PresentationRoleSwitcher;
