import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth-store';
import { useNotificationStore } from '../../stores/notification-store';
import {
  LayoutDashboard,
  Building2,
  Send,
  Receipt,
  FileSpreadsheet,
  BookOpen,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  ArrowRightLeft,
} from 'lucide-react';

import { toast } from 'react-hot-toast';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, token, logout } = useAuthStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const prevUnreadCountRef = React.useRef(unreadCount);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Toast notification logic
  useEffect(() => {
    if (unreadCount > prevUnreadCountRef.current) {
      toast.success(`You have a new update!`, {
        icon: '🔔',
        duration: 4000,
        style: {
          borderRadius: '12px',
          background: darkMode ? '#1e293b' : '#fff',
          color: darkMode ? '#fff' : '#0f172a',
        },
      });
    }
    prevUnreadCountRef.current = unreadCount;
  }, [unreadCount, darkMode]);

  useEffect(() => {
    if (user && token) {
      // Fetch initial unread count on mount
      fetchUnreadCount();

      // Poll for updates every 15 seconds
      const pollInterval = setInterval(() => {
        // Dispatch dashboard_update event to trigger active dashboard refresh
        window.dispatchEvent(new CustomEvent('dashboard_update'));
        
        // Refresh unread notifications count
        fetchUnreadCount();
      }, 15000);

      return () => {
        clearInterval(pollInterval);
      };
    }
  }, [user, token]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getMenuItems = () => {
    if (user?.role === 'OWNER') {
      return [
        { label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
        { label: 'Construction Sites', path: '/owner/sites', icon: Building2 },
        { label: 'User Management', path: '/owner/users', icon: UserIcon },
        { label: 'Cash Dispatch', path: '/owner/dispatch', icon: Send },
        { label: 'Site Transfers', path: '/owner/transfers', icon: ArrowRightLeft },
        { label: 'All Expenses', path: '/owner/expenses', icon: Receipt },
        { label: 'Central Ledger', path: '/owner/ledger', icon: BookOpen },
        { label: 'Analytics Reports', path: '/owner/reports', icon: FileSpreadsheet },
      ];
    } else if (user?.role === 'MIDDLEMAN') {
      return [
        { label: 'Dashboard', path: '/middleman/dashboard', icon: LayoutDashboard },
        { label: 'Dispatches', path: '/middleman/dispatches', icon: ArrowRightLeft },
        { label: 'My Ledger', path: '/middleman/ledger', icon: BookOpen },
      ];
    } else {
      return [
        { label: 'Site Dashboard', path: '/supervisor/dashboard', icon: LayoutDashboard },
        { label: 'Confirm Receipts', path: '/supervisor/receipts', icon: Send },
        { label: 'Site Transfers', path: '/supervisor/transfers', icon: ArrowRightLeft },
        { label: 'Add Expense', path: '/supervisor/expenses', icon: Receipt },
        { label: 'Site Ledger', path: '/supervisor/ledger', icon: BookOpen },
      ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 transition-colors duration-300">
        {/* Brand Logo */}
        <div className="h-20 flex items-center px-8 border-b border-slate-200 dark:border-slate-800 gap-3">
          <div className="w-10 h-10 rounded-xl gradient-orange-amber flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Building2 className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white leading-none">CASHFLOW</h1>
            <span className="text-[10px] text-amber-500 dark:text-amber-400 font-semibold tracking-widest uppercase">{user?.role ? `${user.role} PORTAL` : 'SITE MANAGER'}</span>
          </div>
        </div>

        {/* User Card */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</h2>
              <span className="text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'gradient-orange-amber text-white shadow-lg shadow-amber-500/20 scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Header & Main Mobile layout */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 md:px-10 z-10 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850"
            >
              <Menu className="w-6 h-6 text-slate-600 dark:text-slate-300" />
            </button>
            <div className="hidden md:block">
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Workspace</span>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
                {location.pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Button */}
            <Link
              to={user?.role === 'OWNER' ? '/owner/notifications' : user?.role === 'MIDDLEMAN' ? '/middleman/notifications' : '/supervisor/notifications'}
              className="relative p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>

            {/* Quick Profile display */}
            <div className="relative">
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-3 focus:outline-none"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center font-bold text-slate-700 dark:text-slate-350 shadow-inner cursor-pointer">
                  <UserIcon className="w-5 h-5" />
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar Slider */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="relative flex flex-col w-72 max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl p-6 border-r border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setSidebarOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>

              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl gradient-orange-amber flex items-center justify-center">
                  <Building2 className="text-white w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">CASHFLOW</h1>
                  <span className="text-[10px] text-amber-500 font-semibold tracking-wider uppercase">{user?.role ? `${user.role} PORTAL` : 'SITE MANAGER'}</span>
                </div>
              </div>

              <nav className="flex-1 space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'gradient-orange-amber text-white shadow-lg shadow-amber-500/20'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 flex items-center justify-between">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                >
                  {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Main Content Pane */}
        <main className="flex-1 p-4 sm:p-6 md:p-10 overflow-y-auto">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
