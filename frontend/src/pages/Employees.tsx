import { useState, useEffect, useMemo, useRef } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { UserPlus, Search, Edit3, Trash2, ToggleLeft, ToggleRight, Key, MoreHorizontal,
  X, Save, Eye, FileText, Upload, Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { SkeletonTable } from '@/components/Skeleton';

interface Department {
  id: number;
  name: string;
}

interface EmployeeUser {
  id: number;
  email: string;
  isActive: boolean;
  role: { name: string };
}

interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  phone?: string;
  hireDate: string;
  department: Department;
  user: EmployeeUser;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface EmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  position: string;
  departmentId: string;
  phone: string;
  hireDate: string;
  managerId: string;
}

const defaultForm: EmployeeForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  position: '',
  departmentId: '',
  phone: '',
  hireDate: '',
  managerId: '',
};

export default function Employees() {
  const { isAdmin } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchSubmitted, setSearchSubmitted] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeForm>(defaultForm);
  const [formError, setFormError] = useState('');
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);

  // Focus first input when modal opens
  useEffect(() => {
    if (showModal) {
      setTimeout(() => firstNameRef.current?.focus(), 50);
    }
  }, [showModal]);

  // Escape key to close modals
  useEffect(() => {
    if (!showModal && !showDetail && !showImportModal) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showModal) setShowModal(false);
        if (showDetail) setShowDetail(false);
        if (showImportModal) { if (!importLoading) { setShowImportModal(false); setImportResult(null); } }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal, showDetail, showImportModal, importLoading]);

  // Read search from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchParam = params.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
    setSearchSubmitted((s) => s + 1);
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(pagination.page));
      params.set('limit', String(pagination.limit));
      if (search) params.set('search', search);

      const res = await api.get(`/employees?${params}`);
      setEmployees(res.data.employees);
      setPagination(res.data.pagination);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const res = await api.get('/employees?limit=1000');
      setAllEmployees(res.data.employees || []);
    } catch (err) {
      console.error('Failed to fetch all employees:', err);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchAllEmployees();
  }, [pagination.page, searchSubmitted]);

  const openCreate = () => {
    setEditingEmployee(null);
    setForm(defaultForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditingEmployee(emp);
    setForm({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      password: '',
      position: emp.position,
      departmentId: String(emp.department?.id || ''),
      phone: emp.phone || '',
      hireDate: emp.hireDate ? emp.hireDate.split('T')[0] : '',
      managerId: String((emp as any).managerId || ''),
    });
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.delete(`/employees/${id}`);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete employee.');
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      await api.patch(`/employees/${id}/toggle-status`);
      fetchEmployees();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to toggle status.');
    }
  };

  const handleResetPassword = async (id: number) => {
    if (!window.confirm('Reset password for this employee? The new password will be shown once.')) return;
    try {
      const res = await api.post(`/employees/${id}/reset-password`);
      alert(res.data.message);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  const handleSubmit = async () => {
    setFormError('');
    setActionLoading(true);
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, form);
      } else {
        if (!form.password) {
          setFormError('Password is required for new employees.');
          setActionLoading(false);
          return;
        }
        await api.post('/employees', form);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save employee.');
    } finally {
      setActionLoading(false);
    }
  };

  const columnHelper = createColumnHelper<Employee>();

  const columns = useMemo(() => [
    columnHelper.accessor('employeeId', {
      header: 'ID',
      cell: (info) => <span className="font-mono text-sm text-gray-500">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
      id: 'name',
      header: 'Name',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#5B5FEF]/10 flex items-center justify-center">
            <span className="text-xs font-medium text-[#5B5FEF]">
              {info.row.original.firstName[0]}{info.row.original.lastName[0]}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{info.getValue()}</p>
            <p className="text-xs text-gray-400">{info.row.original.email}</p>
          </div>
        </div>
      ),
    }),
    columnHelper.accessor('position', {
      header: 'Position',
      cell: (info) => <span className="text-gray-600">{info.getValue()}</span>,
    }),
    columnHelper.accessor((row) => row.department?.name || '', {
      id: 'department',
      header: 'Department',
      cell: (info) => (
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('phone', {
      header: 'Phone',
      cell: (info) => <span className="text-gray-500 text-xs">{info.getValue() || '—'}</span>,
    }),
    columnHelper.accessor((row) => row.user?.isActive ?? false, {
      id: 'status',
      header: 'Status',
      cell: (info) => {
        const isActive = info.getValue();
        return (
          <span className={cn(
            'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
            isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          )}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      },
    }),
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setSelectedEmployee(row.original); setShowDetail(true); }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#5B5FEF] transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => openEdit(row.original)}
            className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleToggleStatus(row.original.id)}
            className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-500 transition-colors"
            title="Toggle Status"
          >
            {row.original.user?.isActive ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => handleResetPassword(row.original.id)}
            className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-500 transition-colors"
            title="Reset Password"
          >
            <Key className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleDelete(row.original.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    }),
  ], []);

  const table = useReactTable({
    data: employees,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: pagination.totalPages,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500">Manage all employees</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowImportModal(true)} className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import CSV
          </button>
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-[#E8ECF1]">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder="Search by name, email, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setPagination((p) => ({ ...p, page: 1 }));
                  setSearchSubmitted((s) => s + 1);
                }
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-[#E8ECF1] bg-gray-50/50">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="text-left py-3 px-4 font-medium text-gray-500 cursor-pointer hover:text-gray-700 text-xs uppercase tracking-wider whitespace-nowrap"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {              loading ? (
                <tr>
                  <td colSpan={7} className="py-4 px-4">
                    <SkeletonTable rows={5} cols={6} />
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-600 mb-1">No employees found</p>
                    <p className="text-sm text-gray-400">{search ? 'Try a different search term' : 'Add your first employee to get started'}</p>
                    {!search && (
                      <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2 mt-4 text-sm">
                        <UserPlus className="w-4 h-4" />
                        Add Employee
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-4">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-[#E8ECF1] flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              className="btn-secondary text-sm py-1 px-3"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Previous
            </button>
            <button
              className="btn-secondary text-sm py-1 px-3"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingEmployee ? 'Edit Employee' : 'Add Employee'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{formError}</div>}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">First Name *</label>
                <input ref={firstNameRef} className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
              </div>
              <div>
                <label className="label">Last Name *</label>
                <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">Email *</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            {!editingEmployee && (
              <div>
                <label className="label">Password *</label>
                <input type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Position *</label>
                <input className="input-field" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} placeholder="e.g. Software Engineer" />
              </div>
              <div>
                <label className="label">Department *</label>
                <select className="input-field" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
              </div>
              <div>
                <label className="label">Hire Date *</label>
                <input type="date" className="input-field" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="label">Manager</label>
              <select className="input-field" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                <option value="">No manager</option>
                {allEmployees
                  .filter((emp) => !editingEmployee || emp.id !== editingEmployee.id)
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeId})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleSubmit} disabled={actionLoading} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                <Save className="w-4 h-4" />
                {actionLoading ? 'Saving...' : editingEmployee ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => { if (!importLoading) setShowImportModal(false); }}>
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Bulk Import Employees</h2>
              <button onClick={() => { if (!importLoading) setShowImportModal(false); setImportResult(null); }} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {importResult ? (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                  {importResult.message}
                </div>
                <p className="text-sm text-gray-600">
                  Default password for imported employees: <code className="bg-gray-100 px-2 py-0.5 rounded text-[#5B5FEF] font-mono">{importResult.defaultPassword}</code>
                </p>
                {importResult.errors?.length > 0 && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs font-medium text-amber-700 mb-1">{importResult.errors.length} error(s):</p>
                    <ul className="text-xs text-amber-600 space-y-0.5 max-h-32 overflow-y-auto">
                      {importResult.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                    </ul>
                  </div>
                )}
                <button onClick={() => { setShowImportModal(false); setImportResult(null); fetchEmployees(); }} className="btn-primary w-full">
                  Done
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Upload a CSV file with columns: <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">firstname, lastname, email, position, department</code>
                </p>
                <div className="border-2 border-dashed border-[#E8ECF1] rounded-lg p-6 hover:border-[#5B5FEF]/30 transition-colors">
                  {importFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Upload className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium text-gray-700">{importFile.name}</span>
                      </div>
                      <button onClick={() => setImportFile(null)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center gap-2 cursor-pointer">
                      <Upload className="w-8 h-8 text-gray-300" />
                      <p className="text-sm text-gray-500"><span className="text-[#5B5FEF] font-medium">Click to upload</span> CSV file</p>
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setImportFile(f); }}
                      />
                    </label>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setShowImportModal(false); setImportResult(null); }} className="btn-secondary flex-1">Cancel</button>
                  <button
                    onClick={async () => {
                      if (!importFile) return;
                      setImportLoading(true);
                      try {
                        const formData = new FormData();
                        formData.append('file', importFile);
                        const res = await api.post('/employees/import', formData, {
                          headers: { 'Content-Type': 'multipart/form-data' },
                        });
                        setImportResult(res.data);
                      } catch (err: any) {
                        alert(err.response?.data?.message || 'Import failed.');
                      } finally {
                        setImportLoading(false);
                      }
                    }}
                    disabled={!importFile || importLoading}
                    className="btn-primary flex-1"
                  >
                    {importLoading ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedEmployee && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(false)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-[#E8ECF1]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Employee Details</h2>
              <button onClick={() => setShowDetail(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[#5B5FEF]/10 flex items-center justify-center">
                <span className="text-xl font-bold text-[#5B5FEF]">
                  {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                </span>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>
                <p className="text-sm text-gray-500">{selectedEmployee.position}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Employee ID</p>
                <p className="font-medium text-gray-900">{selectedEmployee.employeeId}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Email</p>
                <p className="font-medium text-gray-900">{selectedEmployee.email}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Department</p>
                <p className="font-medium text-gray-900">{selectedEmployee.department?.name || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Phone</p>
                <p className="font-medium text-gray-900">{selectedEmployee.phone || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Hire Date</p>
                <p className="font-medium text-gray-900">
                  {selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-0.5">Status</p>
                <span className={cn(
                  'inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1',
                  selectedEmployee.user?.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                )}>
                  {selectedEmployee.user?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setShowDetail(false); openEdit(selectedEmployee); }}
                className="btn-primary flex items-center gap-2 flex-1 justify-center"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
              <Link
                to={`/employee-statement?employeeId=${selectedEmployee.id}`}
                className="btn-secondary flex items-center gap-2 flex-1 justify-center"
              >
                <FileText className="w-4 h-4" /> Statement
              </Link>
              <button className="btn-secondary flex-1" onClick={() => setShowDetail(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
