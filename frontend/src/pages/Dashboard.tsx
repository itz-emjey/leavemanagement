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
import { Users, CalendarCheck, ArrowRight, TrendingUp, Clock, CheckCircle, XCircle, Briefcase, CalendarDays, AlertTriangle, ThumbsUp, ThumbsDown } from 'lucide-react';

interface DashboardData {
  kpis: {
    totalEmployees: number;
    activeEmployees: number;
    pendingLeaves: number;
    approvedLeaves: number;
    rejectedLeaves: number;
    onLeave: number;
  };
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

const quickActions = [
  { label: 'Apply Leave', to: '/apply-leave', icon: CalendarCheck, color: 'bg-[#5B5FEF]/10 text-[#5B5FEF]' },
  { label: 'View Requests', to: '/leave-requests', icon: Clock, color: 'bg-amber-50 text-amber-600' },
  { label: 'Employees', to: '/employees', icon: Users, color: 'bg-blue-50 text-blue-600' },
  { label: 'Reports', to: '/reports', icon: TrendingUp, color: 'bg-green-50 text-green-600' },
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
      // Re-fetch dashboard data
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
                  {isAdmin && (
                    <a
                      href="/employees"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      <span>👥</span> Manage Employees
                    </a>
                  )}
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
          {/* Progress dots */}
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
          <p className="text-gray-500 mt-0.5">
            {isAdmin ? 'HR overview and leave management summary' : 'Your leave overview'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {quickActions.map((action) => {
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

      {/* Upcoming Leave Countdown (employee) */}
      {!isAdmin && data.nextUpcomingLeave && (
        <div className="card bg-gradient-to-r from-[#5B5FEF]/5 to-[#7C80F2]/10 border-[#5B5FEF]/20">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#5B5FEF]/10 flex items-center justify-center">
                <CalendarDays className="w-7 h-7 text-[#5B5FEF]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Next Upcoming Leave</p>
                <p className="text-lg font-bold text-gray-900">
                  {data.nextUpcomingLeave.leaveType} — {formatDate(data.nextUpcomingLeave.startDate)}
                </p>
                <p className="text-sm text-gray-500">
                  {daysUntil(data.nextUpcomingLeave.startDate) > 0
                    ? `Starting in ${daysUntil(data.nextUpcomingLeave.startDate)} days`
                    : daysUntil(data.nextUpcomingLeave.startDate) === 0
                    ? 'Starting today!'
                    : 'Ongoing'
                  }
                  {' · '}{data.nextUpcomingLeave.duration} day{data.nextUpcomingLeave.duration !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Link
              to="/leave-requests"
              className="btn-secondary text-sm flex items-center gap-2"
            >
              View Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Inline Approval Widget (admin) */}
      {isAdmin && data.pendingForApproval && data.pendingForApproval.length > 0 && (
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

      {/* Upcoming Leaves Widget (admin) */}
      {isAdmin && data.upcomingLeaves && data.upcomingLeaves.length > 0 && (
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
        {isAdmin && (
          <div className="space-y-6">
            <MonthlyTrendsChart data={data.monthlyTrends} />
            <LeaveTypePieChart data={data.leaveTypeDistribution} />
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <RecentLeaveRequests requests={data.recentRequests} />
        </div>
        {isAdmin && (
          <div>
            <RecentActivities activities={data.recentActivities} />
          </div>
        )}
      </div>
    </div>
  );
}
