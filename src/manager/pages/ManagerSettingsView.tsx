import React, { useEffect, useState } from 'react';
import {
  Sliders,
  DollarSign,
  CreditCard,
  Percent,
  Save,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { SystemSettings } from '../../types.js';
import { api } from '../../services/api.js';
import { useManager } from '../ManagerContext.js';

export const ManagerSettingsView: React.FC = () => {
  const { hasPermission, showToast } = useManager();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getManagerSettings().then((res) => {
      setSettings(res);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load settings:', err);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    if (!hasPermission('settings.manage')) {
      showToast('Permission denied: Missing settings.manage privilege');
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateManagerSettings(settings);
      setSettings(res.settings);
      showToast('System configuration successfully updated and recorded in audit log');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="p-8 text-center text-slate-500 text-xs">
        Loading system configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <h1 className="text-xl font-black text-white tracking-tight flex items-center">
          <Sliders className="w-5 h-5 mr-2.5 text-amber-400" />
          SYSTEM CONFIGURATION & PAYMENT GATEWAY PARAMETERS
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Define global USD limits, gateway addresses, and game engine commission parameters
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Deposit & Withdrawal Limits */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
            <DollarSign className="w-4 h-4 mr-2 text-emerald-400" />
            USD Cashflow Limits
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Minimum Deposit Limit (USD)
              </label>
              <input
                type="number"
                value={settings.minDepositUsd}
                onChange={(e) =>
                  setSettings({ ...settings, minDepositUsd: Number(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Maximum Deposit Limit (USD)
              </label>
              <input
                type="number"
                value={settings.maxDepositUsd}
                onChange={(e) =>
                  setSettings({ ...settings, maxDepositUsd: Number(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Minimum Withdrawal Limit (USD)
              </label>
              <input
                type="number"
                value={settings.minWithdrawalUsd}
                onChange={(e) =>
                  setSettings({ ...settings, minWithdrawalUsd: Number(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                Maximum Withdrawal Limit (USD)
              </label>
              <input
                type="number"
                value={settings.maxWithdrawalUsd}
                onChange={(e) =>
                  setSettings({ ...settings, maxWithdrawalUsd: Number(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Game Engine Parameters */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
            <Percent className="w-4 h-4 mr-2 text-amber-400" />
            Game Engine Commission & House Edge
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                House Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.houseCommissionPercent}
                onChange={(e) =>
                  setSettings({ ...settings, houseCommissionPercent: Number(e.target.value) })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default 2.0% standard contract fee deducted on bet placement.
              </span>
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center">
            <CreditCard className="w-4 h-4 mr-2 text-blue-400" />
            Payment Gateways & Deposit Addresses
          </h2>

          <div className="space-y-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">
                USDT (TRC20) Company Deposit Address
              </label>
              <input
                type="text"
                value={settings.paymentGateways.usdtTrc20Address}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    paymentGateways: {
                      ...settings.paymentGateways,
                      usdtTrc20Address: e.target.value,
                    },
                  })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <label className="flex items-center space-x-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paymentGateways.stripeEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentGateways: {
                        ...settings.paymentGateways,
                        stripeEnabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-slate-200 font-medium">Stripe USD</span>
              </label>

              <label className="flex items-center space-x-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paymentGateways.cryptoEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentGateways: {
                        ...settings.paymentGateways,
                        cryptoEnabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-slate-200 font-medium">USDT Crypto</span>
              </label>

              <label className="flex items-center space-x-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paymentGateways.bankWireEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentGateways: {
                        ...settings.paymentGateways,
                        bankWireEnabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-slate-200 font-medium">Bank Wire</span>
              </label>

              <label className="flex items-center space-x-2 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.paymentGateways.paypalEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      paymentGateways: {
                        ...settings.paymentGateways,
                        paypalEnabled: e.target.checked,
                      },
                    })
                  }
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span className="text-slate-200 font-medium">PayPal</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit */}
        {hasPermission('settings.manage') && (
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving System Configuration...' : 'Save & Publish Configuration'}</span>
          </button>
        )}
      </form>
    </div>
  );
};
