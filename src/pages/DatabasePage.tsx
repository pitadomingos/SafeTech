
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Booking, BookingStatus, EmployeeRequirement, Employee, TrainingSession, RacDef, SystemNotification, Company } from '../types';
import { Search, CheckCircle, XCircle, Edit, ChevronLeft, ChevronRight, Download, X, Trash2, QrCode, Printer, FileSpreadsheet, Filter, Cloud, CloudOff, Loader2, Archive, ArrowRight, Upload, FileDown, Plus, RefreshCw, Users, ShieldCheck, Database as DbIcon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import JSZip from 'jszip';
import ConfirmModal from '../components/ConfirmModal';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { isSupabaseConfigured } from '../services/supabaseClient';
import RacIcon from '../components/RacIcon';
import { parseCsv } from '../utils/csvParser';
import { db } from '../services/databaseService';
import { useAuth } from '../contexts/AuthContext';
import { isCompanyDescendant } from '../utils/companyUtils';

interface DatabasePageProps {
  employees: Employee[];
  bookings: Booking[];
  requirements: EmployeeRequirement[];
  updateRequirements: (req: EmployeeRequirement) => void;
  sessions: TrainingSession[];
  onUpdateEmployee: (id: string, updates: Partial<Employee>) => void;
  onDeleteEmployee: (id: string) => void;
  racDefinitions: RacDef[];
  addNotification: (notif: SystemNotification) => void;
  currentSiteId: string;
  companies?: Company[];
  activeModule?: string | null;
}

const DatabasePage: React.FC<DatabasePageProps> = ({ employees = [], bookings, requirements, updateRequirements, sessions, onUpdateEmployee, onDeleteEmployee, racDefinitions, addNotification, currentSiteId, companies = [], activeModule }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [qrEmployee, setQrEmployee] = useState<Employee | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDestructive: false });

  // Reset currentPage on search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCompany]);

  const getRequirement = (empId: string): EmployeeRequirement => {
    return requirements.find(r => r.employeeId === empId) || { employeeId: empId, asoExpiryDate: '', requiredRacs: {} };
  };

  const getTrainingStatus = (empId: string, racCode: string): string | null => {
    const today = new Date().toISOString().split('T')[0];
    const matched = bookings.filter(b => {
        if (b.employee?.id !== empId) return false;
        if (b.status !== BookingStatus.PASSED) return false;
        if (!b.expiryDate || b.expiryDate <= today) return false;
        const session = sessions.find(s => s.id === b.sessionId);
        if (!session) return false;
        const code = session.racType.split(' - ')[0].replace(/\s+/g, '').toUpperCase();
        return code === racCode.toUpperCase();
    });
    matched.sort((a, b) => new Date(b.expiryDate || '').getTime() - new Date(a.expiryDate || '').getTime());
    return matched[0]?.expiryDate || null;
  };

  const handleRequirementChange = (empId: string, racKey: string, isRequired: boolean) => {
    const current = getRequirement(empId);
    const updated = { ...current, requiredRacs: { ...current.requiredRacs, [racKey]: isRequired } };
    updateRequirements(updated);
  };

  const processedData = useMemo(() => {
    const uniqueEmployeesMap = new Map<string, Employee>();
    employees.forEach(emp => { if (emp && !uniqueEmployeesMap.has(emp.id)) uniqueEmployeesMap.set(emp.id, emp); });
    bookings.forEach(b => { if (b.employee && !uniqueEmployeesMap.has(b.employee.id)) uniqueEmployeesMap.set(b.employee.id, b.employee); });
    
    return Array.from(uniqueEmployeesMap.values()).map(emp => {
      const req = getRequirement(emp.id);
      const today = new Date().toISOString().split('T')[0];
      const isAsoValid = !!(req.asoExpiryDate && req.asoExpiryDate >= today);
      const isActive = emp.isActive ?? true;

      let allRacsMet = true;
      racDefinitions.forEach(def => {
          if (req.requiredRacs[def.code]) {
              const status = getTrainingStatus(emp.id, def.code);
              if (!status) allRacsMet = false;
          }
      });

      return { emp, req, status: (isActive && isAsoValid && allRacsMet) ? 'Granted' : 'Blocked' };
    }).filter(item => {
        if (currentSiteId !== 'all' && item.emp.siteId !== currentSiteId) return false;
        
        if (selectedCompany !== 'All') {
            const companyObj = companies.find(c => c.name === item.emp.company);
            const parentFilterObj = companies.find(c => c.name === selectedCompany);
            if (item.emp.company === selectedCompany) return true;
            if (companyObj && parentFilterObj && isCompanyDescendant(companyObj.id, parentFilterObj.id, companies)) return true;
            return false;
        }

        if (searchTerm) {
            const low = searchTerm.toLowerCase();
            return item.emp.name.toLowerCase().includes(low) || item.emp.recordId.toLowerCase().includes(low);
        }
        return true;
    });
  }, [bookings, requirements, racDefinitions, selectedCompany, searchTerm, currentSiteId, companies]);

  const paginatedData = processedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleDownloadTemplate = () => {
    const headers = ['Record ID', 'Full Name', 'Company', 'Department', 'Role', 'Medical (ASO) Expiry', 'Required RACs (Comma separated codes e.g. RAC01,RAC02)'];
    const sample = ['VUL-1001', 'Jane Doe', 'Vulcan', 'HSE', 'Safety Officer', format(new Date(), 'yyyy-MM-dd'), 'RAC01,RAC05'];
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), sample.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "personnel_registry_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
        const text = evt.target?.result as string;
        const rows = parseCsv(text);
        const batch: Partial<Employee>[] = [];
        const reqs: EmployeeRequirement[] = [];

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i];
            if (cols && cols[0] && cols[1]) {
                const empId = uuidv4();
                batch.push({
                    id: empId,
                    recordId: cols[0],
                    name: cols[1],
                    company: cols[2] || 'Unknown',
                    department: cols[3] || 'N/A',
                    role: cols[4] || 'N/A',
                    isActive: true,
                    siteId: currentSiteId !== 'all' ? currentSiteId : undefined,
                    appModule: (activeModule as 'mobilization' | 'training' | 'both') || 'both'
                });

                const reqRacs: Record<string, boolean> = {};
                if (cols[6]) {
                    cols[6].split(/[;,]/).forEach(c => {
                        if (c.trim()) reqRacs[c.trim().toUpperCase()] = true;
                    });
                }
                
                reqs.push({
                    employeeId: empId,
                    asoExpiryDate: cols[5] || '',
                    requiredRacs: reqRacs
                });
            }
        }

        try {
            const dbEmployees = await db.bulkUpsertEmployees(batch);
            
            const idMap = new Map<string, string>();
            dbEmployees.forEach((e: any) => idMap.set(e.record_id, e.id));

            const reqsToUpsert = reqs.map((r, idx) => {
                const empRecordId = batch[idx].recordId!;
                const realId = idMap.get(empRecordId) || r.employeeId;
                return {
                    ...r,
                    employeeId: realId
                };
            });

            if (reqsToUpsert.length > 0) {
                await db.bulkUpsertRequirements(reqsToUpsert);
            }

            addNotification({
                id: uuidv4(),
                type: 'success',
                title: 'Cloud Registry Updated',
                message: `Successfully imported ${batch.length} personnel records.`,
                timestamp: new Date(),
                isRead: false
            });
        } catch (err) {
            console.error(err);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            window.location.reload();
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col h-auto md:h-[calc(100vh-6rem)] bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden relative animate-fade-in">
        
        {/* --- HEADER --- */}
        <div className="p-8 border-b border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col xl:flex-row justify-between gap-6">
             <div className="flex items-center gap-6">
                 <div className="p-4 bg-indigo-600 rounded-[1.5rem] text-white shadow-xl shadow-indigo-600/20">
                    <Users size={28} />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">Personnel Registry</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Authorized Site Access Matrix</p>
                 </div>
             </div>

             <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-4 py-2.5 shadow-sm">
                    <Filter size={16} className="text-slate-400" />
                    <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} title="Filter by company" aria-label="Filter by company" className="text-sm font-bold bg-transparent outline-none text-slate-800 dark:text-white cursor-pointer pr-4">
                        <option value="All">All Companies</option>
                        {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                 </div>
                 
                 <div className="relative w-64">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input type="text" placeholder="Search ID or Name..." title="Search ID or Name" aria-label="Search personnel by ID or Name" className="w-full pl-11 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium bg-white dark:bg-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                 </div>

                 <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-2"></div>

                 <div className="flex gap-2">
                    <button 
                        onClick={handleDownloadTemplate} 
                        className="p-3 bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-600 hover:bg-slate-50 transition-all shadow-sm" 
                        title="Download CSV Template"
                    >
                        <FileDown size={20}/>
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isImporting}
                        className="flex items-center gap-2 bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
                    >
                        {isImporting ? <RefreshCw size={16} className="animate-spin"/> : <Upload size={16} />}
                        <span>{isImporting ? 'Processing' : 'Import CSV'}</span>
                    </button>
                    <input type="file" id="csv-file-input" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} title="Upload CSV Registry" aria-label="Upload CSV Registry" />
                 </div>
             </div>
        </div>

        {/* --- GRID TABLE --- */}
        <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-slate-700 border-separate border-spacing-0">
                <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                    <tr>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Access Identity</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Company & Role</th>
                        <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Medical (ASO)</th>
                        {racDefinitions.map(rac => (
                            <th key={rac.id} className="px-2 py-4 text-center text-[10px] font-black text-indigo-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                                <div className="flex flex-col items-center gap-1.5">
                                    <RacIcon racCode={rac.code} racName={rac.name} size={16} />
                                    <span>{rac.code}</span>
                                </div>
                            </th>
                        ))}
                        <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">Audit</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-50 dark:divide-slate-700/50">
                    {paginatedData.map(({ emp, req, status }) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors group">
                            <td className="px-8 py-5 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${status === 'Granted' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{emp.name}</div>
                                        <div className="text-[10px] font-mono text-slate-500 uppercase tracking-tight">{emp.recordId}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300">{emp.role}</div>
                                <div className="text-[10px] text-slate-400 uppercase font-black tracking-widest mt-0.5">{emp.company}</div>
                            </td>
                            <td className="px-8 py-5 whitespace-nowrap">
                                <div className="flex flex-col">
                                    <span className={`text-xs font-black font-mono ${req.asoExpiryDate && req.asoExpiryDate >= new Date().toISOString().split('T')[0] ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {req.asoExpiryDate || 'EXPIRED'}
                                    </span>
                                    <div className="text-[8px] text-slate-400 uppercase font-black">VALIDITY DATE</div>
                                </div>
                            </td>
                            {racDefinitions.map(rac => {
                                const expiry = getTrainingStatus(emp.id, rac.code);
                                const isRequired = !!req.requiredRacs[rac.code];
                                return (
                                    <td key={rac.id} className="px-1 py-5 text-center">
                                        <div className="flex flex-col items-center gap-1.5">
                                            <button
                                                aria-label={`Toggle ${rac.code} requirement for ${emp.name}`}
                                                title={`${isRequired ? 'Remove' : 'Add'} ${rac.code} requirement`}
                                                onClick={() => handleRequirementChange(emp.id, rac.code, !isRequired)}
                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all hover:scale-110 cursor-pointer ${isRequired ? 'bg-indigo-600 border-indigo-600 shadow-md shadow-indigo-400/30' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-400'}`}
                                            >
                                                {isRequired && <CheckCircle size={14} className="text-white" />}
                                            </button>
                                            {isRequired && (
                                                <div className={`text-[8px] font-black px-1.5 rounded uppercase ${expiry ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {expiry ? format(new Date(expiry), 'dd/MM/yy') : 'MISSING'}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                );

                            })}
                            <td className="px-8 py-5 text-right whitespace-nowrap">
                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button aria-label="View QR code" onClick={() => setQrEmployee(emp)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" title="View Verification QR"><QrCode size={18}/></button>
                                    <button aria-label="Edit employee" onClick={() => setEditingEmployee(emp)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all" title="Edit Employee"><Edit size={18}/></button>
                                    <button aria-label="Delete employee" onClick={() => setConfirmState({ isOpen: true, title: t.database.deleteEmployee, message: t.database.deleteEmployeeConfirm.replace('{name}', emp.name).replace('{recordId}', emp.recordId), isDestructive: true, onConfirm: () => { onDeleteEmployee(emp.id); setConfirmState(s => ({ ...s, isOpen: false })); } })} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title="Delete Employee"><Trash2 size={18}/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    {processedData.length === 0 && (
                        <tr>
                            <td colSpan={3 + racDefinitions.length + 1} className="py-24 text-center">
                                <div className="flex flex-col items-center gap-4 text-slate-300">
                                    <Search size={64} className="opacity-20" />
                                    <p className="text-lg font-black uppercase tracking-widest">Zero Matching Personnel Discovered</p>
                                    <p className="text-sm text-slate-400 font-medium">Check your filters or upload a registry via CSV above.</p>
                                </div>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>

        {/* --- FOOTER PAGINATION --- */}
        <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <DbIcon size={14} className="text-slate-300" />
                    <span>Total Workforce Index: {processedData.length}</span>
                </div>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-700"></div>
                <span>Page {currentPage} of {Math.ceil(processedData.length / itemsPerPage) || 1}</span>
                <div className="h-3 w-px bg-slate-200 dark:bg-slate-700"></div>
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span>Rows per page:</span>
                    <select
                        value={itemsPerPage}
                        onChange={e => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                        }}
                        title="Rows per page"
                        className="bg-white dark:bg-slate-805 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                    >
                        {[20, 30, 50, 80, 100].map(val => (
                            <option key={val} value={val}>{val}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    <ChevronLeft size={16} /> Prev
                </button>
                <button onClick={() => setCurrentPage(p => p+1)} disabled={currentPage >= Math.ceil(processedData.length / itemsPerPage)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-50 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                    Next <ChevronRight size={16} />
                </button>
            </div>
        </div>

        {/* --- CONFIRM MODAL --- */}
        <ConfirmModal
            isOpen={confirmState.isOpen}
            title={confirmState.title}
            message={confirmState.message}
            onConfirm={confirmState.onConfirm}
            onClose={() => setConfirmState(s => ({ ...s, isOpen: false }))}
            confirmText={confirmState.isDestructive ? t.common.delete : t.common.confirm}
            cancelText={t.common.cancel}
            isDestructive={confirmState.isDestructive}
        />

        {/* --- QR CODE MODAL --- */}
        {qrEmployee && (
            <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setQrEmployee(null)}>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-xs w-full flex flex-col items-center gap-4 border border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                    <div className="w-full flex justify-between items-start">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Site Access QR</h3>
                            <p className="text-xs text-slate-400 font-mono">{qrEmployee.recordId}</p>
                        </div>
                        <button aria-label="Close QR modal" onClick={() => setQrEmployee(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X size={16}/></button>
                    </div>
                    <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}#/verify/${qrEmployee.recordId}`)}`}
                        alt={`QR code for ${qrEmployee.name}`}
                        className="w-48 h-48 rounded-xl border-4 border-slate-100 dark:border-slate-700 shadow-sm"
                    />
                    <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                        Scan to verify <span className="font-bold text-slate-700 dark:text-slate-200">{qrEmployee.name}</span>'s site access authorization
                    </p>
                    <button onClick={() => setQrEmployee(null)} className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-bold text-sm hover:opacity-90 transition-opacity">Close</button>
                </div>
            </div>
        )}

        {/* --- EDIT EMPLOYEE MODAL --- */}
        {editingEmployee && (
            <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setEditingEmployee(null)}>
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Edit Employee</h3>
                            <p className="text-xs font-mono text-slate-400">{editingEmployee.recordId}</p>
                        </div>
                        <button aria-label="Close edit modal" onClick={() => setEditingEmployee(null)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400"><X size={16}/></button>
                    </div>
                    <div className="space-y-4">
                        {([
                            { label: 'Full Name', field: 'name' as const },
                            { label: 'Role / Job Title', field: 'role' as const },
                            { label: 'Department', field: 'department' as const },
                            { label: 'Company', field: 'company' as const },
                        ]).map(({ label, field }) => (
                            <div key={field}>
                                <label htmlFor={`edit-emp-${field}`} className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">{label}</label>
                                <input
                                    type="text"
                                    id={`edit-emp-${field}`}
                                    placeholder={label}
                                    title={label}
                                    aria-label={label}
                                    value={(editingEmployee as any)[field] || ''}
                                    onChange={e => setEditingEmployee(prev => prev ? { ...prev, [field]: e.target.value } : null)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                        ))}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                            <input
                                type="checkbox"
                                id="emp-active"
                                checked={editingEmployee.isActive ?? true}
                                onChange={e => setEditingEmployee(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                                className="w-4 h-4 rounded accent-indigo-600"
                            />
                            <label htmlFor="emp-active" className="text-sm font-bold text-slate-700 dark:text-slate-200">Active Employee</label>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">App Module Access</label>
                            <select 
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                                value={editingEmployee.appModule || 'both'} 
                                onChange={e => setEditingEmployee(prev => prev ? { ...prev, appModule: e.target.value as 'mobilization' | 'training' | 'both' } : null)}
                                title="App Module Access"
                            >
                                <option value="both">Both (SaaS Suite)</option>
                                <option value="mobilization">Mobilization Only</option>
                                <option value="training">Training Only</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                        <button onClick={() => setEditingEmployee(null)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">Cancel</button>
                        <button
                            onClick={() => {
                                onUpdateEmployee(editingEmployee.id, editingEmployee);
                                setEditingEmployee(null);
                                addNotification({ id: String(Date.now()), type: 'success', title: 'Employee Updated', message: `${editingEmployee.name} record saved.`, timestamp: new Date(), isRead: false });
                            }}
                            className="flex-1 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                        >Save Changes</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default DatabasePage;
