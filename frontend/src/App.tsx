import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute, AdminRoute, ManagerRoute, GuestRoute } from '@/components/ProtectedRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Profile from '@/pages/Profile';
import Employees from '@/pages/Employees';
import LeaveRequests from '@/pages/LeaveRequests';
import ApplyLeave from '@/pages/ApplyLeave';
import Reports from '@/pages/Reports';
import Holidays from '@/pages/Holidays';
import AuditLogs from '@/pages/AuditLogs';
import LeaveCredits from '@/pages/LeaveCredits';
import LeaveTypes from '@/pages/LeaveTypes';
import Departments from '@/pages/Departments';
import EmployeeStatement from '@/pages/EmployeeStatement';
import Permissions from '@/pages/Permissions';
import SystemConfig from '@/pages/SystemConfig';
import Analytics from '@/pages/Analytics';
import ReloadPrompt from '@/components/ReloadPrompt';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ReloadPrompt />
        <ErrorBoundary>
        <Routes>
          {/* Guest Routes */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/apply-leave" element={<ApplyLeave />} />
              <Route path="/leave-requests" element={<LeaveRequests />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/employee-statement" element={<EmployeeStatement />} />
              <Route path="/analytics" element={<Analytics />} />

              {/* Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/employees" element={<Employees />} />
                <Route path="/leave-credits" element={<LeaveCredits />} />
                <Route path="/leave-types" element={<LeaveTypes />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/holidays" element={<Holidays />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/permissions" element={<Permissions />} />
                <Route path="/admin/system-config" element={<SystemConfig />} />
              </Route>
            </Route>
          </Route>

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
