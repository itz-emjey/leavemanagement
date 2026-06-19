# Admin User Guide

> **Document:** Admin User Guide
> **Project:** Leave Management System
> **Version:** 1.0.0
> **Last Updated:** June 18, 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Employee Management](#3-employee-management)
4. [Leave Credits](#4-leave-credits)
5. [Leave Types](#5-leave-types)
6. [Leave Policies](#6-leave-policies)
7. [Departments](#7-departments)
8. [Holidays](#8-holidays)
9. [Leave Request Administration](#9-leave-request-administration)
10. [Reporting & Analytics](#10-reporting--analytics)
11. [Permissions Management](#11-permissions-management)
12. [System Configuration](#12-system-configuration)
13. [Audit Logs](#13-audit-logs)
14. [Notifications](#14-notifications)
15. [Troubleshooting](#15-troubleshooting)

---

## 1. Getting Started

### First Login

1. Navigate to your Leave Management System URL
2. Login with the admin credentials provided by your IT team
   - **Default:** admin@company.com / admin123
3. **Change your password immediately** via Profile settings
4. Familiarize yourself with the sidebar navigation

### Understanding the Interface

- **Left Sidebar** — Main navigation menu (collapsible on mobile)
- **Top Header** — Search bar, theme toggle, notifications, user menu
- **Main Content Area** — Dynamic page content based on navigation
- **Dark Mode** — Toggle via the sun/moon icon in the header

### Admin vs. Regular User

As an admin, you have access to all sections of the system. The following sections are **admin-only** and not visible to regular employees:

- Employees
- Leave Credits
- Leave Types
- Leave Policies
- Departments
- Permissions
- System Configuration
- Audit Logs

---

## 2. Dashboard

The admin dashboard provides a birds-eye view of the entire organization's leave activity.

### KPI Cards

| Metric | Description |
|---|---|
| **Total Employees** | Active employees in the system |
| **Active Requests** | Pending leave requests |
| **Pending Approvals** | Requests awaiting your approval action |
| **Approved This Month** | Leaves approved in the current month |
| **Total Departments** | Number of departments |
| **Utilization Rate** | Percentage of available leave days used |

### Calendar View

The calendar displays all approved leave requests color-coded by leave type. Hover over any event to see employee name and leave details.

### Charts

- **Monthly Trends** — Area chart showing approved vs. rejected requests by month
- **Leave Distribution** — Pie chart showing distribution by leave type

### Recent Activities

Shows the latest audit log entries across the system.

### Leave Request Quick Actions

The "Recent Leave Requests" table shows the most recent requests with inline approve/reject buttons for quick action.

---

## 3. Employee Management

### Access

Navigate to: **Sidebar → Employees** (admin-only)

### Features

#### Viewing Employees
- Paginated table with search, filter by department, and sortable columns
- Displays: Employee ID, Name, Email, Department, Position, Status, Hire Date

#### Adding an Employee
1. Click **"Add Employee"** button
2. Fill in the form:
   - **Employee ID** — Unique identifier (e.g., EMP-0042)
   - **First Name / Last Name** — Required
   - **Email** — Used for login and notifications
   - **Position** — Job title
   - **Department** — Select from existing departments
   - **Phone** — Optional contact number
   - **Hire Date** — Employment start date
   - **Manager** — Optional reporting manager
   - **Date of Birth** — Optional
   - **Password** — Initial login password (default: auto-generated)
3. Click **"Save"** to create the employee

#### Editing an Employee
1. Click the **edit (pencil)** icon on any employee row
2. Update the desired fields
3. Click **"Save Changes"**

#### Toggling Employee Status
- Click the **toggle status** icon to activate/deactivate an employee
- Deactivated employees cannot log in or submit leave requests

#### Resetting Password
1. Click the **reset password** icon
2. Enter the new password
3. Share the new password with the employee securely

#### Deleting an Employee
- Click the **delete (trash)** icon
- Confirm the action
- This is a **soft delete** — the employee record is preserved in the database but hidden from active views

#### Bulk Import
1. Click **"Import CSV"**
2. Upload a CSV or Excel file with employee data
3. The system will create employee records and user accounts

**CSV Format:**
```
employeeId,firstName,lastName,email,position,department
EMP-0042,Jane,Smith,jane@company.com,Product Manager,Engineering
```

---

## 4. Leave Credits

### Access

Navigate to: **Sidebar → Leave Credits** (admin-only)

### Features

#### Viewing Credits
- Table showing each employee's leave balances by leave type for the selected year
- Columns: Employee, Leave Type, Allocated, Used, Remaining, Year

#### Adjusting Individual Credits
1. Click the **adjust (edit)** icon on a credit row
2. Enter the new allocated amount
3. The system recalculates used and remaining automatically

#### Bulk Adjust Credits
1. Click **"Bulk Adjust"**
2. Select leave type, year, and the adjustment amount
3. Select which employees to apply the adjustment to
4. Click **"Apply"**

#### Carry-Over Credits
1. Click **"Carry Over"**
2. Select the source year and target year
3. Unused leave days (up to the carry-over limit) are transferred to the new year

---

## 5. Leave Types

### Access

Navigate to: **Sidebar → Leave Types** (admin-only)

### Features

Leave types define the categories of leave available in the system.

#### Default Leave Types (Seeded)
| Type | Default Days | Color |
|---|---|---|
| Annual Leave | 12 | Blue (#3B82F6) |
| Sick Leave | 14 | Red (#EF4444) |
| Personal Leave | 5 | Amber (#F59E0B) |
| Maternity Leave | 90 | Pink (#EC4899) |
| Paternity Leave | 7 | Purple (#8B5CF6) |

#### Creating a Leave Type
1. Click **"Add Leave Type"**
2. Enter:
   - **Name** — Display name (e.g., "Study Leave")
   - **Description** — Brief explanation
   - **Default Days** — Standard allocation per year
   - **Color** — Hex color for calendar display
3. Click **"Save"**

#### Editing / Deleting
- **Edit** — Update name, description, days, or color
- **Delete** — Remove a leave type (cannot delete if it has associated leave requests)

---

## 6. Leave Policies

### Access

Navigate to: **Sidebar → Leave Policies** (admin-only)

### Features

Leave policies enforce rules for each leave type.

#### Policy Fields
| Field | Description | Example |
|---|---|---|
| **Max Consecutive Days** | Maximum days allowed in a single request | 15 |
| **Min Notice Days** | Days before the leave must be submitted | 1 |
| **Carry-Over Limit** | Maximum unused days that can transfer to next year | 5 |
| **Requires Approval** | Whether manager/admin approval is needed | Yes |
| **Accrual Rule** | How leave days accrue (none/monthly/quarterly/yearly) | Yearly |

#### Creating a Policy
1. Click **"Add Leave Policy"**
2. Select the leave type
3. Configure the policy rules
4. Click **"Save"**

---

## 7. Departments

### Access

Navigate to: **Sidebar → Departments** (admin-only)

### Features

#### Default Departments (Seeded)
- Engineering
- Human Resources
- Finance
- Marketing
- Operations

#### Adding a Department
1. Click **"Add Department"**
2. Enter **Name** and optional **Description**
3. Click **"Save"**

#### Editing / Deleting
- **Edit** — Update name or description
- **Delete** — Remove department (cannot delete if it has employees assigned)

---

## 8. Holidays

### Access

Navigate to: **Sidebar → Holidays** (admin-only)

### Features

#### Adding a Holiday
1. Click **"Add Holiday"**
2. Enter:
   - **Name** — Holiday name (e.g., "New Year")
   - **Date** — Date of the holiday
   - **Recurring** — Toggle if this holiday repeats annually
   - **Type** — Category (public, religious, company)
3. Click **"Save"**

#### Viewing Holidays
- All holidays are displayed in a list
- Recurring holidays are marked with a repeat icon
- Use the "Upcoming" view to see upcoming holidays

#### Effects
- Holidays are displayed in the leave calendar (non-working days)
- The system automatically excludes holidays when calculating business day durations

---

## 9. Leave Request Administration

### Access

Navigate to: **Sidebar → Leave Requests**

### Features

#### Viewing Requests
- Tab-based filtering: All, Pending, Approved, Rejected, Cancelled
- Search by employee name, leave type, or reason
- Filter by department and date range
- Sortable columns

#### Approving a Request
1. Click the **checkmark (approve)** icon on a pending request
2. (Optional) Add a comment
3. Confirm the approval
4. The system automatically:
   - Updates the request status
   - Deducts from leave balance
   - Sends notification to the employee
   - Creates an audit log entry

#### Rejecting a Request
1. Click the **X (reject)** icon
2. Enter a **rejection reason** (required)
3. Confirm the rejection

#### Cancelling a Request
- Click the **cancel** icon to cancel a request (typically used for accidental approvals)

#### Multi-Level Approval
For requests in multi-level approval workflow:
1. Manager approves at level 1
2. Admin approves at level 2 (if configured)
3. Each level creates an approval record in `leave_request_approvals`

---

## 10. Reporting & Analytics

### Access

- **Reports:** Sidebar → Reports
- **Analytics:** Sidebar → Analytics (admin-only)

### Reports

#### Summary
- Year selector
- Total requests, approved, pending, rejected counts
- Approval rate percentage
- Total leave days taken

#### Monthly Trends
- Bar/area chart showing approved vs. rejected by month
- Download as CSV or PDF

#### Leave Type Distribution
- Pie chart showing distribution by leave type

#### Department Comparison
- Table comparing departments by total days, employee count, and average days per employee

#### Export Options
- **CSV Export** — Download raw data
- **PDF Export** — Download formatted report with all charts and tables

### Employee Statement
- Navigate to: Sidebar → Employee Statement
- Select an employee and year
- View detailed leave history and balance statement
- Download as PDF

### Analytics (Admin-Only)

- **Overview** — High-level leave analytics
- **Trends** — Year-over-year comparison
- **Employees** — Per-employee leave analysis
- **Utilization** — Leave utilization rates across the organization

---

## 11. Permissions Management

### Access

Navigate to: **Sidebar → Permissions** (admin-only)

### Features

The permissions system allows granular control over what each role can do.

#### Permission Matrix

Permissions are organized by **Resource** and **Action**:

| Resource | Actions |
|---|---|
| leave_requests | create, read, approve, reject, cancel |
| employees | create, read, update, delete |
| leave_types | create, read, update, delete |
| departments | create, read, update, delete |
| holidays | create, read, update, delete |
| leave_credits | read, adjust, carry_over |
| reports | read, export |
| audit_logs | read, export |
| settings | read, configure |

#### Modifying Permissions
1. Select a **Role** (admin, manager, employee)
2. Toggle permissions on/off for each resource/action
3. Click **"Save"**

#### Resetting Permissions
- Click **"Reset to Default"** to restore factory permission settings

---

## 12. System Configuration

### Access

Navigate to: **Sidebar → System Config** (admin-only)

### Features

Manage application-wide configuration settings.

#### Config Groups
| Group | Examples |
|---|---|
| **General** | Application name, timezone, date format |
| **Leave** | Default approval workflow, carry-over rules |
| **Email** | Sender name, notification settings |
| **System** | Session timeout, maintenance mode |

#### Modifying Config
1. Click the **edit** icon on a config entry
2. Update the value
3. Click **"Save"**

> **Note:** Some configuration changes may require a server restart to take effect.

---

## 13. Audit Logs

### Access

Navigate to: **Sidebar → Audit Logs** (admin-only)

### Features

The audit log provides a complete history of all actions performed in the system.

#### Viewing Logs
- Paginated table with columns: Timestamp, User, Action, Entity, Details, IP Address
- Filter by action type and entity type
- Search across all log entries

#### Export
- Click **"Export CSV"** to download audit logs as a CSV file

#### Common Actions Tracked
- LOGIN, LOGOUT
- LEAVE_CREATED, LEAVE_APPROVED, LEAVE_REJECTED, LEAVE_CANCELLED
- EMPLOYEE_CREATED, EMPLOYEE_UPDATED, EMPLOYEE_DELETED
- CREDIT_ADJUSTED, CARRY_OVER_EXECUTED
- PASSWORD_CHANGED, PASSWORD_RESET
- PERMISSION_UPDATED, CONFIG_UPDATED

---

## 14. Notifications

### Access

- **Notification Bell** — Top-right header icon
- **Real-time alerts** — Toast notifications for live events

### Features

#### Receiving Notifications
- In-app notifications via the bell icon (red badge shows unread count)
- Toast pop-ups for real-time events (new requests, approvals, etc.)
- Email notifications (if email provider is configured)

#### Notification Types
| Type | Trigger |
|---|---|
| Leave Submitted | Employee submits a leave request |
| Leave Approved | Leave request is approved |
| Leave Rejected | Leave request is rejected |
| Leave Cancelled | Leave request is cancelled |
| Leave Reminder | Daily cron (approved leaves starting tomorrow) |

#### Managing Notifications
- Click the bell icon to open the notification panel
- Click a notification to navigate to the related page and mark it as read
- Click **"Mark all read"** to clear unread notifications

---

## 15. Troubleshooting

### Common Admin Issues

| Issue | Solution |
|---|---|
| **Employee can't log in** | Reset their password via Employees → Reset Password |
| **Leave balance incorrect** | Adjust credits via Leave Credits → Adjust |
| **Email not sending** | Check RESEND_API_KEY in backend configuration |
| **Dashboard shows no data** | Ensure database has seed data and employees have leave balances |
| **Permission denied** | Check Permissions module for the user's role |
| **Employee in wrong department** | Edit employee record via Employees → Edit |

### Getting Help

- Check the **Audit Logs** for recent activity
- Review **System Configuration** for application settings
- See the **API Documentation** at `/api/docs` for technical details

---

*For technical deployment instructions, see the [Deployment Guide](deployment.md).*
*For employee-facing features, see the [Employee Guide](employee-guide.md).*
