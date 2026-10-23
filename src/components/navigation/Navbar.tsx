import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import {
  Menu,
  X,
  User,
  LogIn,
} from 'lucide-react';

import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

interface CurrentProfile {
  id: string;
  role: 'student' | 'faculty' | 'admin';
  name?: string | null;
  email?: string | null;
}

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] =
    useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [currentUser, setCurrentUser] =
    useState<CurrentProfile | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================
  // LOAD AUTHENTICATED USER + PROFILE
  // ============================================================

  const loadCurrentUser = useCallback(
    async () => {
      if (
        !isSupabaseConfigured ||
        !supabase
      ) {
        setCurrentUser(null);
        return;
      }

      try {
        const {
          data: {
            user,
          },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setCurrentUser(null);
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from('profiles')
          .select(
            'id, role, name, email'
          )
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            'Navbar profile loading error:',
            profileError
          );

          setCurrentUser(null);
          return;
        }

        if (!profile) {
          setCurrentUser(null);
          return;
        }

        setCurrentUser(
          profile as CurrentProfile
        );
      } catch (error) {
        console.error(
          'Navbar authentication error:',
          error
        );

        setCurrentUser(null);
      }
    },
    []
  );

  // ============================================================
  // AUTH STATE
  // ============================================================

  useEffect(() => {
    loadCurrentUser();

    if (!supabase) {
      return;
    }

    const {
      data: {
        subscription,
      },
    } = supabase.auth.onAuthStateChange(
      async () => {
        await loadCurrentUser();
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadCurrentUser]);

  // ============================================================
  // SCROLL STATE
  // ============================================================

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(
        window.scrollY > 20
      );
    };

    handleScroll();

    window.addEventListener(
      'scroll',
      handleScroll
    );

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      );
    };
  }, []);

  // ============================================================
  // NAVIGATION
  // ============================================================


const navLinks = [
  { label: 'ABOUT', href: '#about' },
  { label: 'PHASES', href: '#phases' },
  { label: 'TIMELINE', href: '#timeline' },
  { label: 'ELIGIBILITY', href: '#eligibility' },
  { label: 'RULES & FAQ', href: '#rules' },
  { label: 'PRIZES', href: '#prizes' },
  { label: 'FACULTY', href: '#organizers' },
  { label: 'RESULTS', href: '#results' },
  { label: 'CONTACT', href: '#contact' },
];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (location.pathname !== '/') {
      e.preventDefault();

      navigate(`/${href}`);

      setMobileMenuOpen(false);

      return;
    }

    e.preventDefault();

    const target =
      document.querySelector(href);

    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }

    setMobileMenuOpen(false);
  };

  // ============================================================
  // ROLE → DASHBOARD
  // ============================================================

  const getDashboardPath = () => {
    if (!currentUser) {
      return '/login';
    }

    switch (currentUser.role) {
      case 'admin':
        return '/admin/dashboard';

      case 'faculty':
        return '/faculty/dashboard';

      case 'student':
      default:
        return '/student/dashboard';
    }
  };

  // ============================================================
  // CLOSE MOBILE MENU ON ROUTE CHANGE
  // ============================================================

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <header className="sticky top-2 z-40 w-full px-3 md:px-6 pointer-events-none transition-all duration-300">

      <div className="max-w-7xl mx-auto flex items-center justify-between pointer-events-auto">

        {/* ======================================================
            MAIN PILL NAVBAR
        ======================================================= */}

        <div
          className={`w-full flex items-center justify-between px-4 md:px-6 py-2.5 rounded-full transition-all duration-300 border-2 ${
            isScrolled
              ? 'bg-[#0D1219]/95 backdrop-blur-xl border-[#FF7A30] shadow-2xl shadow-[#FF7A30]/15'
              : 'bg-[#0D1219]/85 backdrop-blur-md border-[#FF7A30]/70'
          }`}
        >
          
{/* ==================================================
    BRAND
=================================================== */}

<Link
  to="/"
  className="flex min-w-0 shrink items-center gap-3 group"
>
  {/* NIE LOGO */}
  <div className="flex h-16 w-16 shrink-0 items-center justify-center">
    <img
      src="/assets/branding/nie-logo1.png"
      alt="NIE Logo"
      className="h-14 w-14 object-contain"
    />
  </div>

{/* BRAND TEXT */}
<div className="flex min-w-0 items-center">
  <span className="whitespace-nowrap font-display text-lg font-black tracking-tight text-[#F5F7FA] transition-colors duration-300 group-hover:text-[#36D9FF] sm:text-xl lg:text-2xl">
    NIErnaya
  </span>
</div>

</Link>


          {/* ==================================================
              DESKTOP NAVIGATION
          =================================================== */}

          <nav className="hidden lg:flex items-center gap-3 xl:gap-5 text-xs font-bold font-mono tracking-wider text-[#8B96A5]">

            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) =>
                  handleNavClick(
                    e,
                    link.href
                  )
                }
                className="hover:text-[#36D9FF] transition-colors py-1"
              >
                {link.label}
              </a>
            ))}

          </nav>

          {/* ==================================================
              ACTION AREA
          =================================================== */}

          <div className="flex items-center gap-2.5 shrink-0">

            {currentUser ? (

              <Link
                to={getDashboardPath()}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#121A23] border border-[#36D9FF]/50 text-[#36D9FF] font-mono text-xs font-bold hover:bg-[#36D9FF]/10 transition-colors shadow-sm"
              >

                <User className="w-3.5 h-3.5" />

                <span className="capitalize hidden sm:inline">
                  {currentUser.role} Portal
                </span>

                <span className="sm:hidden">
                  Portal
                </span>

              </Link>

            ) : (

              <Link
                to="/login"
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FF7A30] text-[#07090D] font-mono text-xs font-bold hover:bg-[#FF8C4B] active:scale-95 transition-all shadow-md shadow-[#FF7A30]/20"
              >

                <LogIn className="w-3.5 h-3.5" />

                <span>
                  PORTAL LOGIN
                </span>

              </Link>

            )}

            {/* MOBILE BUTTON */}

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  (previous) =>
                    !previous
                )
              }
              className="lg:hidden p-2 rounded-full bg-[#121A23] border border-white/10 text-[#F5F7FA] hover:border-[#FF7A30] transition-colors"
              aria-label={
                mobileMenuOpen
                  ? 'Close navigation menu'
                  : 'Open navigation menu'
              }
              aria-expanded={
                mobileMenuOpen
              }
            >

              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}

            </button>

          </div>

        </div>

      </div>

      {/* ======================================================
          MOBILE MENU
      ======================================================= */}

      {mobileMenuOpen && (

        <div className="lg:hidden pointer-events-auto mt-2 max-w-7xl mx-auto rounded-2xl bg-[#0D1219]/95 backdrop-blur-2xl border-2 border-[#FF7A30] p-5 shadow-2xl space-y-4">

          <div className="grid grid-cols-2 gap-2 text-xs font-mono font-bold">

            {navLinks.map((link) => (

              <a
                key={link.label}
                href={link.href}
                onClick={(e) =>
                  handleNavClick(
                    e,
                    link.href
                  )
                }
                className="p-2.5 rounded-lg bg-[#121A23] border border-white/5 text-[#8B96A5] hover:text-[#36D9FF] hover:border-[#36D9FF]/30 transition-all text-center"
              >
                {link.label}
              </a>

            ))}

          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">

            <Link
              to={getDashboardPath()}
              onClick={() =>
                setMobileMenuOpen(false)
              }
              className="w-full py-2.5 rounded-xl bg-[#FF7A30] text-[#07090D] font-mono text-xs font-bold text-center flex items-center justify-center gap-2"
            >

              {currentUser ? (
                <>
                  <User className="w-4 h-4" />

                  <span>
                    Go to{' '}
                    {currentUser.role
                      .charAt(0)
                      .toUpperCase() +
                      currentUser.role.slice(
                        1
                      )}{' '}
                    Dashboard
                  </span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />

                  <span>
                    Access NIErnaya Portal
                  </span>
                </>
              )}

            </Link>

          </div>

        </div>

      )}

    </header>
  );
};