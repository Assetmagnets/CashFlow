import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import api from '../../lib/api';
import type { MiddlemanStats } from '../../types';
import {
  ArrowRightLeft,
  IndianRupee,
  Clock,
  CheckCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';

const MiddlemanDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<MiddlemanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const data: any = await api.get('/api/dashboard/middleman');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(false);

    const handleUpdate = () => fetchStats(true);
    window.addEventListener('dashboard_update', handleUpdate);
    return () => window.removeEventListener('dashboard_update', handleUpdate);
  }, []);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'PENDING_MIDDLEMAN':
        return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
      case 'PENDING_RECEIPT':
        return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto" />
          <p className="text-slate-500 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30">
        <h2 className="font-bold text-lg mb-1">Failed to load dashboard</h2>
        <p className="text-sm">{error || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <span className="text-xs font-semibold text-purple-500 dark:text-purple-400 uppercase tracking-widest">Middleman Portal</span>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Hello, {user?.name}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Process dispatches, deduct your commission, and forward cash to sites.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processed</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.totalProcessed}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <IndianRupee className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Commission Earned</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(stats.totalCommissionEarned)}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Forwarded</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(stats.totalAmountForwarded)}</h3>
          </div>
        </div>
      </div>

      {/* Recent Dispatches Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="font-bold text-slate-900 dark:text-white">Recent Dispatches</h3>
        </div>
        <div className="overflow-x-auto">
          {stats.recentDispatches.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-lg font-bold">No dispatches assigned yet</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/50">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">From / Site</th>
                  <th className="px-6 py-4">Original</th>
                  <th className="px-6 py-4">Commission</th>
                  <th className="px-6 py-4">Forwarded</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentDispatches.map((disp) => (
                  <tr key={disp.id} className="border-b border-slate-100 dark:border-slate-800/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(disp.dispatchDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 dark:text-white block">{disp.createdBy?.name}</span>
                      <span className="text-[11px] text-slate-400">→ {disp.site?.name}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(Number(disp.amount))}
                    </td>
                    <td className="px-6 py-4">
                      {disp.commissionAmount && Number(disp.commissionAmount) > 0 ? (
                        <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(Number(disp.commissionAmount))}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                      {disp.amountAfterCommission ? formatCurrency(Number(disp.amountAfterCommission)) : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusBadge(disp.status)}`}>
                        {disp.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default MiddlemanDashboard;
