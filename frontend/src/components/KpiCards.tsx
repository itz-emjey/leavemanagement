import { Users, CalendarCheck, CheckCircle, XCircle, Clock, Briefcase, TrendingUp } from 'lucide-react';

interface KpiData {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  onLeave: number;
}

const cards = [
  {
    key: 'totalEmployees' as const,
    label: 'Total Employees',
    icon: Users,
    bg: 'bg-gradient-to-br from-[#5B5FEF]/10 to-[#7C80F2]/5',
    iconBg: 'bg-[#5B5FEF]',
    format: (v: number) => v,
  },
  {
    key: 'activeEmployees' as const,
    label: 'Active',
    icon: Briefcase,
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    iconBg: 'bg-green-500',
    format: (v: number) => v,
  },
  {
    key: 'onLeave' as const,
    label: 'On Leave Today',
    icon: CalendarCheck,
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    iconBg: 'bg-purple-500',
    format: (v: number) => v,
  },
  {
    key: 'pendingLeaves' as const,
    label: 'Pending',
    icon: Clock,
    bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
    iconBg: 'bg-amber-500',
    format: (v: number) => v,
  },
  {
    key: 'approvedLeaves' as const,
    label: 'Approved',
    icon: CheckCircle,
    bg: 'bg-gradient-to-br from-emerald-50 to-green-50',
    iconBg: 'bg-emerald-500',
    format: (v: number) => v,
  },
  {
    key: 'rejectedLeaves' as const,
    label: 'Rejected',
    icon: XCircle,
    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
    iconBg: 'bg-red-500',
    format: (v: number) => v,
  },
];

export default function KpiCards({ data }: { data: KpiData }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const value = data[card.key] ?? 0;
        return (
          <div
            key={card.key}
            className="relative overflow-hidden rounded-xl border border-[#E8ECF1] p-4 bg-white shadow-[0_1px_3px_0_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_0_rgba(0,0,0,0.05)] transition-all duration-200 group"
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500 font-medium truncate">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5 tabular-nums">{card.format(value)}</p>
              </div>
            </div>
            <div className={`absolute top-0 right-0 w-16 h-16 ${card.bg} rounded-bl-full -mr-4 -mt-4 opacity-50`} />
          </div>
        );
      })}
    </div>
  );
}
