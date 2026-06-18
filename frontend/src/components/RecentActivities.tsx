import { Activity, UserPlus, CheckCircle, XCircle, FileText, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityItem {
  id: number;
  action: string;
  entity: string;
  details?: string;
  user: string;
  createdAt: string;
}

const actionIcons: Record<string, any> = {
  login: LogIn,
  create: UserPlus,
  approve: CheckCircle,
  reject: XCircle,
  default: FileText,
};

const actionColors: Record<string, string> = {
  login: 'bg-blue-50 text-blue-500',
  create: 'bg-green-50 text-green-500',
  approve: 'bg-emerald-50 text-emerald-500',
  reject: 'bg-red-50 text-red-500',
  default: 'bg-gray-100 text-gray-500',
};

function getIcon(action: string) {
  const key = Object.keys(actionIcons).find((k) => action.toLowerCase().includes(k));
  return key ? actionIcons[key] : actionIcons.default;
}

function getColor(action: string) {
  const key = Object.keys(actionColors).find((k) => action.toLowerCase().includes(k));
  return key ? actionColors[key] : actionColors.default;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function RecentActivities({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Recent Activities</h3>
      {!activities.length ? (
        <p className="text-gray-400 text-center py-8 text-sm">No recent activities</p>
      ) : (
        <div className="space-y-1">
          {activities.slice(0, 8).map((activity) => {
            const Icon = getIcon(activity.action);
            const colorClass = getColor(activity.action);
            return (
              <div key={activity.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colorClass)}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium capitalize">{activity.action}</span>{' '}
                    <span className="text-gray-500">{activity.entity}</span>
                  </p>
                  {activity.details && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{activity.details}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    <span className="font-medium text-gray-500">{activity.user}</span>
                    <span className="mx-1">·</span>
                    {timeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
