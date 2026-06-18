import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { SkeletonGrid } from '@/components/Skeleton';
import { FileText, Plus, Edit3, Trash2, Save, X, Shield } from 'lucide-react';

interface LeaveType {
  id: number;
  name: string;
  description: string;
  defaultDays: number;
  color: string;
}

interface LeavePolicy {
  id: number;
  leaveTypeId: number;
  maxConsecutiveDays: number;
  minNoticeDays: number;
  carryOverLimit: number;
  requiresApproval: boolean;
  isActive: boolean;
  leaveType?: LeaveType;
}

const defaultForm = {
  leaveTypeId: '',
  maxConsecutiveDays: 15,
  minNoticeDays: 1,
  carryOverLimit: 5,
  requiresApproval: true,
  isActive: true,
};

export default function LeavePolicies() {
  const [policies, setPolicies] = useState<LeavePolicy[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LeavePolicy | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const typeRef = useRef<HTMLSelectElement>(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => typeRef.current?.focus(), 50);
    }
  }, [showModal]);

  // Escape key to close modal
  useEffect(() => {
    if (!showModal) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const [policiesRes, typesRes] = await Promise.all([
        api.get('/leave-policies'),
        api.get('/leave-types'),
      ]);
      setPolicies(policiesRes.data);
      setLeaveTypes(typesRes.data);
    } catch (err) {
      console.error('Failed to fetch leave policies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPolicies(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (policy: LeavePolicy) => {
    setEditing(policy);
    setForm({
      leaveTypeId: String(policy.leaveTypeId),
      maxConsecutiveDays: policy.maxConsecutiveDays,
      minNoticeDays: policy.minNoticeDays,
      carryOverLimit: policy.carryOverLimit,
      requiresApproval: policy.requiresApproval,
      isActive: policy.isActive,
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this leave policy?')) return;
    try {
      await api.delete(`/leave-policies/${id}`);
      fetchPolicies();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.leaveTypeId) {
      setError('Leave type is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        leaveTypeId: parseInt(form.leaveTypeId),
        maxConsecutiveDays: form.maxConsecutiveDays,
        minNoticeDays: form.minNoticeDays,
        carryOverLimit: form.carryOverLimit,
        requiresApproval: form.requiresApproval,
        isActive: form.isActive,
      };

      if (editing) {
        await api.put(`/leave-policies/${editing.id}`, payload);
      } else {
        await api.post('/leave-policies', payload);
      }
      setShowModal(false);
      fetchPolicies();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const getLeaveTypeName = (leaveTypeId: number) => {
    return leaveTypes.find((lt) => lt.id === leaveTypeId)?.name || 'Unknown';
  };

  const getLeaveTypeColor = (leaveTypeId: number) => {
    return leaveTypes.find((lt) => lt.id === leaveTypeId)?.color || '#5B5FEF';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Leave Policies</h1>
          <p className="text-gray-500 mt-0.5">Configure leave rules per leave type</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full">
            <SkeletonGrid cards={4} />
          </div>
        ) : policies.length === 0 ? (
          <div className="col-span-full card text-center py-12">
            <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No leave policies configured yet</p>
            <p className="text-xs text-gray-300 mt-1">Add a policy to configure rules for each leave type</p>
          </div>
        ) : (
          policies.map((policy) => (
            <div key={policy.id} className="card relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${getLeaveTypeColor(policy.leaveTypeId)}15` }}>
                    <Shield className="w-5 h-5" style={{ color: getLeaveTypeColor(policy.leaveTypeId) }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{getLeaveTypeName(policy.leaveTypeId)}</p>
                    <p className="text-xs text-gray-400">
                      {policy.isActive ? (
                        <span className="text-green-600">Active</span>
                      ) : (
                        <span className="text-gray-400">Inactive</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(policy)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(policy.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Max Consecutive Days</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{policy.maxConsecutiveDays}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Min Notice Days</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{policy.minNoticeDays}</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Carry Over Limit</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{policy.carryOverLimit} days</p>
                </div>
                <div className="p-2.5 rounded-lg bg-gray-50">
                  <p className="text-xs text-gray-400">Requires Approval</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{policy.requiresApproval ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editing ? 'Edit Policy' : 'Add Policy'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            <div>
              <label className="label">Leave Type</label>
              <select
                ref={typeRef}
                className="input-field"
                value={form.leaveTypeId}
                onChange={(e) => setForm({ ...form, leaveTypeId: e.target.value })}
                disabled={!!editing}
              >
                <option value="">Select leave type...</option>
                {leaveTypes.map((lt) => {
                  const hasPolicy = policies.some((p) => p.leaveTypeId === lt.id && (!editing || p.id !== editing.id));
                  return (
                    <option key={lt.id} value={lt.id} disabled={hasPolicy}>
                      {lt.name} {hasPolicy ? '(already has policy)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Max Consecutive Days</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.maxConsecutiveDays}
                  min={1}
                  max={90}
                  onChange={(e) => setForm({ ...form, maxConsecutiveDays: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div>
                <label className="label">Min Notice Days</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.minNoticeDays}
                  min={0}
                  max={30}
                  onChange={(e) => setForm({ ...form, minNoticeDays: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Carry Over Limit (days)</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.carryOverLimit}
                  min={0}
                  max={30}
                  onChange={(e) => setForm({ ...form, carryOverLimit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.requiresApproval}
                    onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-[#5B5FEF] focus:ring-[#5B5FEF]"
                  />
                  <span className="text-sm text-gray-700 font-medium">Requires Approval</span>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="policyActive"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-[#5B5FEF] focus:ring-[#5B5FEF]"
              />
              <label htmlFor="policyActive" className="text-sm text-gray-700 font-medium">Policy Active</label>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
