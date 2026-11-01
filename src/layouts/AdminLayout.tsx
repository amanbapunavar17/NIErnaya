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
  GraduationCap,
  Shuffle,
  UploadCloud,
  ClipboardList,
  Calendar,
  FileText,
  Trophy,
  Award,
  Sliders,
  LogOut,
  Menu,
  X,
  History,
} from 'lucide-react';

import { supabase } from '../lib/supabase/client';

type AdminProfile = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
};

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  /* ---------------------------------------------------------------------- */
  /* Load authenticated admin profile                                      */
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
        setProfile(data as AdminProfile);
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
      label: 'Overview',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
    },
    {
      label: 'Registered Squads',
      href: '/admin/teams',
      icon: Users,
    },
    {
      label: 'Student Roster',
      href: '/admin/students',
      icon: GraduationCap,
    },
    {
      label: 'Faculty Committee',
      href: '/admin/faculty',
      icon: GraduationCap,
    },
    {
      label: 'Faculty Allocation',
      href: '/admin/allocation',
      icon: Shuffle,
    },
    {
      label: 'Submissions Hub',
      href: '/admin/submissions',
      icon: UploadCloud,
    },
    {
      label: 'Phases & Timeline',
      href: '/admin/phases',
      icon: Calendar,
    },
    {
      label: 'Phase 1 Google Forms',
      href: '/admin/phase1-forms',
      icon: ClipboardList,
    },
    {
      label: 'Content CMS',
      href: '/admin/content',
      icon: Sliders,
    },
    {
      label: 'Results Publisher',
      href: '/admin/results',
      icon: Trophy,
    },
    {
      label: 'Official Reports',
      href: '/admin/reports',
      icon: FileText,
    },
    {
      label: 'Certificates Engine',
      href: '/admin/certificates',
      icon: Award,
    },
    {
      label: 'Audit Logs',
      href: '/admin/audit',
      icon: History,
    },
  ];

  return (
    <div className="min-h-screen bg-[#07090D] text-[#F5F7FA] flex flex-col md:flex-row">

      {/* ================================================================== */}
      {/* Desktop Sidebar                                                    */}
      {/* ================================================================== */}

      <aside className="hidden md:flex flex-col w-64 bg-[#0D1219] border-r border-white/10 shrink-0 sticky top-0 h-screen overflow-y-auto">

        {/* Brand */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">

          <Link
            to="/"
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#36D9FF] to-[#173A8C] flex items-center justify-center font-display font-black text-[#07090D] text-sm">
              DX
            </div>

            <div>
              <div className="font-display font-black text-sm text-white">
                NIErnaya
              </div>

              <div className="text-[10px] font-mono text-[#36D9FF]">
                ADMIN CONTROL ROOM
              </div>
            </div>
          </Link>

        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">

          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-[#36D9FF] text-[#07090D] shadow-md shadow-[#36D9FF]/20'
                    : 'text-[#8B96A5] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />

                <span>{item.label}</span>
              </Link>
            );
          })}

        </nav>

        {/* User Session */}
        <div className="p-4 border-t border-white/10 bg-[#0A0E14] flex items-center justify-between">

          <div className="truncate pr-2">

            <div className="text-xs font-bold font-mono text-white truncate">
              {profile?.name ||
                profile?.email ||
                'Administrator'}
            </div>

            <div className="text-[10px] text-[#36D9FF] font-mono">
              {profile?.role === 'admin'
                ? 'Full Permissions'
                : 'Administrator Session'}
            </div>

          </div>

          <button
            onClick={() => void handleLogout()}
            className="p-2 rounded-lg bg-[#121A23] border border-white/10 hover:border-red-500/50 hover:text-red-400 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>

        </div>

      </aside>

      {/* ================================================================== */}
      {/* Mobile Header                                                      */}
      {/* ================================================================== */}

      <div className="md:hidden h-16 bg-[#0D1219] border-b border-white/10 px-4 flex items-center justify-between sticky top-0 z-30">

        <div className="flex items-center gap-2">

          <button
            onClick={() => setSidebarOpen((value) => !value)}
            className="p-2 rounded-lg bg-[#121A23] border border-white/10 text-white"
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>

          <span className="font-display font-black text-sm text-white">
            CONTROL ROOM
          </span>

        </div>

        <Link
          to="/"
          className="text-xs font-mono text-[#36D9FF]"
        >
          EXIT TO SITE
        </Link>

      </div>

      {/* ================================================================== */}
      {/* Mobile Drawer                                                       */}
      {/* ================================================================== */}

      {sidebarOpen && (
        <div className="md:hidden bg-[#0D1219] border-b border-white/10 p-4 space-y-1">

          {navItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              location.pathname === item.href;

            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-[#36D9FF] text-[#07090D]'
                    : 'text-[#8B96A5] hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />

                <span>{item.label}</span>
              </Link>
            );
          })}

        </div>
      )}

      {/* ================================================================== */}
      {/* Content                                                             */}
      {/* ================================================================== */}

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>

      </div>

    </div>
  );
};

export default AdminLayout;