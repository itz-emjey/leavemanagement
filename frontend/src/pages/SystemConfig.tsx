import { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  Save,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Server,
  Database,
  Clock,
  Globe,
  ChevronDown,
  ChevronUp,
  Activity,
  Loader2,
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';
import { SkeletonConfig } from '@/components/Skeleton';

interface ConfigItem {
  key: string;
  value: any;
  rawValue: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description: string;
  group: string;
  updatedAt: string;
}

interface HealthData {
  status: string;
  database: { connected: boolean; latencyMs: number };
  configCount: number;
  totalLeaveRequests: number;
  uptime: number;
  environment: string;
  nodeVersion: string;
  timestamp: string;
}

const GROUP_LABELS: Record<string, string> = {
  general: 'General',
  leave: 'Leave Settings',
  email: 'Email & Notifications',
  system: 'System',
};

const GROUP_ICONS: Record<string, any> = {
  general: Globe,
  leave: Settings,
  email: Settings,
  system: Server,
};

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(days + 'd');
  if (hours > 0) parts.push(hours + 'h');
  parts.push(mins + 'm');
  return parts.join(' ');
}

export default function SystemConfig() {
  const [configs, setConfigs] = useState<Record<string, ConfigItem[]>>({});
  const [flatConfigs, setFlatConfigs] = useState<Record<string, ConfigItem>>({});
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    general: true,
    leave: true,
    email: true,
    system: true,
  });

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, healthRes] = await Promise.all([
        api.get('/system-config'),
        api.get('/system-config/health'),
      ]);
      setConfigs(configRes.data.byGroup || {});
      const flat: Record<string, ConfigItem> = {};
      Object.entries(configRes.data.byGroup || {}).forEach(([_, items]) => {
        (items as ConfigItem[]).forEach((item) => {
          flat[item.key] = item;
        });
      });
      setFlatConfigs(flat);
      setHealth(healthRes.data);
    } catch {
      showMessage('error', 'Failed to load system configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/system-config', { configs: editedValues });
      showMessage('success', 'Configuration saved successfully.');
      setEditedValues({});
      setSavedKey('all');
      setTimeout(() => setSavedKey(null), 2000);
      fetchConfig();
    } catch (err: any) {
      showMessage('error', err.response?.data?.message || 'Failed to save configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    try {
      await api.post('/system-config/reset');
      showMessage('success', 'Configuration reset to defaults.');
      fetchConfig();
    } catch {
      showMessage('error', 'Failed to reset configuration.');
    }
  };

  const updateValue = (key: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [key]: value }));
  };

  const getDisplayValue = (key: string): string => {
    if (editedValues[key] !== undefined) return editedValues[key];
    const config = flatConfigs[key];
    if (!config) return '';
    return config.rawValue;
  };

  const getOriginalValue = (key: string): string => {
    return flatConfigs[key]?.rawValue || '';
  };

  const hasChanges = Object.keys(editedValues).length > 0;

  if (loading) {
    return <SkeletonConfig />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">System Configuration</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage application settings, leave policies, and system preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border border-[#E8ECF1] text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all',
              hasChanges
                ? 'bg-[#5B5FEF] text-white hover:bg-[#4B4FDF] shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'No Changes'}
          </button>
        </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Groups */}
        <div className="lg:col-span-2 space-y-4">
          {Object.entries(configs).map(([groupKey, items]) => {
            const GroupIcon = GROUP_ICONS[groupKey] || Settings;
            return (
              <div key={groupKey} className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#5B5FEF]/10 flex items-center justify-center">
                      <GroupIcon className="w-4 h-4 text-[#5B5FEF]" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-semibold text-gray-900">{GROUP_LABELS[groupKey] || groupKey}</h2>
                      <p className="text-xs text-gray-400">{items.length} settings</p>
                    </div>
                  </div>
                  {expandedGroups[groupKey] ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>

                {expandedGroups[groupKey] && (
                  <div className="px-5 pb-5 space-y-4">
                    {items.map((item) => {
                      const isModified = editedValues[item.key] !== undefined;
                      const isSaved = savedKey === item.key || savedKey === 'all';
                      return (
                        <div key={item.key} className={cn(
                          'p-3 rounded-lg border transition-all',
                          isModified ? 'border-[#5B5FEF]/30 bg-[#5B5FEF]/[0.02]' : 'border-[#E8ECF1]',
                          isSaved && 'border-green-300 bg-green-50/30'
                        )}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <label className="text-sm font-medium text-gray-900 block">
                                {item.key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </label>
                              {item.description && (
                                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                              )}
                            </div>
                            {isModified && (
                              <span className="flex-shrink-0 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-medium rounded">
                                Modified
                              </span>
                            )}
                          </div>

                          <div className="mt-2">
                            {item.type === 'boolean' ? (
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => updateValue(item.key, getDisplayValue(item.key) === 'true' ? 'false' : 'true')}
                                  className={cn(
                                    'relative w-10 h-6 rounded-full transition-all',
                                    getDisplayValue(item.key) === 'true' ? 'bg-[#5B5FEF]' : 'bg-gray-200'
                                  )}
                                >
                                  <div className={cn(
                                    'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                                    getDisplayValue(item.key) === 'true' ? 'translate-x-[18px]' : 'translate-x-0.5'
                                  )} />
                                </button>
                                <span className="text-xs font-medium text-gray-600">
                                  {getDisplayValue(item.key) === 'true' ? 'Enabled' : 'Disabled'}
                                </span>
                              </div>
                            ) : item.type === 'number' ? (
                              <input
                                type="number"
                                value={getDisplayValue(item.key)}
                                onChange={(e) => updateValue(item.key, e.target.value)}
                                className="w-full max-w-xs px-3 py-2 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF]"
                              />
                            ) : (
                              <input
                                type="text"
                                value={getDisplayValue(item.key)}
                                onChange={(e) => updateValue(item.key, e.target.value)}
                                className="w-full max-w-md px-3 py-2 border border-[#E8ECF1] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF]"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* System Health Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#E8ECF1] shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <Activity className="w-5 h-5 text-[#5B5FEF]" />
              <h2 className="text-sm font-semibold text-gray-900">System Health</h2>
            </div>

            {health ? (
              <div className="space-y-3">
                {/* Status */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    {health.status === 'healthy' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium text-gray-700">Status</span>
                  </div>
                  <span className={cn(
                    'text-xs font-medium px-2 py-0.5 rounded-full',
                    health.status === 'healthy' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                  )}>
                    {health.status}
                  </span>
                </div>

                {/* Database */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Database</span>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      'text-xs font-medium',
                      health.database.connected ? 'text-green-600' : 'text-red-600'
                    )}>
                      {health.database.connected ? 'Connected' : 'Disconnected'}
                    </span>
                    {health.database.latencyMs > 0 && (
                      <p className="text-[10px] text-gray-400">{health.database.latencyMs}ms</p>
                    )}
                  </div>
                </div>

                {/* Uptime */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Uptime</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">{formatUptime(health.uptime)}</span>
                </div>

                {/* Environment */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Environment</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600 capitalize">{health.environment}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="p-3 rounded-lg bg-[#5B5FEF]/5 border border-[#5B5FEF]/10 text-center">
                    <p className="text-lg font-bold text-[#5B5FEF]">{health.configCount}</p>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Configs</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-100 text-center">
                    <p className="text-lg font-bold text-purple-600">{health.totalLeaveRequests}</p>
                    <p className="text-[10px] text-purple-500 font-medium uppercase tracking-wider">Leave Requests</p>
                  </div>
                </div>

                <button
                  onClick={fetchConfig}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E8ECF1] text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all mt-2"
                >
                  <RefreshCw className="w-4 h-4" /> Refresh
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 text-gray-300 animate-spin" />
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="bg-gradient-to-br from-[#5B5FEF]/5 to-transparent rounded-xl border border-[#E8ECF1] p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">About</h3>
            <div className="space-y-1.5 text-xs text-gray-500">
              <p>Leave Management System</p>
              <p>Version {flatConfigs.app_version?.rawValue || '1.0.0'}</p>
              <p>Node.js {health?.nodeVersion || '-'}</p>
              {health && <p>Last check: {new Date(health.timestamp).toLocaleString()}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
