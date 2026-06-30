
import React, { useState, useRef, useMemo } from 'react';
import { UserRole, User, SystemNotification, Site, Company } from '../types';
import { Shield, MoreVertical, Plus, X, Trash2, Edit, Users, Lock, Key, ChevronLeft, ChevronRight, Mail, Briefcase, CheckCircle2, XCircle, Search, Upload, Download, Smartphone, MapPin, Loader2, Info, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';
import { v4 as uuidv4 } from 'uuid';

interface UserManagementProps {
    users: User[];
    onUpdateUser: (user: Partial<User>) => Promise<void>;
    onDeleteUser: (id: number) => Promise<void>;
    addNotification: (notif: SystemNotification) => void;
    sites: Site[];
    currentSiteId: string;
    companies?: Company[];
    activeModule?: string | null;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onUpdateUser, onDeleteUser, addNotification, sites, currentSiteId, companies = [], activeModule }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  
  const defaultCompany = useMemo(() => companies[0]?.name || 'Internal', [companies]);

  const [newUser, setNewUser] = useState<Partial<User>>({
      name: '', email: '', phoneNumber: '', role: UserRole.USER, status: 'Active', company: defaultCompany, jobTitle: '', siteId: currentSiteId !== 'all' ? currentSiteId : (sites[0]?.id || 'all'), appModule: (activeModule as 'mobilization' | 'training') || 'both'
  });
  const [editingUser, setEditingUser] = useState<Partial<User> | null>(null);
  const [openActionId, setOpenActionId] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Confirmation Modal State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isDestructive: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false
  });

  const handleSaveUser = async () => {
      const targetUser = editingUser || newUser;
      if (!targetUser.name || !targetUser.email) {
          addNotification({
              id: uuidv4(),
              type: 'warning',
              title: 'Validation Error',
              message: 'Name and Email required',
              timestamp: new Date(),
              isRead: false
          });
          return;
      }

      setIsSubmitting(true);
      try {
          const userToAdd: Partial<User> = {
              id: targetUser.id,
              name: targetUser.name,
              email: targetUser.email,
              phoneNumber: targetUser.phoneNumber || '',
              role: targetUser.role || UserRole.USER,
              status: targetUser.status || 'Active',
              company: targetUser.company || 'Unknown',
              jobTitle: targetUser.jobTitle || 'N/A',
              siteId: targetUser.siteId || (currentSiteId !== 'all' ? currentSiteId : 'all'),
              appModule: targetUser.appModule || 'both'
          };
          
          await onUpdateUser(userToAdd);
          
          setIsModalOpen(false);
          setNewUser({ name: '', email: '', phoneNumber: '', role: UserRole.USER, status: 'Active', company: defaultCompany, jobTitle: '', siteId: currentSiteId !== 'all' ? currentSiteId : 'all', appModule: (activeModule as 'mobilization' | 'training') || 'both' });
          setEditingUser(null);
          addNotification({
              id: uuidv4(),
              type: 'success',
              title: editingUser ? 'User Updated' : 'User Created',
              message: editingUser ? `User ${userToAdd.name} has been updated.` : `User ${userToAdd.name} added. A welcome email has been sent for password setup.`,
              timestamp: new Date(),
              isRead: false
          });
      } catch (e) {
          console.error(e);
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDeleteUser = (id: number) => {
      setOpenActionId(null); 
      setConfirmState({
          isOpen: true,
          title: t.database.confirmDelete,
          message: t.database.confirmDeleteMsg,
          onConfirm: async () => {
              await onDeleteUser(id);
              addNotification({
                  id: uuidv4(),
                  type: 'info',
                  title: 'User Deleted',
                  message: 'User has been removed from cloud storage.',
                  timestamp: new Date(),
                  isRead: false
              });
          },
          isDestructive: true
      });
  };

  const handleDownloadTemplate = () => {
      const headers = ['Name', 'Email', 'Role (System Admin/RAC Admin/RAC Trainer/Departmental Admin/User)', 'Status (Active/Inactive)', 'Company', 'Job Title', 'Site ID'];
      const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "user_import_template.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (evt) => {
          const text = evt.target?.result as string;
          if (!text) return;

          const lines = text.split('\n');
          const firstLine = lines[0] || '';
          const separator = firstLine.includes(';') ? ';' : ',';

          const dataRows = lines.slice(1);
          let importCount = 0;

          for (const line of dataRows) {
              if (!line.trim()) continue;
              const cols = line.split(separator).map(c => c?.trim().replace(/^"|"$/g, ''));
              if (cols.length < 2) continue;

              const name = cols[0];
              const email = cols[1];
              
              if (name && email) {
                  let role = UserRole.USER;
                  const roleStr = cols[2]?.toLowerCase() || '';
                  if (roleStr.includes('system')) role = UserRole.SYSTEM_ADMIN;
                  else if (roleStr.includes('rac admin')) role = UserRole.RAC_ADMIN;
                  else if (roleStr.includes('trainer')) role = UserRole.RAC_TRAINER;
                  else if (roleStr.includes('dept')) role = UserRole.DEPT_ADMIN;

                  await onUpdateUser({
                      name,
                      email,
                      role,
                      status: cols[3]?.toLowerCase() === 'inactive' ? 'Inactive' : 'Active',
                      company: cols[4] || 'Unknown',
                      jobTitle: cols[5] || 'N/A',
                      siteId: cols[6] || (currentSiteId !== 'all' ? currentSiteId : 'all')
                  });
                  importCount++;
              }
          }

          if (importCount > 0) {
              addNotification({
                  id: uuidv4(),
                  type: 'success',
                  title: 'Import Successful',
                  message: `${t.database.importSuccess}: ${importCount} users imported and saved.`,
                  timestamp: new Date(),
                  isRead: false
              });
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
  };

  // Filter Logic
  const filteredUsers = users.filter(u => {
      const uSite = (u.siteId || 'all').toLowerCase();
      const currSite = (currentSiteId || 'all').toLowerCase();
      
      const siteMatch = currSite === 'all' || uSite === 'all' || uSite === currSite;
      if (!siteMatch) return false;

      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const role = (u.role || '').toLowerCase();
      const q = filterQuery.toLowerCase();

      return name.includes(q) || email.includes(q) || role.includes(q);
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const goToPage = (page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages)));

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setItemsPerPage(Number(e.target.value));
      setCurrentPage(1);
  };

  const getRoleColor = (role: UserRole) => {
      switch(role) {
          case UserRole.SYSTEM_ADMIN: return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
          case UserRole.RAC_ADMIN: return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
          case UserRole.RAC_TRAINER: return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
          case UserRole.DEPT_ADMIN: return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
          default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      }
  };

  const getSiteName = (id?: string) => {
      if (!id) return '-';
      if (id.toLowerCase() === 'all') return 'Enterprise (Global)';
      const s = sites.find(s => s.id === id);
      return s ? s.name : id;
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in-up relative h-full">
      
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden border border-slate-700/50">
         <div className="absolute top-0 right-0 opacity-[0.03] pointer-events-none">
            <Users size={400} />
         </div>
         <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-500/20 rounded-full blur-3xl pointer-events-none"></div>

         <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
               <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/20 rounded-xl border border-green-500/30 backdrop-blur-sm">
                    <Shield size={28} className="text-green-400" />
                  </div>
                  <h2 className="text-3xl font-black tracking-tight text-white">
                      {t.users.title}
                  </h2>
               </div>
               <p className="text-slate-400 text-sm max-w-xl font-medium ml-1">
                  {t.users.subtitle}
               </p>
            </div>
            
            <div className="flex gap-2">
                <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-bold backdrop-blur-sm border border-white/10 transition-all text-xs">
                    <Download size={16} /> {t.common.template}
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-3 rounded-xl font-bold backdrop-blur-sm border border-white/10 transition-all text-xs">
                    <Upload size={16} /> {t.database.importCsv}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} title="Import CSV File" aria-label="Import CSV File" />
                
                <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-green-500/30 transition-all transform hover:-translate-y-0.5 text-sm">
                    <Plus size={18} />
                    <span>{t.users.addUser}</span>
                </button>
            </div>
         </div>

         <div className="flex gap-8 mt-8 border-t border-white/10 pt-6">
             <div>
                 <div className="text-3xl font-black">{users.length}</div>
                 <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t.common.stats.totalUsers}</div>
             </div>
             <div className="w-px bg-white/10 h-10"></div>
             <div>
                 <div className="text-3xl font-black text-green-400">{users.filter(u => u.status === 'Active').length}</div>
                 <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t.common.stats.active}</div>
             </div>
             <div className="w-px bg-white/10 h-10"></div>
             <div>
                 <div className="text-3xl font-black text-blue-400">{users.filter(u => u.role === UserRole.SYSTEM_ADMIN).length}</div>
                 <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">{t.common.stats.admins}</div>
             </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden relative min-h-[500px]">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" placeholder={t.common.search} className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none transition-all shadow-sm" value={filterQuery} onChange={(e) => { setFilterQuery(e.target.value); setCurrentPage(1); }} />
            </div>
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.common.rowsPerPage}</span>
                    <select value={itemsPerPage} onChange={handlePageSizeChange} className="text-sm font-bold bg-transparent outline-none text-slate-800 dark:text-white cursor-pointer" title={t.common.rowsPerPage} aria-label={t.common.rowsPerPage}>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                        <option value={80}>80</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-auto">
            {paginatedUsers.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                    <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.users.table.user}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">{t.common.company}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">{t.common.jobTitle}</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Site</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.users.table.role}</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.users.table.status}</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.users.table.actions}</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700">
                    {paginatedUsers.map((u) => {
                    const bgColors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500', 'bg-teal-500'];
                    const colorClass = bgColors[u.id % bgColors.length];
                    return (
                    <tr key={String(u.id)} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                        <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full ${colorClass} flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white dark:ring-slate-700`}>
                            {(u.name || 'U').charAt(0)}
                            </div>
                            <div className="ml-4">
                            <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{u.name || '-'}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5"><Mail size={10} />{u.email || '-'}</div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><div className="text-sm font-medium text-slate-700 dark:text-slate-300">{u.company || '-'}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell"><div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400"><Briefcase size={14} className="text-slate-400" />{u.jobTitle || '-'}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400"><MapPin size={14} className="text-slate-400" />{getSiteName(u.siteId)}</div></td>
                        <td className="px-6 py-4 whitespace-nowrap"><span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getRoleColor(u.role)}`}><Key size={10} />{u.role || '-'}</span></td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                            {u.status === 'Active' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-green-50 text-green-600 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"><CheckCircle2 size={12} /> {t.database.active}</span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"><XCircle size={12} /> Inactive</span>
                            )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                        <button onClick={() => setOpenActionId(openActionId === u.id ? null : u.id)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Actions Menu" aria-label="Actions Menu"><MoreVertical size={18} /></button>
                        {openActionId === u.id && (
                            <div className="absolute right-10 top-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up">
                                <button onClick={() => { setEditingUser(u); setIsModalOpen(true); setOpenActionId(null); }} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-300 transition-colors"><Edit size={14} /> {t.common.edit}</button>
                                <button onClick={() => handleDeleteUser(u.id)} className="w-full text-left px-4 py-3 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2 transition-colors border-t border-slate-100 dark:border-slate-700"><Trash2 size={14} /> {t.common.delete}</button>
                            </div>
                        )}
                        </td>
                    </tr>
                    )})}
                </tbody>
                </table>
            ) : (
                <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                    <div className="bg-slate-50 dark:bg-slate-900 p-8 rounded-full mb-6 ring-4 ring-slate-100 dark:ring-slate-800">
                        <Users size={64} className="opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300">No users found</h3>
                    <p className="text-sm mt-2 text-center max-w-md">This may be due to active site filters or database **RLS security policies**. <br/> Please check the **Technical Docs** to fix security errors.</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="mt-8 flex items-center gap-2 text-blue-600 font-bold hover:bg-blue-50 px-4 py-2 rounded-lg transition-all"
                    >
                        <RefreshCw size={16} /> Try Reconnecting
                    </button>
                </div>
            )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
             <div className="flex items-center gap-4">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.common.page} {currentPage} {t.common.of} {Math.max(1, totalPages)} • {users.length} Total</div>
                 <div className="flex gap-2">
                    <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors text-slate-600 dark:text-slate-300" title="Previous Page" aria-label="Previous Page"><ChevronLeft size={16} /></button>
                    <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors text-slate-600 dark:text-slate-300" title="Next Page" aria-label="Next Page"><ChevronRight size={16} /></button>
                 </div>
             </div>
        </div>
      </div>

      <ConfirmModal isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))} isDestructive={confirmState.isDestructive} confirmText={t.common.delete} cancelText={t.common.cancel} />

      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-lg p-0 overflow-hidden transform transition-all scale-100 border border-slate-200 dark:border-slate-700">
                   <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                       <div>
                           <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                               {editingUser ? 'Edit User Profile' : t.users.modal.title}
                           </h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                               {editingUser ? 'Modify user details and roles.' : 'Create a new system user profile.'}
                           </p>
                       </div>
                       <button onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-full hover:bg-white dark:hover:bg-slate-700 transition-colors" title="Close Modal" aria-label="Close Modal"><X size={20} /></button>
                   </div>
                   <div className="p-8 space-y-5">
                       <div>
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.users.modal.name}</label>
                           <input 
                               className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none text-slate-900 dark:text-white transition-all" 
                               value={editingUser ? (editingUser.name || '') : (newUser.name || '')} 
                               onChange={e => {
                                   if (editingUser) setEditingUser({...editingUser, name: e.target.value});
                                   else setNewUser({...newUser, name: e.target.value});
                               }} 
                               placeholder="Full Name" 
                           />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.users.modal.email}</label>
                           <input 
                               className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none text-slate-900 dark:text-white transition-all" 
                               value={editingUser ? (editingUser.email || '') : (newUser.email || '')} 
                               onChange={e => {
                                   if (editingUser) setEditingUser({...editingUser, email: e.target.value});
                                   else setNewUser({...newUser, email: e.target.value});
                               }} 
                               placeholder="email@example.com" 
                               disabled={!!editingUser}
                           />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">Phone Number</label>
                           <div className="relative">
                               <input 
                                   className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 pl-10 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none text-slate-900 dark:text-white transition-all" 
                                   value={editingUser ? (editingUser.phoneNumber || '') : (newUser.phoneNumber || '')} 
                                   onChange={e => {
                                       if (editingUser) setEditingUser({...editingUser, phoneNumber: e.target.value});
                                       else setNewUser({...newUser, phoneNumber: e.target.value});
                                   }} 
                                   placeholder="+258 84..." 
                               />
                               <Smartphone size={16} className="absolute left-3 top-3.5 text-slate-400" />
                           </div>
                       </div>
                       <div className="grid grid-cols-2 gap-5">
                           <div>
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.common.company}</label>
                               <select 
                                   className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none text-slate-900 dark:text-white appearance-none" 
                                   value={editingUser ? (editingUser.company || '') : (newUser.company || '')} 
                                   onChange={e => {
                                       if (editingUser) setEditingUser({...editingUser, company: e.target.value});
                                       else setNewUser({...newUser, company: e.target.value});
                                   }}
                                   title="Company"
                               >
                                   {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                               </select>
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.common.role}</label>
                               <select 
                                   className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none text-slate-900 dark:text-white appearance-none" 
                                   value={editingUser ? (editingUser.role || '') : (newUser.role || '')} 
                                   onChange={e => {
                                       if (editingUser) setEditingUser({...editingUser, role: e.target.value as UserRole});
                                       else setNewUser({...newUser, role: e.target.value as UserRole});
                                   }}
                                   title="Role"
                               >
                                    {Object.values(UserRole).map(r => <option key={String(r)} value={String(r)}>{String(r)}</option>)}
                                </select>
                           </div>
                       </div>
                       <div className="grid grid-cols-2 gap-5">
                           <div>
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">{t.common.jobTitle}</label>
                               <input 
                                   className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-semibold focus:ring-2 focus:ring-green-500 outline-none text-slate-900 dark:text-white transition-all" 
                                   value={editingUser ? (editingUser.jobTitle || '') : (newUser.jobTitle || '')} 
                                   onChange={e => {
                                       if (editingUser) setEditingUser({...editingUser, jobTitle: e.target.value});
                                       else setNewUser({...newUser, jobTitle: e.target.value});
                                   }} 
                                   placeholder="e.g. Safety Officer" 
                               />
                           </div>
                           <div>
                               <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block ml-1">Site</label>
                               <select 
                                   className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl p-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 dark:text-white appearance-none" 
                                   value={editingUser ? (editingUser.siteId || '') : (newUser.siteId || '')} 
                                   onChange={e => {
                                       if (editingUser) setEditingUser({...editingUser, siteId: e.target.value});
                                       else setNewUser({...newUser, siteId: e.target.value});
                                   }}
                                   title="Site"
                               >
                                   <option value="all">Enterprise (Global)</option>
                                   {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                               </select>
                           </div>
                       </div>
                       {editingUser && (
                           <div>
                               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Account Status</label>
                               <select 
                                   className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                                   value={editingUser.status || 'Active'} 
                                   onChange={e => setEditingUser({...editingUser, status: e.target.value as 'Active' | 'Inactive'})}
                                   title="Account Status"
                               >
                                   <option value="Active">Active</option>
                                   <option value="Inactive">Inactive</option>
                               </select>
                           </div>
                       )}
                       <div>
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">App Module Access</label>
                           <select 
                               className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                               value={editingUser ? (editingUser.appModule || 'both') : (newUser.appModule || 'both')} 
                               onChange={e => {
                                   if (editingUser) setEditingUser({...editingUser, appModule: e.target.value as 'mobilization' | 'training' | 'both'});
                                   else setNewUser({...newUser, appModule: e.target.value as 'mobilization' | 'training' | 'both'});
                               }}
                               title="App Module Access"
                           >
                               <option value="both">Both (SaaS Suite)</option>
                               <option value="mobilization">Mobilization Only</option>
                               <option value="training">Training Only</option>
                           </select>
                       </div>
                   </div>
                   <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                       <button onClick={() => { setIsModalOpen(false); setEditingUser(null); }} className="px-6 py-3 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold transition-colors">{t.common.cancel}</button>
                       <button onClick={handleSaveUser} disabled={isSubmitting} className="px-8 py-3 text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 disabled:opacity-50">
                           {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : (editingUser ? <CheckCircle2 size={18} /> : <Plus size={18} />)} 
                           {editingUser ? 'Save Changes' : t.users.modal.createUser}
                       </button>
                   </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default UserManagement;
