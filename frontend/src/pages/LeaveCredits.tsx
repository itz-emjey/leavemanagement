import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { SkeletonTable } from '@/components/Skeleton';
import { CreditCard, Plus, Edit2, Save, X, Umbrella, HeartPulse, AlertTriangle, RefreshCw, Users, CheckCircle } from 'lucide-react';

interface LeaveType {
  id: number;
  name: string;
  description: string;
  defaultDays: number;
  color: string;
}

interface EmployeeCredit {
  id: number;
  employeeId: number;
  employeeName: string;
  department: string;
  leaveType: string;
  leaveTypeId: number;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
  year: number;
  employee?: any;
}

const leaveIcons: Record<string, any> = {
  Vacation: Umbrella,
  Annual: Umbrella,
  Sick: HeartPulse,
  Emergency: AlertTriangle,
  Personal: AlertTriangle,
};

export default function LeaveCredits() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [credits, setCredits] = useState<EmployeeCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState(0);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [allocationForm, setAllocationForm] = useState({ employeeId: '', leaveTypeId: '', allocated: 10, year: new Date().getFullYear() });
  const [allocationError, setAllocationError] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [showCarryOverConfirm, setShowCarryOverConfirm] = useState(false);
  const [carryOverLoading, setCarryOverLoading] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ leaveTypeId: '', allocated: 10, year: new Date().getFullYear() });
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccess, setBulkSuccess] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const employeeRef = useRef<HTMLSelectElement>(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (showAllocationModal) {
      setTimeout(() => employeeRef.current?.focus(), 50);
    }
  }, [showAllocationModal]);

  // Escape key to close modals
  useEffect(() => {
    if (!showAllocationModal && !showBulkModal && !showCarryOverConfirm) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAllocationModal) setShowAllocationModal(false);
        if (showBulkModal) { setShowBulkModal(false); setBulkError(''); setBulkSuccess(''); }
        if (showCarryOverConfirm) setShowCarryOverConfirm(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showAllocationModal, showBulkModal, showCarryOverConfirm]);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [typesRes, creditsRes, employeesRes] = await Promise.all([
          api.get('/leave-types'),
          api.get(`/leave-credits?year=${currentYear}`),
          api.get('/employees?limit=100'),
        ]);
        setLeaveTypes(typesRes.data);
        setEmployees(employeesRes.data.employees || []);
        // Backend returns { credits: [...] }
        const creditsData = creditsRes.data.credits || [];
        const mapped = creditsData.map((c: any) => ({
          id: c.id,
          employeeId: c.employeeId,
          employeeName: c.employee ? `${c.employee.firstName} ${c.employee.lastName}` : 'Unknown',
          department: c.employee?.department?.name || '',
          leaveType: c.leaveType?.name || 'Unknown',
          leaveTypeId: c.leaveTypeId,
          totalDays: Number(c.allocated),
          usedDays: Number(c.used),
          remainingDays: Number(c.remaining),
          year: c.year,
        }));
        setCredits(mapped);
      } catch {
        setLeaveTypes([]);
        setCredits([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSaveCredit = async (id: number) => {
    try {
      const credit = credits.find((c) => c.id === id);
      if (!credit) return;
      await api.post('/leave-credits/adjust', {
        employeeId: credit.employeeId,
        leaveTypeId: credit.leaveTypeId,
        year: credit.year,
        allocated: editValue,
      });
      setCredits((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, totalDays: editValue, remainingDays: editValue - c.usedDays } : c
        )
      );
      setEditingId(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card"><div className="animate-pulse space-y-3"><div className="h-10 w-10 rounded-lg bg-gray-200" /><div className="h-4 w-24 bg-gray-200 rounded" /><div className="h-3 w-16 bg-gray-200 rounded" /></div></div>
          ))}
        </div>
        <div className="card p-0 overflow-hidden"><div className="p-6"><SkeletonTable rows={5} cols={7} /></div></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Credits</h1>
          <p className="text-gray-500 mt-0.5">Manage employee leave allocations for {currentYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn-secondary flex items-center gap-2"
            title="Bulk adjust credits for multiple employees"
          >
            <Users className="w-4 h-4" />
            Bulk Adjust
          </button>
          <button
            onClick={() => setShowCarryOverConfirm(true)}
            className="btn-secondary flex items-center gap-2"
            title="Carry over remaining credits to next year"
          >
            <RefreshCw className="w-4 h-4" />
            Carry Over
          </button>
          <button onClick={() => setShowAllocationModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Allocation
          </button>
        </div>
      </div>

      {/* Leave Type Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {leaveTypes.length === 0 ? (
          <>
            {[
              { name: 'Annual Leave', total: 15, used: 45, color: '#5B5FEF' },
              { name: 'Sick Leave', total: 10, used: 12, color: '#EF4444' },
              { name: 'Personal Leave', total: 5, used: 8, color: '#F59E0B' },
            ].map((item) => {
              const Icon = leaveIcons[item.name.split(' ')[0]] || Umbrella;
              return (
                <div key={item.name} className="stat-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15`, color: item.color }}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">Default: {item.total} days</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total allocated</span>
                    <span className="font-bold text-gray-900">{item.used} days</span>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          leaveTypes.map((lt) => {
            const Icon = leaveIcons[lt.name] || Umbrella;
            const totalAllocated = credits
              .filter((c) => c.leaveType === lt.name)
              .reduce((sum, c) => sum + c.totalDays, 0);
            return (
              <div key={lt.id} className="stat-card">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${lt.color}15`, color: lt.color }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{lt.name}</p>
                    <p className="text-xs text-gray-400">Default: {lt.defaultDays} days</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Total allocated</span>
                  <span className="font-bold text-gray-900">{totalAllocated} days</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Credits Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E8ECF1]">
          <h3 className="font-semibold text-gray-900">Employee Allocations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8ECF1] bg-gray-50/50">
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Department</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Leave Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Total Days</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Used</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Remaining</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {credits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    No allocations yet
                  </td>
                </tr>
              ) : (
                credits.map((credit) => (
                  <tr key={credit.id} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium text-gray-900">{credit.employeeName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600">{credit.department}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: leaveTypes.find((lt) => lt.name === credit.leaveType)?.color || '#5B5FEF' }} />
                        {credit.leaveType}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {editingId === credit.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 border border-[#E8ECF1] rounded text-sm"
                            value={editValue}
                            min={0}
                            onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                            autoFocus
                          />
                          <button onClick={() => handleSaveCredit(credit.id)} className="p-1 text-green-500 hover:text-green-700">
                            <Save className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1 text-gray-400 hover:text-gray-600">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-medium tabular-nums">{credit.totalDays}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="tabular-nums">{credit.usedDays}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold tabular-nums ${credit.remainingDays <= 2 ? 'text-red-500' : credit.remainingDays <= 5 ? 'text-amber-500' : 'text-green-600'}`}>
                        {credit.remainingDays}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => { setEditingId(credit.id); setEditValue(credit.totalDays); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#5B5FEF] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Modal */}
      {showAllocationModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowAllocationModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Add Allocation</h2>

            {allocationError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{allocationError}</div>}

            <div>
              <label className="label">Employee</label>
              <select ref={employeeRef} className="input-field" value={allocationForm.employeeId} onChange={(e) => setAllocationForm({ ...allocationForm, employeeId: e.target.value })}>
                <option value="">Select employee...</option>
                {employees.map((emp: any) => (
                  <option key={emp.id} value={emp.id}>{emp.firstName} {emp.lastName} ({emp.employeeId})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Leave Type</label>
              <select className="input-field" value={allocationForm.leaveTypeId} onChange={(e) => setAllocationForm({ ...allocationForm, leaveTypeId: e.target.value })}>
                <option value="">Select leave type...</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>{lt.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Allocated Days</label>
                <input type="number" className="input-field" value={allocationForm.allocated} min={1} onChange={(e) => setAllocationForm({ ...allocationForm, allocated: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="label">Year</label>
                <input type="number" className="input-field" value={allocationForm.year} min={2024} max={2030} onChange={(e) => setAllocationForm({ ...allocationForm, year: parseInt(e.target.value) || currentYear })} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAllocationModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={async () => {
                  setAllocationError('');
                  if (!allocationForm.employeeId || !allocationForm.leaveTypeId) {
                    setAllocationError('Please select employee and leave type.');
                    return;
                  }
                  try {
                    await api.post('/leave-credits/adjust', {
                      employeeId: parseInt(allocationForm.employeeId),
                      leaveTypeId: parseInt(allocationForm.leaveTypeId),
                      year: allocationForm.year,
                      allocated: allocationForm.allocated,
                    });
                    setShowAllocationModal(false);
                    window.location.reload();
                  } catch (err: any) {
                    setAllocationError(err.response?.data?.message || 'Failed to adjust allocation.');
                  }
                }}
                className="btn-primary flex-1"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Adjustment Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowBulkModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Bulk Adjust Leave Credits</h2>
            <p className="text-sm text-gray-500">Set the same allocation for all employees at once.</p>

            {bulkError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{bulkError}</div>}
            {bulkSuccess && <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" />{bulkSuccess}</div>}

            <div>
              <label className="label">Leave Type</label>
              <select className="input-field" value={bulkForm.leaveTypeId} onChange={(e) => setBulkForm({ ...bulkForm, leaveTypeId: e.target.value })}>
                <option value="">Select leave type...</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>{lt.name}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Allocated Days Per Employee</label>
                <input type="number" className="input-field" value={bulkForm.allocated} min={1} onChange={(e) => setBulkForm({ ...bulkForm, allocated: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <label className="label">Year</label>
                <input type="number" className="input-field" value={bulkForm.year} min={2024} max={2030} onChange={(e) => setBulkForm({ ...bulkForm, year: parseInt(e.target.value) || currentYear })} />
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <p className="font-medium mb-1">⚠️ This will update ALL {employees.length} employees</p>
              <p>Each employee will receive {bulkForm.allocated} days for the selected leave type. Existing balances will be overwritten.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowBulkModal(false); setBulkError(''); setBulkSuccess(''); }} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={async () => {
                  setBulkError('');
                  setBulkSuccess('');
                  if (!bulkForm.leaveTypeId) {
                    setBulkError('Please select a leave type.');
                    return;
                  }
                  if (!window.confirm(`Adjust credits for ALL ${employees.length} employees? This cannot be undone.`)) return;
                  setBulkLoading(true);
                  try {
                    const employeeIds = employees.map((e: any) => e.id);
                    const res = await api.post('/leave-credits/bulk-adjust', {
                      employeeIds,
                      leaveTypeId: parseInt(bulkForm.leaveTypeId),
                      year: bulkForm.year,
                      allocated: bulkForm.allocated,
                    });
                    setBulkSuccess(`Updated ${res.data.updatedCount}/${res.data.totalCount} employees.`);
                    setTimeout(() => {
                      setShowBulkModal(false);
                      setBulkSuccess('');
                      window.location.reload();
                    }, 1500);
                  } catch (err: any) {
                    setBulkError(err.response?.data?.message || 'Failed to bulk adjust.');
                  } finally {
                    setBulkLoading(false);
                  }
                }}
                disabled={bulkLoading}
                className="btn-primary flex-1"
              >
                {bulkLoading ? 'Processing...' : `Apply to ${employees.length} Employees`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carry Over Confirmation */}
      {showCarryOverConfirm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowCarryOverConfirm(false)}>
          <div className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Carry Over Credits</h2>
            <p className="text-sm text-gray-600">
              This will carry over all remaining leave balances from {currentYear} to {currentYear + 1}. This action can be performed multiple times.
            </p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCarryOverConfirm(false)} className="btn-secondary flex-1">Cancel</button>
              <button
                onClick={async () => {
                  setCarryOverLoading(true);
                  try {
                    const res = await api.post('/leave-credits/carry-over');
                    alert(res.data.message);
                    setShowCarryOverConfirm(false);
                    window.location.reload();
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Failed to carry over.');
                  } finally {
                    setCarryOverLoading(false);
                  }
                }}
                disabled={carryOverLoading}
                className="btn-primary flex-1"
              >
                {carryOverLoading ? 'Processing...' : 'Confirm Carry Over'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
