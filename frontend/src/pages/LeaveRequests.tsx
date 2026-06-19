import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { Search, Filter, CheckCircle, XCircle, Eye, Printer, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { SkeletonTable } from '@/components/Skeleton';
import LeavePrintForm from '@/components/LeavePrintForm';
interface LeaveRequest {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  duration: number;
  reason?: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeId: string;
    department?: { name: string };
    position?: string;
    signature?: string;
  };
  leaveType: {
    id: number;
    name: string;
    color: string;
  };
  approver?: {
    id: number;
    firstName: string;
    lastName: string;
    position?: string;
    signature?: string;
  };
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

function formatDateLong(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function LeaveRequests() {
  const { isAdmin, isManager } = useAuth();
  const canApprove = isAdmin || isManager;
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  // Escape key to close detail modal
  useEffect(() => {
    if (!selectedRequest) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedRequest(null);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedRequest]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await api.get(`/leave-requests?${params}`);
      setRequests(res.data.requests);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch leave requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter, searchSubmitted]);

  // Read initial search from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
    setSearchSubmitted((s) => s + 1);
  }, []);

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/leave-requests/${id}/approve`);
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Reason for rejection:');
    if (reason === null) return;
    try {
      await api.patch(`/leave-requests/${id}/reject`, { reason });
      fetchRequests();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject');
    }
  };

  const handlePrint = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Requests</h1>
        <p className="text-gray-500 mt-0.5">Manage and review all leave requests</p>
      </div>

      <div className="card p-0 overflow-hidden">
        {/* Filters */}
        <div className="p-4 border-b border-[#E8ECF1] flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder="Search employee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPage(1);
                  setSearchSubmitted((s) => s + 1);
                }
              }}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            {['', 'pending', 'approved', 'rejected', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1); }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  statusFilter === s
                    ? 'bg-[#5B5FEF] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8ECF1] bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Dates</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Days</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                {(isAdmin || isManager) && <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>}
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Print</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-4 px-4">
                  <SkeletonTable rows={5} cols={6} />
                </td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No leave requests found
                </td></tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#5B5FEF]/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-[#5B5FEF]">
                            {req.employee?.firstName?.[0]}{req.employee?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{req.employee?.firstName} {req.employee?.lastName}</p>
                          <p className="text-xs text-gray-400">{req.employee?.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: req.leaveType?.color }} />
                        <span className="text-gray-600">{req.leaveType?.name}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap text-xs">
                      {formatDate(req.startDate)} - {formatDate(req.endDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold tabular-nums">{req.duration}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border', statusStyles[req.status])}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                    </td>
                    {(isAdmin || isManager) && (
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#5B5FEF] transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {req.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-500 transition-colors"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        {!canApprove && req.status === 'pending' && (
                          <button
                            onClick={async () => {
                              if (!window.confirm('Cancel this leave request?')) return;
                              try {
                                await api.patch(`/leave-requests/${req.id}/cancel`);
                                fetchRequests();
                              } catch (err: any) {
                                alert(err.response?.data?.message || 'Failed to cancel');
                              }
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Cancel Request"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handlePrint(req)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#5B5FEF] transition-colors"
                          title="Print Application"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#E8ECF1] flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm py-1.5 px-3" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className="btn-secondary text-sm py-1.5 px-3" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8 no-print-bg overflow-y-auto" onClick={() => setSelectedRequest(null)}>
          <div className="pointer-events-none absolute inset-0 no-print" /> {/* Print helper: hide background */}
          <div className="bg-white max-w-4xl w-full shadow-2xl relative my-auto print-modal-content print:shadow-none print:w-full print:absolute print:inset-0" onClick={(e) => e.stopPropagation()}>
            {/* Action Buttons (Hidden on Print) */}
            <div className="bg-gray-50 border-b border-[#E8ECF1] p-4 flex items-center justify-between rounded-t-xl no-print sticky top-0 z-20">
              <h2 className="text-lg font-bold text-gray-900">Leave Application Form</h2>
              <div className="flex gap-2">
                {selectedRequest.status === 'rejected' && (
                  <Link
                    to={`/apply-leave?leaveTypeId=${selectedRequest.leaveTypeId}&startDate=${selectedRequest.startDate}&endDate=${selectedRequest.endDate}&reason=${encodeURIComponent(selectedRequest.reason || '')}&durationType=full`}
                    className="btn-primary flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Re-apply
                  </Link>
                )}
                {selectedRequest.status === 'pending' && canApprove && (
                  <>
                    <button onClick={() => handleApprove(selectedRequest.id)} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button onClick={() => handleReject(selectedRequest.id)} className="btn-danger flex items-center gap-2">
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
                <button
                  onClick={() => window.print()}
                  className="btn-primary flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Print / Export
                </button>
                <button className="btn-secondary" onClick={() => setSelectedRequest(null)}>
                  Close
                </button>
              </div>
            </div>

            {/* Printable Form Area */}
            <div className="overflow-x-auto print:overflow-visible">
               <div className="min-w-[800px]">
                 <LeavePrintForm request={selectedRequest} />
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

