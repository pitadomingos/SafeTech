/**
 * ============================================================
 *  CARS MANAGER â€” STAKEHOLDER PRESENTATION MOCK DATA
 *  Covers: Companies, Sites, Rooms, Trainers, Users,
 *          Employees, Sessions, Bookings, Requirements,
 *          Feedback, BreathalyzerTests, IotDevices,
 *          DataConnectors, SystemNotifications
 * ============================================================
 */

import {
  Company,
  Site,
  Room,
  Trainer,
  User,
  UserRole,
  Employee,
  TrainingSession,
  Booking,
  BookingStatus,
  EmployeeRequirement,
  Feedback,
  FeedbackStatus,
  BreathalyzerTest,
  IotDevice,
  DataConnector,
  SystemNotification,
  RacDef,
  RecruitmentStatus,
  RecruitmentProcess,
  UnsafeCondition
} from './types';

// ——— Helpers ——————————————————————————————————————————————————————

const d = (daysOffset: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};

const ts = (daysOffset: number, hour = 9) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

// â”€â”€â”€ 1. Companies â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_COMPANIES: Company[] = [
  {
    id: 'c-vulcan',
    name: 'Vulcan Resources Mozambique',
    appName: 'ZeroGate',
    status: 'Active',
    defaultLanguage: 'en',
    tier: 'Prime',
    features: { alcohol: true },
  },
  {
    id: 'c-motaengil',
    name: 'Mota-Engil Africa',
    status: 'Active',
    defaultLanguage: 'pt',
    parentId: 'c-vulcan',
    tier: 'Sub',
    features: { alcohol: false },
  },
  {
    id: 'c-jachris',
    name: 'Jachris Services',
    status: 'Active',
    defaultLanguage: 'pt',
    parentId: 'c-vulcan',
    tier: 'Sub',
    features: { alcohol: false },
  },
  {
    id: 'c-belabel',
    name: 'Belabel Logistics',
    status: 'Active',
    defaultLanguage: 'pt',
    parentId: 'c-vulcan',
    tier: 'Sub',
    features: { alcohol: false },
  },
  {
    id: 'c-escopil',
    name: 'Escopil Engineering',
    status: 'Active',
    defaultLanguage: 'pt',
    parentId: 'c-vulcan',
    tier: 'Sub',
    features: { alcohol: false },
  },
  {
    id: 'c-nbm',
    name: 'NBM Construction',
    status: 'Inactive',
    defaultLanguage: 'pt',
    parentId: 'c-vulcan',
    tier: 'Sub',
    features: { alcohol: false },
  },
];

// â”€â”€â”€ 2. Sites â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_SITES: Site[] = [
  {
    id: 's-nacala',
    companyId: 'c-vulcan',
    name: 'Nacala Processing Plant',
    location: 'Nacala, Nampula Province',
    mandatoryRacs: ['RAC01', 'RAC03', 'RAC08', 'PTS', 'ART'],
  },
  {
    id: 's-moatize',
    companyId: 'c-vulcan',
    name: 'Moatize Open-Pit Mine',
    location: 'Moatize, Tete Province',
    mandatoryRacs: ['RAC01', 'RAC02', 'RAC06', 'RAC07', 'RAC09', 'RAC11', 'PTS', 'ART'],
  },
  {
    id: 's-maputo',
    companyId: 'c-vulcan',
    name: 'Maputo HQ & Training Centre',
    location: 'Matola, Maputo Province',
    mandatoryRacs: ['RAC01', 'PTS'],
  },
  {
    id: 's-lichinga',
    companyId: 'c-vulcan',
    name: 'Lichinga Logistics Hub',
    location: 'Lichinga, Niassa Province',
    mandatoryRacs: ['RAC02', 'RAC11'],
  },
];

// â”€â”€â”€ 3. Rooms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_ROOMS: Room[] = [
  { id: 'rm-a', name: 'Training Room Alpha', capacity: 30, siteId: 's-maputo' },
  { id: 'rm-b', name: 'Training Room Bravo', capacity: 25, siteId: 's-maputo' },
  { id: 'rm-c', name: 'Moatize Field Classroom', capacity: 40, siteId: 's-moatize' },
  { id: 'rm-d', name: 'Nacala Safety Hall', capacity: 35, siteId: 's-nacala' },
  { id: 'rm-e', name: 'Mobile Training Unit #1', capacity: 15, siteId: 's-lichinga' },
];

// â”€â”€â”€ 4. Trainers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_TRAINERS: Trainer[] = [
  { id: 'tr-1', name: 'AntÃ³nio Sitoe', racs: ['RAC01', 'RAC02', 'RAC06', 'RAC11', 'PTS', 'ART'], siteId: 's-moatize' },
  { id: 'tr-2', name: 'Felicidade Cossa', racs: ['RAC03', 'RAC04', 'RAC08', 'PTS'], siteId: 's-nacala' },
  { id: 'tr-3', name: 'Humberto Machava', racs: ['RAC05', 'RAC07', 'RAC09', 'ART'], siteId: 's-moatize' },
  { id: 'tr-4', name: 'InÃªs Baloi', racs: ['RAC01', 'RAC10', 'PTS', 'ART'], siteId: 's-maputo' },
  { id: 'tr-5', name: 'Jorge Mondlane', racs: ['RAC02', 'RAC11'], siteId: 's-lichinga' },
];

// ——— 5. RAC Definitions ——————————————————————————————————————————

export const DEMO_RAC_DEFINITIONS: RacDef[] = [
  { id: 'rac1', code: 'RAC01', name: 'RAC 01 - Working at Height', validityMonths: 24, requiresPractical: true, passScore: 75 },
  { id: 'rac2', code: 'RAC02', name: 'RAC 02 - Vehicles and Mobile Equipment', validityMonths: 24, requiresDriverLicense: true, requiresPractical: true, passScore: 80 },
  { id: 'rac3', code: 'RAC03', name: 'RAC 03 - Energy Isolation (LOTO)', validityMonths: 24, requiresPractical: true, passScore: 70 },
  { id: 'rac4', code: 'RAC04', name: 'RAC 04 - Machine Guarding', validityMonths: 24, requiresPractical: true, passScore: 70 },
  { id: 'rac5', code: 'RAC05', name: 'RAC 05 - Confined Spaces', validityMonths: 24, requiresPractical: true, passScore: 70 },
  { id: 'rac6', code: 'RAC06', name: 'RAC 06 - Lifting Operations', validityMonths: 24, requiresPractical: true, passScore: 70 },
  { id: 'rac7', code: 'RAC07', name: 'RAC 07 - Slope Stabilization', validityMonths: 24, requiresPractical: true, passScore: 70 },
  { id: 'rac8', code: 'RAC08', name: 'RAC 08 - Electrical Safety', validityMonths: 24, requiresPractical: true, passScore: 70 },
  { id: 'rac9', code: 'RAC09', name: 'RAC 09 - Explosives Control', validityMonths: 24, requiresPractical: true, passScore: 70 },
  { id: 'rac10', code: 'RAC10', name: 'RAC 10 - Molten Metal Safety', validityMonths: 24, requiresPractical: true, passScore: 70 },
  { id: 'rac11', code: 'RAC11', name: 'RAC 11 - Mine Traffic Rules', validityMonths: 24, requiresDriverLicense: true, requiresPractical: true, passScore: 70 },
  { id: 'pts', code: 'PTS', name: 'PTS - Work Permit Issuer', validityMonths: 24, requiresPractical: true, passScore: 70 },
  { id: 'art', code: 'ART', name: 'ART - Risk Assessment', validityMonths: 24, requiresPractical: true, passScore: 70 },
];

// ——— 6. Users (Platform Accounts) —————————————————————————————————

export const DEMO_USERS: User[] = [
  { id: 1, name: 'Pita Domingos', email: 'p.domingos@vulcan.com', role: UserRole.SYSTEM_ADMIN, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'Lead System Architect', siteId: 'all', appModule: 'both' },
  { id: 2, name: 'Carlos Macuácua', email: 'c.macuacua@vulcan.com', role: UserRole.ENTERPRISE_ADMIN, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'HSE Director', siteId: 'all', appModule: 'both' },
  { id: 3, name: 'Ana Bila', email: 'a.bila@vulcan.com', role: UserRole.SITE_ADMIN, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'Site Safety Manager', siteId: 's-moatize', appModule: 'training' },
  { id: 4, name: 'Fernando Nhantumbo', email: 'f.nhantumbo@vulcan.com', role: UserRole.SITE_ADMIN, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'Site Safety Manager', siteId: 's-nacala', appModule: 'mobilization' },
  { id: 5, name: 'Grace Matsinhe', email: 'g.matsinhe@vulcan.com', role: UserRole.RAC_ADMIN, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'Training Coordinator', siteId: 's-maputo' },
  { id: 6, name: 'Hélio Tembe', email: 'h.tembe@vulcan.com', role: UserRole.DEPT_ADMIN, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'Mine Ops Supervisor', siteId: 's-moatize' },
  { id: 7, name: 'António Sitoe', email: 'a.sitoe@vulcan.com', role: UserRole.RAC_TRAINER, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'Senior RAC Trainer', siteId: 's-moatize' },
  { id: 8, name: 'Felicidade Cossa', email: 'f.cossa@vulcan.com', role: UserRole.RAC_TRAINER, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'Electrical Safety Trainer', siteId: 's-nacala' },
  { id: 9, name: 'Jessica Bata', email: 'jessica@vulcan.com', role: UserRole.USER, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'Safety Officer', siteId: 's-nacala' },
  { id: 10, name: 'Kelven Ubisse', email: 'kelven@vulcan.com', role: UserRole.USER, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'Mining Engineer', siteId: 's-moatize' },
  { id: 11, name: 'Latifa Uetela', email: 'latifa@vulcan.com', role: UserRole.USER, status: 'Active', company: 'Vulcan Resources Mozambique', jobTitle: 'HR Specialist', siteId: 's-maputo' },
  { id: 12, name: 'Domingos Guambe', email: 'd.guambe@motaengil.com', role: UserRole.DEPT_ADMIN, status: 'Active', company: 'Mota-Engil Africa', jobTitle: 'Civil Works Supervisor', siteId: 's-moatize' },
];

// ——— 7. Employees ————————————————————————————————————————————————

export const DEMO_EMPLOYEES: Employee[] = [
  // Vulcan â€” Mine Operations
  { id: 'emp-001', name: 'Paulo Manjate', recordId: 'VUL-1001', company: 'Vulcan Resources Mozambique', department: 'Mine Operations', role: 'Operator', isActive: true, siteId: 's-moatize', driverLicenseNumber: 'DL-MZ-4412', driverLicenseClass: 'Heavy', driverLicenseExpiry: d(420) },
  { id: 'emp-002', name: 'RosÃ¡rio Chauque', recordId: 'VUL-1002', company: 'Vulcan Resources Mozambique', department: 'Mine Operations', role: 'Blasting Engineer', isActive: true, siteId: 's-moatize' },
  { id: 'emp-003', name: 'Sandro Duvane', recordId: 'VUL-1003', company: 'Vulcan Resources Mozambique', department: 'Mine Operations', role: 'Haul Truck Operator', isActive: true, siteId: 's-moatize', driverLicenseNumber: 'DL-MZ-8821', driverLicenseClass: 'Heavy', driverLicenseExpiry: d(180) },
  { id: 'emp-004', name: 'Teodora Fondo', recordId: 'VUL-1004', company: 'Vulcan Resources Mozambique', department: 'Mine Operations', role: 'Geologist', isActive: true, siteId: 's-moatize' },
  { id: 'emp-005', name: 'Umbe Gove', recordId: 'VUL-1005', company: 'Vulcan Resources Mozambique', department: 'Mine Operations', role: 'Excavator Operator', isActive: true, siteId: 's-moatize', driverLicenseNumber: 'DL-MZ-3305', driverLicenseClass: 'Heavy', driverLicenseExpiry: d(300) },
  // Vulcan â€” Plant Maintenance
  { id: 'emp-006', name: 'Vasco Hunguana', recordId: 'VUL-2001', company: 'Vulcan Resources Mozambique', department: 'Plant Maintenance', role: 'Electrician', isActive: true, siteId: 's-nacala' },
  { id: 'emp-007', name: 'Wanda Jossias', recordId: 'VUL-2002', company: 'Vulcan Resources Mozambique', department: 'Plant Maintenance', role: 'Mechanical Fitter', isActive: true, siteId: 's-nacala' },
  { id: 'emp-008', name: 'Xavier Langa', recordId: 'VUL-2003', company: 'Vulcan Resources Mozambique', department: 'Plant Maintenance', role: 'Instrumentation Technician', isActive: true, siteId: 's-nacala' },
  // Vulcan â€” HSE
  { id: 'emp-009', name: 'Jessica Bata', recordId: 'VUL-3001', company: 'Vulcan Resources Mozambique', department: 'HSE', role: 'Safety Officer', isActive: true, siteId: 's-nacala' },
  { id: 'emp-010', name: 'Yara Maculuane', recordId: 'VUL-3002', company: 'Vulcan Resources Mozambique', department: 'HSE', role: 'Environment Specialist', isActive: true, siteId: 's-moatize' },
  // Vulcan â€” Logistics
  { id: 'emp-011', name: 'Zito Nkosi', recordId: 'VUL-4001', company: 'Vulcan Resources Mozambique', department: 'Logistics', role: 'Driver', isActive: true, siteId: 's-lichinga', driverLicenseNumber: 'DL-MZ-9901', driverLicenseClass: 'Light', driverLicenseExpiry: d(550) },
  { id: 'emp-012', name: 'Anabela Ombe', recordId: 'VUL-4002', company: 'Vulcan Resources Mozambique', department: 'Logistics', role: 'Warehouse Manager', isActive: true, siteId: 's-lichinga' },
  // Vulcan â€” Administration
  { id: 'emp-013', name: 'Kelven Ubisse', recordId: 'VUL-5001', company: 'Vulcan Resources Mozambique', department: 'Administration', role: 'Mining Engineer', isActive: true, siteId: 's-moatize' },
  { id: 'emp-014', name: 'Latifa Uetela', recordId: 'VUL-5002', company: 'Vulcan Resources Mozambique', department: 'Administration', role: 'HR Specialist', isActive: true, siteId: 's-maputo' },

  // Mota-Engil â€” Contractor
  { id: 'emp-015', name: 'Orlando Yacub', recordId: 'ME-001', company: 'Mota-Engil Africa', department: 'Mine Operations', role: 'Excavator Operator', isActive: true, siteId: 's-moatize', driverLicenseNumber: 'DL-MZ-7712', driverLicenseClass: 'Heavy', driverLicenseExpiry: d(210) },
  { id: 'emp-016', name: 'Paulo Vombe', recordId: 'ME-002', company: 'Mota-Engil Africa', department: 'Mine Operations', role: 'Civil Technician', isActive: true, siteId: 's-moatize' },
  { id: 'emp-017', name: 'Rui Tivane', recordId: 'ME-003', company: 'Mota-Engil Africa', department: 'Mine Operations', role: 'Drill Operator', isActive: true, siteId: 's-moatize', driverLicenseNumber: 'DL-MZ-5532', driverLicenseClass: 'Heavy', driverLicenseExpiry: d(120) },
  { id: 'emp-018', name: 'SÃ³nia Uaiene', recordId: 'ME-004', company: 'Mota-Engil Africa', department: 'Plant Maintenance', role: 'Mechanic', isActive: true, siteId: 's-moatize' },
  { id: 'emp-019', name: 'TomÃ¡s Vumo', recordId: 'ME-005', company: 'Mota-Engil Africa', department: 'HSE', role: 'Safety Rep', isActive: true, siteId: 's-moatize' },

  // Belabel â€” Logistics Contractor
  { id: 'emp-020', name: 'Quim Wate', recordId: 'BEL-001', company: 'Belabel Logistics', department: 'Logistics', role: 'Driver', isActive: true, siteId: 's-lichinga', driverLicenseNumber: 'DL-MZ-2291', driverLicenseClass: 'Light', driverLicenseExpiry: d(90) },
  { id: 'emp-021', name: 'Rui Vilanculos', recordId: 'BEL-002', company: 'Belabel Logistics', department: 'Logistics', role: 'Driver', isActive: false, siteId: 's-lichinga', driverLicenseNumber: 'DL-MZ-4401', driverLicenseClass: 'Light', driverLicenseExpiry: d(-30) },
  { id: 'emp-022', name: 'Sara Tamele', recordId: 'BEL-003', company: 'Belabel Logistics', department: 'Logistics', role: 'Driver', isActive: true, siteId: 's-lichinga', driverLicenseNumber: 'DL-MZ-6611', driverLicenseClass: 'Heavy', driverLicenseExpiry: d(365) },

  // Escopil â€” Engineering Contractor
  { id: 'emp-023', name: 'Telma Sambo', recordId: 'ESC-001', company: 'Escopil Engineering', department: 'Plant Maintenance', role: 'Mechanic', isActive: true, siteId: 's-nacala' },
  { id: 'emp-024', name: 'Ursio Raposo', recordId: 'ESC-002', company: 'Escopil Engineering', department: 'Plant Maintenance', role: 'Electrician', isActive: true, siteId: 's-nacala' },
  { id: 'emp-025', name: 'Valentina Sueia', recordId: 'ESC-003', company: 'Escopil Engineering', department: 'Plant Maintenance', role: 'Plumber', isActive: true, siteId: 's-nacala' },

  // Jachris â€” Catering & Services
  { id: 'emp-026', name: 'Manuel Xadreque', recordId: 'JAC-001', company: 'Jachris Services', department: 'Administration', role: 'Catering Supervisor', isActive: true, siteId: 's-moatize' },
  { id: 'emp-027', name: 'Nuno Zaqueu', recordId: 'JAC-002', company: 'Jachris Services', department: 'Logistics', role: 'General Helper', isActive: true, siteId: 's-moatize' },
  { id: 'emp-028', name: 'Odete Zunguze', recordId: 'JAC-003', company: 'Jachris Services', department: 'Administration', role: 'Cleaner', isActive: true, siteId: 's-nacala' },

  // â”€â”€ DEMO CHAMPIONS â€” fully compliant for card issuance demo â”€â”€
  { id: 'emp-029', name: 'Daniela Cossa', recordId: 'VUL-DEMO-01', company: 'Vulcan Resources Mozambique', department: 'HSE', role: 'HSE Coordinator', isActive: true, siteId: 's-maputo' },
  { id: 'emp-030', name: 'Edgar Massinga', recordId: 'VUL-DEMO-02', company: 'Vulcan Resources Mozambique', department: 'Plant Maintenance', role: 'Maintenance Engineer', isActive: true, siteId: 's-nacala' },
];

// â”€â”€â”€ 8. Training Sessions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_SESSIONS: TrainingSession[] = [
  // Past sessions
  { id: 'S-P01', racType: 'RAC 01 - Working at Height', date: d(-90), startTime: '08:00', location: 'Training Room Alpha', instructor: 'InÃªs Baloi', capacity: 30, sessionLanguage: 'English', siteId: 's-maputo' },
  { id: 'S-P02', racType: 'RAC 02 - Vehicles and Mobile Equipment', date: d(-75), startTime: '08:00', location: 'Moatize Field Classroom', instructor: 'AntÃ³nio Sitoe', capacity: 20, sessionLanguage: 'Portuguese', siteId: 's-moatize' },
  { id: 'S-P03', racType: 'RAC 09 - Explosives Control', date: d(-60), startTime: '07:30', location: 'Moatize Field Classroom', instructor: 'Humberto Machava', capacity: 15, sessionLanguage: 'Portuguese', siteId: 's-moatize' },
  { id: 'S-P04', racType: 'RAC 08 - Electrical Safety', date: d(-45), startTime: '09:00', location: 'Nacala Safety Hall', instructor: 'Felicidade Cossa', capacity: 25, sessionLanguage: 'English', siteId: 's-nacala' },
  { id: 'S-P05', racType: 'RAC 11 - Mine Traffic Rules', date: d(-30), startTime: '07:30', location: 'Moatize Field Classroom', instructor: 'AntÃ³nio Sitoe', capacity: 25, sessionLanguage: 'Portuguese', siteId: 's-moatize' },
  { id: 'S-P06', racType: 'PTS - Work Permit Issuer', date: d(-20), startTime: '09:00', location: 'Training Room Bravo', instructor: 'InÃªs Baloi', capacity: 20, sessionLanguage: 'English', siteId: 's-maputo' },
  { id: 'S-P07', racType: 'ART - Risk Assessment', date: d(-14), startTime: '09:00', location: 'Nacala Safety Hall', instructor: 'Felicidade Cossa', capacity: 20, sessionLanguage: 'Portuguese', siteId: 's-nacala' },
  { id: 'S-P08', racType: 'RAC 06 - Lifting Operations', date: d(-7), startTime: '08:00', location: 'Moatize Field Classroom', instructor: 'AntÃ³nio Sitoe', capacity: 18, sessionLanguage: 'Portuguese', siteId: 's-moatize' },

  // Current / upcoming sessions
  { id: 'S-U01', racType: 'RAC 01 - Working at Height', date: d(3), startTime: '08:00', location: 'Training Room Alpha', instructor: 'InÃªs Baloi', capacity: 30, sessionLanguage: 'English', siteId: 's-maputo' },
  { id: 'S-U02', racType: 'RAC 03 - Energy Isolation (LOTO)', date: d(7), startTime: '09:00', location: 'Nacala Safety Hall', instructor: 'Felicidade Cossa', capacity: 20, sessionLanguage: 'English', siteId: 's-nacala' },
  { id: 'S-U03', racType: 'RAC 05 - Confined Spaces', date: d(10), startTime: '08:00', location: 'Moatize Field Classroom', instructor: 'Humberto Machava', capacity: 15, sessionLanguage: 'Portuguese', siteId: 's-moatize' },
  { id: 'S-U04', racType: 'RAC 02 - Vehicles and Mobile Equipment', date: d(14), startTime: '07:30', location: 'Moatize Field Classroom', instructor: 'AntÃ³nio Sitoe', capacity: 20, sessionLanguage: 'Portuguese', siteId: 's-moatize' },
  { id: 'S-U05', racType: 'RAC 11 - Mine Traffic Rules', date: d(18), startTime: '07:30', location: 'Mobile Training Unit #1', instructor: 'Jorge Mondlane', capacity: 12, sessionLanguage: 'Portuguese', siteId: 's-lichinga' },
  { id: 'S-U06', racType: 'RAC 07 - Slope Stabilization', date: d(21), startTime: '08:00', location: 'Moatize Field Classroom', instructor: 'Humberto Machava', capacity: 20, sessionLanguage: 'Portuguese', siteId: 's-moatize' },
  { id: 'S-U07', racType: 'PTS - Work Permit Issuer', date: d(28), startTime: '09:00', location: 'Training Room Alpha', instructor: 'InÃªs Baloi', capacity: 25, sessionLanguage: 'English', siteId: 's-maputo' },
  { id: 'S-U08', racType: 'ART - Risk Assessment', date: d(35), startTime: '09:00', location: 'Training Room Bravo', instructor: 'InÃªs Baloi', capacity: 25, sessionLanguage: 'English', siteId: 's-maputo' },
];

// â”€â”€â”€ 9. Bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const mkEmployee = (id: string) => DEMO_EMPLOYEES.find(e => e.id === id)!;

export const DEMO_BOOKINGS: Booking[] = [
  // â”€â”€ Passed records (historical) â”€â”€
  { id: 'bk-001', sessionId: 'S-P01', employee: mkEmployee('emp-001'), status: BookingStatus.PASSED, resultDate: d(-90), expiryDate: d(630), attendance: true, theoryScore: 88, practicalScore: 91, trainerName: 'InÃªs Baloi' },
  { id: 'bk-002', sessionId: 'S-P01', employee: mkEmployee('emp-009'), status: BookingStatus.PASSED, resultDate: d(-90), expiryDate: d(630), attendance: true, theoryScore: 95, practicalScore: 96, trainerName: 'InÃªs Baloi' },
  { id: 'bk-003', sessionId: 'S-P01', employee: mkEmployee('emp-014'), status: BookingStatus.PASSED, resultDate: d(-90), expiryDate: d(630), attendance: true, theoryScore: 82, practicalScore: 85, trainerName: 'InÃªs Baloi' },
  { id: 'bk-004', sessionId: 'S-P01', employee: mkEmployee('emp-026'), status: BookingStatus.PASSED, resultDate: d(-90), expiryDate: d(630), attendance: true, theoryScore: 79, practicalScore: 80, trainerName: 'InÃªs Baloi' },

  { id: 'bk-005', sessionId: 'S-P02', employee: mkEmployee('emp-001'), status: BookingStatus.PASSED, resultDate: d(-75), expiryDate: d(645), attendance: true, theoryScore: 90, practicalScore: 93, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-006', sessionId: 'S-P02', employee: mkEmployee('emp-003'), status: BookingStatus.PASSED, resultDate: d(-75), expiryDate: d(645), attendance: true, theoryScore: 84, practicalScore: 88, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-007', sessionId: 'S-P02', employee: mkEmployee('emp-005'), status: BookingStatus.PASSED, resultDate: d(-75), expiryDate: d(645), attendance: true, theoryScore: 87, practicalScore: 89, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-008', sessionId: 'S-P02', employee: mkEmployee('emp-015'), status: BookingStatus.FAILED, resultDate: d(-75), attendance: true, theoryScore: 55, practicalScore: 48, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe', comments: 'Failed practical â€” re-booking required' },
  { id: 'bk-009', sessionId: 'S-P02', employee: mkEmployee('emp-022'), status: BookingStatus.PASSED, resultDate: d(-75), expiryDate: d(645), attendance: true, theoryScore: 91, practicalScore: 92, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe' },

  { id: 'bk-010', sessionId: 'S-P03', employee: mkEmployee('emp-002'), status: BookingStatus.PASSED, resultDate: d(-60), expiryDate: d(660), attendance: true, theoryScore: 93, practicalScore: 95, trainerName: 'Humberto Machava' },
  { id: 'bk-011', sessionId: 'S-P03', employee: mkEmployee('emp-013'), status: BookingStatus.ABSENT, resultDate: d(-60), attendance: false, trainerName: 'Humberto Machava', comments: 'No show â€” emergency shift change' },

  { id: 'bk-012', sessionId: 'S-P04', employee: mkEmployee('emp-006'), status: BookingStatus.PASSED, resultDate: d(-45), expiryDate: d(675), attendance: true, theoryScore: 89, practicalScore: 90, trainerName: 'Felicidade Cossa' },
  { id: 'bk-013', sessionId: 'S-P04', employee: mkEmployee('emp-007'), status: BookingStatus.PASSED, resultDate: d(-45), expiryDate: d(675), attendance: true, theoryScore: 78, practicalScore: 80, trainerName: 'Felicidade Cossa' },
  { id: 'bk-014', sessionId: 'S-P04', employee: mkEmployee('emp-023'), status: BookingStatus.PASSED, resultDate: d(-45), expiryDate: d(675), attendance: true, theoryScore: 86, practicalScore: 88, trainerName: 'Felicidade Cossa' },
  { id: 'bk-015', sessionId: 'S-P04', employee: mkEmployee('emp-024'), status: BookingStatus.PASSED, resultDate: d(-45), expiryDate: d(675), attendance: true, theoryScore: 92, practicalScore: 94, trainerName: 'Felicidade Cossa' },

  { id: 'bk-016', sessionId: 'S-P05', employee: mkEmployee('emp-001'), status: BookingStatus.PASSED, resultDate: d(-30), expiryDate: d(690), attendance: true, theoryScore: 96, practicalScore: 97, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-017', sessionId: 'S-P05', employee: mkEmployee('emp-017'), status: BookingStatus.PASSED, resultDate: d(-30), expiryDate: d(690), attendance: true, theoryScore: 88, practicalScore: 90, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-018', sessionId: 'S-P05', employee: mkEmployee('emp-020'), status: BookingStatus.PASSED, resultDate: d(-30), expiryDate: d(690), attendance: true, theoryScore: 84, practicalScore: 85, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-019', sessionId: 'S-P05', employee: mkEmployee('emp-022'), status: BookingStatus.PASSED, resultDate: d(-30), expiryDate: d(690), attendance: true, theoryScore: 91, practicalScore: 93, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe' },

  { id: 'bk-020', sessionId: 'S-P06', employee: mkEmployee('emp-009'), status: BookingStatus.PASSED, resultDate: d(-20), expiryDate: d(700), attendance: true, theoryScore: 97, practicalScore: 98, trainerName: 'InÃªs Baloi' },
  { id: 'bk-021', sessionId: 'S-P06', employee: mkEmployee('emp-010'), status: BookingStatus.PASSED, resultDate: d(-20), expiryDate: d(700), attendance: true, theoryScore: 90, practicalScore: 91, trainerName: 'InÃªs Baloi' },
  { id: 'bk-022', sessionId: 'S-P06', employee: mkEmployee('emp-016'), status: BookingStatus.FAILED, resultDate: d(-20), attendance: true, theoryScore: 60, practicalScore: 55, trainerName: 'InÃªs Baloi', comments: 'Below pass threshold â€” 70% required' },

  { id: 'bk-023', sessionId: 'S-P07', employee: mkEmployee('emp-006'), status: BookingStatus.PASSED, resultDate: d(-14), expiryDate: d(706), attendance: true, theoryScore: 88, practicalScore: 90, trainerName: 'Felicidade Cossa' },
  { id: 'bk-024', sessionId: 'S-P07', employee: mkEmployee('emp-019'), status: BookingStatus.PASSED, resultDate: d(-14), expiryDate: d(706), attendance: true, theoryScore: 82, practicalScore: 84, trainerName: 'Felicidade Cossa' },
  { id: 'bk-025', sessionId: 'S-P07', employee: mkEmployee('emp-025'), status: BookingStatus.PASSED, resultDate: d(-14), expiryDate: d(706), attendance: true, theoryScore: 79, practicalScore: 81, trainerName: 'Felicidade Cossa' },

  { id: 'bk-026', sessionId: 'S-P08', employee: mkEmployee('emp-005'), status: BookingStatus.PASSED, resultDate: d(-7), expiryDate: d(713), attendance: true, theoryScore: 86, practicalScore: 88, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-027', sessionId: 'S-P08', employee: mkEmployee('emp-015'), status: BookingStatus.PASSED, resultDate: d(-7), expiryDate: d(713), attendance: true, theoryScore: 81, practicalScore: 83, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-028', sessionId: 'S-P08', employee: mkEmployee('emp-018'), status: BookingStatus.ABSENT, resultDate: d(-7), attendance: false, trainerName: 'AntÃ³nio Sitoe', comments: 'Equipment breakdown â€” rescheduled to S-U04' },

  // â”€â”€ Pending (upcoming sessions) â”€â”€
  { id: 'bk-029', sessionId: 'S-U01', employee: mkEmployee('emp-004'), status: BookingStatus.PENDING, trainerName: 'InÃªs Baloi' },
  { id: 'bk-030', sessionId: 'S-U01', employee: mkEmployee('emp-012'), status: BookingStatus.PENDING, trainerName: 'InÃªs Baloi' },
  { id: 'bk-031', sessionId: 'S-U01', employee: mkEmployee('emp-027'), status: BookingStatus.PENDING, trainerName: 'InÃªs Baloi' },
  { id: 'bk-032', sessionId: 'S-U01', employee: mkEmployee('emp-028'), status: BookingStatus.PENDING, trainerName: 'InÃªs Baloi' },

  { id: 'bk-033', sessionId: 'S-U02', employee: mkEmployee('emp-008'), status: BookingStatus.PENDING, trainerName: 'Felicidade Cossa' },
  { id: 'bk-034', sessionId: 'S-U02', employee: mkEmployee('emp-023'), status: BookingStatus.PENDING, trainerName: 'Felicidade Cossa' },

  { id: 'bk-035', sessionId: 'S-U03', employee: mkEmployee('emp-002'), status: BookingStatus.PENDING, trainerName: 'Humberto Machava' },
  { id: 'bk-036', sessionId: 'S-U03', employee: mkEmployee('emp-019'), status: BookingStatus.PENDING, trainerName: 'Humberto Machava' },

  { id: 'bk-037', sessionId: 'S-U04', employee: mkEmployee('emp-015'), status: BookingStatus.PENDING, trainerName: 'AntÃ³nio Sitoe', isAutoBooked: true, comments: 'Re-booked after RAC02 failure on S-P02' },
  { id: 'bk-038', sessionId: 'S-U04', employee: mkEmployee('emp-017'), status: BookingStatus.PENDING, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-039', sessionId: 'S-U04', employee: mkEmployee('emp-018'), status: BookingStatus.PENDING, trainerName: 'AntÃ³nio Sitoe', isAutoBooked: true, comments: 'Rescheduled from S-P08' },

  { id: 'bk-040', sessionId: 'S-U05', employee: mkEmployee('emp-020'), status: BookingStatus.PENDING, trainerName: 'Jorge Mondlane' },
  { id: 'bk-041', sessionId: 'S-U05', employee: mkEmployee('emp-021'), status: BookingStatus.PENDING, trainerName: 'Jorge Mondlane' },
  { id: 'bk-042', sessionId: 'S-U05', employee: mkEmployee('emp-022'), status: BookingStatus.PENDING, trainerName: 'Jorge Mondlane' },

  // Waitlisted
  { id: 'bk-043', sessionId: 'S-U04', employee: mkEmployee('emp-003'), status: BookingStatus.WAITLISTED },
  { id: 'bk-044', sessionId: 'S-U01', employee: mkEmployee('emp-011'), status: BookingStatus.WAITLISTED },

  // Expiring soon (within 60 days)
  { id: 'bk-045', sessionId: 'S-P01', employee: mkEmployee('emp-016'), status: BookingStatus.PASSED, resultDate: d(-670), expiryDate: d(50), attendance: true, theoryScore: 74, practicalScore: 76, trainerName: 'InÃªs Baloi' },
  { id: 'bk-046', sessionId: 'S-P02', employee: mkEmployee('emp-021'), status: BookingStatus.PASSED, resultDate: d(-660), expiryDate: d(60), attendance: true, theoryScore: 80, practicalScore: 82, driverLicenseVerified: true, trainerName: 'AntÃ³nio Sitoe' },
  { id: 'bk-047', sessionId: 'S-P03', employee: mkEmployee('emp-004'), status: BookingStatus.PASSED, resultDate: d(-640), expiryDate: d(80), attendance: true, theoryScore: 90, practicalScore: 92, trainerName: 'Humberto Machava' },

  // â”€â”€ DEMO CHAMPIONS: emp-029 (Daniela â€” requires RAC01+PTS) â”€â”€
  { id: 'bk-048', sessionId: 'S-P01', employee: mkEmployee('emp-029'), status: BookingStatus.PASSED, resultDate: d(-90), expiryDate: d(630), attendance: true, theoryScore: 94, practicalScore: 96, trainerName: 'InÃªs Baloi' },
  { id: 'bk-049', sessionId: 'S-P06', employee: mkEmployee('emp-029'), status: BookingStatus.PASSED, resultDate: d(-20), expiryDate: d(700), attendance: true, theoryScore: 98, practicalScore: 97, trainerName: 'InÃªs Baloi' },

  // â”€â”€ DEMO CHAMPIONS: emp-030 (Edgar â€” requires RAC01+RAC08) â”€â”€
  { id: 'bk-050', sessionId: 'S-P01', employee: mkEmployee('emp-030'), status: BookingStatus.PASSED, resultDate: d(-90), expiryDate: d(630), attendance: true, theoryScore: 91, practicalScore: 93, trainerName: 'InÃªs Baloi' },
  { id: 'bk-051', sessionId: 'S-P04', employee: mkEmployee('emp-030'), status: BookingStatus.PASSED, resultDate: d(-45), expiryDate: d(675), attendance: true, theoryScore: 95, practicalScore: 96, trainerName: 'Felicidade Cossa' },
];

// â”€â”€â”€ 10. Employee Requirements â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_REQUIREMENTS: EmployeeRequirement[] = [
  { employeeId: 'emp-001', asoExpiryDate: d(180), requiredRacs: { RAC01: true, RAC02: true, RAC06: true, RAC11: true } },
  { employeeId: 'emp-002', asoExpiryDate: d(200), requiredRacs: { RAC01: true, RAC09: true, PTS: true, ART: true } },
  { employeeId: 'emp-003', asoExpiryDate: d(150), requiredRacs: { RAC01: true, RAC02: true, RAC11: true } },
  { employeeId: 'emp-004', asoExpiryDate: d(220), requiredRacs: { RAC01: true, RAC09: true } },
  { employeeId: 'emp-005', asoExpiryDate: d(300), requiredRacs: { RAC01: true, RAC02: true, RAC06: true, RAC11: true } },
  { employeeId: 'emp-006', asoExpiryDate: d(180), requiredRacs: { RAC01: true, RAC03: true, RAC08: true, PTS: true } },
  { employeeId: 'emp-007', asoExpiryDate: d(250), requiredRacs: { RAC01: true, RAC04: true, RAC08: true } },
  { employeeId: 'emp-008', asoExpiryDate: d(310), requiredRacs: { RAC01: true, RAC03: true, RAC08: true } },
  { employeeId: 'emp-009', asoExpiryDate: d(400), requiredRacs: { RAC01: true, RAC05: true, PTS: true, ART: true } },
  { employeeId: 'emp-010', asoExpiryDate: d(380), requiredRacs: { RAC01: true, PTS: true, ART: true } },
  { employeeId: 'emp-011', asoExpiryDate: d(220), requiredRacs: { RAC02: true, RAC11: true } },
  { employeeId: 'emp-012', asoExpiryDate: d(190), requiredRacs: { RAC01: true } },
  { employeeId: 'emp-013', asoExpiryDate: d(160), requiredRacs: { RAC01: true, RAC09: true, PTS: true } },
  { employeeId: 'emp-014', asoExpiryDate: d(350), requiredRacs: { RAC01: true } },
  { employeeId: 'emp-015', asoExpiryDate: d(120), requiredRacs: { RAC01: true, RAC02: true, RAC06: true, RAC11: true } },
  { employeeId: 'emp-016', asoExpiryDate: d(90), requiredRacs: { RAC01: true, RAC03: true, PTS: true } },
  { employeeId: 'emp-017', asoExpiryDate: d(130), requiredRacs: { RAC01: true, RAC02: true, RAC11: true } },
  { employeeId: 'emp-018', asoExpiryDate: d(200), requiredRacs: { RAC01: true, RAC04: true } },
  { employeeId: 'emp-019', asoExpiryDate: d(250), requiredRacs: { RAC01: true, ART: true } },
  { employeeId: 'emp-020', asoExpiryDate: d(60), requiredRacs: { RAC02: true, RAC11: true } },
  { employeeId: 'emp-021', asoExpiryDate: d(40), requiredRacs: { RAC02: true, RAC11: true } },
  { employeeId: 'emp-022', asoExpiryDate: d(270), requiredRacs: { RAC02: true, RAC11: true } },
  { employeeId: 'emp-023', asoExpiryDate: d(210), requiredRacs: { RAC01: true, RAC03: true, RAC08: true } },
  { employeeId: 'emp-024', asoExpiryDate: d(330), requiredRacs: { RAC01: true, RAC08: true, PTS: true } },
  { employeeId: 'emp-025', asoExpiryDate: d(290), requiredRacs: { RAC01: true, RAC05: true } },
  { employeeId: 'emp-026', asoExpiryDate: d(100), requiredRacs: { RAC01: true, RAC05: true } },
  { employeeId: 'emp-027', asoExpiryDate: d(80), requiredRacs: { RAC01: true } },
  { employeeId: 'emp-028', asoExpiryDate: d(200), requiredRacs: { RAC01: true } },

  // â”€â”€ DEMO CHAMPIONS â€” all requirements fully satisfied â”€â”€
  // Daniela Cossa: RAC01 âœ“ (bk-048) + PTS âœ“ (bk-049), ASO valid 365 days
  { employeeId: 'emp-029', asoExpiryDate: d(365), requiredRacs: { RAC01: true, PTS: true } },
  // Edgar Massinga: RAC01 âœ“ (bk-050) + RAC08 âœ“ (bk-051), ASO valid 365 days
  { employeeId: 'emp-030', asoExpiryDate: d(365), requiredRacs: { RAC01: true, RAC08: true } },
];

// â”€â”€â”€ 11. Breathalyzer Tests â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_BREATHALYZER_TESTS: BreathalyzerTest[] = [
  { id: 'bt-001', deviceId: 'IOT-BAC-01', employeeId: 'emp-001', employeeName: 'Paulo Manjate', date: d(-1), timestamp: ts(-1, 6), result: 0.00, status: 'PASS' },
  { id: 'bt-002', deviceId: 'IOT-BAC-01', employeeId: 'emp-003', employeeName: 'Sandro Duvane', date: d(-1), timestamp: ts(-1, 6), result: 0.00, status: 'PASS' },
  { id: 'bt-003', deviceId: 'IOT-BAC-01', employeeId: 'emp-005', employeeName: 'Umbe Gove', date: d(-1), timestamp: ts(-1, 6), result: 0.00, status: 'PASS' },
  { id: 'bt-004', deviceId: 'IOT-BAC-02', employeeId: 'emp-015', employeeName: 'Orlando Yacub', date: d(-2), timestamp: ts(-2, 6), result: 0.04, status: 'FAIL', imageUrl: '' },
  { id: 'bt-005', deviceId: 'IOT-BAC-02', employeeId: 'emp-017', employeeName: 'Rui Tivane', date: d(-2), timestamp: ts(-2, 6), result: 0.00, status: 'PASS' },
  { id: 'bt-006', deviceId: 'IOT-BAC-01', employeeId: 'emp-002', employeeName: 'RosÃ¡rio Chauque', date: d(0), timestamp: ts(0, 6), result: 0.00, status: 'PASS' },
  { id: 'bt-007', deviceId: 'IOT-BAC-01', employeeId: 'emp-004', employeeName: 'Teodora Fondo', date: d(0), timestamp: ts(0, 6), result: 0.00, status: 'PASS' },
  { id: 'bt-008', deviceId: 'IOT-BAC-03', employeeId: 'emp-020', employeeName: 'Quim Wate', date: d(0), timestamp: ts(0, 5), result: 0.00, status: 'PASS' },
  { id: 'bt-009', deviceId: 'IOT-BAC-03', employeeId: 'emp-022', employeeName: 'Sara Tamele', date: d(0), timestamp: ts(0, 5), result: 0.00, status: 'PASS' },
  { id: 'bt-010', deviceId: 'IOT-BAC-02', employeeId: 'emp-016', employeeName: 'Paulo Vombe', date: d(-5), timestamp: ts(-5, 6), result: 0.02, status: 'FAIL', imageUrl: '' },
];

// â”€â”€â”€ 12. IoT Devices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_IOT_DEVICES: IotDevice[] = [
  { id: 'IOT-BAC-01', name: 'Breathalyzer Unit â€” Gate Alpha (Moatize)', location: 'Moatize Mine Entrance', status: 'Online', lastPing: ts(0, 5) },
  { id: 'IOT-BAC-02', name: 'Breathalyzer Unit â€” Gate Bravo (Moatize)', location: 'Moatize East Access Road', status: 'Online', lastPing: ts(0, 5) },
  { id: 'IOT-BAC-03', name: 'Breathalyzer Unit â€” Lichinga Hub Gate', location: 'Lichinga Logistics Entrance', status: 'Online', lastPing: ts(0, 5) },
  { id: 'IOT-BAC-04', name: 'Breathalyzer Unit â€” Nacala Plant Gate', location: 'Nacala Processing Plant', status: 'Maintenance', lastPing: ts(-2, 14) },
  { id: 'IOT-BAC-05', name: 'Breathalyzer Unit â€” Maputo HQ', location: 'Maputo HQ Reception', status: 'Offline', lastPing: ts(-5, 8) },
];

// â”€â”€â”€ 13. Data Connectors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_CONNECTORS: DataConnector[] = [
  {
    id: 'conn-sf-hr',
    name: 'Vulcan HR System (SAP)',
    type: 'API',
    lastSync: ts(-1, 2),
    status: 'Healthy',
    color: '#3b82f6',
    source: 'SAP SuccessFactors',
    config: { baseUrl: 'https://api.sap.vulcan.com', syncFrequency: 'Daily' },
    mapping: { id: 'employee_id', name: 'full_name', dept: 'department', role: 'job_title', email: 'work_email' },
  },
  {
    id: 'conn-contractor-excel',
    name: 'Contractor Roster (Excel)',
    type: 'Excel',
    lastSync: ts(-3, 9),
    status: 'Idle',
    color: '#22c55e',
    source: 'SharePoint Upload',
    config: { syncFrequency: 'Weekly' },
    mapping: { id: 'Record_No', name: 'Worker_Name', company: 'Company', dept: 'Department', role: 'Position' },
  },
  {
    id: 'conn-iot-bac',
    name: 'IoT Breathalyzer Network',
    type: 'Webhook',
    lastSync: ts(0, 6),
    status: 'Healthy',
    color: '#f59e0b',
    source: 'CARS IoT Gateway',
    config: { baseUrl: 'https://iot.vulcan.com/webhook', syncFrequency: 'Hourly' },
    mapping: {},
  },
  {
    id: 'conn-training-db',
    name: 'Legacy Training DB (PostgreSQL)',
    type: 'Database',
    lastSync: ts(-30, 0),
    status: 'Idle',
    color: '#8b5cf6',
    source: 'On-premise PostgreSQL 14',
    config: { syncFrequency: 'Weekly' },
    mapping: { id: 'emp_no', name: 'full_name', sessionId: 'session_code', result: 'pass_fail' },
  },
  {
    id: 'conn-ext-client',
    name: 'External Client Portal API',
    type: 'Consumer',
    lastSync: ts(-1, 0),
    status: 'Authorized',
    color: '#ec4899',
    source: 'Client REST API Key',
    config: { authHeader: 'Bearer', syncFrequency: 'Daily' },
    mapping: {},
  },
];

// â”€â”€â”€ 14. Feedback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_FEEDBACK: Feedback[] = [
  { id: 'fb-001', userId: 'user-9', userName: 'Jessica Bata', type: 'Bug', message: 'RAC02 booking form does not show driver license field on mobile browser (iOS Safari).', status: 'In Progress', isActionable: true, timestamp: ts(-5) },
  { id: 'fb-002', userId: 'user-10', userName: 'Kelven Ubisse', type: 'Improvement', message: 'Would be helpful to receive an SMS reminder 48 hours before a training session.', status: 'New', isActionable: true, timestamp: ts(-4) },
  { id: 'fb-003', userId: 'user-12', userName: 'Domingos Guambe', type: 'General', message: 'System is significantly faster than the previous paper-based system. Very satisfied.', status: 'Resolved', isActionable: false, timestamp: ts(-3) },
  { id: 'fb-004', userId: 'user-7', userName: 'AntÃ³nio Sitoe', type: 'Bug', message: 'Trainer input page does not retain practical score when navigating between employees.', status: 'In Progress', isActionable: true, timestamp: ts(-2) },
  { id: 'fb-005', userId: 'user-3', userName: 'Ana Bila', type: 'Improvement', message: 'Reports page should allow filtering by contractor company, not only by site.', status: 'New', isActionable: true, timestamp: ts(-1) },
  { id: 'fb-006', userId: 'user-4', userName: 'Fernando Nhantumbo', type: 'Improvement', message: 'Verification QR code on RAC cards should also work offline for areas with no signal.', status: 'New', isActionable: true, timestamp: ts(-1) },
  { id: 'fb-007', userId: 'user-6', userName: 'HÃ©lio Tembe', type: 'General', message: 'Portuguese translation on a few labels is missing â€” appears in English.', status: 'New', isActionable: true, timestamp: ts(0) },
];

// â”€â”€â”€ 15. System Notifications â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const DEMO_NOTIFICATIONS: SystemNotification[] = [
  { id: 'notif-001', type: 'warning', title: 'Certifications Expiring', message: '3 employees have RAC certifications expiring within 60 days. Review required.', timestamp: new Date(), isRead: false },
  { id: 'notif-002', type: 'alert', title: 'Breathalyzer FAIL Detected', message: 'Orlando Yacub (ME-001) failed breathalyzer at Gate Bravo â€” 2 days ago. Supervisor notified.', timestamp: new Date(Date.now() - 172800000), isRead: false },
  { id: 'notif-003', type: 'info', title: 'IoT Device Offline', message: 'Breathalyzer Unit â€” Maputo HQ has been offline for 5 days. Check device connection.', timestamp: new Date(Date.now() - 432000000), isRead: true },
  { id: 'notif-004', type: 'success', title: 'HR Sync Complete', message: 'SAP SuccessFactors sync completed: 14 employees updated, 2 added.', timestamp: new Date(Date.now() - 86400000), isRead: true },
  { id: 'notif-005', type: 'info', title: 'New Training Sessions Scheduled', message: '8 upcoming sessions scheduled for the next 35 days across 4 sites.', timestamp: new Date(Date.now() - 3600000), isRead: false },
];

// â”€â”€â”€ 16. KPI Summary (Computed for dashboard charts) â”€â”€â”€â”€â”€â”€â”€â”€â”€

/** Pre-computed KPIs for presentation dashboards */
export const DEMO_KPI = {
  totalEmployees: DEMO_EMPLOYEES.length,
  activeEmployees: DEMO_EMPLOYEES.filter(e => e.isActive).length,
  totalBookings: DEMO_BOOKINGS.length,
  passedCount: DEMO_BOOKINGS.filter(b => b.status === BookingStatus.PASSED).length,
  failedCount: DEMO_BOOKINGS.filter(b => b.status === BookingStatus.FAILED).length,
  pendingCount: DEMO_BOOKINGS.filter(b => b.status === BookingStatus.PENDING).length,
  absentCount: DEMO_BOOKINGS.filter(b => b.status === BookingStatus.ABSENT).length,
  waitlistedCount: DEMO_BOOKINGS.filter(b => b.status === BookingStatus.WAITLISTED).length,
  breathalyzerTests: DEMO_BREATHALYZER_TESTS.length,
  breathalyzerFails: DEMO_BREATHALYZER_TESTS.filter(t => t.status === 'FAIL').length,
  upcomingSessions: DEMO_SESSIONS.filter(s => s.date >= d(0)).length,
  expiringCertifications: DEMO_BOOKINGS.filter(b => b.expiryDate && b.expiryDate <= d(60) && b.expiryDate > d(0)).length,
  companiesCount: DEMO_COMPANIES.length,
  sitesCount: DEMO_SITES.length,
  passRate: 0, // computed below
};
DEMO_KPI.passRate = Math.round(
  (DEMO_KPI.passedCount / (DEMO_KPI.passedCount + DEMO_KPI.failedCount)) * 100
);

/**
 * Monthly training activity (last 6 months) for trend charts
 */
export const DEMO_MONTHLY_TREND = [
  { month: 'Jan', sessions: 4, passed: 28, failed: 3, absent: 2 },
  { month: 'Feb', sessions: 5, passed: 32, failed: 4, absent: 1 },
  { month: 'Mar', sessions: 6, passed: 38, failed: 5, absent: 3 },
  { month: 'Apr', sessions: 5, passed: 31, failed: 2, absent: 2 },
  { month: 'May', sessions: 7, passed: 44, failed: 3, absent: 4 },
  { month: 'Jun', sessions: 8, passed: 47, failed: 4, absent: 2 },
];

/**
 * RAC compliance coverage by module (% of required employees who are certified)
 */
export const DEMO_RAC_COMPLIANCE = [
  { rac: 'RAC01', label: 'Working at Height', compliance: 91, total: 28, certified: 26 },
  { rac: 'RAC02', label: 'Vehicles & Mobile Eq.', compliance: 82, total: 11, certified: 9 },
  { rac: 'RAC03', label: 'Energy Isolation', compliance: 75, total: 8, certified: 6 },
  { rac: 'RAC05', label: 'Confined Spaces', compliance: 80, total: 5, certified: 4 },
  { rac: 'RAC06', label: 'Lifting Operations', compliance: 88, total: 8, certified: 7 },
  { rac: 'RAC08', label: 'Electrical Safety', compliance: 100, total: 6, certified: 6 },
  { rac: 'RAC09', label: 'Explosives Control', compliance: 85, total: 7, certified: 6 },
  { rac: 'RAC11', label: 'Mine Traffic Rules', compliance: 90, total: 10, certified: 9 },
  { rac: 'PTS',   label: 'Work Permit Issuer',  compliance: 72, total: 14, certified: 10 },
  { rac: 'ART',   label: 'Risk Assessment',      compliance: 78, total: 9, certified: 7 },
];

/**
 * Compliance by company (for enterprise dashboard)
 */
export const DEMO_COMPANY_COMPLIANCE = [
  { company: 'Vulcan Resources', employees: 14, compliance: 93 },
  { company: 'Mota-Engil Africa', employees: 5, compliance: 74 },
  { company: 'Belabel Logistics', employees: 3, compliance: 67 },
  { company: 'Escopil Engineering', employees: 3, compliance: 88 },
  { company: 'Jachris Services', employees: 3, compliance: 80 },
];


export const DEMO_RECRUITMENT_PROCESSES: RecruitmentProcess[] = [
  {
    id: 'rp-1',
    candidateName: 'Mateus Nhaca',
    candidateEmail: 'mateus.nhaca@gmail.com',
    candidatePhone: '+258 84 883 9102',
    workerType: 'Prime',
    primeCompany: 'Vulcan Resources Mozambique',
    company: 'Vulcan Resources Mozambique',
    department: 'Mine Operations',
    role: 'Haul Truck Operator',
    requiredRacs: ['RAC02', 'RAC11'],
    status: RecruitmentStatus.AM_REQUESTED,
    requestedBy: 'Hélio Tembe',
    requestedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    documents: [],
    nudgeCount: 0,
    requestType: 'Recruitment'
  },
  {
    id: 'rp-2',
    candidateName: 'Joana Mabunda',
    candidateEmail: 'joana.mabunda@outlook.com',
    candidatePhone: '+258 82 402 9384',
    workerType: 'Prime',
    primeCompany: 'Vulcan Resources Mozambique',
    company: 'Vulcan Resources Mozambique',
    department: 'Plant Maintenance',
    role: 'Electrician',
    requiredRacs: ['RAC01', 'RAC08'],
    status: RecruitmentStatus.SECURITY_PENDING,
    requestedBy: 'Grace Matsinhe',
    requestedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    documents: [
      { name: 'joana_id.pdf', type: 'ID', uploadedAt: new Date(Date.now() - 3600000 * 22).toISOString(), fileSize: '1.2 MB', status: 'Verified' },
      { name: 'joana_passport.pdf', type: 'Passport', uploadedAt: new Date(Date.now() - 3600000 * 22).toISOString(), fileSize: '3.4 MB', status: 'Verified' }
    ],
    nudgeCount: 1,
    lastNudgeAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    requestType: 'Recruitment'
  },
  {
    id: 'rp-3',
    candidateName: 'Afonso Macamo',
    candidateEmail: 'afonso.macamo@gmail.com',
    candidatePhone: '+258 85 554 0092',
    workerType: 'Contractor',
    primeCompany: 'Vulcan Resources Mozambique',
    contractorCompany: 'Mota-Engil Africa',
    company: 'Mota-Engil Africa',
    department: 'Mine Operations',
    role: 'Operator',
    requiredRacs: ['RAC01', 'RAC02', 'RAC11'],
    status: RecruitmentStatus.PARALLEL_CLEARANCE_PENDING,
    requestedBy: 'Domingos Guambe',
    requestedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    documents: [
      { name: 'afonso_passport.pdf', type: 'Passport', uploadedAt: new Date(Date.now() - 3600000 * 46).toISOString(), fileSize: '2.8 MB', status: 'Verified' },
      { name: 'afonso_work_permit.pdf', type: 'Work Permit', uploadedAt: new Date(Date.now() - 3600000 * 45).toISOString(), fileSize: '1.5 MB', status: 'Verified' }
    ],
    temporaryBadgeNumber: 'TEMP-ACCESS-8830',
    securityCleared: true,
    clinicFitnessCleared: false,
    nudgeCount: 0,
    requestType: 'Recruitment'
  },
  {
    id: 'rp-4',
    candidateName: 'Beatriz Langa',
    candidateEmail: 'beatriz.langa@yahoo.com',
    candidatePhone: '+258 84 100 2938',
    workerType: 'Prime',
    primeCompany: 'Vulcan Resources Mozambique',
    company: 'Vulcan Resources Mozambique',
    department: 'HSE',
    role: 'Safety Officer',
    requiredRacs: ['RAC01', 'RAC05', 'PTS', 'ART'],
    status: RecruitmentStatus.TRAINING_PENDING,
    requestedBy: 'Carlos Macuácua',
    requestedAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    documents: [
      { name: 'beatriz_id.pdf', type: 'ID', uploadedAt: new Date(Date.now() - 3600000 * 94).toISOString(), fileSize: '1.1 MB', status: 'Verified' }
    ],
    temporaryBadgeNumber: 'TEMP-ACCESS-4029',
    medicalExam: {
      bloodPressure: '120/80',
      heartRate: 72,
      visionTest: 'Pass',
      drugScreen: 'Negative',
      fitForWork: true,
      checkedAt: new Date(Date.now() - 3600000 * 90).toISOString(),
      comments: 'Vitals excellent. Fit for active duties.'
    },
    inductionDate: new Date(Date.now() - 3600000 * 80).toISOString(),
    inductionConfirmed: true,
    nudgeCount: 0,
    requestType: 'Recruitment'
  },
  {
    id: 'rp-5',
    candidateName: 'Filipe Mapande',
    candidateEmail: 'filipe.mapande@gmail.com',
    candidatePhone: '+258 84 990 0011',
    workerType: 'Contractor',
    primeCompany: 'Vulcan Resources Mozambique',
    contractorCompany: 'Belabel Logistics',
    company: 'Belabel Logistics',
    department: 'Logistics',
    role: 'Driver',
    requiredRacs: ['RAC02', 'RAC11'],
    status: RecruitmentStatus.COMPLETED,
    requestedBy: 'Hélio Tembe',
    requestedAt: new Date(Date.now() - 3600000 * 120).toISOString(),
    documents: [
      { name: 'filipe_id.pdf', type: 'ID', uploadedAt: new Date(Date.now() - 3600000 * 118).toISOString(), fileSize: '1.4 MB', status: 'Verified' }
    ],
    temporaryBadgeNumber: 'TEMP-ACCESS-2940',
    securityCleared: true,
    clinicFitnessCleared: true,
    medicalExam: {
      bloodPressure: '118/75',
      heartRate: 68,
      visionTest: 'Pass',
      drugScreen: 'Negative',
      fitForWork: true,
      checkedAt: new Date(Date.now() - 3600000 * 115).toISOString(),
      comments: 'Fit for heavy machinery driving operations.'
    },
    fitnessCertificate: {
      certificateNo: 'FIT-BL-2940-2026',
      issuedAt: new Date(Date.now() - 3600000 * 115).toISOString(),
      validUntil: new Date(Date.now() + 365 * 24 * 3600000).toISOString(),
      issuedBy: 'Dr. António Sitoe',
      examinationType: 'Pre-Employment',
      bloodPressure: '118/75',
      heartRate: 68,
      visionTest: 'Pass',
      drugScreen: 'Negative',
      bmi: '23.4',
      hearing: 'Normal',
      musculoskeletal: 'Normal',
      fitForWork: true,
      comments: 'Pre-employment assessment passed. No restrictions.'
    },
    inductionDate: new Date(Date.now() - 3600000 * 110).toISOString(),
    inductionConfirmed: true,
    trainingCompletedAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    nudgeCount: 0,
    employeeId: 'emp-filipe-mapande',
    recordId: 'BL-2940',
    requestType: 'Recruitment'
  },
  {
    id: 'rp-6',
    candidateName: 'Joaquim Chissano',
    candidateEmail: 'joaquim.chissano@contractor.com',
    candidatePhone: '+258 84 112 3456',
    workerType: 'Contractor',
    primeCompany: 'Vulcan Resources Mozambique',
    contractorCompany: 'Escopil Engineering',
    company: 'Escopil Engineering',
    department: 'Administration',
    role: 'Visitor',
    requiredRacs: [],
    status: RecruitmentStatus.SECURITY_PENDING,
    requestedBy: 'Hélio Tembe',
    requestedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    documents: [],
    amDocuments: [
      { name: 'joaquim_dire.pdf', type: 'DIRE', uploadedAt: new Date(Date.now() - 3600000 * 3).toISOString(), fileSize: '1.4 MB', status: 'Verified', uploadedBy: 'AM' }
    ],
    nudgeCount: 0,
    requestType: 'PersonnelAccess'
  },
  {
    id: 'rp-7',
    candidateName: 'Haul Truck EX-901',
    candidateEmail: 'trucks.maintenance@vulcan.com',
    candidatePhone: '+258 84 998 8877',
    workerType: 'Contractor',
    primeCompany: 'Vulcan Resources Mozambique',
    contractorCompany: 'Mota-Engil Africa',
    company: 'Mota-Engil Africa',
    department: 'Mine Operations',
    role: 'Excavator',
    requiredRacs: [],
    status: RecruitmentStatus.SAFETY_PENDING,
    requestedBy: 'Grace Matsinhe',
    requestedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    documents: [],
    amDocuments: [
      { name: 'truck_ex901_details.pdf', type: 'Contractor & Responsible Details', uploadedAt: new Date(Date.now() - 3600000 * 5).toISOString(), fileSize: '2.1 MB', status: 'Verified', uploadedBy: 'AM' }
    ],
    nudgeCount: 0,
    requestType: 'EquipmentAccess',
    equipmentType: 'Excavator',
    equipmentId: 'EX-901',
    responsiblePersonName: 'Alberto Manjate',
    responsiblePersonPhone: '+258 84 102 9384'
  },
  {
    id: 'rp-8',
    candidateName: 'Water Truck WT-405',
    candidateEmail: 'water.trucks@vulcan.com',
    candidatePhone: '+258 84 555 1234',
    workerType: 'Contractor',
    primeCompany: 'Vulcan Resources Mozambique',
    contractorCompany: 'Mota-Engil Africa',
    company: 'Mota-Engil Africa',
    department: 'Mine Operations',
    role: 'Water Truck',
    requiredRacs: [],
    status: RecruitmentStatus.SECURITY_PENDING,
    requestedBy: 'Grace Matsinhe',
    requestedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    documents: [],
    amDocuments: [
      { name: 'insurance_wt405.pdf', type: 'Insurance', uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(), fileSize: '1.2 MB', status: 'Verified', uploadedBy: 'AM' },
      { name: 'manifest_wt405.pdf', type: 'Manifesto', uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(), fileSize: '850 KB', status: 'Verified', uploadedBy: 'AM' },
      { name: 'wt405_front.jpg', type: 'Front View Image', uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(), fileSize: '1.1 MB', status: 'Verified', uploadedBy: 'AM' },
      { name: 'wt405_right.jpg', type: 'Side View (R)', uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(), fileSize: '1.2 MB', status: 'Verified', uploadedBy: 'AM' },
      { name: 'wt405_left.jpg', type: 'Side View (L)', uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(), fileSize: '1.1 MB', status: 'Verified', uploadedBy: 'AM' },
      { name: 'wt405_back.jpg', type: 'Back View', uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(), fileSize: '1.3 MB', status: 'Verified', uploadedBy: 'AM' }
    ],
    nudgeCount: 0,
    requestType: 'EquipmentAccess',
    equipmentType: 'Water Truck',
    equipmentId: 'WT-405',
    responsiblePersonName: 'Alberto Manjate',
    responsiblePersonPhone: '+258 84 102 9384',
    safetyInspectionCleared: true,
    safetyInspectionRecordId: 'INSP-WT-405-A',
    safetyInspectionComments: 'Brakes, steering, lights, tire thread verified and fully compliant.'
  }
];

// ─── 14. SafeMap Unsafe Conditions ──────────────────────────────────────────────

export const DEMO_UNSAFE_CONDITIONS: UnsafeCondition[] = [
  {
    id: 'sm-001',
    latitude: -16.145,
    longitude: 33.567,
    functionLocation: 'CHPP Plant A - Level 2',
    conditionType: 'Missing Guardrail',
    responsibleArea: 'Equipment Maintenance',
    description: 'Guardrail is missing on the main conveyor walkway. Fall hazard.',
    initialPhotos: ['https://images.unsplash.com/photo-1542384650-7058fbca25ec?q=80&w=300'],
    correctionPhotos: [],
    observerId: 'emp-001',
    observerName: 'João Silva',
    ssmaFocalPointId: 'emp-003',
    ssmaFocalPointName: 'Carlos Mendonça',
    areaResponsibleId: 'emp-004',
    areaResponsibleName: 'Pedro Santos',
    areaManagerId: 'u-1',
    areaManagerName: 'Admin User',
    state: 'Em Correção',
    mapStatus: 'Atrasado',
    severity: 'High',
    category: 'Unsafe Condition',
    createdAt: d(-5),
  },
  {
    id: 'sm-002',
    latitude: -16.148,
    longitude: 33.570,
    functionLocation: 'Workshop B',
    conditionType: 'Oil Spill',
    responsibleArea: 'Operations',
    description: 'Large oil spill near the entrance of Workshop B.',
    initialPhotos: ['https://images.unsplash.com/photo-1596245366914-99a38f322ea3?q=80&w=300'],
    correctionPhotos: [],
    observerId: 'emp-002',
    observerName: 'Maria José',
    ssmaFocalPointId: 'emp-003',
    ssmaFocalPointName: 'Carlos Mendonça',
    areaResponsibleId: 'emp-005',
    areaResponsibleName: 'Ana Ferreira',
    areaManagerId: 'u-1',
    areaManagerName: 'Admin User',
    state: 'Criado',
    mapStatus: 'Recente',
    severity: 'Medium',
    category: 'Unsafe Condition',
    createdAt: d(0),
  },
  {
    id: 'sm-003',
    latitude: -16.140,
    longitude: 33.560,
    functionLocation: 'Main Entrance Gate',
    conditionType: 'Exposed Wiring',
    responsibleArea: 'Electrical',
    description: 'Exposed live wires on the temporary lighting pole.',
    initialPhotos: ['https://images.unsplash.com/photo-1544724569-5f546fd6f2b6?q=80&w=300'],
    correctionPhotos: ['https://images.unsplash.com/photo-1517420704952-d9f39e95b43e?q=80&w=300'],
    observerId: 'emp-004',
    observerName: 'Pedro Santos',
    ssmaFocalPointId: 'emp-003',
    ssmaFocalPointName: 'Carlos Mendonça',
    areaResponsibleId: 'emp-006',
    areaResponsibleName: 'Ricardo Lopes',
    areaManagerId: 'u-1',
    areaManagerName: 'Admin User',
    state: 'Resolvido',
    mapStatus: 'Resolvido',
    severity: 'Critical',
    category: 'Unsafe Condition',
    createdAt: d(-10),
    resolvedAt: d(-2),
  }
];

