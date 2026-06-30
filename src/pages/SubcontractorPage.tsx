
import React, { useState, useMemo, useEffect } from 'react';
import {
    Briefcase, Plus, Search, Edit2, Trash2, ChevronDown, ChevronLeft,
    Building2, Users, Shield, AlertTriangle, CheckCircle2,
    X, Phone, Mail, User, ChevronRight, Filter, BarChart3
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Company } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface SubcontractorEntry {
    id: string;
    companyName: string;
    mainContractorId: string; // id of parent Company
    contactPerson: string;
    email: string;
    phone: string;
    status: 'Active' | 'Inactive';
    complianceScore: number; // 0-100
    employeeCount: number;
    createdAt: string;
}

interface SubcontractorPageProps {
    companies: Company[];
}

// Seed demo data based on known company structure
const INITIAL_SUBS: SubcontractorEntry[] = [
    {
        id: 'sub-001',
        companyName: 'ProDrill Services Lda',
        mainContractorId: 'c2',
        contactPerson: 'Augusto Mabunda',
        email: 'a.mabunda@prodrill.co.mz',
        phone: '+258 82 301 0001',
        status: 'Active',
        complianceScore: 91,
        employeeCount: 24,
        createdAt: '2024-01-15T08:00:00Z'
    },
    {
        id: 'sub-002',
        companyName: 'SafeGuard Technical Lda',
        mainContractorId: 'c2',
        contactPerson: 'Isabel Tembe',
        email: 'i.tembe@safeguard.co.mz',
        phone: '+258 84 201 0202',
        status: 'Active',
        complianceScore: 77,
        employeeCount: 11,
        createdAt: '2024-02-20T09:00:00Z'
    },
    {
        id: 'sub-003',
        companyName: 'CivilBuild Moçambique',
        mainContractorId: 'c3',
        contactPerson: 'Natália Bila',
        email: 'n.bila@civilbuild.co.mz',
        phone: '+258 86 400 3000',
        status: 'Active',
        complianceScore: 55,
        employeeCount: 38,
        createdAt: '2024-03-10T10:00:00Z'
    },
    {
        id: 'sub-004',
        companyName: 'ElectroTech Sarl',
        mainContractorId: 'c3',
        contactPerson: 'João Paulo Chaves',
        email: 'jp.chaves@electrotech.co.mz',
        phone: '+258 82 511 7788',
        status: 'Inactive',
        complianceScore: 30,
        employeeCount: 8,
        createdAt: '2023-11-05T07:00:00Z'
    },
    {
        id: 'sub-005',
        companyName: 'MechServ Moatize',
        mainContractorId: 'c1',
        contactPerson: 'Fátima Nhantumbo',
        email: 'f.nhantumbo@mechserv.co.mz',
        phone: '+258 84 600 0099',
        status: 'Active',
        complianceScore: 98,
        employeeCount: 52,
        createdAt: '2024-04-01T08:00:00Z'
    },
];

const emptyForm: Omit<SubcontractorEntry, 'id' | 'complianceScore' | 'employeeCount' | 'createdAt'> = {
    companyName: '',
    mainContractorId: '',
    contactPerson: '',
    email: '',
    phone: '',
    status: 'Active',
};

const SubcontractorPage: React.FC<SubcontractorPageProps> = ({ companies }) => {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { confirm } = useToast();
    const ts = t.subcontractors;

    const [subs, setSubs] = useState<SubcontractorEntry[]>(() => {
        const stored = localStorage.getItem('subcontractors_data');
        return stored ? JSON.parse(stored) : INITIAL_SUBS;
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
    const [filterContractor, setFilterContractor] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(emptyForm);
    const [selectedId, setSelectedId] = useState<string | null>(subs[0]?.id || null);

    const persist = (updated: SubcontractorEntry[]) => {
        setSubs(updated);
        localStorage.setItem('subcontractors_data', JSON.stringify(updated));
    };

    const filtered = useMemo(() => {
        return subs.filter(s => {
            const matchSearch = s.companyName.toLowerCase().includes(searchQuery.toLowerCase())
                || s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())
                || s.email.toLowerCase().includes(searchQuery.toLowerCase());
            const matchStatus = filterStatus === 'All' || s.status === filterStatus;
            const matchContractor = filterContractor === 'all' || s.mainContractorId === filterContractor;
            return matchSearch && matchStatus && matchContractor;
        });
    }, [subs, searchQuery, filterStatus, filterContractor]);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);

    const totalPages = Math.ceil(filtered.length / rowsPerPage);
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages > 0 ? totalPages : 1);
        }
    }, [filtered.length, rowsPerPage, totalPages, currentPage]);

    const selected = subs.find(s => s.id === selectedId);

    const getCompanyName = (id: string) => {
        const c = companies.find(c => c.id === id);
        return c?.name || id;
    };

    const getComplianceColor = (score: number) => {
        if (score >= 80) return 'text-emerald-500';
        if (score >= 60) return 'text-amber-500';
        return 'text-red-500';
    };

    const getComplianceBg = (score: number) => {
        if (score >= 80) return 'bg-emerald-500';
        if (score >= 60) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getComplianceLabel = (score: number) => {
        if (score >= 80) return ts.compliance.compliant;
        if (score >= 60) return ts.compliance.atRisk;
        return ts.compliance.nonCompliant;
    };

    const openAdd = () => {
        setFormData({ ...emptyForm, mainContractorId: companies[0]?.id || '' });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEdit = (sub: SubcontractorEntry) => {
        setFormData({
            companyName: sub.companyName,
            mainContractorId: sub.mainContractorId,
            contactPerson: sub.contactPerson,
            email: sub.email,
            phone: sub.phone,
            status: sub.status,
        });
        setEditingId(sub.id);
        setIsModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            const updated = subs.map(s => s.id === editingId ? { ...s, ...formData } : s);
            persist(updated);
        } else {
            const newEntry: SubcontractorEntry = {
                ...formData,
                id: `sub-${uuidv4().slice(0, 8)}`,
                complianceScore: 100,
                employeeCount: 0,
                createdAt: new Date().toISOString()
            };
            persist([newEntry, ...subs]);
            setSelectedId(newEntry.id);
        }
        setIsModalOpen(false);
    };

    const handleDelete = async (id: string) => {
        if (await confirm(language === 'pt' ? 'Eliminar Subempreiteiro' : 'Delete Subcontractor', ts.confirmDelete)) {
            const updated = subs.filter(s => s.id !== id);
            persist(updated);
            if (selectedId === id) {
                setSelectedId(updated[0]?.id || null);
            }
        }
    };

    // Summary stats
    const totalActive = subs.filter(s => s.status === 'Active').length;
    const fullyCompliant = subs.filter(s => s.complianceScore >= 80).length;
    const atRisk = subs.filter(s => s.complianceScore < 60).length;

    return (
        <div className="space-y-6 pb-20 animate-fade-in">

            {/* ─── Header Banner ─── */}
            <div className="bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-violet-800/40">
                <div className="absolute top-[-20%] right-[-10%] w-72 h-72 bg-violet-500/10 blur-[80px] rounded-full pointer-events-none" />
                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-violet-600 rounded-2xl shadow-lg border border-violet-400/20">
                            <Briefcase size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight uppercase italic">{ts.title}</h1>
                            <p className="text-violet-300 font-bold uppercase tracking-widest text-[10px]">{ts.subtitle}</p>
                        </div>
                    </div>
                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-2xl shadow-lg hover:scale-105 transition-all active:scale-95"
                    >
                        <Plus size={16} />
                        {ts.addSubcontractor}
                    </button>
                </div>
            </div>

            {/* ─── Stats Row ─── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: ts.stats.total, value: subs.length, icon: Briefcase, color: 'from-violet-600 to-violet-800', text: 'text-violet-400' },
                    { label: ts.stats.active, value: totalActive, icon: CheckCircle2, color: 'from-emerald-600 to-emerald-800', text: 'text-emerald-400' },
                    { label: ts.stats.compliant, value: fullyCompliant, icon: Shield, color: 'from-blue-600 to-blue-800', text: 'text-blue-400' },
                    { label: ts.stats.atRisk, value: atRisk, icon: AlertTriangle, color: 'from-red-600 to-red-800', text: 'text-red-400' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                            <stat.icon size={22} className="text-white" />
                        </div>
                        <div>
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Main Workspace ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: List Panel */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">

                    {/* Search & Filters */}
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder={ts.search}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 text-slate-900 dark:text-white transition-colors"
                                />
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {(['All', 'Active', 'Inactive'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilterStatus(f)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                        filterStatus === f
                                        ? 'bg-violet-600 text-white shadow-md'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {f}
                                </button>
                            ))}
                             <select
                                value={filterContractor}
                                onChange={e => setFilterContractor(e.target.value)}
                                title={ts.table.mainContractor}
                                className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-none outline-none cursor-pointer"
                            >
                                <option value="all">{ts.table.mainContractor}: All</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="hidden lg:grid grid-cols-12 px-6 py-3 bg-slate-50 dark:bg-slate-900/40 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-700">
                        <div className="col-span-4">{ts.table.company}</div>
                        <div className="col-span-3">{ts.table.mainContractor}</div>
                        <div className="col-span-2 text-center">{ts.table.compliance}</div>
                        <div className="col-span-2 text-center">{ts.table.employees}</div>
                        <div className="col-span-1 text-right">{ts.table.actions}</div>
                    </div>

                    {/* Table Rows */}
                    <div className="flex-1 overflow-y-auto max-h-[460px] divide-y divide-slate-100 dark:divide-slate-700">
                        {filtered.length === 0 && (
                            <div className="p-12 text-center text-slate-400">
                                <Briefcase size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="font-bold text-sm">{ts.noResults}</p>
                            </div>
                        )}
                        {filtered.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage).map(sub => (
                            <div
                                key={sub.id}
                                onClick={() => setSelectedId(sub.id)}
                                className={`grid grid-cols-12 items-center px-6 py-4 cursor-pointer transition-all group ${
                                    selectedId === sub.id
                                    ? 'bg-violet-50 dark:bg-violet-900/20 border-l-4 border-violet-500'
                                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/30 border-l-4 border-transparent'
                                }`}
                            >
                                {/* Company + Contact */}
                                <div className="col-span-4 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950 flex items-center justify-center text-violet-600 dark:text-violet-400 font-black text-sm flex-shrink-0">
                                        {sub.companyName.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{sub.companyName}</div>
                                        <div className="text-[10px] text-slate-400 truncate">{sub.contactPerson}</div>
                                    </div>
                                </div>

                                {/* Main Contractor */}
                                <div className="col-span-3 text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
                                    {getCompanyName(sub.mainContractorId)}
                                </div>

                                {/* Compliance */}
                                <div className="col-span-2 flex flex-col items-center gap-1">
                                    <span className={`text-sm font-black ${getComplianceColor(sub.complianceScore)}`}>{sub.complianceScore}%</span>
                                    <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${getComplianceBg(sub.complianceScore)} w-pct-${sub.complianceScore}`} />
                                    </div>
                                </div>

                                {/* Employee Count */}
                                <div className="col-span-2 text-center text-sm font-bold text-slate-700 dark:text-slate-300">
                                    <div className="flex items-center justify-center gap-1">
                                        <Users size={12} className="text-slate-400" />
                                        {sub.employeeCount}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={e => { e.stopPropagation(); openEdit(sub); }}
                                        className="p-1.5 hover:bg-violet-100 dark:hover:bg-violet-900 text-violet-500 rounded-lg transition-colors"
                                        title={ts.editSubcontractor}
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={e => { e.stopPropagation(); handleDelete(sub.id); }}
                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900 text-red-400 rounded-lg transition-colors"
                                        title={ts.deleteSubcontractor}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Pagination Footer */}
                    {filtered.length > 0 && (
                        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                            <div className="flex items-center gap-2">
                                <span>Rows per page:</span>
                                <select
                                    title="Rows per page"
                                    value={rowsPerPage}
                                    onChange={e => {
                                        setRowsPerPage(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                                >
                                    {[20, 30, 50, 80, 100].map(val => (
                                        <option key={val} value={val}>{val}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-4">
                                <span>
                                    Showing {Math.min(filtered.length, (currentPage - 1) * rowsPerPage + 1)}-{Math.min(filtered.length, currentPage * rowsPerPage)} of {filtered.length}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                                        title="Previous Page"
                                    >
                                        <ChevronLeft size={14} />
                                    </button>
                                    <button
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                                        title="Next Page"
                                    >
                                        <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Detail Panel */}
                <div className="lg:col-span-5 space-y-4">
                    {selected ? (
                        <>
                            {/* Profile Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-800 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                                            {selected.companyName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 dark:text-white text-lg leading-tight">{selected.companyName}</h3>
                                            <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mt-1 inline-block ${
                                                selected.status === 'Active'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                                : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                                            }`}>
                                                {selected.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(selected)}
                                            title={language === 'pt' ? 'Editar Subempreiteiro' : 'Edit Subcontractor'}
                                            aria-label={language === 'pt' ? 'Editar Subempreiteiro' : 'Edit Subcontractor'}
                                            className="p-2 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-violet-500 rounded-xl transition-colors">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(selected.id)}
                                            title={language === 'pt' ? 'Excluir Subempreiteiro' : 'Delete Subcontractor'}
                                            aria-label={language === 'pt' ? 'Excluir Subempreiteiro' : 'Delete Subcontractor'}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-400 rounded-xl transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {/* Compliance Gauge */}
                                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 mb-6">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{ts.table.compliance}</span>
                                        <span className={`text-2xl font-black ${getComplianceColor(selected.complianceScore)}`}>{selected.complianceScore}%</span>
                                    </div>
                                    <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${getComplianceBg(selected.complianceScore)} w-pct-${selected.complianceScore}`}
                                        />
                                    </div>
                                    <div className={`text-xs font-black uppercase tracking-widest mt-2 ${getComplianceColor(selected.complianceScore)}`}>
                                        {getComplianceLabel(selected.complianceScore)}
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div className="space-y-3">
                                    {[
                                        { label: ts.table.mainContractor, value: getCompanyName(selected.mainContractorId), icon: Building2 },
                                        { label: ts.table.contact, value: selected.contactPerson, icon: User },
                                        { label: ts.table.email, value: selected.email, icon: Mail },
                                        { label: ts.table.phone, value: selected.phone, icon: Phone },
                                        { label: ts.table.employees, value: String(selected.employeeCount), icon: Users },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700">
                                            <item.icon size={16} className="text-violet-500 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</div>
                                                <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.value}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Compliance Breakdown Card */}
                            <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <BarChart3 size={20} className="text-violet-500" />
                                    <h4 className="font-black text-slate-800 dark:text-white uppercase tracking-tight text-sm">{ts.table.status}</h4>
                                </div>
                                <div className="space-y-2">
                                    {[
                                        { label: 'HR Docs Verified', score: 100 },
                                        { label: 'Medical Clearances', score: selected.complianceScore },
                                        { label: 'RAC Certifications', score: Math.min(100, selected.complianceScore + 10) },
                                        { label: 'HSE Inductions', score: Math.max(0, selected.complianceScore - 5) },
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <div className="text-[10px] font-bold text-slate-500 w-36 truncate">{item.label}</div>
                                            <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className={`h-full rounded-full ${getComplianceBg(item.score)} w-pct-${item.score}`} />
                                            </div>
                                            <div className={`text-[10px] font-black w-8 text-right ${getComplianceColor(item.score)}`}>{item.score}%</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-sm border border-slate-200 dark:border-slate-700 p-12 flex flex-col items-center justify-center text-center min-h-[300px]">
                            <Briefcase size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-400 font-bold">{ts.search}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Add / Edit Modal ─── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-600 rounded-xl text-white shadow">
                                    <Briefcase size={20} />
                                </div>
                                <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {editingId ? ts.editSubcontractor : ts.addSubcontractor}
                                </h3>
                            </div>
                            <button onClick={() => setIsModalOpen(false)}
                                title={language === 'pt' ? 'Fechar' : 'Close'}
                                aria-label={language === 'pt' ? 'Fechar' : 'Close'}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSave} className="px-8 py-6 space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{ts.modal.companyName}</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.companyName}
                                    onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))}
                                    placeholder={ts.modal.companyNamePlaceholder}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-violet-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{ts.modal.mainContractor}</label>
                                <select
                                    required
                                    value={formData.mainContractorId}
                                    onChange={e => setFormData(p => ({ ...p, mainContractorId: e.target.value }))}
                                    title={ts.modal.mainContractor}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-violet-500 outline-none"
                                >
                                    <option value="">{ts.modal.selectParent}</option>
                                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{ts.modal.contactPerson}</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.contactPerson}
                                        onChange={e => setFormData(p => ({ ...p, contactPerson: e.target.value }))}
                                        placeholder={ts.modal.contactPlaceholder}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-violet-500 outline-none transition-colors"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{ts.modal.phone}</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                                        placeholder={ts.modal.phonePlaceholder}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-violet-500 outline-none transition-colors"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{ts.modal.email}</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                                    placeholder={ts.modal.emailPlaceholder}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:border-violet-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1.5">{ts.modal.status}</label>
                                <div className="flex gap-3">
                                    {(['Active', 'Inactive'] as const).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, status: s }))}
                                            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                                                formData.status === s
                                                ? s === 'Active'
                                                    ? 'bg-emerald-600 text-white border-emerald-500'
                                                    : 'bg-slate-700 text-white border-slate-600'
                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-500 border-transparent hover:border-slate-300'
                                            }`}
                                        >
                                            {s === 'Active' ? ts.modal.active : ts.modal.inactive}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                >
                                    {ts.modal.cancel}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95"
                                >
                                    {ts.modal.save}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubcontractorPage;
