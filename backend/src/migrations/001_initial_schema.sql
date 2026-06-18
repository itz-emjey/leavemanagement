-- ============================================================
-- Migration 001: Initial Schema
-- Leave Management System
-- ============================================================

-- Roles table
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `roles_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Departments table
CREATE TABLE IF NOT EXISTS `departments` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `departments_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `roleId` INT UNSIGNED NOT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `resetPasswordToken` VARCHAR(255) DEFAULT NULL,
  `resetPasswordExpires` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_email_unique` (`email`),
  INDEX `idx_users_role` (`roleId`),
  INDEX `idx_users_active_role` (`isActive`, `roleId`),
  INDEX `idx_users_reset_token` (`resetPasswordToken`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Employees table
CREATE TABLE IF NOT EXISTS `employees` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED DEFAULT NULL,
  `employeeId` VARCHAR(20) NOT NULL,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `position` VARCHAR(100) NOT NULL,
  `departmentId` INT UNSIGNED NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `hireDate` DATE NOT NULL,
  `profilePicture` VARCHAR(255) DEFAULT NULL,
  `managerId` INT UNSIGNED DEFAULT NULL,
  `dateOfBirth` DATE DEFAULT NULL,
  `deletedAt` DATETIME DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `employees_employee_id_unique` (`employeeId`),
  UNIQUE INDEX `employees_email_unique` (`email`),
  INDEX `idx_employees_department` (`departmentId`),
  INDEX `idx_employees_user` (`userId`),
  INDEX `idx_employees_manager` (`managerId`),
  INDEX `idx_employees_name_search` (`firstName`, `lastName`),
  CONSTRAINT `fk_employees_department` FOREIGN KEY (`departmentId`) REFERENCES `departments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_employees_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_employees_manager` FOREIGN KEY (`managerId`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Types table
CREATE TABLE IF NOT EXISTS `leave_types` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `defaultDays` INT NOT NULL DEFAULT 0,
  `color` VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `leave_types_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Balances table
CREATE TABLE IF NOT EXISTS `leave_balances` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employeeId` INT UNSIGNED NOT NULL,
  `leaveTypeId` INT UNSIGNED NOT NULL,
  `allocated` DECIMAL(6,1) NOT NULL DEFAULT 0,
  `used` DECIMAL(6,1) NOT NULL DEFAULT 0,
  `remaining` DECIMAL(6,1) NOT NULL DEFAULT 0,
  `year` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `leave_balances_employee_type_year_unique` (`employeeId`, `leaveTypeId`, `year`),
  CONSTRAINT `fk_leave_balances_employee` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_leave_balances_leave_type` FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Requests table
CREATE TABLE IF NOT EXISTS `leave_requests` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employeeId` INT UNSIGNED NOT NULL,
  `leaveTypeId` INT UNSIGNED NOT NULL,
  `startDate` DATE NOT NULL,
  `endDate` DATE NOT NULL,
  `duration` DECIMAL(4,1) NOT NULL,
  `durationType` ENUM('full', 'half', 'hourly') DEFAULT 'full',
  `startTime` VARCHAR(10) DEFAULT NULL,
  `endTime` VARCHAR(10) DEFAULT NULL,
  `reason` TEXT DEFAULT NULL,
  `status` ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  `approverId` INT UNSIGNED DEFAULT NULL,
  `rejectionReason` TEXT DEFAULT NULL,
  `attachment` VARCHAR(255) DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_leave_requests_employee_status` (`employeeId`, `status`),
  INDEX `idx_leave_requests_employee_dates` (`employeeId`, `startDate`),
  INDEX `idx_leave_requests_status_date` (`status`, `startDate`),
  CONSTRAINT `fk_leave_requests_employee` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_leave_requests_leave_type` FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_leave_requests_approver` FOREIGN KEY (`approverId`) REFERENCES `employees` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Holidays table
CREATE TABLE IF NOT EXISTS `holidays` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `date` DATE NOT NULL,
  `isRecurring` TINYINT(1) NOT NULL DEFAULT 0,
  `type` VARCHAR(50) NOT NULL DEFAULT 'public',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_holidays_date` (`date`),
  INDEX `idx_holidays_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Notifications table
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'info',
  `link` VARCHAR(255) DEFAULT NULL,
  `isRead` TINYINT(1) NOT NULL DEFAULT 0,
  `isEmailSent` TINYINT(1) NOT NULL DEFAULT 0,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_notifications_user_read` (`userId`, `isRead`),
  INDEX `idx_notifications_created` (`createdAt`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit Logs table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `userId` INT UNSIGNED DEFAULT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity` VARCHAR(100) NOT NULL,
  `entityId` INT UNSIGNED DEFAULT NULL,
  `details` TEXT DEFAULT NULL,
  `ipAddress` VARCHAR(45) DEFAULT NULL,
  `userAgent` TEXT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_audit_logs_user` (`userId`),
  INDEX `idx_audit_logs_action_entity` (`action`, `entity`),
  INDEX `idx_audit_logs_created` (`createdAt`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Policies table (added in Phase 6)
CREATE TABLE IF NOT EXISTS `leave_policies` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `leaveTypeId` INT UNSIGNED NOT NULL,
  `maxConsecutiveDays` INT NOT NULL DEFAULT 15,
  `minNoticeDays` INT NOT NULL DEFAULT 1,
  `carryOverLimit` INT NOT NULL DEFAULT 5,
  `requiresApproval` TINYINT(1) NOT NULL DEFAULT 1,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `accrualRule` ENUM('none', 'monthly', 'quarterly', 'yearly') DEFAULT 'none',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_leave_policies_leave_type` FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Request Approvals table (added in Phase 6)
CREATE TABLE IF NOT EXISTS `leave_request_approvals` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `leaveRequestId` INT UNSIGNED NOT NULL,
  `approverId` INT UNSIGNED NOT NULL,
  `level` INT UNSIGNED NOT NULL DEFAULT 1,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `comment` TEXT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_approval_leave_request` (`leaveRequestId`),
  INDEX `idx_approval_approver` (`approverId`),
  INDEX `idx_approval_status` (`leaveRequestId`, `status`),
  CONSTRAINT `fk_approval_leave_request` FOREIGN KEY (`leaveRequestId`) REFERENCES `leave_requests` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_approval_approver` FOREIGN KEY (`approverId`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Permissions table
CREATE TABLE IF NOT EXISTS `permissions` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `roleId` INT UNSIGNED NOT NULL,
  `resource` VARCHAR(50) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `allowed` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_permissions_role_resource` (`roleId`, `resource`, `action`),
  CONSTRAINT `fk_permissions_role` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Leave Patterns table (added in Phase 6)
CREATE TABLE IF NOT EXISTS `leave_patterns` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `employeeId` INT UNSIGNED NOT NULL,
  `leaveTypeId` INT UNSIGNED NOT NULL,
  `frequency` ENUM('weekly', 'biweekly', 'monthly') NOT NULL,
  `dayOfWeek` TINYINT UNSIGNED NOT NULL,
  `weekOfMonth` TINYINT UNSIGNED DEFAULT NULL,
  `startDate` DATE NOT NULL,
  `endDate` DATE DEFAULT NULL,
  `status` ENUM('active', 'paused', 'cancelled') DEFAULT 'active',
  `reason` TEXT DEFAULT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_leave_patterns_employee` (`employeeId`),
  INDEX `idx_leave_patterns_status` (`status`),
  CONSTRAINT `fk_leave_patterns_employee` FOREIGN KEY (`employeeId`) REFERENCES `employees` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_leave_patterns_leave_type` FOREIGN KEY (`leaveTypeId`) REFERENCES `leave_types` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System Configs table
CREATE TABLE IF NOT EXISTS `system_configs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `key` VARCHAR(100) NOT NULL,
  `value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `type` ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
  `group` ENUM('general', 'leave', 'email', 'system') DEFAULT 'general',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `idx_system_config_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
