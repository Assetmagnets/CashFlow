import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  BookOpen,
  Calendar,
  Loader2,
  AlertCircle,
  IndianRupee,
  ArrowRightLeft,
} from 'lucide-react';

interface MiddlemanLedgerEntry {
  id: string;
  transactionType: string;
  referenceType: string;
  referenceId: string;
  site: { id: string; name: string; code: string };
  receivedAmount: number;
  forwardedAmount: number;
  commissionEarned: number;
  status: string;
  date: string;
  description: string;
  createdBy: { id: string; name: string };
}

const MiddlemanLedger: React.FC = () => {
  const [ledger, setLedger] = useState<MiddlemanLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Filters State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const buildLedgerUrl = () => {
    let url = `/api/ledger/middleman?limit=200`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return url;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const res: any = await api.get(buildLedgerUrl());
      setLedger(res.data || res || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load ledger data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

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

  const {
    paginatedData,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
  } = usePagination(ledger, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-colors">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <BookOpen className="text-purple-500 w-8 h-8" />
            My Cash Flow Ledger
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
            Track all cash received, commissions earned, and amounts forwarded to sites.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <Calendar className="w-5 h-5 text-purple-500 ml-2" />
          <div className="flex items-center gap-2 mr-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-600 dark:text-slate-300 outline-none font-bold cursor-pointer"
            />
            <span className="text-slate-300 dark:text-slate-600 font-black">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-600 dark:text-slate-300 outline-none font-bold cursor-pointer"
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 rounded-xl border border-rose-100 dark:border-rose-900/30 font-semibold text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Ledger Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-purple-500" />
            Transaction History
          </h3>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-950 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
            Total Entries: {ledger.length}
          </span>
        </div>

        {loading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto" />
              <p className="text-slate-500 font-medium">Aggregating Transactions...</p>
            </div>
          </div>
        ) : ledger.length === 0 ? (
          <div className="text-center py-24 text-slate-450 bg-slate-50/20 dark:bg-slate-950/20">
            <ArrowRightLeft className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
            <p className="text-xl font-bold text-slate-900 dark:text-white">No Transactions Found</p>
            <p className="text-sm text-slate-550 mt-1 max-w-md mx-auto">
              You do not have any incoming or outgoing cash flows matching the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-200 dark:border-slate-850">
                  <th className="px-6 py-4 rounded-tl-lg">Date / Time</th>
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Cash Received</th>
                  <th className="px-6 py-4 text-right">Commission Taken</th>
                  <th className="px-6 py-4 text-right rounded-tr-lg">Cash Forwarded</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 dark:border-slate-800/30 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        {formatDate(entry.date).split(',')[0]}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {formatDate(entry.date).split(',')[1]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-white block line-clamp-1">
                        {entry.description}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <span className="font-semibold text-purple-600 dark:text-purple-400">{entry.site.name}</span>
                        <span>• From {entry.createdBy.name}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        entry.status === 'FORWARDED' ? 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' :
                        entry.status === 'RECEIVED' ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' :
                        'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                      }`}>
                        {entry.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(entry.receivedAmount)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {entry.commissionEarned > 0 ? (
                        <span className="font-bold text-amber-500 dark:text-amber-400">
                          {formatCurrency(entry.commissionEarned)}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-700">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-purple-600 dark:text-purple-400 text-base">
                      {formatCurrency(entry.forwardedAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && ledger.length > 0 && (
          <div className="bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              totalItems={totalItems}
              itemsPerPage={10}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MiddlemanLedger;
