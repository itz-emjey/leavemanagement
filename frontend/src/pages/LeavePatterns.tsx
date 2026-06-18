import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Trash2,
  Edit3,
  Play,
  Clock,
  Calendar,
  AlertCircle,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { SkeletonList } from '@/components/Skeleton';

interface LeavePattern {
  id: number;
  employeeId: number;
  leaveTypeId: number;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek: number;
  weekOfMonth?: number;
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  reason?: string;
  createdAt: string;
  updatedAt: string;
  employee?: { id: number; firstName: string; lastName: string; employeeId: string };
  leaveType?: { id: number; name: string; color: string };
  upcomingDates?: string[];
  frequencyLabel?: string;
  dayLabel?: string;
}

interface LeaveType {
  id: number;
  name: string;
  color: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const FREQUENCIES = [
  { value: 'weekly', label: 'Every Week' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly (nth Weekday)' },
];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
  { value: 'paused', label: 'Paused', icon: Clock, color: 'text-amber-600 bg-amber-50' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'text-red-600 bg-red-50' },
];

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  active: { icon: CheckCircle2, color: 'text-green-600 bg-green-50', label: 'Active' },
  paused: { icon: Clock, color: 'text-amber-600 bg-amber-50', label: 'Paused' },
  cancelled: { icon: XCircle, color: 'text-red-600 bg-red-50', label: 'Cancelled' },
};

export default function LeavePatterns() {
  const { isAdmin } = useAuth();
  const [patterns, setPatterns] = useState<LeavePattern[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPattern, setEditingPattern] = useState<LeavePattern | null>(null);
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [generateLoading, setGenerateLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [form, setForm] = useState({
    leaveTypeId: '',
    frequency: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    dayOfWeek: '1',
    weekOfMonth: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchPatterns = useCallback(async () => {
    try {
      const res = await api.get('/leave-patterns');
      setPatterns(res.data.patterns || []);
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to load patterns.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaveTypes = useCallback(async () => {
    try {
      const res = await api.get('/leave-types');
      setLeaveTypes(res.data || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPatterns();
    fetchLeaveTypes();
  }, [fetchPatterns, fetchLeaveTypes]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const resetForm = () => {
    setForm({
      leaveTypeId: '',
      frequency: 'weekly',
      dayOfWeek: '1',
      weekOfMonth: '',
      startDate: '',
      endDate: '',
      reason: '',
    });
    setPreviewDates([]);
    setEditingPattern(null);
  };

  const openEditForm = (pattern: LeavePattern) => {
    setForm({
      leaveTypeId: String(pattern.leaveTypeId),
      frequency: pattern.frequency,
      dayOfWeek: String(pattern.dayOfWeek),
      weekOfMonth: pattern.weekOfMonth ? String(pattern.weekOfMonth) : '',
      startDate: pattern.startDate,
      endDate: pattern.endDate || '',
      reason: pattern.reason || '',
    });
    setEditingPattern(pattern);
    setShowForm(true);
  };

  const handlePreview = async () => {
    if (!form.frequency || !form.startDate) return;
    setPreviewLoading(true);
    try {
      const params: any = {
        frequency: form.frequency,
        dayOfWeek: form.dayOfWeek,
        startDate: form.startDate,
      };
      if (form.weekOfMonth) params.weekOfMonth = form.weekOfMonth;
      if (form.endDate) params.endDate = form.endDate;

      const res = await api.get('/leave-patterns/preview', { params });
      setPreviewDates(res.data.dates || []);
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to preview dates.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        leaveTypeId: parseInt(form.leaveTypeId),
        frequency: form.frequency,
        dayOfWeek: parseInt(form.dayOfWeek),
        startDate: form.startDate,
      };
      if (form.weekOfMonth) payload.weekOfMonth = parseInt(form.weekOfMonth);
      if (form.endDate) payload.endDate = form.endDate;
      if (form.reason) payload.reason = form.reason;

      if (editingPattern) {
        await api.patch(`/leave-patterns/${editingPattern.id}`, payload);
        showMessage('success', 'Pattern updated successfully.');
      } else {
        await api.post('/leave-patterns', payload);
        showMessage('success', 'Pattern created successfully.');
      }

      setShowForm(false);
      resetForm();
      fetchPatterns();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to save pattern.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this leave pattern? This action cannot be undone.')) return;
    try {
      await api.delete(`/leave-patterns/${id}`);
      showMessage('success', 'Pattern deleted.');
      fetchPatterns();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to delete pattern.');
    }
  };

  const handleGenerate = async (id: number) => {
    const months = prompt('Generate leave requests for how many months?', '3');
    if (!months) return;
    setGenerateLoading(id);
    try {
      const res = await api.post(`/leave-patterns/${id}/generate`, {
        months: parseInt(months),
        overrideExisting: false,
      });
      showMessage('success', res.data.message || `Generated ${res.data.created} requests.`);
      fetchPatterns();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to generate requests.');
    } finally {
      setGenerateLoading(null);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.patch(`/leave-patterns/${id}`, { status });
      showMessage('success', `Pattern ${status}.`);
      fetchPatterns();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to update status.');
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const config = statusConfig[status] || statusConfig.active;
    const Icon = config.icon;
    return (
      <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', config.color)}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return <div className="p-6"><SkeletonList count={3} /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recurring Leave Patterns</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schedule recurring leaves (weekly, bi-weekly, monthly) and generate leave requests automatically.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
            showForm
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-[#5B5FEF] text-white hover:bg-[#4B4FDF] shadow-sm hover:shadow-md'
          )}
        >
          {showForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? 'Cancel' : 'New Pattern'}
        </button>
      </div>

      {/* Toast Message */}
      {message && (
        <div
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2',
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          )}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </div>
      )}

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#E8ECF1] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">
            {editingPattern ? 'Edit Leave Pattern' : 'Create New Leave Pattern'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Leave Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Leave Type *</label>
                <select
                  value={form.leaveTypeId}
                  onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF] bg-white"
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                </select>
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Frequency *</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value as any })}
                  required
                  className="w-full px-3 py-2.5 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF] bg-white"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>

              {/* Day of Week */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Day of Week *</label>
                <select
                  value={form.dayOfWeek}
                  onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF] bg-white"
                >
                  {DAYS.map((day, i) => (
                    <option key={i} value={i}>{day}</option>
                  ))}
                </select>
              </div>

              {/* Week of Month (monthly only) */}
              {form.frequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Week of Month *</label>
                  <select
                    value={form.weekOfMonth}
                    onChange={(e) => setForm({ ...form, weekOfMonth: e.target.value })}
                    required
                    className="w-full px-3 py-2.5 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF] bg-white"
                  >
                    <option value="">Select week</option>
                    <option value={1}>1st {DAYS[parseInt(form.dayOfWeek)]}</option>
                    <option value={2}>2nd {DAYS[parseInt(form.dayOfWeek)]}</option>
                    <option value={3}>3rd {DAYS[parseInt(form.dayOfWeek)]}</option>
                    <option value={4}>4th {DAYS[parseInt(form.dayOfWeek)]}</option>
                  </select>
                </div>
              )}

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date *</label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                  className="w-full px-3 py-2.5 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF]"
                />
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF]"
                />
                <p className="text-[10px] text-gray-400 mt-1">Leave blank for indefinite</p>
              </div>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason (optional)</label>
              <textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                rows={2}
                placeholder="e.g., Weekly team meeting, Bi-weekly clinic appointment..."
                className="w-full px-3 py-2.5 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF] resize-none"
              />
            </div>

            {/* Preview Button & Dates */}
            <div className="flex items-start gap-4">
              <button
                type="button"
                onClick={handlePreview}
                disabled={previewLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                Preview Dates
              </button>

              {previewDates.length > 0 && (
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-1.5">Upcoming dates ({previewDates.length}):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewDates.map((d, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-[#5B5FEF]/5 text-[#5B5FEF] text-xs font-medium rounded-md border border-[#5B5FEF]/10"
                      >
                        {formatDate(d)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#5B5FEF] text-white rounded-lg text-sm font-medium hover:bg-[#4B4FDF] transition-all shadow-sm"
              >
                {editingPattern ? 'Update Pattern' : 'Create Pattern'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-5 py-2.5 border border-[#E8ECF1] text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Patterns List */}
      {patterns.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E8ECF1] p-12 text-center shadow-sm">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Recurring Patterns</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Create recurring leave patterns to automatically generate leave requests on a weekly, bi-weekly, or monthly schedule.
          </p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#5B5FEF] text-white rounded-lg text-sm font-medium hover:bg-[#4B4FDF] transition-all"
          >
            <Plus className="w-4 h-4" />
            Create Your First Pattern
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {patterns.map((pattern) => {
            const StatusIcon = statusConfig[pattern.status]?.icon || CheckCircle2;
            const statusColor = statusConfig[pattern.status]?.color || 'text-green-600 bg-green-50';
            const colorStyle = pattern.leaveType?.color || '#5B5FEF';

            return (
              <div
                key={pattern.id}
                className="bg-white rounded-xl border border-[#E8ECF1] p-5 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: colorStyle }}
                      />
                      <h3 className="font-semibold text-gray-900">
                        {pattern.leaveType?.name || 'Unknown Type'}
                        <span className="text-gray-400 font-normal mx-2">·</span>
                        <span className="text-gray-600 font-normal">{pattern.frequencyLabel}</span>
                      </h3>
                      <StatusBadge status={pattern.status} />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {pattern.dayLabel}
                        {pattern.frequency === 'monthly' && pattern.weekOfMonth && (
                          <> — {pattern.weekOfMonth}{pattern.weekOfMonth === 1 ? 'st' : pattern.weekOfMonth === 2 ? 'nd' : pattern.weekOfMonth === 3 ? 'rd' : 'th'} week</>
                        )}
                      </span>
                      <span>From {formatDate(pattern.startDate)}</span>
                      {pattern.endDate && <span>To {formatDate(pattern.endDate)}</span>}
                      {pattern.employee && isAdmin && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-[#5B5FEF]/10 text-[#5B5FEF] text-[10px] font-bold flex items-center justify-center">
                            {pattern.employee.firstName[0]}
                          </span>
                          {pattern.employee.firstName} {pattern.employee.lastName}
                        </span>
                      )}
                    </div>

                    {pattern.reason && (
                      <p className="text-sm text-gray-600 mt-2 flex items-start gap-1.5">
                        <span className="text-gray-400 mt-0.5">“</span>
                        {pattern.reason}
                        <span className="text-gray-400 mt-0.5">”</span>
                      </p>
                    )}

                    {/* Upcoming Dates Preview */}
                    {pattern.upcomingDates && pattern.upcomingDates.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-400 mb-1.5">Upcoming occurrences:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {pattern.upcomingDates.map((d, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-[#5B5FEF]/5 text-[#5B5FEF] text-xs rounded-md border border-[#5B5FEF]/10"
                            >
                              {formatDate(d)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                    {pattern.status === 'active' && (
                      <button
                        onClick={() => handleGenerate(pattern.id)}
                        disabled={generateLoading === pattern.id}
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-all disabled:opacity-50"
                        title="Generate leave requests"
                      >
                        {generateLoading === pattern.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {pattern.status === 'active' && (
                      <button
                        onClick={() => handleStatusChange(pattern.id, 'paused')}
                        className="p-2 rounded-lg text-amber-600 hover:bg-amber-50 transition-all"
                        title="Pause pattern"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                    )}
                    {pattern.status === 'paused' && (
                      <button
                        onClick={() => handleStatusChange(pattern.id, 'active')}
                        className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition-all"
                        title="Resume pattern"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditForm(pattern)}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-all"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pattern.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Card */}
      <div className="bg-gradient-to-br from-[#5B5FEF]/5 to-transparent rounded-xl border border-[#E8ECF1] p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#5B5FEF]/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-4 h-4 text-[#5B5FEF]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">How Recurring Patterns Work</h3>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Patterns define a schedule (e.g., every Monday, 2nd Wednesday of the month).</li>
              <li>• Use <strong>Preview Dates</strong> to see upcoming occurrences before saving.</li>
              <li>• Click <strong>Play</strong> on an active pattern to generate leave requests for the next N months.</li>
              <li>• Patterns can be paused/resumed without losing the configuration.</li>
              <li>• Leave requests are generated as <strong>pending</strong> and go through the normal approval flow.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
