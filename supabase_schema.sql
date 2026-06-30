-- ============================================================
-- ZeroGate Platform — COMPLETE Database Schema
-- PostgreSQL / Aiven Cloud Migration
-- All tables required by databaseService.ts
-- ============================================================

-- ─── 1. COMPANIES ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    app_name VARCHAR(255),
    logo_url TEXT,
    safety_logo_url TEXT,
    address TEXT,
    gps_coordinates VARCHAR(100),
    contact_person VARCHAR(255),
    contact_cell VARCHAR(50),
    contact_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    default_language VARCHAR(5) DEFAULT 'en' CHECK (default_language IN ('en', 'pt')),
    parent_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    tier VARCHAR(20) DEFAULT 'Prime' CHECK (tier IN ('Prime', 'Sub')),
    is_paid BOOLEAN DEFAULT false,
    registration_date TIMESTAMPTZ DEFAULT now(),
    selected_modules JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '{"alcohol": false}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_companies_parent_id ON public.companies(parent_id);

CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION update_companies_updated_at();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'companies_select_policy') THEN
        CREATE POLICY "companies_select_policy" ON public.companies FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'companies_insert_policy') THEN
        CREATE POLICY "companies_insert_policy" ON public.companies FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'companies_update_policy') THEN
        CREATE POLICY "companies_update_policy" ON public.companies FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'companies' AND policyname = 'companies_delete_policy') THEN
        CREATE POLICY "companies_delete_policy" ON public.companies FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 2. SITES ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    mandatory_racs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sites_company_id ON public.sites(company_id);

CREATE OR REPLACE FUNCTION update_sites_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sites_updated_at ON public.sites;
CREATE TRIGGER trg_sites_updated_at
    BEFORE UPDATE ON public.sites
    FOR EACH ROW
    EXECUTE FUNCTION update_sites_updated_at();

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sites' AND policyname = 'sites_select_policy') THEN
        CREATE POLICY "sites_select_policy" ON public.sites FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sites' AND policyname = 'sites_insert_policy') THEN
        CREATE POLICY "sites_insert_policy" ON public.sites FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sites' AND policyname = 'sites_update_policy') THEN
        CREATE POLICY "sites_update_policy" ON public.sites FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sites' AND policyname = 'sites_delete_policy') THEN
        CREATE POLICY "sites_delete_policy" ON public.sites FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 3. EMPLOYEES ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    record_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    department VARCHAR(255),
    role VARCHAR(255),
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    photo_url TEXT,
    driver_license_number VARCHAR(255),
    driver_license_class VARCHAR(100),
    driver_license_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_record_id ON public.employees(record_id);
CREATE INDEX IF NOT EXISTS idx_employees_site_id ON public.employees(site_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON public.employees(company);

CREATE OR REPLACE FUNCTION update_employees_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON public.employees;
CREATE TRIGGER trg_employees_updated_at
    BEFORE UPDATE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION update_employees_updated_at();

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'employees_select_policy') THEN
        CREATE POLICY "employees_select_policy" ON public.employees FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'employees_insert_policy') THEN
        CREATE POLICY "employees_insert_policy" ON public.employees FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'employees_update_policy') THEN
        CREATE POLICY "employees_update_policy" ON public.employees FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employees' AND policyname = 'employees_delete_policy') THEN
        CREATE POLICY "employees_delete_policy" ON public.employees FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 4. USERS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'User',
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
    company VARCHAR(255),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    job_title VARCHAR(255),
    phone_number VARCHAR(50),
    department VARCHAR(255),
    site_id VARCHAR(50) DEFAULT 'all',
    app_module VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_select_policy') THEN
        CREATE POLICY "users_select_policy" ON public.users FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_insert_policy') THEN
        CREATE POLICY "users_insert_policy" ON public.users FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_update_policy') THEN
        CREATE POLICY "users_update_policy" ON public.users FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_delete_policy') THEN
        CREATE POLICY "users_delete_policy" ON public.users FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 5. RAC_DEFINITIONS ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rac_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    validity_months INTEGER,
    requires_driver_license BOOLEAN DEFAULT false,
    requires_practical BOOLEAN DEFAULT false,
    pass_score INTEGER DEFAULT 70,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rac_definitions_code ON public.rac_definitions(code);
CREATE INDEX IF NOT EXISTS idx_rac_definitions_company_id ON public.rac_definitions(company_id);

CREATE OR REPLACE FUNCTION update_rac_definitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rac_definitions_updated_at ON public.rac_definitions;
CREATE TRIGGER trg_rac_definitions_updated_at
    BEFORE UPDATE ON public.rac_definitions
    FOR EACH ROW
    EXECUTE FUNCTION update_rac_definitions_updated_at();

ALTER TABLE public.rac_definitions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rac_definitions' AND policyname = 'rac_definitions_select_policy') THEN
        CREATE POLICY "rac_definitions_select_policy" ON public.rac_definitions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rac_definitions' AND policyname = 'rac_definitions_insert_policy') THEN
        CREATE POLICY "rac_definitions_insert_policy" ON public.rac_definitions FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rac_definitions' AND policyname = 'rac_definitions_update_policy') THEN
        CREATE POLICY "rac_definitions_update_policy" ON public.rac_definitions FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rac_definitions' AND policyname = 'rac_definitions_delete_policy') THEN
        CREATE POLICY "rac_definitions_delete_policy" ON public.rac_definitions FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 6. ROOMS ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 20,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rooms_site_id ON public.rooms(site_id);

CREATE OR REPLACE FUNCTION update_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rooms_updated_at ON public.rooms;
CREATE TRIGGER trg_rooms_updated_at
    BEFORE UPDATE ON public.rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_rooms_updated_at();

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rooms' AND policyname = 'rooms_select_policy') THEN
        CREATE POLICY "rooms_select_policy" ON public.rooms FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rooms' AND policyname = 'rooms_insert_policy') THEN
        CREATE POLICY "rooms_insert_policy" ON public.rooms FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rooms' AND policyname = 'rooms_update_policy') THEN
        CREATE POLICY "rooms_update_policy" ON public.rooms FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'rooms' AND policyname = 'rooms_delete_policy') THEN
        CREATE POLICY "rooms_delete_policy" ON public.rooms FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 7. TRAINERS ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    authorized_racs JSONB DEFAULT '[]'::jsonb,
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainers_site_id ON public.trainers(site_id);

CREATE OR REPLACE FUNCTION update_trainers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_trainers_updated_at ON public.trainers;
CREATE TRIGGER trg_trainers_updated_at
    BEFORE UPDATE ON public.trainers
    FOR EACH ROW
    EXECUTE FUNCTION update_trainers_updated_at();

ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trainers' AND policyname = 'trainers_select_policy') THEN
        CREATE POLICY "trainers_select_policy" ON public.trainers FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trainers' AND policyname = 'trainers_insert_policy') THEN
        CREATE POLICY "trainers_insert_policy" ON public.trainers FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trainers' AND policyname = 'trainers_update_policy') THEN
        CREATE POLICY "trainers_update_policy" ON public.trainers FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'trainers' AND policyname = 'trainers_delete_policy') THEN
        CREATE POLICY "trainers_delete_policy" ON public.trainers FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 8. TRAINING_SESSIONS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rac_type VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time VARCHAR(10) DEFAULT '09:00',
    location VARCHAR(255),
    instructor VARCHAR(255),
    capacity INTEGER NOT NULL DEFAULT 20,
    session_language VARCHAR(20) DEFAULT 'English' CHECK (session_language IN ('English', 'Portuguese')),
    site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_date ON public.training_sessions(date);
CREATE INDEX IF NOT EXISTS idx_training_sessions_site_id ON public.training_sessions(site_id);

CREATE OR REPLACE FUNCTION update_training_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_training_sessions_updated_at ON public.training_sessions;
CREATE TRIGGER trg_training_sessions_updated_at
    BEFORE UPDATE ON public.training_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_training_sessions_updated_at();

ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_sessions' AND policyname = 'training_sessions_select_policy') THEN
        CREATE POLICY "training_sessions_select_policy" ON public.training_sessions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_sessions' AND policyname = 'training_sessions_insert_policy') THEN
        CREATE POLICY "training_sessions_insert_policy" ON public.training_sessions FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_sessions' AND policyname = 'training_sessions_update_policy') THEN
        CREATE POLICY "training_sessions_update_policy" ON public.training_sessions FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'training_sessions' AND policyname = 'training_sessions_delete_policy') THEN
        CREATE POLICY "training_sessions_delete_policy" ON public.training_sessions FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 9. RECORDS (Bookings) ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    result_date DATE,
    expiry_date DATE,
    theory_score NUMERIC DEFAULT 0,
    practical_score NUMERIC DEFAULT 0,
    attendance BOOLEAN DEFAULT false,
    driver_license_verified BOOLEAN DEFAULT false,
    is_auto_booked BOOLEAN DEFAULT false,
    comments TEXT,
    trainer_name VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_records_session_id ON public.records(session_id);
CREATE INDEX IF NOT EXISTS idx_records_employee_id ON public.records(employee_id);
CREATE INDEX IF NOT EXISTS idx_records_status ON public.records(status);

CREATE OR REPLACE FUNCTION update_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_records_updated_at ON public.records;
CREATE TRIGGER trg_records_updated_at
    BEFORE UPDATE ON public.records
    FOR EACH ROW
    EXECUTE FUNCTION update_records_updated_at();

ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'records' AND policyname = 'records_select_policy') THEN
        CREATE POLICY "records_select_policy" ON public.records FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'records' AND policyname = 'records_insert_policy') THEN
        CREATE POLICY "records_insert_policy" ON public.records FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'records' AND policyname = 'records_update_policy') THEN
        CREATE POLICY "records_update_policy" ON public.records FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'records' AND policyname = 'records_delete_policy') THEN
        CREATE POLICY "records_delete_policy" ON public.records FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 10. WAITING_LIST ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.waiting_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.training_sessions(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waiting_list_session_id ON public.waiting_list(session_id);
CREATE INDEX IF NOT EXISTS idx_waiting_list_employee_id ON public.waiting_list(employee_id);

ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiting_list' AND policyname = 'waiting_list_select_policy') THEN
        CREATE POLICY "waiting_list_select_policy" ON public.waiting_list FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiting_list' AND policyname = 'waiting_list_insert_policy') THEN
        CREATE POLICY "waiting_list_insert_policy" ON public.waiting_list FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'waiting_list' AND policyname = 'waiting_list_delete_policy') THEN
        CREATE POLICY "waiting_list_delete_policy" ON public.waiting_list FOR DELETE USING (true);
    END IF;
END $$;

-- ─── 11. EMPLOYEE_REQUIREMENTS ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.employee_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID UNIQUE REFERENCES public.employees(id) ON DELETE CASCADE,
    aso_expiry_date DATE,
    required_racs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employee_requirements_employee_id ON public.employee_requirements(employee_id);

CREATE OR REPLACE FUNCTION update_employee_requirements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employee_requirements_updated_at ON public.employee_requirements;
CREATE TRIGGER trg_employee_requirements_updated_at
    BEFORE UPDATE ON public.employee_requirements
    FOR EACH ROW
    EXECUTE FUNCTION update_employee_requirements_updated_at();

ALTER TABLE public.employee_requirements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_requirements' AND policyname = 'employee_requirements_select_policy') THEN
        CREATE POLICY "employee_requirements_select_policy" ON public.employee_requirements FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_requirements' AND policyname = 'employee_requirements_insert_policy') THEN
        CREATE POLICY "employee_requirements_insert_policy" ON public.employee_requirements FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'employee_requirements' AND policyname = 'employee_requirements_update_policy') THEN
        CREATE POLICY "employee_requirements_update_policy" ON public.employee_requirements FOR UPDATE USING (true);
    END IF;
END $$;

-- ─── 12. CLINIC_EXAMINATIONS (FormBuilder portal) ────────────────────────────

CREATE TABLE IF NOT EXISTS public.clinic_examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    process_id UUID,
    blood_pressure VARCHAR(255) NOT NULL,
    heart_rate NUMERIC NOT NULL,
    vision_test VARCHAR(100) NOT NULL CHECK (vision_test IN ('Pass', 'Fail')),
    drug_screen VARCHAR(100) NOT NULL CHECK (drug_screen IN ('Negative', 'Positive')),
    hearing VARCHAR(100) CHECK (hearing IN ('Normal', 'Impaired')),
    musculoskeletal VARCHAR(100) CHECK (musculoskeletal IN ('Normal', 'Impaired')),
    bmi VARCHAR(255),
    fit_for_work BOOLEAN DEFAULT false NOT NULL,
    restrictions VARCHAR(255),
    examiner_name VARCHAR(255) NOT NULL,
    examination_type VARCHAR(100) NOT NULL CHECK (examination_type IN ('Pre-Employment', 'Periodic', 'Return-to-Work')),
    valid_months NUMERIC NOT NULL,
    clinical_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinic_examinations_employee_id ON public.clinic_examinations(employee_id);
CREATE INDEX IF NOT EXISTS idx_clinic_examinations_process_id ON public.clinic_examinations(process_id);

CREATE OR REPLACE FUNCTION update_clinic_examinations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clinic_examinations_updated_at ON public.clinic_examinations;
CREATE TRIGGER trg_clinic_examinations_updated_at
    BEFORE UPDATE ON public.clinic_examinations
    FOR EACH ROW
    EXECUTE FUNCTION update_clinic_examinations_updated_at();

ALTER TABLE public.clinic_examinations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinic_examinations' AND policyname = 'clinic_examinations_select_policy') THEN
        CREATE POLICY "clinic_examinations_select_policy" ON public.clinic_examinations FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinic_examinations' AND policyname = 'clinic_examinations_insert_policy') THEN
        CREATE POLICY "clinic_examinations_insert_policy" ON public.clinic_examinations FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinic_examinations' AND policyname = 'clinic_examinations_update_policy') THEN
        CREATE POLICY "clinic_examinations_update_policy" ON public.clinic_examinations FOR UPDATE USING (true);
    END IF;
END $$;

-- ─── 13. SECURITY_CLEARANCES (FormBuilder portal) ───────────────────────────

CREATE TABLE IF NOT EXISTS public.security_clearances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    process_id UUID,
    badge_number VARCHAR(255) NOT NULL,
    badge_type VARCHAR(100) NOT NULL CHECK (badge_type IN ('Temporary', 'Permanent', 'Visitor', 'Contractor')),
    access_level VARCHAR(100) NOT NULL CHECK (access_level IN ('General', 'Restricted', 'High-Security', 'Administrative')),
    permitted_zones VARCHAR(255),
    background_check VARCHAR(100) NOT NULL CHECK (background_check IN ('Cleared', 'Pending', 'Flagged')),
    photo_captured BOOLEAN DEFAULT false NOT NULL,
    id_document_verified BOOLEAN DEFAULT false NOT NULL,
    issued_by VARCHAR(255) NOT NULL,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    security_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_clearances_employee_id ON public.security_clearances(employee_id);
CREATE INDEX IF NOT EXISTS idx_security_clearances_process_id ON public.security_clearances(process_id);

CREATE OR REPLACE FUNCTION update_security_clearances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_security_clearances_updated_at ON public.security_clearances;
CREATE TRIGGER trg_security_clearances_updated_at
    BEFORE UPDATE ON public.security_clearances
    FOR EACH ROW
    EXECUTE FUNCTION update_security_clearances_updated_at();

ALTER TABLE public.security_clearances ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_clearances' AND policyname = 'security_clearances_select_policy') THEN
        CREATE POLICY "security_clearances_select_policy" ON public.security_clearances FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_clearances' AND policyname = 'security_clearances_insert_policy') THEN
        CREATE POLICY "security_clearances_insert_policy" ON public.security_clearances FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'security_clearances' AND policyname = 'security_clearances_update_policy') THEN
        CREATE POLICY "security_clearances_update_policy" ON public.security_clearances FOR UPDATE USING (true);
    END IF;
END $$;

-- ─── 14. HR_DOCUMENTS (FormBuilder portal) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.hr_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
    process_id UUID,
    national_id VARCHAR(255) NOT NULL,
    passport_number VARCHAR(255),
    work_permit VARCHAR(255),
    contract_type VARCHAR(100) NOT NULL CHECK (contract_type IN ('Permanent', 'Fixed-Term', 'Contractor', 'Intern')),
    start_date DATE NOT NULL,
    end_date DATE,
    emergency_contact_name VARCHAR(255) NOT NULL,
    emergency_contact_phone VARCHAR(20) NOT NULL,
    bank_account VARCHAR(255),
    tax_id VARCHAR(255) NOT NULL,
    marital_status VARCHAR(100) CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed')),
    email_address VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    address TEXT,
    hr_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hr_documents_employee_id ON public.hr_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_documents_process_id ON public.hr_documents(process_id);

CREATE OR REPLACE FUNCTION update_hr_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hr_documents_updated_at ON public.hr_documents;
CREATE TRIGGER trg_hr_documents_updated_at
    BEFORE UPDATE ON public.hr_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_hr_documents_updated_at();

ALTER TABLE public.hr_documents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_documents' AND policyname = 'hr_documents_select_policy') THEN
        CREATE POLICY "hr_documents_select_policy" ON public.hr_documents FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_documents' AND policyname = 'hr_documents_insert_policy') THEN
        CREATE POLICY "hr_documents_insert_policy" ON public.hr_documents FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hr_documents' AND policyname = 'hr_documents_update_policy') THEN
        CREATE POLICY "hr_documents_update_policy" ON public.hr_documents FOR UPDATE USING (true);
    END IF;
END $$;

-- ─── 15. DATA_CONNECTORS ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.data_connectors (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    last_sync TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'Idle' CHECK (status IN ('Healthy', 'Error', 'Idle', 'Authorized')),
    color VARCHAR(50),
    source VARCHAR(255),
    config JSONB DEFAULT '{}'::jsonb,
    mapping JSONB DEFAULT '{}'::jsonb,
    module_mapping JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_data_connectors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_data_connectors_updated_at ON public.data_connectors;
CREATE TRIGGER trg_data_connectors_updated_at
    BEFORE UPDATE ON public.data_connectors
    FOR EACH ROW
    EXECUTE FUNCTION update_data_connectors_updated_at();

ALTER TABLE public.data_connectors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_connectors' AND policyname = 'data_connectors_select_policy') THEN
        CREATE POLICY "data_connectors_select_policy" ON public.data_connectors FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_connectors' AND policyname = 'data_connectors_insert_policy') THEN
        CREATE POLICY "data_connectors_insert_policy" ON public.data_connectors FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'data_connectors' AND policyname = 'data_connectors_update_policy') THEN
        CREATE POLICY "data_connectors_update_policy" ON public.data_connectors FOR UPDATE USING (true);
    END IF;
END $$;

-- ─── 16. FEEDBACK ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.feedback (
    id VARCHAR(100) PRIMARY KEY,
    user_id VARCHAR(100),
    user_name VARCHAR(255),
    type VARCHAR(50) CHECK (type IN ('Bug', 'Improvement', 'General')),
    message TEXT,
    status VARCHAR(50) DEFAULT 'New' CHECK (status IN ('New', 'In Progress', 'Resolved', 'Dismissed')),
    is_actionable BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT now(),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'feedback_select_policy') THEN
        CREATE POLICY "feedback_select_policy" ON public.feedback FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'feedback_insert_policy') THEN
        CREATE POLICY "feedback_insert_policy" ON public.feedback FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'feedback' AND policyname = 'feedback_update_policy') THEN
        CREATE POLICY "feedback_update_policy" ON public.feedback FOR UPDATE USING (true);
    END IF;
END $$;

-- ─── 17. SYSTEM_LOGS ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL DEFAULT 'INFO',
    message_key TEXT NOT NULL,
    user_name VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_timestamp ON public.system_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_level ON public.system_logs(level);

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_logs' AND policyname = 'system_logs_select_policy') THEN
        CREATE POLICY "system_logs_select_policy" ON public.system_logs FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'system_logs' AND policyname = 'system_logs_insert_policy') THEN
        CREATE POLICY "system_logs_insert_policy" ON public.system_logs FOR INSERT WITH CHECK (true);
    END IF;
END $$;

-- ─── 18. UNSAFE_CONDITIONS (SafeMap Module) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.unsafe_conditions (
    id VARCHAR(100) PRIMARY KEY,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    function_location VARCHAR(255),
    condition_type VARCHAR(255),
    responsible_area VARCHAR(255),
    description TEXT,
    action_plan TEXT,
    initial_photos JSONB DEFAULT '[]'::jsonb,
    correction_photos JSONB DEFAULT '[]'::jsonb,
    observer_id VARCHAR(100),
    observer_name VARCHAR(255),
    ssma_focal_point_id VARCHAR(100),
    ssma_focal_point_name VARCHAR(255),
    area_responsible_id VARCHAR(100),
    area_responsible_name VARCHAR(255),
    area_manager_id VARCHAR(100),
    area_manager_name VARCHAR(255),
    state VARCHAR(50) DEFAULT 'Criado',
    map_status VARCHAR(50) DEFAULT 'Recente',
    severity VARCHAR(20) DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    category VARCHAR(50) DEFAULT 'Unsafe Condition' CHECK (category IN ('Unsafe Condition', 'Unsafe Act', 'Near Miss', 'Positive Observation')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_unsafe_conditions_state ON public.unsafe_conditions(state);

ALTER TABLE public.unsafe_conditions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'unsafe_conditions' AND policyname = 'unsafe_conditions_select_policy') THEN
        CREATE POLICY "unsafe_conditions_select_policy" ON public.unsafe_conditions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'unsafe_conditions' AND policyname = 'unsafe_conditions_insert_policy') THEN
        CREATE POLICY "unsafe_conditions_insert_policy" ON public.unsafe_conditions FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'unsafe_conditions' AND policyname = 'unsafe_conditions_update_policy') THEN
        CREATE POLICY "unsafe_conditions_update_policy" ON public.unsafe_conditions FOR UPDATE USING (true);
    END IF;
END $$;

-- ─── 19. EXEC_SQL RPC FUNCTION (for FormBuilder) ───────────────────────────

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 20. RECRUITMENT_PROCESSES (Mobilization Pipeline) ──────────────────────

CREATE TABLE IF NOT EXISTS public.recruitment_processes (
    id VARCHAR(100) PRIMARY KEY,
    candidate_name VARCHAR(255) NOT NULL,
    candidate_email VARCHAR(255),
    candidate_phone VARCHAR(100),
    candidate_id_number VARCHAR(100),
    worker_type VARCHAR(50) DEFAULT 'Prime' CHECK (worker_type IN ('Prime', 'Contractor')),
    prime_company VARCHAR(255),
    contractor_company VARCHAR(255),
    company VARCHAR(255),
    department VARCHAR(255),
    role VARCHAR(255),
    required_racs JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(100) NOT NULL DEFAULT 'AM Requested',
    requested_by VARCHAR(255),
    requested_at TIMESTAMPTZ DEFAULT now(),
    documents JSONB DEFAULT '[]'::jsonb,
    am_documents JSONB DEFAULT '[]'::jsonb,
    temporary_badge_number VARCHAR(100),
    security_cleared BOOLEAN DEFAULT false,
    clinic_fitness_cleared BOOLEAN DEFAULT false,
    medical_exam JSONB,
    fitness_certificate JSONB,
    induction_date TIMESTAMPTZ,
    induction_confirmed BOOLEAN DEFAULT false,
    training_completed_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    nudge_count INTEGER DEFAULT 0,
    last_nudge_at TIMESTAMPTZ,
    employee_id VARCHAR(100),
    record_id VARCHAR(100),
    request_type VARCHAR(50) DEFAULT 'Recruitment',
    equipment_type VARCHAR(255),
    equipment_id VARCHAR(255),
    responsible_person_name VARCHAR(255),
    responsible_person_phone VARCHAR(100),
    safety_inspection_cleared BOOLEAN DEFAULT false,
    safety_inspection_comments TEXT,
    safety_inspection_record_id VARCHAR(100),
    requires_medical BOOLEAN DEFAULT true,
    requires_induction BOOLEAN DEFAULT true,
    requires_rac BOOLEAN DEFAULT true,
    truck_model VARCHAR(255),
    truck_reg_number VARCHAR(100),
    po_number VARCHAR(100),
    access_start_date TIMESTAMPTZ,
    access_end_date TIMESTAMPTZ,
    canteen JSONB,
    access_reason TEXT,
    access_status VARCHAR(20),
    denial_reason TEXT,
    access_document_ref VARCHAR(255),
    area_manager_name VARCHAR(255),
    area_manager_phone VARCHAR(100),
    area_manager_department VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recruitment_processes_status ON public.recruitment_processes(status);
CREATE INDEX IF NOT EXISTS idx_recruitment_processes_company ON public.recruitment_processes(company);

CREATE OR REPLACE FUNCTION update_recruitment_processes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_recruitment_processes_updated_at ON public.recruitment_processes;
CREATE TRIGGER trg_recruitment_processes_updated_at
    BEFORE UPDATE ON public.recruitment_processes
    FOR EACH ROW
    EXECUTE FUNCTION update_recruitment_processes_updated_at();

ALTER TABLE public.recruitment_processes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recruitment_processes' AND policyname = 'recruitment_processes_select_policy') THEN
        CREATE POLICY "recruitment_processes_select_policy" ON public.recruitment_processes FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recruitment_processes' AND policyname = 'recruitment_processes_insert_policy') THEN
        CREATE POLICY "recruitment_processes_insert_policy" ON public.recruitment_processes FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recruitment_processes' AND policyname = 'recruitment_processes_update_policy') THEN
        CREATE POLICY "recruitment_processes_update_policy" ON public.recruitment_processes FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recruitment_processes' AND policyname = 'recruitment_processes_delete_policy') THEN
        CREATE POLICY "recruitment_processes_delete_policy" ON public.recruitment_processes FOR DELETE USING (true);
    END IF;
END $$;

-- ============================================================
-- SCHEMA DEPLOYMENT COMPLETE
-- ============================================================
