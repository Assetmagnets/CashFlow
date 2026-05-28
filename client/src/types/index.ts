export type UserRole = 'OWNER' | 'SUPERVISOR' | 'MIDDLEMAN';
export type SiteStatus = 'ACTIVE' | 'INACTIVE';
export type DispatchStatus = 'PENDING_MIDDLEMAN' | 'PENDING_RECEIPT' | 'RECEIVED' | 'PARTIAL_RECEIVED' | 'DISPUTED';
export type TransactionType = 'CASH_RECEIVED' | 'EXPENSE' | 'ADJUSTMENT' | 'SITE_TRANSFER_IN' | 'SITE_TRANSFER_OUT';
export type NotificationType = 'DISPATCH_CREATED' | 'RECEIPT_PENDING' | 'RECEIPT_CONFIRMED' | 'LOW_BALANCE' | 'EXPENSE_ADDED' | 'EXPENSE_APPROVED' | 'EXPENSE_REJECTED' | 'MIDDLEMAN_FORWARDED' | 'TRANSFER_CREATED' | 'TRANSFER_RECEIVED';
export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type SiteTransferStatus = 'PENDING' | 'RECEIVED' | 'REJECTED';


export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface Site {
  id: string;
  code: string;
  name: string;
  location: string;
  status: SiteStatus;
  currentBalance: number;
  supervisorId?: string;
  supervisor?: Partial<User>;
  createdAt: string;
  updatedAt: string;
}

export interface CashDispatch {
  id: string;
  siteId: string;
  amount: number;
  carrierName: string;
  purpose: string;
  notes?: string;
  dispatchDate: string;
  status: DispatchStatus;
  createdById: string;
  middlemanId?: string;
  commissionAmount?: number;
  amountAfterCommission?: number;
  middlemanProcessedAt?: string;
  site?: Partial<Site>;
  createdBy?: Partial<User>;
  middleman?: Partial<User>;
  receipt?: Partial<CashReceipt>;
  createdAt: string;
  updatedAt: string;
}

export interface CashReceipt {
  id: string;
  dispatchId: string;
  siteId: string;
  receivedAmount: number;
  discrepancyAmount: number;
  remarks?: string;
  receivedById: string;
  dispatch?: Partial<CashDispatch>;
  site?: Partial<Site>;
  receivedBy?: Partial<User>;
  receivedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
}

export interface Attachment {
  id: string;
  fileName: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  size: number;
  referenceType: string;
  referenceId: string;
  uploadedById: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  siteId: string;
  categoryId: string;
  amount: number;
  vendorName: string;
  description?: string;
  expenseDate: string;
  status: ExpenseStatus;
  createdById: string;
  site?: Partial<Site>;
  category?: ExpenseCategory;
  createdBy?: Partial<User>;
  attachments?: Attachment[];
  createdAt: string;
}


export interface LedgerEntry {
  id: string;
  siteId: string;
  transactionType: TransactionType;
  referenceType: string;
  referenceId: string;
  credit: number;
  debit: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
  site?: Partial<Site>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export interface SiteTransfer {
  id: string;
  fromSiteId: string;
  toSiteId: string;
  amount: number;
  notes?: string;
  status: SiteTransferStatus;
  initiatedById: string;
  receivedById?: string;
  fromSite?: Partial<Site>;
  toSite?: Partial<Site>;
  initiatedBy?: Partial<User>;
  receivedBy?: Partial<User>;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  activeSitesCount: number;
  totalCashAtSites: number;
  totalCashInTransit: number;
  totalExpenses: number;
  recentDispatches: CashDispatch[];
  recentExpenses: Expense[];
  categoryExpenses: { category: string; amount: number }[];
  monthlyExpenses: { month: string; amount: number }[];
}

export interface SupervisorStats {
  hasSite: boolean;
  siteId?: string;
  siteName?: string;
  siteCode?: string;
  siteLocation?: string;
  currentBalance?: number;
  totalReceived?: number;
  totalSpent?: number;
  assignedSites: Partial<Site>[];
  recentDispatches: CashDispatch[];
  recentExpenses: Expense[];
  categoryExpenses: { category: string; amount: number }[];
}

export interface MiddlemanStats {
  pendingCount: number;
  totalProcessed: number;
  totalCommissionEarned: number;
  totalAmountForwarded: number;
  recentDispatches: CashDispatch[];
}

