import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Database authentication is not configured. Please contact the administrator.'
      );
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith('@nie.ac.in')) {
      setError(
        'Please enter your registered @nie.ac.in email address.'
      );
      return;
    }

    setLoading(true);

    try {
      const redirectUrl =
        `${window.location.origin}/reset-password`;

      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo: redirectUrl,
          }
        );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (resetError: unknown) {
      console.error(
        'NIErnaya password reset error:',
        resetError
      );

      let message =
        'Unable to send the password reset email. Please try again.';

      if (resetError instanceof Error) {
        message = resetError.message;
      } else if (
        typeof resetError === 'object' &&
        resetError !== null &&
        'message' in resetError
      ) {
        message = String(
          (resetError as { message?: unknown }).message ??
            message
        );
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-4 relative overflow-hidden">

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#36D9FF]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="absolute inset-0 bg-grid-cyber opacity-20 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">

          <div className="p-8 rounded-3xl bg-[#0D1219] border-2 border-[#36D9FF] shadow-2xl shadow-[#36D9FF]/10 text-center space-y-6">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#36D9FF]/10 border border-[#36D9FF] flex items-center justify-center text-[#36D9FF]">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">

              <h1 className="font-display font-black text-2xl text-white">
                CHECK YOUR EMAIL
              </h1>

              <p className="text-xs text-[#8B96A5] font-mono leading-relaxed">
                If an account is associated with this NIE
                email, a password reset link has been sent.
              </p>

            </div>

            <div className="p-4 rounded-xl bg-[#07090D] border border-white/10">

              <p className="text-[11px] text-[#8B96A5] font-mono leading-relaxed break-all">
                {email.trim().toLowerCase()}
              </p>

            </div>

            <Link
              to="/login"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-lg hover:shadow-[#FF7A30]/30 transition-all"
            >
              RETURN TO LOGIN
            </Link>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-4 relative overflow-hidden">

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#36D9FF]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute inset-0 bg-grid-cyber opacity-20 pointer-events-none" />

      <Link
        to="/login"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-mono text-[#8B96A5] hover:text-white transition-colors bg-[#0D1219] px-3.5 py-2 rounded-full border border-white/10"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        BACK TO LOGIN
      </Link>

      <div className="w-full max-w-md relative z-10">

        <div className="p-8 rounded-3xl bg-[#0D1219] border-2 border-[#FF7A30] shadow-2xl shadow-[#FF7A30]/10 space-y-6">

          <div className="text-center space-y-2">

            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#121A23] border border-[#FF7A30] flex items-center justify-center text-[#FF7A30]">
              <KeyRound className="w-6 h-6" />
            </div>

            <h1 className="font-display font-black text-2xl text-white">
              FORGOT PASSWORD
            </h1>

            <p className="text-xs text-[#8B96A5] font-mono">
              RECOVER YOUR NIErnaya ACCOUNT
            </p>

          </div>

          <div className="p-4 rounded-xl bg-[#07090D] border border-white/5">

            <p className="text-[11px] text-[#8B96A5] font-mono leading-relaxed text-center">
              Enter the NIE email associated with your
              NIErnaya account. A secure password reset
              link will be sent to that address.
            </p>

          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">

              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <span>{error}</span>

            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            <div className="space-y-1.5">

              <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                REGISTERED NIE EMAIL
              </label>

              <div className="relative">

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@nie.ac.in"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/50 text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
                />

                <Mail className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-lg hover:shadow-[#FF7A30]/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >

              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  SENDING LINK...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  SEND RESET LINK
                </>
              )}

            </button>

          </form>

          <div className="text-center">

            <Link
              to="/login"
              className="text-xs font-mono text-[#8B96A5] hover:text-white transition-colors"
            >
              Remember your password?{' '}

              <span className="text-[#FF7A30] font-bold">
                Sign In
              </span>

            </Link>

          </div>

        </div>
      </div>
    </div>
  );
};