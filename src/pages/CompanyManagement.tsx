
import React, { useState, useEffect } from 'react';
import { Company, UserRole } from '../types';
import { Building2, CheckCircle2, XCircle, Clock, Search, Edit, Save, X, Shield, MapPin, Phone, Mail, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

const CompanyManagement: React.FC = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Company>>({});

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        // Map DB fields to frontend fields if needed, but server already returns them mostly
        setCompanies(data.map((c: any) => ({
            id: c.id,
            name: c.name,
            address: c.address,
            gpsCoordinates: c.gps_coordinates,
            contactPerson: c.contact_person,
            contactCell: c.contact_cell,
            contactEmail: c.contact_email,
            isPaid: c.is_paid,
            registrationDate: c.registration_date,
            status: c.status,
            tier: c.tier,
            selectedModules: c.selected_modules || []
        })));
      } else {
        setError('Failed to load companies');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCompany = async (id: string) => {
    try {
      const response = await fetch(`/api/companies/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            is_paid: editData.isPaid,
            tier: editData.tier,
            status: editData.status,
            name: editData.name,
            selected_modules: editData.selectedModules
        })
      });

      if (response.ok) {
        setEditingId(null);
        fetchCompanies();
      } else {
        alert('Failed to update company');
      }
    } catch (err) {
      alert('Network error');
    }
  };

  const calculateExpiryDate = (regDate: string) => {
    const registrationDate = new Date(regDate);
    let workingDaysCount = 0;
    let currentDate = new Date(registrationDate);
    while (workingDaysCount < 14) {
      currentDate.setDate(currentDate.getDate() + 1);
      const day = currentDate.getDay();
      if (day !== 0 && day !== 6) {
        workingDaysCount++;
      }
    }
    return currentDate;
  };

  const isTrialValid = (regDate: string) => {
    const expiryDate = calculateExpiryDate(regDate);
    return new Date() <= expiryDate;
  };

  const toggleModule = (moduleName: string) => {
    const current = editData.selectedModules || [];
    const next = current.includes(moduleName) 
        ? current.filter(m => m !== moduleName) 
        : [...current, moduleName];
    setEditData({...editData, selectedModules: next});
  };

  const availableModules = [
    'Onboarding & Mobilization',
    'Training & Certification',
    'SafeSite'
  ];

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    c.contactEmail?.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (user?.role !== UserRole.SYSTEM_ADMIN) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
        <p className="text-slate-500">Only Global Administrators can access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Company Management</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mt-1">Global Administration & Trial Control</p>
        </div>
        
        <div className="relative group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-yellow-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search companies..." 
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full md:w-80 outline-none focus:ring-4 focus:ring-yellow-500/10 focus:border-yellow-500 transition-all font-bold"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
           <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Company Data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCompanies.map(company => {
            const isTrialActive = company.registrationDate ? isTrialValid(company.registrationDate) : true;
            const expiryDate = company.registrationDate ? calculateExpiryDate(company.registrationDate) : null;
            const isEditing = editingId === company.id;

            return (
              <motion.div 
                key={company.id}
                layout
                className={`bg-white dark:bg-slate-800 rounded-[2rem] border-2 ${isEditing ? 'border-yellow-500 ring-4 ring-yellow-500/10' : 'border-slate-100 dark:border-slate-700'} p-6 shadow-sm hover:shadow-xl transition-all relative overflow-hidden`}
              >
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                    <Building2 size={120} />
                </div>

                <div className="flex items-start justify-between mb-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-400">
                      {company.logoUrl ? <img src={company.logoUrl} alt="Logo" className="w-12 h-12 object-contain" /> : <Building2 size={32} />}
                    </div>
                    <div>
                      {isEditing ? (
                        <input 
                          value={editData.name || ''} 
                          onChange={(e) => setEditData({...editData, name: e.target.value})}
                          className="text-xl font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg border border-yellow-500 outline-none w-full"
                        />
                      ) : (
                        <h3 className="text-xl font-black text-slate-800 dark:text-white">{company.name}</h3>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">ID: {company.id.slice(0, 8)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${company.tier === 'Prime' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                          {company.tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={() => handleUpdateCompany(company.id)} className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"><Save size={18} /></button>
                        <button onClick={() => setEditingId(null)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X size={18} /></button>
                      </>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditingId(company.id);
                          setEditData(company);
                        }} 
                        className="p-2 bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-yellow-500 hover:bg-yellow-500/10 rounded-xl transition-all"
                      >
                        <Edit size={18} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <User size={14} />
                      <span className="text-xs font-bold">{company.contactPerson || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Phone size={14} />
                      <span className="text-xs font-bold">{company.contactCell || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Mail size={14} />
                      <span className="text-xs font-bold truncate">{company.contactEmail || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin size={14} />
                      <span className="text-xs font-bold truncate">{company.address || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={14} />
                      <span className="text-xs font-bold">Registered: {company.registrationDate ? new Date(company.registrationDate).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                {/* Module Access */}
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Module Subscriptions</h4>
                    <div className="flex flex-wrap gap-2">
                        {availableModules.map(mod => {
                            const isSelected = isEditing 
                                ? editData.selectedModules?.includes(mod) 
                                : company.selectedModules?.includes(mod);
                            
                            return (
                                <button
                                    key={mod}
                                    type="button"
                                    disabled={!isEditing}
                                    onClick={() => toggleModule(mod)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                        isSelected 
                                            ? 'bg-yellow-500 text-slate-950 shadow-sm' 
                                            : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                    } ${isEditing ? 'hover:scale-105 active:scale-95' : 'cursor-default'}`}
                                >
                                    {mod}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex flex-wrap gap-3">
                  {/* Access Status */}
                  {company.isPaid ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                       <CheckCircle2 size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Full Paid Access</span>
                    </div>
                  ) : isTrialActive ? (
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                       <Clock size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Trial Active (until {expiryDate?.toLocaleDateString()})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400">
                       <XCircle size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Access Expired</span>
                    </div>
                  )}

                  {isEditing ? (
                    <div className="flex items-center gap-2 ml-auto">
                        <button 
                          onClick={() => setEditData({...editData, isPaid: !editData.isPaid})}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${editData.isPaid ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}
                        >
                          {editData.isPaid ? 'Payment Confirmed' : 'Mark as Paid'}
                        </button>
                    </div>
                  ) : (
                     <div className="ml-auto">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${company.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-slate-400 text-white'}`}>
                          {company.status}
                        </span>
                     </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompanyManagement;
