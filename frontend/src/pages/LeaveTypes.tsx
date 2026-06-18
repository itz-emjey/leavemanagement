import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { SkeletonGrid } from '@/components/Skeleton';
import { FileText, Plus, Edit3, Trash2 } from 'lucide-react';

interface LeaveType {
  id: number;
  name: string;
  description: string;
  defaultDays: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

const defaultColors = ['#5B5FEF', '#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function LeaveTypes() {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LeaveType | null>(null);
  const [form, setForm] = useState({ name: '', description: '', defaultDays: 10, color: '#5B5FEF' });
  const [error, setError] = useState('');
  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const fetchLeaveTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get('/leave-types');
      setLeaveTypes(res.data);
    } catch (err) {
      console.error('Failed to fetch leave types:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaveTypes(); }, []);

  // Focus first input when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
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

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '', defaultDays: 10, color: '#5B5FEF' });
    setShowModal(true);
  };

  const openEdit = (lt: LeaveType) => {
    setEditing(lt);
    setForm({ name: lt.name, description: lt.description || '', defaultDays: lt.defaultDays, color: lt.color });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this leave type?')) return;
    try {
      await api.delete(`/leave-types/${id}`);
      fetchLeaveTypes();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete leave type.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name || form.defaultDays <= 0) {
      setError('Name and valid default days are required.');
      return;
    }
    try {
      if (editing) {
        await api.put(`/leave-types/${editing.id}`, form);
      } else {
        await api.post('/leave-types', form);
      }
      setShowModal(false);
      fetchLeaveTypes();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save leave type.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Types</h1>
          <p className="text-gray-500">Manage leave categories and default allocations</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Leave Type
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full">
            <SkeletonGrid cards={6} />
          </div>
        ) : leaveTypes.length === 0 ? (
          <div className="col-span-full text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No leave types defined</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
              Create leave types like Annual, Sick, or Personal leave to start managing employee time-off.
            </p>
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Leave Type
            </button>
          </div>
        ) : (
          leaveTypes.map((lt) => (
            <div key={lt.id} className="stat-card relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${lt.color}15` }}>
                    <FileText className="w-5 h-5" style={{ color: lt.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{lt.name}</p>
                    <p className="text-xs text-gray-400">{lt.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(lt)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(lt.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Default days:</span>{' '}
                  <span className="font-semibold text-gray-900">{lt.defaultDays}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">Color:</span>
                  <span className="w-4 h-4 rounded-full border border-gray-200" style={{ backgroundColor: lt.color }} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          ref={modalOverlayRef}
          className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing ? 'Edit Leave Type' : 'Add Leave Type'}</h2>

            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            <div>
              <label className="label">Name</label>
              <input
                ref={nameInputRef}
                className="input-field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Annual Leave"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea className="input-field min-h-[60px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description..." />
            </div>
            <div>
              <label className="label">Default Days per Year</label>
              <input type="number" className="input-field" value={form.defaultDays} min={1} onChange={(e) => setForm({ ...form, defaultDays: parseInt(e.target.value) || 0 })} />
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex flex-wrap gap-2">
                {defaultColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${form.color === color ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  className="w-8 h-8 rounded-lg border border-[#E8ECF1] cursor-pointer"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
