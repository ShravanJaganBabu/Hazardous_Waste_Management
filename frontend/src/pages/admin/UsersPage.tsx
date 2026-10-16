import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { IUser } from '../../types';
import { Users, Shield, Building2, Mail, Phone, Lock, Unlock, LogOut, CheckCircle2, AlertTriangle, KeyRound, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export const UsersPage: React.FC = () => {
  const { switchUserQuick, user: currentUser } = useAuth();
  const [users, setUsers] = useState<IUser[]>([]);
  const [securityStats, setSecurityStats] = useState({
    failedAttempts: 12,
    lockedAccounts: 0,
    activeSessions: 6,
    recentLogins: 31,
  });
  const [loading, setLoading] = useState(true);

  const fetchUsersAndStats = async () => {
    try {
      const list = await authService.getAllUsers();
      if (list && list.length > 0) {
        setUsers(list);
      }

      const statsRes = await api.get('/auth/security-stats');
      if (statsRes.data?.stats) {
        setSecurityStats(statsRes.data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndStats();
  }, []);

  const handleUnlock = async (userId: string) => {
    try {
      await api.post(`/auth/unlock/${userId}`);
      alert(`User ${userId} unlocked successfully.`);
      fetchUsersAndStats();
    } catch (err) {
      alert('Failed to unlock user.');
    }
  };

  const handleLogoutAll = async (userId: string) => {
    try {
      await api.post(`/auth/logout-all/${userId}`);
      alert(`Terminated all active sessions for ${userId}.`);
      fetchUsersAndStats();
    } catch (err) {
      alert('Failed to terminate sessions.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-line">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan uppercase tracking-widest">
            <Users className="w-4 h-4" />
            <span>ROLE-BASED ACCESS CONTROL & LOGIN SECURITY</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-white mt-1">
            Stakeholder Identity & Security Management
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsersAndStats}
            className="p-2.5 px-4 rounded-xl bg-panel border border-line hover:border-em text-xs font-mono text-em flex items-center gap-2 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Pillar 1: Admin Login Security Stats Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-line bg-panel/40 space-y-4">
        <div className="flex items-center justify-between border-b border-line/60 pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-em" />
            <h3 className="font-display font-bold text-base text-white">LOGIN SECURITY INTELLIGENCE</h3>
          </div>
          <span className="text-[10px] font-mono text-mist">LOCKOUT THRESHOLD: 5 ATTEMPTS</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-xl bg-void/80 border border-line">
            <span className="text-[10px] text-mist block">FAILED ATTEMPTS</span>
            <span className="text-2xl font-bold text-alert mt-1 block">
              {securityStats.failedAttempts.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] text-mist block mt-0.5">Across all accounts</span>
          </div>

          <div className="p-4 rounded-xl bg-void/80 border border-line">
            <span className="text-[10px] text-mist block">LOCKED ACCOUNTS</span>
            <span className={`text-2xl font-bold mt-1 block ${securityStats.lockedAccounts > 0 ? 'text-alert' : 'text-em'}`}>
              {securityStats.lockedAccounts.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] text-mist block mt-0.5">30-min auto lock</span>
          </div>

          <div className="p-4 rounded-xl bg-void/80 border border-line">
            <span className="text-[10px] text-mist block">ACTIVE SESSIONS</span>
            <span className="text-2xl font-bold text-cyan mt-1 block">
              {securityStats.activeSessions.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] text-mist block mt-0.5">JWT validated</span>
          </div>

          <div className="p-4 rounded-xl bg-void/80 border border-line">
            <span className="text-[10px] text-mist block">RECENT LOGINS (7D)</span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {securityStats.recentLogins.toString().padStart(2, '0')}
            </span>
            <span className="text-[9px] text-mist block mt-0.5">Audited in ledger</span>
          </div>
        </div>
      </div>

      {/* Stakeholder Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const isMe = currentUser?.userId === u.userId;
          const isLocked = u.status === 'LOCKED';
          return (
            <div
              key={u.userId}
              className={`glass-panel p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                isLocked
                  ? 'border-alert/60 bg-alert/5 shadow-[0_0_20px_rgba(255,106,61,0.15)]'
                  : isMe
                  ? 'border-em bg-em/5 shadow-[0_0_20px_rgba(57,255,176,0.1)]'
                  : 'border-line'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-panel border border-em/30 flex items-center justify-center font-display font-bold text-lg text-em shadow-[0_0_15px_rgba(57,255,176,0.15)]">
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-mono font-bold text-white px-2.5 py-0.5 rounded-lg bg-black/50 border border-line">
                      {u.userId}
                    </span>
                    <span className="text-[10px] font-mono text-cyan mt-1 uppercase font-semibold">
                      {u.role.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <h3 className="font-display font-bold text-lg text-white">{u.name}</h3>
                <p className="text-xs text-mist font-medium mt-1 truncate">{u.organizationName}</p>

                <div className="mt-4 pt-3 border-t border-line/60 space-y-2 text-xs font-mono text-mist">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-em shrink-0" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-cyan shrink-0" />
                    <span>{u.phone || '+91 94440 00000'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-line/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 text-[10px] font-mono font-semibold ${
                      isLocked ? 'text-alert' : 'text-em'
                    }`}
                  >
                    {isLocked ? <AlertTriangle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    STATUS: {u.status}
                  </span>

                  {isLocked && (
                    <button
                      onClick={() => handleUnlock(u.userId)}
                      className="py-1 px-2.5 rounded-lg bg-alert text-white font-mono text-[10px] font-bold flex items-center gap-1 hover:brightness-110 shadow-lg"
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Unlock</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    onClick={() => handleLogoutAll(u.userId)}
                    className="py-1 px-2 rounded-lg bg-panel hover:bg-void text-mist hover:text-white border border-line font-mono text-[10px] flex items-center gap-1 transition-colors"
                    title="Terminate all active sessions for this identity"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Logout All</span>
                  </button>

                  {!isMe && (
                    <button
                      onClick={() => switchUserQuick(u.username)}
                      className="py-1.5 px-3 rounded-lg bg-em/15 hover:bg-em/25 text-em border border-em/40 font-mono text-[11px] font-bold transition-colors"
                    >
                      Switch Role →
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
