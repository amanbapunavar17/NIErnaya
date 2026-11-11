import React, { useEffect, useState } from 'react';
import {
  Link,
  Outlet,
  useNavigate,
  useLocation,
} from 'react-router-dom';

import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  ClipboardList,
  LogOut,
  ArrowLeft,
} from 'lucide-react';

import { supabase } from '../lib/supabase/client';

type FacultyProfile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

export const FacultyLayout: React.FC = () => {
  const [profile, setProfile] =
    useState<FacultyProfile | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* ---------------------------------------------------------------------- */
  /* Load faculty profile                                                   */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      if (!supabase) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !mounted) {
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .eq('id', user.id)
        .single();

      if (mounted && data) {
        setProfile(data as FacultyProfile);
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Logout                                                                 */
  /* ---------------------------------------------------------------------- */

  const handleLogout = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to log out?\n\nYou will need to sign in again to access your portal.'
    );

    if (!confirmed) return;

    if (supabase) {
      await supabase.auth.signOut();
    }

    navigate('/');
  };

  /* ---------------------------------------------------------------------- */
  /* Navigation                                                             */
  /* ---------------------------------------------------------------------- */

  const navItems = [
    {
      label: 'Faculty Dashboard',
      href: '/faculty/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Assigned Squads',
      href: '/faculty/teams',
      icon: Users,
    },
    {
      label: 'Phase 1 Evaluation',
      href: '/faculty/phase1-evaluation',
      icon: ClipboardCheck,
    },
    { label: 'Phase 2 Faculty', href: '/faculty/phase2', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-[#07090D] text-[#F5F7FA] flex flex-col">

      {/* ================================================================== */}
      {/* Header                                                              */}
      {/* ================================================================== */}

      <header className="h-16 border-b border-white/10 bg-[#0D1219]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">

        <div className="flex items-center gap-4">

          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-mono text-[#8B96A5] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />

            <span className="hidden sm:inline">
              PUBLIC SITE
            </span>
          </Link>

          <div className="h-4 w-px bg-white/10" />

          <div className="flex items-center gap-2">

            <span className="font-display font-black text-base text-white">
              NIErnaya
            </span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#8B5CF6]/20 text-[#8B5CF6] border border-[#8B5CF6]/30 font-bold">
              FACULTY EVALUATOR
            </span>

          </div>

        </div>

        <div className="flex items-center gap-4">

          <div className="text-right hidden sm:block">

            <div className="text-xs font-bold text-white font-mono">
              {profile?.name ||
                profile?.email ||
                'Faculty'}
            </div>

            <div className="text-[10px] text-[#8B96A5] font-mono">
              Academic Evaluator Session
            </div>

          </div>

          <button
            onClick={() => void handleLogout()}
            className="p-2 rounded-lg bg-[#121A23] border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </header>

      {/* ================================================================== */}
      {/* Navigation                                                          */}
      {/* ================================================================== */}

      <nav className="border-b border-white/5 bg-[#0A0E14] px-4 sm:px-8">

        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto py-2">

          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#8B5CF6] text-white shadow-md shadow-[#8B5CF6]/20'
                    : 'text-[#8B96A5] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />

                <span>{item.label}</span>
              </Link>
            );
          })}

        </div>

      </nav>

      {/* ================================================================== */}
      {/* Main                                                                */}
      {/* ================================================================== */}

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        <Outlet />
      </main>

    </div>
  );
};

export default FacultyLayout;