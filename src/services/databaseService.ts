
import { API_BASE, isSupabaseConfigured } from './supabaseClient';
import { Booking, Employee, TrainingSession, EmployeeRequirement, Site, Company, BookingStatus, User, UserRole, RacDef, Room, Trainer, Feedback, SystemNotification, DataConnector, UnsafeCondition, RecruitmentProcess, RecruitmentStatus } from '../types';

import { v4 as uuidv4 } from 'uuid';

// ─── API helper ─────────────────────────────────────────────────────────────────

let _serverReachable: boolean | null = null;

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            throw new Error(err.error || `API ${res.status}`);
        }
        _serverReachable = true;
        return res.json();
    } catch (e: any) {
        // If server is unreachable (static deployment / no backend), fail gracefully
        if (e.message?.includes('Failed to fetch') || e.message?.includes('API 404') || e.message?.includes('NetworkError') || e.message?.includes('ECONNREFUSED')) {
            if (_serverReachable !== false) {
                console.warn('⚠️ API server not reachable — running in offline mode. Data will be empty.');
                _serverReachable = false;
            }
            return [] as unknown as T;
        }
        throw e;
    }
}

function post<T>(path: string, body: any): Promise<T> {
    return apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) });
}

function del(path: string): Promise<any> {
    return apiFetch(path, { method: 'DELETE' });
}

function put(path: string, body: any): Promise<any> {
    return apiFetch(path, { method: 'PUT', body: JSON.stringify(body) });
}

// ─── UUID helper ────────────────────────────────────────────────────────────────

export const isUUID = (str: string | undefined): boolean => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
};

// ─── Column mappers (DB snake_case ↔ App camelCase) ─────────────────────────────

function mapCompanyFromDb(c: any): Company {
    return {
        id: c.id,
        name: c.name,
        appName: c.app_name,
        logoUrl: c.logo_url,
        safetyLogoUrl: c.safety_logo_url,
        status: (c.status as 'Active' | 'Inactive') || 'Active',
        defaultLanguage: (c.default_language as 'en' | 'pt') || 'en',
        parentId: c.parent_id || undefined,
        tier: (c.tier as 'Prime' | 'Sub') || 'Prime',
        features: c.features || { alcohol: false },
        address: c.address,
        gpsCoordinates: c.gps_coordinates,
        contactPerson: c.contact_person,
        contactCell: c.contact_cell,
        contactEmail: c.contact_email,
        isPaid: c.is_paid,
        registrationDate: c.registration_date,
        selectedModules: c.selected_modules || []
    };
}

function mapEmployeeFromDb(data: any): Employee {
    if (!data) return data;
    return {
        id: data.id,
        recordId: data.record_id,
        name: data.name,
        company: data.company,
        department: data.department,
        role: data.role,
        siteId: data.site_id || undefined,
        phoneNumber: data.phone_number,
        driverLicenseNumber: data.driver_license_number,
        driverLicenseClass: data.driver_license_class,
        driverLicenseExpiry: data.driver_license_expiry,
        isActive: data.is_active
    };
}

function mapUserFromDb(data: any): User {
    if (!data) return data;
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        status: data.status as 'Active' | 'Inactive',
        company: data.company,
        companyId: data.company_id,
        companyLogo: data.company_logo,
        jobTitle: data.job_title || '',
        phoneNumber: data.phone_number || '',
        department: data.department,
        siteId: data.site_id || 'all',
        appModule: data.app_module
    };
}

function mapSessionFromDb(s: any): TrainingSession {
    return {
        id: s.id,
        racType: s.rac_type,
        date: s.date,
        startTime: s.start_time,
        location: s.location,
        instructor: s.instructor,
        capacity: s.capacity,
        sessionLanguage: s.session_language,
        siteId: s.site_id
    };
}

function mapBookingFromDb(data: any): Booking {
    const emp = data.employee ? mapEmployeeFromDb(data.employee) : {
        id: data.employee_id,
        recordId: '',
        name: 'Unknown',
        company: '',
        department: '',
        role: ''
    };
    return {
        id: data.id,
        sessionId: data.session_id,
        employee: emp,
        status: data.status as BookingStatus,
        resultDate: data.result_date,
        expiryDate: data.expiry_date,
        theoryScore: data.theory_score,
        practicalScore: data.practical_score,
        attendance: data.attendance,
        driverLicenseVerified: data.driver_license_verified,
        isAutoBooked: data.is_auto_booked,
        comments: data.comments,
        trainerName: data.trainer_name
    };
}

function mapRequirementFromDb(r: any): EmployeeRequirement {
    return {
        employeeId: r.employee_id,
        asoExpiryDate: r.aso_expiry_date,
        requiredRacs: r.required_racs || {}
    };
}

function mapRacDefFromDb(r: any): RacDef {
    return {
        id: r.id,
        companyId: r.company_id,
        code: r.code,
        name: r.name,
        validityMonths: r.validity_months,
        requiresDriverLicense: r.requires_driver_license,
        requiresPractical: r.requires_practical,
        passScore: r.pass_score || 70
    };
}

function mapTrainerFromDb(t: any): Trainer {
    return {
        id: t.id,
        name: t.name,
        racs: t.authorized_racs || [],
        siteId: t.site_id
    };
}

function mapConnectorFromDb(c: any): DataConnector {
    return {
        id: c.id,
        name: c.name,
        type: c.type,
        lastSync: c.last_sync,
        status: c.status,
        color: c.color,
        source: c.source,
        config: c.config || {},
        mapping: c.mapping || {},
        moduleMapping: c.module_mapping || {}
    };
}

function mapUnsafeConditionFromDb(c: any): UnsafeCondition {
    return {
        id: c.id,
        latitude: c.latitude,
        longitude: c.longitude,
        functionLocation: c.function_location,
        conditionType: c.condition_type,
        responsibleArea: c.responsible_area,
        description: c.description,
        actionPlan: c.action_plan,
        initialPhotos: c.initial_photos || [],
        correctionPhotos: c.correction_photos || [],
        observerId: c.observer_id,
        observerName: c.observer_name,
        ssmaFocalPointId: c.ssma_focal_point_id,
        ssmaFocalPointName: c.ssma_focal_point_name,
        areaResponsibleId: c.area_responsible_id,
        areaResponsibleName: c.area_responsible_name,
        areaManagerId: c.area_manager_id,
        areaManagerName: c.area_manager_name,
        state: c.state,
        mapStatus: c.map_status,
        severity: c.severity || 'Medium',
        category: c.category || 'Unsafe Condition',
        createdAt: c.created_at,
        resolvedAt: c.resolved_at
    };
}

function mapRecruitmentProcessFromDb(r: any): RecruitmentProcess {
    return {
        id: r.id,
        candidateName: r.candidate_name,
        candidateEmail: r.candidate_email,
        candidatePhone: r.candidate_phone,
        candidateIdNumber: r.candidate_id_number,
        workerType: r.worker_type || 'Prime',
        primeCompany: r.prime_company,
        contractorCompany: r.contractor_company,
        company: r.company,
        department: r.department,
        role: r.role,
        requiredRacs: r.required_racs || [],
        status: r.status as RecruitmentStatus,
        requestedBy: r.requested_by,
        requestedAt: r.requested_at,
        documents: r.documents || [],
        amDocuments: r.am_documents || [],
        temporaryBadgeNumber: r.temporary_badge_number,
        securityCleared: r.security_cleared,
        clinicFitnessCleared: r.clinic_fitness_cleared,
        medicalExam: r.medical_exam || undefined,
        fitnessCertificate: r.fitness_certificate || undefined,
        inductionDate: r.induction_date,
        inductionConfirmed: r.induction_confirmed,
        trainingCompletedAt: r.training_completed_at,
        receivedAt: r.received_at,
        nudgeCount: r.nudge_count || 0,
        lastNudgeAt: r.last_nudge_at,
        employeeId: r.employee_id,
        recordId: r.record_id,
        requestType: r.request_type || 'Recruitment',
        equipmentType: r.equipment_type,
        equipmentId: r.equipment_id,
        responsiblePersonName: r.responsible_person_name,
        responsiblePersonPhone: r.responsible_person_phone,
        safetyInspectionCleared: r.safety_inspection_cleared,
        safetyInspectionComments: r.safety_inspection_comments,
        safetyInspectionRecordId: r.safety_inspection_record_id,
        requiresMedical: r.requires_medical,
        requiresInduction: r.requires_induction,
        requiresRac: r.requires_rac,
        truckModel: r.truck_model,
        truckRegNumber: r.truck_reg_number,
        poNumber: r.po_number,
        accessStartDate: r.access_start_date,
        accessEndDate: r.access_end_date,
        canteen: r.canteen || undefined,
        accessReason: r.access_reason,
        accessStatus: r.access_status,
        denialReason: r.denial_reason,
        accessDocumentRef: r.access_document_ref,
        areaManagerName: r.area_manager_name,
        areaManagerPhone: r.area_manager_phone,
        areaManagerDepartment: r.area_manager_department
    };
}

// ─── localStorage helper for formbuilder schemas ────────────────────────────────

const getLocalStorageJson = (key: string, defaultVal: any) => {
    try {
        const item = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
        return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
        return defaultVal;
    }
};

const saveLocalStorageJson = (key: string, val: any) => {
    try {
        if (typeof window !== 'undefined') {
            localStorage.setItem(key, JSON.stringify(val));
        }
    } catch (e) {
        console.error("Failed to save to localStorage", e);
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
//  DATABASE SERVICE — All operations via REST API
// ═══════════════════════════════════════════════════════════════════════════════

export const db = {
    async syncFromLocalServer() {
        // No-op: the Express server IS the data source now
    },

    // ─── Companies ──────────────────────────────────────────────────────────────

    async getCompanies(): Promise<Company[]> {
        const raw = await apiFetch<any[]>('/companies');
        return raw.map(mapCompanyFromDb);
    },

    async saveCompany(company: Company): Promise<Company> {
        const payload = {
            id: isUUID(company.id) ? company.id : uuidv4(),
            name: company.name,
            app_name: company.appName,
            logo_url: company.logoUrl,
            safety_logo_url: company.safetyLogoUrl,
            status: company.status || 'Active',
            default_language: company.defaultLanguage || 'en',
            parent_id: company.parentId && isUUID(company.parentId) ? company.parentId : null,
            tier: company.tier || 'Prime',
            features: company.features || { alcohol: false }
        };
        const raw = await post<any>('/companies', payload);
        return mapCompanyFromDb(raw);
    },

    // ─── Sites ──────────────────────────────────────────────────────────────────

    async getSites(): Promise<Site[]> {
        return apiFetch<Site[]>('/sites');
    },

    async saveSite(site: Site) {
        const payload = {
            id: isUUID(site.id) ? site.id : uuidv4(),
            company_id: isUUID(site.companyId) ? site.companyId : null,
            name: site.name,
            location: site.location,
            mandatory_racs: site.mandatoryRacs || []
        };
        return post('/sites', payload);
    },

    async deleteSite(id: string) {
        return del(`/sites/${id}`);
    },

    // ─── Users ──────────────────────────────────────────────────────────────────

    async getUsers(): Promise<User[]> {
        const raw = await apiFetch<any[]>('/users');
        return raw.map(mapUserFromDb);
    },

    async upsertUser(user: Partial<User>) {
        const payload: any = {
            name: user.name,
            email: user.email,
            role: user.role || 'User',
            status: user.status || 'Active',
            company: user.company,
            job_title: user.jobTitle,
            phone_number: user.phoneNumber,
            department: user.department,
            site_id: user.siteId || 'all',
            app_module: (user as any).appModule || null
        };
        // @ts-ignore
        if (user.password) payload.password = user.password;
        const raw = await post<any>('/users', payload);
        return mapUserFromDb(raw);
    },

    async updateUserPassword(id: number, password: string) {
        return put(`/users/${id}/password`, { password });
    },

    async deleteUser(id: number) {
        return del(`/users/${id}`);
    },

    // ─── Employees ──────────────────────────────────────────────────────────────

    async getEmployees(): Promise<Employee[]> {
        const raw = await apiFetch<any[]>('/employees');
        return raw.map(mapEmployeeFromDb);
    },

    async upsertEmployee(emp: Partial<Employee>) {
        const payload = {
            id: isUUID(emp.id) ? emp.id : uuidv4(),
            record_id: emp.recordId || '',
            name: emp.name,
            company: emp.company,
            department: emp.department,
            role: emp.role,
            site_id: isUUID(emp.siteId) ? emp.siteId : null,
            phone_number: emp.phoneNumber,
            driver_license_number: emp.driverLicenseNumber,
            driver_license_class: emp.driverLicenseClass,
            driver_license_expiry: emp.driverLicenseExpiry || null,
            is_active: emp.isActive ?? true
        };
        const raw = await post<any>('/employees', payload);
        return mapEmployeeFromDb(raw);
    },

    async bulkUpsertEmployees(employees: Partial<Employee>[]) {
        const payload = employees.map(e => ({
            id: isUUID(e.id) ? e.id : uuidv4(),
            record_id: e.recordId || '',
            name: e.name || 'Unknown',
            company: e.company || 'Unknown',
            department: e.department || 'N/A',
            role: e.role || 'N/A',
            site_id: isUUID(e.siteId) ? e.siteId : null,
            phone_number: e.phoneNumber,
            driver_license_number: e.driverLicenseNumber,
            driver_license_class: e.driverLicenseClass,
            driver_license_expiry: e.driverLicenseExpiry || null,
            is_active: e.isActive ?? true
        }));
        return post<any[]>('/employees/bulk', { employees: payload });
    },

    async deleteEmployee(id: string) {
        return del(`/employees/${id}`);
    },

    // ─── Sessions ───────────────────────────────────────────────────────────────

    async getSessions(): Promise<TrainingSession[]> {
        const raw = await apiFetch<any[]>('/sessions');
        return raw.map(mapSessionFromDb);
    },

    async saveSession(session: Partial<TrainingSession>): Promise<TrainingSession> {
        const payload = {
            id: isUUID(session.id) ? session.id : uuidv4(),
            rac_type: session.racType,
            date: session.date,
            start_time: session.startTime,
            location: session.location,
            instructor: session.instructor,
            capacity: session.capacity,
            session_language: session.sessionLanguage,
            site_id: isUUID(session.siteId) ? session.siteId : null
        };
        const raw = await post<any>('/sessions', payload);
        return mapSessionFromDb(raw);
    },

    async deleteSession(id: string): Promise<any> {
        return del(`/sessions/${id}`);
    },

    // ─── Bookings ───────────────────────────────────────────────────────────────

    async getBookings(): Promise<Booking[]> {
        const [bookingsRaw, waitlistRaw] = await Promise.all([
            apiFetch<any[]>('/bookings'),
            apiFetch<any[]>('/waitlist')
        ]);

        const bookings = bookingsRaw.map(mapBookingFromDb);
        const waitlist = waitlistRaw.map(w => ({
            id: w.id,
            sessionId: w.session_id,
            employee: mapEmployeeFromDb(w.employee),
            status: BookingStatus.WAITLISTED,
            resultDate: null,
            expiryDate: null,
            theoryScore: 0,
            practicalScore: 0,
            attendance: false
        } as Booking));

        return [...bookings, ...waitlist];
    },

    async saveBooking(booking: Partial<Booking>) {
        if (booking.status === BookingStatus.WAITLISTED) {
            await this.saveWaitlistEntry(booking.sessionId!, booking.employee!.id);
            return booking;
        }

        const payload = {
            id: isUUID(booking.id) ? booking.id : uuidv4(),
            session_id: isUUID(booking.sessionId) ? booking.sessionId : null,
            employee_id: booking.employee?.id,
            status: booking.status || 'Pending',
            result_date: booking.resultDate || null,
            expiry_date: booking.expiryDate || null,
            theory_score: booking.theoryScore || 0,
            practical_score: booking.practicalScore || 0,
            attendance: booking.attendance || false,
            driver_license_verified: booking.driverLicenseVerified || false,
            is_auto_booked: booking.isAutoBooked || false,
            comments: booking.comments || null,
            trainer_name: booking.trainerName || null
        };
        return post('/bookings', payload);
    },

    async bulkUpsertBookings(bookings: Partial<Booking>[]) {
        const payload = bookings.map(b => ({
            id: isUUID(b.id) ? b.id : uuidv4(),
            session_id: isUUID(b.sessionId) ? b.sessionId : null,
            employee_id: b.employee?.id,
            status: b.status || 'Pending',
            result_date: b.resultDate || null,
            expiry_date: b.expiryDate || null,
            theory_score: b.theoryScore || 0,
            practical_score: b.practicalScore || 0,
            attendance: b.attendance || false,
            trainer_name: b.trainerName || null,
            comments: b.comments || null
        }));
        return post('/bookings/bulk', { bookings: payload });
    },

    // ─── Waitlist ───────────────────────────────────────────────────────────────

    async saveWaitlistEntry(sessionId: string, employeeId: string) {
        return post('/waitlist', { session_id: sessionId, employee_id: employeeId });
    },

    async promoteFromWaitlist(entryId: string, sessionId: string, employeeId: string) {
        return post(`/waitlist/${entryId}/promote`, { session_id: sessionId, employee_id: employeeId });
    },

    async removeFromWaitlist(entryId: string) {
        return del(`/waitlist/${entryId}`);
    },

    // ─── Requirements ───────────────────────────────────────────────────────────

    async getRequirements(): Promise<EmployeeRequirement[]> {
        const raw = await apiFetch<any[]>('/requirements');
        return raw.map(mapRequirementFromDb);
    },

    async updateRequirement(req: EmployeeRequirement) {
        return post('/requirements', {
            employee_id: req.employeeId,
            aso_expiry_date: req.asoExpiryDate || null,
            required_racs: req.requiredRacs || {}
        });
    },

    async bulkUpsertRequirements(reqs: EmployeeRequirement[]) {
        const payload = reqs.map(r => ({
            employee_id: r.employeeId,
            aso_expiry_date: r.asoExpiryDate || null,
            required_racs: r.requiredRacs || {}
        }));
        return post('/requirements/bulk', { requirements: payload });
    },

    // ─── RAC Definitions ────────────────────────────────────────────────────────

    async getRacDefinitions(): Promise<RacDef[]> {
        const raw = await apiFetch<any[]>('/rac-definitions');
        return raw.map(mapRacDefFromDb);
    },

    async saveRacDefinition(rac: RacDef) {
        const payload = {
            id: isUUID(rac.id) ? rac.id : uuidv4(),
            company_id: rac.companyId && isUUID(rac.companyId) ? rac.companyId : null,
            code: rac.code,
            name: rac.name,
            validity_months: rac.validityMonths,
            requires_driver_license: rac.requiresDriverLicense || false,
            requires_practical: rac.requiresPractical || false,
            pass_score: rac.passScore || 70
        };
        return post('/rac-definitions', payload);
    },

    async deleteRacDefinition(id: string) {
        return del(`/rac-definitions/${id}`);
    },

    // ─── Rooms ──────────────────────────────────────────────────────────────────

    async getRooms(): Promise<Room[]> {
        return apiFetch<Room[]>('/rooms');
    },

    async saveRoom(room: Room) {
        const payload = {
            id: isUUID(room.id) ? room.id : uuidv4(),
            name: room.name,
            capacity: room.capacity,
            site_id: isUUID(room.siteId) ? room.siteId : null
        };
        return post('/rooms', payload);
    },

    async deleteRoom(id: string) {
        return del(`/rooms/${id}`);
    },

    // ─── Trainers ───────────────────────────────────────────────────────────────

    async getTrainers(): Promise<Trainer[]> {
        const raw = await apiFetch<any[]>('/trainers');
        return raw.map(mapTrainerFromDb);
    },

    async saveTrainer(trainer: Trainer) {
        const payload = {
            id: isUUID(trainer.id) ? trainer.id : uuidv4(),
            name: trainer.name,
            authorized_racs: trainer.racs || [],
            site_id: isUUID(trainer.siteId) ? trainer.siteId : null
        };
        return post('/trainers', payload);
    },

    async deleteTrainer(id: string) {
        return del(`/trainers/${id}`);
    },

    // ─── Data Connectors ────────────────────────────────────────────────────────

    async getConnectors(): Promise<DataConnector[]> {
        const raw = await apiFetch<any[]>('/connectors');
        return raw.map(mapConnectorFromDb);
    },

    async saveConnector(connector: DataConnector): Promise<void> {
        await post('/connectors', {
            id: connector.id,
            name: connector.name,
            type: connector.type,
            last_sync: connector.lastSync,
            status: connector.status,
            color: connector.color,
            source: connector.source,
            config: connector.config,
            mapping: connector.mapping,
            module_mapping: connector.moduleMapping
        });
    },

    async syncExternalData(connectorId: string, rawData: any[], includeModules: boolean = false): Promise<{ added: number, updated: number }> {
        // --- 1. AUTO PROVISION COMPANIES ---
        const existingCompanies = await this.getCompanies();
        const primeCompany = existingCompanies.find(c =>
            c.name.toLowerCase() === 'vulcan' ||
            c.name.toLowerCase() === 'vulcan resources mozambique' ||
            c.id === 'c1' ||
            c.tier === 'Prime' ||
            !c.parentId
        );
        const primeCompanyId = primeCompany?.id || 'c1';

        const rawCompanyNames = Array.from(new Set(rawData.map(item => {
            if (connectorId === 'sf-hr') return item.company || 'Vulcan';
            return item.company || 'Unknown';
        }).filter(Boolean))) as string[];

        const companiesToCreate = rawCompanyNames.filter(name =>
            !existingCompanies.some(c => c.name.toLowerCase() === name.toLowerCase())
        );

        for (const name of companiesToCreate) {
            await this.saveCompany({
                id: uuidv4(),
                name,
                appName: name,
                status: 'Active',
                defaultLanguage: 'en',
                parentId: primeCompanyId,
                tier: 'Sub',
                features: { alcohol: false }
            });
        }

        // --- 2. UPSERT EMPLOYEES ---
        let added = 0, updated = 0;
        const currentEmployees = await this.getEmployees();

        for (const item of rawData) {
            const companyName = item.company || (connectorId === 'sf-hr' ? 'Vulcan' : 'Unknown');
            const existing = currentEmployees.find(e => e.recordId === item.id);

            await post('/employees/upsert', {
                id: existing?.id || uuidv4(),
                record_id: item.id,
                name: item.name,
                company: companyName,
                department: item.dept || 'Operations',
                role: item.role || 'Personnel',
                is_active: true,
                site_id: null
            });

            if (existing) updated++; else added++;

            if (includeModules && item.aso_expiry) {
                const racMatrix: Record<string, boolean> = {};
                if (Array.isArray(item.rac_flags)) {
                    item.rac_flags.forEach((f: string) => racMatrix[f] = true);
                }
                const empId = existing?.id || (await this.getEmployees()).find(e => e.recordId === item.id)?.id;
                if (empId) {
                    await this.updateRequirement({
                        employeeId: empId,
                        asoExpiryDate: item.aso_expiry,
                        requiredRacs: racMatrix
                    });
                }
            }
        }

        return { added, updated };
    },

    // ─── Feedback ───────────────────────────────────────────────────────────────

    async saveFeedback(f: Partial<Feedback>) {
        return post('/feedback', f);
    },

    // ─── System Logs ────────────────────────────────────────────────────────────

    async addLog(level: string, message: string, user: string, metadata?: any) {
        return post('/logs', {
            level,
            message_key: message,
            user_name: user,
            metadata: metadata || {}
        });
    },

    async getLogs(): Promise<any[]> {
        const raw = await apiFetch<any[]>('/logs');
        return raw.map(l => ({
            id: l.id,
            level: l.level,
            messageKey: l.message_key,
            user: l.user_name,
            timestamp: l.timestamp,
            aiFix: l.metadata?.aiFix || null
        }));
    },

    // ─── Recruitment Processes (Mobilization Pipeline) ────────────────────────

    async getRecruitmentProcesses(): Promise<RecruitmentProcess[]> {
        const raw = await apiFetch<any[]>('/recruitment-processes');
        return raw.map(mapRecruitmentProcessFromDb);
    },

    async saveRecruitmentProcess(process: RecruitmentProcess): Promise<RecruitmentProcess> {
        const payload = {
            id: process.id,
            candidate_name: process.candidateName,
            candidate_email: process.candidateEmail,
            candidate_phone: process.candidatePhone,
            candidate_id_number: process.candidateIdNumber,
            worker_type: process.workerType || 'Prime',
            prime_company: process.primeCompany,
            contractor_company: process.contractorCompany,
            company: process.company,
            department: process.department,
            role: process.role,
            required_racs: process.requiredRacs || [],
            status: process.status,
            requested_by: process.requestedBy,
            requested_at: process.requestedAt,
            documents: process.documents || [],
            am_documents: process.amDocuments || [],
            temporary_badge_number: process.temporaryBadgeNumber,
            security_cleared: process.securityCleared || false,
            clinic_fitness_cleared: process.clinicFitnessCleared || false,
            medical_exam: process.medicalExam || null,
            fitness_certificate: process.fitnessCertificate || null,
            induction_date: process.inductionDate || null,
            induction_confirmed: process.inductionConfirmed || false,
            training_completed_at: process.trainingCompletedAt || null,
            received_at: process.receivedAt || null,
            nudge_count: process.nudgeCount || 0,
            last_nudge_at: process.lastNudgeAt || null,
            employee_id: process.employeeId,
            record_id: process.recordId,
            request_type: process.requestType || 'Recruitment',
            equipment_type: process.equipmentType,
            equipment_id: process.equipmentId,
            responsible_person_name: process.responsiblePersonName,
            responsible_person_phone: process.responsiblePersonPhone,
            safety_inspection_cleared: process.safetyInspectionCleared || false,
            safety_inspection_comments: process.safetyInspectionComments,
            safety_inspection_record_id: process.safetyInspectionRecordId,
            requires_medical: process.requiresMedical !== false,
            requires_induction: process.requiresInduction !== false,
            requires_rac: process.requiresRac !== false,
            truck_model: process.truckModel,
            truck_reg_number: process.truckRegNumber,
            po_number: process.poNumber,
            access_start_date: process.accessStartDate || null,
            access_end_date: process.accessEndDate || null,
            canteen: process.canteen || null,
            access_reason: process.accessReason,
            access_status: process.accessStatus,
            denial_reason: process.denialReason,
            access_document_ref: process.accessDocumentRef,
            area_manager_name: process.areaManagerName,
            area_manager_phone: process.areaManagerPhone,
            area_manager_department: process.areaManagerDepartment
        };
        const raw = await post<any>('/recruitment-processes', payload);
        return mapRecruitmentProcessFromDb(raw);
    },

    async deleteRecruitmentProcess(id: string): Promise<void> {
        await del(`/recruitment-processes/${id}`);
    },

    async deleteAllRecruitmentProcesses(): Promise<void> {
        await del('/recruitment-processes/all');
    },

    // ─── SafeMap Module ─────────────────────────────────────────────────────────

    async getUnsafeConditions(): Promise<UnsafeCondition[]> {
        const raw = await apiFetch<any[]>('/unsafe-conditions');
        return raw.map(mapUnsafeConditionFromDb);
    },

    async createUnsafeCondition(condition: Omit<UnsafeCondition, 'id'>): Promise<UnsafeCondition> {
        const payload = {
            id: `sm-${Date.now()}`,
            latitude: condition.latitude,
            longitude: condition.longitude,
            function_location: condition.functionLocation,
            condition_type: condition.conditionType,
            responsible_area: condition.responsibleArea,
            description: condition.description,
            action_plan: condition.actionPlan,
            initial_photos: condition.initialPhotos || [],
            correction_photos: condition.correctionPhotos || [],
            observer_id: condition.observerId,
            observer_name: condition.observerName,
            ssma_focal_point_id: condition.ssmaFocalPointId,
            ssma_focal_point_name: condition.ssmaFocalPointName,
            area_responsible_id: condition.areaResponsibleId,
            area_responsible_name: condition.areaResponsibleName,
            area_manager_id: condition.areaManagerId,
            area_manager_name: condition.areaManagerName,
            state: condition.state || 'Criado',
            map_status: condition.mapStatus || 'Recente',
            severity: condition.severity || 'Medium',
            category: condition.category || 'Unsafe Condition',
            resolved_at: condition.resolvedAt || null
        };
        const raw = await post<any>('/unsafe-conditions', payload);
        return mapUnsafeConditionFromDb(raw);
    },

    async updateUnsafeCondition(id: string, updates: Partial<UnsafeCondition>): Promise<UnsafeCondition | null> {
        // Fetch current, merge, and upsert
        const conditions = await this.getUnsafeConditions();
        const current = conditions.find(c => c.id === id);
        if (!current) return null;

        const merged = { ...current, ...updates };
        const payload = {
            id: merged.id,
            latitude: merged.latitude,
            longitude: merged.longitude,
            function_location: merged.functionLocation,
            condition_type: merged.conditionType,
            responsible_area: merged.responsibleArea,
            description: merged.description,
            action_plan: merged.actionPlan,
            initial_photos: merged.initialPhotos || [],
            correction_photos: merged.correctionPhotos || [],
            observer_id: merged.observerId,
            observer_name: merged.observerName,
            ssma_focal_point_id: merged.ssmaFocalPointId,
            ssma_focal_point_name: merged.ssmaFocalPointName,
            area_responsible_id: merged.areaResponsibleId,
            area_responsible_name: merged.areaResponsibleName,
            area_manager_id: merged.areaManagerId,
            area_manager_name: merged.areaManagerName,
            state: merged.state,
            map_status: merged.mapStatus,
            severity: merged.severity || 'Medium',
            category: merged.category || 'Unsafe Condition',
            resolved_at: merged.resolvedAt || null
        };
        const raw = await post<any>('/unsafe-conditions', payload);
        return mapUnsafeConditionFromDb(raw);
    },

    // ─── FormBuilder: SQL Schema Execution ──────────────────────────────────────

    async executeSQL(sql: string, tableName: string, portalType: string, user: string): Promise<{ success: boolean; error?: string }> {
        // Track schemas in localStorage
        const schemas = getLocalStorageJson('formbuilder_schemas', []);
        const existing = schemas.findIndex((s: any) => s.tableName === tableName);
        const schemaRecord = {
            tableName,
            portalType,
            sql,
            createdAt: new Date().toISOString(),
            createdBy: user,
            status: 'pending' as string
        };

        try {
            const result = await post<any>('/exec-sql', { sql });
            if (result.success) {
                schemaRecord.status = 'executed';
                if (existing >= 0) schemas[existing] = schemaRecord;
                else schemas.push(schemaRecord);
                saveLocalStorageJson('formbuilder_schemas', schemas);
                await this.addLog('INFO', `FORM_BUILDER_TABLE_CREATED: ${tableName} (${portalType})`, user, { tableName, portalType });
                return { success: true };
            } else {
                schemaRecord.status = 'error';
                if (existing >= 0) schemas[existing] = schemaRecord;
                else schemas.push(schemaRecord);
                saveLocalStorageJson('formbuilder_schemas', schemas);
                return { success: false, error: result.error };
            }
        } catch (e: any) {
            schemaRecord.status = 'error';
            if (existing >= 0) schemas[existing] = schemaRecord;
            else schemas.push(schemaRecord);
            saveLocalStorageJson('formbuilder_schemas', schemas);
            return { success: false, error: e.message || 'Unknown error' };
        }
    },

    getCreatedTables(): { tableName: string; portalType: string; createdAt: string; createdBy: string; status: string }[] {
        return getLocalStorageJson('formbuilder_schemas', []);
    },

    // ─── Compatibility stubs ────────────────────────────────────────────────────

    mapBookingFromDb: mapBookingFromDb,
    mapSessionFromDb: mapSessionFromDb,
    mapEmployeeFromDb: mapEmployeeFromDb,
    mapUserFromDb: mapUserFromDb,
    mapCompanyFromDb: mapCompanyFromDb,

    mapEmployeeToDb(emp: Partial<Employee>): any {
        return {
            id: isUUID(emp.id) ? emp.id : uuidv4(),
            record_id: emp.recordId,
            name: emp.name,
            company: emp.company,
            department: emp.department,
            role: emp.role,
            site_id: isUUID(emp.siteId) ? emp.siteId : null,
            phone_number: emp.phoneNumber,
            driver_license_number: emp.driverLicenseNumber,
            driver_license_class: emp.driverLicenseClass,
            driver_license_expiry: emp.driverLicenseExpiry,
            is_active: emp.isActive
        };
    },

    mapUserToDb(user: Partial<User>): any {
        return {
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            company: user.company,
            job_title: user.jobTitle,
            phone_number: user.phoneNumber,
            site_id: user.siteId
        };
    },

    // safeQuery stub — no longer needed but kept for any stray references
    async safeQuery<T>(_tableName: string, _query: any, fallback: T): Promise<T> {
        return fallback;
    }
};
