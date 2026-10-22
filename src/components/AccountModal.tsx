import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  X,
  LogOut,
  Mail,
  ShieldCheck,
  RefreshCw,
  Send,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Language, getTranslation } from '../utils/i18n';
import { UserProfile } from '../types/calculator';
import { googleSignIn, logout } from '../utils/googleAuth';
import { fetchRecentGmailMessages, GmailMessageSummary } from '../utils/gmailService';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUserChange: (user: UserProfile | null) => void;
  isDark: boolean;
  lang: Language;
  onOpenGmailCompose?: (type: 'calculation' | 'graph') => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserChange,
  isDark,
  lang,
  onOpenGmailCompose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      loadMessages();
    }
  }, [isOpen, user]);

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const list = await fetchRecentGmailMessages();
      setMessages(list);
    } catch {
      // Ignored
    } finally {
      setLoadingMessages(false);
    }
  };

  if (!isOpen) return null;

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onUserChange({
          uid: res.user.uid,
          displayName: res.user.displayName,
          email: res.user.email,
          photoURL: res.user.photoURL,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Ошибка входа через Google');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      onUserChange(null);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-500 flex items-center justify-center">
              <UserIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                {getTranslation('account', lang)}
              </h2>
              <p className="text-[11px] opacity-60">Google Workspace & Gmail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {user ? (
            /* Logged in state */
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center gap-3.5 ${
                isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-12 h-12 rounded-full border border-blue-500/30 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm truncate">
                    {user.displayName || 'Пользователь Google'}
                  </div>
                  <div className="text-[11px] opacity-65 truncate font-mono">
                    {user.email}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-emerald-500 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{getTranslation('connectedToGmail', lang)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="font-medium opacity-80 text-[11px]">
                  {getTranslation('workspaceActions', lang)}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenGmailCompose) onOpenGmailCompose('calculation');
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      isDark
                        ? 'bg-slate-800/40 hover:bg-slate-800 border-slate-700 hover:border-blue-500/50'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <Send className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-[11px]">{getTranslation('sendCalcViaEmail', lang)}</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      if (onOpenGmailCompose) onOpenGmailCompose('graph');
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                      isDark
                        ? 'bg-slate-800/40 hover:bg-slate-800 border-slate-700 hover:border-emerald-500/50'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-emerald-400'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-[11px]">{getTranslation('sendGraphViaEmail', lang)}</span>
                  </button>
                </div>
              </div>

              {/* Recent Gmail Activity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium opacity-80 text-[11px]">
                    {getTranslation('recentGmailMessages', lang)}
                  </span>
                  <button
                    onClick={loadMessages}
                    className="p-1 opacity-60 hover:opacity-100 hover:rotate-180 transition-all"
                    title="Обновить"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingMessages ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {loadingMessages ? (
                  <div className="py-4 text-center text-[11px] opacity-60">
                    {getTranslation('loading', lang)}...
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`p-2 rounded-lg border text-[11px] ${
                          isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="line-clamp-2 opacity-80">{m.snippet || 'Сообщение'}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`p-3 rounded-lg border text-center text-[11px] opacity-60 ${
                    isDark ? 'bg-slate-800/20 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <Inbox className="w-4 h-4 mx-auto mb-1 opacity-40" />
                    {getTranslation('noMessagesFound', lang)}
                  </div>
                )}
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 font-medium transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{getTranslation('signOut', lang)}</span>
              </button>
            </div>
          ) : (
            /* Logged out state */
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto mb-1">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">
                  {getTranslation('signInToVexCalc', lang)}
                </h3>
                <p className="text-[11px] opacity-65 mt-1 max-w-xs mx-auto leading-relaxed">
                  {getTranslation('accountBenefitsDesc', lang)}
                </p>
              </div>

              {/* Official Google Sign-in Button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleSignIn}
                  disabled={loading}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-sm transition-all bg-white hover:bg-slate-50 text-slate-800 border-slate-300 font-medium text-xs cursor-pointer active:scale-98 disabled:opacity-50"
                  aria-label="Sign in with Google"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                  <span>{loading ? `${getTranslation('loading', lang)}...` : getTranslation('signInWithGoogle', lang)}</span>
                </button>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-[11px]">
                  {error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
