import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { SkeletonTable } from '@/components/Skeleton';
import { Search, Shield, Download, Calendar } from 'lucide-react';

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId: number;
  details: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
  user: { id: number; email: string } | null;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (actionFilter) params.set('action', actionFilter);
      if (entityFilter) params.set('entity', entityFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await api.get(`/audit-logs?${params}`);
      setLogs(res.data.logs);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/audit-logs/actions').then((res) => setActions(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter, startDate, endDate]);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500">Track all system activities</p>
      </div>

      <div className="card p-0">
        <div className="p-4 border-b border-[#E8ECF1] flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder="Search by user email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (setPage(1), fetchLogs())}
            />
          </div>
          <select className="input-field w-36" value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}>
            <option value="">All Actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <select className="input-field w-36" value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}>
            <option value="">All Entities</option>
            {['User', 'Employee', 'LeaveRequest', 'LeaveBalance', 'Holiday', 'LeaveType', 'Department'].map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              className="input-field w-36 text-xs"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              placeholder="Start date"
            />
            <span className="text-gray-300">—</span>
            <input
              type="date"
              className="input-field w-36 text-xs"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              placeholder="End date"
            />
          </div>
          <button
            onClick={() => window.open(`/api/audit-logs/export?${new URLSearchParams({
              ...(search && { search }),
              ...(actionFilter && { action: actionFilter }),
              ...(entityFilter && { entity: entityFilter }),
              ...(startDate && { startDate }),
              ...(endDate && { endDate }),
            }).toString()}`, '_blank')}
            className="btn-secondary flex items-center gap-2 text-sm py-1.5"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500">Timestamp</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Entity</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="py-4 px-4">
                  <SkeletonTable rows={8} cols={5} />
                </td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-7 h-7 text-gray-300" />
                  </div>
                  <p className="font-medium text-gray-600 mb-1">No audit logs found</p>
                  <p className="text-sm text-gray-400">{actionFilter || entityFilter || startDate ? 'Try adjusting your filters' : 'System activity will appear here as actions are performed'}</p>
                </td></tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="py-3 px-4 text-gray-900">{log.user?.email || 'System'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {log.entity}{log.entityId ? ` #${log.entityId}` : ''}
                    </td>
                    <td className="py-3 px-4 text-gray-500 max-w-xs truncate">{log.details || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm py-1 px-3" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
            <button className="btn-secondary text-sm py-1 px-3" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
