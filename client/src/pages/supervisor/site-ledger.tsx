import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { Site, LedgerEntry } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  BookOpen,
  Building2,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
} from 'lucide-react';

const SupervisorSiteLedger: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pagination & Filtering
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const fetchSites = async () => {
    try {
      setLoadingSites(true);
      const sitesData: any = await api.get('/api/sites');
      const activeSites = (sitesData.data || sitesData || []).filter((s: Site) => s.status === 'ACTIVE');
      setSites(activeSites);

      if (activeSites.length > 0) {
        setSelectedSiteId(activeSites[0].id);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch assigned sites.');
    } finally {
      setLoadingSites(false);
    }
  };

  const fetchSiteLedger = async (siteId: string) => {
    if (!siteId) return;
    try {
      setLoadingLedger(true);
      setErrorMsg('');
      
      let url = `/api/ledger/site/${siteId}?limit=100`;
      if (typeFilter) {
        url += `&transactionType=${typeFilter}`;
      }
      
      const ledgerData: any = await api.get(url);
      setLedger(ledgerData.data || ledgerData || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch ledger entries.');
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      fetchSiteLedger(selectedSiteId);
    }
  }, [selectedSiteId, typeFilter]);

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

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div className="space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="text-amber-500 w-7 h-7 flex-shrink-0" />
            Site-Level Running Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Audit credit, debit, and running wallet logs for your assigned construction locations.
          </p>
        </div>

        {/* Site Switcher */}
        {!loadingSites && sites.length > 1 && (
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-[200px] sm:min-w-0 max-w-full">
            <Building2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <select
              value={selectedSiteId}
              onChange={(e) => setSelectedSiteId(e.target.value)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold cursor-pointer truncate max-w-full"
            >
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-sm rounded-xl border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loadingSites ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <>
          {/* Site budget summary card */}
          {selectedSite && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border-l-4 border-l-amber-500">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 rounded-xl flex items-center justify-center font-bold">
                  {selectedSite.code}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-none">{selectedSite.name}</h3>
                  <span className="text-xs text-slate-400 font-semibold">{selectedSite.location}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-8">
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">Wallet Balance</span>
                  <span className="text-2xl font-extrabold text-amber-500 dark:text-amber-400">
                    {formatCurrency(Number(selectedSite.currentBalance))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
              <input
                type="text"
                placeholder="Search transaction description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none"
              >
                <option value="">All Transactions</option>
                <option value="CASH_RECEIVED">Cash Receipts only</option>
                <option value="EXPENSE">Expenses only</option>
                <option value="ADJUSTMENT">Adjustments only</option>
              </select>
            </div>
          </div>

          {/* Ledger Table */}
          {loadingLedger ? (
            <div className="min-h-[25vh] flex items-center justify-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
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
                        <td colSpan={6} className="text-center py-12 text-slate-450">
                          No ledger entries logged matching filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedLedger.map((entry) => {
                        const isCredit = Number(entry.credit) > 0;
                        const isDebit = Number(entry.debit) > 0;

                        return (
                          <tr key={entry.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                            <td className="px-6 py-4 text-xs text-slate-450 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDate(entry.createdAt)}</span>
                              </div>
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
                            <td className="px-6 py-4 text-right font-extrabold text-sm text-emerald-600 dark:text-emerald-450">
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
            </div>
          )}
          {!loadingLedger && filteredLedger.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={totalItems}
              itemsPerPage={10}
            />
          )}
        </>
      )}
    </div>
  );
};

export default SupervisorSiteLedger;
