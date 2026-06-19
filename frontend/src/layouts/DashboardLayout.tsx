import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSocket, type ToastNotification } from '@/context/SocketContext';
import { ToastContainer, ConnectionIndicator } from '@/components/NotificationToast';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  BarChart3,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  FileText,
  Sun,
  Moon,
  Send,
  Shield,
  ChevronDown,
  Search,
  CreditCard,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/axios';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

const sidebarLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false },
  { to: '/apply-leave', label: 'Apply Leave', icon: Send, adminOnly: false },
  { to: '/leave-requests', label: 'Leave Requests', icon: CalendarCheck, adminOnly: false },
  { to: '/employees', label: 'Employees', icon: Users, adminOnly: true },
  { to: '/leave-credits', label: 'Leave Credits', icon: CreditCard, adminOnly: true },
  { to: '/leave-types', label: 'Leave Types', icon: FileText, adminOnly: true },
  { to: '/departments', label: 'Departments', icon: Users, adminOnly: true },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, adminOnly: true },
  { to: '/reports', label: 'Reports', icon: BarChart3, adminOnly: false },
  { to: '/holidays', label: 'Holidays', icon: Sun, adminOnly: true },
  { to: '/audit-logs', label: 'Audit Logs', icon: Shield, adminOnly: true },
  { to: '/permissions', label: 'Permissions', icon: Shield, adminOnly: true },
  { to: '/admin/system-config', label: 'System Config', icon: Wrench, adminOnly: true },
];

const sidebarSections = [
  {
    title: 'Main Menu',
    links: sidebarLinks.filter((l) => !l.adminOnly && l.to !== '/reports' && l.to !== '/profile'),
  },
  {
    title: 'Management',
    links: sidebarLinks.filter((l) => l.adminOnly),
  },
  {
    title: 'Analytics',
    links: sidebarLinks.filter((l) => l.to === '/reports'),
  },
];

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/profile': 'My Profile',
  '/apply-leave': 'Apply for Leave',
  '/leave-requests': 'Leave Requests',
  '/reports': 'Reports',
  '/employee-statement': 'Employee Statement',
  '/analytics': 'Analytics',
  '/employees': 'Employees',
  '/leave-credits': 'Leave Credits',
  '/leave-types': 'Leave Types',
  '/departments': 'Departments',
  '/holidays': 'Holidays',
  '/audit-logs': 'Audit Logs',
  '/permissions': 'Role Permissions',
  '/admin/system-config': 'System Configuration',
};

export default function DashboardLayout() {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Update page title on route change
  useEffect(() => {
    const baseTitle = 'Leave Management System';
    const path = location.pathname;
    const pageTitle = pageTitles[path];
    document.title = pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle;
  }, [location.pathname]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const { lastNotification, toasts, dismissToast, connectionStatus } = useSocket();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {}
  }, []);

  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await api.get('/leave-requests?status=pending&limit=1');
      setPendingCount(res.data.pagination?.total || 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifications();
    fetchPendingCount();
  }, [fetchNotifications, fetchPendingCount]);

  // Re-fetch on socket notification event
  useEffect(() => {
    if (lastNotification) {
      fetchNotifications();
      fetchPendingCount();
    }
  }, [lastNotification, fetchNotifications, fetchPendingCount]);

  // Fallback polling every 30s as backup
  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
      fetchPendingCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications, fetchPendingCount]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {}
  };

  // Search suggestions
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const suggestions: { label: string; to: string; icon: string }[] = [];
    if ('employees'.includes(q)) suggestions.push({ label: 'Go to Employees', to: `/employees?search=${encodeURIComponent(searchQuery.trim())}`, icon: '👥' });
    if ('leave requests'.includes(q) || 'leaves'.includes(q)) suggestions.push({ label: 'Go to Leave Requests', to: `/leave-requests?search=${encodeURIComponent(searchQuery.trim())}`, icon: '📋' });
    if ('holidays'.includes(q)) suggestions.push({ label: 'Go to Holidays', to: '/holidays', icon: '🎉' });
    if ('departments'.includes(q)) suggestions.push({ label: 'Go to Departments', to: '/departments', icon: '🏢' });
    if ('reports'.includes(q)) suggestions.push({ label: 'Go to Reports', to: '/reports', icon: '📊' });
    if ('analytics'.includes(q)) suggestions.push({ label: 'Go to Analytics', to: '/analytics', icon: '📈' });
    if ('audit'.includes(q)) suggestions.push({ label: 'Go to Audit Logs', to: '/audit-logs', icon: '🔍' });
    if ('leave credits'.includes(q) || 'credits'.includes(q) || 'balance'.includes(q)) suggestions.push({ label: 'Go to Leave Credits', to: '/leave-credits', icon: '💰' });
    if ('leave types'.includes(q) || 'types'.includes(q)) suggestions.push({ label: 'Go to Leave Types', to: '/leave-types', icon: '📝' });
    if ('apply'.includes(q)) suggestions.push({ label: 'Apply for Leave', to: '/apply-leave', icon: '✈️' });
    // Always add a general search option
    suggestions.push({ label: `Search "${searchQuery.trim()}" in Employees`, to: `/employees?search=${encodeURIComponent(searchQuery.trim())}`, icon: '🔎' });
    suggestions.push({ label: `Search "${searchQuery.trim()}" in Leave Requests`, to: `/leave-requests?search=${encodeURIComponent(searchQuery.trim())}`, icon: '🔎' });
    return suggestions;
  }, [searchQuery]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredSections = sidebarSections
    .map((section) => ({
      ...section,
      links: section.links.filter((link) => !link.adminOnly || isAdmin),
    }))
    .filter((section) => section.links.length > 0);

  const userInitials = user?.employee?.firstName?.[0] || 'U';

  return (
    <div className="min-h-screen bg-[#F7F8FC] flex">
      {/* Sidebar Overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-[260px] bg-white flex flex-col transition-transform duration-300 lg:translate-x-0 border-r border-[#E8ECF1]',
          sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        {/* Logo Area */}
        <div className="px-5 py-5 border-b border-[#E8ECF1]">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5B5FEF] to-[#7C80F2] flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">LM</span>
              </div>
              <div>
                <span className="font-bold text-gray-900 text-base tracking-tight">LeaveMS</span>
                <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Management System</p>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
          {filteredSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                        isActive
                          ? 'bg-[#5B5FEF]/10 text-[#5B5FEF] font-semibold'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', isActive ? 'text-[#5B5FEF]' : 'text-gray-400')} />
                      {link.label}
                      {link.label === 'Leave Requests' && pendingCount > 0 && (
                        <span className="ml-auto w-5 h-5 rounded-md bg-amber-100 text-amber-700 text-[10px] font-bold flex items-center justify-center">
                          {pendingCount > 9 ? '9+' : pendingCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-[#E8ECF1]">
          <Link
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              location.pathname === '/profile'
                ? 'bg-[#5B5FEF]/10 text-[#5B5FEF]'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
            )}
          >
            <User className={cn('w-5 h-5', location.pathname === '/profile' ? 'text-[#5B5FEF]' : 'text-gray-400')} />
            Profile
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-[#E8ECF1] px-4 lg:px-6 py-3 no-print">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700 p-2 -ml-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center">
                <div className="relative" ref={searchRef}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    className="w-64 lg:w-80 pl-10 pr-4 py-2 border border-[#E8ECF1] rounded-lg text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5B5FEF]/15 focus:border-[#5B5FEF] transition-all"
                    placeholder="Search employees, leaves, pages..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearchDropdown(true);
                    }}
                    onFocus={() => setShowSearchDropdown(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        setShowSearchDropdown(false);
                        navigate(`/employees?search=${encodeURIComponent(searchQuery.trim())}`);
                      }
                      if (e.key === 'Escape') setShowSearchDropdown(false);
                    }}
                  />

                  {/* Search Suggestions Dropdown */}
                  {showSearchDropdown && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-[#E8ECF1] z-50 py-1 max-h-64 overflow-y-auto">
                      {searchSuggestions.map((s, i) => (
                        <Link
                          key={i}
                          to={s.to}
                          onClick={() => { setShowSearchDropdown(false); setSearchQuery(''); }}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <span className="text-base">{s.icon}</span>
                          <span>{s.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <ConnectionIndicator status={connectionStatus} />

              {/* Theme Toggle */}
              <button
                onClick={() => setIsDark((prev) => !prev)}
                className="p-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200"
                title="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all duration-200 relative"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-[320px] bg-white rounded-xl shadow-lg border border-[#E8ECF1] z-50 max-h-[400px] flex flex-col">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8ECF1]">
                      <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-[#5B5FEF] hover:underline font-medium">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto flex-1">
                      {notifications.length === 0 ? (
                        <p className="text-center text-gray-400 text-sm py-10">No notifications</p>
                      ) : (
                        notifications.slice(0, 20).map((n) => (
                          <Link
                            key={n.id}
                            to={n.link || '#'}
                            onClick={() => { markRead(n.id); setShowNotifications(false); }}
                            className={cn(
                              'block px-4 py-3 border-b border-[#E8ECF1] hover:bg-gray-50 transition-colors',
                              !n.isRead && 'bg-[#5B5FEF]/[0.03]'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                                n.isRead ? 'bg-transparent' : 'bg-[#5B5FEF]'
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2.5 pl-3 border-l border-[#E8ECF1] py-1 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {user?.employee?.firstName || 'User'} {user?.employee?.lastName || ''}
                    </p>
                    <p className="text-[11px] text-gray-400 capitalize font-medium">{user?.role}</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5B5FEF] to-[#7C80F2] flex items-center justify-center shadow-sm">
                    <span className="text-sm font-bold text-white">{userInitials}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#E8ECF1] z-50 py-1">
                    <div className="px-4 py-3 border-b border-[#E8ECF1]">
                      <p className="text-sm font-medium text-gray-900">{user?.employee?.firstName} {user?.employee?.lastName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="w-4 h-4 text-gray-400" />
                      Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-5 lg:p-7 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Live Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
