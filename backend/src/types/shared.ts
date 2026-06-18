// ─── API Response Envelope ───────────────────────────────────────────

export type StatusCode = number;

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

export interface JwtPayload {
  userId: number;
  email: string;
  role: string;
  roleId: number;
  employeeId?: number;
  departmentId?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number;
    email: string;
    role: string;
    employee: EmployeeBrief | null;
  };
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
  department?: DepartmentBrief;
}

export interface EmployeeWithUser extends EmployeeBrief {
  email: string;
  phone?: string;
  hireDate: string;
  departmentId: number;
  userId?: number;
  managerId?: number;
  isActive: boolean;
  dateOfBirth?: string;
  manager?: EmployeeBrief;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  departmentId: number;
  phone?: string;
  hireDate: string;
  managerId?: number;
}

export interface UpdateEmployeeRequest extends Partial<CreateEmployeeRequest> {
  isActive?: boolean;
  dateOfBirth?: string;
  profilePicture?: string;
}

// ─── Department Types ────────────────────────────────────────────────

export interface DepartmentBrief {
  id: number;
  name: string;
  description?: string;
}

export interface DepartmentWithCount extends DepartmentBrief {
  employeeCount: number;
}

export interface CreateDepartmentRequest {
  name: string;
  description?: string;
}

// ─── Leave Type Types ────────────────────────────────────────────────

export interface LeaveTypeBrief {
  id: number;
  name: string;
  color: string;
  defaultDays: number;
  description?: string;
}

export interface CreateLeaveTypeRequest {
  name: string;
  description?: string;
  defaultDays: number;
  color: string;
}

// ─── Leave Balance Types ─────────────────────────────────────────────

export interface LeaveBalanceInfo {
  leaveTypeId: number;
  leaveTypeName: string;
  color: string;
  allocated: number;
  used: number;
  remaining: number;
}

export interface AdjustBalanceRequest {
  employeeId: number;
  leaveTypeId: number;
  allocated: number;
  year: number;
}

// ─── Leave Request Types ─────────────────────────────────────────────

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type DurationType = 'full' | 'half' | 'hourly';

export interface LeaveRequestBrief {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  duration: number;
  durationType?: DurationType;
  status: LeaveStatus;
  reason?: string;
  rejectionReason?: string;
  createdAt: string;
  employee?: EmployeeBrief;
  leaveType?: LeaveTypeBrief;
  approver?: EmployeeBrief;
}

export interface CreateLeaveRequest {
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  duration: number;
  durationType?: DurationType;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface LeaveRequestFilter {
  status?: LeaveStatus;
  departmentId?: number;
  employeeId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ─── Leave Policy Types ──────────────────────────────────────────────

export interface LeavePolicyBrief {
  id: number;
  leaveTypeId: number;
  maxConsecutiveDays: number;
  minNoticeDays: number;
  carryOverLimit: number;
  requiresApproval: boolean;
  isActive: boolean;
  accrualRule: 'none' | 'monthly' | 'quarterly' | 'yearly';
  leaveType?: LeaveTypeBrief;
}

export interface CreateLeavePolicyRequest {
  leaveTypeId: number;
  maxConsecutiveDays: number;
  minNoticeDays: number;
  carryOverLimit: number;
  requiresApproval: boolean;
  accrualRule: 'none' | 'monthly' | 'quarterly' | 'yearly';
}

// ─── Leave Request Approval Types ────────────────────────────────────

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface LeaveRequestApprovalBrief {
  id: number;
  leaveRequestId: number;
  approverId: number;
  level: number;
  status: ApprovalStatus;
  comment?: string;
  createdAt: string;
  approver?: EmployeeBrief;
}

// ─── Leave Pattern Types ─────────────────────────────────────────────

export type PatternFrequency = 'weekly' | 'biweekly' | 'monthly';
export type PatternStatus = 'active' | 'paused' | 'cancelled';

export interface LeavePatternBrief {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  frequency: PatternFrequency;
  dayOfWeek: number;
  weekOfMonth?: number;
  startDate: string;
  endDate?: string;
  status: PatternStatus;
  reason?: string;
  employee?: EmployeeBrief;
  leaveType?: LeaveTypeBrief;
}

// ─── Holiday Types ───────────────────────────────────────────────────

export interface HolidayBrief {
  id: number;
  name: string;
  date: string;
  isRecurring: boolean;
  type: string;
}

export interface CreateHolidayRequest {
  name: string;
  date: string;
  isRecurring: boolean;
  type: string;
}

// ─── Notification Types ──────────────────────────────────────────────

export interface NotificationBrief {
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

export interface AuditLogBrief {
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

export interface AuditLogFilter {
  action?: string;
  entity?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// ─── Dashboard Types ─────────────────────────────────────────────────

export interface EmployeeDashboard {
  kpis: {
    pendingLeaves: number;
    approvedLeaves: number;
    rejectedLeaves: number;
    onLeave: number;
    totalBalances: number;
  };
  balances: LeaveBalanceInfo[];
  recentRequests: LeaveRequestBrief[];
  nextUpcomingLeave?: LeaveRequestBrief | null;
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
  recentRequests?: LeaveRequestBrief[];
  recentActivities?: ActivityItem[];
}

export interface ActivityItem {
  id: number;
  action: string;
  entity: string;
  details?: string;
  createdAt: string;
  user?: { email: string };
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

export type ConfigValueType = 'string' | 'number' | 'boolean' | 'json';
export type ConfigGroup = 'general' | 'leave' | 'email' | 'system';

export interface SystemConfigBrief {
  id: number;
  key: string;
  value: string;
  description?: string;
  type: ConfigValueType;
  group: ConfigGroup;
}

// ─── Permission / Role Types ─────────────────────────────────────────

export interface RoleBrief {
  id: number;
  name: string;
  description?: string;
}

export interface PermissionBrief {
  id: number;
  roleId: number;
  resource: string;
  action: string;
  allowed: boolean;
}

// ─── Pagination Query ────────────────────────────────────────────────

export interface PaginationQuery {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
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
