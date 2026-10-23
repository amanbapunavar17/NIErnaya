import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUp,
  MessageCircle,
  GraduationCap,
  ExternalLink,
  Code2,
  ShieldCheck,
} from 'lucide-react';

import { SITE_CONFIG } from '../../../config/site';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <footer
      id="footer"
      className="relative overflow-hidden border-t border-white/10 bg-[#030508] px-4 pb-10 pt-20 text-[#8B96A5] md:px-8"
    >
      {/* Ambient effects */}
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#36D9FF]/5 blur-[140px]" />
      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FF7A30]/5 blur-[140px]" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* BIG INSTITUTIONAL BRAND */}
        <div className="mb-10 sm:mb-16 grid grid-cols-1 gap-6 sm:gap-10 border-b border-white/10 pb-14 lg:grid-cols-[1.2fr_2fr] lg:items-center">

          {/* Logo */}
          <div className="flex items-center gap-7">
            <img
              src="/assets/branding/nie-logo1.png"
              alt="The National Institute of Engineering"
              className="h-24 w-auto max-w-[180px] object-contain object-left drop-shadow-[0_0_24px_rgba(255,255,255,0.08)] sm:h-28 sm:max-w-[220px]"
            />

            <div className="min-w-0">
              <p className="font-mono text-[9px] font-black uppercase tracking-[0.25em] text-[#36D9FF]">
                THE NATIONAL INSTITUTE OF ENGINEERING
              </p>

              <h2 className="mt-2 font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
              NIErnaya
            </h2>

              <p className="mt-2 font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#AAB3C0]">
                DISCOVER. ANALYZE. VISUALIZE.
              </p>
            </div>
          </div>

          {/* Department identity */}
          <div className="lg:border-l lg:border-white/10 lg:pl-10">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FF7A30]/25 bg-[#FF7A30]/10 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#FF7A30]">
              <GraduationCap className="h-3.5 w-3.5" />
              Academic Department
            </div>

            <h3 className="font-display text-2xl font-black leading-tight text-white sm:text-3xl">
              Department of Computer Science and Engineering
            </h3>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#8B96A5]">
              NIErnaya — From data to decision: A Data Detective Challenge,
              conducted by the CSE Department of The National Institute
              of Engineering, Mysuru.
            </p>
          </div>
        </div>

        {/* FOOTER GRID */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* ABOUT */}
          <div className="space-y-4">
            <h4 className="font-display text-sm font-black uppercase tracking-wider text-white">
              NIErnaya
            </h4>

            <p className="text-xs leading-6 text-[#8B96A5]">
              From Data to Decision: A Data Detective Challenge focused on
              problem understanding, data handling, exploratory analysis,
              visualization, and insight generation.
            </p>

            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[#36D9FF]">
              <ShieldCheck className="h-3.5 w-3.5" />
              NIE • CSE DEPARTMENT
            </div>
          </div>

          {/* EXPLORE */}
          <div className="space-y-4 font-mono text-xs">
            <h4 className="font-display text-sm font-black uppercase tracking-wider text-white">
              EXPLORE
            </h4>

            <ul className="space-y-3">
              <li>
                <a href="#about" className="transition-colors hover:text-[#36D9FF]">
                  About NIErnaya
                </a>
              </li>

              <li>
                <a href="#mission" className="transition-colors hover:text-[#36D9FF]">
                  Our Mission
                </a>
              </li>

              <li>
                <a href="#phases" className="transition-colors hover:text-[#36D9FF]">
                  Three Phases
                </a>
              </li>

              <li>
                <a href="#timeline" className="transition-colors hover:text-[#36D9FF]">
                  Timeline
                </a>
              </li>

              <li>
                <a href="#prizes" className="transition-colors hover:text-[#36D9FF]">
                  Prizes
                </a>
              </li>

              <li>
                <a href="#organizers" className="transition-colors hover:text-[#36D9FF]">
                  Faculty Committee
                </a>
              </li>
            </ul>
          </div>

          {/* ACADEMIC */}
          <div className="space-y-4 font-mono text-xs">
            <h4 className="font-display text-sm font-black uppercase tracking-wider text-white">
              ACADEMIC
            </h4>

            <ul className="space-y-3">
              <li>
                <a href="#eligibility" className="transition-colors hover:text-[#36D9FF]">
                  Eligibility
                </a>
              </li>

              <li>
                <a href="#rules" className="transition-colors hover:text-[#36D9FF]">
                  Rules & Guidelines
                </a>
              </li>


              <li>
                <a href="#faq" className="transition-colors hover:text-[#36D9FF]">
                  FAQs
                </a>
              </li>

              <li>
                <a href="#contact" className="transition-colors hover:text-[#36D9FF]">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* PORTALS */}
          <div className="space-y-4 font-mono text-xs">
            <h4 className="font-display text-sm font-black uppercase tracking-wider text-white">
              PORTALS
            </h4>

            <ul className="space-y-3">
              <li>
                <Link
                  to="/student/team"
                  className="font-bold text-[#FF7A30] transition-colors hover:text-[#FF9050]"
                >
                  
                </Link>
              </li>

              <li>
                <Link
                  to="/login"
                  className="transition-colors hover:text-white"
                >
                  Student Leader Login
                </Link>
              </li>

              <li>
                <Link
                  to="/login"
                  className="transition-colors hover:text-white"
                >
                  Faculty Portal
                </Link>
              </li>

              <li>
                <Link
                  to="/login"
                  className="transition-colors hover:text-white"
                >
                  Admin Control Room
                </Link>
              </li>
            </ul>

            <a
              href={SITE_CONFIG.whatsappCommunityLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 rounded-xl border border-[#25D366]/20 bg-[#25D366]/5 px-3 py-2.5 font-mono text-[10px] font-bold text-[#25D366] transition-all hover:border-[#25D366]/40 hover:bg-[#25D366]/10"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp Community
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        
{/* DEVELOPER CREDIT STRIP */}
<div className="mt-14 border-t border-white/10 pt-8">
  <div className="mx-auto flex min-h-[140px] max-w-2xl items-center gap-5 rounded-2xl border border-white/10 bg-[#0A0E14] p-6 sm:p-7">
    <img
      src="/assets/people/developer.jpeg"
      alt="Aman Bapunavar"
      className="h-24 w-24 shrink-0 rounded-2xl object-cover object-top sm:h-28 sm:w-28"
    />

    <div className="min-w-0 flex-1">
      <p className="font-mono text-[11px] font-black uppercase tracking-[0.15em] text-[#FF7A30]">
        DEVELOPED BY
      </p>

      <p className="mt-2 break-words font-display text-lg font-bold text-white sm:text-xl">
        {SITE_CONFIG.developerCredit.name}
      </p>

      <p className="mt-1 text-xs leading-relaxed text-[#8B96A5] sm:text-sm">
        {SITE_CONFIG.developerCredit.department}
      </p>
    </div>

    <Code2 className="hidden h-6 w-6 shrink-0 text-[#FF7A30] sm:block" />
  </div>
</div>



        {/* BOTTOM */}
        <div className="mt-8 flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 text-center md:flex-row md:text-left">

          <div>
            <p className="text-[10px] leading-5 text-[#8B96A5]">
              © {SITE_CONFIG.edition} {SITE_CONFIG.name}
            </p>

            <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#36D9FF]">
              THE NATIONAL INSTITUTE OF ENGINEERING • MYSURU
            </p>
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0D1219] px-4 py-2.5 font-mono text-[10px] font-bold text-[#8B96A5] transition-all hover:border-[#FF7A30]/40 hover:text-white"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            BACK TO TOP
          </button>

          <div className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#8B96A5]">
            FROM DATA TO DECISION
          </div>
        </div>
      </div>
    </footer>
  );
};