import React, { useEffect } from 'react';
import { useNotificationStore } from '../../stores/notification-store';
import {
  Bell,
  Check,
  Calendar,
  AlertCircle,
  Loader2,
  Inbox,
  Info,
} from 'lucide-react';

const SupervisorNotifications: React.FC = () => {
  const {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-amber-500 w-7 h-7" />
            Site Alerts Inbox
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time critical balance alerts, cash dispatches in-transit, and expense approvals.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            <Check className="w-4 h-4 text-emerald-500" />
            Mark All as Read
          </button>
        )}
      </div>

      {/* List Container */}
      {loading && notifications.length === 0 ? (
        <div className="min-h-[40vh] flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-850">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-slate-450">
              <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="font-bold text-base">Your Inbox is Empty</p>
              <p className="text-sm mt-0.5">There are no notifications or alerts logged for you.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.isRead) {
                    markAsRead(notification.id);
                  }
                }}
                className={`p-6 flex items-start gap-4 transition-colors ${
                  !notification.isRead 
                    ? 'hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-amber-500/[0.02] dark:bg-amber-500/[0.02] cursor-pointer' 
                    : ''
                }`}
              >
                {/* Visual indicator type */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  notification.type === 'LOW_BALANCE'
                    ? 'bg-rose-500/10 text-rose-500'
                    : notification.type === 'EXPENSE_REJECTED'
                    ? 'bg-rose-500/10 text-rose-500'
                    : notification.type === 'EXPENSE_APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {notification.type === 'LOW_BALANCE' || notification.type === 'EXPENSE_REJECTED' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`text-sm font-bold text-slate-900 dark:text-white ${
                      !notification.isRead ? 'font-extrabold' : ''
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] text-slate-450 font-semibold whitespace-nowrap flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SupervisorNotifications;
