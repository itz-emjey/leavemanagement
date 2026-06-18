// ─── API Response Envelope ───────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string[]>;
}

// ─── Auth Types ──────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  email: string;
  role: string;
  employee: EmployeeBrief | null;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

// ─── Employee Types ──────────────────────────────────────────────────

export interface EmployeeBrief {
  id: number;
  firstName: string;
  lastName: string;
  employeeId: string;
  position: string;
  departmentName?: string;
  profilePicture?: string;
  department?: Department;
}

export interface Employee {
  id: number;
  userId?: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentId: number;
  department?: Department;
  phone?: string;
  hireDate: string;
  profilePicture?: string;
  managerId?: number;
  manager?: EmployeeBrief;
  isActive: boolean;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmployeeFormData {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentId: number;
  phone?: string;
  hireDate: string;
  managerId?: number;
}

// ─── Department Types ────────────────────────────────────────────────

export interface Department {
  id: number;
  name: string;
  description?: string;
  employeeCount?: number;
}

// ─── Leave Type Types ────────────────────────────────────────────────

export interface LeaveType {
  id: number;
  name: string;
  description?: string;
  defaultDays: number;
  color: string;
}

// ─── Leave Balance Types ─────────────────────────────────────────────

export interface LeaveBalance {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  allocated: number;
  used: number;
  remaining: number;
  year: number;
  leaveType?: LeaveType;
}

export interface LeaveBalanceInfo {
  leaveTypeId: number;
  leaveTypeName: string;
  color: string;
  allocated: number;
  used: number;
  remaining: number;
}

// ─── Leave Request Types ─────────────────────────────────────────────

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type DurationType = 'full' | 'half' | 'hourly';

export interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  duration: number;
  durationType?: DurationType;
  startTime?: string;
  endTime?: string;
  reason?: string;
  status: LeaveStatus;
  approverId?: number;
  rejectionReason?: string;
  attachment?: string;
  createdAt: string;
  updatedAt?: string;
  employee?: EmployeeBrief;
  leaveType?: LeaveType;
  approver?: EmployeeBrief;
}

export interface LeaveRequestFormData {
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  duration: number;
  durationType: DurationType;
  startTime?: string;
  endTime?: string;
  reason?: string;
  attachment?: File | null;
}

// ─── Leave Policy Types ──────────────────────────────────────────────

export interface LeavePolicy {
  id: number;
  leaveTypeId: number;
  maxConsecutiveDays: number;
  minNoticeDays: number;
  carryOverLimit: number;
  requiresApproval: boolean;
  isActive: boolean;
  accrualRule: 'none' | 'monthly' | 'quarterly' | 'yearly';
  leaveType?: LeaveType;
}

// ─── Holiday Types ───────────────────────────────────────────────────

export interface Holiday {
  id: number;
  name: string;
  date: string;
  isRecurring: boolean;
  type: string;
}

// ─── Notification Types ──────────────────────────────────────────────

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  link?: string;
  isRead: boolean;
  isEmailSent: boolean;
  createdAt: string;
}

// ─── Audit Log Types ─────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  entity: string;
  entityId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: { email: string; id: number };
}

// ─── Dashboard Types ─────────────────────────────────────────────────

export interface KpiData {
  label: string;
  value: number;
  icon: string;
  trend?: number;
  color: string;
}

export interface EmployeeDashboard {
  kpis: {
    pendingLeaves: number;
    approvedLeaves: number;
    rejectedLeaves: number;
    onLeave: number;
    totalBalances: number;
  };
  balances: LeaveBalanceInfo[];
  recentRequests: LeaveRequest[];
  nextUpcomingLeave?: LeaveRequest | null;
}

export interface AdminDashboard {
  kpis: {
    totalEmployees: number;
    activeEmployees: number;
    pendingLeaves: number;
    approvedLeaves: number;
    rejectedLeaves: number;
    onLeave: number;
  };
  monthlyTrends: { month: string; approved: number; rejected: number }[];
  leaveTypeDistribution: { name: string; value: number; color: string }[];
}

// ─── Report Types ────────────────────────────────────────────────────

export interface YearlySummary {
  totalRequests: number;
  approved: number;
  rejected: number;
  pending: number;
  totalDays: number;
}

export interface MonthlyTrend {
  month: string;
  approved: number;
  rejected: number;
}

export interface LeaveTypeDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DepartmentComparison {
  department: string;
  totalEmployees: number;
  totalRequests: number;
  totalDays: number;
  avgDaysPerRequest: number;
}

export interface ReportData {
  year: number;
  summary: YearlySummary;
  monthlyTrends: MonthlyTrend[];
  leaveTypeDistribution: LeaveTypeDistribution[];
  departmentComparison: DepartmentComparison[];
}

// ─── System Config Types ─────────────────────────────────────────────

export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  group: 'general' | 'leave' | 'email' | 'system';
}

// ─── Leave Pattern Types ─────────────────────────────────────────────

export interface LeavePattern {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number;
  weekOfMonth?: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  reason?: string;
  employee?: EmployeeBrief;
  leaveType?: LeaveType;
}

// ─── Calendar Types ──────────────────────────────────────────────────

export interface CalendarEvent {
  id: number;
  title: string;
  start: string;
  end: string;
  color: string;
  extendedProps: {
    status: LeaveStatus;
    employeeName: string;
    leaveType: string;
  };
}

// ─── Permission Types ────────────────────────────────────────────────

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface Permission {
  id: number;
  roleId: number;
  resource: string;
  action: string;
  allowed: boolean;
}
