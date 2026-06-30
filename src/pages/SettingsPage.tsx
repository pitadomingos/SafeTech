import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
    Settings, Box, Save, Plus, Trash2, Activity, Cpu, Zap, 
    RefreshCw, Building2, MapPin, Globe, Wine, Sparkles, 
    Upload, ShieldCheck, X, Edit, Info, UserPlus, Home, 
    CheckCircle2, AlertTriangle, Users, BookOpen, Layers,
    Clock, CheckSquare, Square, ShieldAlert, ChevronRight,
    Users2, LayoutList, Search, Filter, Shield, ToggleLeft, ToggleRight,
    ChevronLeft, CreditCard, Rocket, Check, ArrowLeft, MoreHorizontal,
    Monitor, Sliders, Database, Key, GraduationCap, CheckCircle
} from 'lucide-react';
import { RacDef, Room, Trainer, Site, Company, UserRole, SystemNotification } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import RacIcon from '../components/RacIcon';
import { db } from '../services/databaseService';
import { useAuth } from '../contexts/AuthContext';
import { isCompanyDescendant, isAlcoholFeatureEnabled } from '../utils/companyUtils';

interface SettingsPageProps {
    racDefinitions: RacDef[];
    onUpdateRacs: (newDefs: RacDef[]) => void;
    rooms: Room[];
    onUpdateRooms: (newRooms: Room[]) => void;
    trainers: Trainer[];
    onUpdateTrainers: (newTrainers: Trainer[]) => void;
    sites?: Site[];
    onUpdateSites?: (newSites: Site[]) => void;
    companies?: Company[];
    onUpdateCompanies?: (newCompanies: Company[]) => void;
    userRole?: UserRole;
    addNotification: (notif: SystemNotification) => void;
    currentSiteId: string;
}

type ActiveModal = 'NONE' | 'ADD_SITE' | 'ADD_ROOM' | 'ADD_TRAINER' | 'ADD_RAC' | 'ADD_COMPANY' | 'EDIT_TRAINER' | 'EDIT_RAC';

const SettingsPage: React.FC<SettingsPageProps> = ({ 
    racDefinitions, onUpdateRacs, 
    rooms, onUpdateRooms, 
    trainers, onUpdateTrainers,
    sites = [], onUpdateSites,
    companies = [], onUpdateCompanies,
    userRole = UserRole.SYSTEM_ADMIN,
    addNotification,
    currentSiteId
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // UX State
  const [activeCategory, setActiveCategory] = useState<string>('HUB');
  const [activeModal, setActiveModal] = useState<ActiveModal>('NONE');
  const [isSaving, setIsSaving] = useState(false);

  // Form States
  const [newSite, setNewSite] = useState({ name: '', location: '' });
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '20', siteId: '' });
  const [newTrainer, setNewTrainer] = useState<{name: string, racs: string[], siteId: string}>({ 
      name: '', racs: [], siteId: currentSiteId !== 'all' ? currentSiteId : (sites[0]?.id || '') 
  });
  const [newRac, setNewRac] = useState({ code: '', name: '', validityMonths: 24, requiresDriverLicense: false, requiresPractical: true, passScore: 70 });
  const [newCompany, setNewCompany] = useState<Partial<Company>>({ name: '', appName: '', status: 'Active', defaultLanguage: 'en', parentId: undefined });
  
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [editingRac, setEditingRac] = useState<RacDef | null>(null);

  const isSystemAdmin = userRole === UserRole.SYSTEM_ADMIN;
  const isEnterpriseAdmin = userRole === UserRole.ENTERPRISE_ADMIN;
  const canEditGlobal = isSystemAdmin || isEnterpriseAdmin;

  const logoRef = useRef<HTMLInputElement>(null);
  const safetyLogoRef = useRef<HTMLInputElement>(null);

  const [confirmState, setConfirmState] = useState({
    isOpen: false, title: '', message: '', onConfirm: () => {}, isDestructive: false
  });

  const myCompany = useMemo(() => companies.find(c => c.id === 'c1') || companies[0], [companies]);
  const [brandDraft, setBrandDraft] = useState<Partial<Company>>(myCompany || {});

  useEffect(() => { if (myCompany) setBrandDraft(myCompany); }, [myCompany]);

  // --- ACTIONS ---
  
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'corporate' | 'safety') => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const result = event.target?.result as string;
          setBrandDraft(prev => ({
              ...prev,
              [type === 'corporate' ? 'logoUrl' : 'safetyLogoUrl']: result
          }));
      };
      reader.readAsDataURL(file);
  };

  const handleSaveBranding = async () => {
      if (!onUpdateCompanies || !myCompany) return;
      setIsSaving(true);
      const updated = companies.map(c => c.id === myCompany.id ? { ...c, ...brandDraft } as Company : c);
      await onUpdateCompanies(updated);
      setTimeout(() => {
          setIsSaving(false);
          addNotification({ id: uuidv4(), type: 'success', title: 'Branding Saved', message: 'Visual identity updated across nodes.', timestamp: new Date(), isRead: false });
      }, 800);
  };

  const handleAddSite = () => { 
      if (!newSite.name) return;
      if (onUpdateSites) { 
          onUpdateSites([...sites, { id: uuidv4(), companyId: (myCompany?.id || 'c1'), name: newSite.name, location: newSite.location || 'Unknown' }]); 
          setNewSite({ name: '', location: '' }); 
          setActiveModal('NONE');
      } 
  };

  const handleAddRoom = () => {
      if (!newRoom.name) return;
      onUpdateRooms([...rooms, { id: uuidv4(), name: newRoom.name, capacity: parseInt(newRoom.capacity) || 20, siteId: newRoom.siteId || sites[0]?.id }]);
      setNewRoom({ name: '', capacity: '20', siteId: '' });
      setActiveModal('NONE');
  };

  const handleAddTrainer = () => {
      if (!newTrainer.name) return;
      onUpdateTrainers([...trainers, { id: uuidv4(), name: newTrainer.name, racs: newTrainer.racs, siteId: newTrainer.siteId }]);
      setNewTrainer({ name: '', racs: [], siteId: currentSiteId !== 'all' ? currentSiteId : (sites[0]?.id || '') });
      setActiveModal('NONE');
      addNotification({ id: uuidv4(), type: 'success', title: 'Instructor Registered', message: `${newTrainer.name} is now authorized.`, timestamp: new Date(), isRead: false });
  };

  const handleAddRac = () => { 
      if (!newRac.code || !newRac.name) return;
      onUpdateRacs([...racDefinitions, { id: uuidv4(), companyId: myCompany?.id, code: newRac.code.toUpperCase(), name: newRac.name, validityMonths: newRac.validityMonths, requiresDriverLicense: newRac.requiresDriverLicense, requiresPractical: newRac.requiresPractical, passScore: newRac.passScore }]); 
      setNewRac({ code: '', name: '', validityMonths: 24, requiresDriverLicense: false, requiresPractical: true, passScore: 70 }); 
      setActiveModal('NONE');
  };

  const handleSaveRacEdit = () => {
      if (!editingRac) return;
      onUpdateRacs(racDefinitions.map(r => r.id === editingRac.id ? editingRac : r));
      setEditingRac(null);
      addNotification({ id: uuidv4(), type: 'success', title: 'RAC Updated', message: `Module ${editingRac.code} has been modified.`, timestamp: new Date(), isRead: false });
  };

  const handleAddCompany = () => {
      if (!newCompany.name || !onUpdateCompanies) return;
      const created: Company = {
          id: uuidv4(),
          name: newCompany.name,
          appName: newCompany.appName || newCompany.name,
          status: 'Active',
          defaultLanguage: newCompany.defaultLanguage as any || 'en',
          parentId: newCompany.parentId,
          tier: newCompany.parentId ? 'Sub' : 'Prime',
          features: { alcohol: !!newCompany.features?.alcohol }
      };
      onUpdateCompanies([...companies, created]);
      setNewCompany({ name: '', appName: '', status: 'Active', defaultLanguage: 'en', parentId: undefined, features: { alcohol: false } });
      setActiveModal('NONE');
      addNotification({ id: uuidv4(), type: 'success', title: 'Enterprise Node Created', message: `${created.name} has been provisioned.`, timestamp: new Date(), isRead: false });
  };

  const handleUpdateTrainerModules = (trainerId: string, racCode: string) => {
      onUpdateTrainers(trainers.map(t => {
          if (t.id !== trainerId) return t;
          const updatedRacs = t.racs.includes(racCode) 
              ? t.racs.filter(r => r !== racCode) 
              : [...t.racs, racCode];
          return { ...t, racs: updatedRacs };
      }));
  };

  const deleteSite = (id: string, name: string) => {
      setConfirmState({
          isOpen: true,
          title: 'Remove Site?',
          message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
          isDestructive: true,
          onConfirm: () => {
              if (onUpdateSites) onUpdateSites(sites.filter(s => s.id !== id));
          }
      });
  };

  const deleteTrainer = (id: string, name: string) => {
      setConfirmState({
          isOpen: true,
          title: 'Remove Instructor?',
          message: `Are you sure you want to remove ${name} from the instructors list?`,
          isDestructive: true,
          onConfirm: () => onUpdateTrainers(trainers.filter(t => t.id !== id))
      });
  };

  const hubCategories = [
    { id: 'Branding', title: 'Identity & Branding', desc: 'Custom logos and portal names', icon: Sparkles, color: 'bg-yellow-500', visible: canEditGlobal },
    { id: 'General', title: 'Global Policy', desc: 'Validity periods and pass marks', icon: Shield, color: 'bg-blue-500', visible: true },
    { id: 'Sites', title: 'Operational Sites', desc: 'Manage facility locations', icon: MapPin, color: 'bg-emerald-500', visible: true },
    { id: 'Rooms', title: 'Training Venues', desc: 'Classrooms and capacity', icon: Home, color: 'bg-orange-500', visible: true },
    { id: 'Trainers', title: 'Instructors', desc: 'Authorized personnel and certifications', icon: Users2, color: 'bg-indigo-500', visible: true },
    { id: 'RACs', title: 'Safety Catalog', desc: 'Define RAC modules and logic', icon: Activity, color: 'bg-purple-500', visible: canEditGlobal },
    { id: 'Companies', title: 'Enterprise Nodes', desc: 'Tenant management and supply chain', icon: Building2, color: 'bg-slate-700', visible: isSystemAdmin },
  ];

  const activeHubCategories = hubCategories.filter(c => c.visible);

  return (
    <div className="min-h-full pb-24 animate-fade-in">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
                {activeCategory !== 'HUB' && (
                    <button 
                        onClick={() => setActiveCategory('HUB')}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                        title="Back to Hub"
                        aria-label="Back to Hub"
                    >
                        <ArrowLeft size={24} />
                    </button>
                )}
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        {activeCategory === 'HUB' ? t.settings.title : activeCategory}
                    </h1>
                    <p className="text-sm text-slate-500 font-medium">
                        {activeCategory === 'HUB' ? 'System Configuration Center' : `Manage your ${activeCategory.toLowerCase()} settings`}
                    </p>
                </div>
            </div>
            {activeCategory !== 'HUB' && activeCategory !== 'General' && activeCategory !== 'Branding' && (
                <button 
                    onClick={() => {
                        if (activeCategory === 'Sites') setActiveModal('ADD_SITE');
                        if (activeCategory === 'Rooms') setActiveModal('ADD_ROOM');
                        if (activeCategory === 'Trainers') setActiveModal('ADD_TRAINER');
                        if (activeCategory === 'RACs') setActiveModal('ADD_RAC');
                        if (activeCategory === 'Companies') setActiveModal('ADD_COMPANY');
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-1"
                >
                    <Plus size={18}/>
                    <span>Add New</span>
                </button>
            )}
        </div>

        {/* --- HUB VIEW --- */}
        {activeCategory === 'HUB' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in-up">
                {activeHubCategories.map((cat) => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className="group flex flex-col p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500 transition-all text-left relative overflow-hidden"
                    >
                        <div className={`w-14 h-14 rounded-2xl ${cat.color} text-white flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                            <cat.icon size={28} />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{cat.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{cat.desc}</p>
                        <div className="mt-6 flex items-center text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            Configure <ChevronRight size={12} className="ml-1" />
                        </div>
                        <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                            <cat.icon size={120} />
                        </div>
                    </button>
                ))}
            </div>
        )}

        {/* --- BRANDING VIEW --- */}
        {activeCategory === 'Branding' && (
            <div className="max-w-4xl space-y-8 animate-fade-in-up">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">App Name</label>
                            <input 
                                type="text" 
                                className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-900 font-bold outline-none focus:border-blue-500 transition-all"
                                value={brandDraft.appName || ''}
                                onChange={e => setBrandDraft({...brandDraft, appName: e.target.value})}
                                title="App Display Name"
                                placeholder="CARS Manager"
                            />
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Portal Language</label>
                            <select 
                                className="w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 dark:bg-slate-900 font-bold appearance-none outline-none focus:border-blue-500"
                                value={brandDraft.defaultLanguage}
                                onChange={e => setBrandDraft({...brandDraft, defaultLanguage: e.target.value as any})}
                                title="Portal Language"
                                aria-label="Portal Language"
                            >
                                <option value="en">English (Global)</option>
                                <option value="pt">Português (Moçambique)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-slate-100 dark:border-slate-700">
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300">Corporate Logo</h4>
                            <div 
                                className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all overflow-hidden"
                                onClick={() => logoRef.current?.click()}
                            >
                                {brandDraft.logoUrl ? (
                                    <img src={brandDraft.logoUrl} className="h-24 object-contain" alt="Corporate Logo" />
                                ) : (
                                    <div className="text-center">
                                        <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                                        <span className="text-xs font-bold text-slate-400">UPLOAD LOGO</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={logoRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'corporate')} title="Upload Corporate Logo" />
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-bold text-slate-700 dark:text-slate-300">Safety Badge</h4>
                            <div 
                                className="h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-all overflow-hidden"
                                onClick={() => safetyLogoRef.current?.click()}
                            >
                                {brandDraft.safetyLogoUrl ? (
                                    <img src={brandDraft.safetyLogoUrl} className="h-24 w-24 object-contain" alt="Safety Badge" />
                                ) : (
                                    <div className="text-center">
                                        <ShieldCheck size={32} className="mx-auto text-slate-400 mb-2" />
                                        <span className="text-xs font-bold text-slate-400">UPLOAD BADGE</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={safetyLogoRef} className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'safety')} title="Upload Safety Badge" />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button 
                            onClick={handleSaveBranding}
                            disabled={isSaving}
                            className="bg-slate-900 dark:bg-blue-600 text-white px-10 py-3 rounded-xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                        >
                            {isSaving ? <RefreshCw className="animate-spin" size={20}/> : <Save size={20}/>}
                            <span>Apply Changes</span>
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* --- GENERAL POLICY VIEW --- */}
        {activeCategory === 'General' && (
            <div className="max-w-2xl space-y-6 animate-fade-in-up">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-10">
                    <div className="flex items-start gap-5">
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600"><Settings size={28}/></div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Validation Thresholds</h3>
                            <p className="text-sm text-slate-500">Core logic that governs passing scores and expiry windows.</p>
                        </div>
                    </div>
                    
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">Standard Validity</h4>
                                <p className="text-xs text-slate-500">Default period for certifications</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="number" defaultValue={24} className="w-20 p-2 text-center font-black bg-white dark:bg-slate-800 border rounded-lg outline-none" title="Standard Validity Months" placeholder="24" />
                                <span className="text-xs font-bold text-slate-400">MONTHS</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">Pass Requirement</h4>
                                <p className="text-xs text-slate-500">Minimum score to authorize</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="number" defaultValue={70} className="w-20 p-2 text-center font-black bg-white dark:bg-slate-800 border rounded-lg outline-none" title="Pass Score Requirement Percentage" placeholder="70" />
                                <span className="text-xs font-bold text-slate-400">% SCORE</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- SITES VIEW --- */}
        {activeCategory === 'Sites' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in-up">
                {sites.map(s => (
                    <div key={s.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-blue-600 shadow-inner"><MapPin size={24}/></div>
                            <div>
                                <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{s.name}</h4>
                                <p className="text-xs text-slate-400 font-bold">{s.location}</p>
                            </div>
                        </div>
                        <button onClick={() => deleteSite(s.id, s.name)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100" title="Delete Site" aria-label="Delete Site"><Trash2 size={18}/></button>
                    </div>
                ))}
            </div>
        )}

        {/* --- ROOMS VIEW --- */}
        {activeCategory === 'Rooms' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up">
                {rooms.map(r => (
                    <div key={r.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center shadow-inner"><Home size={20}/></div>
                            <button onClick={() => onUpdateRooms(rooms.filter(rm => rm.id !== r.id))} className="text-slate-300 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100" title="Delete Venue" aria-label="Delete Venue"><Trash2 size={16}/></button>
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-sm mb-1">{r.name}</h4>
                        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{sites.find(s => s.id === r.siteId)?.name || 'Central Hub'}</div>
                        <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest mt-auto pt-4 border-t border-slate-50 dark:border-slate-700">
                            <span>Capacity</span>
                            <span className="text-slate-900 dark:text-white">{r.capacity} SEATS</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- TRAINERS VIEW --- */}
        {activeCategory === 'Trainers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up">
                {trainers.map(t => (
                    <div key={t.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center font-black text-xl shadow-inner uppercase">{t.name.charAt(0)}</div>
                                <div>
                                    <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-md">{t.name}</h4>
                                    <p className="text-xs text-slate-400 font-bold">{sites.find(s => s.id === t.siteId)?.name || 'Central Hub'}</p>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingTrainer(t)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg" title="Edit Instructor Certification" aria-label="Edit Instructor Certification"><Edit size={16}/></button>
                                <button onClick={() => deleteTrainer(t.id, t.name)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete Instructor" aria-label="Delete Instructor"><Trash2 size={16}/></button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-1.5 min-h-[60px] content-start">
                                {t.racs.map(r => (
                                    <div key={r} className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600 rounded-lg">
                                        <RacIcon racCode={r} size={10} className="bg-transparent shadow-none p-0" />
                                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase">{r}</span>
                                    </div>
                                ))}
                                {t.racs.length === 0 && <span className="text-[10px] text-slate-300 italic">No modules assigned</span>}
                            </div>
                            <button 
                                onClick={() => setEditingTrainer(t)}
                                className="w-full mt-2 py-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center justify-center gap-2"
                            >
                                <Sliders size={12} /> MANAGE ASSIGNMENTS
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- RACS VIEW --- */}
        {activeCategory === 'RACs' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up">
                {racDefinitions.map(rac => (
                    <div key={rac.id} className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all group relative">
                        <div className="flex justify-between items-center mb-6">
                            <RacIcon racCode={rac.code} size={28} />
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingRac(rac)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" title="Edit Module"><Edit size={16}/></button>
                                <button onClick={() => onUpdateRacs(racDefinitions.filter(r => r.id !== rac.id))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="Delete Module"><Trash2 size={18}/></button>
                            </div>
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-md tracking-tight leading-tight mb-4">{rac.name}</h4>
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-50 dark:border-slate-700 pt-4">
                            <div className="text-center">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Validity</div>
                                <div className="text-xs font-black text-slate-700 dark:text-slate-300">{rac.validityMonths}M</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pass Score</div>
                                <div className="text-xs font-black text-slate-700 dark:text-slate-300">{rac.passScore || 70}%</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Type</div>
                                <div className={`text-xs font-black ${rac.requiresPractical ? 'text-blue-500' : 'text-slate-500'}`}>{rac.requiresPractical ? 'MIXED' : 'THEORY'}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* --- COMPANIES VIEW --- */}
        {activeCategory === 'Companies' && (
            <div className="space-y-4 animate-fade-in-up">
                {companies.map(c => {
                    const parent = companies.find(p => p.id === c.parentId);
                    const isAlcoholInherited = c.parentId ? isAlcoholFeatureEnabled(c.parentId, companies) : false;
                    const isAlcoholEnabled = !!c.features?.alcohol || isAlcoholInherited;
                    return (
                        <div key={c.id} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-blue-500/50 transition-all">
                            <div className="flex items-center gap-6">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden p-2 shadow-inner">
                                    {c.logoUrl ? <img src={c.logoUrl} className="w-full h-full object-contain" alt={`${c.name} Logo`} /> : <Building2 className="text-slate-300" size={32} />}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{c.name}</h4>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${c.status === 'Active' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{c.status}</span>
                                        {c.tier === 'Sub' && <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-50 text-blue-600 border border-blue-200">Sub</span>}
                                    </div>
                                    <p className="text-sm text-slate-500 font-medium">
                                        {parent ? `Main Contractor: ${parent.name}` : 'Prime Vendor'} • Language: {c.defaultLanguage?.toUpperCase()}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-6 justify-between md:justify-end">
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 px-5 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <Wine size={16} className={isAlcoholEnabled ? "text-emerald-500 animate-pulse" : "text-slate-400"} />
                                    <div className="flex flex-col text-left">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{t.settings.breathalyzer}</span>
                                        <span className={`text-xs font-bold ${isAlcoholEnabled ? 'text-emerald-500' : 'text-slate-400'}`}>
                                            {isAlcoholEnabled ? (isAlcoholInherited ? 'Enabled (Inherited)' : t.settings.enabled) : t.settings.disabled}
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            if (isAlcoholInherited) return;
                                            if (!onUpdateCompanies) return;
                                            const originalStatus = !!c.features?.alcohol;
                                            const updated = companies.map(cmp => cmp.id === c.id ? {
                                                ...cmp,
                                                features: {
                                                    ...cmp.features,
                                                    alcohol: !originalStatus
                                                }
                                            } : cmp);
                                            onUpdateCompanies(updated);
                                            addNotification({
                                                id: uuidv4(),
                                                type: 'success',
                                                title: t.settings.featureUpdated,
                                                message: (!originalStatus ? t.settings.featureEnabledMsg : t.settings.featureDisabledMsg).replace('{name}', c.name),
                                                timestamp: new Date(),
                                                isRead: false
                                            });
                                        }}
                                        className={`p-1 rounded-full transition-all ml-2 ${isAlcoholEnabled ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'} ${isAlcoholInherited ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title={isAlcoholInherited ? 'Inherited from parent company' : (isAlcoholEnabled ? 'Deactivate Breathalyzer' : 'Activate Breathalyzer')}
                                        aria-label="Toggle Breathalyzer Feature"
                                        disabled={isAlcoholInherited}
                                    >
                                        {isAlcoholEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                    </button>
                                </div>

                                <button onClick={() => onUpdateCompanies && onUpdateCompanies(companies.filter(cmp => cmp.id !== c.id))} className="p-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10" title="Delete Company Node" aria-label="Delete Company Node"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* --- MODALS --- */}
        {activeModal !== 'NONE' && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {activeModal === 'ADD_SITE' && 'Establish Operational Site'}
                            {activeModal === 'ADD_ROOM' && 'Define Training Venue'}
                            {activeModal === 'ADD_TRAINER' && 'Authorize Safety Instructor'}
                            {activeModal === 'ADD_RAC' && 'Deploy Safety Module'}
                            {activeModal === 'ADD_COMPANY' && 'Provision Enterprise Node'}
                        </h3>
                        <button onClick={() => setActiveModal('NONE')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400" title="Close Modal" aria-label="Close Modal"><X size={24} /></button>
                    </div>

                    <div className="p-8 space-y-6">
                        {activeModal === 'ADD_SITE' && (
                            <div className="space-y-4">
                                <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Site Name (e.g. Moatize Operations)" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} />
                                <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Location / Province" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} />
                                <button onClick={handleAddSite} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg">CREATE SITE</button>
                            </div>
                        )}

                        {activeModal === 'ADD_ROOM' && (
                            <div className="space-y-4">
                                <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Room Name (e.g. Auditorium A)" value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="number" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-blue-500" placeholder="Capacity" value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})} />
                                    <select className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold" value={newRoom.siteId} onChange={e => setNewRoom({...newRoom, siteId: e.target.value})} title="Select Site" aria-label="Select Site">
                                        <option value="">Select Site</option>
                                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <button onClick={handleAddRoom} className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black shadow-lg">REGISTER VENUE</button>
                            </div>
                        )}

                        {activeModal === 'ADD_TRAINER' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 border-slate-600 rounded-xl p-4 font-bold" placeholder="Full Name" value={newTrainer.name} onChange={e => setNewTrainer({...newTrainer, name: e.target.value})} />
                                    <select className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold" value={newTrainer.siteId} onChange={e => setNewTrainer({...newTrainer, siteId: e.target.value})} title="Select Site" aria-label="Select Site">
                                        {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-slate-400 mb-2 block">Authorized RAC Modules</label>
                                    <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700 max-h-[200px] overflow-y-auto">
                                        {racDefinitions.map(rac => (
                                            <button key={rac.id} onClick={() => setNewTrainer(prev => ({ ...prev, racs: prev.racs.includes(rac.code) ? prev.racs.filter(r => r !== rac.code) : [...prev.racs, rac.code] }))} className={`flex items-center gap-2 p-2 rounded-lg text-[10px] font-black border transition-all ${newTrainer.racs.includes(rac.code) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-600'}`}>
                                                <RacIcon racCode={rac.code} size={12} className="bg-transparent shadow-none p-0" /> {rac.code}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button onClick={handleAddTrainer} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-lg">COMMISSION INSTRUCTOR</button>
                            </div>
                        )}

                        {activeModal === 'ADD_RAC' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold uppercase" placeholder="Code (RAC01)" value={newRac.code} onChange={e => setNewRac({...newRac, code: e.target.value})} />
                                    <input className="col-span-2 w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold" placeholder="Module Description" value={newRac.name} onChange={e => setNewRac({...newRac, name: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Standard Validity (Months)</label>
                                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-purple-500" value={newRac.validityMonths} onChange={e => setNewRac({...newRac, validityMonths: parseInt(e.target.value) || 24})} title="Standard Validity Months" placeholder="24" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pass Score Requirement (%)</label>
                                        <input type="number" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-purple-500" value={newRac.passScore} onChange={e => setNewRac({...newRac, passScore: parseInt(e.target.value) || 70})} title="Pass Score Requirement Percentage" placeholder="70" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setNewRac({...newRac, requiresDriverLicense: !newRac.requiresDriverLicense})} className={`flex-1 p-4 rounded-xl border-2 font-bold text-xs transition-all ${newRac.requiresDriverLicense ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-slate-100 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-800'}`}>DRIVER LICENSE REQUIRED</button>
                                    <button onClick={() => setNewRac({...newRac, requiresPractical: !newRac.requiresPractical})} className={`flex-1 p-4 rounded-xl border-2 font-bold text-xs transition-all ${newRac.requiresPractical ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-slate-100 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-800'}`}>PRACTICAL EVAL REQUIRED</button>
                                </div>
                                <button onClick={handleAddRac} className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black shadow-lg uppercase tracking-tight">REGISTER MODULE</button>
                            </div>
                        )}

                        {activeModal === 'ADD_COMPANY' && (
                            <div className="space-y-4">
                                <input className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 font-bold" placeholder="Enterprise Name" value={newCompany.name} onChange={e => setNewCompany({...newCompany, name: e.target.value})} />
                                <input className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 font-bold" placeholder="App Display Name (Alias)" value={newCompany.appName} onChange={e => setNewCompany({...newCompany, appName: e.target.value})} />
                                <div className="grid grid-cols-2 gap-4">
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 font-bold" value={newCompany.defaultLanguage} onChange={e => setNewCompany({...newCompany, defaultLanguage: e.target.value as any})} title="Default Language" aria-label="Default Language">
                                        <option value="en">English (Global)</option>
                                        <option value="pt">Português (Mozambique)</option>
                                    </select>
                                    <select className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-4 font-bold" value={newCompany.parentId || ''} onChange={e => setNewCompany({...newCompany, parentId: e.target.value || undefined})} title="Parent Company" aria-label="Parent Company">
                                        <option value="">Main Contractor (None)</option>
                                        {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl">
                                    <button
                                        type="button"
                                        onClick={() => setNewCompany(prev => ({ 
                                            ...prev, 
                                            features: { 
                                                alcohol: !prev.features?.alcohol 
                                            } 
                                        }))}
                                        className={`p-1 rounded-full transition-all ${newCompany.features?.alcohol ? 'text-emerald-500' : 'text-slate-400'}`}
                                        title="Toggle default breathalyzer integration"
                                    >
                                        {newCompany.features?.alcohol ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                                    </button>
                                    <div className="flex flex-col text-left">
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                            <Wine size={14} className={newCompany.features?.alcohol ? "text-emerald-500" : "text-slate-400"} />
                                            {t.settings.enableAlcoholLabel}
                                        </span>
                                        <span className="text-[10px] text-slate-400">{t.settings.enableAlcoholDesc}</span>
                                    </div>
                                </div>
                                <button onClick={handleAddCompany} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg">PROVISION NODE</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* --- EDIT TRAINER MODAL --- */}
        {editingTrainer && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                    <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg uppercase">{editingTrainer.name.charAt(0)}</div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{editingTrainer.name}</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Update Instructor Authorization</p>
                            </div>
                        </div>
                        <button onClick={() => setEditingTrainer(null)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400" title="Close Modal" aria-label="Close Modal"><X size={24} /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-8 space-y-6">
                        <div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2"><GraduationCap size={18} className="text-indigo-500" />Toggle Authorized Modules</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {racDefinitions.map(rac => {
                                    const isSelected = editingTrainer.racs.includes(rac.code);
                                    return (
                                        <button key={rac.id} onClick={() => handleUpdateTrainerModules(editingTrainer.id, rac.code)} className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-indigo-200'}`}>
                                            <RacIcon racCode={rac.code} size={20} className="shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <div className={`text-xs font-black truncate ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-400'}`}>{rac.code}</div>
                                                <div className="text-[10px] text-slate-400 truncate font-medium">{rac.name.split(' - ')[1] || rac.name}</div>
                                            </div>
                                            {isSelected && <CheckCircle size={16} className="text-indigo-600 shrink-0" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end"><button onClick={() => setEditingTrainer(null)} className="bg-slate-900 dark:bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"><Save size={20} /><span>Confirm Assignments</span></button></div>
                </div>
            </div>
        )}

        {/* --- EDIT RAC MODAL --- */}
        {editingRac && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-700">
                    <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-600 rounded-xl text-white shadow-lg"><Activity size={24} /></div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Edit Safety Module</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Update parameters for {editingRac.code}</p>
                            </div>
                        </div>
                        <button onClick={() => setEditingRac(null)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-400" title="Close Modal" aria-label="Close Modal"><X size={24} /></button>
                    </div>
                    
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Module Code</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold uppercase outline-none focus:ring-2 focus:ring-purple-500" value={editingRac.code} onChange={e => setEditingRac({...editingRac, code: e.target.value.toUpperCase()})} title="Module Code" placeholder="RAC01" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Full Description</label>
                                <input className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-purple-500" value={editingRac.name} onChange={e => setEditingRac({...editingRac, name: e.target.value})} title="Full Description" placeholder="Description" />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Standard Validity (Months)</label>
                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-purple-500" value={editingRac.validityMonths || 24} onChange={e => setEditingRac({...editingRac, validityMonths: parseInt(e.target.value) || 24})} title="Standard Validity Months" placeholder="24" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Pass Score Requirement (%)</label>
                                <input type="number" className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-purple-500" value={editingRac.passScore || 70} onChange={e => setEditingRac({...editingRac, passScore: parseInt(e.target.value) || 70})} title="Pass Score Requirement Percentage" placeholder="70" />
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setEditingRac({...editingRac, requiresDriverLicense: !editingRac.requiresDriverLicense})} 
                                className={`flex-1 p-4 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-2 ${editingRac.requiresDriverLicense ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-slate-100 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-800'}`}
                            >
                                <CreditCard size={20} />
                                <span>DRIVER LICENSE</span>
                            </button>
                            <button 
                                onClick={() => setEditingRac({...editingRac, requiresPractical: !editingRac.requiresPractical})} 
                                className={`flex-1 p-4 rounded-xl border-2 font-bold text-xs transition-all flex flex-col items-center gap-2 ${editingRac.requiresPractical ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : 'border-slate-100 dark:border-slate-700 text-slate-400 bg-white dark:bg-slate-800'}`}
                            >
                                <LayoutList size={20} />
                                <span>PRACTICAL EVAL</span>
                            </button>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                        <button onClick={() => setEditingRac(null)} className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">Cancel</button>
                        <button onClick={handleSaveRacEdit} className="bg-purple-600 hover:bg-purple-500 text-white px-10 py-3 rounded-xl font-black shadow-xl hover:scale-105 transition-all flex items-center gap-2"><Save size={20} /><span>Update Module</span></button>
                    </div>
                </div>
            </div>
        )}

        <ConfirmModal 
            isOpen={confirmState.isOpen} 
            title={confirmState.title} 
            message={confirmState.message} 
            onConfirm={confirmState.onConfirm} 
            onClose={() => setConfirmState(prev => ({...prev, isOpen: false}))} 
            isDestructive={confirmState.isDestructive} 
        />
    </div>
  );
};

export default SettingsPage;