import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import type { Site, CashDispatch, Expense, LedgerEntry } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  ArrowLeft,
  MapPin,
  User as UserIcon,
  Send,
  Loader2,
  AlertCircle,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

const OwnerSiteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [site, setSite] = useState<Site | null>(null);
  const [dispatches, setDispatches] = useState<CashDispatch[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [activeTab, setActiveTab] = useState<'DISPATCH' | 'EXPENSE' | 'LEDGER'>('DISPATCH');

  // Pagination for Dispatches
  const dispatchesPagination = usePagination(dispatches, 10);
  
  // Pagination for Expenses
  const approvedExpenses = expenses.filter((e) => e.status === 'APPROVED');
  const expensesPagination = usePagination(approvedExpenses, 10);
  
  // Pagination for Ledger
  const ledgerPagination = usePagination(ledger, 10);

  const fetchSiteDetails = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setErrorMsg('');

      // Fetch site details, dispatches, expenses, and site ledger
      const [siteRes, dispatchesRes, expensesRes, ledgerRes]: any = await Promise.all([
        api.get(`/api/sites/${id}`),
        api.get(`/api/dispatches?siteId=${id}&limit=100`),
        api.get(`/api/expenses?siteId=${id}&limit=100`),
        api.get(`/api/ledger/site/${id}?limit=100`),
      ]);

      setSite(siteRes);
      setDispatches(dispatchesRes.data || dispatchesRes || []);
      setExpenses(expensesRes.data || expensesRes || []);
      setLedger(ledgerRes.data || ledgerRes || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch site details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSiteDetails();
  }, [id]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
      </div>
    );
  }

  if (errorMsg || !site) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => navigate('/owner/sites')}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Sites
        </button>
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-sm rounded-xl border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg || 'Construction site not found.'}</span>
        </div>
      </div>
    );
  }

  // Calculate Metrics
  const totalDispatched = dispatches.reduce((acc, curr) => acc + Number(curr.amount), 0);
  
  const totalReceived = dispatches
    .filter((d) => d.status === 'RECEIVED' || d.status === 'PARTIAL_RECEIVED')
    .reduce((acc, curr) => acc + (curr.receipt ? Number(curr.receipt.receivedAmount) : 0), 0);
  
  const totalSpent = expenses
    .filter((e) => e.status === 'APPROVED')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  const pendingDispatched = dispatches
    .filter((d) => d.status === 'PENDING_RECEIPT')
    .reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <div className="space-y-8">
      {/* Back button & Title Header */}
      <div className="space-y-4">
        <Link
          to="/owner/sites"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Construction Sites
        </Link>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl flex items-center justify-center font-extrabold text-lg shadow-inner">
              {site.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  {site.name}
                </h1>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  site.status === 'ACTIVE'
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-rose-50/10 text-rose-500'
                }`}>
                  {site.status}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{site.location}</span>
              </div>
            </div>
          </div>

          {/* Running wallet balance */}
          <div className="flex items-center gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 dark:border-slate-800">
            <div className="text-right">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Wallet balance</span>
              <span className="text-2xl font-extrabold text-amber-500 dark:text-amber-400 mt-1 block">
                {formatCurrency(Number(site.currentBalance))}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Supervisor */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-500">
            <UserIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Site Supervisor</span>
            <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">
              {site.supervisor?.name || 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Total Dispatched */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Dispatched</span>
            <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">
              {formatCurrency(totalDispatched)}
            </span>
            {pendingDispatched > 0 && (
              <span className="text-[10px] text-amber-500 font-semibold block">
                ₹{pendingDispatched.toLocaleString('en-IN')} in-transit
              </span>
            )}
          </div>
        </div>

        {/* Total Confirmed Received */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Received</span>
            <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">
              {formatCurrency(totalReceived)}
            </span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Approved Expenses</span>
            <span className="text-base font-bold text-slate-900 dark:text-white block mt-0.5">
              {formatCurrency(totalSpent)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs list: Dispatches vs Expenses vs Ledger */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('DISPATCH')}
          className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all relative ${
            activeTab === 'DISPATCH'
              ? 'text-amber-500'
              : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-350'
          }`}
        >
          Historical Dispatches ({dispatches.length})
          {activeTab === 'DISPATCH' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('EXPENSE')}
          className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all relative ${
            activeTab === 'EXPENSE'
              ? 'text-amber-500'
              : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-350'
          }`}
        >
          Approved Expenses ({expenses.filter((e) => e.status === 'APPROVED').length})
          {activeTab === 'EXPENSE' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all relative ${
            activeTab === 'LEDGER'
              ? 'text-amber-500'
              : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-350'
          }`}
        >
          Site Ledger ({ledger.length})
          {activeTab === 'LEDGER' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        {activeTab === 'DISPATCH' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Carrier</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount Dispatched</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Received Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {dispatches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      No cash dispatches recorded for this site.
                    </td>
                  </tr>
                ) : (
                  dispatchesPagination.paginatedData.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 text-xs text-slate-450 font-semibold">{formatDate(d.dispatchDate)}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{d.carrierName}</td>
                      <td className="px-6 py-4 text-xs text-slate-500">{d.purpose}</td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-900 dark:text-white text-sm">
                        {formatCurrency(Number(d.amount))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          d.status === 'RECEIVED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                            : d.status === 'PENDING_RECEIPT'
                            ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20'
                            : 'bg-rose-50/10 text-rose-500'
                        }`}>
                          {d.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-sm text-emerald-600 dark:text-emerald-450">
                        {d.receipt ? formatCurrency(Number(d.receipt.receivedAmount)) : '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {dispatches.length > 0 && (
              <Pagination
                currentPage={dispatchesPagination.currentPage}
                totalPages={dispatchesPagination.totalPages}
                onPageChange={dispatchesPagination.goToPage}
                totalItems={dispatchesPagination.totalItems}
                itemsPerPage={10}
              />
            )}
          </div>
        )}

        {activeTab === 'EXPENSE' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {expenses.filter((e) => e.status === 'APPROVED').length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      No approved expenses recorded for this site.
                    </td>
                  </tr>
                ) : (
                  expensesPagination.paginatedData.map((e) => (
                      <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 text-xs text-slate-450 font-semibold">{formatDate(e.expenseDate)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-200">{e.vendorName}</td>
                        <td className="px-6 py-4 text-xs font-semibold text-amber-500 uppercase">{e.category?.name}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-[250px] truncate">{e.description || '—'}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-rose-500 text-sm">
                          - {formatCurrency(Number(e.amount))}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
            {approvedExpenses.length > 0 && (
              <Pagination
                currentPage={expensesPagination.currentPage}
                totalPages={expensesPagination.totalPages}
                onPageChange={expensesPagination.goToPage}
                totalItems={expensesPagination.totalItems}
                itemsPerPage={10}
              />
            )}
          </div>
        )}

        {activeTab === 'LEDGER' && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Debit (-)</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Credit (+)</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Wallet Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400">
                      No ledger transactions logged for this site.
                    </td>
                  </tr>
                ) : (
                  ledgerPagination.paginatedData.map((entry) => {
                    const isCredit = Number(entry.credit) > 0;
                    const isDebit = Number(entry.debit) > 0;
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 text-xs text-slate-450 font-semibold">{formatDate(entry.createdAt)}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-850 dark:text-slate-200">{entry.description}</td>
                        <td className="px-6 py-4 text-right font-extrabold text-sm text-rose-500">
                          {isDebit ? `-₹${Number(entry.debit).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-sm text-emerald-650 dark:text-emerald-450">
                          {isCredit ? `+₹${Number(entry.credit).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-sm text-slate-900 dark:text-white font-mono">
                          {formatCurrency(Number(entry.balanceAfter))}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {ledger.length > 0 && (
              <Pagination
                currentPage={ledgerPagination.currentPage}
                totalPages={ledgerPagination.totalPages}
                onPageChange={ledgerPagination.goToPage}
                totalItems={ledgerPagination.totalItems}
                itemsPerPage={10}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerSiteDetails;
