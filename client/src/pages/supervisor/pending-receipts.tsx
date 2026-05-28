import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { CashDispatch } from '../../types';
import {
  Send,
  Calendar,
  User as UserIcon,
  HelpCircle,
  IndianRupee,
  Loader2,
  AlertCircle,
  X,
  CheckCircle,
  TrendingDown,
  Lock,
} from 'lucide-react';

const SupervisorPendingReceipts: React.FC = () => {
  const [dispatches, setDispatches] = useState<CashDispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [selectedDispatch, setSelectedDispatch] = useState<CashDispatch | null>(null);
  const [receivedAmount, setReceivedAmount] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  const fetchPendingDispatches = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const data: any = await api.get('/api/dispatches/pending');
      setDispatches(data || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch pending dispatches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingDispatches();
  }, []);

  const openConfirmModal = (dispatch: CashDispatch) => {
    setSelectedDispatch(dispatch);
    
    const commAmt = dispatch.commissionAmount ? Number(dispatch.commissionAmount) : 0;
    const origAmt = Number(dispatch.amount);
    const finalAmt = (dispatch.amountAfterCommission && Number(dispatch.amountAfterCommission) > 0) 
      ? Number(dispatch.amountAfterCommission) 
      : (origAmt - commAmt);
      
    setReceivedAmount(finalAmt.toString());
    setRemarks('');
    setErrorMsg('');
  };

  const closeConfirmModal = () => {
    setSelectedDispatch(null);
    setReceivedAmount('');
    setRemarks('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispatch) return;

    setErrorMsg('');
    setSubmitting(true);

    const receivedNum = parseFloat(receivedAmount);
    if (isNaN(receivedNum) || receivedNum < 0) {
      setErrorMsg('Please enter a valid received amount.');
      setSubmitting(false);
      return;
    }

    const commAmt = selectedDispatch.commissionAmount ? Number(selectedDispatch.commissionAmount) : 0;
    const origAmt = Number(selectedDispatch.amount);
    const expectedNum = (selectedDispatch.amountAfterCommission && Number(selectedDispatch.amountAfterCommission) > 0) 
      ? Number(selectedDispatch.amountAfterCommission) 
      : (origAmt - commAmt);
      
    const discrepancy = expectedNum - receivedNum;

    // Require remarks if there is a discrepancy
    if (discrepancy !== 0 && !remarks.trim()) {
      setErrorMsg('Remarks are required because there is a discrepancy in the cash received.');
      setSubmitting(false);
      return;
    }

    try {
      await api.post('/api/receipts', {
        dispatchId: selectedDispatch.id,
        receivedAmount: receivedNum,
        remarks: remarks || null,
      });

      setSuccessMsg(`Cash receipt of ${formatCurrency(receivedNum)} confirmed successfully!`);
      closeConfirmModal();
      fetchPendingDispatches();

      setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
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

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDiscrepancy = () => {
    if (!selectedDispatch || !receivedAmount) return 0;
    const commAmt = selectedDispatch.commissionAmount ? Number(selectedDispatch.commissionAmount) : 0;
    const origAmt = Number(selectedDispatch.amount);
    const expected = (selectedDispatch.amountAfterCommission && Number(selectedDispatch.amountAfterCommission) > 0) 
      ? Number(selectedDispatch.amountAfterCommission) 
      : (origAmt - commAmt);
      
    const received = parseFloat(receivedAmount);
    if (isNaN(received)) return 0;
    return expected - received;
  };

  const discrepancy = calculateDiscrepancy();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Confirm Cash Receipts</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Verify and sign-off on cash dispatches delivered to your assigned construction sites.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-xl animate-fade-in">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : errorMsg && !selectedDispatch ? (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-sm rounded-xl border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dispatches.length === 0 ? (
            <div className="md:col-span-3 text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-slate-450">
              <Send className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-lg font-bold">No Incoming Dispatches</p>
              <p className="text-sm text-slate-550 mt-0.5">There are no pending cash dispatches in-transit for your sites.</p>
            </div>
          ) : (
            dispatches.map((dispatch) => (
              <div
                key={dispatch.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-6 flex flex-col justify-between hover:shadow-md transition-all border-l-4 border-l-amber-500"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {dispatch.site?.code || 'SITE'}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white mt-1 line-clamp-1">
                        {dispatch.site?.name || 'Unknown Site'}
                      </h3>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
                      In Transit
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-xl space-y-2 border border-slate-100 dark:border-slate-850">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Net Cash Expected</span>
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center text-sm">
                        <IndianRupee className="w-3.5 h-3.5" />
                        {((dispatch.amountAfterCommission && Number(dispatch.amountAfterCommission) > 0) 
                          ? Number(dispatch.amountAfterCommission) 
                          : (Number(dispatch.amount) - (dispatch.commissionAmount ? Number(dispatch.commissionAmount) : 0))).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Carrier / Driver</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {dispatch.carrierName}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-semibold">Purpose</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                        {dispatch.purpose}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>Dispatched: {formatDate(dispatch.dispatchDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Sent by: {dispatch.createdBy?.name}</span>
                    </div>
                  </div>

                  {dispatch.notes && (
                    <div className="text-[11px] text-slate-450 italic bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10">
                      <strong>Sender's Note:</strong> {dispatch.notes}
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <button
                    onClick={() => openConfirmModal(dispatch)}
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md shadow-amber-500/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4.5 h-4.5" />
                    Confirm Cash Receipt
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {selectedDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={closeConfirmModal} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 z-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeConfirmModal}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <IndianRupee className="text-amber-500 w-6 h-6" />
              Acknowledge Cash Delivery
            </h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-xs rounded-xl border border-rose-100 dark:border-rose-900/30">
                  <AlertCircle className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Dispatch Info Summary */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-150 dark:border-slate-850 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Site</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedDispatch.site?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Expected Amount</span>
                  <span className="font-extrabold text-amber-500 dark:text-amber-400">
                    {formatCurrency(
                      (selectedDispatch.amountAfterCommission && Number(selectedDispatch.amountAfterCommission) > 0) 
                        ? Number(selectedDispatch.amountAfterCommission) 
                        : (Number(selectedDispatch.amount) - (selectedDispatch.commissionAmount ? Number(selectedDispatch.commissionAmount) : 0))
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Dispatched By</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{selectedDispatch.createdBy?.name}</span>
                </div>
              </div>

              {/* Form Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">
                  Actual Received Cash (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(e.target.value)}
                  placeholder="Enter exact received amount"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-lg font-bold"
                />
              </div>

              {/* Discrepancy Alert */}
              {discrepancy !== 0 && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  discrepancy > 0 
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-655 dark:text-amber-400'
                    : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-655 dark:text-emerald-450'
                }`}>
                  {discrepancy > 0 ? (
                    <TrendingDown className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <HelpCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <span className="font-bold uppercase tracking-wider block">
                      {discrepancy > 0 ? 'SHORTAGE ALERT' : 'OVERAGE DETECTED'}
                    </span>
                    <span>
                      {discrepancy > 0 
                        ? `You are logging a shortage of ${formatCurrency(discrepancy)}. A formal report will be recorded in the system ledger.`
                        : `You are logging an excess of ${formatCurrency(Math.abs(discrepancy))}.`}
                    </span>
                  </div>
                </div>
              )}

              {/* Remarks Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider">
                    Remarks / Handover Notes
                  </label>
                  {discrepancy !== 0 && (
                    <span className="text-[10px] font-bold text-rose-500 uppercase">Required</span>
                  )}
                </div>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    discrepancy !== 0 
                      ? 'Please explain the reason for the cash discrepancy (e.g. driver transport cuts, physical box shortage).' 
                      : 'Add any remarks (optional)'
                  }
                  required={discrepancy !== 0}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              {/* Footer */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-1/2 py-3 rounded-xl gradient-orange-amber text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  Confirm & Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPendingReceipts;
