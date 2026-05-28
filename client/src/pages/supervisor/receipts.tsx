import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { CashDispatch, CashReceipt } from '../../types';
import {
  TrendingUp,
  Clock,
  User as UserIcon,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
  BookOpen,
  Building2,
} from 'lucide-react';
import type { Site } from '../../types';

const SupervisorReceipts: React.FC = () => {
  const [pendingDispatches, setPendingDispatches] = useState<CashDispatch[]>([]);
  const [receiptHistory, setReceiptHistory] = useState<CashReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [selectedDispatch, setSelectedDispatch] = useState<CashDispatch | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [remarks, setRemarks] = useState('');

  const [sites, setSites] = useState<Site[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');

  const fetchSitesAndData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const sitesData: any = await api.get('/api/sites');
      const activeSites = (sitesData.data || sitesData || []).filter((s: Site) => s.status === 'ACTIVE');
      setSites(activeSites);

      if (activeSites.length > 0) {
        const firstSiteId = activeSites[0].id;
        setSelectedSiteId(firstSiteId);
        await fetchData(firstSiteId);
      } else {
        setLoading(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch sites.');
      setLoading(false);
    }
  };

  const fetchData = async (siteId: string) => {
    if (!siteId) return;
    try {
      setLoading(true);
      setErrorMsg('');
      const query = `?siteId=${siteId}`;
      const queryLimit = `?siteId=${siteId}&limit=50`;
      const [pendingData, historyData]: any = await Promise.all([
        api.get(`/api/dispatches/pending${query}`),
        api.get(`/api/receipts${queryLimit}`),
      ]);
      setPendingDispatches(pendingData || []);
      setReceiptHistory(historyData.data || historyData || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch receipts or dispatches data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitesAndData();
  }, []);

  useEffect(() => {
    if (selectedSiteId) {
      fetchData(selectedSiteId);
    }
  }, [selectedSiteId]);

  const openConfirmModal = (dispatch: CashDispatch) => {
    setSelectedDispatch(dispatch);
    setReceivedAmount(Number(dispatch.amount));
    setRemarks('');
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleConfirmReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch) return;

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    const discrepancy = Number(selectedDispatch.amount) - receivedAmount;
    if (discrepancy !== 0 && !remarks.trim()) {
      setErrorMsg('Please supply a reason in remarks for the cash discrepancy.');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/api/receipts', {
        dispatchId: selectedDispatch.id,
        receivedAmount,
        remarks: remarks || null,
      });

      setSuccessMsg('Cash receipt confirmed successfully!');
      setSelectedDispatch(null);
      if (selectedSiteId) {
        fetchData(selectedSiteId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to confirm receipt.');
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

  return (
    <div className="space-y-8">
      {/* Header pane */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-colors shadow-sm">
        <div>
          <span className="text-xs font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-widest">Handover Auditing</span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">Confirm Cash Receipts</h1>
          <p className="text-sm text-slate-550 dark:text-slate-400 mt-0.5">
            Audit and verify incoming cash dispatches sent from the owner to your site.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Site Switcher */}
          {sites.length > 1 && (
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 px-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <select
                value={selectedSiteId}
                onChange={(e) => setSelectedSiteId(e.target.value)}
                className="w-full sm:w-auto py-2.5 bg-transparent text-slate-900 dark:text-white focus:outline-none text-sm font-semibold cursor-pointer max-w-[200px] truncate"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => selectedSiteId && fetchData(selectedSiteId)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors border border-slate-200 dark:border-slate-800 cursor-pointer"
          >
            Refresh Feed
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-bold rounded-xl border border-emerald-200 dark:border-emerald-900/30 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-sm font-bold rounded-xl border border-rose-100 dark:border-rose-900/30 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Incoming Dispatches */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="text-amber-500 w-5 h-5" />
              Incoming Dispatches ({pendingDispatches.length})
            </h2>

            {pendingDispatches.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-slate-450">
                <TrendingUp className="w-12 h-12 text-slate-350 dark:text-slate-655 mx-auto mb-3" />
                <p className="text-lg font-bold">No Cash Dispatches in Transit</p>
                <p className="text-sm text-slate-550 mt-0.5">There are no pending dispatches awaiting verification.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingDispatches.map((disp) => (
                  <div
                    key={disp.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-250 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-lg transition-all"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold bg-amber-550/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Transit
                        </span>
                        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(disp.dispatchDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </div>

                      <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Amount Dispatched</span>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                          {formatCurrency(Number(disp.amount))}
                        </h3>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-850/50 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5 font-medium">
                          <UserIcon className="w-4 h-4 text-slate-400" />
                          <span>Carrier: <strong className="text-slate-800 dark:text-slate-200">{disp.carrierName}</strong></span>
                        </div>
                        <p className="text-xs italic bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850/40">
                          Purpose: {disp.purpose}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openConfirmModal(disp)}
                      className="mt-6 w-full py-3 rounded-xl gradient-orange-amber hover:shadow-amber-500/30 text-white font-bold text-sm shadow-md transition-all cursor-pointer text-center"
                    >
                      Verify & Confirm Receipt
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Receipt Audit History */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 space-y-4 shadow-sm h-fit">
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-850/60 pb-3">
              <BookOpen className="text-amber-500 w-5 h-5" />
              Receipt History
            </h2>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {receiptHistory.length === 0 ? (
                <p className="text-center py-8 text-slate-450 text-sm">No historical receipts logged yet.</p>
              ) : (
                receiptHistory.map((receipt) => (
                  <div
                    key={receipt.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-850/50 bg-slate-50 dark:bg-slate-950 space-y-2.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-450 font-semibold uppercase">
                        {new Date(receipt.receivedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        receipt.discrepancyAmount !== 0
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {receipt.discrepancyAmount !== 0 ? 'Discrepancy' : 'Match'}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className="text-sm text-slate-500 font-medium">Received Wallet</span>
                      <span className="text-base font-extrabold text-slate-850 dark:text-white">
                        {formatCurrency(receipt.receivedAmount)}
                      </span>
                    </div>

                    {receipt.discrepancyAmount !== 0 && (
                      <div className="text-[11px] bg-rose-500/5 text-rose-500 p-2 rounded-lg border border-rose-500/10">
                        Discrepancy: {formatCurrency(receipt.discrepancyAmount)} (Dispatched: {formatCurrency(Number(receipt.dispatch?.amount || 0))})
                      </div>
                    )}

                    {receipt.remarks && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850/60 p-2 rounded-lg">
                        "{receipt.remarks}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Dialog / Modal */}
      {selectedDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedDispatch(null)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-8 z-10 shadow-2xl relative">
            <button
              onClick={() => setSelectedDispatch(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle className="text-amber-500 w-6 h-6" />
              Verify Cash Handover
            </h3>

            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl mb-6 space-y-2">
              <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold leading-none">Expected Dispatch</p>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-amber-500">{formatCurrency(Number(selectedDispatch.amount))}</span>
                <span className="text-xs font-semibold text-slate-500">via {selectedDispatch.carrierName}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmReceipt} className="space-y-5">
              {/* Received Amount Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actual Cash Received</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    value={receivedAmount || ''}
                    onChange={(e) => setReceivedAmount(Number(e.target.value))}
                    placeholder="Enter verified amount"
                    min="0"
                    required
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-bold"
                  />
                </div>
              </div>

              {/* Warning if discrepancy */}
              {Number(selectedDispatch.amount) !== receivedAmount && (
                <div className="p-3.5 bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-455 rounded-xl border border-rose-250 dark:border-rose-900/30 flex items-start gap-2.5 text-xs font-bold leading-normal">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p>Financial Discrepancy Detected!</p>
                    <p className="font-normal text-slate-600 dark:text-slate-400 mt-0.5">
                      You are reporting a discrepancy of <strong className="text-rose-600 dark:text-rose-455">{formatCurrency(Math.abs(Number(selectedDispatch.amount) - receivedAmount))}</strong>. An audit flag will be sent directly to the owner. Remarks are required.
                    </p>
                  </div>
                </div>
              )}

              {/* Remarks/Reasons for discrepancy */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Remarks / Discrepancy Reason {Number(selectedDispatch.amount) !== receivedAmount && <span className="text-rose-500 font-black">*</span>}
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    Number(selectedDispatch.amount) !== receivedAmount
                      ? "Explain what caused this cash difference..."
                      : "Optional comments about transit quality or note counts..."
                  }
                  required={Number(selectedDispatch.amount) !== receivedAmount}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedDispatch(null)}
                  className="w-1/2 py-3 rounded-xl border border-slate-205 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-850 text-slate-650 dark:text-slate-300 font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-3 rounded-xl gradient-orange-amber text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Confirm Handovers
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorReceipts;
