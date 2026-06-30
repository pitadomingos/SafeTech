
import React, { useState, useRef } from 'react';
import { Shield, Lock, User as UserIcon, AlertCircle, Loader2, Globe, Sparkles, ChevronRight, Building, MapPin, UserCheck, Phone, Mail, Upload, Camera, ArrowLeft, Briefcase, Users, LayoutGrid, CheckSquare, ShieldCheck, Tent } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/authService';
import { UserRole } from '../types';
import RacIcon from '../components/RacIcon';

type LoginView = 'login' | 'register-company' | 'register-user' | 'register-modules';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  
  const [view, setView] = useState<LoginView>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Company Registration State
  const [companyData, setCompanyData] = useState({
    name: '',
    address: '',
    gpsCoordinates: '',
    contactPerson: '',
    contactCell: '',
    contactEmail: '',
    logo: ''
  });

  // User Registration State
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    jobTitle: '',
    role: UserRole.ENTERPRISE_ADMIN,
    phoneNumber: '',
    department: ''
  });

  // Module Selection State
  const [selectedModules, setSelectedModules] = useState<string[]>(['Onboarding & Mobilization', 'Training & Certification', 'SafeSite']);

  const [registeredCompany, setRegisteredCompany] = useState<{ id: string, name: string, logoUrl?: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyData(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await authService.authenticate(username, password);
      
      if (response.status === 'success' && response.user) {
          login(response.user);
      } else if (response.status === 'trial_expired') {
          setError(response.message || 'Trial expired.');
          // Maybe redirect or show a specific modal? 
          // For now, the error message is fine.
      } else {
          setError(response.message || t.login.invalid || 'Invalid credentials. Access denied.');
      }
    } catch (err: any) {
      setError(err.message || 'System error. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompanyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authService.registerCompany(companyData);
      
      if (data.success) {
        setRegisteredCompany(data.company);
        setView('register-user');
      } else {
        setError(data.error || 'Failed to register company.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authService.registerUser({ ...userData, companyId: registeredCompany?.id });
      
      if (data.success) {
        setView('register-modules');
      } else {
        setError(data.error || 'Failed to create user account.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleModulesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const data = await authService.updateCompany(registeredCompany?.id || '', { selected_modules: selectedModules });
      
      if (data.id) {
        setView('login');
        setUsername(userData.email);
        setError('Registration complete! Please login to start your 14-day trial.');
      } else {
        setError('Failed to save module selection.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleName: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleName) 
        ? prev.filter(m => m !== moduleName) 
        : [...prev, moduleName]
    );
  };

  const availableModules = [
    { name: 'Onboarding & Mobilization', icon: Tent, desc: 'Candidate recruitment, document verification, and site entry workflows.' },
    { name: 'Training & Certification', icon: ShieldCheck, desc: 'RAC training management, booking, results, and digital cards.' },
    { name: 'SafeSite', icon: LayoutGrid, desc: 'Real-time site safety monitoring, alcohol testing integration, and site governance.' }
  ];

  const bgIcons = [
    { code: 'RAC01', pos: 'top-[10%] left-[5%]', size: 100, delay: '0s', dur: '8s' },
    { code: 'RAC02', pos: 'top-[15%] right-[8%]', size: 120, delay: '1s', dur: '10s' },
    { code: 'RAC03', pos: 'bottom-[20%] left-[10%]', size: 90, delay: '2s', dur: '7s' },
    { code: 'RAC06', pos: 'bottom-[15%] right-[12%]', size: 110, delay: '0.5s', dur: '9s' },
    { code: 'RAC08', pos: 'top-[45%] left-[-2%]', size: 80, delay: '3s', dur: '11s' },
    { code: 'RAC05', pos: 'bottom-[40%] right-[-3%]', size: 95, delay: '1.5s', dur: '8.5s' },
  ];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 font-sans relative overflow-hidden text-white py-12">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)]"></div>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
        {bgIcons.map((icon, idx) => (
          <div key={idx} className={`absolute ${icon.pos} opacity-20`} style={{ animation: `float ${icon.dur} ease-in-out infinite`, animationDelay: icon.delay }}>
            <RacIcon racCode={icon.code} size={icon.size} className="bg-transparent shadow-none dark:bg-transparent" />
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-xl px-6">
        <div className="text-center mb-10">
          <div className="inline-block relative mb-6">
            <div className="absolute inset-0 bg-yellow-500 blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative h-20 w-20 bg-slate-900 rounded-3xl border-2 border-slate-700 flex items-center justify-center shadow-2xl">
              {view === 'register-user' && registeredCompany?.logoUrl ? (
                <img src={registeredCompany.logoUrl} alt="Logo" className="h-16 w-16 object-contain" />
              ) : (
                <Shield size={44} className="text-yellow-500" />
              )}
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 uppercase">
            {view === 'register-user' ? registeredCompany?.name : <>Zero<span className="text-yellow-500">Gate</span></>}
          </h1>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em]">
            {view === 'login' ? t.login.subtitle : view === 'register-company' ? 'Company Registration' : view === 'register-user' ? 'Initial User Setup' : 'Trial Module Selection'}
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl ring-1 ring-white/5">
          {view !== 'login' && (
            <div className="flex items-center justify-between mb-10 px-4">
              {[
                { id: 'register-company', label: 'Company' },
                { id: 'register-user', label: 'Admin User' },
                { id: 'register-modules', label: 'Modules' }
              ].map((step, idx) => {
                const isActive = view === step.id;
                const isPast = (view === 'register-user' && step.id === 'register-company') || 
                               (view === 'register-modules' && (step.id === 'register-company' || step.id === 'register-user'));
                return (
                  <React.Fragment key={step.id}>
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black transition-all border-2 ${
                        isActive ? 'bg-yellow-500 border-yellow-500 text-slate-950 scale-110 shadow-lg shadow-yellow-500/20' : 
                        isPast ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'
                      }`}>
                        {isPast ? <CheckSquare size={16} /> : idx + 1}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-yellow-500' : 'text-slate-600'}`}>{step.label}</span>
                    </div>
                    {idx < 2 && <div className={`flex-1 h-[2px] mx-2 -mt-6 ${isPast ? 'bg-emerald-500' : 'bg-slate-800'}`} />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <form onSubmit={handleLoginSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email / Personnel ID</label>
                    <div className="relative group">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                      <input 
                        type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10 transition-all font-bold"
                        placeholder="e.g. user@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t.login.passwordLabel}</label>
                    <div className="relative group">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                      <input 
                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10 transition-all font-bold"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                      <AlertCircle size={18} className="shrink-0" />
                      <span className="text-xs font-bold">{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit" disabled={isLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 py-4 rounded-2xl font-black text-lg shadow-xl shadow-yellow-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Sparkles size={20} /> <span>{t.login.submitBtn}</span> <ChevronRight size={20} /></>}
                  </button>

                  <div className="text-center">
                    <button 
                      type="button"
                      onClick={() => setView('register-company')}
                      className="text-slate-500 hover:text-yellow-500 text-xs font-bold uppercase tracking-widest transition-colors"
                    >
                      Don't have an account? Register your company
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {view === 'register-company' && (
              <motion.div
                key="register-company"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleCompanyRegister} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                      <div className="relative group">
                        <Building size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input 
                          type="text" required value={companyData.name} onChange={(e) => setCompanyData({...companyData, name: e.target.value})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                          placeholder="Vulcan Resources"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GPS Coordinates</label>
                      <div className="relative group">
                        <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input 
                          type="text" required value={companyData.gpsCoordinates} onChange={(e) => setCompanyData({...companyData, gpsCoordinates: e.target.value})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                          placeholder="-16.12, 33.58"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Address</label>
                    <div className="relative group">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                      <input 
                        type="text" required value={companyData.address} onChange={(e) => setCompanyData({...companyData, address: e.target.value})}
                        className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                        placeholder="Nacala Corridor, Tete"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Person</label>
                      <div className="relative group">
                        <UserCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input 
                          type="text" required value={companyData.contactPerson} onChange={(e) => setCompanyData({...companyData, contactPerson: e.target.value})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Cell</label>
                      <div className="relative group">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input 
                          type="text" required value={companyData.contactCell} onChange={(e) => setCompanyData({...companyData, contactCell: e.target.value})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                          placeholder="+258 84..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Email</label>
                    <div className="relative group">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                      <input 
                        type="email" required value={companyData.contactEmail} onChange={(e) => setCompanyData({...companyData, contactEmail: e.target.value})}
                        className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                        placeholder="admin@company.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Company Logo</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-slate-800/50 border-2 border-dashed border-slate-700 hover:border-yellow-500 text-slate-500 hover:text-yellow-500 transition-all rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer gap-2"
                    >
                      {companyData.logo ? (
                        <div className="relative group">
                           <img src={companyData.logo} alt="Logo Preview" className="h-16 w-16 object-contain rounded-lg" />
                           <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                              <Camera size={20} className="text-white" />
                           </div>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} />
                          <span className="text-xs font-bold uppercase tracking-wider">Click to upload logo</span>
                        </>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                      <AlertCircle size={18} className="shrink-0" />
                      <span className="text-xs font-bold">{error}</span>
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button 
                      type="button" onClick={() => setView('login')}
                      className="w-1/3 bg-slate-800 hover:bg-slate-700 text-white py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={20} /> Back
                    </button>
                    <button 
                      type="submit" disabled={isLoading}
                      className="w-2/3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 size={24} className="animate-spin" /> : <>Next Step <ChevronRight size={20} /></>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {view === 'register-user' && (
              <motion.div
                key="register-user"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleUserRegister} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                    <div className="relative group">
                      <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                      <input 
                        type="text" required value={userData.name} onChange={(e) => setUserData({...userData, name: e.target.value})}
                        className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                        placeholder="Pita Domingos"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                      <div className="relative group">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input 
                          type="email" required value={userData.email} onChange={(e) => setUserData({...userData, email: e.target.value})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                          placeholder="admin@company.com"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input 
                          type="password" required value={userData.password} onChange={(e) => setUserData({...userData, password: e.target.value})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Title</label>
                      <div className="relative group">
                        <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input 
                          type="text" required value={userData.jobTitle} onChange={(e) => setUserData({...userData, jobTitle: e.target.value})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                          placeholder="IT Manager"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                      <div className="relative group">
                        <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input 
                          type="text" required value={userData.department} onChange={(e) => setUserData({...userData, department: e.target.value})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                          placeholder="Administration"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Cell</label>
                      <div className="relative group">
                        <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <input 
                          type="text" required value={userData.phoneNumber} onChange={(e) => setUserData({...userData, phoneNumber: e.target.value})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm"
                          placeholder="+258 84..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">System Role</label>
                      <div className="relative group">
                        <Shield size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-500 transition-colors" />
                        <select 
                          value={userData.role} onChange={(e) => setUserData({...userData, role: e.target.value as UserRole})}
                          className="w-full bg-slate-800/50 border-2 border-slate-700 text-white pl-12 pr-4 py-3 rounded-2xl outline-none focus:border-yellow-500 transition-all font-bold text-sm appearance-none"
                        >
                          <option value={UserRole.ENTERPRISE_ADMIN}>Enterprise Admin</option>
                          <option value={UserRole.SITE_ADMIN}>Site Admin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                      <AlertCircle size={18} className="shrink-0" />
                      <span className="text-xs font-bold">{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit" disabled={isLoading}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><UserCheck size={20} /> <span>Continue to Modules</span> <ChevronRight size={20} /></>}
                  </button>
                </form>
              </motion.div>
            )}

            {view === 'register-modules' && (
              <motion.div
                key="register-modules"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <form onSubmit={handleModulesSubmit} className="space-y-6">
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center mb-4">Select the SafeTech Suite modules you want to evaluate during your 14-day trial.</p>
                  
                  <div className="space-y-3">
                    {availableModules.map(mod => {
                      const Icon = mod.icon;
                      const isSelected = selectedModules.includes(mod.name);
                      return (
                        <div 
                          key={mod.name}
                          onClick={() => toggleModule(mod.name)}
                          className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${isSelected ? 'bg-yellow-500/10 border-yellow-500' : 'bg-slate-800/30 border-slate-700 hover:border-slate-500'}`}
                        >
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-yellow-500 text-slate-900' : 'bg-slate-700 text-slate-400'}`}>
                            <Icon size={24} />
                          </div>
                          <div className="flex-1">
                            <h4 className={`text-sm font-black ${isSelected ? 'text-white' : 'text-slate-300'}`}>{mod.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500 leading-tight">{mod.desc}</p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-yellow-500 bg-yellow-500' : 'border-slate-600'}`}>
                            {isSelected && <CheckSquare size={14} className="text-slate-900" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                      <AlertCircle size={18} className="shrink-0" />
                      <span className="text-xs font-bold">{error}</span>
                    </div>
                  )}

                  <button 
                    type="submit" disabled={isLoading || selectedModules.length === 0}
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 py-4 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 size={24} className="animate-spin" /> : <><Sparkles size={20} /> <span>Complete Setup & Start Trial</span> <ChevronRight size={20} /></>}
                  </button>
                  {selectedModules.length === 0 && (
                    <p className="text-[10px] text-center text-red-400 font-bold uppercase tracking-widest mt-2">Please select at least one module to continue.</p>
                  )}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-between items-center px-4">
          <button onClick={() => setLanguage(language === 'en' ? 'pt' : 'en')} className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
            <Globe size={14} /> {language === 'en' ? 'Português' : 'English'}
          </button>
          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{t.login.version}</div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 8s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default LoginPage;
