export type GameMode = '1min' | '3min' | '5min' | '10min';

export type BetType = 'color' | 'number' | 'bigSmall';
export type ColorSelection = 'green' | 'violet' | 'red';
export type BigSmallSelection = 'big' | 'small';
export type BetSelection = ColorSelection | BigSmallSelection | number;

export interface GameRound {
  periodId: string;
  mode: GameMode;
  startTime: number;
  endTime: number;
  bettingEndTime: number;
  timeLeft: number;
  isBettingOpen: boolean;
  serverTime: number;
}

export interface RoundResult {
  periodId: string;
  mode: GameMode;
  number: number;
  colors: ('green' | 'violet' | 'red')[];
  bigSmall: 'big' | 'small';
  time: string;
  timestamp: number;
}

export interface BetRecord {
  id: string;
  userId: string;
  periodId: string;
  mode: GameMode;
  type: BetType;
  selection: BetSelection;
  amount: number; // in USD
  payout: number; // in USD
  status: 'PENDING' | 'WON' | 'LOST';
  createdAt: number;
  resolvedAt?: number;
  resultNumber?: number;
  resultColors?: ('green' | 'violet' | 'red')[];
  resultBigSmall?: 'big' | 'small';
}

export type UserRole = 'user' | 'manager' | 'super_manager';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';

export type ManagerPermission =
  | 'dashboard.view'
  | 'users.view'
  | 'users.manage'
  | 'deposits.view'
  | 'deposits.manage'
  | 'withdrawals.view'
  | 'withdrawals.manage'
  | 'games.view'
  | 'games.manage'
  | 'reports.view'
  | 'settings.manage';

export interface User {
  id: string;
  username: string;
  phone?: string;
  email?: string;
  avatar: string;
  role: UserRole;
  managerUid?: string;
  permissions?: ManagerPermission[];
  status: UserStatus;
  balance: number; // Available USD Balance
  lockedBalance: number; // USD Locked in Pending Withdrawals
  totalDeposited: number; // Cumulative USD Deposited
  totalWithdrawn: number; // Cumulative USD Withdrawn
  totalWinnings: number; // Cumulative USD Won
  totalBets: number; // Cumulative USD Wagered
  bonus: number; // USD Bonus
  promotion: number;
  gift: number;
  vipLevel: number;
  inviteCode: string;
  invitedBy?: string;
  lastLogin?: number;
  bankDetails?: {
    accountName?: string;
    accountHolder?: string;
    accountNumber: string;
    routingNumber?: string;
    bankName: string;
    usdtTrc20Address?: string;
    usdtBep20Address?: string;
    paypalEmail?: string;
  };
  createdAt: number;
}

export type TransactionType =
  | 'DEPOSIT'
  | 'BET'
  | 'WIN'
  | 'LOSS'
  | 'WITHDRAWAL'
  | 'REFUND'
  | 'BONUS'
  | 'ADJUSTMENT';

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'REJECTED';

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number; // USD amount
  currency: 'USD';
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  createdAt: number;
  updatedAt: number;
  method?: string;
  referenceId?: string;
  roundId?: string;
  managerUid?: string;
  oldBalance?: number;
  newBalance?: number;
}

export type PaymentMethod = 'STRIPE_CARD' | 'CRYPTO_USDT' | 'PAYPAL' | 'BANK_WIRE';

export interface PaymentOrder {
  id: string;
  userId: string;
  amount: number; // USD
  currency: 'USD';
  method: PaymentMethod;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  gatewayReference: string;
  depositAddress?: string;
  createdAt: number;
  completedAt?: number;
  verifiedBy?: 'SYSTEM_WEBHOOK' | 'MANAGER' | 'SERVER_VERIFY';
  metadata?: Record<string, any>;
}

export type WithdrawalMethod = 'BANK_WIRE' | 'USDT_TRC20' | 'USDT_BEP20' | 'PAYPAL';
export type WithdrawalStatus = 'PENDING' | 'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number; // USD
  fee: number; // USD
  netAmount: number; // USD
  currency: 'USD';
  method: WithdrawalMethod;
  destination: {
    accountName?: string;
    accountNumber?: string;
    routingNumber?: string;
    bankName?: string;
    walletAddress?: string;
    paypalEmail?: string;
  };
  status: WithdrawalStatus;
  requestedAt: number;
  processedAt?: number;
  managerUid?: string;
  rejectionReason?: string;
  actionHistory: {
    managerUid: string;
    action: string;
    timestamp: number;
    prevStatus: WithdrawalStatus;
    newStatus: WithdrawalStatus;
    reason?: string;
  }[];
}

export interface AuditLogEntry {
  id: string;
  managerUid: string;
  action: string;
  targetUserUid?: string;
  targetTransactionId?: string;
  targetRoundId?: string;
  oldValue?: string;
  newValue?: string;
  reason: string;
  ip?: string;
  timestamp: number;
}

export interface SystemSettings {
  minDepositUsd: number;
  maxDepositUsd: number;
  minWithdrawalUsd: number;
  maxWithdrawalUsd: number;
  dailyWithdrawalLimitUsd: number;
  houseCommissionPercent: number;
  paymentGateways: {
    stripeEnabled: boolean;
    cryptoEnabled: boolean;
    paypalEnabled: boolean;
    bankWireEnabled: boolean;
    usdtTrc20Address: string;
    usdtBep20Address: string;
  };
}

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDeposits: number; // USD
  pendingDeposits: number; // USD
  totalWithdrawals: number; // USD
  pendingWithdrawals: number; // USD
  totalBets: number; // USD
  totalWinningAmount: number; // USD
  grossGamingRevenue: number; // USD (Bets - Winnings)
  activeGameRounds: {
    mode: GameMode;
    periodId: string;
    timeLeft: number;
    totalBetsCount: number;
    totalBetVolumeUsd: number;
    isBettingOpen: boolean;
  }[];
}

export interface ReferralStats {
  inviteCode: string;
  inviteLink: string;
  totalInvited: number;
  totalCommission: number;
  recentReferrals: {
    userId: string;
    username: string;
    joinedAt: number;
    commissionEarned: number;
  }[];
}

export interface SupportTicket {
  id: string;
  userId: string;
  sender: 'user' | 'agent';
  message: string;
  timestamp: number;
}

export type PageId =
  | 'splash'
  | 'login'
  | 'register'
  | 'home'
  | 'game'
  | 'result'
  | 'wallet'
  | 'recharge'
  | 'withdraw'
  | 'profile'
  | 'invite'
  | 'support'
  | 'settings'
  | 'vip'
  | 'tasks'
  | 'manager';

export type ManagerPageId =
  | 'dashboard'
  | 'users'
  | 'deposits'
  | 'withdrawals'
  | 'games'
  | 'bets'
  | 'reports'
  | 'audit-logs'
  | 'settings';

