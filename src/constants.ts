
import { TrainingSession, Employee, EmployeeRequirement, Booking, BookingStatus, Feedback, RacDef } from './types';

export const DEPARTMENTS = ['Mine Operations', 'Plant Maintenance', 'HSE', 'Logistics', 'Administration'];
export const ROLES = ['Operator', 'Technician', 'Engineer', 'Supervisor', 'General Helper', 'Driver', 'Mechanic', 'Electrician'];

// --- INTEGRATION SIMULATION DATA ---
// Added aso_expiry and rac_flags for simulation of training module sync
export const RAW_HR_SOURCE = [
    { id: '8901', name: 'Jessica Bata', dept: 'HSE', role: 'Safety Officer', email: 'jessica@vulcan.com', aso_expiry: '2025-12-01', rac_flags: ['RAC01', 'RAC05'] },
    { id: '8902', name: 'Kelven Ubisse', dept: 'Mine Operations', role: 'Mining Engineer', email: 'kelven@vulcan.com', aso_expiry: '2025-08-15', rac_flags: ['RAC01', 'RAC02', 'RAC11'] },
    { id: '8903', name: 'Latifa Uetela', dept: 'Administration', role: 'HR Specialist', email: 'latifa@vulcan.com', aso_expiry: '2026-01-20', rac_flags: ['RAC01'] }
];

export const RAW_CONTRACTOR_SOURCE = [
    { id: '9001', name: 'Manuel Xadreque', company: 'Jachris', dept: 'Administration', role: 'Catering Supervisor', aso_expiry: '2025-05-10', rac_flags: ['RAC05'] },
    { id: '9002', name: 'Nuno Zaqueu', company: 'Jachris', dept: 'Logistics', role: 'General Helper', aso_expiry: '2025-06-12', rac_flags: ['RAC01'] },
    { id: '9003', name: 'Orlando Yacub', company: 'Mota-Engil', dept: 'Mine Operations', role: 'Excavator Operator', aso_expiry: '2025-11-30', rac_flags: ['RAC01', 'RAC02', 'RAC06'] },
    { id: '9004', name: 'Paulo Vombe', company: 'Mota-Engil', dept: 'Mine Operations', role: 'Civil Technician', aso_expiry: '2025-09-01', rac_flags: ['RAC01', 'RAC03'] },
    { id: '9005', name: 'Quim Wate', company: 'Belabel', dept: 'Logistics', role: 'Driver', aso_expiry: '2025-07-22', rac_flags: ['RAC02', 'RAC11'] },
    { id: '9006', name: 'Rui Vilanculos', company: 'Belabel', dept: 'Logistics', role: 'Driver', aso_expiry: '2025-04-15', rac_flags: ['RAC02', 'RAC11'] },
    { id: '9007', name: 'Sara Tamele', company: 'Belabel', dept: 'Logistics', role: 'Driver', aso_expiry: '2025-12-10', rac_flags: ['RAC02', 'RAC11'] },
    { id: '9008', name: 'Telma Sambo', company: 'Escopil', dept: 'Plant Maintenance', role: 'Mechanic', aso_expiry: '2025-10-05', rac_flags: ['RAC01', 'RAC03', 'RAC08'] },
    { id: '9009', name: 'Ursio Raposo', company: 'Escopil', dept: 'Plant Maintenance', role: 'Electrician', aso_expiry: '2025-11-20', rac_flags: ['RAC01', 'RAC08'] },
    { id: '9010', name: 'Test Subcontractor Employee', company: 'Sub-Mota Engineering', dept: 'Mine Operations', role: 'Sub-Contractor Tech', aso_expiry: '2027-12-31', rac_flags: ['RAC01'] }
];

export const OPS_KEYS = [
    'EMI_PTS',          
    'APR_ART',          
    'DONO_AREA_PTS',    
    'EXEC'             
];

export const PERMISSION_KEYS = ['EMI_PTS', 'APR_ART', 'DONO_AREA_PTS', 'EXEC'];

export const RAC_KEYS = ['RAC01', 'RAC02', 'RAC03', 'RAC04', 'RAC05', 'RAC06', 'RAC07', 'RAC08', 'RAC09', 'RAC10', 'RAC11', 'PTS', 'ART'];

export const INITIAL_RAC_DEFINITIONS: RacDef[] = [
    { id: 'rac1', code: 'RAC01', name: 'RAC 01 - Working at Height', validityMonths: 24, requiresPractical: true, passScore: 70 },
    { id: 'rac2', code: 'RAC02', name: 'RAC 02 - Vehicles and Mobile Equipment', validityMonths: 24, requiresDriverLicense: true, requiresPractical: true, passScore: 70 },
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
    { id: 'art', code: 'ART', name: 'ART - Risk Assessment', validityMonths: 24, requiresPractical: true, passScore: 70 }
];

const getFutureDate = (daysToAdd: number) => {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
};

const getPastDate = (daysToSubtract: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysToSubtract);
  return date.toISOString().split('T')[0];
};

export const MOCK_SESSIONS: TrainingSession[] = [
  { id: 'S001', racType: 'RAC 01 - Working at Height', date: '2023-11-15', startTime: '08:00', location: 'Room A', instructor: 'John Doe', capacity: 20, sessionLanguage: 'English' },
  { id: 'S002', racType: 'RAC 02 - Vehicles and Mobile Equipment', date: '2023-11-20', startTime: '09:00', location: 'Field B', instructor: 'Jane Smith', capacity: 15, sessionLanguage: 'Portuguese' },
  { id: 'S011', racType: 'RAC 11 - Mine Traffic Rules', date: '2024-12-05', startTime: '10:30', location: 'Room D', instructor: 'Antonio Sitoe', capacity: 30, sessionLanguage: 'Portuguese' }
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'emp1', name: 'Paulo Manjate', recordId: 'VUL-1001', company: 'Vulcan', department: 'Mine Operations', role: 'Operator', isActive: true, driverLicenseNumber: 'DL-12345', driverLicenseClass: 'Heavy', driverLicenseExpiry: '2025-12-31', siteId: 's1' },
  { id: 'emp2', name: 'Maria Silva', recordId: 'VUL-1002', company: 'Vulcan', department: 'HSE', role: 'Safety Officer', isActive: true, siteId: 's1' }
];

export const MOCK_REQUIREMENTS: EmployeeRequirement[] = [
  { employeeId: 'emp1', asoExpiryDate: getFutureDate(180), requiredRacs: { 'RAC01': true, 'RAC02': true, 'RAC03': true, 'RAC11': true } },
  { employeeId: 'emp2', asoExpiryDate: getFutureDate(200), requiredRacs: { 'RAC01': true, 'RAC05': true, 'PTS': true, 'ART': true } }
];

export const MOCK_BOOKINGS: Booking[] = [
  { id: 'b1', sessionId: 'S001', employee: MOCK_EMPLOYEES[0], status: BookingStatus.PASSED, resultDate: '2023-11-15', expiryDate: getFutureDate(600), attendance: true, theoryScore: 85, practicalScore: 90 },
  { id: 'b2', sessionId: 'S002', employee: MOCK_EMPLOYEES[0], status: BookingStatus.PASSED, resultDate: '2023-11-20', expiryDate: getFutureDate(605), attendance: true, theoryScore: 88, practicalScore: 92, driverLicenseVerified: true },
  { id: 'b3', sessionId: 'S011', employee: MOCK_EMPLOYEES[0], status: BookingStatus.PASSED, resultDate: '2024-12-05', expiryDate: getFutureDate(730), attendance: true, theoryScore: 95, practicalScore: 95, driverLicenseVerified: true }
];

export const MOCK_FEEDBACK: Feedback[] = [
    { id: '1', userId: 'user1', userName: 'Paulo Manjate', type: 'Bug', message: 'Unable to select RAC02 on mobile view.', status: 'New', isActionable: true, timestamp: getPastDate(1) + 'T10:00:00' }
];
