import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/context/AuthContext';
import { SkeletonList } from '@/components/Skeleton';
import { Sun, Plus, Edit3, Trash2 } from 'lucide-react';

interface Holiday {
  id: number;
  name: string;
  date: string;
  isRecurring: boolean;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export default function Holidays() {
  const { isAdmin } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [form, setForm] = useState({ name: '', date: '', isRecurring: false, type: 'public' });
  const [error, setError] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => nameRef.current?.focus(), 50);
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

  const fetchHolidays = async () => {
    setLoading(true);
    try {
      const res = await api.get('/holidays');
      setHolidays(res.data);
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHolidays(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', date: '', isRecurring: false, type: 'public' });
    setShowModal(true);
  };

  const openEdit = (holiday: Holiday) => {
    setEditing(holiday);
    setForm({ name: holiday.name, date: holiday.date, isRecurring: holiday.isRecurring, type: holiday.type });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await api.delete(`/holidays/${id}`);
      fetchHolidays();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete holiday.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name || !form.date) {
      setError('Name and date are required.');
      return;
    }
    try {
      if (editing) {
        await api.put(`/holidays/${editing.id}`, form);
      } else {
        await api.post('/holidays', form);
      }
      setShowModal(false);
      fetchHolidays();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save holiday.');
    }
  };

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Holidays</h1>
          <p className="text-gray-500">Manage company holidays</p>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Holiday
          </button>
        )}
      </div>

      <div className="card p-0">
        {loading ? (
          <div className="p-6">
            <SkeletonList count={5} />
          </div>
        ) : holidays.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Sun className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No holidays added yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
              Add public holidays, company events, and observances to help employees plan their leave.
            </p>
            {isAdmin && (
              <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Your First Holiday
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {holidays.map((holiday) => (
              <div key={holiday.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Sun className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{holiday.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatDate(holiday.date)}
                      {holiday.isRecurring && ' (Recurring yearly)'}
                      <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 capitalize">{holiday.type}</span>
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(holiday)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(holiday.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500" title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing ? 'Edit Holiday' : 'Add Holiday'}</h2>

            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            <div>
              <label className="label">Holiday Name</label>
              <input ref={nameRef} className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Christmas" />
            </div>
            <div>
              <label className="label">Date</label>
              <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isRecurring" checked={form.isRecurring} onChange={(e) => setForm({ ...form, isRecurring: e.target.checked })} className="rounded border-gray-300" />
              <label htmlFor="isRecurring" className="text-sm text-gray-700">Recurring yearly</label>
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input-field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="public">Public</option>
                <option value="optional">Optional</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} className="btn-primary flex-1">{editing ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
