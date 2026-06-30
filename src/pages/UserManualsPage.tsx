
import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { 
  Monitor, Shield, Briefcase, Users, UserCog, 
  Settings, AlertTriangle, Bell, Info, CheckCircle
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface UserManualsPageProps {
    userRole: UserRole;
}

const UserManualsPage: React.FC<UserManualsPageProps> = ({ userRole }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<UserRole>(userRole);

  // Sync active tab when userRole changes (e.g. simulation)
  useEffect(() => {
      setActiveTab(userRole);
  }, [userRole]);

  // Safety check to ensure nested properties exist
  if (!t || !t.manuals || !t.manuals.sysAdmin || !t.manuals.user) {
      return (
          <div className="flex items-center justify-center h-full p-20 text-slate-500">
              Loading Manuals...
          </div>
      );
  }

  // Define available manuals based on Role Heirarchy
  const getAvailableRoles = () => {
      if (userRole === UserRole.SYSTEM_ADMIN) {
          return [UserRole.SYSTEM_ADMIN, UserRole.RAC_ADMIN, UserRole.RAC_TRAINER, UserRole.DEPT_ADMIN, UserRole.USER];
      }
      if (userRole === UserRole.RAC_ADMIN) {
          return [UserRole.RAC_ADMIN, UserRole.RAC_TRAINER, UserRole.USER];
      }
      if (userRole === UserRole.RAC_TRAINER) {
          return [UserRole.RAC_TRAINER, UserRole.USER];
      }
      if (userRole === UserRole.DEPT_ADMIN) {
          return [UserRole.DEPT_ADMIN, UserRole.USER];
      }
      return [UserRole.USER];
  };

  const availableRoles = getAvailableRoles();

  const getIcon = (role: UserRole) => {
      switch(role) {
          case UserRole.SYSTEM_ADMIN: return Monitor;
          case UserRole.RAC_ADMIN: return Shield;
          case UserRole.RAC_TRAINER: return Briefcase;
          case UserRole.DEPT_ADMIN: return Users;
          default: return UserCog;
      }
  };

  const getColor = (role: UserRole) => {
      switch(role) {
          case UserRole.SYSTEM_ADMIN: return 'text-blue-600 bg-blue-50';
          case UserRole.RAC_ADMIN: return 'text-yellow-600 bg-yellow-50';
          case UserRole.RAC_TRAINER: return 'text-green-600 bg-green-50';
          case UserRole.DEPT_ADMIN: return 'text-purple-600 bg-purple-50';
          default: return 'text-gray-600 bg-gray-50';
      }
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-80px)] bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
      
      {/* Sidebar Navigation */}
      <div className="w-full md:w-72 bg-slate-50 dark:bg-slate-900/50 border-r border-slate-200 dark:border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
           <h2 className="text-lg font-bold text-slate-800 dark:text-white">{t.manuals.title}</h2>
           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.manuals.subtitle}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
           {availableRoles.map((role) => {
             const Icon = getIcon(role);
             const isActive = activeTab === role;
             const colorClass = getColor(role);
             return (
               <button
                 key={role}
                 onClick={() => setActiveTab(role)}
                 className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left
                    ${isActive ? 'bg-white dark:bg-slate-800 shadow-md border border-slate-100 dark:border-slate-600 ring-1 ring-black/5 dark:ring-white/5' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-slate-800/50'}
                 `}
               >
                 <div className={`p-2 rounded-lg ${colorClass}`}>
                    <Icon size={18} />
                 </div>
                 <span className={isActive ? 'text-slate-900 dark:text-white font-bold' : ''}>{String(role)}</span>
               </button>
             );
           })}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-800 scroll-smooth">
         
         {/* System Admin Manual */}
         {activeTab === UserRole.SYSTEM_ADMIN && (
            <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12">
               <Header title={t.manuals.sysAdmin.title} icon={Monitor} color="blue" subtitle={t.manuals.sysAdmin.subtitle} />
               
               <Section title={t.manuals.sysAdmin.configTitle}>
                  <p>{t.manuals.sysAdmin.configDesc}</p>
                  <ul className="step-list mt-4">
                     <Step 
                        num="1" 
                        text={t.manuals.sysAdmin.rooms}
                        visual={<Settings className="text-slate-400" size={16} />}
                     />
                     <Step 
                        num="2" 
                        text={t.manuals.sysAdmin.trainers}
                        visual={<Users className="text-slate-400" size={16} />}
                     />
                     <Step 
                        num="3" 
                        text={t.manuals.sysAdmin.racs}
                        visual={<AlertTriangle className="text-red-400" size={16} />}
                     />
                  </ul>
               </Section>

               <Section title={t.manuals.sysAdmin.dbTitle}>
                  <p>{t.manuals.sysAdmin.dbDesc}</p>
                  
                  {/* NEW MATRIX ALERT */}
                  <AlertBox type="error">
                      {t.manuals.sysAdmin.restrictionWarning}
                  </AlertBox>

                  <AlertBox type="info">
                      {t.manuals.sysAdmin.csv}
                  </AlertBox>
                  <ul className="step-list">
                     <Step 
                        num="A" 
                        text={t.manuals.sysAdmin.active}
                     />
                  </ul>
               </Section>
            </div>
         )}

         {/* RAC Admin Manual */}
         {activeTab === UserRole.RAC_ADMIN && (
            <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12">
               <Header title={t.manuals.racAdmin.title} icon={Shield} color="yellow" subtitle={t.manuals.racAdmin.subtitle} />
               
               <Section title={t.manuals.racAdmin.schedTitle}>
                  <p>{t.manuals.racAdmin.schedDesc}</p>
                  <ul className="step-list mt-4">
                     <Step num="1" text={t.manuals.racAdmin.create} />
                     <Step num="2" text={t.manuals.racAdmin.lang} />
                  </ul>
               </Section>

               <Section title={t.manuals.racAdmin.autoTitle}>
                  <p>{t.manuals.racAdmin.autoDesc}</p>
                  <AlertBox type="warning">
                      {t.manuals.racAdmin.approve}
                  </AlertBox>
               </Section>

               <Section title={t.manuals.racAdmin.renewTitle}>
                  <Step num="->" text={t.manuals.racAdmin.renewDesc} />
               </Section>
            </div>
         )}

         {/* RAC Trainer Manual */}
         {activeTab === UserRole.RAC_TRAINER && (
            <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12">
               <Header title={t.manuals.racTrainer.title} icon={Briefcase} color="green" subtitle={t.manuals.racTrainer.subtitle} />
               
               <Section title={t.manuals.racTrainer.inputTitle}>
                  <p>{t.manuals.racTrainer.inputDesc}</p>
                  <ul className="step-list mt-4">
                     <Step num="1" text={t.manuals.racTrainer.grading} />
                  </ul>
               </Section>

               <Section title={t.manuals.specialRules}>
                  <AlertBox type="error">
                      {t.manuals.racTrainer.rac02}
                  </AlertBox>
               </Section>

               <Section title={t.manuals.finalize}>
                  <Step num="->" text={t.manuals.racTrainer.save} />
               </Section>
            </div>
         )}

         {/* Dept Admin Manual */}
         {activeTab === UserRole.DEPT_ADMIN && (
            <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12">
               <Header title={t.manuals.deptAdmin.title} icon={Users} color="purple" subtitle={t.manuals.deptAdmin.subtitle} />
               
               <Section title={t.manuals.deptAdmin.reqTitle}>
                  <p>{t.manuals.deptAdmin.reqDesc}</p>
                  <ul className="step-list mt-4">
                     <Step num="1" text={t.manuals.deptAdmin.search} />
                     <Step num="2" text={t.manuals.deptAdmin.print} />
                  </ul>
               </Section>

               <Section title={t.manuals.deptAdmin.repTitle}>
                  <p>{t.manuals.deptAdmin.repDesc}</p>
               </Section>
            </div>
         )}

         {/* User Manual */}
         {activeTab === UserRole.USER && (
            <div className="max-w-4xl mx-auto animate-fade-in-up space-y-12">
               <Header title={t.manuals.user.title} icon={UserCog} color="gray" subtitle={t.manuals.user.subtitle} />
               
               <Section title={t.manuals.user.statusTitle}>
                  <p>{t.manuals.user.statusDesc}</p>
                  
                  {/* NEW FILTER ALERT */}
                  <AlertBox type="warning">
                      {t.manuals.user.filterAlert}
                  </AlertBox>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <h4 className="font-bold text-green-700 dark:text-green-400 flex items-center gap-2"><CheckCircle size={16}/> {t.dashboard.charts.compliant}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t.manuals.user.green}</p>
                      </div>
                      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <h4 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2"><AlertTriangle size={16}/> {t.dashboard.charts.nonCompliant}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t.manuals.user.red}</p>
                      </div>
                  </div>
               </Section>

               <Section title={t.manuals.digitalVerification}>
                  <Step num="QR" text={t.manuals.user.qr} />
               </Section>
            </div>
         )}

      </div>
    </div>
  );
};

// --- Helper Components for Styling ---

const Header = ({ title, icon: Icon, color, subtitle }: any) => {
    const colorMap: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
        green: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
        purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        gray: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
    };

    return (
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100 dark:border-slate-700">
            <div className={`p-4 rounded-xl shadow-sm ${colorMap[color]}`}>
                <Icon size={32} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{subtitle}</p>
            </div>
        </div>
    );
};

const Section = ({ title, children }: any) => (
   <div className="mb-10">
      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
          {title}
      </h3>
      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-4">
         {children}
      </div>
   </div>
);

const Step = ({ num, text, visual }: any) => (
   <li className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 transition-colors">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white flex items-center justify-center text-sm font-bold mt-0.5 shadow-inner">
         {num}
      </div>
      <div className="flex-1">
         <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{text}</p>
         {visual && <div className="mt-3 p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">{visual}</div>}
      </div>
   </li>
);

const AlertBox = ({ type, children }: any) => {
   const styles = type === 'error' 
    ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-300' 
    : type === 'warning'
        ? 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-900/50 dark:text-orange-300'
        : 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-300';
   
   const Icon = type === 'error' ? AlertTriangle : type === 'warning' ? Bell : Info;
   
   return (
      <div className={`p-4 rounded-xl border flex gap-3 text-sm my-4 shadow-sm ${styles}`}>
         <Icon size={20} className="flex-shrink-0 mt-0.5" />
         <div>{children}</div>
      </div>
   );
};

export default UserManualsPage;
