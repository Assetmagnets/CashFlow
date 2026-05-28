import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { downloadExpensesPDF } from '../../lib/pdf-utils';
import type { Site } from '../../types';
import {
  FileSpreadsheet,
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
  Download,
  Printer,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

const OwnerReports: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters State
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30); // Last 30 days
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Chart Data State
  const [siteExpenses, setSiteExpenses] = useState<{ name: string; amount: number }[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<{ name: string; value: number }[]>([]);
  const [cashFlow, setCashFlow] = useState<{ date: string; credit: number; debit: number }[]>([]);

  const fetchChartData = async () => {
    try {
      setRefreshing(true);
      setErrorMsg('');

      let siteQuery = selectedSiteId ? `?siteId=${selectedSiteId}` : '';
      let dateQuery = `&startDate=${startDate}&endDate=${endDate}`;
      if (!siteQuery) {
        dateQuery = `?startDate=${startDate}&endDate=${endDate}`;
      }

      const [siteExpensesRes, categoryExpensesRes, cashFlowRes]: any = await Promise.all([
        api.get(`/api/reports/site-expenses?startDate=${startDate}&endDate=${endDate}`),
        api.get(`/api/reports/category-expenses${siteQuery}${dateQuery}`),
        api.get(`/api/reports/cash-flow${siteQuery}${dateQuery}`),
      ]);

      // Format Site Expenses
      const formattedSiteExpenses = (siteExpensesRes || []).map((s: any) => ({
        name: s.siteName,
        amount: Number(s.totalExpenses),
      }));
      setSiteExpenses(formattedSiteExpenses);

      // Format Category Expenses
      const formattedCategoryExpenses = (categoryExpensesRes || []).map((c: any) => ({
        name: c.categoryName,
        value: Number(c.totalExpenses),
      }));
      setCategoryExpenses(formattedCategoryExpenses);

      // Format Cash Flow
      const formattedCashFlow = (cashFlowRes || []).map((cf: any) => ({
        date: new Date(cf.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        credit: Number(cf.credit),
        debit: Number(cf.debit),
      }));
      setCashFlow(formattedCashFlow);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate analytical reports.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const sitesData: any = await api.get('/api/sites');
        setSites(sitesData.data || sitesData || []);
      } catch (err) {}
    };
    fetchSites();
  }, []);

  useEffect(() => {
    fetchChartData();
  }, [selectedSiteId, startDate, endDate]);

  const COLORS = ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6', '#EF4444', '#64748B'];

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
      setErrorMsg('');
      
      let siteQuery = selectedSiteId ? `siteId=${selectedSiteId}&` : '';
      const url = `/api/expenses?${siteQuery}startDate=${startDate}&endDate=${endDate}&limit=1000`;
      
      const res: any = await api.get(url);
      const expenseData = res.data || res || [];
      
      if (!expenseData.length) {
        setErrorMsg('No expenses found in this timeframe to generate a PDF.');
        return;
      }
      
      const siteName = selectedSiteId && sites.find(s => s.id === selectedSiteId)?.name;
      const subtitle = siteName 
        ? `Site: ${siteName} | Period: ${startDate} to ${endDate}`
        : `All Sites | Period: ${startDate} to ${endDate}`;
        
      downloadExpensesPDF(expenseData, 'Expenditure Report', subtitle);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to download PDF.');
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="space-y-8 print:p-0">
      {/* Header (Hide on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="text-amber-500 w-7 h-7" />
            Financial Analytics & Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time visual spending patterns, categorical cash distributions, and site-wise budgeting.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer disabled:opacity-70 transition-colors"
          >
            {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download PDF Report
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-sm rounded-xl border border-rose-100 dark:border-rose-900/30 print:hidden">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filter panel (Hide on print) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Building2 className="w-4.5 h-4.5 text-slate-400" />
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none"
            >
              <option value="">All Sites (Categorical only)</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4.5 h-4.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold"
            />
            <span className="text-slate-400 text-xs font-bold">—</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold"
            />
          </div>
        </div>

        <button
          onClick={fetchChartData}
          disabled={refreshing}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 disabled:opacity-55 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Site-wise Spending Bar Chart */}
          {!selectedSiteId && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Site-Wise Expenditure
              </h3>
              <div className="h-[300px]">
                {siteExpenses.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                    No spending data recorded in selected range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                    <BarChart data={siteExpenses} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `₹${value / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value) => [formatCurrency(Number(value)), 'Spent']}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1' }}
                      />
                      <Bar dataKey="amount" fill="#F59E0B" radius={[8, 8, 0, 0]} maxBarSize={45} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          )}

          {/* Category Expenditure Pie Chart */}
          <div className={`bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4 ${selectedSiteId ? 'lg:col-span-2' : ''}`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              {selectedSiteId ? 'Site Expenses' : 'Global Expenses'} by Category
            </h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 min-h-[300px]">
              {categoryExpenses.length === 0 ? (
                <div className="flex-1 text-center text-slate-400 text-xs italic py-12">
                  No data to display.
                </div>
              ) : (
                <>
                  <div className="w-full sm:w-[50%] h-[260px]">
                    <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                      <PieChart>
                        <Pie
                          data={categoryExpenses}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryExpenses.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="w-full sm:w-[45%] space-y-3">
                    {categoryExpenses.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-350">
                          <div
                            className="w-3.5 h-3.5 rounded-md"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-900 dark:text-white">
                          {formatCurrency(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Cash Flow Line Chart */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Cash Inflow vs Outflow History
            </h3>
            <div className="h-[300px]">
              {cashFlow.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
                  No cash flow records logged in this timeframe.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%" minHeight={1}>
                  <AreaChart data={cashFlow} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorCredit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorDebit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis
                      stroke="#64748B"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: '1px solid #CBD5E1' }}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      name="Cash Inflow (Credit)"
                      dataKey="credit"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorCredit)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      name="Expense (Debit)"
                      dataKey="debit"
                      stroke="#EF4444"
                      fillOpacity={1}
                      fill="url(#colorDebit)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerReports;
