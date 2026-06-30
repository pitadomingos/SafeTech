
import React, { useState } from 'react';
import { FileCode, Database, Layers, Terminal, ShieldAlert, Sparkles, Copy, ListFilter, GitMerge, ShieldCheck, Key, GlobeLock, Smartphone, Info } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const TechnicalDocs: React.FC = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('schema');
  const [copied, setCopied] = useState(false);

  const sections = [
    { id: 'schema', label: t.technicalDocs.sections.schema, icon: Database },
    { id: 'security', label: t.technicalDocs.sections.security, icon: Key },
    { id: 'api', label: t.technicalDocs.sections.api, icon: GlobeLock },
    { id: 'waitlist', label: t.technicalDocs.sections.waitlist, icon: ListFilter },
  ];

  const sqlSchema = `-- ==========================================
-- CARS MANAGER - MASTER DB SCHEMA (v2.5)
-- Safe to run on existing databases
-- ==========================================

-- 1. INFRASTRUCTURE & EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. COMPANIES (TENANTS)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  app_name TEXT,
  logo_url TEXT,
  safety_logo_url TEXT,
  status TEXT DEFAULT 'Active',
  default_language TEXT DEFAULT 'en',
  features JSONB DEFAULT '{"alcohol": false}'
);

-- PATCH: Add Hierarchy Columns to existing companies table
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='parent_id') THEN
    ALTER TABLE companies ADD COLUMN parent_id UUID REFERENCES companies(id) ON DELETE SET NULL;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='tier') THEN
    ALTER TABLE companies ADD COLUMN tier TEXT DEFAULT 'Prime';
  END IF;
END $$;

-- 3. SITES
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT,
  mandatory_racs TEXT[] DEFAULT '{}'
);

-- 4. USERS (SYSTEM ACCESS)
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  company TEXT,
  job_title TEXT,
  phone_number TEXT,
  site_id TEXT DEFAULT 'all'
);

-- 5. EMPLOYEES (PERSONNEL)
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
  record_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  department TEXT,
  role TEXT,
  phone_number TEXT,
  driver_license_number TEXT,
  driver_license_class TEXT,
  driver_license_expiry DATE,
  is_active BOOLEAN DEFAULT true
);

-- 6. TRAINING & EVALUATION
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  rac_type TEXT NOT NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  location TEXT NOT NULL,
  instructor TEXT NOT NULL,
  capacity INTEGER DEFAULT 20,
  session_language TEXT DEFAULT 'Portuguese'
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Pending',
  result_date DATE,
  expiry_date DATE,
  theory_score INTEGER DEFAULT 0,
  practical_score INTEGER DEFAULT 0,
  attendance BOOLEAN DEFAULT false,
  driver_license_verified BOOLEAN DEFAULT false,
  is_auto_booked BOOLEAN DEFAULT false,
  comments TEXT,
  trainer_name TEXT
);

CREATE TABLE IF NOT EXISTS waiting_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_requirements (
  employee_id UUID PRIMARY KEY REFERENCES employees(id) ON DELETE CASCADE,
  aso_expiry_date DATE,
  required_racs JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS rac_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  validity_months INTEGER DEFAULT 24,
  requires_driver_license BOOLEAN DEFAULT false,
  requires_practical BOOLEAN DEFAULT true,
  pass_score INTEGER DEFAULT 70
);

CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER DEFAULT 20
);

CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  authorized_racs TEXT[] DEFAULT '{}'
);

-- 7. SYSTEM AUDIT
CREATE TABLE IF NOT EXISTS system_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT now(),
  level TEXT NOT NULL,
  message_key TEXT NOT NULL,
  user_name TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'
);`;

  const apiDocs = `/* API CONSUMPTION GUIDE FOR THIRD-PARTY APPS (ACCESS CONTROL / BREATHALYZER) */

// 1. Authorization
// All requests must include the x-api-key header generated in the Integration Hub.
// Header: x-api-key: <CARS_LIVE_KEY>

// 2. Verify Personnel Compliance
// GET /api/v1/verify/{recordId}
// This endpoint check ASO Validity AND all required RAC Trainings.
// Response:
{
  "status": "GRANTED", // or "BLOCKED"
  "personnel": {
    "name": "Paulo Manjate",
    "company": "Vulcan",
    "role": "Excavator Operator"
  },
  "checks": {
    "aso": { "status": "OK", "expiry": "2025-12-31" },
    "racs": [
        { "code": "RAC01", "status": "VALID", "expiry": "2026-06-15" },
        { "code": "RAC02", "status": "VALID", "expiry": "2026-01-10" }
    ],
    "blocked_by": [] // Empty if GRANTED
  }
}

// 3. Post Breathalyzer Result
// POST /api/v1/alcohol/log
// Body:
{
  "record_id": "VUL-1001",
  "device_id": "TURNSTILE-A",
  "bac_reading": 0.000,
  "timestamp": "2024-06-20T08:00:00Z"
}
// Note: Readings > 0.000 trigger automated system locks for the individual.`;

  const securitySchema = `-- ENABLE ROW LEVEL SECURITY
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site Isolation" ON employees
FOR ALL USING (
  site_id::text = current_setting('app.current_site_id', true)
  OR current_setting('app.user_role', true) = 'System Admin'
);`;

  const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in-up h-full">
      <div className="bg-slate-900 rounded-3xl p-8 text-white border border-slate-700 relative overflow-hidden">
         <div className="absolute top-0 right-0 opacity-10 pointer-events-none"><Terminal size={200}/></div>
         <h2 className="text-3xl font-black flex items-center gap-3 relative z-10"><Terminal className="text-cyan-400" /> {t.technicalDocs.title}</h2>
         <p className="text-slate-400 mt-2 relative z-10 max-w-2xl">{t.technicalDocs.subtitle}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-64 space-y-2">
              {sections.map(s => {
                  const Icon = s.icon;
                  return (
                      <button key={s.id} onClick={() => setActiveSection(s.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all border ${activeSection === s.id ? 'bg-slate-900 text-white shadow-lg border-slate-900' : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-100 dark:border-slate-700'}`}>
                          <Icon size={18} />{s.label}
                      </button>
                  )
              })}
          </div>

          <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl p-8 overflow-y-auto shadow-xl border border-slate-100 dark:border-slate-700">
              {activeSection === 'schema' && (
                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="text-emerald-500" size={20} />
                            <h3 className="text-xl font-black uppercase tracking-tight">{t.technicalDocs.masterStructure}</h3>
                        </div>
                        <button onClick={() => handleCopy(sqlSchema)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
                            <Copy size={14} /> {copied ? t.technicalDocs.copied : t.technicalDocs.copyCode}
                        </button>
                      </div>
                      
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex gap-3 mb-4">
                          <Info className="text-emerald-500 shrink-0" size={18} />
                          <div className="text-xs text-emerald-700 dark:text-emerald-300">
                              <p className="font-bold mb-1">{t.technicalDocs.resilienceNoteTitle}</p>
                              <p>{t.technicalDocs.resilienceNoteDesc}</p>
                          </div>
                      </div>

                      <pre className="bg-slate-950 text-cyan-400 p-6 rounded-2xl text-[11px] font-mono overflow-x-auto shadow-inner border border-slate-800">
                        {sqlSchema}
                      </pre>
                  </div>
              )}

              {activeSection === 'api' && (
                  <div className="space-y-6 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <GlobeLock className="text-blue-500" size={20} />
                            <h3 className="text-xl font-black uppercase tracking-tight">{t.technicalDocs.consumerApiInterface}</h3>
                        </div>
                        <button onClick={() => handleCopy(apiDocs)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
                            <Copy size={14} /> {copied ? t.technicalDocs.copied : t.technicalDocs.copyCode}
                        </button>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-3">
                          <Info className="text-blue-500 shrink-0" size={18} />
                          <div className="text-xs text-blue-700 dark:text-blue-300">
                              <p className="font-bold mb-1">{t.technicalDocs.integrationScenarioTitle}</p>
                              <p>{t.technicalDocs.integrationScenarioDesc}</p>
                          </div>
                      </div>

                      <pre className="bg-slate-950 text-blue-400 p-6 rounded-2xl text-[11px] font-mono overflow-x-auto shadow-inner border border-slate-800">
                        {apiDocs}
                      </pre>
                  </div>
              )}

              {activeSection === 'security' && (
                  <div className="space-y-4 animate-fade-in">
                      <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black uppercase tracking-tight">{t.technicalDocs.rowLevelSecurity}</h3>
                        <button onClick={() => handleCopy(securitySchema)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2">
                            <Copy size={14} /> {copied ? t.technicalDocs.copied : t.technicalDocs.copyCode}
                        </button>
                      </div>
                      <pre className="bg-slate-950 text-indigo-400 p-6 rounded-2xl text-[11px] font-mono overflow-x-auto shadow-inner border border-slate-800">
                        {securitySchema}
                      </pre>
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};

export default TechnicalDocs;
