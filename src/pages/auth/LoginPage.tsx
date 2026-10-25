import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LogIn,
  AlertCircle,
  ArrowLeft,
  Lock,
  Mail,
  UserPlus,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

interface LoginLocationState {
  registrationSuccess?: boolean;
  registeredEmail?: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const registrationState =
    (location.state as LoginLocationState | null) ?? null;

  const [email, setEmail] = useState(
    registrationState?.registeredEmail ?? ''
  );
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [registrationSuccess, setRegistrationSuccess] = useState(
    Boolean(registrationState?.registrationSuccess)
  );

  useEffect(() => {
    if (registrationState?.registrationSuccess) {
      setRegistrationSuccess(true);

      /*
       * Clear the navigation state after reading it so that
       * refreshing / revisiting the login page does not keep
       * showing the registration-success message.
       */
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, [registrationState]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Database authentication is not configured. Please contact the administrator.'
      );
      return;
    }

    if (!cleanEmail) {
      setError('Please enter your NIE email address.');
      return;
    }

    if (!cleanEmail.endsWith('@nie.ac.in')) {
      setError('Please use your registered @nie.ac.in email address.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      /*
       * ---------------------------------------------------------
       * 1. AUTHENTICATE
       * ---------------------------------------------------------
       */

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error(
          'Authentication failed. No user account was returned.'
        );

      }

      
const {
  data: { session },
  error: sessionError,
} = await supabase.auth.getSession();

console.log('[LOGIN SESSION CHECK]', {
  hasSession: !!session,
  userId: session?.user?.id ?? null,
  tokenPresent: !!session?.access_token,
  sessionError: sessionError?.message ?? null,
});


      /*
       * ---------------------------------------------------------
       * 2. LOAD REAL ROLE FROM DATABASE
       * ---------------------------------------------------------
       *
       * The login page never asks the user to choose:
       *
       * Student / Faculty / Admin
       *
       * The profiles table is the authority.
       */

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, name, email')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        await supabase.auth.signOut();
        throw new Error(
          'Your account was authenticated, but your NIErnaya profile could not be loaded.'
        );
      }

      if (!profile) {
        await supabase.auth.signOut();

        throw new Error(
          'Your account exists, but no NIErnaya profile was found.'
        );
      }

      /*
       * ---------------------------------------------------------
       * 3. ROLE → PORTAL
       * ---------------------------------------------------------
       */

      switch (profile.role) {
        case 'student':
          navigate('/student/dashboard', {
            replace: true,
          });
          break;

        case 'faculty':
          navigate('/faculty/dashboard', {
            replace: true,
          });
          break;

        case 'admin':
          navigate('/admin/dashboard', {
            replace: true,
          });
          break;

        default:
          await supabase.auth.signOut();

          throw new Error(
            'Your account has an invalid NIErnaya access role.'
          );
      }
    } catch (loginError: unknown) {
      console.error('NIErnaya login error:', loginError);

      let message =
        'Login failed. Please check your email and password.';

      if (loginError instanceof Error) {
        message = loginError.message;
      } else if (
        typeof loginError === 'object' &&
        loginError !== null &&
        'message' in loginError
      ) {
        message = String(
          (loginError as { message?: unknown }).message ?? message
        );
      }

      const lowerMessage = message.toLowerCase();

      if (lowerMessage.includes('invalid login credentials')) {
        message = 'Invalid email or password.';
      }

      if (lowerMessage.includes('email not confirmed')) {
        message =
          'Your NIE email has not been confirmed yet. Please complete email verification and try again.';
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] flex flex-col justify-center items-center p-4 relative overflow-hidden">

      {/* Ambient background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#36D9FF]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute inset-0 bg-grid-cyber opacity-20 pointer-events-none" />

      {/* Back */}
      <Link
        to="/"
        className="absolute top-6 left-6 inline-flex items-center gap-2 text-xs font-mono text-[#8B96A5] hover:text-white transition-colors bg-[#0D1219] px-3.5 py-2 rounded-full border border-white/10 z-20"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>BACK TO NIErnaya</span>
      </Link>

      <div className="w-full max-w-md relative z-10">

        <div className="p-8 rounded-3xl bg-[#0D1219] border-2 border-[#FF7A30] shadow-2xl shadow-[#FF7A30]/15 space-y-6">

          {/* Header */}
          <div className="text-center space-y-2">

            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#121A23] border border-[#FF7A30] flex items-center justify-center text-[#FF7A30] shadow-md">
              <LogIn className="w-6 h-6" />
            </div>

            <h1 className="font-display font-black text-2xl text-white">
              PORTAL LOGIN
            </h1>

            <p className="text-xs text-[#8B96A5] font-mono">
              SECURE ACCESS TO NIErnaya
            </p>

          </div>

          {/* Registration success */}
          {registrationSuccess && (
            <div className="p-4 rounded-xl bg-[#36D9FF]/10 border border-[#36D9FF]/30 flex items-start gap-3">

              <CheckCircle2 className="w-5 h-5 text-[#36D9FF] shrink-0 mt-0.5" />

              <div>
                <p className="text-xs font-mono font-bold text-[#36D9FF]">
                  ACCOUNT CREATED SUCCESSFULLY
                </p>

                <p className="mt-1 text-[11px] text-[#8B96A5] font-mono leading-relaxed">
                  Your team leader account is ready.
                  Please sign in using the email and password
                  you created.
                </p>
              </div>

            </div>
          )}

          {/* Information */}
          <div className="p-3.5 rounded-xl bg-[#07090D] border border-white/5 text-center">

            <p className="text-[11px] font-mono text-[#8B96A5] leading-relaxed">

              Sign in using your registered{' '}

              <span className="text-[#36D9FF] font-bold">
                @nie.ac.in
              </span>{' '}

              email address.

              <br />

              Your portal role is detected automatically.

            </p>

          </div>

          {/* Error */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">

              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <span>{error}</span>

            </div>
          )}

          {/* Login form */}
          <form
            onSubmit={handleLogin}
            className="space-y-4"
          >

            {/* Email */}
            <div className="space-y-1.5">

              <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                NIE EMAIL
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

            {/* Password */}
            <div className="space-y-1.5">

              <div className="flex items-center justify-between">

                <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                  PASSWORD
                </label>

                

              </div>

              <div className="relative">

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/50 text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
                />

                <Lock className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

              </div>

            </div>

            {/* Sign in */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-lg hover:shadow-[#FF7A30]/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
            >

              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  SIGN IN
                </>
              )}

            </button>

          </form>

          {/* New team leader */}
          <div className="pt-4 border-t border-white/10 text-center">

            <p className="text-xs font-mono text-[#8B96A5]">
              NEW TEAM LEADER?
            </p>

            <Link
              to="/register"
              className="mt-2 inline-flex items-center justify-center gap-2 text-[#FF7A30] font-mono text-xs font-bold hover:text-[#FF9050] hover:underline transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              CREATE ACCOUNT
            </Link>

          </div>

          {/* Security */}
          <div className="text-center pt-1">

            <p className="text-[10px] text-[#566171] font-mono leading-relaxed">
              AUTHENTICATION SECURED BY SUPABASE
              <br />
              ACCESS ROLE VERIFIED SERVER-SIDE
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};