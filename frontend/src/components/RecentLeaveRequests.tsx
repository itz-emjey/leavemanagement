import { Link } from 'react-router-dom';
import { ArrowRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaveRequest {
  id: number;
  employeeName: string;
  employeeId: string;
  department?: string;
  leaveType: string;
  leaveTypeColor: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: string;
  createdAt: string;
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

export default function RecentLeaveRequests({ requests }: { requests: LeaveRequest[] }) {
  return (
    <div className="card p-0 overflow-hidden">
      <div className="p-4 border-b border-[#E8ECF1] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Recent Leave Requests</h3>
        <Link
          to="/leave-requests"
          className="text-xs text-[#5B5FEF] hover:underline flex items-center gap-1 font-medium"
        >
          View All <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {!requests.length ? (
        <div className="text-center py-10 text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No leave requests yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8ECF1] bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Dates</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Days</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#5B5FEF]/10 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-[#5B5FEF]">
                          {req.employeeName?.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-xs">{req.employeeName}</p>
                        <p className="text-[10px] text-gray-400">{req.employeeId}</p>
                      </div>
                    </div>
                  </td>
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
                    <span className={cn('inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border', statusStyles[req.status])}>
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
