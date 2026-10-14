import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LockKeyhole,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

export const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Database authentication is not configured. Please contact the administrator.'
      );
      setCheckingSession(false);
      return;
    }

    let mounted = true;

    /*
     * Supabase processes the recovery URL automatically.
     *
     * We listen for PASSWORD_RECOVERY because the recovery
     * session can become available asynchronously.
     */

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) {
          return;
        }

        if (event === 'PASSWORD_RECOVERY') {
          setValidSession(Boolean(session));
          setCheckingSession(false);
          return;
        }

        if (session) {
          setValidSession(true);
          setCheckingSession(false);
        }
      }
    );

    const checkExistingSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!mounted) {
          return;
        }

        /*
         * A session may already exist when the recovery URL has
         * been processed before this component mounted.
         */
        if (session) {
          setValidSession(true);
        }

        setCheckingSession(false);
      } catch (sessionError) {
        console.error(
          'NIErnaya recovery session error:',
          sessionError
        );

        if (!mounted) {
          return;
        }

        setError(
          'The password reset session could not be verified. Please request a new reset link.'
        );

        setCheckingSession(false);
      }
    };

    void checkExistingSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Database authentication is not configured. Please contact the administrator.'
      );
      return;
    }

    if (!validSession) {
      setError(
        'Your password reset session is invalid or expired. Please request a new reset link.'
      );
      return;
    }

    if (password.length < 8) {
      setError(
        'Password must contain at least 8 characters.'
      );
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();

      setSuccess(true);
    } catch (updateError: unknown) {
      console.error(
        'NIErnaya password update error:',
        updateError
      );

      let message =
        'Unable to update your password. Please request a new reset link.';

      if (updateError instanceof Error) {
        message = updateError.message;
      } else if (
        typeof updateError === 'object' &&
        updateError !== null &&
        'message' in updateError
      ) {
        message = String(
          (updateError as { message?: unknown }).message ??
            message
        );
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-4">

        <div className="text-center space-y-4">

          <Loader2 className="w-8 h-8 text-[#FF7A30] animate-spin mx-auto" />

          <p className="text-xs font-mono text-[#8B96A5]">
            VERIFYING SECURE RESET SESSION...
          </p>

        </div>

      </div>
    );
  }

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
                PASSWORD UPDATED
              </h1>

              <p className="text-xs text-[#8B96A5] font-mono leading-relaxed">
                Your NIErnaya password has been successfully
                updated.
              </p>

            </div>

            <Link
              to="/login"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-lg hover:shadow-[#FF7A30]/30 transition-all"
            >
              PROCEED TO LOGIN
            </Link>

          </div>
        </div>
      </div>
    );
  }

  if (!validSession) {
    return (
      <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-4 relative overflow-hidden">

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#36D9FF]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="absolute inset-0 bg-grid-cyber opacity-20 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">

          <div className="p-8 rounded-3xl bg-[#0D1219] border-2 border-red-500/50 shadow-2xl shadow-red-500/10 text-center space-y-6">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center text-red-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">

              <h1 className="font-display font-black text-2xl text-white">
                RESET LINK INVALID
              </h1>

              <p className="text-xs text-[#8B96A5] font-mono leading-relaxed">
                {error ??
                  'Your password reset link is expired or invalid.'}
              </p>

            </div>

            <Link
              to="/forgot-password"
              className="block w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-lg hover:shadow-[#FF7A30]/30 transition-all"
            >
              REQUEST NEW LINK
            </Link>

            <Link
              to="/login"
              className="block text-xs text-[#8B96A5] font-mono hover:text-white transition-colors"
            >
              ← Back to Login
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

      <div className="w-full max-w-md relative z-10">

        <div className="p-8 rounded-3xl bg-[#0D1219] border-2 border-[#FF7A30] shadow-2xl shadow-[#FF7A30]/10 space-y-6">

          <div className="text-center space-y-2">

            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#121A23] border border-[#FF7A30] flex items-center justify-center text-[#FF7A30]">
              <LockKeyhole className="w-6 h-6" />
            </div>

            <h1 className="font-display font-black text-2xl text-white">
              CREATE NEW PASSWORD
            </h1>

            <p className="text-xs text-[#8B96A5] font-mono">
              SECURE YOUR NIErnaya ACCOUNT
            </p>

          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">

              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <span>{error}</span>

            </div>
          )}

          <form
            onSubmit={handleUpdatePassword}
            className="space-y-4"
          >

            <div className="space-y-1.5">

              <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                NEW PASSWORD
              </label>

              <div className="relative">

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/50 text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
                />

                <LockKeyhole className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

              </div>

            </div>

            <div className="space-y-1.5">

              <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                CONFIRM NEW PASSWORD
              </label>

              <div className="relative">

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/50 text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
                />

                <LockKeyhole className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

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
                  UPDATING PASSWORD...
                </>
              ) : (
                <>
                  <LockKeyhole className="w-4 h-4" />
                  UPDATE PASSWORD
                </>
              )}

            </button>

          </form>

          <div className="text-center">

            <Link
              to="/login"
              className="text-xs font-mono text-[#8B96A5] hover:text-white transition-colors"
            >
              Return to{' '}

              <span className="text-[#FF7A30] font-bold">
                Login
              </span>

            </Link>

          </div>

        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;