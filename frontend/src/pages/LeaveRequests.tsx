import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { Search, Filter, CheckCircle, XCircle, Eye, Printer, FileText, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { SkeletonTable } from '@/components/Skeleton';

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
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Leave Application - ${req.employee?.firstName} ${req.employee?.lastName}</title>
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
          .header h1 { font-size: 22px; color: #5B5FEF; margin-bottom: 4px; }
          .header p { color: #64748b; font-size: 13px; }
          .section { margin-bottom: 24px; }
          .section h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; margin-bottom: 12px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
          .field label { display: block; font-size: 11px; color: #94a3b8; margin-bottom: 2px; }
          .field p { font-size: 14px; color: #1a1a2e; font-weight: 500; }
          .status-badge {
            display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;
          }
          .status-approved { background: #dcfce7; color: #166534; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-rejected { background: #fee2e2; color: #991b1b; }
          .reason-box {
            background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 8px;
          }
          .footer {
            margin-top: 40px; padding-top: 16px; border-top: 1px solid #e2e8f0;
            font-size: 11px; color: #94a3b8; text-align: center;
          }
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Leave Application</h1>
          <p>${req.employee?.firstName} ${req.employee?.lastName} - ${req.employee?.employeeId}</p>
        </div>

        <div class="section">
          <h3>Employee Information</h3>
          <div class="grid">
            <div class="field"><label>Full Name</label><p>${req.employee?.firstName} ${req.employee?.lastName}</p></div>
            <div class="field"><label>Employee ID</label><p>${req.employee?.employeeId}</p></div>
            <div class="field"><label>Department</label><p>${req.employee?.department?.name || 'N/A'}</p></div>
            <div class="field"><label>Position</label><p>${req.employee?.position || 'N/A'}</p></div>
          </div>
        </div>

        <div class="section">
          <h3>Leave Details</h3>
          <div class="grid">
            <div class="field"><label>Leave Type</label><p>${req.leaveType?.name}</p></div>
            <div class="field"><label>Status</label><p><span class="status-badge status-${req.status}">${req.status.charAt(0).toUpperCase() + req.status.slice(1)}</span></p></div>
            <div class="field"><label>Start Date</label><p>${formatDateLong(req.startDate)}</p></div>
            <div class="field"><label>End Date</label><p>${formatDateLong(req.endDate)}</p></div>
            <div class="field"><label>Duration</label><p>${req.duration} business day${req.duration !== 1 ? 's' : ''}</p></div>
            <div class="field"><label>Date Submitted</label><p>${formatDateLong(req.createdAt)}</p></div>
          </div>
        </div>

        <div class="section">
          <h3>Reason</h3>
          <div class="reason-box">${req.reason || 'No reason provided'}</div>
        </div>

        ${req.rejectionReason ? `
        <div class="section">
          <h3>Rejection Reason</h3>
          <div class="reason-box" style="border-color: #fecaca; background: #fef2f2; color: #991b1b;">${req.rejectionReason}</div>
        </div>
        ` : ''}

        <div class="footer">
          <p>This is a computer-generated document. Printed on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin-top: 4px;">Leave Management System</p>
        </div>

        <script>window.print(); window.onafterprint = () => window.close();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
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
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedRequest(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E8ECF1]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Leave Request Details</h2>
              <button onClick={() => setSelectedRequest(null)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Employee</p>
                <p className="font-medium text-gray-900">{selectedRequest.employee?.firstName} {selectedRequest.employee?.lastName}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Leave Type</p>
                <p className="font-medium text-gray-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedRequest.leaveType?.color }} />
                  {selectedRequest.leaveType?.name}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Start Date</p>
                <p className="font-medium text-gray-900">{formatDateLong(selectedRequest.startDate)}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">End Date</p>
                <p className="font-medium text-gray-900">{formatDateLong(selectedRequest.endDate)}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Duration</p>
                <p className="font-medium text-gray-900">{selectedRequest.duration} days</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Status</p>
                <span className={cn('inline-block px-2.5 py-0.5 rounded-full text-xs font-medium border mt-1', statusStyles[selectedRequest.status])}>
                  {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                </span>
              </div>
            </div>
            {selectedRequest.reason && (
              <div className="mt-4 p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Reason</p>
                <p className="text-sm text-gray-700">{selectedRequest.reason}</p>
              </div>
            )}
            {selectedRequest.rejectionReason && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-xs text-red-500 mb-1">Rejection Reason</p>
                <p className="text-sm text-red-700">{selectedRequest.rejectionReason}</p>
              </div>
            )}
            <div className="flex gap-2 mt-5">
              {selectedRequest.status === 'rejected' && (
                <Link
                  to={`/apply-leave?leaveTypeId=${selectedRequest.leaveTypeId}&startDate=${selectedRequest.startDate}&endDate=${selectedRequest.endDate}&reason=${encodeURIComponent(selectedRequest.reason || '')}&durationType=full`}
                  className="btn-primary flex items-center gap-2 flex-1 justify-center"
                >
                  <FileText className="w-4 h-4" />
                  Re-apply
                </Link>
              )}
              <button
                onClick={() => handlePrint(selectedRequest)}
                className={cn(
                  'flex items-center gap-2 flex-1 justify-center',
                  selectedRequest.status === 'rejected' ? 'btn-secondary' : 'btn-primary'
                )}
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button className="btn-secondary flex-1" onClick={() => setSelectedRequest(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
