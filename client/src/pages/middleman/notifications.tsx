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

const MiddlemanNotifications: React.FC = () => {
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
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Bell className="text-purple-500 w-7 h-7" />
            Notifications
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Dispatch assignments, receipt confirmations, and transaction updates.
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

      {loading && notifications.length === 0 ? (
        <div className="min-h-[40vh] flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {notifications.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Inbox className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <p className="font-bold text-base">No Notifications</p>
              <p className="text-sm mt-0.5">You're all caught up.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 flex items-start gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                  !notification.isRead ? 'bg-purple-500/[0.02]' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  notification.type === 'RECEIPT_CONFIRMED'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : notification.type === 'MIDDLEMAN_FORWARDED'
                    ? 'bg-purple-500/10 text-purple-500'
                    : 'bg-amber-500/10 text-amber-500'
                }`}>
                  {notification.type === 'RECEIPT_CONFIRMED' ? (
                    <Check className="w-5 h-5" />
                  ) : notification.type === 'MIDDLEMAN_FORWARDED' ? (
                    <Info className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className={`text-sm font-bold text-slate-900 dark:text-white ${
                      !notification.isRead ? 'font-extrabold' : ''
                    }`}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {notification.message}
                  </p>
                </div>

                {!notification.isRead && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-400 hover:text-purple-500 rounded-lg transition-colors border border-slate-100 dark:border-slate-800 cursor-pointer"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default MiddlemanNotifications;
