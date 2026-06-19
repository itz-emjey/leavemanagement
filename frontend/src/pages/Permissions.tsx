import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { SkeletonTable } from '@/components/Skeleton';
import { Shield, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Role {
  id: number;
  name: string;
  description: string;
}

interface ResourceDef {
  resource: string;
  actions: string[];
}

interface PermissionMatrix {
  [resource: string]: {
    [action: string]: {
      [roleName: string]: boolean;
    };
  };
}

const resourceLabels: Record<string, string> = {
  leave_requests: 'Leave Requests',
  employees: 'Employees',
  leave_types: 'Leave Types',
  departments: 'Departments',
  holidays: 'Holidays',
  leave_credits: 'Leave Credits',
  reports: 'Reports & Analytics',
  audit_logs: 'Audit Logs',
  settings: 'Settings',
};

const actionLabels: Record<string, string> = {
  create: 'Create',
  read: 'View',
  update: 'Edit',
  delete: 'Delete',
  approve: 'Approve',
  reject: 'Reject',
  cancel: 'Cancel',
  adjust: 'Adjust',
  carry_over: 'Carry Over',
  export: 'Export',
  configure: 'Configure',
};

export default function Permissions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [resources, setResources] = useState<ResourceDef[]>([]);
  const [matrix, setMatrix] = useState<PermissionMatrix>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await api.get('/permissions');
        setRoles(res.data.roles);
        setResources(res.data.resources);
        setMatrix(res.data.matrix);
      } catch (err) {
        console.error('Failed to load permissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPermissions();
  }, []);

  const handleToggle = async (roleId: number, roleName: string, resource: string, action: string) => {
    const current = matrix[resource]?.[action]?.[roleName] ?? false;
    const newValue = !current;
    const key = `${roleId}-${resource}-${action}`;

    setSaving(key);
    setSuccessMsg('');

    try {
      await api.post('/permissions', {
        roleId,
        resource,
        action,
        allowed: newValue,
      });

      // Update local state
      setMatrix((prev) => ({
        ...prev,
        [resource]: {
          ...(prev[resource] || {}),
          [action]: {
            ...(prev[resource]?.[action] || {}),
            [roleName]: newValue,
          },
        },
      }));

      setSuccessMsg(`${actionLabels[action] || action} ${newValue ? 'granted' : 'revoked'} for ${roleName}`);
      setTimeout(() => setSuccessMsg(''), 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update permission.');
    } finally {
      setSaving(null);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all permissions to default values? This cannot be undone.')) return;
    try {
      await api.post('/permissions/reset');
      const res = await api.get('/permissions');
      setMatrix(res.data.matrix);
      setSuccessMsg('Permissions reset to defaults');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reset permissions.');
    }
  };

  const isAllowed = (resource: string, action: string, roleName: string): boolean => {
    return matrix[resource]?.[action]?.[roleName] ?? false;
  };

  if (loading) {
    return <div className="card p-0 overflow-hidden"><div className="p-6"><SkeletonTable rows={8} cols={4} /></div></div>;
  }

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-50 text-purple-700 border-purple-200',
    manager: 'bg-blue-50 text-blue-700 border-blue-200',
    employee: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Role Permissions</h1>
          <p className="text-gray-500 mt-0.5">Configure access control for each role</p>
        </div>
        <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
          <RotateCcw className="w-4 h-4" /> Reset to Defaults
        </button>
      </div>

      {/* Success Toast */}
      {successMsg && (
        <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            {successMsg}
          </div>
        </div>
      )}

      {/* Role Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {roles.map((role) => (
          <span
            key={role.id}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border',
              roleColors[role.name] || 'bg-gray-50 text-gray-700 border-gray-200'
            )}
          >
            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
          </span>
        ))}
      </div>

      {/* Permissions Matrix */}
      <div className="space-y-4">
        {resources.map(({ resource, actions }) => (
          <div key={resource} className="card p-0 overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-[#E8ECF1]">
              <h3 className="text-sm font-semibold text-gray-900">
                {resourceLabels[resource] || resource.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8ECF1]">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider w-32">
                      Action
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role.id}
                        className="text-center py-3 px-4 font-medium text-gray-500 text-xs uppercase tracking-wider"
                      >
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {actions.map((action) => (
                    <tr key={action} className="border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="text-gray-700 font-medium">
                          {actionLabels[action] || action.charAt(0).toUpperCase() + action.slice(1)}
                        </span>
                      </td>
                      {roles.map((role) => {
                        const allowed = isAllowed(resource, action, role.name);
                        const key = `${role.id}-${resource}-${action}`;
                        const isSaving = saving === key;
                        return (
                          <td key={role.id} className="py-3 px-4 text-center">
                            <button
                              onClick={() => handleToggle(role.id, role.name, resource, action)}
                              disabled={isSaving}
                              className={cn(
                                'w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 mx-auto',
                                isSaving && 'animate-pulse',
                                allowed
                                  ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                                  : 'bg-gray-50 text-gray-300 hover:bg-gray-100 border border-gray-200'
                              )}
                              title={`${allowed ? 'Revoke' : 'Grant'} ${actionLabels[action]} for ${role.name}`}
                            >
                              {allowed ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
