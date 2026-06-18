# Employee User Guide

> **Document:** Employee User Guide
> **Project:** Leave Management System
> **Version:** 1.0.0
> **Last Updated:** June 18, 2026

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Applying for Leave](#3-applying-for-leave)
4. [Viewing Leave Requests](#4-viewing-leave-requests)
5. [Team Calendar](#5-team-calendar)
6. [Recurring Leave Patterns](#6-recurring-leave-patterns)
7. [Reports & Statement](#7-reports--statement)
8. [Profile Management](#8-profile-management)
9. [Notifications](#9-notifications)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Getting Started

### Logging In

1. Open your web browser and go to the Leave Management System URL
2. Enter the **email** provided by your HR/admin team
3. Enter your **password** (provided by your admin or set during password reset)
4. Click **"Sign In"**

> **First time logging in?** Your admin will provide initial credentials. Change your password after first login.

### Forgot Password?

1. On the login page, click **"Forgot Password?"**
2. Enter your registered email address
3. Check your email for a password reset link
4. Click the link and set a new password

### Understanding the Interface

```
┌──────────────────────────────────────────────────────────┐
│  [☰] Leave Management System      🔍 [Search...] [🌙] [🔔] [👤] │
├──────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌────────────────────────────────┐ │
│  │   Main Menu      │  │                                │ │
│  │                  │  │         Page Content            │ │
│  │ • Dashboard      │  │                                │ │
│  │ • Apply Leave    │  │                                │ │
│  │ • Leave Requests │  │                                │ │
│  │ • Team Calendar  │  │                                │ │
│  │ • Leave Patterns │  │                                │ │
│  │ • Reports        │  │                                │ │
│  │                  │  │                                │ │
│  │ ───────────────  │  │                                │ │
│  │ • Profile        │  │                                │ │
│  └─────────────────┘  └────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

- **Left Sidebar** — Main navigation (tap ☰ on mobile to open)
- **Top Header** — Search bar, dark mode toggle, notifications, your profile
- **Main Area** — The page you're currently viewing

---

## 2. Dashboard

Your personal dashboard shows an overview of your leave activity.

### KPI Cards

| Metric | Description |
|---|---|
| **Total Requests** | Number of leave requests you've submitted |
| **Pending Requests** | Requests awaiting approval |
| **Approved Days** | Total approved leave days |
| **Remaining Days** | Leave days still available |

### Leave Balances

A table shows your current leave balance for each leave type:

| Leave Type | Allocated | Used | Remaining |
|---|---|---|---|
| Annual Leave | 12 | 3 | 9 |
| Sick Leave | 14 | 0 | 14 |
| Personal Leave | 5 | 1 | 4 |

### Calendar View

Your approved leaves are shown on a calendar, color-coded by leave type.

### Recent Requests

Your most recent leave requests are listed with their current status.

---

## 3. Applying for Leave

### Access

Navigate to: **Sidebar → Apply Leave**

### Step-by-Step Guide

1. **Select Leave Type**
   - Choose from available leave types (Annual, Sick, Personal, etc.)
   - The type determines which balance is used

2. **Select Dates**
   - Choose **Start Date** and **End Date**
   - The system automatically calculates the duration
   - Holidays are marked on the date picker and are excluded from business day calculations
   - You can also select **Half Day** or **Hourly** for partial-day absences

3. **Add Reason (Optional)**
   - Provide a brief explanation for your leave

4. **Attach File (Optional)**
   - Attach supporting documents (medical certificate, etc.)
   - Accepted formats: JPEG, PNG, GIF, PDF
   - Max file size: 5MB

5. **Submit**
   - Click **"Submit Request"**
   - Your request is sent to your manager/admin for approval
   - You'll receive a confirmation notification

### Duration Types

| Type | Description | Example |
|---|---|---|
| **Full Day** | The entire day off | Mon-Fri = 5 days |
| **Half Day** | Half a day off (AM or PM) | Monday morning = 0.5 days |
| **Hourly** | Specific hours off | 2 hours = 0.25 days |

### Important Notes

- **Overlap detection:** The system prevents you from submitting duplicate or overlapping leave requests
- **Balance check:** You cannot submit a leave if you don't have sufficient remaining balance
- **Policy enforcement:** The system enforces company policies (max consecutive days, notice period, etc.)
- **Holidays:** Public holidays within your leave period don't count toward your leave balance

---

## 4. Viewing Leave Requests

### Access

Navigate to: **Sidebar → Leave Requests**

### Features

#### Request List
All your leave requests are displayed in a table with:

| Column | Description |
|---|---|
| **Type** | Leave type with color indicator |
| **Dates** | Start and end dates |
| **Duration** | Number of days |
| **Status** | Pending, Approved, Rejected, or Cancelled |
| **Approver** | Who approved/rejected |
| **Actions** | Cancel (for pending requests) |

#### Filtering
- **Status Tabs** — Click to filter: All, Pending, Approved, Rejected, Cancelled
- **Search** — Search by leave type or reason
- **Date Range** — Filter by start/end date

#### Approve/Reject Notifications
- When your request is approved, the status updates automatically
- You'll receive a notification and (if configured) an email

#### Cancelling a Request
1. Find the request with status "Pending" or "Approved"
2. Click the **cancel** icon
3. Confirm the cancellation
4. If the request was already approved, the leave balance is restored

#### Re-applying from Rejected
If your leave was rejected:
1. Open the rejected request details
2. Click **"Re-apply"**
3. The form is pre-filled with your previous entries
4. Adjust dates/reason as needed and re-submit

---

## 5. Team Calendar

### Access

Navigate to: **Sidebar → Team Calendar**

### Features

The team calendar shows approved leaves for all team members in your department.

- **Color-coded events** — Each leave type has a distinct color
- **Hover for details** — Hover over any event to see the employee name and leave details
- **Month/Week/Day views** — Toggle between calendar views
- **Filter by team** — View specific teams or departments

This helps you:
- Know when colleagues are out of office
- Plan team activities around absences
- Coordinate coverage

---

## 6. Recurring Leave Patterns

### Access

Navigate to: **Sidebar → Leave Patterns**

### Features

Set up recurring leave patterns for regular commitments (e.g., weekly medical appointments, recurring personal time).

#### Creating a Pattern
1. Click **"Add Pattern"**
2. Configure:
   - **Leave Type** — Select the applicable type
   - **Frequency** — Weekly, Bi-weekly, or Monthly
   - **Day of Week** — Which day(s) of the week
   - **Start Date** — When the pattern begins
   - **End Date** — Optional end date
   - **Reason** — Brief explanation
3. Click **"Save"**

#### Generating Leave Requests
1. Once a pattern is saved, click **"Generate"**
2. The system creates individual leave requests for each occurrence
3. These requests go through the normal approval process

#### Managing Patterns
- **Pause** — Temporarily stop generating leaves from a pattern
- **Edit** — Update pattern settings
- **Cancel** — End the pattern entirely

---

## 7. Reports & Statement

### Reports

#### Access

Navigate to: **Sidebar → Reports**

#### Features
- **Year selector** — Choose which year to view
- **Summary** — See your total requests, approved days, and leave usage
- **Employee Statement** — Get a detailed breakdown of all leave activity

#### Employee Statement
1. Navigate to: **Sidebar → Employee Statement**
2. Your name is pre-selected
3. Select a year
4. View:
   - Opening and closing balances
   - All leave requests with statuses
   - Monthly breakdown
5. **Download as PDF** for your records

---

## 8. Profile Management

### Access

Click your name/avatar in the top-right header, then click **"Profile"**
Or navigate via: **Sidebar → Profile** (bottom section)

### Features

#### Viewing Profile
- Your personal details: name, email, employee ID, department, position
- Profile picture
- Account information

#### Editing Profile
1. Click **"Edit Profile"**
2. Update:
   - **First Name / Last Name**
   - **Phone number**
   - **Profile picture** — Upload a photo (JPG, PNG; max 5MB)
3. Click **"Save Changes"**

#### Changing Password
1. On the Profile page, click **"Change Password"**
2. Enter:
   - **Current Password**
   - **New Password**
   - **Confirm New Password**
3. Click **"Update Password"**

#### Viewing Leave Balance
Your profile also shows your current leave balances for all leave types.

---

## 9. Notifications

### Access

Click the **🔔 bell icon** in the top-right header.

### Features

#### Receiving Notifications
- **Bell badge** — Shows the number of unread notifications
- **Notification panel** — Click the bell to see all notifications
- **Toast pop-ups** — Brief notification that appears and auto-dismisses for real-time events

#### Notification Types

| Type | You'll Get This When... |
|---|---|
| ✅ Leave Approved | Your leave request is approved |
| ❌ Leave Rejected | Your leave request is rejected |
| 📝 Leave Submitted | (Confirmation of your submission) |
| ⏰ Leave Reminder | Your approved leave starts tomorrow |
| 🔄 Status Changed | An admin changes your leave status |

#### Marking Notifications as Read
- **Single notification** — Click on it to navigate to the related page (auto-marked as read)
- **Mark all read** — Click "Mark all read" button at the top of the notification panel

---

## 10. Troubleshooting

### Common Employee Issues

| Issue | Solution |
|---|---|
| **Can't log in** | Click "Forgot Password" to reset, or contact your admin |
| **Can't submit leave** | Check that you have sufficient balance for the selected dates |
| **Can't see the dates I want** | Holidays are shown in gray and can't be selected as leave days |
| **File upload failed** | Ensure the file is under 5MB and is a supported format (PDF, JPG, PNG, GIF) |
| **My balance looks wrong** | Contact your admin to verify and adjust |
| **Team calendar is empty** | Only approved leaves are shown; pending/rejected leaves won't appear |
| **Notification bell has no new items** | Try refreshing the page; the app also checks every 30 seconds automatically |

### Who to Contact

| Issue | Contact |
|---|---|
| Login problems | Your system administrator |
| Wrong leave balance | HR or your manager |
| Technical bugs | IT support (note: check audit logs for error details) |
| Feature requests | Your department manager |

### Tips & Best Practices

- **Apply early** — Submit leave requests well in advance, respecting minimum notice periods
- **Check balance first** — Before applying, check your remaining leave balance on the Dashboard
- **Add a reason** — A brief reason helps approvers make faster decisions
- **Use the calendar** — Check the Team Calendar to avoid scheduling during team absences
- **Monitor notifications** — Keep an eye on the bell icon for status updates
- **Update your profile** — Keep your phone number and profile picture current

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + K` (or `Cmd + K`) | Focus search bar |
| `Escape` | Close modals, dropdowns, panels |
| `Tab` | Navigate through form fields |

---

*For admin documentation, see the [Admin Guide](admin-guide.md).*
*For technical information, see the [Architecture Overview](architecture.md).*
