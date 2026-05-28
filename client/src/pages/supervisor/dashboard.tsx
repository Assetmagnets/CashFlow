import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { SupervisorStats } from '../../types';
import { Link } from 'react-router-dom';
import {
  MapPin,
  TrendingUp,
  Receipt,
  BookOpen,
  IndianRupee,
  Layers,
  ArrowRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const SupervisorDashboard: React.FC = () => {
  const [stats, setStats] = useState<SupervisorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  const fetchStats = async (siteId?: string, isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const query = siteId ? `?siteId=${siteId}` : '';
      const data: any = await api.get(`/api/dashboard/supervisor${query}`);
      setStats(data);
      if (data && data.siteId && !selectedSiteId) {
        setSelectedSiteId(data.siteId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch site statistics.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(undefined, false);
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      fetchStats(selectedSiteId, true);
    };

    window.addEventListener('dashboard_update', handleUpdate);
    return () => {
      window.removeEventListener('dashboard_update', handleUpdate);
    };
  }, [selectedSiteId]);

  const handleSiteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSiteId = e.target.value;
    setSelectedSiteId(newSiteId);
    fetchStats(newSiteId);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="text-slate-500 font-medium">Loading Site Financials...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-900/30">
        <h2 className="font-bold text-lg mb-1">Failed to load dashboard data</h2>
        <p className="text-sm">{error || 'An unexpected error occurred.'}</p>
      </div>
    );
  }

  if (!stats.hasSite) {
    return (
      <div className="p-8 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-2xl border border-amber-150/60 dark:border-amber-900/30 flex items-start gap-4 max-w-2xl mx-auto">
        <AlertTriangle className="w-8 h-8 flex-shrink-0" />
        <div>
          <h2 className="font-bold text-lg">No Construction Site Assigned</h2>
          <p className="text-sm mt-1">
            You do not currently have a construction site assigned to your account. Please contact the administrator/owner to assign a site to you to start tracking cash flow and managing expenses.
          </p>
        </div>
      </div>
    );
  }

  const CHART_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-8">
      {/* Site Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-colors flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-4 w-full lg:w-auto">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full uppercase tracking-wider block">
              Active Site: {stats.siteCode}
            </span>
            {stats.assignedSites && stats.assignedSites.length > 1 && (
              <div className="w-full sm:w-auto min-w-[200px] sm:min-w-0 max-w-full">
                <select
                  value={selectedSiteId}
                  onChange={handleSiteChange}
                  className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-xs font-semibold cursor-pointer truncate max-w-full"
                >
                  {stats.assignedSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="w-full">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white break-words pr-2">
              {stats.siteName}
            </h1>
            <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400 text-sm mt-1 w-full">
              <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <span className="break-words leading-tight">{stats.siteLocation}</span>
            </div>
          </div>
        </div>

        {/* Quick action shortcuts */}
        <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap gap-3 w-full lg:w-auto">
          <Link
            to="/supervisor/receipts"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-center whitespace-nowrap"
          >
            <TrendingUp className="w-4 h-4 flex-shrink-0" />
            Confirm Cash Receipt
          </Link>
          <Link
            to="/supervisor/expenses"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white dark:text-slate-100 font-bold text-sm shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all text-center whitespace-nowrap"
          >
            <Receipt className="w-4 h-4 flex-shrink-0" />
            Log New Expense
          </Link>
          <Link
            to="/supervisor/ledger"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-semibold text-sm hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-center whitespace-nowrap"
          >
            <BookOpen className="w-4 h-4 flex-shrink-0" />
            View Ledger
          </Link>
        </div>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Site Wallet Card */}
        <div className="gradient-orange-amber p-8 rounded-2xl text-white shadow-xl shadow-amber-500/10 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:16px_16px]" />
          <div>
            <span className="text-xs text-white/70 uppercase tracking-wider font-semibold">Running Wallet Balance</span>
            <h3 className="text-3xl font-black mt-1">{formatCurrency(stats.currentBalance || 0)}</h3>
          </div>
          {stats.currentBalance !== undefined && stats.currentBalance < 5000 && (
            <div className="mt-4 flex items-center gap-1.5 text-xs bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20 font-bold">
              <AlertTriangle className="w-4 h-4" />
              Low site balance! Please request dispatch.
            </div>
          )}
        </div>

        {/* Total Cash Received */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <IndianRupee className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Cash Received</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalReceived || 0)}</h3>
          </div>
        </div>

        {/* Total Expenses Logged */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-6">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Receipt className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Spent (Expenses)</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">{formatCurrency(stats.totalSpent || 0)}</h3>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Recent Dispatches & Expenses Tables */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Dispatches */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Dispatches to Site</h3>
              <Link to="/supervisor/receipts" className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1">
                View All
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {stats.recentDispatches.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No dispatches to show.</div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-xs text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800/50 pb-2">
                      <th className="py-2">Date / Carrier</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentDispatches.map((disp) => (
                      <tr key={disp.id} className="border-b border-slate-50 dark:border-slate-800/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3">
                          <span className="font-bold text-slate-800 dark:text-white block">
                            {new Date(disp.dispatchDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[11px] text-slate-400">{disp.carrierName}</span>
                        </td>
                        <td className="py-3 font-semibold text-slate-800 dark:text-slate-250">
                          {formatCurrency(Number(disp.amount))}
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            disp.status === 'RECEIVED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                          }`}>
                            {disp.status.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Expenses */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-4">
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Logged Expenses</h3>
              <Link to="/supervisor/ledger" className="text-xs font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1">
                View Ledger
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              {stats.recentExpenses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No expenses logged yet.</div>
              ) : (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="text-xs text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800/50 pb-2">
                      <th className="py-2">Date / Vendor</th>
                      <th className="py-2">Category</th>
                      <th className="py-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentExpenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-slate-50 dark:border-slate-800/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3">
                          <span className="font-bold text-slate-800 dark:text-white block">
                            {new Date(exp.expenseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[11px] text-slate-400 truncate max-w-[120px] block">{exp.vendorName}</span>
                        </td>
                        <td className="py-3">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                            {exp.category?.name}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-rose-600 dark:text-rose-400">
                          -{formatCurrency(Number(exp.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Category Allocations */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-6">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Layers className="text-amber-500 w-5 h-5" />
            Site Category Spending
          </h3>
          <div className="h-64 w-full relative flex flex-col justify-center border-b border-slate-100 dark:border-slate-800/30 pb-6">
            {stats.categoryExpenses.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No category allocations available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <PieChart>
                  <Pie
                    data={stats.categoryExpenses}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="amount"
                    nameKey="category"
                  >
                    {stats.categoryExpenses.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}
                    itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                    formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
            {stats.categoryExpenses.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-4">Create your first expense to see analysis.</p>
            ) : (
              stats.categoryExpenses.map((cat, idx) => (
                <div key={cat.category} className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{cat.category}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(cat.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
