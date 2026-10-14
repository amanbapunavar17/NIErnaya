import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  AlertCircle,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Phone,
  BadgeCheck,
  Loader2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

const BRANCHES = [
  'CSE',
  'AIML',
  'ECE',
  'EEE',
  'ME',
  'CIVIL',
  'Other',
];

const SECTIONS = ['A', 'B', 'C', 'D' , 'E' , 'F' , 'G' , 'H'];

const YEARS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
];

const SEMESTERS = [
  { value: 1, label: '1st Semester' },
  { value: 2, label: '2nd Semester' },
  { value: 3, label: '3rd Semester' },
  { value: 4, label: '4th Semester' },
  { value: 5, label: '5th Semester' },
  { value: 6, label: '6th Semester' },
  { value: 7, label: '7th Semester' },
  { value: 8, label: '8th Semester' },
];

const getCampusForBranch = (selectedBranch: string) => {
  return selectedBranch === 'CSE' || selectedBranch === 'AIML'
    ? 'North'
    : 'South';
};

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');

  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cleanName = name.trim();
  const cleanUSN = usn.trim().toUpperCase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanPhone = phone.trim();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Database authentication is not configured. Please contact the administrator.'
      );
      return;
    }

    /*
     * ---------------------------------------------------------
     * VALIDATION
     * ---------------------------------------------------------
     */

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }

    if (!cleanUSN) {
      setError('Please enter your USN.');
      return;
    }

    if (!cleanEmail.endsWith('@nie.ac.in')) {
      setError(
        'Only registered @nie.ac.in student email addresses are allowed.'
      );
      return;
    }

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!branch) {
      setError('Please select your branch.');
      return;
    }

    if (!section) {
      setError('Please select your section.');
      return;
    }

    if (!year) {
      setError('Please select your year.');
      return;
    }

    if (!semester) {
      setError('Please select your semester.');
      return;
    }

    const selectedYear = Number(year);
    const selectedSemester = Number(semester);

    /*
     * NIErnaya ELIGIBILITY
     *
     * Only 2nd year / 3rd semester students are eligible.
     */

    if (selectedYear !== 2 || selectedSemester !== 3) {
      setError(
        "NIErnaya registration is currently limited to 2nd year / 3rd semester students."
      );
      return;
    }

    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const campus = getCampusForBranch(branch);

      /*
       * ---------------------------------------------------------
       * 1. CREATE AUTH ACCOUNT
       * ---------------------------------------------------------
       */

      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: {
              name: cleanName,
              usn: cleanUSN,
              phone: cleanPhone,
              branch,
              section,
              year: selectedYear,
              semester: selectedSemester,
              role: 'student',
              campus,
            },
          },
        });

      if (authError) {
        throw authError;
      }

      if (!authData.user) {
        throw new Error(
          'Account creation failed. No user account was returned.'
        );
      }

      /*
       * ---------------------------------------------------------
       * 2. AUTH SESSION REQUIRED
       * ---------------------------------------------------------
       *
       * The student profile RPC uses auth.uid().
       *
       * Therefore Supabase email confirmation must be disabled
       * for this immediate signup -> profile creation flow.
       */

      if (!authData.session) {
        await supabase.auth.signOut();

        throw new Error(
          'Your account was created, but Supabase email confirmation is enabled. Please ask the administrator to enable automatic email confirmation for NIErnaya student signup, then try again.'
        );
      }

      /*
       * ---------------------------------------------------------
       * 3. CREATE STUDENT PROFILE
       * ---------------------------------------------------------
       */

      const { error: profileError } = await supabase.rpc(
  'create_student_profile',
  {
    p_name: cleanName,
    p_usn: cleanUSN,
    p_phone: cleanPhone,
    p_branch: branch,
    p_year: Number(year),
    p_semester: Number(semester),
    p_section: section,
    p_campus: getCampusForBranch(branch),
  }
);

      if (profileError) {
        await supabase.auth.signOut();
        throw profileError;
      }

      /*
       * ---------------------------------------------------------
       * 4. SIGN OUT
       * ---------------------------------------------------------
       *
       * After signup, the user must explicitly login.
       */

      await supabase.auth.signOut();

      /*
       * ---------------------------------------------------------
       * 5. RETURN TO LOGIN PAGE
       * ---------------------------------------------------------
       */

      navigate('/login', {
        replace: true,
        state: {
          registrationSuccess: true,
          registeredEmail: cleanEmail,
        },
      });
    } catch (registrationError: unknown) {
      console.error(
        'NIErnaya registration error:',
        registrationError
      );

      let message = 'Account creation failed. Please try again.';

      if (registrationError instanceof Error) {
        message = registrationError.message;
      } else if (
        typeof registrationError === 'object' &&
        registrationError !== null &&
        'message' in registrationError
      ) {
        message = String(
          (registrationError as { message?: unknown }).message ??
            message
        );
      }

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes('user already registered') ||
        lowerMessage.includes('already registered')
      ) {
        message =
          'An account with this email already exists. Please use Portal Login instead.';
      } else if (
        lowerMessage.includes('duplicate') &&
        lowerMessage.includes('usn')
      ) {
        message =
          'This USN is already registered. Please check your USN.';
      } else if (
        lowerMessage.includes('email') &&
        lowerMessage.includes('nie')
      ) {
        message =
          'Please use a valid @nie.ac.in student email address.';
      } else if (
        lowerMessage.includes('year') ||
        lowerMessage.includes('semester')
      ) {
        message =
          "NIErnaya registration is currently limited to 2nd year / 3rd semester students.";
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090D] flex items-center justify-center p-4 relative overflow-y-auto">

      {/* Background */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#36D9FF]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF7A30]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute inset-0 bg-grid-cyber opacity-20 pointer-events-none" />

      {/* Back */}
      <Link
        to="/login"
        className="fixed top-6 left-6 inline-flex items-center gap-2 text-xs font-mono text-[#8B96A5] hover:text-white transition-colors bg-[#0D1219] px-3.5 py-2 rounded-full border border-white/10 z-20"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>BACK TO PORTAL LOGIN</span>
      </Link>

      <div className="w-full max-w-2xl relative z-10 py-20">

        <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border-2 border-[#FF7A30] shadow-2xl shadow-[#FF7A30]/10">

          {/* Header */}
          <div className="text-center space-y-2 mb-7">

            <div className="w-12 h-12 mx-auto rounded-2xl bg-[#121A23] border border-[#FF7A30] flex items-center justify-center text-[#FF7A30]">
              <UserPlus className="w-6 h-6" />
            </div>

            <h1 className="font-display font-black text-2xl text-white">
              CREATE TEAM LEADER ACCOUNT
            </h1>

            <p className="text-xs text-[#8B96A5] font-mono">
              REGISTER ONCE. LOGIN LATER. CREATE YOUR TEAM.
            </p>

          </div>

          {/* Eligibility */}
          <div className="mb-6 p-4 rounded-xl bg-[#07090D] border border-[#36D9FF]/20">

            <div className="flex items-start gap-3">

              <BadgeCheck className="w-5 h-5 text-[#36D9FF] shrink-0 mt-0.5" />

              <div className="space-y-1">

                <p className="text-xs font-mono font-bold text-[#36D9FF]">
                  TEAM LEADER ELIGIBILITY
                </p>

                <p className="text-[11px] text-[#8B96A5] font-mono leading-relaxed">
                  Only NIE students in 2nd year / 3rd semester
                  can create a team leader account.
                  Use your official @nie.ac.in email.
                </p>

              </div>

            </div>

          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">

              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

              <span>{error}</span>

            </div>
          )}

          <form
            onSubmit={handleRegister}
            className="space-y-5"
          >

            {/* Name + USN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-1.5">

                <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                  FULL NAME
                </label>

                <div className="relative">

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    autoComplete="name"
                    required
                    className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/50 text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
                  />

                  <User className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

                </div>

              </div>

              <div className="space-y-1.5">

                <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                  USN
                </label>

                <div className="relative">

                  <input
                    type="text"
                    value={usn}
                    onChange={(e) =>
                      setUsn(e.target.value.toUpperCase())
                    }
                    placeholder="1NI23CS000"
                    autoComplete="off"
                    required
                    className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/50 text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors uppercase"
                  />

                  <BadgeCheck className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

                </div>

              </div>

            </div>

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

            {/* Phone */}
            <div className="space-y-1.5">

              <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                MOBILE NUMBER
              </label>

              <div className="relative">

                <input
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 10)
                    )
                  }
                  placeholder="10 digit mobile number"
                  autoComplete="tel"
                  required
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/50 text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
                />

                <Phone className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

              </div>

            </div>

            {/* Branch + Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div className="space-y-1.5">

                <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                  BRANCH
                </label>

                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
                >
                  <option value="">
                    Select branch
                  </option>

                  {BRANCHES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

              </div>

              <div className="space-y-1.5">

                <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                  SECTION
                </label>

                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
                >
                  <option value="">
                    Select section
                  </option>

                  {SECTIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>

              </div>

            </div>

{/* Year + Semester */}
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

  <div className="space-y-1.5">

    <label className="block text-xs font-mono font-bold text-[#8B96A5]">
      YEAR
    </label>

    <select
      value={year}
      onChange={(e) => {
        setYear(e.target.value);
        setError(null);
      }}
      required
      className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
    >
      <option value="">
        Select year
      </option>

      {YEARS.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>

  </div>

  <div className="space-y-1.5">

    <label className="block text-xs font-mono font-bold text-[#8B96A5]">
      SEMESTER
    </label>

    <select
      value={semester}
      onChange={(e) => {
        setSemester(e.target.value);
        setError(null);
      }}
      required
      className="w-full px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
    >
      <option value="">
        Select semester
      </option>

      {SEMESTERS.map((item) => (
        <option key={item.value} value={item.value}>
          {item.label}
        </option>
      ))}
    </select>

  </div>

</div>

            {/* Campus preview */}
            {branch && (
              <div className="p-3 rounded-xl bg-[#36D9FF]/5 border border-[#36D9FF]/20">

                <p className="text-[10px] font-mono text-[#8B96A5]">
                  CAMPUS
                </p>

                <p className="mt-1 text-xs font-mono font-bold text-[#36D9FF]">
                  {getCampusForBranch(branch)} CAMPUS
                </p>

              </div>
            )}

            {/* Eligibility reminder */}
            {(year || semester) && (
              <div
                className={`p-3 rounded-xl border font-mono text-xs ${
                  Number(year) === 2 && Number(semester) === 3
                    ? 'bg-green-500/5 border-green-500/20 text-green-400'
                    : 'bg-red-500/5 border-red-500/20 text-red-400'
                }`}
              >
                {Number(year) === 2 && Number(semester) === 3 ? (
                  <>
                    ✓ You meet the current NIErnaya eligibility
                    requirement.
                  </>
                ) : (
                  <>
                    Registration is currently available only for
                    2nd year / 3rd semester students.
                  </>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-1.5">

              <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                CREATE PASSWORD
              </label>

              <div className="relative">

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="w-full px-4 py-2.5 pl-10 rounded-xl bg-[#121A23] border border-white/10 text-white placeholder:text-[#8B96A5]/50 text-sm focus:outline-none focus:border-[#36D9FF] font-mono transition-colors"
                />

                <Lock className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

              </div>

            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">

              <label className="block text-xs font-mono font-bold text-[#8B96A5]">
                CONFIRM PASSWORD
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

                <Lock className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

              </div>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF7A30] to-[#FF9050] text-[#07090D] font-display font-black text-sm tracking-wider uppercase hover:shadow-lg hover:shadow-[#FF7A30]/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  CREATING ACCOUNT...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  CREATE TEAM LEADER ACCOUNT
                </>
              )}
            </button>

          </form>

          {/* Existing account */}
          <div className="text-center pt-5 text-xs font-mono text-[#8B96A5]">

            Already have an account?{' '}

            <Link
              to="/login"
              className="text-[#FF7A30] font-bold hover:underline"
            >
              Sign In
            </Link>

          </div>

          {/* Security */}
          <div className="text-center pt-4">

            <p className="text-[10px] text-[#566171] font-mono leading-relaxed">
              AUTHENTICATION SECURED BY SUPABASE
              <br />
              STUDENT ELIGIBILITY VERIFIED SERVER-SIDE
            </p>

          </div>

        </div>
      </div>
    </div>
  );
};