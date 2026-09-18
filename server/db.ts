import fs from 'fs';
import path from 'path';
import {
  AuditLogEntry,
  BetRecord,
  GameMode,
  PaymentOrder,
  RoundResult,
  SupportTicket,
  SystemSettings,
  TransactionStatus,
  TransactionType,
  User,
  WalletTransaction,
  WithdrawalRequest,
} from '../src/types.js';

export interface DatabaseSchema {
  users: Record<string, User & { passwordHash: string }>;
  roundsHistory: Record<GameMode, RoundResult[]>;
  bets: BetRecord[];
  transactions: WalletTransaction[];
  paymentOrders: PaymentOrder[];
  withdrawals: WithdrawalRequest[];
  auditLogs: AuditLogEntry[];
  supportTickets: SupportTicket[];
  systemSettings: SystemSettings;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialRounds(mode: GameMode): RoundResult[] {
  const list: RoundResult[] = [];
  const now = Date.now();
  // Pre-seed 25 recent historical rounds
  for (let i = 25; i >= 1; i--) {
    const timestamp = now - i * 60000;
    const dateObj = new Date(timestamp);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const periodSeq = String(100 + 25 - i).padStart(4, '0');
    const periodId = `${yyyy}${mm}${dd}${periodSeq}`;

    const num = Math.floor(Math.random() * 10);
    const colors: ('green' | 'violet' | 'red')[] = [];
    if (num === 0) colors.push('red', 'violet');
    else if (num === 5) colors.push('green', 'violet');
    else if (num % 2 === 0) colors.push('red');
    else colors.push('green');

    const bigSmall: 'big' | 'small' = num >= 5 ? 'big' : 'small';

    list.push({
      periodId,
      mode,
      number: num,
      colors,
      bigSmall,
      time: dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp,
    });
  }
  return list;
}

const defaultUser: User & { passwordHash: string } = {
  id: '123456',
  username: 'Alex_VipPlayer',
  phone: '9876543210',
  email: 'demo@prismgame.com',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  role: 'user',
  status: 'ACTIVE',
  balance: 1250.0, // Legacy alias for funding wallet
  fundingWalletBalance: 1250.0,
  mainWalletBalance: 0.0,
  lockedBalance: 0.0, // USD Locked in Pending Withdrawals
  restrictedBonusBalance: 50.0,
  totalDeposited: 2000.0, // USD
  totalWithdrawn: 500.0, // USD
  totalWinnings: 850.0, // USD
  totalBets: 1100.0, // USD
  bonus: 50.0,
  promotion: 0.0,
  gift: 0.0,
  vipLevel: 2,
  inviteCode: '123456',
  passwordHash: 'password123',
  bankDetails: {
    accountName: 'Alex Mercer',
    accountNumber: '482910394821',
    routingNumber: '021000021',
    bankName: 'JPMorgan Chase Bank, N.A.',
    paypalEmail: 'alex.mercer@gmail.com',
    usdtTrc20Address: 'TNv9k2p8zY4e87M9sX2w1qL3jK5hG8rD4f',
    usdtBep20Address: '0x71C8360f38A9f47132924A224D2A2fB25c5C5199',
  },
  createdAt: Date.now() - 30 * 86400000,
  lastLogin: Date.now() - 3600000,
};

const superManager: User & { passwordHash: string } = {
  id: 'MGR-888999',
  managerUid: 'MGR-888999',
  username: 'SuperAdmin_Prism',
  email: 'admin@prismgame.com',
  phone: '18005550199',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'super_manager',
  permissions: [
    'dashboard.view',
    'users.view',
    'users.manage',
    'deposits.view',
    'deposits.manage',
    'withdrawals.view',
    'withdrawals.manage',
    'games.view',
    'games.manage',
    'reports.view',
    'settings.manage',
  ],
  status: 'ACTIVE',
  balance: 100000.0,
  lockedBalance: 0.0,
  totalDeposited: 0,
  totalWithdrawn: 0,
  totalWinnings: 0,
  totalBets: 0,
  bonus: 0,
  promotion: 0,
  gift: 0,
  vipLevel: 10,
  inviteCode: 'ADMIN01',
  passwordHash: 'Manager@2026',
  createdAt: Date.now() - 60 * 86400000,
  lastLogin: Date.now(),
};

const opsManager: User & { passwordHash: string } = {
  id: 'MGR-100200',
  managerUid: 'MGR-100200',
  username: 'Finance_Officer',
  email: 'ops@prismgame.com',
  phone: '18005550200',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  role: 'manager',
  permissions: [
    'dashboard.view',
    'users.view',
    'deposits.view',
    'deposits.manage',
    'withdrawals.view',
    'withdrawals.manage',
    'games.view',
    'reports.view',
  ],
  status: 'ACTIVE',
  balance: 50000.0,
  lockedBalance: 0.0,
  totalDeposited: 0,
  totalWithdrawn: 0,
  totalWinnings: 0,
  totalBets: 0,
  bonus: 0,
  promotion: 0,
  gift: 0,
  vipLevel: 8,
  inviteCode: 'OPS02',
  passwordHash: 'Manager@2026',
  createdAt: Date.now() - 40 * 86400000,
  lastLogin: Date.now() - 7200000,
};

const initialSettings: SystemSettings = {
  minDepositUsd: 10,
  maxDepositUsd: 25000,
  minWithdrawalUsd: 100,
  maxWithdrawalUsd: 10000,
  dailyWithdrawalLimitUsd: 25000,
  houseCommissionPercent: 2.0,
  paymentGateways: {
    stripeEnabled: true,
    cryptoEnabled: true,
    paypalEnabled: true,
    bankWireEnabled: true,
    usdtTrc20Address: 'TNv9k2p8zY4e87M9sX2w1qL3jK5hG8rD4f',
    usdtBep20Address: '0x71C8360f38A9f47132924A224D2A2fB25c5C5199',
    depositQrCode: '',
  },
  reward: {
    enabled: true,
    percentage: 10,
    fixedAmount: 0,
    minimumDeposit: 10,
    maximumReward: 100,
    expiryDays: 30,
    conditions: 'Bonus is restricted until eligible game activity is completed.',
  },
};

let db: DatabaseSchema = {
  users: {
    [defaultUser.id]: defaultUser,
    [defaultUser.phone!]: defaultUser,
    [defaultUser.email!]: defaultUser,
    [superManager.id]: superManager,
    [superManager.email!]: superManager,
    [opsManager.id]: opsManager,
    [opsManager.email!]: opsManager,
  },
  roundsHistory: {
    '1min': getInitialRounds('1min'),
    '3min': getInitialRounds('3min'),
    '5min': getInitialRounds('5min'),
    '10min': getInitialRounds('10min'),
  },
  bets: [
    {
      id: 'bet_init_1',
      userId: '123456',
      periodId: '202609160120',
      mode: '1min',
      type: 'color',
      selection: 'green',
      amount: 100, // USD
      payout: 196, // USD
      status: 'WON',
      createdAt: Date.now() - 300000,
      resolvedAt: Date.now() - 240000,
      resultNumber: 7,
      resultColors: ['green'],
      resultBigSmall: 'big',
    },
    {
      id: 'bet_init_2',
      userId: '123456',
      periodId: '202609160121',
      mode: '1min',
      type: 'bigSmall',
      selection: 'small',
      amount: 50, // USD
      payout: 98, // USD
      status: 'WON',
      createdAt: Date.now() - 240000,
      resolvedAt: Date.now() - 180000,
      resultNumber: 3,
      resultColors: ['green'],
      resultBigSmall: 'small',
    },
    {
      id: 'bet_init_3',
      userId: '123456',
      periodId: '202609160122',
      mode: '1min',
      type: 'color',
      selection: 'violet',
      amount: 50, // USD
      payout: 0,
      status: 'LOST',
      createdAt: Date.now() - 180000,
      resolvedAt: Date.now() - 120000,
      resultNumber: 8,
      resultColors: ['red'],
      resultBigSmall: 'big',
    },
  ],
  transactions: [
    {
      id: 'tx_init_1',
      userId: '123456',
      type: 'DEPOSIT',
      amount: 1000, // USD
      currency: 'USD',
      status: 'COMPLETED',
      description: 'Deposit via Stripe (USD Credit Card)',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
      method: 'STRIPE_CARD',
      referenceId: 'ch_3N82x9L1A94b2',
      oldBalance: 250,
      newBalance: 1250,
    },
    {
      id: 'tx_init_2',
      userId: '123456',
      type: 'BET',
      amount: 100, // USD
      currency: 'USD',
      status: 'COMPLETED',
      description: 'Bet on Win Go 1 Min (Period 202609160120)',
      createdAt: Date.now() - 300000,
      updatedAt: Date.now() - 300000,
      roundId: '202609160120',
      oldBalance: 1250,
      newBalance: 1150,
    },
    {
      id: 'tx_init_3',
      userId: '123456',
      type: 'WIN',
      amount: 196, // USD
      currency: 'USD',
      status: 'COMPLETED',
      description: 'Win Payout: Win Go 1 Min Period 202609160120',
      createdAt: Date.now() - 240000,
      updatedAt: Date.now() - 240000,
      roundId: '202609160120',
      oldBalance: 1150,
      newBalance: 1346,
    },
  ],
  paymentOrders: [
    {
      id: 'order_usd_101',
      userId: '123456',
      amount: 1000,
      currency: 'USD',
      method: 'STRIPE_CARD',
      status: 'COMPLETED',
      gatewayReference: 'pi_3N92k1948x12',
      createdAt: Date.now() - 86400000,
      completedAt: Date.now() - 86400000 + 4000,
      verifiedBy: 'SERVER_VERIFY',
    },
    {
      id: 'order_usd_102',
      userId: '123456',
      amount: 250,
      currency: 'USD',
      method: 'CRYPTO_USDT',
      status: 'PENDING',
      gatewayReference: 'tx_0x92f8194e82b7',
      depositAddress: 'TNv9k2p8zY4e87M9sX2w1qL3jK5hG8rD4f',
      createdAt: Date.now() - 1800000,
    },
  ],
  withdrawals: [
    {
      id: 'wd_usd_901',
      userId: '123456',
      amount: 500,
      fee: 0,
      netAmount: 500,
      currency: 'USD',
      method: 'BANK_WIRE',
      destination: {
        accountName: 'Alex Mercer',
        accountNumber: '482910394821',
        routingNumber: '021000021',
        bankName: 'JPMorgan Chase Bank, N.A.',
      },
      status: 'COMPLETED',
      requestedAt: Date.now() - 48 * 3600000,
      processedAt: Date.now() - 47 * 3600000,
      managerUid: 'MGR-888999',
      actionHistory: [
        {
          managerUid: 'MGR-888999',
          action: 'APPROVED',
          timestamp: Date.now() - 47.5 * 3600000,
          prevStatus: 'PENDING',
          newStatus: 'APPROVED',
          reason: 'KYC verified and balance cleared',
        },
        {
          managerUid: 'MGR-888999',
          action: 'COMPLETED',
          timestamp: Date.now() - 47 * 3600000,
          prevStatus: 'APPROVED',
          newStatus: 'COMPLETED',
          reason: 'Fedwire transfer dispatched #FW-98124',
        },
      ],
    },
  ],
  auditLogs: [
    {
      id: 'audit_init_1',
      managerUid: 'MGR-888999',
      action: 'SYSTEM_BOOTSTRAP',
      reason: 'Initialized Prism USD Financial & Game Engine Architecture',
      timestamp: Date.now() - 86400000,
      ip: '127.0.0.1',
    },
  ],
  supportTickets: [
    {
      id: 'msg_1',
      userId: '123456',
      sender: 'agent',
      message: 'Welcome to Prism Customer Support! How can we assist you today?',
      timestamp: Date.now() - 3600000,
    },
  ],
  systemSettings: initialSettings,
};

// Try loading existing file if present, else initialize
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.users && parsed.roundsHistory) {
      db = {
        ...db,
        ...parsed,
        users: {
          ...db.users,
          ...(parsed.users || {}),
        },
        paymentOrders: parsed.paymentOrders || db.paymentOrders,
        withdrawals: parsed.withdrawals || db.withdrawals,
        auditLogs: parsed.auditLogs || db.auditLogs,
        systemSettings: {
          ...initialSettings,
          ...(parsed.systemSettings || {}),
          paymentGateways: { ...initialSettings.paymentGateways, ...(parsed.systemSettings?.paymentGateways || {}) },
          reward: { ...initialSettings.reward, ...(parsed.systemSettings?.reward || {}) },
        },
      };
      Object.values(db.users).forEach((user) => {
        user.fundingWalletBalance = user.fundingWalletBalance ?? user.balance ?? 0;
        user.mainWalletBalance = user.mainWalletBalance ?? 0;
        user.restrictedBonusBalance = user.restrictedBonusBalance ?? user.bonus ?? 0;
        user.balance = user.fundingWalletBalance;
      });
      // Always ensure manager accounts exist and have proper roles & permissions
      db.users[superManager.id] = superManager;
      db.users[superManager.email!] = superManager;
      db.users[opsManager.id] = opsManager;
      db.users[opsManager.email!] = opsManager;

      // Ensure demo user has role 'user' and required USD fields
      if (db.users['123456']) {
        db.users['123456'].role = db.users['123456'].role || 'user';
        db.users['123456'].status = db.users['123456'].status || 'ACTIVE';
        db.users['123456'].lockedBalance = db.users['123456'].lockedBalance ?? 0;
        db.users['123456'].totalDeposited = db.users['123456'].totalDeposited ?? 2000;
        db.users['123456'].totalWithdrawn = db.users['123456'].totalWithdrawn ?? 500;
        db.users['123456'].totalWinnings = db.users['123456'].totalWinnings ?? 850;
        db.users['123456'].totalBets = db.users['123456'].totalBets ?? 1100;
      }
    }
  } else {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
} catch (e) {
  console.error('Error loading DB file, using default:', e);
}

export function saveDb(): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving DB file:', e);
  }
}

export function getDb(): DatabaseSchema {
  return db;
}

export function logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const log: AuditLogEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };
  db.auditLogs.unshift(log);
  if (db.auditLogs.length > 500) {
    db.auditLogs.pop();
  }
  saveDb();
  return log;
}

export function addLedgerTransaction(params: {
  userId: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  description: string;
  method?: string;
  referenceId?: string;
  roundId?: string;
  managerUid?: string;
  oldBalance?: number;
  newBalance?: number;
}): WalletTransaction {
  const tx: WalletTransaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    userId: params.userId,
    amount: Math.round((Number(params.amount) || 0) * 100) / 100,
    currency: 'USD',
    type: params.type,
    status: params.status,
    description: params.description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    method: params.method,
    referenceId: params.referenceId,
    roundId: params.roundId,
    managerUid: params.managerUid,
    oldBalance: params.oldBalance !== undefined ? Math.round(params.oldBalance * 100) / 100 : undefined,
    newBalance: params.newBalance !== undefined ? Math.round(params.newBalance * 100) / 100 : undefined,
  };
  db.transactions.unshift(tx);
  if (db.transactions.length > 2000) {
    db.transactions.pop();
  }
  return tx;
}
