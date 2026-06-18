import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '@/lib/axios';
import { SkeletonDetails } from '@/components/Skeleton';
import { FileText, Printer, Download, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatementData {
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
    position: string;
    email: string;
    hireDate: string;
    department?: { name: string };
  };
  year: number;
  leaveRequests: {
    id: number;
    leaveType: string;
    leaveTypeColor: string;
    startDate: string;
    endDate: string;
    duration: number;
    status: string;
    reason?: string;
  }[];
  balances: {
    leaveType: string;
    color: string;
    allocated: number;
    used: number;
    remaining: number;
  }[];
  totalDaysTaken: number;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  cancelled: 'bg-gray-50 text-gray-500 border-gray-200',
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function EmployeeStatement() {
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('employeeId');
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

  const [data, setData] = useState<StatementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!employeeId) {
      setError('No employee selected.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await api.get(`/reports/employee-statement?employeeId=${employeeId}&year=${year}`);
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load employee statement.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId, year]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        <div className="card"><SkeletonDetails /></div>
        <div className="card"><div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-4" /><div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />)}</div></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-500">{error}</p>
        <Link to="/employees" className="btn-primary mt-4 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Employees
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Statement</h1>
          <p className="text-gray-500 mt-0.5">Employee leave record for {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/employees" className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button onClick={handlePrint} className="btn-primary flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </div>

      {/* Employee Info Card */}
      <div className="card">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#5B5FEF]/10 flex items-center justify-center">
            <span className="text-xl font-bold text-[#5B5FEF]">
              {data.employee.firstName[0]}{data.employee.lastName[0]}
            </span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{data.employee.firstName} {data.employee.lastName}</h2>
            <p className="text-sm text-gray-500">{data.employee.position}</p>
            <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
              <span>ID: {data.employee.employeeId}</span>
              <span>Dept: {data.employee.department?.name || 'N/A'}</span>
              <span>Hired: {formatDate(data.employee.hireDate)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-[#5B5FEF]">{data.totalDaysTaken}</p>
            <p className="text-xs text-gray-400">Days Taken ({year})</p>
          </div>
        </div>
      </div>

      {/* Leave Balances */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Leave Balances</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.balances.length === 0 ? (
            <p className="text-gray-400 text-sm col-span-full">No balances found for {year}.</p>
          ) : (
            data.balances.map((bal, i) => (
              <div key={i} className="p-4 rounded-lg border border-[#E8ECF1]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: bal.color }} />
                  <span className="font-medium text-sm text-gray-900">{bal.leaveType}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Allocated: <strong className="text-gray-700">{bal.allocated}</strong></span>
                  <span className="text-gray-400">Used: <strong className="text-gray-700">{bal.used}</strong></span>
                  <span className={cn('font-semibold', bal.remaining <= 0 ? 'text-red-500' : 'text-green-600')}>
                    {bal.remaining} left
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Leave History */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E8ECF1] flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Leave History ({year})</h3>
          <span className="text-xs text-gray-400">{data.leaveRequests.length} record(s)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8ECF1] bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Leave Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Start Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">End Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Days</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Reason</th>
              </tr>
            </thead>
            <tbody>
              {data.leaveRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">No leave records found.</td>
                </tr>
              ) : (
                data.leaveRequests.map((lr) => (
                  <tr key={lr.id} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lr.leaveTypeColor }} />
                        <span className="text-gray-600">{lr.leaveType}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(lr.startDate)}</td>
                    <td className="py-3 px-4 text-gray-600">{formatDate(lr.endDate)}</td>
                    <td className="py-3 px-4 font-semibold tabular-nums">{lr.duration}</td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium border', statusStyles[lr.status])}>
                        {lr.status.charAt(0).toUpperCase() + lr.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-xs max-w-[200px] truncate">{lr.reason || '—'}</td>
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
