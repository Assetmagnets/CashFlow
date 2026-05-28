import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { SiteTransfer } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  ArrowRightLeft,
  Loader2,
  AlertCircle,
  Building2,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const OwnerSiteTransfers: React.FC = () => {
  const [transfers, setTransfers] = useState<SiteTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    paginatedData: paginatedTransfers,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
  } = usePagination(transfers, 10);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res: any = await api.get('/api/transfers?limit=100');
      setTransfers(res.data || res || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch transfers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id: string) => {
    if (!window.confirm('Are you sure you want to force-approve this transfer?')) return;
    try {
      setActionLoading(id);
      await api.post(`/api/transfers/${id}/receive`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to approve transfer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this transfer? The amount will be refunded to the source site.')) return;
    try {
      setActionLoading(id);
      await api.post(`/api/transfers/${id}/cancel`);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel transfer');
    } finally {
      setActionLoading(null);
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
      case 'PENDING':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'REJECTED':
        return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-450';
      default:
        return 'bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <ArrowRightLeft className="w-6 h-6 text-indigo-500" />
            Cross-Site Transfers
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Monitor operational cash flowing between different construction sites.</p>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850/50">
            <h3 className="font-bold text-slate-900 dark:text-white">Transfer Audit Trail</h3>
          </div>
          <div className="overflow-x-auto">
            {transfers.length === 0 ? (
              <div className="text-center py-16 text-slate-450">
                <Building2 className="w-12 h-12 text-slate-350 dark:text-slate-650 mx-auto mb-3" />
                <p className="text-lg font-bold">No Cross-Site Transfers</p>
                <p className="text-sm text-slate-550 mt-0.5">There has been no movement of funds between sites.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-400 font-bold border-b border-slate-150/60 dark:border-slate-850/50">
                    <th className="px-6 py-4">Transfer Date</th>
                    <th className="px-6 py-4">From Site</th>
                    <th className="px-6 py-4">To Site</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Initiator</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransfers.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-slate-100 dark:border-slate-800/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-rose-600 dark:text-rose-400 block">{tx.fromSite?.name}</span>
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">{tx.fromSite?.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block">{tx.toSite?.name}</span>
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">{tx.toSite?.code}</span>
                      </td>
                      <td className="px-6 py-4 font-black text-slate-900 dark:text-white text-base">
                        {formatCurrency(Number(tx.amount))}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-300 block">{tx.initiatedBy?.name}</span>
                        {tx.notes && <span className="text-xs text-slate-450 italic">{tx.notes}</span>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${getStatusBadge(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {tx.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(tx.id)}
                              disabled={actionLoading === tx.id}
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Approve & Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancel(tx.id)}
                              disabled={actionLoading === tx.id}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                              title="Cancel & Refund"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {transfers.length > 0 && (
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

export default OwnerSiteTransfers;
