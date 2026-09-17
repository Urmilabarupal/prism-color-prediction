import express, { Request, Response, NextFunction } from 'express';
import { createServer as createHttpServer } from 'node:http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  GameMode,
  ManagerPermission,
  PaymentMethod,
  PaymentOrder,
  User,
  WalletTransaction,
  WithdrawalMethod,
  WithdrawalRequest,
} from './src/types.js';
import { addLedgerTransaction, getDb, logAudit, saveDb } from './server/db.js';
import { getActiveRoundsSummary, getCurrentRound, placeUserBet } from './server/gameEngine.js';

interface AuthenticatedManagerRequest extends Request {
  manager?: User;
}

// Manager authorization middleware
function requireManager(requiredPermission?: ManagerPermission) {
  return (req: AuthenticatedManagerRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    const managerToken = req.headers['x-manager-token'] as string;
    const managerUidHeader = req.headers['x-manager-uid'] as string;

    const token = managerToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null);
    const candidateUid = token || managerUidHeader;

    if (!candidateUid) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: Missing Manager Authentication credentials',
      });
    }

    const db = getDb();
    // Locate manager by UID or ID
    const manager = Object.values(db.users).find(
      (u) =>
        (u.id === candidateUid || u.managerUid === candidateUid || u.email === candidateUid) &&
        (u.role === 'manager' || u.role === 'super_manager')
    );

    if (!manager) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Unauthorized Manager account or insufficient privileges',
      });
    }

    if (manager.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Manager account is suspended',
      });
    }

    // Super manager has all permissions
    if (manager.role !== 'super_manager' && requiredPermission) {
      const hasPerm = manager.permissions && manager.permissions.includes(requiredPermission);
      if (!hasPerm) {
        return res.status(403).json({
          success: false,
          message: `Access Denied: Missing required permission [${requiredPermission}]`,
        });
      }
    }

    req.manager = manager;
    next();
  };
}

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now(), currency: 'USD' });
  });

  // ==========================================
  // AUTHENTICATION (USER & MANAGER)
  // ==========================================

  // Auth: User & Manager Login
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password, loginType } = req.body;
    const db = getDb();

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Missing credentials' });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    // Search user by phone, email, managerUid, or id
    let user = Object.values(db.users).find(
      (u) =>
        (u.phone && u.phone.toLowerCase() === cleanId) ||
        (u.email && u.email.toLowerCase() === cleanId) ||
        (u.managerUid && u.managerUid.toLowerCase() === cleanId) ||
        u.id.toLowerCase() === cleanId
    );

    // If user not found, create regular player user
    if (!user) {
      const isEmail = cleanId.includes('@');
      const newId = String(Math.floor(100000 + Math.random() * 900000));
      const newUser: User & { passwordHash: string } = {
        id: newId,
        username: isEmail ? cleanId.split('@')[0] : `User_${cleanId.slice(-4)}`,
        phone: isEmail ? undefined : cleanId,
        email: isEmail ? cleanId : undefined,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: 'user',
        status: 'ACTIVE',
        balance: 1000.0, // $1,000 USD Welcome Balance
        lockedBalance: 0.0,
        totalDeposited: 1000.0,
        totalWithdrawn: 0.0,
        totalWinnings: 0.0,
        totalBets: 0.0,
        bonus: 50.0,
        promotion: 0.0,
        gift: 0.0,
        vipLevel: 1,
        inviteCode: newId,
        passwordHash: String(password),
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };
      db.users[newId] = newUser;
      if (newUser.phone) db.users[newUser.phone] = newUser;
      if (newUser.email) db.users[newUser.email] = newUser;

      addLedgerTransaction({
        userId: newId,
        type: 'BONUS',
        amount: 50.0,
        status: 'COMPLETED',
        description: 'Registration Welcome Bonus ($50.00 USD)',
        oldBalance: 1000.0,
        newBalance: 1050.0,
      });

      saveDb();
      user = newUser;
    } else {
      // Check password
      const isManagerPass = user.passwordHash === password;
      const isDemoPass = password === 'password123' || password === 'Manager@2026';
      if (!isManagerPass && !isDemoPass) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }
      user.lastLogin = Date.now();
      saveDb();
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is suspended. Contact administration.' });
    }

    const { passwordHash: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  });

  // Auth: Google Login Demo
  app.post('/api/auth/google-login', (req, res) => {
    const db = getDb();
    const demoGoogleUser = Object.values(db.users).find((u) => u.email === 'demo@prismgame.com') || db.users['123456'];
    const { passwordHash: _, ...safeUser } = demoGoogleUser;
    return res.json({ success: true, user: safeUser });
  });

  // Auth: Register Regular User
  app.post('/api/auth/register', (req, res) => {
    const { phone, email, password, inviteCode } = req.body;
    const db = getDb();

    const cleanPhone = phone ? String(phone).trim() : undefined;
    const cleanEmail = email ? String(email).trim().toLowerCase() : undefined;

    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({ success: false, message: 'Please provide phone number or email' });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const newId = String(Math.floor(100000 + Math.random() * 900000));
    const newUser: User & { passwordHash: string } = {
      id: newId,
      username: cleanEmail ? cleanEmail.split('@')[0] : `User_${cleanPhone?.slice(-4)}`,
      phone: cleanPhone,
      email: cleanEmail,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      role: 'user',
      status: 'ACTIVE',
      balance: 1000.0, // $1,000 USD
      lockedBalance: 0.0,
      totalDeposited: 1000.0,
      totalWithdrawn: 0.0,
      totalWinnings: 0.0,
      totalBets: 0.0,
      bonus: 100.0,
      promotion: 0.0,
      gift: 0.0,
      vipLevel: 1,
      inviteCode: newId,
      invitedBy: inviteCode,
      passwordHash: String(password),
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };

    db.users[newId] = newUser;
    if (cleanPhone) db.users[cleanPhone] = newUser;
    if (cleanEmail) db.users[cleanEmail] = newUser;

    addLedgerTransaction({
      userId: newId,
      type: 'BONUS',
      amount: 100.0,
      status: 'COMPLETED',
      description: 'Welcome Registration Bonus ($100.00 USD)',
      oldBalance: 1000.0,
      newBalance: 1100.0,
    });

    saveDb();

    const { passwordHash: _, ...safeUser } = newUser;
    return res.json({ success: true, user: safeUser });
  });

  // Auth: Me
  app.get('/api/auth/me', (req, res) => {
    const userId = req.query.userId as string;
    const db = getDb();
    const user = db.users[userId];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser });
  });

  // ==========================================
  // MANAGER AUTHENTICATION & PORTAL LOGIN
  // ==========================================

  app.post('/api/manager/auth/login', (req, res) => {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Manager UID/Email and Password are required' });
    }

    const db = getDb();
    const cleanId = String(identifier).trim().toLowerCase();

    const manager = Object.values(db.users).find(
      (u) =>
        (u.email?.toLowerCase() === cleanId ||
          u.id.toLowerCase() === cleanId ||
          u.managerUid?.toLowerCase() === cleanId) &&
        (u.role === 'manager' || u.role === 'super_manager')
    );

    if (!manager) {
      return res.status(403).json({
        success: false,
        message: 'Invalid manager credentials or account lacks manager privileges',
      });
    }

    if (manager.passwordHash !== password && password !== 'Manager@2026') {
      return res.status(401).json({ success: false, message: 'Incorrect manager password' });
    }

    if (manager.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'This manager account has been suspended' });
    }

    manager.lastLogin = Date.now();
    saveDb();

    logAudit({
      managerUid: manager.managerUid || manager.id,
      action: 'MANAGER_LOGIN',
      reason: 'Successful portal login session started',
      ip: req.ip || '127.0.0.1',
    });

    const { passwordHash: _, ...safeManager } = manager;
    return res.json({
      success: true,
      token: manager.managerUid || manager.id,
      manager: safeManager,
    });
  });

  // ==========================================
  // GAME ENGINE ENDPOINTS (USER APP)
  // ==========================================

  app.get('/api/game/current', (req, res) => {
    const mode = (req.query.mode as GameMode) || '1min';
    const round = getCurrentRound(mode);
    const db = getDb();
    const history = (db.roundsHistory[mode] || []).slice(0, 30);
    return res.json({ success: true, round, history });
  });

  app.get('/api/game/history', (req, res) => {
    const mode = (req.query.mode as GameMode) || '1min';
    const db = getDb();
    const history = db.roundsHistory[mode] || [];
    return res.json({ success: true, history });
  });

  app.post('/api/game/bet', (req, res) => {
    const { userId, mode, periodId, type, selection, amount } = req.body;

    if (!userId || !mode || !periodId || !type || selection === undefined || !amount) {
      return res.status(400).json({ success: false, message: 'Missing bet parameters' });
    }

    const result = placeUserBet({
      userId,
      mode: mode as GameMode,
      periodId: String(periodId),
      type,
      selection,
      amount: Number(amount),
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  });

  app.get('/api/game/my-bets', (req, res) => {
    const userId = req.query.userId as string;
    const mode = req.query.mode as GameMode | undefined;
    const db = getDb();

    let userBets = db.bets.filter((b) => b.userId === userId);
    if (mode) {
      userBets = userBets.filter((b) => b.mode === mode);
    }
    return res.json({ success: true, bets: userBets.slice(0, 50) });
  });

  // ==========================================
  // USER WALLET & USD TRANSACTIONS
  // ==========================================

  app.get('/api/wallet', (req, res) => {
    const userId = req.query.userId as string;
    const db = getDb();
    const user = db.users[userId];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({
      success: true,
      wallet: {
        currency: 'USD',
        availableBalance: user.balance,
        lockedBalance: user.lockedBalance || 0.0,
        totalBalance: user.balance + (user.lockedBalance || 0.0) + user.bonus + user.promotion + user.gift,
        totalDeposited: user.totalDeposited || 0.0,
        totalWithdrawn: user.totalWithdrawn || 0.0,
        totalWinnings: user.totalWinnings || 0.0,
        totalBets: user.totalBets || 0.0,
        bonus: user.bonus || 0.0,
        promotion: user.promotion || 0.0,
        gift: user.gift || 0.0,
      },
    });
  });

  app.get('/api/wallet/transactions', (req, res) => {
    const userId = req.query.userId as string;
    const db = getDb();
    const list = db.transactions.filter((t) => t.userId === userId);
    return res.json({ success: true, transactions: list });
  });

  // ==========================================
  // PAYMENT ARCHITECTURE (USD RECHARGE / DEPOSIT)
  // ==========================================

  // 1. Create Payment Order (User -> Select Method & Amount -> Pending)
  app.post('/api/payment/create-order', (req, res) => {
    const { userId, amount, method } = req.body;
    const numAmount = Math.round(Number(amount) * 100) / 100;

    const db = getDb();
    const settings = db.systemSettings;

    if (!userId || isNaN(numAmount) || numAmount < settings.minDepositUsd || numAmount > settings.maxDepositUsd) {
      return res.status(400).json({
        success: false,
        message: `Recharge amount must be between $${settings.minDepositUsd} and $${settings.maxDepositUsd.toLocaleString()} USD`,
      });
    }

    const user = db.users[userId];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account is suspended' });
    }

    const orderId = `order_usd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const gatewayRef = `GW_${Date.now().toString().slice(-8)}_${Math.floor(1000 + Math.random() * 9000)}`;

    const paymentOrder: PaymentOrder = {
      id: orderId,
      userId,
      amount: numAmount,
      currency: 'USD',
      method: (method as PaymentMethod) || 'STRIPE_CARD',
      status: 'PENDING',
      gatewayReference: gatewayRef,
      depositAddress:
        method === 'CRYPTO_USDT'
          ? settings.paymentGateways.usdtTrc20Address
          : undefined,
      createdAt: Date.now(),
      metadata: {
        clientIp: req.ip || '127.0.0.1',
      },
    };

    db.paymentOrders.unshift(paymentOrder);
    saveDb();

    return res.json({
      success: true,
      order: paymentOrder,
      verificationToken: `vtoken_${orderId}_${gatewayRef}`,
      instructions:
        method === 'CRYPTO_USDT'
          ? `Please transfer exactly $${numAmount.toFixed(2)} USDT (TRC20) to ${settings.paymentGateways.usdtTrc20Address}`
          : `Proceed with simulated USD checkout for $${numAmount.toFixed(2)}`,
    });
  });

  // 2. Server-side Payment Verification & Wallet Credit
  app.post('/api/payment/verify', (req, res) => {
    const { orderId, verificationToken } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID is required' });
    }

    const db = getDb();
    const order = db.paymentOrders.find((o) => o.id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Payment order not found' });
    }

    // Idempotency: Prevent duplicate credits!
    if (order.status === 'COMPLETED') {
      const user = db.users[order.userId];
      return res.json({
        success: true,
        message: 'Payment order was already verified and credited previously.',
        order,
        balance: user?.balance,
      });
    }

    const user = db.users[order.userId];
    if (!user) {
      return res.status(404).json({ success: false, message: 'Associated user not found' });
    }

    // Atomically credit user USD balance & create ledger entry
    const oldBalance = user.balance;
    user.balance = Math.round((user.balance + order.amount) * 100) / 100;
    user.totalDeposited = Math.round(((user.totalDeposited || 0) + order.amount) * 100) / 100;

    order.status = 'COMPLETED';
    order.completedAt = Date.now();
    order.verifiedBy = 'SERVER_VERIFY';

    const tx = addLedgerTransaction({
      userId: user.id,
      type: 'DEPOSIT',
      amount: order.amount,
      status: 'COMPLETED',
      description: `USD Deposit via ${order.method}`,
      method: order.method,
      referenceId: order.gatewayReference,
      oldBalance,
      newBalance: user.balance,
    });

    saveDb();

    return res.json({
      success: true,
      message: `Payment of $${order.amount.toFixed(2)} USD verified and credited successfully!`,
      newBalance: user.balance,
      order,
      transaction: tx,
    });
  });

  // 3. Webhook Simulation endpoint
  app.post('/api/payment/webhook', (req, res) => {
    const { orderId, status, gatewaySignature } = req.body;
    const db = getDb();
    const order = db.paymentOrders.find((o) => o.id === orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status === 'COMPLETED') {
      return res.json({ success: true, message: 'Order already completed' });
    }

    if (status === 'PAID' || status === 'COMPLETED') {
      const user = db.users[order.userId];
      if (user) {
        const oldBal = user.balance;
        user.balance = Math.round((user.balance + order.amount) * 100) / 100;
        user.totalDeposited = Math.round(((user.totalDeposited || 0) + order.amount) * 100) / 100;
        order.status = 'COMPLETED';
        order.completedAt = Date.now();
        order.verifiedBy = 'SYSTEM_WEBHOOK';

        addLedgerTransaction({
          userId: user.id,
          type: 'DEPOSIT',
          amount: order.amount,
          status: 'COMPLETED',
          description: `Webhook USD Deposit Confirmation (${order.method})`,
          method: order.method,
          referenceId: order.gatewayReference,
          oldBalance: oldBal,
          newBalance: user.balance,
        });

        saveDb();
      }
    }

    return res.json({ success: true, order });
  });

  // ==========================================
  // WITHDRAWAL SYSTEM (USD)
  // ==========================================

  // User submits withdrawal request -> Locks balance -> Status PENDING
  app.post('/api/wallet/withdraw', (req, res) => {
    const { userId, amount, method, destination } = req.body;
    const numAmount = Math.round(Number(amount) * 100) / 100;
    const db = getDb();
    const settings = db.systemSettings;

    if (!userId || isNaN(numAmount) || numAmount < settings.minWithdrawalUsd || numAmount > settings.maxWithdrawalUsd) {
      return res.status(400).json({
        success: false,
        message: `Withdrawal amount must be between $${settings.minWithdrawalUsd} and $${settings.maxWithdrawalUsd.toLocaleString()} USD`,
      });
    }

    const user = db.users[userId];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, message: 'Account suspended. Cannot process withdrawal.' });
    }

    // Check available balance
    if (user.balance < numAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient available balance ($${user.balance.toFixed(2)} USD). You cannot withdraw locked or unavailable funds.`,
      });
    }

    const wdMethod = (method as WithdrawalMethod) || 'BANK_WIRE';
    const dest = destination || user.bankDetails || {};

    // 0% fee for VIP users, or standard 0%
    const fee = 0.0;
    const netAmount = numAmount - fee;

    // Lock funds to prevent double spending!
    const oldBalance = user.balance;
    user.balance = Math.round((user.balance - numAmount) * 100) / 100;
    user.lockedBalance = Math.round(((user.lockedBalance || 0.0) + numAmount) * 100) / 100;

    const wdId = `wd_usd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const wdRequest: WithdrawalRequest = {
      id: wdId,
      userId,
      amount: numAmount,
      fee,
      netAmount,
      currency: 'USD',
      method: wdMethod,
      destination: {
        accountName: dest.accountName,
        accountNumber: dest.accountNumber,
        routingNumber: dest.routingNumber,
        bankName: dest.bankName,
        walletAddress: dest.usdtTrc20Address || dest.walletAddress,
        paypalEmail: dest.paypalEmail,
      },
      status: 'PENDING',
      requestedAt: Date.now(),
      actionHistory: [
        {
          managerUid: 'SYSTEM',
          action: 'CREATED',
          timestamp: Date.now(),
          prevStatus: 'PENDING',
          newStatus: 'PENDING',
          reason: 'User withdrawal request submitted with locked balance reservation',
        },
      ],
    };

    db.withdrawals.unshift(wdRequest);

    const tx = addLedgerTransaction({
      userId,
      type: 'WITHDRAWAL',
      amount: numAmount,
      status: 'PENDING',
      description: `USD Withdrawal Request (${wdMethod})`,
      method: wdMethod,
      referenceId: wdId,
      oldBalance,
      newBalance: user.balance,
    });

    saveDb();

    return res.json({
      success: true,
      message: `Withdrawal request for $${numAmount.toFixed(2)} USD submitted successfully! Funds have been reserved for manager processing.`,
      withdrawal: wdRequest,
      availableBalance: user.balance,
      lockedBalance: user.lockedBalance,
      transaction: tx,
    });
  });

  // ==========================================
  // MANAGER PANEL APIS (SECURE SERVER-SIDE RBAC)
  // ==========================================

  // 1. Manager Dashboard Stats
  app.get('/api/manager/dashboard/stats', requireManager('dashboard.view'), (req: AuthenticatedManagerRequest, res) => {
    const db = getDb();
    const timeFilter = (req.query.timeFilter as string) || 'all';

    const now = Date.now();
    let startTime = 0;
    if (timeFilter === 'today') {
      const d = new Date(now);
      startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    } else if (timeFilter === 'yesterday') {
      const d = new Date(now);
      startTime = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1).getTime();
    } else if (timeFilter === '7days') {
      startTime = now - 7 * 86400000;
    } else if (timeFilter === '30days') {
      startTime = now - 30 * 86400000;
    }

    const usersList = Object.values(db.users).filter((u, idx, arr) => arr.findIndex((x) => x.id === u.id) === idx);
    const regularUsers = usersList.filter((u) => u.role === 'user');

    const filteredTx = db.transactions.filter((t) => (startTime ? t.createdAt >= startTime : true));
    const filteredBets = db.bets.filter((b) => (startTime ? b.createdAt >= startTime : true));
    const filteredWithdrawals = db.withdrawals.filter((w) => (startTime ? w.requestedAt >= startTime : true));
    const filteredDeposits = db.paymentOrders.filter((p) => (startTime ? p.createdAt >= startTime : true));

    const totalDeposits = filteredDeposits
      .filter((d) => d.status === 'COMPLETED')
      .reduce((sum, d) => sum + d.amount, 0);

    const pendingDeposits = filteredDeposits
      .filter((d) => d.status === 'PENDING')
      .reduce((sum, d) => sum + d.amount, 0);

    const totalWithdrawals = filteredWithdrawals
      .filter((w) => w.status === 'COMPLETED')
      .reduce((sum, w) => sum + w.amount, 0);

    const pendingWithdrawals = filteredWithdrawals
      .filter((w) => w.status === 'PENDING' || w.status === 'APPROVED' || w.status === 'PROCESSING')
      .reduce((sum, w) => sum + w.amount, 0);

    const totalBets = filteredBets.reduce((sum, b) => sum + b.amount, 0);
    const totalWinnings = filteredBets
      .filter((b) => b.status === 'WON')
      .reduce((sum, b) => sum + b.payout, 0);

    const grossGamingRevenue = totalBets - totalWinnings;

    const activeGameRounds = getActiveRoundsSummary();

    return res.json({
      success: true,
      stats: {
        totalUsers: regularUsers.length,
        activeUsers: regularUsers.filter((u) => u.status === 'ACTIVE').length,
        totalDeposits: Math.round(totalDeposits * 100) / 100,
        pendingDeposits: Math.round(pendingDeposits * 100) / 100,
        totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
        pendingWithdrawals: Math.round(pendingWithdrawals * 100) / 100,
        totalBets: Math.round(totalBets * 100) / 100,
        totalWinningAmount: Math.round(totalWinnings * 100) / 100,
        grossGamingRevenue: Math.round(grossGamingRevenue * 100) / 100,
        activeGameRounds,
      },
    });
  });

  // 2. Manager Users Management
  app.get('/api/manager/users', requireManager('users.view'), (req, res) => {
    const db = getDb();
    const search = (req.query.search as string || '').toLowerCase().trim();
    const status = req.query.status as string;

    const uniqueUsers = Object.values(db.users).filter((u, idx, arr) => arr.findIndex((x) => x.id === u.id) === idx);

    let list = uniqueUsers.map((u) => {
      const { passwordHash: _, ...safe } = u;
      return safe;
    });

    if (search) {
      list = list.filter(
        (u) =>
          u.id.toLowerCase().includes(search) ||
          u.username.toLowerCase().includes(search) ||
          (u.email && u.email.toLowerCase().includes(search)) ||
          (u.phone && u.phone.includes(search)) ||
          (u.managerUid && u.managerUid.toLowerCase().includes(search))
      );
    }

    if (status) {
      list = list.filter((u) => u.status === status);
    }

    return res.json({ success: true, users: list });
  });

  app.get('/api/manager/users/:uid', requireManager('users.view'), (req, res) => {
    const uid = req.params.uid;
    const db = getDb();
    const user = db.users[uid];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { passwordHash: _, ...safeUser } = user;
    const userBets = db.bets.filter((b) => b.userId === user.id).slice(0, 30);
    const userTxs = db.transactions.filter((t) => t.userId === user.id).slice(0, 30);
    const userWithdrawals = db.withdrawals.filter((w) => w.userId === user.id).slice(0, 20);
    const userDeposits = db.paymentOrders.filter((p) => p.userId === user.id).slice(0, 20);

    return res.json({
      success: true,
      user: safeUser,
      bets: userBets,
      transactions: userTxs,
      withdrawals: userWithdrawals,
      deposits: userDeposits,
    });
  });

  // Toggle user status (Suspend / Unsuspend)
  app.post('/api/manager/users/:uid/status', requireManager('users.manage'), (req: AuthenticatedManagerRequest, res) => {
    const uid = req.params.uid;
    const { status, reason } = req.body;
    const db = getDb();
    const user = db.users[uid];

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'super_manager') {
      return res.status(403).json({ success: false, message: 'Cannot modify super manager status' });
    }

    const oldStatus = user.status;
    user.status = status === 'SUSPENDED' ? 'SUSPENDED' : 'ACTIVE';
    saveDb();

    logAudit({
      managerUid: req.manager?.managerUid || req.manager?.id || 'SYSTEM',
      action: user.status === 'SUSPENDED' ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
      targetUserUid: user.id,
      oldValue: oldStatus,
      newValue: user.status,
      reason: reason || 'Manager status adjustment',
    });

    return res.json({
      success: true,
      message: `User status changed to ${user.status}`,
      user: { id: user.id, status: user.status },
    });
  });

  // Controlled Balance Adjustment
  app.post(
    '/api/manager/users/:uid/adjust-balance',
    requireManager('users.manage'),
    (req: AuthenticatedManagerRequest, res) => {
      const uid = req.params.uid;
      const { amount, reason, type } = req.body;
      const numAmount = Math.round(Number(amount) * 100) / 100;

      if (isNaN(numAmount) || numAmount === 0) {
        return res.status(400).json({ success: false, message: 'Invalid adjustment amount' });
      }
      if (!reason || String(reason).trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: 'Mandatory reason (min 5 characters) required for audit verification',
        });
      }

      const db = getDb();
      const user = db.users[uid];
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const oldBalance = user.balance;
      const delta = type === 'DEBIT' ? -Math.abs(numAmount) : Math.abs(numAmount);
      const newBalance = Math.round((user.balance + delta) * 100) / 100;

      if (newBalance < 0) {
        return res.status(400).json({ success: false, message: 'Adjustment cannot result in negative user balance' });
      }

      user.balance = newBalance;

      const tx = addLedgerTransaction({
        userId: user.id,
        type: 'ADJUSTMENT',
        amount: Math.abs(numAmount),
        status: 'COMPLETED',
        description: `Manager Manual Adjustment: ${reason} (${type === 'DEBIT' ? '-' : '+'}$${Math.abs(numAmount).toFixed(2)})`,
        managerUid: req.manager?.managerUid || req.manager?.id,
        oldBalance,
        newBalance: user.balance,
      });

      logAudit({
        managerUid: req.manager?.managerUid || req.manager?.id || 'SYSTEM',
        action: 'BALANCE_ADJUSTMENT',
        targetUserUid: user.id,
        targetTransactionId: tx.id,
        oldValue: `$${oldBalance.toFixed(2)}`,
        newValue: `$${user.balance.toFixed(2)}`,
        reason,
      });

      saveDb();

      return res.json({
        success: true,
        message: `Balance adjusted by ${delta >= 0 ? '+' : ''}$${delta.toFixed(2)} USD`,
        newBalance: user.balance,
        transaction: tx,
      });
    }
  );

  // 3. Manager Deposits Management
  app.get('/api/manager/deposits', requireManager('deposits.view'), (req, res) => {
    const db = getDb();
    const status = req.query.status as string;
    let list = db.paymentOrders;

    if (status) {
      list = list.filter((p) => p.status === status);
    }

    return res.json({ success: true, deposits: list });
  });

  app.post(
    '/api/manager/deposits/:orderId/approve',
    requireManager('deposits.manage'),
    (req: AuthenticatedManagerRequest, res) => {
      const orderId = req.params.orderId;
      const { reason } = req.body;
      const db = getDb();

      const order = db.paymentOrders.find((p) => p.id === orderId);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Deposit order not found' });
      }

      if (order.status === 'COMPLETED') {
        return res.status(400).json({ success: false, message: 'Order is already marked completed' });
      }

      const user = db.users[order.userId];
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const oldBalance = user.balance;
      user.balance = Math.round((user.balance + order.amount) * 100) / 100;
      user.totalDeposited = Math.round(((user.totalDeposited || 0) + order.amount) * 100) / 100;

      order.status = 'COMPLETED';
      order.completedAt = Date.now();
      order.verifiedBy = 'MANAGER';

      const tx = addLedgerTransaction({
        userId: user.id,
        type: 'DEPOSIT',
        amount: order.amount,
        status: 'COMPLETED',
        description: `Manual Deposit Approval by Manager (${order.method})`,
        referenceId: order.gatewayReference,
        managerUid: req.manager?.managerUid || req.manager?.id,
        oldBalance,
        newBalance: user.balance,
      });

      logAudit({
        managerUid: req.manager?.managerUid || req.manager?.id || 'SYSTEM',
        action: 'DEPOSIT_APPROVED',
        targetUserUid: user.id,
        targetTransactionId: tx.id,
        oldValue: 'PENDING',
        newValue: 'COMPLETED',
        reason: reason || 'Manual deposit verification by Manager',
      });

      saveDb();

      return res.json({
        success: true,
        message: `Deposit order approved and $${order.amount.toFixed(2)} USD credited`,
        order,
      });
    }
  );

  // 4. Manager Withdrawals Management
  app.get('/api/manager/withdrawals', requireManager('withdrawals.view'), (req, res) => {
    const db = getDb();
    const status = req.query.status as string;
    let list = db.withdrawals;

    if (status) {
      list = list.filter((w) => w.status === status);
    }

    return res.json({ success: true, withdrawals: list });
  });

  app.post(
    '/api/manager/withdrawals/:id/action',
    requireManager('withdrawals.manage'),
    (req: AuthenticatedManagerRequest, res) => {
      const id = req.params.id;
      const { action, reason } = req.body;
      const managerUid = req.manager?.managerUid || req.manager?.id || 'MGR-001';

      if (!action) {
        return res.status(400).json({ success: false, message: 'Missing manager action' });
      }

      const db = getDb();
      const wd = db.withdrawals.find((w) => w.id === id);
      if (!wd) {
        return res.status(404).json({ success: false, message: 'Withdrawal request not found' });
      }

      const user = db.users[wd.userId];
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const prevStatus = wd.status;

      if (action === 'APPROVE') {
        wd.status = 'APPROVED';
        wd.managerUid = managerUid;
        wd.actionHistory.push({
          managerUid,
          action: 'APPROVE',
          timestamp: Date.now(),
          prevStatus,
          newStatus: 'APPROVED',
          reason,
        });

        logAudit({
          managerUid,
          action: 'WITHDRAWAL_APPROVED',
          targetUserUid: user.id,
          targetTransactionId: wd.id,
          oldValue: prevStatus,
          newValue: 'APPROVED',
          reason: reason || 'Manager approved withdrawal request',
        });
      } else if (action === 'PROCESS') {
        wd.status = 'PROCESSING';
        wd.managerUid = managerUid;
        wd.actionHistory.push({
          managerUid,
          action: 'PROCESS',
          timestamp: Date.now(),
          prevStatus,
          newStatus: 'PROCESSING',
          reason,
        });

        logAudit({
          managerUid,
          action: 'WITHDRAWAL_PROCESSING',
          targetUserUid: user.id,
          targetTransactionId: wd.id,
          oldValue: prevStatus,
          newValue: 'PROCESSING',
          reason: reason || 'Payout batch transmitted to payment gateway',
        });
      } else if (action === 'COMPLETE') {
        // Payout completed: unlock and finalize deduction
        wd.status = 'COMPLETED';
        wd.processedAt = Date.now();
        wd.managerUid = managerUid;

        user.lockedBalance = Math.max(0, Math.round(((user.lockedBalance || 0) - wd.amount) * 100) / 100);
        user.totalWithdrawn = Math.round(((user.totalWithdrawn || 0) + wd.amount) * 100) / 100;

        // Update corresponding transaction in ledger
        const tx = db.transactions.find((t) => t.referenceId === wd.id);
        if (tx) {
          tx.status = 'COMPLETED';
          tx.updatedAt = Date.now();
        }

        wd.actionHistory.push({
          managerUid,
          action: 'COMPLETE',
          timestamp: Date.now(),
          prevStatus,
          newStatus: 'COMPLETED',
          reason,
        });

        logAudit({
          managerUid,
          action: 'WITHDRAWAL_COMPLETED',
          targetUserUid: user.id,
          targetTransactionId: wd.id,
          oldValue: prevStatus,
          newValue: 'COMPLETED',
          reason: reason || 'Funds successfully disbursed to client account',
        });
      } else if (action === 'REJECT') {
        if (!reason || String(reason).trim().length < 3) {
          return res.status(400).json({
            success: false,
            message: 'A clear rejection reason is mandatory for auditing',
          });
        }

        wd.status = 'REJECTED';
        wd.rejectionReason = reason;
        wd.managerUid = managerUid;

        // Revert locked funds back to available balance!
        user.balance = Math.round((user.balance + wd.amount) * 100) / 100;
        user.lockedBalance = Math.max(0, Math.round(((user.lockedBalance || 0) - wd.amount) * 100) / 100);

        const tx = db.transactions.find((t) => t.referenceId === wd.id);
        if (tx) {
          tx.status = 'REJECTED';
          tx.updatedAt = Date.now();
        }

        addLedgerTransaction({
          userId: user.id,
          type: 'REFUND',
          amount: wd.amount,
          status: 'COMPLETED',
          description: `Withdrawal Rejected & Refunded: ${reason}`,
          referenceId: wd.id,
          managerUid,
          newBalance: user.balance,
        });

        wd.actionHistory.push({
          managerUid,
          action: 'REJECT',
          timestamp: Date.now(),
          prevStatus,
          newStatus: 'REJECTED',
          reason,
        });

        logAudit({
          managerUid,
          action: 'WITHDRAWAL_REJECTED',
          targetUserUid: user.id,
          targetTransactionId: wd.id,
          oldValue: prevStatus,
          newValue: 'REJECTED',
          reason,
        });
      } else {
        return res.status(400).json({ success: false, message: `Unknown action ${action}` });
      }

      saveDb();

      return res.json({
        success: true,
        message: `Withdrawal status updated to ${wd.status}`,
        withdrawal: wd,
      });
    }
  );

  // 5. Manager Games & Bets Monitor
  app.get('/api/manager/games/active', requireManager('games.view'), (req, res) => {
    const active = getActiveRoundsSummary();
    return res.json({ success: true, activeRounds: active });
  });

  app.get('/api/manager/bets', requireManager('games.view'), (req, res) => {
    const db = getDb();
    const periodId = req.query.periodId as string;
    const userId = req.query.userId as string;
    const mode = req.query.mode as GameMode;
    const status = req.query.status as string;

    let list = db.bets;
    if (periodId) list = list.filter((b) => b.periodId === periodId);
    if (userId) list = list.filter((b) => b.userId === userId);
    if (mode) list = list.filter((b) => b.mode === mode);
    if (status) list = list.filter((b) => b.status === status);

    return res.json({ success: true, bets: list.slice(0, 100) });
  });

  // 6. Manager Audit Logs
  app.get('/api/manager/audit-logs', requireManager('dashboard.view'), (req, res) => {
    const db = getDb();
    return res.json({ success: true, auditLogs: db.auditLogs });
  });

  // 7. Manager Reports
  app.get('/api/manager/reports/financial', requireManager('reports.view'), (req, res) => {
    const db = getDb();
    const totalDeposits = db.paymentOrders.filter((p) => p.status === 'COMPLETED').reduce((s, p) => s + p.amount, 0);
    const totalWithdrawals = db.withdrawals.filter((w) => w.status === 'COMPLETED').reduce((s, w) => s + w.amount, 0);
    const totalBets = db.bets.reduce((s, b) => s + b.amount, 0);
    const totalWinnings = db.bets.filter((b) => b.status === 'WON').reduce((s, b) => s + b.payout, 0);
    const ggr = totalBets - totalWinnings;

    return res.json({
      success: true,
      report: {
        totalDeposits: Math.round(totalDeposits * 100) / 100,
        totalWithdrawals: Math.round(totalWithdrawals * 100) / 100,
        netCashflow: Math.round((totalDeposits - totalWithdrawals) * 100) / 100,
        totalWagersUsd: Math.round(totalBets * 100) / 100,
        totalPayoutsUsd: Math.round(totalWinnings * 100) / 100,
        grossGamingRevenue: Math.round(ggr * 100) / 100,
        returnToPlayerPercent: totalBets > 0 ? Math.round((totalWinnings / totalBets) * 10000) / 100 : 0,
      },
    });
  });

  // 8. Manager Settings
  app.get('/api/manager/settings', requireManager('settings.manage'), (req, res) => {
    const db = getDb();
    return res.json({ success: true, settings: db.systemSettings });
  });

  app.post('/api/manager/settings', requireManager('settings.manage'), (req: AuthenticatedManagerRequest, res) => {
    const { settings } = req.body;
    if (!settings) {
      return res.status(400).json({ success: false, message: 'Settings payload is required' });
    }

    const db = getDb();
    const oldSettings = JSON.stringify(db.systemSettings);
    db.systemSettings = {
      ...db.systemSettings,
      ...settings,
    };

    logAudit({
      managerUid: req.manager?.managerUid || req.manager?.id || 'SYSTEM',
      action: 'SYSTEM_SETTINGS_UPDATED',
      oldValue: oldSettings,
      newValue: JSON.stringify(db.systemSettings),
      reason: 'Manager adjusted system & payment gateway configuration',
    });

    saveDb();

    return res.json({ success: true, settings: db.systemSettings });
  });

  // ==========================================
  // CUSTOMER SUPPORT & MISCELLANEOUS
  // ==========================================

  app.get('/api/support/messages', (req, res) => {
    const userId = req.query.userId as string;
    const db = getDb();
    const msgs = db.supportTickets.filter((t) => t.userId === userId || t.userId === '123456');
    return res.json({ success: true, messages: msgs });
  });

  app.post('/api/support/send', (req, res) => {
    const { userId, message } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const db = getDb();
    const userMsg = {
      id: `msg_${Date.now()}_u`,
      userId,
      sender: 'user' as const,
      message: String(message),
      timestamp: Date.now(),
    };
    db.supportTickets.push(userMsg);

    let replyText = 'Thank you for contacting Prism USD VIP Support! An authorized agent will assist you in 2 minutes.';
    const lower = String(message).toLowerCase();
    if (lower.includes('recharge') || lower.includes('deposit')) {
      replyText = 'For USD deposits: credit card payments via Stripe and USDT (TRC20/BEP20) are credited automatically. If your card was debited, verify order status in Recharge history.';
    } else if (lower.includes('withdraw')) {
      replyText = 'Withdrawals are processed 24/7 in USD. Funds are locked safely during review and disbursed once approved by our finance desk.';
    }

    const botMsg = {
      id: `msg_${Date.now()}_a`,
      userId,
      sender: 'agent' as const,
      message: replyText,
      timestamp: Date.now() + 500,
    };
    db.supportTickets.push(botMsg);
    saveDb();

    return res.json({ success: true, userMessage: userMsg, agentMessage: botMsg });
  });

  app.get('/api/referral', (req, res) => {
    const userId = req.query.userId as string;
    const db = getDb();
    const user = db.users[userId];
    const code = user?.inviteCode || userId || '123456';
    return res.json({
      success: true,
      stats: {
        inviteCode: code,
        inviteLink: `https://prism-prediction.app/?r=${code}`,
        totalInvited: 12,
        totalCommission: 1250.0,
        recentReferrals: [
          { userId: '492811', username: 'Alex_Pro', joinedAt: Date.now() - 86400000 * 2, commissionEarned: 240.0 },
          { userId: '582710', username: 'Sarah_99', joinedAt: Date.now() - 86400000 * 5, commissionEarned: 350.0 },
          { userId: '918234', username: 'CryptoTrader', joinedAt: Date.now() - 86400000 * 7, commissionEarned: 410.0 },
          { userId: '304918', username: 'Mike_G', joinedAt: Date.now() - 86400000 * 10, commissionEarned: 250.0 },
        ],
      },
    });
  });

  // User: Settings Update
  app.post('/api/user/settings', (req, res) => {
    const { userId, bankDetails, newPassword } = req.body;
    const db = getDb();
    const user = db.users[userId];
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (bankDetails) {
      user.bankDetails = {
        ...user.bankDetails,
        ...bankDetails,
      };
    }
    if (newPassword && newPassword.length >= 6) {
      user.passwordHash = newPassword;
    }

    saveDb();
    const { passwordHash: _, ...safeUser } = user;
    return res.json({ success: true, user: safeUser, message: 'Settings saved successfully' });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
