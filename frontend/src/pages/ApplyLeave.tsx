import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { SkeletonLeaveForm } from '@/components/Skeleton';
import { CalendarDays, Send, Umbrella, HeartPulse, AlertTriangle, Upload, FileText, CheckCircle } from 'lucide-react';

interface LeaveType {
  id: number;
  name: string;
  description: string;
  defaultDays: number;
  color: string;
}

interface LeaveBalance {
  leaveTypeId: number;
  leaveTypeName: string;
  color: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: { status: string; employeeName: string; leaveType: string };
}

interface Holiday {
  id: number;
  name: string;
  date: string;
  isRecurring: boolean;
  type: string;
}

const leaveSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  durationType: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  reason: z.string().min(10, 'Please provide a detailed reason (min 10 characters)'),
});

type LeaveForm = z.infer<typeof leaveSchema>;

function getBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const balanceIcons: Record<string, any> = {
  Vacation: Umbrella,
  Annual: Umbrella,
  Sick: HeartPulse,
  Emergency: AlertTriangle,
  Personal: AlertTriangle,
};

export default function ApplyLeave() {
  const navigate = useNavigate();
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [duration, setDuration] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [selectedLeaveType, setSelectedLeaveType] = useState<string>('');
  const [durationType, setDurationType] = useState<string>('full');

  const form = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
  });

  const watchStartDate = form.watch('startDate');
  const watchEndDate = form.watch('endDate');
  const watchDurationType = form.watch('durationType');

  // Re-apply from rejected - prefill form from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reapplyLeaveType = params.get('leaveTypeId');
    const reapplyStart = params.get('startDate');
    const reapplyEnd = params.get('endDate');
    const reapplyReason = params.get('reason');
    const reapplyDurationType = params.get('durationType');

    if (reapplyLeaveType) {
      setSelectedLeaveType(reapplyLeaveType);
      form.setValue('leaveTypeId', reapplyLeaveType);
    }
    if (reapplyStart) form.setValue('startDate', reapplyStart);
    if (reapplyEnd) form.setValue('endDate', reapplyEnd);
    if (reapplyReason) form.setValue('reason', reapplyReason);
    if (reapplyDurationType) setDurationType(reapplyDurationType);
  }, []);

  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const start = new Date(watchStartDate);
      const end = new Date(watchEndDate);
      if (start <= end) {
        setDuration(getBusinessDays(start, end));
      } else {
        setDuration(0);
      }
    }
  }, [watchStartDate, watchEndDate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, leaveTypesRes, calendarRes, holidaysRes] = await Promise.all([
          api.get('/dashboard/employee'),
          api.get('/leave-types'),
          api.get('/leave-requests/calendar'),
          api.get('/holidays'),
        ]);

        // Map employee dashboard balances
        if (dashboardRes.data.balances) {
          const mappedBalances = dashboardRes.data.balances.map((b: any) => ({
            leaveTypeId: b.leaveTypeId || 0,
            leaveTypeName: b.leaveType || 'Unknown',
            color: b.color || '#5B5FEF',
            totalDays: b.allocated,
            usedDays: b.used,
            remainingDays: b.remaining,
          }));
          setBalances(mappedBalances);
        }

        // Leave types from dedicated endpoint
        setLeaveTypes(leaveTypesRes.data || []);

        // Calendar events
        if (calendarRes.data.events) {
          setCalendarEvents(calendarRes.data.events);
        }

        // Holidays
        if (holidaysRes.data) {
          setHolidays(holidaysRes.data);
        }
      } catch {
        // Fallback data
        setLeaveTypes([
          { id: 1, name: 'Annual', description: 'Paid time off', defaultDays: 15, color: '#5B5FEF' },
          { id: 2, name: 'Sick', description: 'Medical leave', defaultDays: 10, color: '#EF4444' },
          { id: 3, name: 'Personal', description: 'Personal reasons', defaultDays: 5, color: '#F59E0B' },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLeaveTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLeaveType(e.target.value);
    form.setValue('leaveTypeId', e.target.value);
  };

  const onSubmit = async (data: LeaveForm) => {
    setError('');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('leaveTypeId', data.leaveTypeId);
      formData.append('startDate', data.startDate);
      formData.append('endDate', data.endDate);
      formData.append('duration', String(duration));
      formData.append('durationType', durationType);
      formData.append('reason', data.reason);
      if (durationType === 'hourly') {
        formData.append('startTime', data.startTime || '');
        formData.append('endTime', data.endTime || '');
      }
      if (file) {
        formData.append('attachment', file);
      }
      await api.post('/leave-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate('/leave-requests');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Build holiday overlay events for calendar
  const holidayEvents = holidays
    .filter((h) => h.isRecurring || new Date(h.date).getFullYear() === new Date().getFullYear())
    .map((h) => ({
      id: `holiday-${h.id}`,
      title: `🎉 ${h.name}`,
      start: h.date,
      end: h.date,
      backgroundColor: h.type === 'public' ? '#22C55E15' : '#F59E0B15',
      borderColor: h.type === 'public' ? '#22C55E' : '#F59E0B',
      textColor: h.type === 'public' ? '#166534' : '#92400E',
      display: 'background' as const,
      classNames: ['holiday-event'],
      extendedProps: { status: 'holiday', employeeName: '', leaveType: h.name },
    }));

  const allCalendarEvents = [...holidayEvents, ...calendarEvents];

  const selectedBalance = balances.find((b) => String(b.leaveTypeId) === selectedLeaveType);

  if (loading) {
    return <SkeletonLeaveForm />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Apply for Leave</h1>
        <p className="text-gray-500 mt-0.5">Submit a new leave request</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel - Balance Cards & Form */}
        <div className="xl:col-span-1 space-y-6">
          {/* Leave Balance Cards */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#5B5FEF]" />
              Leave Balance
            </h3>
            <div className="space-y-3">
              {balances.length === 0 ? (
                <>
                  {[
                    { name: 'Annual', total: 15, used: 3, color: '#5B5FEF' },
                    { name: 'Sick', total: 10, used: 0, color: '#EF4444' },
                    { name: 'Personal', total: 5, used: 2, color: '#F59E0B' },
                  ].map((item) => {
                    const Icon = balanceIcons[item.name] || Umbrella;
                    const remaining = item.total - item.used;
                    const pct = (item.used / item.total) * 100;
                    return (
                      <div key={item.name} className="balance-card" style={{ borderColor: `${item.color}30` }}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                              <p className="text-[11px] text-gray-400">{remaining} remaining</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-gray-900">{remaining}</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">{item.used} of {item.total} days used</p>
                      </div>
                    );
                  })}
                </>
              ) : (
                balances.map((bal) => {
                  const Icon = balanceIcons[bal.leaveTypeName] || Umbrella;
                  const pct = (bal.usedDays / bal.totalDays) * 100;
                  return (
                    <div key={bal.leaveTypeId} className="balance-card" style={{ borderColor: `${bal.color}30` }}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${bal.color}15`, color: bal.color }}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900">{bal.leaveTypeName}</p>
                            <p className="text-[11px] text-gray-400">{bal.remainingDays} remaining</p>
                          </div>
                        </div>
                        <span className="text-lg font-bold text-gray-900">{bal.remainingDays}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: bal.color }} />
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1.5">{bal.usedDays} of {bal.totalDays} days used</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Application Form */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-[#5B5FEF]/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-[#5B5FEF]" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Leave Request Form</h2>
                <p className="text-xs text-gray-500">Fill in the details below</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="label">Leave Type</label>
                <select className="input-field" {...form.register('leaveTypeId')} onChange={handleLeaveTypeChange}>
                  <option value="">Select leave type...</option>
                  {leaveTypes.map((lt) => (
                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                  ))}
                </select>
                {form.formState.errors.leaveTypeId && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.leaveTypeId.message}</p>
                )}
                {selectedBalance && (
                  <p className="text-xs text-gray-500 mt-1">
                    Remaining: <span className="font-semibold text-gray-700">{selectedBalance.remainingDays} days</span>
                  </p>
                )}
              </div>

              {/* Duration Type */}
              <div>
                <label className="label">Duration Type</label>
                <div className="flex gap-2">
                  {[
                    { value: 'full', label: 'Full Day' },
                    { value: 'half', label: 'Half Day' },
                    { value: 'hourly', label: 'Hourly' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDurationType(opt.value)}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        durationType === opt.value
                          ? 'bg-[#5B5FEF] text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date</label>
                  <input type="date" className="input-field" {...form.register('startDate')} />
                  {form.formState.errors.startDate && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input type="date" className="input-field" {...form.register('endDate')} />
                  {form.formState.errors.endDate && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>

              {durationType === 'hourly' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start Time</label>
                    <input type="time" className="input-field" {...form.register('startTime' as any)} />
                  </div>
                  <div>
                    <label className="label">End Time</label>
                    <input type="time" className="input-field" {...form.register('endTime' as any)} />
                  </div>
                </div>
              )}

              {duration > 0 && (
                <div className="p-3 rounded-lg bg-[#5B5FEF]/5 border border-[#5B5FEF]/15 text-[#5B5FEF] text-sm flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 flex-shrink-0" />
                  Duration: <strong>{duration}</strong> {durationType === 'half' ? 'half-day' : durationType === 'hourly' ? 'hour(s)' : `business day${duration !== 1 ? 's' : ''}`}
                </div>
              )}

              <div>
                <label className="label">Reason for Leave</label>
                <textarea
                  className="input-field min-h-[100px] resize-y"
                  placeholder="Please provide a detailed reason for your leave request..."
                  {...form.register('reason')}
                />
                {form.formState.errors.reason && (
                  <p className="text-red-500 text-xs mt-1">{form.formState.errors.reason.message}</p>
                )}
              </div>

              {/* Upload Proof Section */}
              <div>
                <label className="label">Upload Supporting Document (optional)</label>
                <div className="border-2 border-dashed border-[#E8ECF1] rounded-lg p-4 hover:border-[#5B5FEF]/30 transition-colors">
                  {file ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">{file.name}</p>
                          <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button type="button" onClick={() => setFile(null)} className="text-xs text-red-500 hover:text-red-700">
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      <Upload className="w-6 h-6 text-gray-300" />
                      <p className="text-sm text-gray-500">
                        <span className="text-[#5B5FEF] font-medium">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-400">PDF, PNG, JPG (max 5MB)</p>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) setFile(f);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2 flex-1 justify-center"
                  disabled={submitting}
                >
                  <Send className="w-4 h-4" />
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
                <button type="button" onClick={() => navigate(-1)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Panel - Calendar */}
        <div className="xl:col-span-2">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-[#5B5FEF]" />
              Leave Calendar
            </h3>
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={allCalendarEvents}
              height="auto"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek',
              }}
              buttonText={{
                today: 'Today',
                month: 'Month',
                week: 'Week',
              }}
              eventDisplay="block"
              displayEventTime={false}
              dayMaxEvents={2}
              moreLinkText={(num) => `+${num} more`}
              dayCellClassNames="hover:bg-gray-50 cursor-pointer"
              eventClassNames="rounded-md text-xs font-medium px-1.5 py-0.5 border-0 shadow-sm"
            />
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="card">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Selected Leave</h4>
              {watchStartDate && watchEndDate ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-400">From:</span> {formatDate(watchStartDate)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-400">To:</span> {formatDate(watchEndDate)}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="text-gray-400">Duration:</span> <strong>{duration}</strong> business day{duration !== 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Select dates to preview</p>
              )}
            </div>
            <div className="card">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Leave Policy</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#5B5FEF]" />
                  Min 1 day advance notice
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#5B5FEF]" />
                  Max 15 consecutive days
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[#5B5FEF]" />
                  Approval required
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
