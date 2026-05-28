import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import type { LedgerEntry, Site } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  BookOpen,
  Building2,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

const OwnerLedger: React.FC = () => {
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters State
  const [siteFilter, setSiteFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const [sitesRes, ledgerRes]: any = await Promise.all([
        api.get('/api/sites'),
        api.get(buildLedgerUrl()),
      ]);

      setSites(sitesRes.data || sitesRes || []);
      setLedger(ledgerRes.data || ledgerRes || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load ledger data.');
    } finally {
      setLoading(false);
    }
  };

  const buildLedgerUrl = () => {
    let url = `/api/ledger?limit=200`;
    if (siteFilter) url += `&siteId=${siteFilter}`;
    if (typeFilter) url += `&transactionType=${typeFilter}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return url;
  };

  useEffect(() => {
    fetchData();
  }, [siteFilter, typeFilter, startDate, endDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLedgerData();
  };

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get(buildLedgerUrl());
      setLedger(res.data || res || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to query ledger.');
    } finally {
      setLoading(false);
    }
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredLedger = ledger.filter((entry) => {
    if (!search.trim()) return true;
    return entry.description?.toLowerCase().includes(search.toLowerCase());
  });

  const {
    paginatedData: paginatedLedger,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
  } = usePagination(filteredLedger, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <BookOpen className="text-amber-500 w-7 h-7" />
          Central Ledger Control
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Full immutable audit trail tracking all cash dispatches, confirms, and site expenses.
        </p>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-sm rounded-xl border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters Panel */}
      <form onSubmit={handleSearchSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search descriptions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">All Construction Sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none cursor-pointer"
          >
            <option value="">All Transaction Types</option>
            <option value="CASH_RECEIVED">Cash Receipts</option>
            <option value="EXPENSE">Expenses</option>
            <option value="ADJUSTMENT">Adjustments</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">From</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">To</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold"
            />
          </div>
        </div>
      </form>

      {/* Grid List */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Site / Location</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Debit (-)</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Credit (+)</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Wallet Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-450">
                      No central ledger records found matching these criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedLedger.map((entry) => {
                    const isCredit = Number(entry.credit) > 0;
                    const isDebit = Number(entry.debit) > 0;

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 text-xs text-slate-450 font-semibold whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(entry.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-sm text-slate-900 dark:text-white">
                          <Link
                            to={`/owner/sites/${entry.siteId}`}
                            className="flex items-center gap-1.5 text-amber-500 hover:text-amber-600 hover:underline"
                          >
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span>{entry.site?.name}</span>
                          </Link>
                          <span className="text-[10px] font-bold text-slate-400 block mt-0.5">{entry.site?.code}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {entry.description}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isCredit
                              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                              : isDebit
                              ? 'bg-rose-50/10 text-rose-500'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-550'
                          }`}>
                            {isCredit ? (
                              <ArrowDownLeft className="w-3 h-3" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3" />
                            )}
                            {entry.transactionType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-sm text-rose-550">
                          {isDebit ? `-₹${Number(entry.debit).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-sm text-emerald-600 dark:text-emerald-455">
                          {isCredit ? `+₹${Number(entry.credit).toLocaleString('en-IN')}` : '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-sm text-slate-900 dark:text-white">
                          {formatCurrency(Number(entry.balanceAfter))}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {filteredLedger.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={totalItems}
              itemsPerPage={10}
            />
          )}
        </div>
      )}
    </div>
  );
};

export default OwnerLedger;
