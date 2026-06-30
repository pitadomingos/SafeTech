
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarPlus, 
  ClipboardList, 
  Mail, 
  Menu, 
  X, 
  UserCog,
  PenTool,
  Users,
  CalendarDays,
  Database,
  Zap,
  FileBarChart,
  Settings,
  Bell,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  ScrollText,
  Globe,
  Wine,
  Sun,
  Moon,
  Monitor,
  Maximize,
  Minimize,
  Presentation,
  FileCode,
  Shield,
  Map,
  Building2,
  BarChart,
  GanttChart,
  FileText,
  Briefcase,
  MessageSquare,
  Send,
  ShieldCheck,
  GitMerge,
  Cloud,
  CloudOff,
  LogOut,
  Rocket,
  Code,
  Compass,
  Heart,
  BadgeCheck,
  Stethoscope,
  GraduationCap
} from 'lucide-react';
import { UserRole, SystemNotification, Site, Company } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { isAlcoholFeatureEnabled } from '../utils/companyUtils';

interface LayoutProps {
  children: React.ReactNode;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  notifications?: SystemNotification[];
  clearNotifications?: () => void;
  sites?: Site[];
  currentSiteId?: string;
  setCurrentSiteId?: (id: string) => void;
  simulatedJobTitle?: string;
  setSimulatedJobTitle?: (title: string) => void;
  simulatedDept?: string;
  setSimulatedDept?: (dept: string) => void;
  companies?: Company[]; 
  activeModule?: 'mobilization' | 'training' | 'safemap' | null;
  onSwitchModule?: (module: 'mobilization' | 'training' | 'safemap' | null) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  userRole, 
  setUserRole, 
  notifications = [], 
  clearNotifications,
  sites = [],
  currentSiteId = 'all',
  setCurrentSiteId,
  simulatedJobTitle = 'General User',
  setSimulatedJobTitle = (_t: string) => {},
  simulatedDept = 'Operations',
  setSimulatedDept = (_d: string) => {},
  companies = [],
  activeModule = null,
  onSwitchModule
}) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const isModuleSelected = (moduleName: string) => {
    if (userRole === UserRole.SYSTEM_ADMIN && !user?.companyId) return true;
    return user?.selectedModules?.includes(moduleName);
  };

  const currentCompany = useMemo(() => {
    if (!companies || companies.length === 0) return null;
    const match = companies.find(c => c.id === user?.companyId || c.name === user?.company);
    return match || companies[0];
  }, [companies, user]);

  const dynamicAppName = useMemo(() => {
      return currentCompany?.appName || t?.common?.vulcan || 'CARS';
  }, [currentCompany, t]);

  const canViewAlcoholDashboard = (): boolean => {
      if (userRole === UserRole.SYSTEM_ADMIN) return true;
      const isFeatureEnabled = currentCompany ? isAlcoholFeatureEnabled(currentCompany.id, companies) : false;
      if (!isFeatureEnabled) return false;
      if (userRole === UserRole.ENTERPRISE_ADMIN) return true;
      const allowedTitles = ['Manager', 'Supervisor', 'Superintendent', 'Director', 'Head'];
      const allowedDepts = ['HSE', 'Operations', 'Security', 'Medical'];
      const safeTitle = user?.jobTitle || simulatedJobTitle || '';
      const safeDept = user?.department || simulatedDept || '';
      return allowedTitles.some(title => safeTitle.includes(title)) && 
             allowedDepts.some(dept => safeDept.includes(dept));
  };

  const showAlcoholLink = canViewAlcoholDashboard();

  useEffect(() => {
    const handleFullScreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

  const cycleTheme = () => {
      if (theme === 'light') setTheme('dark');
      else if (theme === 'dark') setTheme('system');
      else setTheme('light');
  };

  const getThemeIcon = () => {
      switch(theme) {
          case 'light': return <Sun size={18} />;
          case 'dark': return <Moon size={18} />;
          case 'system': return <Monitor size={18} />;
      }
  };

  let allNavItems: any[] = [];
  if (activeModule === 'mobilization') {
    allNavItems = [
      { path: '/recruitment', label: t.nav.mobilizationFlow, icon: Users, visible: isModuleSelected('Onboarding & Mobilization') },
      { path: '/hr-portal', label: t.nav.hrPortal, icon: FileText, visible: isModuleSelected('Onboarding & Mobilization') },
      { path: '/security-portal', label: t.nav.securityPortal, icon: Shield, visible: isModuleSelected('Onboarding & Mobilization') },
      { path: '/clinic-portal', label: t.nav.clinicPortal, icon: Heart, visible: isModuleSelected('Onboarding & Mobilization') },
      { path: '/safety-inspections', label: t.nav.safetyInspections, icon: ClipboardList, visible: isModuleSelected('Onboarding & Mobilization') },
      { path: '/messages', label: t.nav.communications, icon: Send, visible: isModuleSelected('Onboarding & Mobilization') },
      { path: '/manuals', label: t.nav.manuals, icon: BookOpen, visible: true },
    ];
  } else if (activeModule === 'safemap') {
    allNavItems = [
      { path: '/safemap/analytics', label: 'Dashboard', icon: LayoutDashboard, visible: isModuleSelected('SafeSite') },
      { path: '/safemap/global', label: 'Global Map', icon: Map, visible: isModuleSelected('SafeSite') },
      { path: '/safemap/new', label: 'New Condition', icon: ClipboardList, visible: isModuleSelected('SafeSite') },
      { path: '/safemap/report', label: 'Reporting Table', icon: ScrollText, visible: isModuleSelected('SafeSite') },
      { path: '/safemap/bulletin', label: 'Safety Bulletin', icon: MessageSquare, visible: isModuleSelected('SafeSite') },
      { path: '/safemap/induction', label: 'Site Induction', icon: GraduationCap, visible: isModuleSelected('SafeSite') },
    ];
  } else {
    allNavItems = [
      { path: '/system-blueprint', label: 'System Blueprint', icon: Compass, visible: userRole === UserRole.SYSTEM_ADMIN && !user?.companyId },
      { path: '/system-admin', label: 'System Control', icon: Zap, visible: userRole === UserRole.SYSTEM_ADMIN && !user?.companyId },
      { path: '/', label: t.nav.dashboard, icon: LayoutDashboard, visible: isModuleSelected('Training & Certification') && ![UserRole.USER, UserRole.RAC_TRAINER].includes(userRole) },
      { path: '/booking', label: t.nav.booking, icon: CalendarPlus, visible: isModuleSelected('Training & Certification') && userRole !== UserRole.RAC_TRAINER && userRole !== UserRole.ENTERPRISE_ADMIN && userRole !== UserRole.SITE_ADMIN },
      { path: '/results', label: t.nav.records, icon: ClipboardList, visible: isModuleSelected('Training & Certification') && userRole !== UserRole.RAC_TRAINER && userRole !== UserRole.ENTERPRISE_ADMIN },
      { path: '/bookings', label: t.nav.bookings, icon: ScrollText, visible: isModuleSelected('Training & Certification') && [UserRole.SYSTEM_ADMIN, UserRole.SITE_ADMIN, UserRole.ENTERPRISE_ADMIN, UserRole.RAC_ADMIN].includes(userRole) },
      { path: '/database', label: t.nav.database, icon: Database, visible: isModuleSelected('Training & Certification') && userRole !== UserRole.USER && userRole !== UserRole.RAC_TRAINER },
      { path: '/integration', label: t.nav.integration, icon: GitMerge, visible: isModuleSelected('SafeSite') && [UserRole.SYSTEM_ADMIN, UserRole.ENTERPRISE_ADMIN].includes(userRole) },
      { path: '/reports', label: t.nav.reports, icon: FileBarChart, visible: isModuleSelected('Training & Certification') && [UserRole.SYSTEM_ADMIN, UserRole.ENTERPRISE_ADMIN, UserRole.SITE_ADMIN].includes(userRole) },
      { path: '/enterprise-dashboard', label: t.nav.enterpriseDashboard, icon: BarChart, visible: isModuleSelected('Training & Certification') && [UserRole.SYSTEM_ADMIN, UserRole.ENTERPRISE_ADMIN].includes(userRole) },
      { path: '/executive-dashboard', label: 'Executive Dashboard', icon: Presentation, visible: isModuleSelected('SafeSite') && [UserRole.SYSTEM_ADMIN, UserRole.ENTERPRISE_ADMIN, UserRole.SITE_ADMIN, UserRole.DEPT_ADMIN].includes(userRole) },
      { path: '/alcohol-control', label: t.nav.alcohol, icon: Wine, visible: isModuleSelected('SafeSite') && showAlcoholLink },
      { path: '/request-cards', label: t.nav.requestCards, icon: Mail, visible: isModuleSelected('Training & Certification') && userRole !== UserRole.ENTERPRISE_ADMIN && userRole !== UserRole.RAC_TRAINER },
      { path: '/messages', label: t.nav.communications, icon: Send, visible: userRole === UserRole.SYSTEM_ADMIN },
      { path: '/schedule', label: t.nav.schedule, icon: CalendarDays, visible: isModuleSelected('Training & Certification') && [UserRole.SYSTEM_ADMIN, UserRole.SITE_ADMIN].includes(userRole) },
      { path: '/site-governance', label: t.nav.siteGovernance, icon: GanttChart, visible: isModuleSelected('SafeSite') && [UserRole.SYSTEM_ADMIN, UserRole.ENTERPRISE_ADMIN].includes(userRole) },
      { path: '/trainer-input', label: t.nav.trainerInput, icon: PenTool, visible: isModuleSelected('Training & Certification') && [UserRole.SYSTEM_ADMIN, UserRole.RAC_TRAINER].includes(userRole) },
      { path: '/users', label: t.nav.users, icon: Users, visible: userRole === UserRole.SYSTEM_ADMIN },
      { path: '/companies', label: 'Companies', icon: Building2, visible: userRole === UserRole.SYSTEM_ADMIN },
      { path: '/settings', label: t.nav.settings, icon: Settings, visible: [UserRole.SYSTEM_ADMIN, UserRole.ENTERPRISE_ADMIN, UserRole.SITE_ADMIN].includes(userRole) },
      { path: '/tech-docs', label: t.nav.techDocs, icon: FileCode, visible: [UserRole.SYSTEM_ADMIN, UserRole.ENTERPRISE_ADMIN].includes(userRole) },
      { path: '/logs', label: t.nav.logs, icon: ScrollText, visible: [UserRole.SYSTEM_ADMIN, UserRole.ENTERPRISE_ADMIN].includes(userRole) },
      { path: '/manuals', label: t.nav.manuals, icon: BookOpen, visible: true },
    ];
  }

  const navItems = allNavItems.filter(item => item.visible);
  const currentNavItem = navItems.find(i => i.path === location.pathname);
  
  let pageTitle = dynamicAppName;
  if (currentNavItem && currentNavItem.label) {
    pageTitle = String(currentNavItem.label);
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden transition-colors duration-200">
      <aside 
        className={`no-print fixed inset-y-0 left-0 z-50 bg-slate-900 dark:bg-slate-950 text-white transform transition-all duration-300 ease-in-out flex flex-col ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 ${isCollapsed ? 'w-20' : 'w-64'} border-r border-slate-700 dark:border-slate-800`}
      >
        <div className={`flex items-center h-16 border-b border-slate-700 dark:border-slate-800 ${isCollapsed ? 'justify-center p-0' : 'justify-between p-4'}`}>
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 shadow-inner overflow-hidden">
              {user?.companyLogo || currentCompany?.safetyLogoUrl ? (
                  <img src={user?.companyLogo || currentCompany?.safetyLogoUrl} alt="Company Logo" className="w-8 h-8 object-contain" />
              ) : (
                  <ShieldCheck size={24} className="text-yellow-500" />
              )}
            </div>
            {!isCollapsed && <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">{dynamicAppName}</span>}
          </div>
          <button onClick={() => setSidebarOpen(false)} title="Close sidebar" className="md:hidden text-gray-400 hover:text-white"><X size={24} /></button>
          <button onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} className="hidden md:flex bg-slate-800 dark:bg-slate-900 text-gray-400 hover:text-white rounded p-1">{isCollapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button>
        </div>

        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} title={isCollapsed ? String(item.label) : ''}
                className={`flex items-center rounded-lg transition-colors ${isActive ? 'bg-yellow-500 text-slate-900 font-medium' : 'text-gray-300 hover:bg-slate-800 hover:text-white'} ${isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3'}`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="truncate">{String(item.label)}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="w-full p-4 border-t border-slate-700 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 space-y-3">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-yellow-500 font-black">{user?.name.charAt(0) || 'U'}</div>
                {!isCollapsed && (
                    <div className="flex-1 overflow-hidden">
                        <div className="text-sm font-bold text-white truncate">{user?.name || 'Guest User'}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{user?.role || 'Guest'}</div>
                    </div>
                )}
                {!isCollapsed && <button onClick={handleLogout} title="Log out" className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors"><LogOut size={18} /></button>}
            </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
        <header className="no-print h-16 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-between px-4 md:px-6 z-10 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
             <button onClick={() => setSidebarOpen(true)} title="Open sidebar" className="md:hidden text-slate-600 dark:text-slate-300"><Menu size={24} /></button>
             
             {/* PREVIOUS / NEXT NAVIGATION BUTTONS */}
             <div className="hidden md:flex items-center gap-2 mr-4 border-r border-gray-200 dark:border-slate-700 pr-4">
                 <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-500 transition-all active:scale-90 group"
                    title="Previous Page"
                 >
                    <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                 </button>
                 <button 
                    onClick={() => navigate(1)} 
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-500 transition-all active:scale-90 group"
                    title="Next Page"
                 >
                    <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                 </button>
             </div>

             <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-800 dark:text-white truncate">{pageTitle}</h1>
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                  activeModule === 'mobilization' 
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                  : isSupabaseConfigured 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200 animate-pulse' 
                  : 'bg-orange-50 text-orange-600 border-orange-200'
                }`}>
                    {activeModule === 'mobilization' ? <Users size={12} /> : isSupabaseConfigured ? <Cloud size={12} /> : <CloudOff size={12} />}
                    {activeModule === 'mobilization' ? 'Mobilization' : isSupabaseConfigured ? 'Live Cloud' : 'Local Mock'}
                </div>
             </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Quick Module Switcher */}
            {onSwitchModule && (
                <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-700/50 rounded-lg p-1 mr-2 border border-slate-200 dark:border-slate-700">
                    {isModuleSelected('Onboarding & Mobilization') && (
                        <button 
                            onClick={() => onSwitchModule('mobilization')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${activeModule === 'mobilization' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            title="Jump to Onboarding"
                        >
                            <Users size={14} /> Onboarding
                        </button>
                    )}
                    {isModuleSelected('Training & Certification') && (
                        <button 
                            onClick={() => onSwitchModule('training')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${activeModule === 'training' ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            title="Jump to Training"
                        >
                            <GraduationCap size={14} /> Training
                        </button>
                    )}
                    {isModuleSelected('SafeSite') && (
                        <button 
                            onClick={() => onSwitchModule('safemap')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${activeModule === 'safemap' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                            title="Jump to SafeSite"
                        >
                            <ShieldCheck size={14} /> SafeSite
                        </button>
                    )}
                </div>
            )}

            {setCurrentSiteId && (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.ENTERPRISE_ADMIN) && (
                <div className="hidden md:flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 rounded-lg px-2 py-1">
                    <select value={currentSiteId} onChange={(e) => setCurrentSiteId(e.target.value)}
                        aria-label="Select site"
                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                    >
                        <option value="all">{t.common.enterpriseView}</option>
                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            )}
            <button onClick={() => setLanguage(language === 'en' ? 'pt' : 'en')} className="p-2 rounded-full text-slate-500 dark:text-slate-400 flex items-center gap-1"><Globe size={18} /><span className="text-xs font-bold uppercase">{language}</span></button>
            <button onClick={() => cycleTheme()} className="p-2 rounded-full text-slate-500 dark:text-slate-400">{getThemeIcon()}</button>
            <div className="relative">
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-slate-900 font-black shadow-lg hover:scale-110 transition-transform">{user?.name.charAt(0) || 'U'}</button>
                {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-2 z-50 animate-fade-in-up">
                        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                            <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated as</div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{user?.name}</div>
                        </div>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"><LogOut size={16} /> Sign Out</button>
                    </div>
                )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100 dark:bg-gray-900 relative">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
