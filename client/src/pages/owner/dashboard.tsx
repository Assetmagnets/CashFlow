import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { downloadExpensesPDF } from '../../lib/pdf-utils';
import api from '../../lib/api';
import type { DashboardStats } from '../../types';
import {
  Building2,
  TrendingUp,
  Truck,
  IndianRupee,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Loader2,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const OwnerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const data: any = await api.get('/api/dashboard/owner');
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch dashboard metrics.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(false);

    const handleUpdate = () => {
      fetchStats(true);
    };

    window.addEventListener('dashboard_update', handleUpdate);
    return () => {
      window.removeEventListener('dashboard_update', handleUpdate);
    };
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleDownloadPDF = async () => {
    try {
      setPdfGenerating(true);
      // Fetch last 30 days of expenses for all sites
      const d = new Date();
      d.setDate(d.getDate() - 30);
      const startDate = d.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];
      
      const res: any = await api.get(`/api/expenses?startDate=${startDate}&endDate=${endDate}&limit=1000`);
      const expenseData = res.data || res || [];
      
      if (!expenseData.length) {
        alert('No expenses found in the last 30 days.');
        return;
      }
      
      downloadExpensesPDF(expenseData, 'Monthly Dashboard Report', `All Sites | Period: ${startDate} to ${endDate}`);
    } catch (err: any) {
      alert(err.message || 'Failed to download PDF.');
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="text-slate-500 font-medium">Aggregating Portfolio Financials...</p>
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

  // Predefined gorgeous colors for charts
  const CHART_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#64748b'];

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-colors">
        <div>
          <span className="text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-widest">Construction Admin Desk</span>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">Hello, {user?.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Here is the real-time operational status of all active sites.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            {new Date().toLocaleDateString('default', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-70 transition-colors w-full sm:w-auto"
          >
            {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF Report
          </button>
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:scale-[1.01] transition-transform">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-inner">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Sites</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{stats.activeSitesCount}</h3>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:scale-[1.01] transition-transform">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
            <IndianRupee className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cash at Sites</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(stats.totalCashAtSites)}</h3>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:scale-[1.01] transition-transform">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-inner">
            <Truck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cash in Transit</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(stats.totalCashInTransit)}</h3>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex items-center gap-5 hover:scale-[1.01] transition-transform">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
            <TrendingDown className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Expenses</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">{formatCurrency(stats.totalExpenses)}</h3>
          </div>
        </div>
      </div>

      {/* Analytics Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Monthly Spending Trend AreaChart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp className="text-amber-500 w-5 h-5" />
              Cash Outflow Trend (Past 6 Months)
            </h3>
          </div>
          <div className="h-80 w-full text-xs">
            {stats.monthlyExpenses.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No expense trend data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                <AreaChart data={stats.monthlyExpenses} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" tickFormatter={(v) => `₹${v / 1000}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)' }}
                    itemStyle={{ color: '#e2e8f0', fontWeight: 600 }}
                    labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}
                    formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Disbursed']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorAmt)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category breakdown Donut Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Layers className="text-amber-500 w-5 h-5" />
            Category-wise Allocation
          </h3>
          <div className="h-80 w-full relative flex flex-col justify-center">
            {stats.categoryExpenses.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">No expense records created yet.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height="70%" minHeight={1}>
                  <PieChart>
                    <Pie
                      data={stats.categoryExpenses}
                      innerRadius={65}
                      outerRadius={85}
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
                {/* Custom Legend */}
                <div className="grid grid-cols-2 gap-2 mt-4 px-2 overflow-y-auto max-h-[100px]">
                  {stats.categoryExpenses.map((cat, idx) => (
                    <div key={cat.category} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 truncate">{cat.category}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Action tables / live feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Dispatches */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/50 pb-4">
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Cash Dispatches</h3>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            {stats.recentDispatches.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No dispatches logged.</div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-xs text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800/50 pb-2">
                    <th className="py-2">Site / Carrier</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentDispatches.map((disp) => (
                    <tr key={disp.id} className="border-b border-slate-50 dark:border-slate-800/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3">
                        <span className="font-bold text-slate-800 dark:text-white block">{disp.site?.name}</span>
                        <span className="text-[11px] text-slate-400">{disp.carrierName}</span>
                      </td>
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
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
            <h3 className="font-bold text-slate-900 dark:text-white">Recent Expenses</h3>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
          <div className="overflow-x-auto">
            {stats.recentExpenses.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-sm">No expenses recorded.</div>
            ) : (
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="text-xs text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800/50 pb-2">
                    <th className="py-2">Site / Vendor</th>
                    <th className="py-2">Category</th>
                    <th className="py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentExpenses.map((exp) => (
                    <tr key={exp.id} className="border-b border-slate-50 dark:border-slate-800/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3">
                        <span className="font-bold text-slate-800 dark:text-white block">{exp.site?.name}</span>
                        <span className="text-[11px] text-slate-400">{exp.vendorName}</span>
                      </td>
                      <td className="py-3">
                        <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-355 rounded-md">
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
    </div>
  );
};

export default OwnerDashboard;
