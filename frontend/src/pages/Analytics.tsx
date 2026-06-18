import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  CalendarDays,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  PieChart,
  Activity,
  CheckCircle2,
  XCircle,
  Briefcase,
  Award,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart as RePieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { SkeletonAnalytics } from '@/components/Skeleton';

// Types
interface YearlySummary {
  year: number;
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalDays: number;
  approvalRate: number;
  avgDuration: number;
}

interface ApprovalRateItem {
  month: string;
  approved: number;
  rejected: number;
  approvalRate: number;
}

interface BusyMonth {
  month: string;
  totalDays: number;
  requestCount: number;
}

interface TopLeaveType {
  name: string;
  color: string;
  totalDays: number;
  percentage: number;
}

interface TopTaker {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string;
  totalDays: number;
  requestCount: number;
  avgDuration: number;
}

interface LeaveUtilization {
  name: string;
  color: string;
  totalAllocated: number;
  totalUsed: number;
  totalRemaining: number;
  utilizationRate: number;
}

interface DeptUtilization {
  department: string;
  totalDays: number;
  employeeCount: number;
  avgDaysPerEmployee: number;
}

// Constants
const CHART_COLORS = ['#5B5FEF', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#EC4899'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatNumber(n: number): string {
  return n.toLocaleString();
}

function StatCard({ icon: Icon, label, value, sublabel, color, trend }: {
  icon: any; label: string; value: string | number; sublabel?: string; color: string; trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="bg-white rounded-xl border border-[#E8ECF1] p-4 shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className={'w-10 h-10 rounded-lg ' + color + ' flex items-center justify-center shadow-sm'}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            trend.positive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          )}>
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sublabel && <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white rounded-lg border border-[#E8ECF1] shadow-lg p-3 text-xs">
        <p className="font-semibold text-gray-900 mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="flex items-center gap-2" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [yearlyData, setYearlyData] = useState<YearlySummary[]>([]);
  const [busyMonths, setBusyMonths] = useState<BusyMonth[]>([]);
  const [topLeaveTypes, setTopLeaveTypes] = useState<TopLeaveType[]>([]);
  const [yearOverYear, setYearOverYear] = useState<Array<{ year: number; data: ApprovalRateItem[] }>>([]);
  const [approvalRateTrend, setApprovalRateTrend] = useState<ApprovalRateItem[]>([]);
  const [topTakers, setTopTakers] = useState<TopTaker[]>([]);
  const [totalActiveEmployees, setTotalActiveEmployees] = useState(0);
  const [employeesWithLeavesCount, setEmployeesWithLeavesCount] = useState(0);
  const [employeesWithoutLeaves, setEmployeesWithoutLeaves] = useState(0);
  const [leaveUtilization, setLeaveUtilization] = useState<LeaveUtilization[]>([]);
  const [deptUtilization, setDeptUtilization] = useState<DeptUtilization[]>([]);

  // Unique collapsible section keys
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    monthlyTrends: true,
    leaveTypeDist: true,
    busyMonths: true,
    topTakers: true,
    utilization: true,
    departments: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, trendsRes, employeesRes, utilizationRes] = await Promise.all([
        api.get('/analytics/overview'),
        api.get('/analytics/trends'),
        api.get('/analytics/employees?year=' + year + '&limit=10'),
        api.get('/analytics/utilization?year=' + year),
      ]);

      setYearlyData(overviewRes.data.yearlyData || []);
      setBusyMonths(overviewRes.data.busyMonths || []);
      setTopLeaveTypes(overviewRes.data.topLeaveTypes || []);
      setYearOverYear(trendsRes.data.yearOverYear || []);
      setApprovalRateTrend(trendsRes.data.approvalRateTrend || []);
      setTopTakers(employeesRes.data.topTakers || []);
      setTotalActiveEmployees(employeesRes.data.totalActiveEmployees || 0);
      setEmployeesWithLeavesCount(employeesRes.data.employeesWithLeavesCount || 0);
      setEmployeesWithoutLeaves(employeesRes.data.employeesWithoutLeaves || 0);
      setLeaveUtilization(utilizationRes.data.leaveUtilization || []);
      setDeptUtilization(utilizationRes.data.departmentUtilization || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived data
  const currentYearData = yearlyData.find(d => d.year === currentYear);
  const prevYearData = yearlyData.find(d => d.year === currentYear - 1);

  const yoyRequests = prevYearData && currentYearData && prevYearData.totalRequests > 0
    ? ((currentYearData.totalRequests - prevYearData.totalRequests) / prevYearData.totalRequests * 100).toFixed(1)
    : null;
  const yoyDays = prevYearData && currentYearData && prevYearData.totalDays > 0
    ? ((currentYearData.totalDays - prevYearData.totalDays) / prevYearData.totalDays * 100).toFixed(1)
    : null;

  const totalAllocated = leaveUtilization.reduce((s, u) => s + u.totalAllocated, 0);
  const totalUsed = leaveUtilization.reduce((s, u) => s + u.totalUsed, 0);
  const overallUtilization = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0;
  const topLeaveType = topLeaveTypes[0];

  if (loading) {
    return <SkeletonAnalytics />;
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-gray-600 font-medium mb-1">Failed to load analytics</p>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <button onClick={fetchData} className="btn-primary flex items-center gap-2 mx-auto">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Comprehensive leave analytics, trends, and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF] bg-white"
          >
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E8ECF1] rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart3}
          label="Total Requests"
          value={formatNumber(currentYearData?.totalRequests || 0)}
          color="bg-[#5B5FEF]"
          trend={yoyRequests ? { value: yoyRequests + '%', positive: Number(yoyRequests) >= 0 } : undefined}
          sublabel={prevYearData ? 'vs ' + prevYearData.totalRequests + ' last year' : undefined}
        />
        <StatCard
          icon={CheckCircle2}
          label="Approved"
          value={formatNumber(currentYearData?.approvedRequests || 0)}
          color="bg-green-500"
          sublabel={(currentYearData?.approvalRate || 0) + '% approval rate'}
        />
        <StatCard
          icon={CalendarDays}
          label="Total Days Taken"
          value={formatNumber(currentYearData?.totalDays || 0)}
          color="bg-purple-500"
          trend={yoyDays ? { value: yoyDays + '%', positive: Number(yoyDays) <= 0 } : undefined}
          sublabel={prevYearData ? 'Avg ' + (currentYearData?.avgDuration || 0) + ' days/request' : undefined}
        />
        <StatCard
          icon={Award}
          label="Top Leave Type"
          value={topLeaveType?.name || 'N/A'}
          color="bg-amber-500"
          sublabel={topLeaveType ? topLeaveType.percentage + '% of all leaves' : undefined}
        />
      </div>

      {/* Multi-Year Overview */}
      {yearlyData.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm">
          <button
            onClick={() => toggleSection('overview')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-[#5B5FEF]" />
              <h2 className="text-base font-semibold text-gray-900">Multi-Year Overview</h2>
            </div>
            {expandedSections.overview ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.overview && (
            <div className="px-5 pb-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {yearlyData.map(yd => (
                  <div key={yd.year} className={
                    cn(
                      'p-4 rounded-lg border',
                      yd.year === currentYear ? 'border-[#5B5FEF]/20 bg-[#5B5FEF]/5' : 'border-[#E8ECF1] bg-gray-50/50'
                    )
                  }>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{yd.year}</p>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Requests</span>
                        <span className="font-semibold text-gray-900">{yd.totalRequests}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Days Taken</span>
                        <span className="font-semibold text-gray-900">{yd.totalDays}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Approval Rate</span>
                        <span className="font-semibold text-green-600">{yd.approvalRate}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Avg Duration</span>
                        <span className="font-semibold text-gray-900">{yd.avgDuration} days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Multi-year bar comparison */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearlyData.map(yd => ({
                    year: String(yd.year),
                    Approved: yd.approvedRequests,
                    Rejected: yd.rejectedRequests,
                    Pending: yd.pendingRequests,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="Approved" fill="#22C55E" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Pending" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    <Bar dataKey="Rejected" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Monthly Trends */}
      {approvalRateTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm">
          <button
            onClick={() => toggleSection('monthlyTrends')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-[#5B5FEF]" />
              <h2 className="text-base font-semibold text-gray-900">Monthly Trends</h2>
            </div>
            {expandedSections.monthlyTrends ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.monthlyTrends && (
            <div className="px-5 pb-5 space-y-6">
              {/* Current year monthly requests */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">{currentYear} Monthly Requests</p>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={approvalRateTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="approveGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22C55E" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="rejectGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="approved" stroke="#22C55E" fill="url(#approveGrad)" strokeWidth={2} name="Approved" dot={false} activeDot={{ r: 4, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }} />
                      <Area type="monotone" dataKey="rejected" stroke="#EF4444" fill="url(#rejectGrad)" strokeWidth={2} name="Rejected" dot={false} activeDot={{ r: 4, fill: '#EF4444', stroke: '#fff', strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Approval Rate Line */}
              <div>
                <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Approval Rate Trend</p>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={approvalRateTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v) => v + '%'} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="approvalRate" stroke="#5B5FEF" strokeWidth={2} dot={{ fill: '#5B5FEF', stroke: '#fff', strokeWidth: 2, r: 3 }} name="Approval Rate" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Year-over-year comparison */}
              {yearOverYear.length === 2 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">Year-over-Year Comparison</p>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={(() => {
                        return MONTH_NAMES.map((month, i) => ({
                          month,
                          approvedPrev: yearOverYear[0].data[i]?.approved || 0,
                          approvedCurr: yearOverYear[1].data[i]?.approved || 0,
                        }));
                      })()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="approvedPrev" fill="#94A3B8" name={String(yearOverYear[0].year)} radius={[4, 4, 0, 0]} maxBarSize={20} />
                        <Bar dataKey="approvedCurr" fill="#5B5FEF" name={String(yearOverYear[1].year)} radius={[4, 4, 0, 0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Leave Type Analysis & Busy Months */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Type Distribution */}
        {topLeaveTypes.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm">
            <button
              onClick={() => toggleSection('leaveTypeDist')}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <PieChart className="w-5 h-5 text-[#5B5FEF]" />
                <h2 className="text-base font-semibold text-gray-900">Leave Type Distribution</h2>
              </div>
              {expandedSections.leaveTypeDist ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.leaveTypeDist && (
              <div className="px-5 pb-5">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="h-64 w-64 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={topLeaveTypes}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="totalDays"
                          nameKey="name"
                        >
                          {topLeaveTypes.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 w-full space-y-2">
                    {topLeaveTypes.map((lt, i) => (
                      <div key={lt.name} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700 truncate">{lt.name}</span>
                            <span className="text-gray-500 tabular-nums">{lt.totalDays} days</span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: lt.percentage + '%', backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-medium text-gray-400 w-10 text-right">{lt.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Busy Months */}
        {busyMonths.length > 0 && (
          <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm">
            <button
              onClick={() => toggleSection('busyMonths')}
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-[#5B5FEF]" />
                <h2 className="text-base font-semibold text-gray-900">Busiest Months</h2>
              </div>
              {expandedSections.busyMonths ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {expandedSections.busyMonths && (
              <div className="px-5 pb-5">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={busyMonths} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="totalDays" radius={[4, 4, 0, 0]} name="Days Taken" maxBarSize={40}>
                        {busyMonths.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Top Leave Takers */}
      {topTakers.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm">
          <button
            onClick={() => toggleSection('topTakers')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-[#5B5FEF]" />
              <h2 className="text-base font-semibold text-gray-900">Top Leave Takers</h2>
              <span className="text-xs text-gray-400 font-normal">({totalActiveEmployees} active employees)</span>
            </div>
            {expandedSections.topTakers ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.topTakers && (
            <div className="px-5 pb-5">
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100">
                  <p className="text-lg font-bold text-blue-600">{totalActiveEmployees}</p>
                  <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wider mt-0.5">Active Employees</p>
                </div>
                <div className="p-3 rounded-lg bg-green-50 border border-green-100">
                  <p className="text-lg font-bold text-green-600">{employeesWithLeavesCount}</p>
                  <p className="text-[10px] text-green-500 font-medium uppercase tracking-wider mt-0.5">Took Leave</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-lg font-bold text-amber-600">{employeesWithoutLeaves}</p>
                  <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wider mt-0.5">No Leave Taken</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                  <p className="text-lg font-bold text-purple-600">
                    {employeesWithLeavesCount > 0 ? Math.round(employeesWithLeavesCount / totalActiveEmployees * 100) : 0}%
                  </p>
                  <p className="text-[10px] text-purple-500 font-medium uppercase tracking-wider mt-0.5">Leave Penetration</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8ECF1]">
                      <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Employee</th>
                      <th className="text-left py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Department</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Days Taken</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Requests</th>
                      <th className="text-right py-3 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topTakers.map((emp, i) => (
                      <tr key={emp.id} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white',
                              i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-[#5B5FEF]/60'
                            )}>
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 text-xs">{emp.firstName} {emp.lastName}</p>
                              <p className="text-[10px] text-gray-400">{emp.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-500 text-xs">{emp.department}</td>
                        <td className="py-3 px-3 text-right font-semibold text-gray-900 tabular-nums">{emp.totalDays}</td>
                        <td className="py-3 px-3 text-right text-gray-600 tabular-nums">{emp.requestCount}</td>
                        <td className="py-3 px-3 text-right text-gray-600 tabular-nums">{emp.avgDuration}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leave Utilization */}
      {leaveUtilization.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm">
          <button
            onClick={() => toggleSection('utilization')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-[#5B5FEF]" />
              <h2 className="text-base font-semibold text-gray-900">Leave Utilization</h2>
              <span className="text-xs text-gray-400 font-normal">({overallUtilization}% overall)</span>
            </div>
            {expandedSections.utilization ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.utilization && (
            <div className="px-5 pb-5">
              <div className="space-y-4">
                {leaveUtilization.map(lu => (
                  <div key={lu.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lu.color }} />
                        <span className="font-medium text-gray-700">{lu.name}</span>
                      </div>
                      <span className="text-gray-500 tabular-nums">
                        {lu.totalUsed} / {lu.totalAllocated} days
                        <span className={cn(
                          'ml-2 text-xs font-medium px-1.5 py-0.5 rounded',
                          lu.utilizationRate > 80 ? 'bg-red-50 text-red-600' :
                          lu.utilizationRate > 50 ? 'bg-amber-50 text-amber-600' :
                          'bg-green-50 text-green-600'
                        )}>
                          {lu.utilizationRate}%
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: Math.min(100, lu.utilizationRate) + '%', backgroundColor: lu.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Department Comparison */}
      {deptUtilization.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm">
          <button
            onClick={() => toggleSection('departments')}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors rounded-xl"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-[#5B5FEF]" />
              <h2 className="text-base font-semibold text-gray-900">Department Comparison</h2>
            </div>
            {expandedSections.departments ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {expandedSections.departments && (
            <div className="px-5 pb-5">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={deptUtilization} margin={{ top: 10, right: 10, left: -10, bottom: 20 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalDays" radius={[0, 4, 4, 0]} name="Total Days" maxBarSize={24}>
                      {deptUtilization.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#E8ECF1]">
                      <th className="text-left py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Department</th>
                      <th className="text-right py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Total Days</th>
                      <th className="text-right py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Employees</th>
                      <th className="text-right py-2.5 px-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Avg Days/Employee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deptUtilization.map(d => (
                      <tr key={d.department} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-gray-900 text-xs">{d.department}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-gray-900 tabular-nums">{d.totalDays}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">{d.employeeCount}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600 tabular-nums">{d.avgDaysPerEmployee}d</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
