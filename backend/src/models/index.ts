import Role from './Role';
import Department from './Department';
import User from './User';
import Employee from './Employee';
import LeaveType from './LeaveType';
import LeaveBalance from './LeaveBalance';
import LeaveRequest from './LeaveRequest';
import Notification from './Notification';
import AuditLog from './AuditLog';
import Holiday from './Holiday';
import LeavePolicy from './LeavePolicy';
import LeaveRequestApproval from './LeaveRequestApproval';
import Permission from './Permission';
import SystemConfig from './SystemConfig';
import LeavePattern from './LeavePattern';

// Role -> User
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Department -> Employee
Department.hasMany(Employee, { foreignKey: 'departmentId', as: 'employees' });
Employee.belongsTo(Department, { foreignKey: 'departmentId', as: 'department' });

// User -> Employee
User.hasOne(Employee, { foreignKey: 'userId', as: 'employee' });
Employee.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// LeaveType -> LeaveBalance
LeaveType.hasMany(LeaveBalance, { foreignKey: 'leaveTypeId', as: 'balances' });
LeaveBalance.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

// LeaveType -> LeaveRequest
LeaveType.hasMany(LeaveRequest, { foreignKey: 'leaveTypeId', as: 'requests' });
LeaveRequest.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

// Employee -> LeaveBalance
Employee.hasMany(LeaveBalance, { foreignKey: 'employeeId', as: 'leaveBalances' });
LeaveBalance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee -> LeaveRequest
Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId', as: 'leaveRequests' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// Employee -> LeaveRequest (as approver)
Employee.hasMany(LeaveRequest, { foreignKey: 'approverId', as: 'approvedRequests' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'approverId', as: 'approver' });

// Employee self-referencing for manager relationship
Employee.belongsTo(Employee, { foreignKey: 'managerId', as: 'manager' });
Employee.hasMany(Employee, { foreignKey: 'managerId', as: 'subordinates' });

// User -> Notification
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User -> AuditLog
User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// LeaveType -> LeavePolicy
LeaveType.hasOne(LeavePolicy, { foreignKey: 'leaveTypeId', as: 'policy' });
LeavePolicy.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

// LeaveRequest -> LeaveRequestApproval
LeaveRequest.hasMany(LeaveRequestApproval, { foreignKey: 'leaveRequestId', as: 'approvals' });
LeaveRequestApproval.belongsTo(LeaveRequest, { foreignKey: 'leaveRequestId', as: 'leaveRequest' });

// Employee -> LeaveRequestApproval (as approver)
Employee.hasMany(LeaveRequestApproval, { foreignKey: 'approverId', as: 'approvals' });
LeaveRequestApproval.belongsTo(Employee, { foreignKey: 'approverId', as: 'approver' });

// Role -> Permission
Role.hasMany(Permission, { foreignKey: 'roleId', as: 'permissions' });
Permission.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

// Employee -> LeavePattern
Employee.hasMany(LeavePattern, { foreignKey: 'employeeId', as: 'leavePatterns' });
LeavePattern.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

// LeaveType -> LeavePattern
LeaveType.hasMany(LeavePattern, { foreignKey: 'leaveTypeId', as: 'leavePatterns' });
LeavePattern.belongsTo(LeaveType, { foreignKey: 'leaveTypeId', as: 'leaveType' });

export {
  Role,
  Department,
  User,
  Employee,
  LeaveType,
  LeaveBalance,
  LeaveRequest,
  Notification,
  AuditLog,
  Holiday,
  LeavePolicy,
  LeaveRequestApproval,
  Permission,
  LeavePattern,
  SystemConfig,
};
