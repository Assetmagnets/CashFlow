import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { CashDispatch } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  IndianRupee,
} from 'lucide-react';

const MiddlemanDispatches: React.FC = () => {
  const [pending, setPending] = useState<CashDispatch[]>([]);
  const [allDispatches, setAllDispatches] = useState<CashDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    paginatedData: paginatedDispatches,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
  } = usePagination(allDispatches, 10);

  // Forward modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<CashDispatch | null>(null);
  const [commissionAmount, setCommissionAmount] = useState('');
  const [forwardNotes, setForwardNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pendingRes, allRes]: any = await Promise.all([
        api.get('/api/middleman/dispatches/pending'),
        api.get('/api/middleman/dispatches'),
      ]);
      setPending(pendingRes || []);
      setAllDispatches(allRes || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch dispatches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openForwardModal = (disp: CashDispatch) => {
    setSelectedDispatch(disp);
    setCommissionAmount('');
    setForwardNotes('');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      await api.post(`/api/middleman/dispatches/${selectedDispatch.id}/forward`, {
        commissionAmount: Number(commissionAmount) || 0,
        notes: forwardNotes || undefined,
      });
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to forward dispatch.');
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Manage Dispatches</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Review pending dispatches, set your commission, and forward to sites.</p>
      </div>

      {/* Pending Dispatches */}
      {pending.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-200/60 dark:border-purple-800/30 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-purple-100 dark:border-purple-800/30 bg-purple-50/50 dark:bg-purple-950/20">
            <h3 className="font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" />
              Pending — Awaiting Your Processing ({pending.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {pending.map((disp) => (
              <div key={disp.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-lg">{formatCurrency(Number(disp.amount))}</span>
                    <span className="text-xs text-slate-400">via {disp.carrierName}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">{disp.createdBy?.name}</span> → <span className="font-semibold">{disp.site?.name}</span> ({disp.site?.code})
                  </p>
                  <p className="text-xs text-slate-400 italic">{disp.purpose}</p>
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-1">
                    Assigned to: {disp.middleman?.name || 'Unknown'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(disp.dispatchDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => openForwardModal(disp)}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer whitespace-nowrap"
                >
                  <IndianRupee className="w-4 h-4" />
                  Process & Forward
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Dispatches History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/50">
          <h3 className="font-bold text-slate-900 dark:text-white">All Dispatches History</h3>
        </div>
        <div className="overflow-x-auto">
          {allDispatches.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-lg font-bold">No dispatches yet</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800/50">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">From → Site</th>
                  <th className="px-6 py-4">Middleman</th>
                  <th className="px-6 py-4">Original</th>
                  <th className="px-6 py-4">Commission</th>
                  <th className="px-6 py-4">Forwarded</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDispatches.map((disp) => (
                  <tr key={disp.id} className="border-b border-slate-100 dark:border-slate-800/30 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                      {new Date(disp.dispatchDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-800 dark:text-white">{disp.createdBy?.name}</span>
                      <span className="text-slate-400 mx-1">→</span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{disp.site?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 rounded-md">
                        {disp.middleman?.name || 'Unknown'}
                      </span>
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
        {allDispatches.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            totalItems={totalItems}
            itemsPerPage={10}
          />
        )}
      </div>

      {/* Forward Modal */}
      {modalOpen && selectedDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 z-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <IndianRupee className="text-purple-500 w-5 h-5" />
              Forward Dispatch
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {selectedDispatch.createdBy?.name} → {selectedDispatch.site?.name} • {formatCurrency(Number(selectedDispatch.amount))}
            </p>

            <form onSubmit={handleForward} className="space-y-5">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 text-xs rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Your Commission (₹)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={commissionAmount}
                    onChange={(e) => setCommissionAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    max={Number(selectedDispatch.amount) - 1}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-bold"
                  />
                </div>
                {commissionAmount && Number(commissionAmount) > 0 && (
                  <p className="text-xs text-slate-400 mt-1">
                    Site will receive: <span className="font-bold text-emerald-500">{formatCurrency(Number(selectedDispatch.amount) - Number(commissionAmount))}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes (Optional)</label>
                <textarea
                  value={forwardNotes}
                  onChange={(e) => setForwardNotes(e.target.value)}
                  placeholder="Any notes about this transaction..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 h-20 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Forward Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiddlemanDispatches;
