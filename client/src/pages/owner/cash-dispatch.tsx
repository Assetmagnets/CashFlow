import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { Site, CashDispatch, User } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  Send,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  Users,
} from 'lucide-react';

const OwnerCashDispatch: React.FC = () => {
  const [dispatches, setDispatches] = useState<CashDispatch[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [middlemen, setMiddlemen] = useState<Partial<User>[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const {
    paginatedData: paginatedDispatches,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
  } = usePagination(dispatches, 10);

  // Form State
  const [siteId, setSiteId] = useState('');
  const [amount, setAmount] = useState('');
  const [carrierName, setCarrierName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [middlemanId, setMiddlemanId] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [dispatchesRes, sitesRes, middlemenRes]: any = await Promise.all([
        api.get('/api/dispatches?limit=100'),
        api.get('/api/sites?limit=100'),
        api.get('/api/users/middlemen'),
      ]);
      setDispatches(dispatchesRes.data || dispatchesRes || []);
      setSites((sitesRes.data || sitesRes || []).filter((s: Site) => s.status === 'ACTIVE'));
      setMiddlemen(middlemenRes || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch dispatches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    let finalCarrierName = carrierName;
    if (middlemanId) {
      const selectedM = middlemen.find(m => m.id === middlemanId);
      if (selectedM) finalCarrierName = selectedM.name;
    }

    if (!siteId || !amount || (!finalCarrierName && !middlemanId) || !purpose || !dispatchDate) {
      setErrorMsg('All fields marked as required must be filled.');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/api/dispatches', {
        siteId,
        amount: Number(amount),
        carrierName: finalCarrierName,
        purpose,
        notes: notes || null,
        dispatchDate: new Date(dispatchDate).toISOString(),
        middlemanId: middlemanId || undefined,
      });
      // Reset & Close
      setModalOpen(false);
      setSiteId('');
      setAmount('');
      setCarrierName('');
      setPurpose('');
      setNotes('');
      setDispatchDate(new Date().toISOString().split('T')[0]);
      setMiddlemanId('');
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch cash.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400';
      case 'PARTIAL_RECEIVED':
        return 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400';
      case 'DISPUTED':
        return 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-450';
      case 'PENDING_MIDDLEMAN':
        return 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Cash Dispatches</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Dispatch cash securely to construction sites and monitor receipt confirmations.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
          Dispatch Cash
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850/50">
            <h3 className="font-bold text-slate-900 dark:text-white">Dispatch Audit Trail</h3>
          </div>
          <div className="overflow-x-auto">
            {dispatches.length === 0 ? (
              <div className="text-center py-16 text-slate-450">
                <Send className="w-12 h-12 text-slate-350 dark:text-slate-650 mx-auto mb-3" />
                <p className="text-lg font-bold">No Dispatches Logged</p>
                <p className="text-sm text-slate-550 mt-0.5">Click "Dispatch Cash" to initiate your first dispatch.</p>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-xs text-slate-400 font-bold border-b border-slate-150/60 dark:border-slate-850/50">
                    <th className="px-6 py-4">Dispatch Date</th>
                    <th className="px-6 py-4">Site Name</th>
                    <th className="px-6 py-4">Carrier / Purpose</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Middleman</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedDispatches.map((disp) => (
                    <tr
                      key={disp.id}
                      className="border-b border-slate-100 dark:border-slate-850/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-850/30"
                    >
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                        {new Date(disp.dispatchDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-850 dark:text-white block">{disp.site?.name}</span>
                        <span className="text-[11px] text-slate-400 font-semibold uppercase">{disp.site?.code}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-300 block">{disp.carrierName}</span>
                        <span className="text-xs text-slate-450 italic">{disp.purpose}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{formatCurrency(Number(disp.amount))}</span>
                        {disp.commissionAmount && Number(disp.commissionAmount) > 0 && (
                          <span className="text-[11px] text-purple-500">Commission: {formatCurrency(Number(disp.commissionAmount))}</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {disp.middleman?.name ? (
                          <span className="text-xs font-semibold px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 rounded-md">
                            {disp.middleman.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">Direct</span>
                        )}
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
          {dispatches.length > 0 && (
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

      {/* Dispatch Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 z-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Send className="text-amber-500 w-5 h-5" />
              Dispatch Operational Cash
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-xs rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Select Construction Site</label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold"
                >
                  <option value="">Choose Site...</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - Balance: {formatCurrency(s.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Dispatch Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="E.G. 25000"
                      min="1"
                      required
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Dispatch Date</label>
                  <input
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Purpose / Allocation</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Weekly labour wages or Emergency sand purchases"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Optional Middleman Selection */}
              {middlemen.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Route via Middleman (Optional)
                  </label>
                  <select
                    value={middlemanId}
                    onChange={(e) => {
                      setMiddlemanId(e.target.value);
                      if (e.target.value) setCarrierName('');
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold"
                  >
                    <option value="">Direct to Site (No Middleman)</option>
                    {middlemen.map((m) => (
                      <option key={m.id} value={m.id} disabled={m.isActive === false}>
                        {m.name} ({m.email}) {m.isActive === false && '— Deactivated'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!middlemanId && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Carrier / Courier Name</label>
                  <input
                    type="text"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="Supervisor Amit or Professional Courier"
                    required={!middlemanId}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">Additional Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter details about dispatch bag number or denominations..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 h-20 resize-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-3 rounded-xl gradient-orange-amber text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Dispatch Cash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerCashDispatch;
