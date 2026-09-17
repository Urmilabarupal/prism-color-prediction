import React, { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  Gift,
  Share2,
  Users,
  Coins,
  ChevronRight,
  MessageCircle,
  Send,
  Facebook,
  MoreHorizontal,
} from 'lucide-react';
import { PageId, ReferralStats } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { TopHeader } from '../components/TopHeader.js';

interface InvitePageProps {
  onNavigate: (page: PageId) => void;
}

export const InvitePage: React.FC<InvitePageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (user) {
      api.getReferral(user.id).then(setStats).catch(console.error);
    }
  }, [user?.id]);

  const inviteCode = stats?.inviteCode || user?.inviteCode || '123456';
  const inviteLink = stats?.inviteLink || `https://prism-prediction.app/?r=${inviteCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join Prism Color Prediction',
        text: `Play Smart, Win Big! Sign up with my referral code ${inviteCode} to claim your $25.00 USD Welcome Bonus:`,
        url: inviteLink,
      }).catch(() => {});
    } else {
      copyLink();
      alert('Referral link copied to clipboard!');
    }
  };

  return (
    <div id="invite-page" className="min-h-screen w-full bg-[#F6F7FB] pb-24 flex flex-col">
      <TopHeader
        variant="red"
        showBack={true}
        onBack={() => onNavigate('home')}
        title="Invite Friends"
      />

      <div className="flex-1 px-4 py-3 space-y-3.5">
        {/* Banner: Invite & Earn matching Screen 10 */}
        <div className="rounded-2xl p-5 bg-gradient-to-r from-[#0D1B3E] via-[#162A5E] to-[#254287] text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-black text-white">Invite & Earn</h2>
            <div className="text-sm font-extrabold text-amber-400 mt-0.5">
              Get 30% Lifetime Commission
            </div>
            <p className="text-[11px] text-slate-300 mt-1 max-w-[200px]">
              Earn unlimited rewards every time your referred friends place a bet!
            </p>
          </div>

          {/* Gift Box Graphics */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30 rotate-12">
              <Gift className="w-9 h-9 text-amber-950" />
            </div>
          </div>
        </div>

        {/* My Invitation Code Box matching reference */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              My Invitation Code
            </span>
            <span className="font-points text-xl font-black text-slate-900 mt-0.5 block">
              {inviteCode}
            </span>
          </div>
          <button
            onClick={copyCode}
            className="px-4 py-2 bg-[#FA3534] hover:bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedCode ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Share Your Link Box matching reference */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="min-w-0 flex-1 mr-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Share Your Link
            </span>
            <span className="font-mono text-xs text-slate-600 truncate mt-0.5 block">
              {inviteLink}
            </span>
          </div>
          <button
            onClick={copyLink}
            className="px-4 py-2 bg-[#FA3534] hover:bg-red-600 text-white font-extrabold text-xs rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5 flex-shrink-0"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedLink ? 'Copied' : 'Copy'}
          </button>
        </div>

        {/* Social Share Icons matching Screen 10 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
          <span className="text-xs font-black text-slate-800 block mb-3 text-center">
            Instant Share via Social Media
          </span>
          <div className="grid grid-cols-4 gap-3 text-center">
            {/* WhatsApp */}
            <button
              onClick={() => {
                const text = encodeURIComponent(`Play & win with me on Prism! Bonus code: ${inviteCode}\n${inviteLink}`);
                window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
              }}
              className="flex flex-col items-center group active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-green-500/20 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6 fill-white" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 mt-1.5">WhatsApp</span>
            </button>

            {/* Telegram */}
            <button
              onClick={() => {
                const text = encodeURIComponent(`Play & win with me on Prism! Bonus code: ${inviteCode}`);
                window.open(`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${text}`, '_blank');
              }}
              className="flex flex-col items-center group active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Send className="w-5 h-5 ml-0.5 fill-white" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 mt-1.5">Telegram</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`, '_blank');
              }}
              className="flex flex-col items-center group active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Facebook className="w-5 h-5 fill-white" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 mt-1.5">Facebook</span>
            </button>

            {/* More */}
            <button
              onClick={handleShare}
              className="flex flex-col items-center group active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-slate-700 text-white flex items-center justify-center shadow-md shadow-slate-700/20 group-hover:scale-105 transition-transform">
                <MoreHorizontal className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 mt-1.5">More</span>
            </button>
          </div>
        </div>

        {/* Stats Cards: Total Invited & Total Commission matching Screen 10 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Invited
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {stats?.totalInvited || 12}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">Active Players</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Commission
            </span>
            <div className="text-2xl font-black text-[#FA3534] mt-1 font-mono">
              ${(stats?.totalCommission || 250).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
            </div>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">Credited to Balance</span>
          </div>
        </div>

        {/* Big Red Button: Invite Now matching Screen 10 */}
        <button
          id="invite-now-btn"
          type="button"
          onClick={handleShare}
          className="w-full py-4 bg-gradient-to-r from-[#FF5252] to-[#FA3534] text-white font-black text-sm rounded-2xl shadow-lg shadow-red-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer hover:brightness-105"
        >
          <Share2 className="w-4 h-4" />
          Invite Now
        </button>
      </div>
    </div>
  );
};
