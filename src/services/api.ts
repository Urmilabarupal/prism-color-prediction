import {
  AuditLogEntry,
  BetRecord,
  BetSelection,
  BetType,
  DashboardStats,
  GameMode,
  GameRound,
  PaymentMethod,
  PaymentOrder,
  ReferralStats,
  RoundResult,
  SupportTicket,
  SystemSettings,
  User,
  WalletTransaction,
  WithdrawalMethod,
  WithdrawalRequest,
} from '../types.js';
import { calculateClientRound } from '../utils/gameRules.js';

const MANAGER_TOKEN_KEY = 'prism_manager_token';

export function getManagerToken(): string | null {
  return localStorage.getItem(MANAGER_TOKEN_KEY);
}

export function setManagerToken(token: string | null): void {
  if (token) {
    localStorage.setItem(MANAGER_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(MANAGER_TOKEN_KEY);
  }
}

async function fetchJson<T>(url: string, options?: RequestInit, retries = 3): Promise<T> {
  let lastError: any;
  const managerToken = getManagerToken();

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          ...(managerToken ? { 'x-manager-token': managerToken } : {}),
          ...(options?.headers || {}),
        },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `Server request failed with status ${response.status}`);
      }
      return data;
    } catch (err: any) {
      lastError = err;
      if (attempt < retries) {
        // Give the dev/proxy server time to finish booting after a cold start.
        await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
      }
    }
  }
  throw lastError;
}

export const api = {
  // User Authentication
  async login(identifier: string, password: string, loginType: 'phone' | 'email' = 'phone'): Promise<User> {
    const res = await fetchJson<{ success: boolean; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, loginType }),
    });
    return res.user;
  },

  async googleLogin(): Promise<User> {
    const res = await fetchJson<{ success: boolean; user: User }>('/api/auth/google-login', {
      method: 'POST',
    });
    return res.user;
  },

  async register(params: {
    phone?: string;
    email?: string;
    password: string;
    inviteCode?: string;
  }): Promise<User> {
    const res = await fetchJson<{ success: boolean; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    return res.user;
  },

  async getMe(userId: string): Promise<User> {
    const res = await fetchJson<{ success: boolean; user: User }>(`/api/auth/me?userId=${encodeURIComponent(userId)}`);
    return res.user;
  },

  // Game Engine
  async getCurrentRound(mode: GameMode): Promise<{ round: GameRound; history: RoundResult[] }> {
    try {
      return await fetchJson<{ success: boolean; round: GameRound; history: RoundResult[] }>(
        `/api/game/current?mode=${mode}`,
        undefined,
        2
      );
    } catch {
      const fallbackRound = calculateClientRound(mode);
      return {
        round: fallbackRound,
        history: [],
      };
    }
  },

  async getGameHistory(mode: GameMode): Promise<RoundResult[]> {
    try {
      const res = await fetchJson<{ success: boolean; history: RoundResult[] }>(
        `/api/game/history?mode=${mode}`,
        undefined,
        1
      );
      return res.history || [];
    } catch {
      return [];
    }
  },

  async placeBet(params: {
    userId: string;
    mode: GameMode;
    periodId: string;
    type: BetType;
    selection: BetSelection;
    amount: number;
  }): Promise<{ success: boolean; message: string; bet?: BetRecord; newBalance?: number }> {
    return await fetchJson<{ success: boolean; message: string; bet?: BetRecord; newBalance?: number }>(
      '/api/game/bet',
      {
        method: 'POST',
        body: JSON.stringify(params),
      },
      1
    );
  },

  async getMyBets(userId: string, mode?: GameMode): Promise<BetRecord[]> {
    try {
      const query = new URLSearchParams({ userId });
      if (mode) query.append('mode', mode);
      const res = await fetchJson<{ success: boolean; bets: BetRecord[] }>(
        `/api/game/my-bets?${query.toString()}`,
        undefined,
        1
      );
      return res.bets || [];
    } catch {
      return [];
    }
  },

  // Wallet
  async getWallet(userId: string): Promise<{
    currency: string;
    availableBalance: number;
    lockedBalance: number;
    totalBalance: number;
    totalDeposited: number;
    totalWithdrawn: number;
    totalWinnings: number;
    totalBets: number;
    bonus: number;
    promotion: number;
    gift: number;
  }> {
    const res = await fetchJson<{
      success: boolean;
      wallet: any;
    }>(`/api/wallet?userId=${encodeURIComponent(userId)}`);
    return res.wallet;
  },

  async getTransactions(userId: string): Promise<WalletTransaction[]> {
    const res = await fetchJson<{ success: boolean; transactions: WalletTransaction[] }>(
      `/api/wallet/transactions?userId=${encodeURIComponent(userId)}`
    );
    return res.transactions;
  },

  // USD Payment Flow
  async createPaymentOrder(params: {
    userId: string;
    amount: number;
    method: PaymentMethod;
  }): Promise<{ success: boolean; order: PaymentOrder; verificationToken: string; instructions: string }> {
    return await fetchJson('/api/payment/create-order', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async verifyPayment(params: {
    orderId: string;
    verificationToken?: string;
  }): Promise<{ success: boolean; message: string; newBalance: number; order: PaymentOrder; transaction: WalletTransaction }> {
    return await fetchJson('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // USD Withdrawal Flow
  async withdraw(params: {
    userId: string;
    amount: number;
    method: WithdrawalMethod;
    destination: any;
  }): Promise<{
    success: boolean;
    message: string;
    withdrawal: WithdrawalRequest;
    availableBalance: number;
    lockedBalance: number;
    transaction: WalletTransaction;
  }> {
    return await fetchJson('/api/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Referral & Support
  async getReferral(userId: string): Promise<ReferralStats> {
    const res = await fetchJson<{ success: boolean; stats: ReferralStats }>(
      `/api/referral?userId=${encodeURIComponent(userId)}`
    );
    return res.stats;
  },

  async getSupportMessages(userId: string): Promise<SupportTicket[]> {
    const res = await fetchJson<{ success: boolean; messages: SupportTicket[] }>(
      `/api/support/messages?userId=${encodeURIComponent(userId)}`
    );
    return res.messages;
  },

  async sendSupportMessage(
    userId: string,
    message: string
  ): Promise<{ success: boolean; userMessage: SupportTicket; agentMessage: SupportTicket }> {
    return await fetchJson('/api/support/send', {
      method: 'POST',
      body: JSON.stringify({ userId, message }),
    });
  },

  async updateSettings(
    userId: string,
    data: { bankDetails?: any; newPassword?: string }
  ): Promise<{ success: boolean; user: User; message: string }> {
    return await fetchJson('/api/user/settings', {
      method: 'POST',
      body: JSON.stringify({ userId, ...data }),
    });
  },

  async updateBankDetails(
    userId: string,
    bankDetails: any
  ): Promise<{ success: boolean; user: User; message: string }> {
    return await this.updateSettings(userId, { bankDetails });
  },

  async changePassword(
    userId: string,
    _oldPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await this.updateSettings(userId, { newPassword });
    return { success: res.success, message: res.message };
  },

  // ==========================================
  // MANAGER PANEL CLIENT METHODS
  // ==========================================

  async managerLogin(
    identifier: string,
    password: string
  ): Promise<{ success: boolean; token: string; manager: User }> {
    const res = await fetchJson<{ success: boolean; token: string; manager: User }>(
      '/api/manager/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
      }
    );
    if (res.token) {
      setManagerToken(res.token);
    }
    return res;
  },

  async getManagerDashboardStats(timeFilter: string = 'all'): Promise<DashboardStats> {
    const res = await fetchJson<{ success: boolean; stats: DashboardStats }>(
      `/api/manager/dashboard/stats?timeFilter=${encodeURIComponent(timeFilter)}`
    );
    return res.stats;
  },

  async getManagerUsers(search?: string, status?: string): Promise<User[]> {
    const q = new URLSearchParams();
    if (search) q.append('search', search);
    if (status) q.append('status', status);
    const res = await fetchJson<{ success: boolean; users: User[] }>(
      `/api/manager/users?${q.toString()}`
    );
    return res.users || [];
  },

  async getManagerUserDetail(uid: string): Promise<{
    user: User;
    bets: BetRecord[];
    transactions: WalletTransaction[];
    withdrawals: WithdrawalRequest[];
    deposits: PaymentOrder[];
  }> {
    return await fetchJson(`/api/manager/users/${encodeURIComponent(uid)}`);
  },

  async updateUserStatus(
    uid: string,
    status: 'ACTIVE' | 'SUSPENDED',
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    return await fetchJson(`/api/manager/users/${encodeURIComponent(uid)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status, reason }),
    });
  },

  async adjustUserBalance(
    uid: string,
    params: { amount: number; reason: string; type: 'CREDIT' | 'DEBIT' }
  ): Promise<{ success: boolean; message: string; newBalance: number }> {
    return await fetchJson(`/api/manager/users/${encodeURIComponent(uid)}/adjust-balance`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  async getManagerDeposits(status?: string): Promise<PaymentOrder[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetchJson<{ success: boolean; deposits: PaymentOrder[] }>(
      `/api/manager/deposits${q}`
    );
    return res.deposits || [];
  },

  async approveDeposit(
    orderId: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return await fetchJson(`/api/manager/deposits/${encodeURIComponent(orderId)}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async getManagerWithdrawals(status?: string): Promise<WithdrawalRequest[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    const res = await fetchJson<{ success: boolean; withdrawals: WithdrawalRequest[] }>(
      `/api/manager/withdrawals${q}`
    );
    return res.withdrawals || [];
  },

  async actOnWithdrawal(
    id: string,
    action: 'APPROVE' | 'PROCESS' | 'COMPLETE' | 'REJECT',
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return await fetchJson(`/api/manager/withdrawals/${encodeURIComponent(id)}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  },

  async getManagerActiveGames(): Promise<any[]> {
    const res = await fetchJson<{ success: boolean; activeRounds: any[] }>('/api/manager/games/active');
    return res.activeRounds || [];
  },

  async getManagerBets(filters?: { periodId?: string; userId?: string; mode?: GameMode; status?: string }): Promise<BetRecord[]> {
    const q = new URLSearchParams();
    if (filters?.periodId) q.append('periodId', filters.periodId);
    if (filters?.userId) q.append('userId', filters.userId);
    if (filters?.mode) q.append('mode', filters.mode);
    if (filters?.status) q.append('status', filters.status);
    const res = await fetchJson<{ success: boolean; bets: BetRecord[] }>(`/api/manager/bets?${q.toString()}`);
    return res.bets || [];
  },

  async getManagerAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await fetchJson<{ success: boolean; auditLogs: AuditLogEntry[] }>('/api/manager/audit-logs');
    return res.auditLogs || [];
  },

  async getManagerFinancialReport(): Promise<any> {
    const res = await fetchJson<{ success: boolean; report: any }>('/api/manager/reports/financial');
    return res.report;
  },

  async getManagerSettings(): Promise<SystemSettings> {
    const res = await fetchJson<{ success: boolean; settings: SystemSettings }>('/api/manager/settings');
    return res.settings;
  },

  async updateManagerSettings(settings: Partial<SystemSettings>): Promise<{ success: boolean; settings: SystemSettings }> {
    return await fetchJson('/api/manager/settings', {
      method: 'POST',
      body: JSON.stringify({ settings }),
    });
  },
};
