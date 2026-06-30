export interface RacDef {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  validityMonths?: number;
  requiresDriverLicense?: boolean;
  requiresPractical?: boolean;
  passScore?: number;
}

export interface Company {
  id: string;
  name: string;
  appName?: string;
  logoUrl?: string;
  safetyLogoUrl?: string;
  status: 'Active' | 'Inactive';
  defaultLanguage?: 'en' | 'pt';
  parentId?: string; // Reference to Main Contractor
  tier?: 'Prime' | 'Sub'; 
  features?: {
      alcohol?: boolean;
  };
  address?: string;
  gpsCoordinates?: string;
  contactPerson?: string;
  contactCell?: string;
  contactEmail?: string;
  isPaid?: boolean;
  registrationDate?: string;
  selectedModules?: string[];
}

export interface Site {
  id: string;
  companyId: string;
  name: string;
  location: string;
  mandatoryRacs?: string[]; 
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  siteId?: string;
}

export interface Trainer {
  id: string;
  name: string;
  racs: string[];
  siteId?: string;
}

export enum UserRole {
  SYSTEM_ADMIN = 'System Admin',
  ENTERPRISE_ADMIN = 'Enterprise Admin',
  SITE_ADMIN = 'Site Admin',
  RAC_ADMIN = 'RAC Admin',
  DEPT_ADMIN = 'Department Admin',
  RAC_TRAINER = 'RAC Trainer',
  USER = 'User'
}

export interface User {
    id: number;
    name: string;
    email: string;
    phoneNumber?: string;
    role: UserRole;
    status: 'Active' | 'Inactive';
    company?: string;
    companyId?: string;
    companyLogo?: string;
    companyGpsCoordinates?: string;
    selectedModules?: string[];
    jobTitle?: string;
    department?: string;
    siteId?: string;
    appModule?: 'mobilization' | 'training' | 'both' | 'safemap';
}

export interface Employee {
  id: string;
  name: string;
  recordId: string;
  company: string;
  department: string;
  role: string;
  isActive?: boolean;
  siteId?: string;
  phoneNumber?: string;
  driverLicenseNumber?: string;
  driverLicenseClass?: string;
  driverLicenseExpiry?: string;
  appModule?: 'mobilization' | 'training' | 'both' | 'safemap';
}

export interface TrainingSession {
  id: string;
  racType: string;
  date: string;
  startTime: string;
  location: string;
  instructor: string;
  capacity: number;
  sessionLanguage: 'English' | 'Portuguese';
  siteId?: string;
}

export enum BookingStatus {
  PENDING = 'Pending',
  ATTENDED = 'Attended',
  PASSED = 'Passed',
  FAILED = 'Failed',
  EXPIRED = 'Expired',
  ABSENT = 'Absent',
  WAITLISTED = 'Waitlisted'
}

export interface Booking {
  id: string;
  sessionId: string;
  employee: Employee;
  status: BookingStatus;
  resultDate?: string;
  expiryDate?: string;
  attendance?: boolean;
  theoryScore?: number;
  practicalScore?: number;
  driverLicenseVerified?: boolean;
  isAutoBooked?: boolean;
  comments?: string;
  trainerName?: string;
}

export interface EmployeeRequirement {
  employeeId: string;
  asoExpiryDate: string;
  requiredRacs: Record<string, boolean>;
}

export interface SystemNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

export interface BreathalyzerTest {
  id: string;
  deviceId: string;
  employeeId: string;
  employeeName: string;
  date: string;
  timestamp: string;
  result: number;
  status: 'PASS' | 'FAIL';
  imageUrl?: string;
}

export interface IotDevice {
  id: string;
  name: string;
  location: string;
  status: 'Online' | 'Offline' | 'Maintenance';
  lastPing: string;
}

export type FeedbackType = 'Bug' | 'Improvement' | 'General';
export type FeedbackStatus = 'New' | 'In Progress' | 'Resolved' | 'Dismissed';

export interface Feedback {
  id: string;
  userId?: string;
  userName: string;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  isActionable: boolean;
  timestamp: string;
  adminNotes?: string;
}

export type ConnectorType = 'Excel' | 'Database' | 'API' | 'Webhook' | 'Consumer';

export interface DataConnector {
  id: string;
  name: string;
  type: ConnectorType;
  lastSync?: string;
  status: 'Healthy' | 'Error' | 'Idle' | 'Authorized';
  color: string;
  source: string;
  config: {
    baseUrl?: string;
    apiKey?: string;
    authHeader?: string;
    syncFrequency?: 'Hourly' | 'Daily' | 'Weekly';
  };
  mapping: Record<string, string>; 
  moduleMapping?: Record<string, string>;
}

export interface AppGateway {
    id: string;
    name: string;
    type: string;
    lastActive: string;
    status: 'Authorized' | 'Revoked' | 'Pending';
    key: string;
    description: string;
}

export interface SyncResult {
  id: string;
  connectorId: string;
  timestamp: string;
  added: number;
  updated: number;
  errors: number;
  status: 'Success' | 'Partial' | 'Failed';
  log: string[];
}

export enum RecruitmentStatus {
  AM_REQUESTED = 'AM Requested',
  HR_PENDING = 'HR Pending',
  SECURITY_PENDING = 'Security Pending',
  PARALLEL_CLEARANCE_PENDING = 'Parallel Clearance Pending',
  CLINIC_PENDING = 'Clinic Pending',
  INDUCTION_PENDING = 'Induction Pending',
  TRAINING_PENDING = 'Training Pending',
  COMPLETED = 'Completed',
  RECEIVED = 'Received',
  SAFETY_PENDING = 'Safety Pending',
  FAILED = 'Failed',
  DELIVERING = 'Delivering',
  DELIVERED = 'Delivered'
}

export interface RecruitDocument {
  name: string;
  type: 'ID' | 'Passport' | 'Work Permit' | 'Fitness Certificate' | 'AM ID Upload' | 'Contractor & Responsible Details' | 'DIRE' | 'Insurance' | 'Manifesto' | 'Front View Image' | 'Side View (R)' | 'Side View (L)' | 'Back View' | 'Driver License';
  uploadedAt: string;
  fileSize: string;
  status: 'Pending' | 'Verified' | 'Rejected';
  uploadedBy?: 'AM' | 'HR';
}

export interface MedicalExam {
  bloodPressure: string;
  heartRate: number;
  visionTest: 'Pass' | 'Fail';
  drugScreen: 'Negative' | 'Positive';
  fitForWork: boolean;
  checkedAt?: string;
  comments?: string;
  hearing?: 'Normal' | 'Impaired';
  musculoskeletal?: 'Normal' | 'Impaired';
}

export interface FitnessCertificate {
  certificateNo: string;
  issuedAt: string;
  validUntil: string;
  issuedBy: string;
  examinationType: 'Pre-Employment' | 'Periodic' | 'Return-to-Work';
  bloodPressure: string;
  heartRate: number;
  visionTest: 'Pass' | 'Fail';
  drugScreen: 'Negative' | 'Positive';
  bmi?: string;
  hearing?: 'Normal' | 'Impaired';
  musculoskeletal?: 'Normal' | 'Impaired';
  fitForWork: boolean;
  restrictions?: string;
  comments?: string;
}

export interface RecruitmentProcess {
  id: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  workerType: 'Prime' | 'Contractor';
  primeCompany: string;
  contractorCompany?: string;
  company: string;
  department: string;
  role: string;
  requiredRacs: string[];
  status: RecruitmentStatus;
  requestedBy: string;
  requestedAt: string;
  documents: RecruitDocument[];
  amDocuments?: RecruitDocument[];
  temporaryBadgeNumber?: string;
  securityCleared?: boolean;
  clinicFitnessCleared?: boolean;
  medicalExam?: MedicalExam;
  fitnessCertificate?: FitnessCertificate;
  inductionDate?: string;
  inductionConfirmed?: boolean;
  trainingCompletedAt?: string;
  receivedAt?: string;
  nudgeCount?: number;
  lastNudgeAt?: string;
  employeeId?: string;
  recordId?: string;
  
  // Extended fields for Option 2 & 3
  requestType?: 'Recruitment' | 'PersonnelAccess' | 'EquipmentAccess' | 'DeliveryAccess';
  equipmentType?: string;
  equipmentId?: string;
  responsiblePersonName?: string;
  responsiblePersonPhone?: string;
  safetyInspectionCleared?: boolean;
  safetyInspectionComments?: string;
  safetyInspectionRecordId?: string;

  // Dynamic workflow stages
  requiresMedical?: boolean;
  requiresInduction?: boolean;
  requiresRac?: boolean;

  // Delivery access fields
  truckModel?: string;
  truckRegNumber?: string;
  poNumber?: string;

  // Temporal access & security document fields
  accessStartDate?: string;
  accessEndDate?: string;
  canteen?: { breakfast: boolean; lunch: boolean; supper: boolean; lunchPack: boolean };
  accessReason?: string;
  accessStatus?: 'granted' | 'denied';
  denialReason?: string;
  accessDocumentRef?: string;
  areaManagerName?: string;
  areaManagerPhone?: string;
  areaManagerDepartment?: string;
  candidateIdNumber?: string;
}
// â”€â”€â”€ Safety Inspection Module â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type InspectionFieldType =
  | 'checkbox'
  | 'text'
  | 'number'
  | 'select'
  | 'photo'
  | 'date'
  | 'textarea';

export interface InspectionField {
  id: string;
  label: string;
  type: InspectionFieldType;
  required: boolean;
  options?: string[];       // for select fields
  description?: string;
}

export interface InspectionTemplate {
  id: string;
  equipmentType: string;   // e.g. "Haul Truck", "Crane", "Excavator"
  name: string;
  createdBy: string;
  createdAt: string;
  fields: InspectionField[];
  isActive: boolean;
}

export interface InspectionPhoto {
  id: string;
  fieldId: string;
  dataUrl: string;          // base64 for in-browser storage
  caption: string;
  takenAt: string;
}

export interface InspectionRecord {
  id: string;
  templateId: string;
  equipmentType: string;
  equipmentId: string;      // e.g. "TRK-001"
  inspectorName: string;
  inspectedAt: string;
  site?: string;
  status: 'Pass' | 'Fail' | 'Conditional';
  responses: Record<string, string | boolean>;
  photos: InspectionPhoto[];
  findings?: string;
  correctiveAction?: string;
  signedOff?: boolean;
}

// ─── SafeMap Module ─────────────────────────────────────────────────────────────

export type SafeMapState = 'Criado' | 'Em Correção' | 'Submetido ao Gerente' | 'Análise SSMA' | 'Resolvido';
export type SafeMapStatus = 'Atrasado' | 'Recente' | 'Resolvido';

export interface UnsafeCondition {
  id: string;
  latitude: number;
  longitude: number;
  functionLocation: string;
  conditionType: string;
  responsibleArea: string;
  description: string;
  actionPlan?: string;
  initialPhotos: string[]; // max 2
  correctionPhotos: string[]; // max 2
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: 'Unsafe Condition' | 'Unsafe Act' | 'Near Miss' | 'Positive Observation';
  observerId: string; // User ID
  observerName: string;
  ssmaFocalPointId?: string;
  ssmaFocalPointName?: string;
  areaResponsibleId?: string;
  areaResponsibleName?: string;
  areaManagerId?: string;
  areaManagerName?: string;
  state: SafeMapState;
  mapStatus: SafeMapStatus;
  createdAt: string;
  resolvedAt?: string;
}
