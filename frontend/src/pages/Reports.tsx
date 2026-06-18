import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { MonthlyTrendsChart, LeaveTypePieChart } from '@/components/Charts';
import { SkeletonReports } from '@/components/Skeleton';
import { BarChart3, Download, Printer, FileSpreadsheet } from 'lucide-react';

interface Summary {
  totalRequests: number;
  approvedRequests: number;
  pendingRequests: number;
  rejectedRequests: number;
  totalDays: number;
  approvalRate: number;
}

interface MonthlyTrend {
  month: string;
  approved: number;
  rejected: number;
}

interface LeaveTypeDist {
  name: string;
  value: number;
  color: string;
}

interface DeptComparison {
  department: string;
  totalDays: number;
  employeeCount: number;
  avgDaysPerEmployee: string;
}

export default function Reports() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [distribution, setDistribution] = useState<LeaveTypeDist[]>([]);
  const [departments, setDepartments] = useState<DeptComparison[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sumRes, trendRes, distRes, deptRes] = await Promise.all([
          api.get(`/reports/summary?year=${year}`),
          api.get(`/reports/trends?year=${year}`),
          api.get(`/reports/leave-type-distribution?year=${year}`),
          api.get(`/reports/department-comparison?year=${year}`),
        ]);
        setSummary(sumRes.data);
        setTrends(trendRes.data);
        setDistribution(distRes.data);
        setDepartments(deptRes.data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  const handleExportPDF = () => {
    window.open(`/api/reports/export-pdf?year=${year}`, '_blank');
  };

  const handlePrintSummary = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const rows = departments.map((d) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">${d.department}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${d.totalDays}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${d.employeeCount}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${d.avgDaysPerEmployee}</td>
      </tr>
    `).join('');

    const distRows = distribution.map((d) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0;">
          <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${d.color}; margin-right: 8px;"></span>
          ${d.name}
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: center;">${d.value} days</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Annual Leave Report ${year}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            padding: 40px;
            color: #1a1a2e;
            background: white;
          }
          .header {
            text-align: center;
            padding-bottom: 24px;
            border-bottom: 2px solid #5B5FEF;
            margin-bottom: 32px;
          }
          .header h1 { font-size: 24px; color: #5B5FEF; margin-bottom: 4px; }
          .header p { color: #64748b; font-size: 13px; }
          .section { margin-bottom: 32px; }
          .section h2 { font-size: 16px; color: #1a1a2e; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
          .summary-grid {
            display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;
          }
          .summary-card {
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; text-align: center;
          }
          .summary-card .value { font-size: 28px; font-weight: 700; margin-bottom: 4px; }
          .summary-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; }
          th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; border-bottom: 2px solid #e2e8f0; }
          td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
          .footer {
            margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0;
            font-size: 11px; color: #94a3b8; text-align: center;
          }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Annual Leave Report</h1>
          <p>Leave Management System — ${year}</p>
        </div>

        <div class="section">
          <h2>Summary</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <div class="value" style="color: #5B5FEF;">${summary?.totalRequests || 0}</div>
              <div class="label">Total Requests</div>
            </div>
            <div class="summary-card">
              <div class="value" style="color: #22C55E;">${summary?.approvedRequests || 0}</div>
              <div class="label">Approved</div>
            </div>
            <div class="summary-card">
              <div class="value" style="color: #F59E0B;">${summary?.pendingRequests || 0}</div>
              <div class="label">Pending</div>
            </div>
            <div class="summary-card">
              <div class="value" style="color: #EF4444;">${summary?.rejectedRequests || 0}</div>
              <div class="label">Rejected</div>
            </div>
            <div class="summary-card">
              <div class="value" style="color: #3B82F6;">${summary?.totalDays || 0}</div>
              <div class="label">Total Days</div>
            </div>
            <div class="summary-card">
              <div class="value" style="color: #8B5CF6;">${summary?.approvalRate || 0}%</div>
              <div class="label">Approval Rate</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Department Comparison</h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th style="text-align: center;">Total Days</th>
                <th style="text-align: center;">Employees</th>
                <th style="text-align: center;">Avg Days/Employee</th>
              </tr>
            </thead>
            <tbody>
              ${rows || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #94a3b8;">No data available</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="section">
          <h2>Leave Type Distribution</h2>
          <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th style="text-align: center;">Days Taken</th>
              </tr>
            </thead>
            <tbody>
              ${distRows || '<tr><td colspan="2" style="text-align: center; padding: 20px; color: #94a3b8;">No data available</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin-top: 4px;">Leave Management System</p>
        </div>

        <script>window.print(); window.onafterprint = () => window.close();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return <SkeletonReports />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Reports</h1>
          <p className="text-gray-500 mt-0.5">Leave analytics and statistics</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="input-field w-28"
          >
            {[currentYear, currentYear - 1, currentYear - 2, currentYear - 3].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={handlePrintSummary} className="btn-secondary flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={() => window.open(`/api/reports/export-csv?year=${year}`, '_blank')} className="btn-secondary flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" /> Export CSV
          </button>
          <button onClick={handleExportPDF} className="btn-primary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-[#5B5FEF]">{summary.totalRequests}</p>
            <p className="text-xs text-gray-500 mt-1">Total Requests</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-green-600">{summary.approvedRequests}</p>
            <p className="text-xs text-gray-500 mt-1">Approved</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-amber-600">{summary.pendingRequests}</p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-red-600">{summary.rejectedRequests}</p>
            <p className="text-xs text-gray-500 mt-1">Rejected</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-blue-600">{summary.totalDays}</p>
            <p className="text-xs text-gray-500 mt-1">Total Days</p>
          </div>
          <div className="stat-card text-center">
            <p className="text-2xl font-bold text-purple-600">{summary.approvalRate}%</p>
            <p className="text-xs text-gray-500 mt-1">Approval Rate</p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Monthly Trends</h3>
          <MonthlyTrendsChart data={trends} />
        </div>
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Leave Type Distribution</h3>
          <LeaveTypePieChart data={distribution} />
        </div>
      </div>

      {/* Department Comparison */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E8ECF1] flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Department Comparison</h3>
          <button onClick={handlePrintSummary} className="text-xs text-[#5B5FEF] hover:underline flex items-center gap-1">
            <Printer className="w-3 h-3" /> Print
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8ECF1] bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Department</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Total Days</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Employees</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Avg Days/Employee</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No data available</td></tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.department} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-gray-900">{dept.department}</td>
                    <td className="py-3 px-4 text-gray-600 tabular-nums">{dept.totalDays}</td>
                    <td className="py-3 px-4 text-gray-600">{dept.employeeCount}</td>
                    <td className="py-3 px-4 text-gray-600">{dept.avgDaysPerEmployee}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
