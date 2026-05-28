import React, { useState, useEffect, useRef } from 'react';
import api from '../../lib/api';
import type { Site, ExpenseCategory, Expense } from '../../types';
import { usePagination } from '../../hooks/usePagination';
import { Pagination } from '../../components/shared/Pagination';
import {
  Receipt,
  Building2,
  Tag,
  IndianRupee,
  User as UserIcon,
  FileText,
  Calendar,
  UploadCloud,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  File,
  Eye,
  Trash2,
  Edit,
  Clock,
  ExternalLink,
} from 'lucide-react';

const SupervisorAddExpense: React.FC = () => {
  const [sites, setSites] = useState<Site[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Navigation & Listing Tab
  const [activeTab, setActiveTab] = useState<'log' | 'list'>('log');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  const {
    paginatedData: paginatedExpenses,
    currentPage,
    totalPages,
    goToPage,
    totalItems,
  } = usePagination(expenses, 10);

  // Form State
  const [siteId, setSiteId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit Expense Form State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editVendorName, setEditVendorName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editExpenseDate, setEditExpenseDate] = useState('');
  const [updating, setUpdating] = useState(false);

  // Delete Action Confirmation State
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [receipt, setReceipt] = useState<{
    fileName: string;
    originalName: string;
    filePath: string;
    mimeType: string;
    size: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchExpenses = async () => {
    try {
      setLoadingExpenses(true);
      setErrorMsg('');
      const queryParams = siteId ? `&siteId=${siteId}` : '';
      const res: any = await api.get(`/api/expenses?limit=100${queryParams}`);
      setExpenses(res.data || res || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch expenses.');
    } finally {
      setLoadingExpenses(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [sitesData, categoriesData]: any = await Promise.all([
          api.get('/api/sites'),
          api.get('/api/expenses/categories'),
        ]);
        
        const activeSites = (sitesData.data || sitesData || []).filter((s: Site) => s.status === 'ACTIVE');
        setSites(activeSites);
        setCategories(categoriesData || []);

        if (activeSites.length > 0) {
          setSiteId(activeSites[0].id);
        }
        if (categoriesData.length > 0) {
          setCategoryId(categoriesData[0].id);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to fetch form configuration.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchExpenses();
    }
  }, [activeTab]);

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setEditCategoryId(expense.categoryId);
    setEditAmount(expense.amount.toString());
    setEditVendorName(expense.vendorName);
    setEditDescription(expense.description || '');
    setEditExpenseDate(new Date(expense.expenseDate).toISOString().split('T')[0]);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    setErrorMsg('');
    setSuccessMsg('');
    setUpdating(true);

    try {
      await api.patch(`/api/expenses/${editingExpense.id}`, {
        categoryId: editCategoryId,
        amount: parseFloat(editAmount),
        vendorName: editVendorName,
        description: editDescription || null,
        expenseDate: editExpenseDate,
      });

      setSuccessMsg('Expense report updated successfully!');
      setEditingExpense(null);
      fetchExpenses();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update expense.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExpenseId) return;

    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      await api.delete(`/api/expenses/${deletingExpenseId}`);
      setSuccessMsg('Pending expense deleted successfully.');
      setDeletingExpenseId(null);
      fetchExpenses();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadReceipt(file);
  };

  const uploadReceipt = async (file: File) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg('Only JPEG, PNG, WEBP images and PDF documents are allowed.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('File size must not exceed 5MB.');
      return;
    }

    setErrorMsg('');
    setUploading(true);
    setUploadProgress(10);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const interval = setInterval(() => {
        setUploadProgress((p) => (p < 90 ? p + 15 : p));
      }, 200);

      const response: any = await api.post('/api/uploads', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(interval);
      setUploadProgress(100);
      setReceipt(response);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to upload receipt.');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await uploadReceipt(file);
  };

  const removeReceipt = () => {
    setReceipt(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!siteId || !categoryId || !amount || !vendorName || !expenseDate) {
      setErrorMsg('Please fill in all required fields.');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Amount must be a positive number.');
      return;
    }

    setSubmitting(true);

    try {
      await api.post('/api/expenses', {
        siteId,
        categoryId,
        amount: amountNum,
        vendorName,
        description: description || null,
        expenseDate,
        receipt: receipt || null,
      });

      setSuccessMsg('Expense logged successfully! Sent to Owner for approval.');
      
      // Reset form fields
      setAmount('');
      setVendorName('');
      setDescription('');
      setReceipt(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to log expense.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSite = sites.find((s) => s.id === siteId);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 transition-colors">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <Receipt className="text-amber-500 w-7 h-7 flex-shrink-0" />
          Log Operational Expense
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Record a new site expense and upload a supporting bill. The expense will be routed to the Owner for approval.
        </p>
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

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('log')}
          className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all relative ${
            activeTab === 'log'
              ? 'text-amber-500 font-extrabold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
          }`}
        >
          Log New Expense
          {activeTab === 'log' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('list')}
          className={`pb-4 text-sm font-bold tracking-wide uppercase transition-all relative ${
            activeTab === 'list'
              ? 'text-amber-500 font-extrabold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-350'
          }`}
        >
          My Logged Expenses
          {activeTab === 'list' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
        </div>
      ) : activeTab === 'log' ? (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Inputs (Left Columns) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Site Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Construction Site
                </label>
                <select
                  value={siteId}
                  onChange={(e) => setSiteId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold"
                >
                  {sites.length === 0 && <option value="">No Active Sites Assigned</option>}
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
                {selectedSite && (
                  <span className="text-[11px] font-semibold text-amber-500 block">
                    Running Balance: ₹{Number(selectedSite.currentBalance).toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Expense Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  Amount Spent (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 3500"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-bold"
                />
              </div>

              {/* Expense Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Expense Date
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold"
                />
              </div>
            </div>

            {/* Vendor Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                Vendor / Supplier Name
              </label>
              <input
                type="text"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                placeholder="e.g. Ultratech Cement, Local wages handler"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-505 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Expense Description / Remarks
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide short details about the purchase (e.g. purchased 10 bags of grade-43 cement)."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
              />
            </div>
          </div>

          {/* Upload panel & Submission (Right Column) */}
          <div className="space-y-6 flex flex-col">
            {/* Drag & Drop Card */}
            <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex-1 flex flex-col justify-between">
              <div className="space-y-4 flex-1 flex flex-col">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Supporting Receipt
                </h3>
                
                {!receipt && !uploading && (
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl hover:border-amber-500 dark:hover:border-amber-500 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer min-h-[220px]"
                  >
                    <UploadCloud className="w-10 h-10 text-slate-350 dark:text-slate-600 mb-3 animate-pulse" />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Drag & Drop Receipt
                    </span>
                    <span className="text-xs text-slate-400 mt-1">
                      Supports PNG, JPG, PDF up to 5MB
                    </span>
                    <button
                      type="button"
                      className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg"
                    >
                      Browse Files
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                  </div>
                )}

                {uploading && (
                  <div className="flex-1 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center min-h-[220px]">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Uploading File... {uploadProgress}%
                    </span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-3 max-w-[150px]">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {receipt && (
                  <div className="flex-1 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-6 flex flex-col items-center justify-center text-center relative min-h-[220px]">
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="absolute top-3 right-3 p-1.5 rounded-lg bg-white dark:bg-slate-850 shadow-sm border border-slate-100 dark:border-slate-800 text-slate-500 hover:text-rose-500 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    
                    {receipt.mimeType.startsWith('image/') ? (
                      <div className="w-20 h-20 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 mb-3 shadow-inner relative group">
                        <img
                          src={receipt.filePath}
                          alt="Receipt Preview"
                          className="w-full h-full object-cover"
                        />
                        <a
                          href={receipt.filePath}
                          target="_blank"
                          rel="noreferrer"
                          className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-white"
                        >
                          <Eye className="w-5 h-5" />
                        </a>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
                        <File className="w-8 h-8" />
                      </div>
                    )}
                    
                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[180px]">
                      {receipt.originalName}
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      {(receipt.size / 1024).toFixed(0)} KB • Uploaded
                    </span>
                    
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450 mt-3 text-xs font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      <span>Ready to link</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form submit button */}
              <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-850/50 mt-6">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl text-xs text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-850 leading-relaxed">
                  <strong>Workflow Note:</strong> The logged expense requires Owner validation before deducting from site budget or appearing in site ledger.
                </div>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="w-full py-4.5 rounded-xl gradient-orange-amber text-white font-bold text-sm shadow-lg shadow-amber-500/25 hover:shadow-amber-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Receipt className="w-4.5 h-4.5" />}
                  Submit Expense Report
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        /* Tab 2: My Logged Expenses List */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          {loadingExpenses ? (
            <div className="py-20 flex items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-400">
                    <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider">Site</th>
                    <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider">Vendor / Category</th>
                    <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-center">Bill</th>
                    <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-center">Status</th>
                    <th className="px-6 py-4.5 text-xs font-bold uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-slate-400">
                        <Receipt className="w-12 h-12 mx-auto text-slate-350 dark:text-slate-650 mb-3" />
                        <p className="font-bold text-base">No Expenses Found</p>
                        <p className="text-xs mt-0.5">Submit your first expense from the other tab.</p>
                      </td>
                    </tr>
                  ) : (
                    paginatedExpenses.map((expense) => {
                      const isPending = expense.status === 'PENDING';
                      const createdHoursAgo = (Date.now() - new Date(expense.createdAt).getTime()) / (1000 * 60 * 60);
                      const isEditable = isPending && createdHoursAgo <= 24;
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
                          <td className="px-6 py-4 text-xs font-medium text-slate-500 whitespace-nowrap">
                            {new Date(expense.expenseDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">
                              {expense.vendorName}
                            </div>
                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mt-0.5 block">
                              {expense.category?.name}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 max-w-[180px] truncate">
                            {expense.description || '—'}
                          </td>
                          <td className="px-6 py-4 text-right font-extrabold text-sm text-slate-900 dark:text-white">
                            ₹{Number(expense.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {hasReceipt ? (
                              <a
                                href={expense.attachments![0].filePath}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex p-2 bg-slate-100 hover:bg-amber-100 text-slate-600 hover:text-amber-600 rounded-lg transition-colors border border-slate-200 dark:border-slate-800"
                                title="View bill file"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 ${
                                expense.status === 'APPROVED'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20'
                                  : expense.status === 'REJECTED'
                                  ? 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 animate-pulse'
                              }`}
                            >
                              {expense.status === 'PENDING' && <Clock className="w-3 h-3" />}
                              {expense.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {isEditable ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleEditClick(expense)}
                                  className="p-2 bg-slate-50 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-800 text-slate-500 hover:text-amber-500 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
                                  title="Edit report"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingExpenseId(expense.id)}
                                  className="p-2 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-500 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors"
                                  title="Delete report"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 font-semibold italic flex items-center justify-end gap-1 select-none opacity-60">
                                Locked
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loadingExpenses && expenses.length > 0 && (
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

      {/* Edit Pending Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setEditingExpense(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setEditingExpense(null)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <div>
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 px-3 py-1 rounded-full uppercase tracking-wider">
                Edit Request
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mt-3">
                Update Pending Expense
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Site: {editingExpense.site?.name} ({editingExpense.site?.code})
              </p>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-5">
              {/* Category Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  Expense Category
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
                  Amount Spent (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-bold"
                />
              </div>

              {/* Vendor */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Vendor / Supplier Name
                </label>
                <input
                  type="text"
                  value={editVendorName}
                  onChange={(e) => setEditVendorName(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-medium"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Expense Date
                </label>
                <input
                  type="date"
                  value={editExpenseDate}
                  onChange={(e) => setEditExpenseDate(e.target.value)}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm font-semibold"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Expense Description / Remarks
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-sm"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="w-1/2 py-3 rounded-xl gradient-orange-amber text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialogue */}
      {deletingExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setDeletingExpenseId(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Delete Logged Expense?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete this pending expense request? This action is irreversible, and the expense report will be permanently removed.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeletingExpenseId(null)}
                className="w-1/2 py-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm transition-colors cursor-pointer"
              >
                No, Keep it
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="w-1/2 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorAddExpense;
