import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import type { Expense, Site, ExpenseCategory } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  Receipt,
  Search,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  File,
  Eye,
} from 'lucide-react';

const OwnerExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const {
    paginatedData: paginatedExpenses,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
  } = usePagination(expenses, 10);
  
  // Filtering & Pagination
  const [selectedTab, setSelectedTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [siteFilter, setSiteFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Detail Modal
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [receiptModalUrl, setReceiptModalUrl] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const [sitesData, categoriesData]: any = await Promise.all([
        api.get('/api/sites'),
        api.get('/api/expenses/categories'),
      ]);
      setSites(sitesData.data || sitesData || []);
      setCategories(categoriesData || []);

      // Load expenses
      await fetchExpenses();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to initialize page data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      setErrorMsg('');
      // Determine status filter based on tab
      const statusParam = selectedTab === 'PENDING' ? 'PENDING' : '';
      let url = `/api/expenses?limit=100`;
      if (statusParam) url += `&status=${statusParam}`;
      if (siteFilter) url += `&siteId=${siteFilter}`;
      if (categoryFilter) url += `&categoryId=${categoryFilter}`;
      if (search) url += `&search=${search}`;

      const res: any = await api.get(url);
      
      // If HISTORY tab is selected, filter out PENDING items from local view for strict separation
      const expenseList = res.data || res || [];
      if (selectedTab === 'HISTORY') {
        setExpenses(expenseList.filter((e: Expense) => e.status !== 'PENDING'));
      } else {
        setExpenses(expenseList);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch expenses.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedTab, siteFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchExpenses();
  };

  const handleApprove = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActioning(id);
    try {
      await api.patch(`/api/expenses/${id}/approve`, {});
      setSuccessMsg('Expense approved and site balance debited successfully.');
      setSelectedExpense(null);
      fetchExpenses();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve expense.');
    } finally {
      setActioning(null);
    }
  };

  const handleReject = async (id: string) => {
    setErrorMsg('');
    setSuccessMsg('');
    setActioning(id);
    try {
      await api.patch(`/api/expenses/${id}/reject`, {});
      setSuccessMsg('Expense rejected successfully.');
      setSelectedExpense(null);
      fetchExpenses();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reject expense.');
    } finally {
      setActioning(null);
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
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-amber-500 w-7 h-7" />
            Expenses & Approvals Control
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review site expenditure requests, view uploaded bill receipts, and confirm transactions.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-450 rounded-xl">
          <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-500" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 text-sm rounded-xl border border-rose-100 dark:border-rose-900/30">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setSelectedTab('PENDING')}
          className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all relative ${
            selectedTab === 'PENDING'
              ? 'text-amber-500'
              : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-300'
          }`}
        >
          Pending Approvals
          {selectedTab === 'PENDING' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setSelectedTab('HISTORY')}
          className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all relative ${
            selectedTab === 'HISTORY'
              ? 'text-amber-500'
              : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-300'
          }`}
        >
          Expense History
          {selectedTab === 'HISTORY' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm">
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 text-slate-400 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Search vendor name or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
          />
        </div>

        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none"
        >
          <option value="">All Sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </form>

      {/* Main Content list */}
      {loading ? (
        <div className="min-h-[30vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Site / Code</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Vendor / Category</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider">Receipt</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                  <th className="px-6 py-4.5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-16 text-slate-450">
                      <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-650 mx-auto mb-3" />
                      <p className="font-bold text-base">No Expenses Found</p>
                      <p className="text-sm mt-0.5">There are no expenses in this section matching your active filters.</p>
                    </td>
                  </tr>
                ) : (
                  paginatedExpenses.map((expense) => {
                    const hasReceipt = expense.attachments && expense.attachments.length > 0;
                    return (
                      <tr key={expense.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                          <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-850 text-slate-550 dark:text-slate-350 px-2 py-0.5 rounded-full uppercase block w-max">
                            {expense.site?.code}
                          </span>
                          <span className="text-xs text-slate-500 mt-1 block line-clamp-1 max-w-[120px]">
                            {expense.site?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-450 font-semibold whitespace-nowrap">
                          {formatDate(expense.expenseDate)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{expense.vendorName}</div>
                          <div className="text-[11px] text-amber-500 font-semibold uppercase mt-0.5">{expense.category?.name}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 max-w-[200px] truncate">
                          {expense.description || '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-slate-900 dark:text-white text-sm">
                          {formatCurrency(Number(expense.amount))}
                        </td>
                        <td className="px-6 py-4">
                          {hasReceipt ? (
                            <button
                              onClick={() => {
                                const url = expense.attachments?.[0]?.filePath || '';
                                if (expense.attachments?.[0]?.mimeType.startsWith('image/')) {
                                  setReceiptModalUrl(url);
                                } else {
                                  window.open(url, '_blank');
                                }
                              }}
                              className="inline-flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 font-bold cursor-pointer"
                            >
                              <File className="w-3.5 h-3.5" />
                              View Bill
                            </button>
                          ) : (
                            <span className="text-xs text-slate-350 italic">No Bill</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            expense.status === 'PENDING'
                              ? 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20'
                              : expense.status === 'APPROVED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                              : 'bg-rose-50/10 text-rose-500'
                          }`}>
                            {expense.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          {expense.status === 'PENDING' ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                disabled={actioning !== null}
                                onClick={() => handleApprove(expense.id)}
                                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold shadow-sm shadow-emerald-500/10 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {actioning === expense.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                )}
                                Approve
                              </button>
                              <button
                                disabled={actioning !== null}
                                onClick={() => handleReject(expense.id)}
                                className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              >
                                {actioning === expense.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedExpense(expense)}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
                            >
                              Details
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {expenses.length > 0 && (
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

      {/* Expanded Expense Detail Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setSelectedExpense(null)} />
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 sm:p-8 z-10 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedExpense(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <XCircle className="w-5 h-5 text-slate-500" />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Receipt className="text-amber-500 w-6 h-6" />
              Expense Detailed View
            </h3>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-850">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Construction Site</span>
                  <span className="font-bold text-slate-900 dark:text-white mt-1 block">{selectedExpense.site?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Wallet Debit</span>
                  <span className="font-extrabold text-amber-500 dark:text-amber-400 text-lg mt-1 block">
                    {formatCurrency(Number(selectedExpense.amount))}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Vendor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedExpense.vendorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Expense Category</span>
                  <span className="font-bold text-slate-850 dark:text-slate-250 uppercase text-xs">{selectedExpense.category?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Date Logged</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{formatDate(selectedExpense.expenseDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Logged By</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{selectedExpense.createdBy?.name}</span>
                </div>
              </div>

              {selectedExpense.description && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg text-xs leading-relaxed text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-850">
                  <strong>Description:</strong> {selectedExpense.description}
                </div>
              )}

              {/* Receipt display inside details */}
              {selectedExpense.attachments && selectedExpense.attachments.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-850/50">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-2">Supporting Bill / Receipt</span>
                  {selectedExpense.attachments[0].mimeType.startsWith('image/') ? (
                    <div className="w-full h-44 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner relative group">
                      <img
                        src={selectedExpense.attachments[0].filePath}
                        alt="Receipt Bill"
                        className="w-full h-full object-cover"
                      />
                      <a
                        href={selectedExpense.attachments[0].filePath}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold text-xs gap-1.5 transition-all"
                      >
                        <Eye className="w-5 h-5" /> Expand Receipt
                      </a>
                    </div>
                  ) : (
                    <a
                      href={selectedExpense.attachments[0].filePath}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 rounded-lg border border-slate-100 dark:border-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      <File className="w-5 h-5 text-amber-500" />
                      <span>{selectedExpense.attachments[0].originalName} (PDF Bill)</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Direct Lightbox Modal for Receipts */}
      {receiptModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4" onClick={() => setReceiptModalUrl(null)}>
          <button
            onClick={() => setReceiptModalUrl(null)}
            className="absolute top-4 right-4 sm:top-8 sm:right-8 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-105 cursor-pointer"
          >
            <XCircle className="w-6 h-6" />
          </button>
          <div className="max-w-[90vw] max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <img src={receiptModalUrl} alt="Bill lightbox" className="max-w-full max-h-[85vh] object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerExpenses;
