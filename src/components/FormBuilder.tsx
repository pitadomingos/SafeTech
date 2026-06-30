import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus, Trash2, Copy, Check, Code2, Eye,
    Settings2, ChevronDown, ChevronUp, Database, Columns3,
    Type, Hash, Calendar, ToggleLeft, List, Mail, Phone,
    AlignLeft, Download, CheckCircle2, X, Save,
    ArrowUp, ArrowDown, AlertTriangle, Layers, GripVertical,
    Zap, ShieldCheck, Edit3
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db } from '../services/databaseService';

// ─── Types ────────────────────────────────────────────────────────────────────
export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea' | 'email' | 'phone';

export interface FormField {
    id: string;
    name: string;
    label: string;
    type: FieldType;
    required: boolean;
    placeholder?: string;
    description?: string;
    options?: string[]; // for select type
    defaultValue?: string;
}

interface FormBuilderProps {
    tableName: string;
    portalType: 'clinic' | 'security' | 'hr';
    defaultFields?: FormField[];
}

// ─── Field type metadata ──────────────────────────────────────────────────────
const FIELD_TYPE_CONFIG: { type: FieldType; icon: React.ElementType; sqlType: string; color: string; label: { en: string; pt: string } }[] = [
    { type: 'text',     icon: Type,       sqlType: 'VARCHAR(255)',  color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',    label: { en: 'Short Text', pt: 'Texto Curto' } },
    { type: 'number',   icon: Hash,       sqlType: 'NUMERIC',      color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800', label: { en: 'Number', pt: 'Número' } },
    { type: 'select',   icon: List,       sqlType: 'VARCHAR(100)',  color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',   label: { en: 'Dropdown', pt: 'Seleção' } },
    { type: 'date',     icon: Calendar,   sqlType: 'DATE',         color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', label: { en: 'Date', pt: 'Data' } },
    { type: 'boolean',  icon: ToggleLeft, sqlType: 'BOOLEAN',      color: 'text-teal-600 bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',     label: { en: 'Yes / No', pt: 'Sim / Não' } },
    { type: 'textarea', icon: AlignLeft,  sqlType: 'TEXT',          color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',  label: { en: 'Long Text', pt: 'Texto Longo' } },
    { type: 'email',    icon: Mail,       sqlType: 'VARCHAR(255)',  color: 'text-rose-600 bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800',     label: { en: 'Email', pt: 'Email' } },
    { type: 'phone',    icon: Phone,      sqlType: 'VARCHAR(20)',   color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200 dark:border-cyan-800',     label: { en: 'Phone', pt: 'Telefone' } },
];

const SQL_TYPE_MAP: Record<FieldType, string> = {
    text: 'VARCHAR(255)', number: 'NUMERIC', select: 'VARCHAR(100)',
    date: 'DATE', boolean: 'BOOLEAN', textarea: 'TEXT',
    email: 'VARCHAR(255)', phone: 'VARCHAR(20)'
};

const PORTAL_COLORS: Record<string, { from: string; to: string; accent: string; border: string }> = {
    clinic:   { from: 'from-red-500', to: 'to-rose-600', accent: 'red', border: 'border-red-200 dark:border-red-800' },
    security: { from: 'from-amber-500', to: 'to-orange-600', accent: 'amber', border: 'border-amber-200 dark:border-amber-800' },
    hr:       { from: 'from-blue-500', to: 'to-indigo-600', accent: 'blue', border: 'border-blue-200 dark:border-blue-800' },
};

// ─── SQL column name sanitizer ────────────────────────────────────────────────
function toSnakeCase(str: string): string {
    return str
        .replace(/[^a-zA-Z0-9\s_]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .toLowerCase()
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
}

function generateId(): string {
    return 'fld_' + Math.random().toString(36).substring(2, 9);
}

// ─── Default field presets ────────────────────────────────────────────────────
const CLINIC_DEFAULTS: FormField[] = [
    { id: generateId(), name: 'blood_pressure', label: 'Blood Pressure', type: 'text', required: true, placeholder: 'e.g. 120/80' },
    { id: generateId(), name: 'heart_rate', label: 'Heart Rate (BPM)', type: 'number', required: true, placeholder: '72' },
    { id: generateId(), name: 'vision_test', label: 'Vision Test', type: 'select', required: true, options: ['Pass', 'Fail'] },
    { id: generateId(), name: 'drug_screen', label: 'Drug Screen', type: 'select', required: true, options: ['Negative', 'Positive'] },
    { id: generateId(), name: 'hearing', label: 'Hearing Assessment', type: 'select', required: false, options: ['Normal', 'Impaired'] },
    { id: generateId(), name: 'musculoskeletal', label: 'Musculoskeletal', type: 'select', required: false, options: ['Normal', 'Impaired'] },
    { id: generateId(), name: 'bmi', label: 'BMI', type: 'text', required: false, placeholder: 'e.g. 22.5' },
    { id: generateId(), name: 'fit_for_work', label: 'Fit for Work', type: 'boolean', required: true },
    { id: generateId(), name: 'restrictions', label: 'Restrictions', type: 'text', required: false, placeholder: 'e.g. No night shift' },
    { id: generateId(), name: 'examiner_name', label: 'Examiner Name', type: 'text', required: true },
    { id: generateId(), name: 'examination_type', label: 'Examination Type', type: 'select', required: true, options: ['Pre-Employment', 'Periodic', 'Return-to-Work'] },
    { id: generateId(), name: 'valid_months', label: 'Validity (Months)', type: 'number', required: true, placeholder: '12' },
    { id: generateId(), name: 'clinical_notes', label: 'Clinical Notes', type: 'textarea', required: false, placeholder: 'Additional observations...' },
];

const SECURITY_DEFAULTS: FormField[] = [
    { id: generateId(), name: 'badge_number', label: 'Badge Number', type: 'text', required: true, placeholder: 'e.g. TEMP-ACCESS-1234' },
    { id: generateId(), name: 'badge_type', label: 'Badge Type', type: 'select', required: true, options: ['Temporary', 'Permanent', 'Visitor', 'Contractor'] },
    { id: generateId(), name: 'access_level', label: 'Access Level', type: 'select', required: true, options: ['General', 'Restricted', 'High-Security', 'Administrative'] },
    { id: generateId(), name: 'permitted_zones', label: 'Permitted Access Zones', type: 'text', required: false, placeholder: 'Zone A, Zone B...' },
    { id: generateId(), name: 'background_check', label: 'Background Check', type: 'select', required: true, options: ['Cleared', 'Pending', 'Flagged'] },
    { id: generateId(), name: 'photo_captured', label: 'Photo Captured', type: 'boolean', required: true },
    { id: generateId(), name: 'id_document_verified', label: 'ID Document Verified', type: 'boolean', required: true },
    { id: generateId(), name: 'issued_by', label: 'Issued By', type: 'text', required: true },
    { id: generateId(), name: 'valid_from', label: 'Valid From', type: 'date', required: true },
    { id: generateId(), name: 'valid_until', label: 'Valid Until', type: 'date', required: true },
    { id: generateId(), name: 'security_notes', label: 'Security Notes', type: 'textarea', required: false, placeholder: 'Any restrictions or notes...' },
];

const HR_DEFAULTS: FormField[] = [
    { id: generateId(), name: 'national_id', label: 'National ID Number', type: 'text', required: true },
    { id: generateId(), name: 'passport_number', label: 'Passport Number', type: 'text', required: false },
    { id: generateId(), name: 'work_permit', label: 'Work Permit Number', type: 'text', required: false },
    { id: generateId(), name: 'contract_type', label: 'Contract Type', type: 'select', required: true, options: ['Permanent', 'Fixed-Term', 'Contractor', 'Intern'] },
    { id: generateId(), name: 'start_date', label: 'Employment Start Date', type: 'date', required: true },
    { id: generateId(), name: 'end_date', label: 'Contract End Date', type: 'date', required: false },
    { id: generateId(), name: 'emergency_contact_name', label: 'Emergency Contact Name', type: 'text', required: true },
    { id: generateId(), name: 'emergency_contact_phone', label: 'Emergency Contact Phone', type: 'phone', required: true },
    { id: generateId(), name: 'bank_account', label: 'Bank Account (IBAN)', type: 'text', required: false },
    { id: generateId(), name: 'tax_id', label: 'Tax Identification Number', type: 'text', required: true },
    { id: generateId(), name: 'marital_status', label: 'Marital Status', type: 'select', required: false, options: ['Single', 'Married', 'Divorced', 'Widowed'] },
    { id: generateId(), name: 'email_address', label: 'Email Address', type: 'email', required: true },
    { id: generateId(), name: 'phone_number', label: 'Phone Number', type: 'phone', required: true },
    { id: generateId(), name: 'address', label: 'Residential Address', type: 'textarea', required: false },
    { id: generateId(), name: 'hr_notes', label: 'HR Notes', type: 'textarea', required: false },
];

export function getDefaultFields(portalType: 'clinic' | 'security' | 'hr'): FormField[] {
    switch (portalType) {
        case 'clinic': return CLINIC_DEFAULTS.map(f => ({ ...f, id: generateId() }));
        case 'security': return SECURITY_DEFAULTS.map(f => ({ ...f, id: generateId() }));
        case 'hr': return HR_DEFAULTS.map(f => ({ ...f, id: generateId() }));
    }
}

// ─── SQL Generator ────────────────────────────────────────────────────────────
export function generateSQL(tableName: string, fields: FormField[]): string {
    const safeTable = toSnakeCase(tableName) || 'custom_form';

    const columnDefs = fields.map(f => {
        const colName = toSnakeCase(f.name) || 'unnamed_column';
        let sqlType = SQL_TYPE_MAP[f.type];

        let constraint = '';
        if (f.type === 'select' && f.options && f.options.length > 0) {
            const opts = f.options.map(o => `'${o.replace(/'/g, "''")}'`).join(', ');
            constraint = ` CHECK (${colName} IN (${opts}))`;
        }
        if (f.type === 'boolean') {
            sqlType = 'BOOLEAN DEFAULT false';
        }

        const notNull = f.required ? ' NOT NULL' : '';
        return `    ${colName} ${sqlType}${notNull}${constraint}`;
    });

    const lines = [
        `-- ============================================================`,
        `-- Table: ${safeTable}`,
        `-- Generated by ZeroGate Form Builder`,
        `-- Generated at: ${new Date().toISOString()}`,
        `-- ============================================================`,
        ``,
        `CREATE TABLE IF NOT EXISTS public.${safeTable} (`,
        `    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),`,
        `    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,`,
        `    process_id UUID,  -- links to mobilization/recruitment process`,
        ...columnDefs.map((col) => col + ','),
        `    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),`,
        `    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()`,
        `);`,
        ``,
        `-- Index for fast employee lookups`,
        `CREATE INDEX IF NOT EXISTS idx_${safeTable}_employee_id ON public.${safeTable}(employee_id);`,
        ``,
        `-- Index for process lookups`,
        `CREATE INDEX IF NOT EXISTS idx_${safeTable}_process_id ON public.${safeTable}(process_id);`,
        ``,
        `-- Auto-update timestamp trigger`,
        `CREATE OR REPLACE FUNCTION update_${safeTable}_updated_at()`,
        `RETURNS TRIGGER AS $$`,
        `BEGIN`,
        `    NEW.updated_at = now();`,
        `    RETURN NEW;`,
        `END;`,
        `$$ LANGUAGE plpgsql;`,
        ``,
        `CREATE TRIGGER trg_${safeTable}_updated_at`,
        `    BEFORE UPDATE ON public.${safeTable}`,
        `    FOR EACH ROW`,
        `    EXECUTE FUNCTION update_${safeTable}_updated_at();`,
        ``,
        `-- Row Level Security`,
        `ALTER TABLE public.${safeTable} ENABLE ROW LEVEL SECURITY;`,
        ``,
        `-- Policy: authenticated users can read all rows`,
        `CREATE POLICY "${safeTable}_select_policy" ON public.${safeTable}`,
        `    FOR SELECT USING (auth.role() = 'authenticated');`,
        ``,
        `-- Policy: authenticated users can insert`,
        `CREATE POLICY "${safeTable}_insert_policy" ON public.${safeTable}`,
        `    FOR INSERT WITH CHECK (auth.role() = 'authenticated');`,
        ``,
        `-- Policy: authenticated users can update their own rows`,
        `CREATE POLICY "${safeTable}_update_policy" ON public.${safeTable}`,
        `    FOR UPDATE USING (auth.role() = 'authenticated');`,
    ];

    return lines.join('\n');
}

// ─── Field Editor Sub-component (matches Safety Inspection style) ─────────────
interface FieldEditorProps {
    field: FormField;
    idx: number;
    total: number;
    language: 'en' | 'pt';
    onChange: (changes: Partial<FormField>) => void;
    onRemove: () => void;
    onMove: (dir: 'up' | 'down') => void;
}

const FieldEditor: React.FC<FieldEditorProps> = ({ field, idx, total, language, onChange, onRemove, onMove }) => {
    const [expanded, setExpanded] = useState(false);
    const cfg = FIELD_TYPE_CONFIG.find(c => c.type === field.type)!;
    const Icon = cfg.icon;

    return (
        <div className={`bg-white dark:bg-slate-800 rounded-2xl border transition-all ${
            expanded
                ? 'border-violet-300 dark:border-violet-700 shadow-lg shadow-violet-500/10'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
        }`}>
            {/* Collapsed header */}
            <div className="px-4 py-3 flex items-center gap-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <div className="flex flex-col gap-0.5 text-slate-300">
                    <button onClick={e => { e.stopPropagation(); onMove('up'); }} disabled={idx === 0}
                        title="Move up" className="p-0.5 hover:text-slate-600 disabled:opacity-20"><ArrowUp size={11} /></button>
                    <button onClick={e => { e.stopPropagation(); onMove('down'); }} disabled={idx === total - 1}
                        title="Move down" className="p-0.5 hover:text-slate-600 disabled:opacity-20"><ArrowDown size={11} /></button>
                </div>

                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[10px] font-black flex items-center justify-center">{idx + 1}</span>

                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${cfg.color}`}>
                    <Icon size={13} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {field.label || '(unnamed)'}
                        </span>
                        {field.required && (
                            <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 border border-red-200 dark:border-red-800">
                                {language === 'pt' ? 'Obrigatório' : 'Required'}
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                        {field.name || '—'} · {cfg.label[language]}
                    </div>
                </div>

                <button onClick={e => { e.stopPropagation(); onRemove(); }}
                    title={language === 'pt' ? 'Remover' : 'Remove'}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <Trash2 size={14} />
                </button>

                {expanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
            </div>

            {/* Expanded editor */}
            {expanded && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                {language === 'pt' ? 'Rótulo do Campo' : 'Field Label'}
                            </label>
                            <input type="text" value={field.label}
                                onChange={e => onChange({ label: e.target.value, name: field.name || toSnakeCase(e.target.value) })}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-violet-400 transition-all"
                                placeholder="e.g. Blood Pressure" />
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                {language === 'pt' ? 'Nome da Coluna (DB)' : 'Column Name (DB)'}
                            </label>
                            <input type="text" value={field.name}
                                onChange={e => onChange({ name: toSnakeCase(e.target.value) })}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-mono outline-none focus:border-violet-400 transition-all"
                                placeholder="e.g. blood_pressure" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                {language === 'pt' ? 'Tipo de Dados' : 'Data Type'}
                            </label>
                            <select value={field.type}
                                aria-label={language === 'pt' ? 'Tipo de Dados' : 'Data Type'}
                                onChange={e => onChange({ type: e.target.value as FieldType, options: e.target.value === 'select' ? ['Option 1', 'Option 2'] : undefined })}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-violet-400">
                                {FIELD_TYPE_CONFIG.map(ft => (
                                    <option key={ft.type} value={ft.type}>{ft.label[language]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                {language === 'pt' ? 'Texto de Ajuda' : 'Placeholder'}
                            </label>
                            <input type="text" value={field.placeholder || ''}
                                onChange={e => onChange({ placeholder: e.target.value })}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-violet-400"
                                placeholder="e.g. 120/80" />
                        </div>
                    </div>

                    {field.type === 'select' && (
                        <div>
                            <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">
                                {language === 'pt' ? 'Opções (separadas por vírgula)' : 'Options (comma-separated)'}
                            </label>
                            <input type="text" value={(field.options || []).join(', ')}
                                onChange={e => onChange({ options: e.target.value.split(',').map(o => o.trim()).filter(Boolean) })}
                                className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none focus:border-violet-400"
                                placeholder="Pass, Fail, N/A" />
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        <button onClick={() => onChange({ required: !field.required })}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${
                                field.required
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 border-red-200 dark:border-red-800'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}>
                            {field.required ? <Check size={11} /> : <X size={11} />}
                            {field.required ? (language === 'pt' ? 'Obrigatório' : 'Required') : (language === 'pt' ? 'Opcional' : 'Optional')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main FormBuilder Component ───────────────────────────────────────────────
export default function FormBuilder({ tableName, portalType, defaultFields }: FormBuilderProps) {
    const { language } = useLanguage();
    const { user } = useAuth();
    const { confirm } = useToast();
    const storageKey = `formbuilder_${portalType}_fields`;
    const colors = PORTAL_COLORS[portalType] || PORTAL_COLORS.hr;

    const [fields, setFields] = useState<FormField[]>(() => {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) return JSON.parse(saved);
        } catch {}
        return defaultFields || getDefaultFields(portalType);
    });

    const [activeView, setActiveView] = useState<'builder' | 'preview' | 'sql'>('builder');
    const [isEditing, setIsEditing] = useState(false);
    const [draftFields, setDraftFields] = useState<FormField[]>([]);
    const [sqlCopied, setSqlCopied] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [saveMessage, setSaveMessage] = useState('');

    // Persist on changes
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(fields));
    }, [fields, storageKey]);

    // Check if table was already created
    const existingSchema = useMemo(() => {
        const schemas = db.getCreatedTables();
        return schemas.find(s => s.tableName === tableName);
    }, [tableName, saveStatus]);

    const sql = generateSQL(tableName, isEditing ? draftFields : fields);
    const requiredCount = (isEditing ? draftFields : fields).filter(f => f.required).length;
    const activeFields = isEditing ? draftFields : fields;

    // ─── Labels ───────────────────────────────────────────────────────────────
    const isPt = language === 'pt';
    const L = {
        title: isPt ? 'Construtor de Formulário' : 'Form Builder',
        subtitle: isPt ? 'Configure campos, pré-visualize e crie tabelas automaticamente' : 'Configure fields, preview, and auto-create database tables',
        builder: isPt ? 'Campos' : 'Fields',
        preview: isPt ? 'Pré-visualização' : 'Preview',
        sql: isPt ? 'SQL Gerado' : 'Generated SQL',
        addField: isPt ? 'Adicionar Campo' : 'Add Field',
        editForm: isPt ? 'Editar Formulário' : 'Edit Form',
        saveForm: isPt ? 'Guardar e Criar Tabela' : 'Save & Create Table',
        cancel: isPt ? 'Cancelar' : 'Cancel',
        noFields: isPt ? 'Nenhum campo configurado. Clique "Editar Formulário" para começar.' : 'No fields configured. Click "Edit Form" to start.',
        copySql: isPt ? 'Copiar SQL' : 'Copy SQL',
        copied: isPt ? 'Copiado!' : 'Copied!',
        downloadSql: isPt ? 'Transferir SQL' : 'Download SQL',
        resetDefaults: isPt ? 'Repor Padrões' : 'Reset Defaults',
        resetConfirm: isPt ? 'Tem a certeza? Isto irá repor os campos predefinidos.' : 'Are you sure? This will reset to default fields.',
        totalFields: isPt ? 'campos' : 'fields',
        required: isPt ? 'obrigatórios' : 'required',
        sqlReady: isPt ? 'SQL pronto para execução' : 'SQL ready for execution',
        tableName: isPt ? 'Nome da Tabela' : 'Table Name',
        tableCreated: isPt ? 'Tabela criada com sucesso' : 'Table created successfully',
        tableStored: isPt ? 'Esquema armazenado' : 'Schema stored',
        saving: isPt ? 'A criar tabela...' : 'Creating table...',
        yes: isPt ? 'Sim' : 'Yes',
        no: isPt ? 'Não' : 'No',
    };

    // ─── Edit actions ─────────────────────────────────────────────────────────
    const startEditing = () => {
        setDraftFields(JSON.parse(JSON.stringify(fields)));
        setIsEditing(true);
    };

    const cancelEditing = () => {
        setIsEditing(false);
        setDraftFields([]);
    };

    const addField = (type: FieldType) => {
        const newField: FormField = {
            id: generateId(),
            name: '',
            label: '',
            type,
            required: false,
            placeholder: '',
            options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
        };
        setDraftFields([...draftFields, newField]);
    };

    const updateDraftField = (id: string, updates: Partial<FormField>) => {
        setDraftFields(draftFields.map(f => {
            if (f.id !== id) return f;
            const updated = { ...f, ...updates };
            if (updates.label && !f.name) {
                updated.name = toSnakeCase(updates.label);
            }
            return updated;
        }));
    };

    const removeDraftField = (id: string) => {
        setDraftFields(draftFields.filter(f => f.id !== id));
    };

    const moveDraftField = (id: string, direction: 'up' | 'down') => {
        const idx = draftFields.findIndex(f => f.id === id);
        if (idx < 0) return;
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= draftFields.length) return;
        const newFields = [...draftFields];
        [newFields[idx], newFields[target]] = [newFields[target], newFields[idx]];
        setDraftFields(newFields);
    };

    const resetToDefaults = async () => {
        if (await confirm(language === 'pt' ? 'Repor Predefinições' : 'Reset Defaults', L.resetConfirm)) {
            const defaults = getDefaultFields(portalType);
            setDraftFields(defaults);
        }
    };

    // ─── Save & Auto-Execute SQL ──────────────────────────────────────────────
    const handleSaveAndCreateTable = async () => {
        setSaveStatus('saving');
        setSaveMessage(L.saving);

        // Commit fields
        setFields(draftFields);
        setIsEditing(false);

        const finalSQL = generateSQL(tableName, draftFields);
        const userName = user?.name || 'System';

        try {
            const result = await db.executeSQL(finalSQL, tableName, portalType, userName);
            if (result.success) {
                setSaveStatus('success');
                setSaveMessage(result.error || L.tableCreated);
                setTimeout(() => { setSaveStatus('idle'); setSaveMessage(''); }, 5000);
            } else {
                setSaveStatus('error');
                setSaveMessage(result.error || 'Unknown error');
                setTimeout(() => { setSaveStatus('idle'); setSaveMessage(''); }, 8000);
            }
        } catch (e: any) {
            setSaveStatus('error');
            setSaveMessage(e.message || 'Failed to execute SQL');
            setTimeout(() => { setSaveStatus('idle'); setSaveMessage(''); }, 8000);
        }
    };

    const copySql = () => {
        navigator.clipboard.writeText(sql);
        setSqlCopied(true);
        setTimeout(() => setSqlCopied(false), 2000);
    };

    const downloadSql = () => {
        const blob = new Blob([sql], { type: 'text/sql' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName}_schema.sql`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // ─── Tabs ─────────────────────────────────────────────────────────────────
    const tabs = [
        { id: 'builder' as const, label: L.builder, icon: Settings2 },
        { id: 'preview' as const, label: L.preview, icon: Eye },
        { id: 'sql' as const,     label: L.sql,     icon: Code2 },
    ];

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header — matches Safety Inspection header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${colors.from} ${colors.to} flex items-center justify-center shadow-lg`}>
                            <Columns3 size={20} className="text-white" />
                        </div>
                        {L.title}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-14">{L.subtitle}</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Stats (like Safety Inspection) */}
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-center shadow-sm">
                        <div className="text-xl font-black text-slate-900 dark:text-white">{activeFields.length}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{L.totalFields}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-center shadow-sm">
                        <div className="text-xl font-black text-red-600">{requiredCount}</div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{L.required}</div>
                    </div>
                </div>
            </div>

            {/* Table Name & Status */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-2xl">
                    <Database size={16} className="text-violet-600" />
                    <div className="text-[10px] font-black uppercase tracking-widest text-violet-600">
                        {L.tableName}: <span className="font-mono text-violet-800 dark:text-violet-300 text-xs">public.{tableName}</span>
                    </div>
                </div>
                {existingSchema && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                        existingSchema.status === 'executed'
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800'
                    }`}>
                        {existingSchema.status === 'executed' ? <ShieldCheck size={13} /> : <Zap size={13} />}
                        {existingSchema.status === 'executed'
                            ? (isPt ? 'Tabela ativa no BD' : 'Table active in DB')
                            : (isPt ? 'Schema armazenado localmente' : 'Schema stored locally')}
                        <span className="text-[8px] text-slate-400 font-mono normal-case">{new Date(existingSchema.createdAt).toLocaleDateString()}</span>
                    </div>
                )}
            </div>

            {/* Save Status Toast */}
            {saveStatus !== 'idle' && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border transition-all animate-in ${
                    saveStatus === 'saving' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700' :
                    saveStatus === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700' :
                    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700'
                }`}>
                    {saveStatus === 'saving' ? <Zap size={16} className="animate-pulse" /> :
                     saveStatus === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    <span className="text-sm font-bold">{saveMessage}</span>
                </div>
            )}

            {/* Tabs — matches Safety Inspection style */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveView(tab.id)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                            activeView === tab.id
                                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}>
                        <tab.icon size={15} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* ── BUILDER VIEW ─────────────────────────────────────────────────── */}
            {activeView === 'builder' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left sidebar — field type palette (matches Safety Inspection) */}
                    <div className="lg:col-span-3 space-y-3">
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <Layers size={11} /> {isPt ? 'Tipos de Campo' : 'Field Types'}
                            </div>

                            {isEditing ? (
                                <div className="space-y-1.5">
                                    {FIELD_TYPE_CONFIG.map(ft => {
                                        const FtIcon = ft.icon;
                                        return (
                                            <button key={ft.type} onClick={() => addField(ft.type)}
                                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-xs font-bold border hover:scale-[1.02] hover:shadow-md ${ft.color}`}>
                                                <FtIcon size={14} />
                                                <span>{ft.label[language]}</span>
                                                <Plus size={12} className="ml-auto opacity-40" />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    {FIELD_TYPE_CONFIG.map(ft => {
                                        const FtIcon = ft.icon;
                                        const count = fields.filter(f => f.type === ft.type).length;
                                        return (
                                            <div key={ft.type}
                                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold border ${ft.color} opacity-${count > 0 ? '100' : '40'}`}>
                                                <FtIcon size={14} />
                                                <span>{ft.label[language]}</span>
                                                {count > 0 && <span className="ml-auto text-[9px] font-black opacity-60">×{count}</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 space-y-2">
                                {!isEditing ? (
                                    <button onClick={startEditing}
                                        className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r ${colors.from} ${colors.to} text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all hover:opacity-90 shadow-lg`}>
                                        <Edit3 size={13} /> {L.editForm}
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={handleSaveAndCreateTable}
                                            disabled={saveStatus === 'saving'}
                                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-black uppercase tracking-widest py-3 rounded-xl transition-all hover:opacity-90 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                                            <Save size={13} /> {L.saveForm}
                                        </button>
                                        <button onClick={cancelEditing}
                                            className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest py-2.5 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700">
                                            <X size={13} /> {L.cancel}
                                        </button>
                                        <button onClick={resetToDefaults}
                                            className="w-full text-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-red-600 py-1.5 transition-colors">
                                            {L.resetDefaults}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right — field list (matches Safety Inspection editor) */}
                    <div className="lg:col-span-9">
                        {isEditing ? (
                            /* ── EDITING MODE ── */
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10`}>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                            {isPt ? 'Editando Campos' : 'Editing Fields'}
                                        </h3>
                                        <div className="text-[10px] text-violet-600 font-black uppercase tracking-widest mt-0.5">
                                            {portalType.toUpperCase()} · {draftFields.length} {L.totalFields}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={cancelEditing}
                                            className="px-4 py-2 rounded-xl text-xs font-black uppercase border border-slate-200 dark:border-slate-600 text-slate-600 hover:bg-slate-50 transition-all">
                                            {L.cancel}
                                        </button>
                                        <button onClick={handleSaveAndCreateTable}
                                            disabled={saveStatus === 'saving'}
                                            className="px-5 py-2 rounded-xl text-xs font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                                            <Save size={13} /> {L.saveForm}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6 space-y-3">
                                    {draftFields.length === 0 && (
                                        <div className="text-center py-12 text-slate-400">
                                            <Columns3 size={32} className="mx-auto mb-2 opacity-30" />
                                            <p className="text-xs">{L.noFields}</p>
                                        </div>
                                    )}

                                    {draftFields.map((field, idx) => (
                                        <FieldEditor
                                            key={field.id}
                                            field={field}
                                            idx={idx}
                                            total={draftFields.length}
                                            language={language}
                                            onChange={changes => updateDraftField(field.id, changes)}
                                            onRemove={() => removeDraftField(field.id)}
                                            onMove={dir => moveDraftField(field.id, dir)}
                                        />
                                    ))}

                                    {/* Add field prompt */}
                                    <div className="border-t border-dashed border-slate-200 dark:border-slate-700 pt-5">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{L.addField}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {FIELD_TYPE_CONFIG.map(ft => {
                                                const FtIcon = ft.icon;
                                                return (
                                                    <button key={ft.type} onClick={() => addField(ft.type)}
                                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 hover:shadow-md ${ft.color}`}>
                                                        <FtIcon size={12} /> {ft.label[language]}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ── VIEW MODE ── */
                            <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className={`px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-900/10 dark:to-indigo-900/10`}>
                                    <div>
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                            {isPt ? 'Esquema do Formulário' : 'Form Schema'}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[10px] text-violet-600 font-black uppercase tracking-widest">{portalType.toUpperCase()}</span>
                                            <span className="text-[10px] text-slate-400">{fields.length} {L.totalFields}</span>
                                        </div>
                                    </div>
                                    <button onClick={startEditing}
                                        className={`px-5 py-2 rounded-xl text-xs font-black uppercase bg-gradient-to-r ${colors.from} ${colors.to} text-white flex items-center gap-1.5 transition-all hover:opacity-90 shadow-lg`}>
                                        <Edit3 size={13} /> {L.editForm}
                                    </button>
                                </div>

                                <div className="p-6 space-y-3">
                                    {fields.map((field, idx) => {
                                        const cfg = FIELD_TYPE_CONFIG.find(c => c.type === field.type)!;
                                        const FIcon = cfg.icon;
                                        return (
                                            <div key={field.id} className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-[10px] font-black flex items-center justify-center">{idx + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{field.label || field.name || '(unnamed)'}</div>
                                                    {field.placeholder && <div className="text-[10px] text-slate-400 mt-0.5">{field.placeholder}</div>}
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <span className={`flex items-center gap-1 text-[9px] px-2 py-0.5 rounded font-black uppercase border ${cfg.color}`}>
                                                            <FIcon size={9} /> {cfg.label[language]}
                                                        </span>
                                                        {field.required && <span className="text-[9px] bg-red-100 dark:bg-red-900/30 text-red-600 px-2 py-0.5 rounded font-black uppercase">{isPt ? 'Obrigatório' : 'Required'}</span>}
                                                        {field.options && <span className="text-[9px] text-slate-400">{field.options.join(' / ')}</span>}
                                                        <span className="text-[9px] text-slate-400 font-mono">{field.name}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── PREVIEW VIEW ──────────────────────────────────────────────── */}
            {activeView === 'preview' && (
                <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                        <Eye size={11} /> {isPt ? 'Pré-visualização do Formulário' : 'Form Preview'}
                    </div>
                    <div className="space-y-4">
                        {activeFields.map(field => (
                            <div key={field.id}>
                                <label className="text-[9px] font-black text-slate-400 uppercase mb-1.5 block flex items-center gap-1">
                                    {field.label || field.name}
                                    {field.required && <span className="text-red-500">*</span>}
                                </label>
                                {field.type === 'boolean' ? (
                                    <div className="flex gap-2">
                                        <button className="flex-1 py-2.5 rounded-xl text-xs font-black border bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800">{L.yes}</button>
                                        <button className="flex-1 py-2.5 rounded-xl text-xs font-black border bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700">{L.no}</button>
                                    </div>
                                ) : field.type === 'select' ? (
                                    <select aria-label={field.label || 'Select'} className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none">
                                        <option value="">{field.placeholder || `Select ${field.label}...`}</option>
                                        {(field.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                ) : field.type === 'textarea' ? (
                                    <textarea rows={3} placeholder={field.placeholder}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none resize-none" />
                                ) : (
                                    <input
                                        type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                                        placeholder={field.placeholder}
                                        title={field.label}
                                        className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold outline-none" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── SQL VIEW ──────────────────────────────────────────────────── */}
            {activeView === 'sql' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            <CheckCircle2 size={13} />
                            {L.sqlReady} · <span className="font-mono text-xs">{tableName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={copySql}
                                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                                    sqlCopied
                                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700 hover:border-violet-400'
                                }`}>
                                {sqlCopied ? <Check size={12} /> : <Copy size={12} />}
                                {sqlCopied ? L.copied : L.copySql}
                            </button>
                            <button onClick={downloadSql}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-violet-600 text-white hover:bg-violet-700 transition-all shadow-lg shadow-violet-500/20">
                                <Download size={12} /> {L.downloadSql}
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">{tableName}_schema.sql</span>
                        </div>
                        <pre className="p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px] overflow-y-auto leading-relaxed">
                            {sql}
                        </pre>
                    </div>

                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                        <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold">
                            {isPt
                                ? 'Este SQL será executado automaticamente quando guardar o formulário. Também pode copiar e executar manualmente no SQL Editor do Supabase.'
                                : 'This SQL is automatically executed when you save the form. You can also copy and run it manually in the Supabase SQL Editor.'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
