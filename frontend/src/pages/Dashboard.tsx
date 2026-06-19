import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import KpiCards from '@/components/KpiCards';
import CalendarView, { type CalendarEvent } from '@/components/CalendarView';
import { MonthlyTrendsChart, LeaveTypePieChart } from '@/components/Charts';
import RecentActivities from '@/components/RecentActivities';
import RecentLeaveRequests from '@/components/RecentLeaveRequests';
import { SkeletonDashboard, Skeleton } from '@/components/Skeleton';
import { useAuth } from '@/context/AuthContext';
import { Users, CalendarCheck, ArrowRight, TrendingUp, Clock, CheckCircle, XCircle, Briefcase, CalendarDays, AlertTriangle, ThumbsUp, ThumbsDown, Send, User, Umbrella } from 'lucide-react';

interface Balance {
  leaveTypeId: number;
  leaveType: string;
  color: string;
  allocated: number;
  used: number;
  remaining: number;
}

interface DashboardData {
  kpis: {
    totalEmployees: number;
    activeEmployees: number;
    pendingLeaves: number;
    approvedLeaves: number;
    rejectedLeaves: number;
    onLeave: number;
    totalBalances?: number;
  };
  balances?: Balance[];
  calendarEvents: CalendarEvent[];
  monthlyTrends: { month: string; approved: number; rejected: number }[];
  leaveTypeDistribution: { name: string; value: number; color: string }[];
  recentActivities: any[];
  recentRequests: any[];
  pendingForApproval?: {
    id: number;
    employeeName: string;
    employeeId: string;
    department: string;
    leaveType: string;
    leaveTypeColor: string;
    startDate: string;
    endDate: string;
    duration: number;
    reason: string;
    createdAt: string;
  }[];
  upcomingLeaves?: {
    id: number;
    employeeName: string;
    employeeId: string;
    department: string;
    leaveType: string;
    leaveTypeColor: string;
    startDate: string;
    endDate: string;
    duration: number;
  }[];
  nextUpcomingLeave?: {
    id: number;
    leaveType: string;
    leaveTypeColor: string;
    startDate: string;
    endDate: string;
    duration: number;
  } | null;
}

function StatCard({ icon: Icon, label, value, trend, color }: { icon: any; label: string; value: string | number; trend?: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
}

const adminQuickActions = [
  { label: 'Apply Leave', to: '/apply-leave', icon: CalendarCheck, color: 'bg-[#5B5FEF]/10 text-[#5B5FEF]' },
  { label: 'View Requests', to: '/leave-requests', icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { label: 'Employees', to: '/employees', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { label: 'Reports', to: '/reports', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
];

const employeeQuickActions = [
  { label: 'Apply Leave', to: '/apply-leave', icon: Send, color: 'bg-[#5B5FEF]/10 text-[#5B5FEF]' },
  { label: 'My Requests', to: '/leave-requests', icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { label: 'My Profile', to: '/profile', icon: User, color: 'bg-blue-50 text-blue-600' },
];

export default function Dashboard() {
  const { isAdmin, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('onboarding_dismissed');
  });

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    localStorage.setItem('onboarding_dismissed', 'true');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = isAdmin ? '/dashboard/admin' : '/dashboard/employee';
        const res = await api.get(endpoint);
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAdmin]);

  const [refreshing, setRefreshing] = useState<string | null>(null);

  const handleInlineApprove = useCallback(async (id: number) => {
    setRefreshing(`approve-${id}`);
    try {
      await api.patch(`/leave-requests/${id}/approve`);
      const endpoint = isAdmin ? '/dashboard/admin' : '/dashboard/employee';
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve');
    } finally {
      setRefreshing(null);
    }
  }, [isAdmin]);

  const handleInlineReject = useCallback(async (id: number) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    setRefreshing(`reject-${id}`);
    try {
      await api.patch(`/leave-requests/${id}/reject`, { reason });
      const endpoint = isAdmin ? '/dashboard/admin' : '/dashboard/employee';
      const res = await api.get(endpoint);
      setData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    } finally {
      setRefreshing(null);
    }
  }, [isAdmin]);

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (!data) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data.</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  function daysUntil(dateStr: string) {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ─── ADMIN DASHBOARD ───────────────────────────────────────────
  if (isAdmin) {
    return (
      <div className="space-y-6">
        {/* Onboarding Welcome Banner */}
        {showOnboarding && (
          <div className="relative overflow-hidden bg-gradient-to-br from-[#5B5FEF] via-[#6C70F5] to-[#7C80F2] rounded-2xl shadow-lg">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
              <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white" />
              <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white" />
            </div>
            <div className="relative px-6 py-6 sm:px-8 sm:py-7">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-xl font-bold text-white">
                    Welcome{user?.employee?.firstName ? `, ${user.employee.firstName}` : ''}! 👋
                  </h2>
                  <p className="text-white/80 text-sm max-w-xl leading-relaxed">
                    Welcome to Leave Management System. Here's how to get started:
                  </p>
                  <div className="flex flex-wrap gap-3 pt-1">
                    <a
                      href="/apply-leave"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <span>✈️</span> Apply for Leave
                    </a>
                    <a
                      href="/leave-requests"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <span>📋</span> View My Requests
                    </a>
                    <a
                      href="/employees"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <span>👥</span> Manage Employees
                    </a>
                  </div>
                </div>
                <button
                  onClick={dismissOnboarding}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  title="Dismiss"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-8 pb-4">
              <span className="w-2 h-2 rounded-full bg-white/60" />
              <span className="w-2 h-2 rounded-full bg-white/30" />
              <span className="w-2 h-2 rounded-full bg-white/30" />
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
            <p className="text-gray-500 mt-0.5">HR overview and leave management summary</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {adminQuickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-lg border border-[#E8ECF1] shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 text-sm font-medium text-gray-700 whitespace-nowrap"
              >
                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4" />
                </div>
                {action.label}
                <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
              </Link>
            );
          })}
        </div>

        {/* KPI Cards */}
        <KpiCards data={data.kpis} />

        {/* Inline Approval Widget */}
        {data.pendingForApproval && data.pendingForApproval.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-[#E8ECF1] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Pending Approvals
                <span className="text-xs font-normal text-gray-400">({data.pendingForApproval.length} waiting)</span>
              </h3>
              <Link to="/leave-requests?status=pending" className="text-xs text-[#5B5FEF] hover:underline">
                View All
              </Link>
            </div>
            <div className="divide-y divide-[#E8ECF1]">
              {data.pendingForApproval.map((req) => (
                <div key={req.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-lg bg-[#5B5FEF]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#5B5FEF]">
                        {req.employeeName?.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{req.employeeName}</p>
                      <p className="text-xs text-gray-400">
                        {req.leaveType} · {formatDate(req.startDate)} - {formatDate(req.endDate)} · {req.duration} day{req.duration !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    <button
                      onClick={() => handleInlineApprove(req.id)}
                      disabled={refreshing === `approve-${req.id}`}
                      className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-500 transition-colors disabled:opacity-50"
                      title="Approve"
                    >
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleInlineReject(req.id)}
                      disabled={refreshing === `reject-${req.id}`}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Reject"
                    >
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Leaves Widget */}
        {data.upcomingLeaves && data.upcomingLeaves.length > 0 && (
          <div className="card p-0 overflow-hidden">
            <div className="p-4 border-b border-[#E8ECF1] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#5B5FEF]" />
                Upcoming Leaves
              </h3>
            </div>
            <div className="divide-y divide-[#E8ECF1]">
              {data.upcomingLeaves.map((lr) => (
                <div key={lr.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5B5FEF]/10 flex items-center justify-center">
                      <span className="text-xs font-bold text-[#5B5FEF]">
                        {lr.employeeName?.split(' ').map((n) => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lr.employeeName}</p>
                      <p className="text-xs text-gray-400">
                        {lr.leaveType} · {formatDate(lr.startDate)} ({daysUntil(lr.startDate)} days away)
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{lr.duration} day{lr.duration !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Charts and Calendar */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <CalendarView events={data.calendarEvents} />
          </div>
          <div className="space-y-6">
            <MonthlyTrendsChart data={data.monthlyTrends} />
            <LeaveTypePieChart data={data.leaveTypeDistribution} />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <RecentLeaveRequests requests={data.recentRequests} />
          </div>
          <div>
            <RecentActivities activities={data.recentActivities} />
          </div>
        </div>
      </div>
    );
  }

  // ─── EMPLOYEE DASHBOARD ─────────────────────────────────────────
  const name = user?.employee?.firstName
    ? `${user.employee.firstName}${user.employee.lastName ? ` ${user.employee.lastName}` : ''}`
    : user?.email?.split('@')[0] || 'Employee';

  return (
    <div className="space-y-6">
      {/* Personal Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-400 rounded-2xl shadow-lg">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white" />
          <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full bg-white" />
        </div>
        <div className="relative px-6 py-7 sm:px-8 sm:py-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Welcome back, {name.split(' ')[0]}!</h1>
                  <p className="text-white/70 text-sm">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <p className="text-white/80 text-sm max-w-xl leading-relaxed">
                Here's your leave overview at a glance.
              </p>
            </div>
            <Link
              to="/apply-leave"
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-xl transition-all duration-200"
            >
              <CalendarCheck className="w-4 h-4" />
              Request Leave
            </Link>
          </div>
        </div>
      </div>

      {/* Employee Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.kpis.pendingLeaves}</p>
          <p className="text-sm text-gray-500">Pending Requests</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.kpis.approvedLeaves}</p>
          <p className="text-sm text-gray-500">Approved</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.kpis.rejectedLeaves}</p>
          <p className="text-sm text-gray-500">Rejected</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{data.kpis.onLeave}</p>
          <p className="text-sm text-gray-500">On Leave Today</p>
        </div>
        <div className="stat-card bg-gradient-to-br from-[#5B5FEF]/5 to-[#7C80F2]/10 border-[#5B5FEF]/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-[#5B5FEF]/10 flex items-center justify-center">
              <Umbrella className="w-5 h-5 text-[#5B5FEF]" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#5B5FEF]">{data.kpis.totalBalances ?? 0}</p>
          <p className="text-sm text-gray-500">Days Remaining</p>
        </div>
      </div>

      {/* Leave Balances & Next Upcoming Leave */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Balance Breakdown */}
        <div className="lg:col-span-2">
          {data.balances && data.balances.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Umbrella className="w-4 h-4 text-[#5B5FEF]" />
                  My Leave Balances
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.balances.map((b) => (
                  <div key={b.leaveTypeId} className="relative overflow-hidden rounded-xl border border-[#E8ECF1] p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{b.leaveType}</span>
                      <span className="text-xs text-gray-400">{b.used} used</span>
                    </div>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-2xl font-bold text-gray-900">{b.remaining}</span>
                      <span className="text-sm text-gray-400">/ {b.allocated} days</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((b.used / b.allocated) * 100, 100)}%`,
                          backgroundColor: b.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Next Upcoming Leave */}
        <div>
          {data.nextUpcomingLeave ? (
            <div className="card bg-gradient-to-br from-[#5B5FEF]/5 to-[#7C80F2]/10 border-[#5B5FEF]/20 h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#5B5FEF]/10 flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-[#5B5FEF]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Upcoming Leave</p>
                    <p className="text-sm font-semibold text-gray-900">{data.nextUpcomingLeave.leaveType}</p>
                  </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center py-4">
                  <div className="text-5xl font-bold text-[#5B5FEF] mb-1">
                    {daysUntil(data.nextUpcomingLeave.startDate) > 0
                      ? daysUntil(data.nextUpcomingLeave.startDate)
                      : '0'}
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    {daysUntil(data.nextUpcomingLeave.startDate) > 0
                      ? 'days until leave'
                      : daysUntil(data.nextUpcomingLeave.startDate) === 0
                      ? 'Starting today!'
                      : 'Ongoing'}
                  </p>
                  <div className="text-center">
                    <p className="text-sm text-gray-700 font-medium">
                      {formatDate(data.nextUpcomingLeave.startDate)} — {formatDate(data.nextUpcomingLeave.endDate)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {data.nextUpcomingLeave.duration} day{data.nextUpcomingLeave.duration !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                <Link
                  to="/leave-requests"
                  className="btn-secondary text-sm w-full flex items-center justify-center gap-2 mt-2"
                >
                  View Details <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="card h-full flex flex-col items-center justify-center text-center py-8">
              <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center mb-3">
                <CalendarDays className="w-7 h-7 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-700">No upcoming leave</p>
              <p className="text-xs text-gray-400 mt-1 mb-4">You have no approved leaves scheduled</p>
              <Link to="/apply-leave" className="btn-primary text-sm">
                Apply for Leave
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {employeeQuickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-lg border border-[#E8ECF1] shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}>
                <Icon className="w-4 h-4" />
              </div>
              {action.label}
              <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
            </Link>
          );
        })}
      </div>

      {/* Recent Requests & Calendar */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          {data.recentRequests.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-[#E8ECF1] flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">My Recent Requests</h3>
                <Link
                  to="/leave-requests"
                  className="text-xs text-[#5B5FEF] hover:underline flex items-center gap-1 font-medium"
                >
                  View All <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8ECF1] bg-gray-50/50">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Dates</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Days</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentRequests.map((req: any) => (
                      <tr key={req.id} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: req.leaveTypeColor }} />
                            {req.leaveType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap text-xs">
                          {formatDate(req.startDate)} - {formatDate(req.endDate)}
                        </td>
                        <td className="py-3 px-4 font-semibold text-xs tabular-nums">{req.duration}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                              req.status === 'approved'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : req.status === 'rejected'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <div>
          <CalendarView events={data.calendarEvents} />
        </div>
      </div>
    </div>
  );
}
