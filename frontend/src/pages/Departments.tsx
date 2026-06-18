import { useState, useEffect, useRef } from 'react';
import api from '@/lib/axios';
import { SkeletonList } from '@/components/Skeleton';
import { Building2, Plus, Edit3, Trash2 } from 'lucide-react';

interface Department {
  id: number;
  name: string;
  description: string;
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
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
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/departments/${id}`);
      fetchDepartments();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete department.');
    }
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.name) {
      setError('Department name is required.');
      return;
    }
    try {
      if (editing) {
        await api.put(`/departments/${editing.id}`, form);
      } else {
        await api.post('/departments', form);
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save department.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-500">Manage company departments and teams</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Department
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <SkeletonList count={5} />
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No departments yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
              Organize your company by creating departments. Employees can be assigned to departments for better management.
            </p>
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Department
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E8ECF1]">
            {departments.map((dept) => (
              <div key={dept.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#5B5FEF]/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#5B5FEF]" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{dept.name}</p>
                    <p className="text-sm text-gray-500">{dept.description || 'No description'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{dept.employeeCount || 0}</p>
                    <p className="text-xs text-gray-400">Employees</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500" title="Edit">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${dept.name}"?`)) {
                          handleDelete(dept.id);
                        }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">{editing ? 'Edit Department' : 'Add Department'}</h2>

            {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            <div>
              <label className="label">Department Name</label>
              <input ref={nameRef} className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Human Resources" />
            </div>
            <div>
              <label className="label">Description (optional)</label>
              <textarea className="input-field min-h-[80px] resize-y" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Department description..." />
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
