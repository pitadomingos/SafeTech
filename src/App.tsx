
import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';

// Lazy load page components for route-based code-splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const DatabasePage = lazy(() => import('./pages/DatabasePage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const BookingForm = lazy(() => import('./pages/BookingForm'));
const CardsPage = lazy(() => import('./pages/CardsPage'));
const VerificationPage = lazy(() => import('./pages/VerificationPage'));
const IntegrationHub = lazy(() => import('./pages/IntegrationHub'));
const PresentationPage = lazy(() => import('./pages/PresentationPage'));
const TrainerInputPage = lazy(() => import('./pages/TrainerInputPage'));
const RequestCardsPage = lazy(() => import('./pages/RequestCardsPage'));
const MessageLogPage = lazy(() => import('./pages/MessageLogPage'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const ScheduleTraining = lazy(() => import('./pages/ScheduleTraining'));
const SiteGovernancePage = lazy(() => import('./pages/SiteGovernancePage'));
const LogsPage = lazy(() => import('./pages/LogsPage'));
const UserManualsPage = lazy(() => import('./pages/UserManualsPage'));
const TechnicalDocs = lazy(() => import('./pages/TechnicalDocs'));
const SystemTechnicalManual = lazy(() => import('./pages/SystemTechnicalManual'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CompanyManagement = lazy(() => import('./pages/CompanyManagement'));
const GlobalAdminDashboard = lazy(() => import('./pages/GlobalAdminDashboard'));
const ResultsPage = lazy(() => import('./pages/ResultsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AlcoholIntegration = lazy(() => import('./pages/AlcoholIntegration'));
const EnterpriseDashboard = lazy(() => import('./pages/EnterpriseDashboard'));
const ExecutiveDashboard = lazy(() => import('./pages/ExecutiveDashboard'));
const MobilizationDashboard = lazy(() => import('./pages/MobilizationDashboard'));
const PortalGateway = lazy(() => import('./pages/PortalGateway'));
const SubcontractorPage = lazy(() => import('./pages/SubcontractorPage'));
const SafetyInspectionPage = lazy(() => import('./pages/SafetyInspectionPage').then(m => ({ default: m.SafetyInspectionPage })));
const HRPortalPage = lazy(() => import('./pages/HRPortalPage').then(m => ({ default: m.HRPortalPage })));
const SecurityPortalPage = lazy(() => import('./pages/SecurityPortalPage').then(m => ({ default: m.SecurityPortalPage })));
const ClinicPortalPage = lazy(() => import('./pages/ClinicPortalPage').then(m => ({ default: m.ClinicPortalPage })));
const BookingsPage = lazy(() => import('./pages/BookingsPage').then(m => ({ default: m.BookingsPage })));

const SafeMapNew = lazy(() => import('./pages/safemap/NewConditionForm'));
const SafeMapGlobal = lazy(() => import('./pages/safemap/GlobalMapDashboard'));
const SafeMapReport = lazy(() => import('./pages/safemap/ReportingTable'));
const SafeMapAnalytics = lazy(() => import('./pages/safemap/AnalyticsDashboard'));
const SafeMapBulletin = lazy(() => import('./pages/safemap/SafetyBulletin'));
const SafeMapInduction = lazy(() => import('./pages/safemap/SiteInduction'));

import GeminiAdvisor from './components/GeminiAdvisor';
import PresentationRoleSwitcher from './components/PresentationRoleSwitcher';
import { AdvisorProvider } from './contexts/AdvisorContext';
import { MessageProvider } from './contexts/MessageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useLanguage } from './contexts/LanguageContext';
import { ToastProvider } from './contexts/ToastContext';
import { db } from './services/databaseService';
import { isSupabaseConfigured, supabase } from './services/supabaseClient';
import { UserRole, Booking, EmployeeRequirement, TrainingSession, RacDef, Site, Company, SystemNotification, Employee, User, Room, Trainer, BookingStatus, UnsafeCondition } from './types';
import { v4 as uuidv4 } from 'uuid';
import { PageErrorBoundary } from './components/PageErrorBoundary';
import { Loader2, Database, AlertCircle, CheckCircle2, Cloud, RefreshCw } from 'lucide-react';

const stringifyError = (err: any): string => {
    if (!err) return 'Unknown Error';
    if (typeof err === 'string') return err;
    if (err.message && typeof err.message === 'string') return err.message;
    if (err.details && typeof err.details === 'string') return err.details;
    if (err.error_description && typeof err.error_description === 'string') return err.error_description;
    try {
        const str = JSON.stringify(err);
        if (str !== '{}') return str;
    } catch (e) {}
    return String(err);
};

const RoleBasedHome: React.FC<{ 
    userRole: UserRole;
    dashboardProps: any;
}> = ({ userRole, dashboardProps }) => {
    if (userRole === UserRole.SYSTEM_ADMIN || userRole === UserRole.ENTERPRISE_ADMIN || userRole === UserRole.SITE_ADMIN) {
        return <Dashboard {...dashboardProps} />;
    }
    if (userRole === UserRole.RAC_TRAINER) {
        return <Navigate to="/trainer-input" replace />;
    }
    if (userRole === UserRole.USER) {
        return <Navigate to="/request-cards" replace />;
    }
    return <Dashboard {...dashboardProps} />;
};

const PageLoadingFallback: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 size={80} className="text-blue-500 animate-spin" />
        <h2 className="text-2xl font-black uppercase mt-8 animate-pulse text-slate-200">{t.app.loadingModule}</h2>
        <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">{t.app.fetchingResources}</p>
    </div>
  );
};

const SafeRoutesWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // We import useLocation dynamically or pass it. We are already inside Router here, so we can't use useLocation at the App level easily, but SafeRoutesWrapper is inside Router!
    // However, AppContent is inside Router? No, Router is rendered inside AppContent.
    // Wait, AppContent renders <Router>. So we need to put SafeRoutesWrapper INSIDE the Router.
    const location = useLocation();
    return (
        <PageErrorBoundary key={location.pathname}>
            {children}
        </PageErrorBoundary>
    );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  
  // Track hash changes so gateway can detect #/presentation navigation
  const [currentHash, setCurrentHash] = useState(window.location.hash);
  useEffect(() => {
    const onHashChange = () => setCurrentHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  
  const [activeModule, setActiveModule] = useState<'mobilization' | 'training' | 'safemap' | null>(() => {
    return localStorage.getItem('cars_active_module') as any || null;
  });

  const handleSelectModule = (mod: 'mobilization' | 'training' | 'safemap' | null) => {
    setActiveModule(mod);
    if (mod) {
        localStorage.setItem('cars_active_module', mod);
        if (mod === 'mobilization') {
            window.location.hash = '#/recruitment';
        } else if (mod === 'safemap') {
            window.location.hash = '#/safemap/analytics';
        } else {
            window.location.hash = '#/';
        }
    } else {
        localStorage.removeItem('cars_active_module');
        window.location.hash = '#/';
    }
  };

  // Auto-select module if only one is available for the company
  useEffect(() => {
    if (isAuthenticated && user && activeModule === null) {
        const isModuleSelected = (moduleName: string) => {
            if (user.role === UserRole.SYSTEM_ADMIN && !user.companyId) return true;
            return user.selectedModules?.includes(moduleName);
        };

        const availableModules = [
            { name: 'Onboarding & Mobilization', id: 'mobilization' },
            { name: 'Training & Certification', id: 'training' },
            { name: 'SafeSite', id: 'safemap' }
        ].filter(m => isModuleSelected(m.name));

        if (availableModules.length === 1) {
            handleSelectModule(availableModules[0].id as any);
        }
    }
  }, [isAuthenticated, user, activeModule]);

  const availableModulesCount = useMemo(() => {
    if (!user) return 0;
    const isModuleSelected = (moduleName: string) => {
        if (user.role === UserRole.SYSTEM_ADMIN && !user.companyId) return true;
        return user.selectedModules?.includes(moduleName);
    };
    return [
        'Onboarding & Mobilization',
        'Training & Certification',
        'SafeSite'
    ].filter(isModuleSelected).length;
  }, [user]);
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [requirements, setRequirements] = useState<EmployeeRequirement[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [racDefinitions, setRacDefinitions] = useState<RacDef[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [currentSiteId, setCurrentSiteId] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => !u.appModule || u.appModule === 'both' || u.appModule === activeModule);
  }, [users, activeModule]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => !e.appModule || e.appModule === 'both' || e.appModule === activeModule);
  }, [employees, activeModule]);

  const [dbHealth, setDbHealth] = useState<{table: string, status: 'ok'|'missing'}[]>([]);
  const [unsafeConditions, setUnsafeConditions] = useState<UnsafeCondition[]>([]);

  // SafeMap specific hook
  const refreshSafeMapData = async () => {
    try {
      const conditions = await db.getUnsafeConditions();
      setUnsafeConditions(conditions);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshData = async () => {
    try {
      // Sync from shared local database server first
      await db.syncFromLocalServer();

      const [c, s, sess, b, req, uList, racs, rms, trns, emps] = await Promise.all([
          db.getCompanies(),
          db.getSites(),
          db.getSessions(),
          db.getBookings(),
          db.getRequirements(),
          db.getUsers(),
          db.getRacDefinitions(),
          db.getRooms(),
          db.getTrainers(),
          db.getEmployees()
      ]);

      setCompanies(c);
      setSites(s);
      setSessions(sess);
      setBookings(b);
      setRequirements(req);
      setRacDefinitions(racs);
      setRooms(rms);
      setTrainers(trns);
      setUsers(uList);
      setEmployees(emps);
      
      await refreshSafeMapData();
    } catch (err) {
      console.error("Critical refresh failure:", err);
    }
  };

  // Reset active module when not authenticated (ensures landing page on login)
  useEffect(() => {
    if (!isAuthenticated) {
      setActiveModule(null);
      localStorage.removeItem('cars_active_module');
    }
  }, [isAuthenticated]);

  // Background polling to sync real-time changes from the employee mobile app
  useEffect(() => {
      if (!isAuthenticated) return;
      
      // Prevent background database polling/refreshes while presenting to avoid layout and animation flickering
      if (currentHash.startsWith('#/presentation')) return;
      
      if (!isSupabaseConfigured) return;
      
      const interval = setInterval(async () => {
          try {
              await refreshData();
          } catch (e) {
              // Server offline, ignore
          }
      }, 3000); // Poll every 3 seconds

      return () => clearInterval(interval);
  }, [isAuthenticated, currentHash]);

  useEffect(() => {
      const initApp = async () => {
          if (!isAuthenticated) {
              setIsLoading(false);
              return;
          }
          try {
              setIsLoading(true);
              const dataPromise = refreshData();
              
              if (user?.role === UserRole.SYSTEM_ADMIN && isSupabaseConfigured && supabase) {
                  const tables = ['companies', 'sites', 'users', 'employees', 'records', 'rac_definitions', 'rooms', 'trainers', 'system_logs', 'waiting_list'];
                  const health = await Promise.all(tables.map(async t => {
                      try {
                          const { error } = await supabase.from(t).select('id').limit(1);
                          return { table: t, status: error?.code === '42P01' ? 'missing' : 'ok' };
                      } catch {
                          return { table: t, status: 'missing' };
                      }
                  }));
                  setDbHealth(health as any);
              }
              
              await dataPromise;
          } catch (err: any) {
              console.error("Initialization Error:", err);
          } finally {
              setIsLoading(false);
          }
      };
      initApp();
  }, [isAuthenticated, user?.email]);



  const addNotification = (notif: SystemNotification) => setNotifications(prev => [notif, ...prev]);

  const handleUpdateCompanies = async (updatedCompanies: Company[]) => {
      try {
          const persistedList: Company[] = [];
          // Sort to save parents before children if possible
          const sorted = [...updatedCompanies].sort((a, b) => (a.parentId ? 1 : 0) - (b.parentId ? 1 : 0));
          
          for (const comp of sorted) {
              const savedComp = await db.saveCompany(comp);
              persistedList.push(savedComp);
          }
          
          // Re-map children to their new parents if IDs changed from mock to UUID
          const finalCompanies = persistedList.map(c => {
              if (c.parentId && !persistedList.some(pc => pc.id === c.parentId)) {
                  // If parentId is not in persisted list, it might be an old mock ID
                  const originalParent = updatedCompanies.find(oc => oc.id === c.parentId);
                  if (originalParent) {
                      const newParent = persistedList.find(pc => pc.name === originalParent.name);
                      if (newParent) c.parentId = newParent.id;
                  }
              }
              return c;
          });

          setCompanies(finalCompanies);
          await db.addLog('AUDIT', 'UPDATE_TENANT_CONFIG', user?.name || 'Admin', { count: updatedCompanies.length });
          addNotification({
              id: uuidv4(),
              type: 'success',
              title: t.app.infraUpdated,
              message: t.app.infraUpdatedMsg,
              timestamp: new Date(),
              isRead: false
          });
      } catch (err: any) {
          console.error("Error saving tenant settings:", err);
          addNotification({
              id: uuidv4(),
              type: 'alert',
              title: t.app.infraFault,
              message: stringifyError(err),
              timestamp: new Date(),
              isRead: false
          });
      }
  };

  const handleUpdateRacs = async (updatedRacs: RacDef[]) => {
      try {
          const originalIds = new Set<string>(racDefinitions.map(r => r.id));
          const updatedIds = new Set<string>(updatedRacs.map(r => r.id));
          for (const id of originalIds) {
              if (!updatedIds.has(id)) await db.deleteRacDefinition(id);
          }
          for (const rac of updatedRacs) {
              await db.saveRacDefinition(rac);
          }
          setRacDefinitions(updatedRacs);
          await db.addLog('AUDIT', 'UPDATE_RAC_DEFINITIONS', user?.name || 'Admin', { count: updatedRacs.length });
      } catch (err) {
          console.error("Error saving dynamic modules:", err);
      }
  };

  const handleUpdateRooms = async (updatedRooms: Room[]) => {
    try {
        const originalIds = new Set<string>(rooms.map(r => r.id));
        const updatedIds = new Set<string>(updatedRooms.map(r => r.id));
        for (const id of originalIds) {
            if (!updatedIds.has(id)) await db.deleteRoom(id);
        }
        for (const room of updatedRooms) {
            await db.saveRoom(room);
        }
        setRooms(updatedRooms);
    } catch (err) { console.error(err); }
  };

  const handleUpdateTrainers = async (updatedTrainers: Trainer[]) => {
    try {
        const originalIds = new Set<string>(trainers.map(t => t.id));
        const updatedIds = new Set<string>(updatedTrainers.map(t => t.id));
        for (const id of originalIds) {
            if (!updatedIds.has(id)) await db.deleteTrainer(id);
        }
        for (const trainer of updatedTrainers) {
            await db.saveTrainer(trainer);
        }
        setTrainers(updatedTrainers);
    } catch (err) { console.error(err); }
  };

  const handleUpdateSites = async (updatedSites: Site[]) => {
    try {
        const originalIds = new Set<string>(sites.map(s => s.id));
        const updatedIds = new Set<string>(updatedSites.map(s => s.id));
        for (const id of originalIds) {
            if (!updatedIds.has(id)) await db.deleteSite(id);
        }
        for (const site of updatedSites) {
            await db.saveSite(site);
        }
        setSites(updatedSites);
    } catch (err) { console.error(err); }
  };

  const handleAddBookings = async (newBookings: Booking[]) => {
      try {
          for (const b of newBookings) { await db.saveBooking(b); }
          setBookings(prev => [...newBookings, ...prev]);
          await db.addLog('AUDIT', `NEW_BOOKING: ${newBookings.length} employees registered`, user?.name || 'Admin');
      } catch (err) { console.error("Error saving bookings:", err); }
  };

  const handleUpdateBookingStatus = async (id: string, status: BookingStatus) => {
      try {
          const booking = bookings.find(b => b.id === id);
          if (booking) {
              const updated = { ...booking, status };
              await db.saveBooking(updated);
              setBookings(prev => prev.map(b => b.id === id ? updated : b));
              await db.addLog('AUDIT', `STATUS_CHANGE: ${booking.employee.recordId} -> ${status}`, user?.name || 'Admin');
          }
      } catch (err) { console.error("Error updating status:", err); }
  };

  const handleTrainerUpdateBookings = async (updates: Booking[]) => {
      try {
          for (const b of updates) { await db.saveBooking(b); }
          setBookings(prev => {
              const updatedIds = new Set(updates.map(u => u.id));
              const untouched = prev.filter(b => !updatedIds.has(b.id));
              return [...updates, ...untouched];
          });
          await db.addLog('AUDIT', `TRAINER_INPUT: ${updates.length} results committed`, user?.name || 'Trainer');
      } catch (err) { console.error("Error committing results:", err); }
  };

  const handleImportBookings = async (newBookings: Booking[], sideEffects?: { employee: Employee, aso: string, ops: Record<string, boolean> }[]) => {
      setIsCloudSyncing(true);
      try {
          const idMap = new Map<string, string>();
          if (sideEffects) {
              const employeesToUpsert = sideEffects.map(se => se.employee);
              const dbEmployees = await db.bulkUpsertEmployees(employeesToUpsert);
              dbEmployees.forEach((e: any) => idMap.set(e.record_id, e.id));

              newBookings.forEach(b => {
                  const realId = idMap.get(b.employee.recordId);
                  if (realId) {
                      b.employee.id = realId;
                  }
              });

              const reqsToUpsert: EmployeeRequirement[] = [];
              for (const se of sideEffects) {
                  const realId = idMap.get(se.employee.recordId);
                  if (realId && (se.aso || Object.keys(se.ops).length > 0)) {
                      const currentReq = requirements.find(r => r.employeeId === realId) || { employeeId: realId, asoExpiryDate: '', requiredRacs: {} };
                      reqsToUpsert.push({ 
                          employeeId: realId, 
                          asoExpiryDate: se.aso || currentReq.asoExpiryDate, 
                          requiredRacs: { ...currentReq.requiredRacs, ...se.ops } 
                      });
                  }
              }
              if (reqsToUpsert.length > 0) {
                  await db.bulkUpsertRequirements(reqsToUpsert);
              }
          }

          await db.bulkUpsertBookings(newBookings);
          
          await db.addLog('AUDIT', `HISTORY_IMPORT_SYNC: ${newBookings.length} records pushed to Supabase`, user?.name || 'Admin');
          await refreshData();
      } catch (err: any) { 
          console.error("Import execution failed:", err);
          throw new Error(stringifyError(err));
      } finally {
          setIsCloudSyncing(false);
      }
  };

  const handleUpdateUser = async (updatedUser: Partial<User>) => {
      try {
          const result = await db.upsertUser(updatedUser);
          if (!result || !result.id) return;
          setUsers(prev => {
              const exists = prev.find(u => u.id === result.id);
              return exists ? prev.map(u => u.id === result.id ? { ...u, ...result } : u) : [...prev, result];
          });
          await db.addLog('AUDIT', `USER_UPSERT: ${updatedUser.name}`, user?.name || 'Admin');
      } catch (err) { console.error(err); }
  };

  const handleDeleteUser = async (id: number) => {
      try {
          const u = users.find(usr => usr.id === id);
          if (u) {
              await db.deleteUser(id);
              setUsers(prev => prev.filter(usr => usr.id !== id));
              await db.addLog('AUDIT', `USER_DELETE: ${u.name}`, user?.name || 'Admin');
              await refreshData();
          }
      } catch (err) { console.error(err); }
  };

  const handleUpdateRequirement = async (updatedReq: EmployeeRequirement) => {
      try {
          await db.updateRequirement(updatedReq);
          setRequirements(prev => {
              const idx = prev.findIndex(r => r.employeeId === updatedReq.employeeId);
              return (idx >= 0) ? prev.map((r, i) => i === idx ? updatedReq : r) : [...prev, updatedReq];
          });
      } catch (err) { console.error(err); }
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
      try {
          const original = employees.find(e => e.id === id);
          if (original) {
              const updated = { ...original, ...updates };
              const saved = await db.upsertEmployee(updated);
              setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...saved } : e));
              await db.addLog('AUDIT', `EMPLOYEE_UPDATE: ${updated.recordId}`, user?.name || 'Admin');
              await refreshData();
          }
      } catch (err) {
          console.error("Error updating employee:", err);
      }
  };

  const handleDeleteEmployee = async (id: string) => {
      try {
          const emp = employees.find(e => e.id === id);
          if (emp) {
              await db.deleteEmployee(id);
              setEmployees(prev => prev.filter(e => e.id !== id));
              await db.addLog('AUDIT', `EMPLOYEE_DELETE: ${emp.recordId}`, user?.name || 'Admin');
              await refreshData();
          }
      } catch (err) {
          console.error("Error deleting employee:", err);
      }
  };

  if (!isAuthenticated) return <LoginPage />;
  
  if (isLoading) return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
          <Loader2 size={80} className="text-blue-500 animate-spin" />
          <h2 className="text-2xl font-black uppercase mt-8 animate-pulse">{t.app.establishingGate}</h2>
          <p className="text-slate-500 text-xs mt-2 uppercase tracking-widest">{t.app.checkingSync}</p>
      </div>
  );


  if (activeModule === null) {
      // Allow direct access to presentation, verification, and print-cards routes
      const isDirectRoute = currentHash.startsWith('#/presentation') || 
                            currentHash.startsWith('#/verify/') || 
                            currentHash.startsWith('#/print-cards') ||
                            currentHash.startsWith('#/bookings');
                            
      if (!isDirectRoute) {
          // If only one module, don't show gateway, the useEffect will redirect
          if (availableModulesCount === 1) {
              return <PageLoadingFallback />;
          }

          return (
              <Suspense fallback={
                  <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
                      <Loader2 size={80} className="text-blue-500 animate-spin" />
                  </div>
              }>
                  <PortalGateway onSelectModule={handleSelectModule} activeModule={activeModule} />
              </Suspense>
          );
      }
  }


  const missingTables = dbHealth.filter(h => h.status === 'missing');

  return (
    <AdvisorProvider>
      <MessageProvider>
        <Router>
          {isCloudSyncing && (
              <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-white font-mono">
                  <RefreshCw size={64} className="text-blue-500 animate-spin mb-6" />
                  <h3 className="text-xl font-black tracking-tighter">{t.app.syncActive}</h3>
                  <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em] mt-2">{t.app.writingToSupabase}</p>
              </div>
          )}
          {user?.role === UserRole.SYSTEM_ADMIN && missingTables.length > 0 && (
              <div className="fixed top-0 left-0 right-0 z-[100] bg-indigo-600 text-white p-2 flex items-center justify-center gap-4 shadow-xl">
                  <Database size={16} className="animate-pulse" />
                  <span className="text-xs font-bold uppercase tracking-wider">{t.app.setupRequired.replace('{count}', String(missingTables.length))}</span>
                  <button onClick={() => window.location.hash = '#/tech-docs'} className="bg-white text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black hover:bg-indigo-50 transition-colors">{t.app.getSqlPatch}</button>
              </div>
          )}
          <Suspense fallback={<PageLoadingFallback />}>
            <PresentationRoleSwitcher />
            <Routes>
              <Route path="/presentation" element={<PresentationPage />} />
              <Route path="/verify/:recordId" element={<VerificationPage bookings={bookings} requirements={requirements} racDefinitions={racDefinitions} sessions={sessions} employees={filteredEmployees} />} />
              <Route path="/print-cards" element={<CardsPage bookings={bookings} requirements={requirements} racDefinitions={racDefinitions} sessions={sessions} userRole={user?.role} companies={companies} />} />
              <Route path="*" element={
                <Layout userRole={user?.role || UserRole.USER} setUserRole={() => {}} notifications={notifications} clearNotifications={() => setNotifications([])} sites={sites} currentSiteId={currentSiteId} setCurrentSiteId={setCurrentSiteId} companies={companies} activeModule={activeModule} onSwitchModule={handleSelectModule}>
                  <SafeRoutesWrapper>
                    <Routes>
                      <Route path="/" element={<RoleBasedHome userRole={user?.role || UserRole.USER} dashboardProps={{ bookings, requirements, sessions, userRole: user?.role, racDefinitions, currentSiteId, companies }} />} />
                      <Route path="/recruitment" element={<MobilizationDashboard companies={companies} racDefinitions={racDefinitions} />} />
                      <Route path="/database" element={<DatabasePage employees={filteredEmployees} bookings={bookings} requirements={requirements} updateRequirements={handleUpdateRequirement} sessions={sessions} onUpdateEmployee={handleUpdateEmployee} onDeleteEmployee={handleDeleteEmployee} racDefinitions={racDefinitions} addNotification={addNotification} currentSiteId={currentSiteId} companies={companies} activeModule={activeModule} />} />
                      <Route path="/booking" element={<BookingForm addBookings={handleAddBookings} sessions={sessions} userRole={user?.role || UserRole.USER} existingBookings={bookings} addNotification={addNotification} racDefinitions={racDefinitions} companies={companies} />} />
                      <Route path="/results" element={<ResultsPage bookings={bookings} updateBookingStatus={handleUpdateBookingStatus} importBookings={handleImportBookings} userRole={user?.role || UserRole.USER} sessions={sessions} requirements={requirements} sites={sites} racDefinitions={racDefinitions} addNotification={addNotification} currentSiteId={currentSiteId} onRefresh={refreshData} />} />
                      <Route path="/users" element={<UserManagement users={filteredUsers} onUpdateUser={handleUpdateUser} onDeleteUser={handleDeleteUser} addNotification={addNotification} sites={sites} currentSiteId={currentSiteId} companies={companies} activeModule={activeModule} />} />
                      <Route path="/companies" element={<CompanyManagement />} />
                      <Route path="/system-admin" element={<GlobalAdminDashboard />} />
                      <Route path="/settings" element={<SettingsPage racDefinitions={racDefinitions} onUpdateRacs={handleUpdateRacs} rooms={rooms} onUpdateRooms={handleUpdateRooms} trainers={trainers} onUpdateTrainers={handleUpdateTrainers} sites={sites} onUpdateSites={handleUpdateSites} companies={companies} onUpdateCompanies={handleUpdateCompanies} userRole={user?.role} addNotification={addNotification} currentSiteId={currentSiteId} />} />
                      <Route path="/schedule" element={<ScheduleTraining sessions={sessions} setSessions={setSessions} rooms={rooms} trainers={trainers} racDefinitions={racDefinitions} addNotification={addNotification} currentSiteId={currentSiteId} bookings={bookings} employees={filteredEmployees} requirements={requirements} onAddBookings={handleAddBookings} />} />
                      <Route path="/trainer-input" element={<TrainerInputPage bookings={bookings} updateBookings={handleTrainerUpdateBookings} sessions={sessions} userRole={user?.role} currentUserName={user?.name} racDefinitions={racDefinitions} />} />
                      <Route path="/manuals" element={<UserManualsPage userRole={user?.role || UserRole.USER} />} />
                      <Route path="/tech-docs" element={<TechnicalDocs />} />
                      <Route path="/system-blueprint" element={<SystemTechnicalManual />} />
                      <Route path="/logs" element={<LogsPage />} />
                      <Route path="/request-cards" element={<RequestCardsPage bookings={bookings} requirements={requirements} racDefinitions={racDefinitions} sessions={sessions} userRole={user?.role || UserRole.USER} currentSiteId={currentSiteId} companies={companies} />} />
                      <Route path="/integration" element={<IntegrationHub userRole={user?.role || UserRole.USER} />} />
                      <Route path="/reports" element={<ReportsPage bookings={bookings} sessions={sessions} requirements={requirements} sites={sites} currentSiteId={currentSiteId} racDefinitions={racDefinitions} companies={companies} />} />
                      <Route path="/enterprise-dashboard" element={<EnterpriseDashboard sites={sites} bookings={bookings} requirements={requirements} userRole={user?.role} racDefinitions={racDefinitions} companies={companies} />} />
                      <Route path="/executive-dashboard" element={<ExecutiveDashboard sites={sites} bookings={bookings} requirements={requirements} userRole={user?.role} companies={companies} unsafeConditions={unsafeConditions} />} />
                      <Route path="/alcohol-control" element={<AlcoholIntegration addNotification={addNotification} />} />
                      <Route path="/messages" element={<MessageLogPage />} />
                      <Route path="/site-governance" element={<SiteGovernancePage sites={sites} setSites={setSites} racDefinitions={racDefinitions} bookings={bookings} requirements={requirements} updateRequirements={handleUpdateRequirement} />} />
                      <Route path="/subcontractors" element={<SubcontractorPage companies={companies} />} />
                      <Route path="/safety-inspections" element={<SafetyInspectionPage />} />
                      <Route path="/hr-portal" element={<HRPortalPage />} />
                      <Route path="/security-portal" element={<SecurityPortalPage />} />
                      <Route path="/safemap" element={<Navigate to="/safemap/global" />} />
                      <Route path="/safemap/new" element={<SafeMapNew onConditionAdded={refreshSafeMapData} />} />
                      <Route path="/safemap/global" element={<SafeMapGlobal conditions={unsafeConditions} onConditionUpdated={refreshSafeMapData} users={users} />} />
                      <Route path="/safemap/report" element={<SafeMapReport conditions={unsafeConditions} onConditionUpdated={refreshSafeMapData} users={users} companies={companies} />} />
                      <Route path="/safemap/analytics" element={<SafeMapAnalytics conditions={unsafeConditions} companies={companies} />} />
                      <Route path="/safemap/bulletin" element={<SafeMapBulletin />} />
                      <Route path="/safemap/induction" element={<SafeMapInduction />} />
                      <Route path="/presentation" element={<PresentationPage />} />
                      <Route path="/clinic-portal" element={<ClinicPortalPage />} />
                      <Route path="/bookings" element={<BookingsPage bookings={bookings} sessions={sessions} updateBookingStatus={handleUpdateBookingStatus} userRole={user?.role} sites={sites} racDefinitions={racDefinitions} currentSiteId={currentSiteId} />} />
                      
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </SafeRoutesWrapper>
                  <GeminiAdvisor />
                </Layout>
              } />
            </Routes>
          </Suspense>
        </Router>
      </MessageProvider>
    </AdvisorProvider>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
