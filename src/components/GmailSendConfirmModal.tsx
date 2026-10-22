import React, { useState, useEffect } from 'react';
import { Mail, Send, X, AlertCircle, CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { Language, getTranslation } from '../utils/i18n';
import { sendGmailMessage, SendEmailPayload } from '../utils/gmailService';

interface GmailSendConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: string;
  defaultSubject: string;
  defaultBody: string;
  defaultHtml?: string;
  isDark: boolean;
  lang: Language;
}

export const GmailSendConfirmModal: React.FC<GmailSendConfirmModalProps> = ({
  isOpen,
  onClose,
  defaultRecipient = '',
  defaultSubject,
  defaultBody,
  defaultHtml,
  isDark,
  lang,
}) => {
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRecipient(defaultRecipient);
      setSubject(defaultSubject);
      setBody(defaultBody);
      setStatus('idle');
      setErrorMessage('');
    }
  }, [isOpen, defaultRecipient, defaultSubject, defaultBody]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!recipient.trim() || !recipient.includes('@')) {
      setStatus('error');
      setErrorMessage(getTranslation('invalidEmail', lang) || 'Укажите корректный адрес электронной почты');
      return;
    }

    setIsSending(true);
    setStatus('idle');
    setErrorMessage('');

    const payload: SendEmailPayload = {
      to: recipient.trim(),
      subject: subject.trim(),
      messageText: body,
      htmlContent: defaultHtml,
    };

    const res = await sendGmailMessage(payload);
    setIsSending(false);

    if (res.success) {
      setStatus('success');
      setTimeout(() => {
        onClose();
        setStatus('idle');
      }, 1800);
    } else {
      setStatus('error');
      setErrorMessage(res.error || 'Не удалось отправить письмо');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
          isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-inherit">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/10 text-red-600 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">
                {getTranslation('confirmSendEmail', lang)}
              </h2>
              <p className="text-[11px] opacity-60">Gmail API Google Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-slate-500/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Permission notice */}
          <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${
            isDark ? 'bg-slate-800/60 border-slate-700 text-slate-300' : 'bg-blue-50/70 border-blue-200 text-blue-950'
          }`}>
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              {getTranslation('workspaceConsentNotice', lang)}
            </div>
          </div>

          {/* Recipient */}
          <div className="space-y-1.5">
            <label className="font-medium opacity-80 block">
              {getTranslation('recipient', lang)}
            </label>
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="example@gmail.com"
              className={`w-full px-3 py-2 rounded-lg border outline-hidden transition-all text-xs font-mono ${
                isDark ? 'bg-slate-800 border-slate-700 focus:border-red-500' : 'bg-slate-50 border-slate-200 focus:border-red-500'
              }`}
            />
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="font-medium opacity-80 block">
              {getTranslation('subject', lang)}
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border outline-hidden transition-all text-xs font-medium ${
                isDark ? 'bg-slate-800 border-slate-700 focus:border-red-500' : 'bg-slate-50 border-slate-200 focus:border-red-500'
              }`}
            />
          </div>

          {/* Preview of text */}
          <div className="space-y-1.5">
            <label className="font-medium opacity-80 block">
              {getTranslation('messageBody', lang)}
            </label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className={`w-full px-3 py-2 rounded-lg border outline-hidden transition-all text-xs font-mono leading-relaxed resize-none ${
                isDark ? 'bg-slate-800 border-slate-700 focus:border-red-500' : 'bg-slate-50 border-slate-200 focus:border-red-500'
              }`}
            />
          </div>

          {/* Status feedback */}
          {status === 'error' && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-500 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="text-[11px]">{errorMessage}</span>
            </div>
          )}

          {status === 'success' && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-[11px]">{getTranslation('emailSentSuccess', lang)}</span>
            </div>
          )}
        </div>

        {/* Footer with Explicit Confirm and Cancel buttons */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-inherit bg-inherit">
          <button
            type="button"
            onClick={onClose}
            disabled={isSending}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {getTranslation('cancel', lang)}
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending || status === 'success'}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-all shadow-sm shadow-red-600/30 disabled:opacity-50 cursor-pointer"
          >
            {isSending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{getTranslation('sending', lang)}</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span>{getTranslation('confirmAndSend', lang)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
