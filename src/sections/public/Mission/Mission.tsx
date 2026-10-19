/**
 * ================================================================
 * Mission.tsx — Enhanced Academic Vision & Course Outcomes
 * ================================================================
 * Effects added:
 * - 3D Perspective Tilt on Course Outcome cards and core mission statement
 * - GSAP ScrollTrigger staggered entrance for CO cards
 * - Dynamic cursor radial glow with cyan/orange accents
 * - Gradient flowing borders and atmospheric depth
 * - Preserves ALL content, texts, course outcomes (CO1–CO4), and institutional credits
 * ================================================================
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  Target,
  BarChart3,
  Database,
  LineChart,
  LayoutDashboard,
} from 'lucide-react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const COURSE_OUTCOMES = [
  {
    code: 'CO1',
    icon: Database,
    title: 'FOUNDATIONS',
    text: 'Discuss the fundamentals of data analytics, data preprocessing, statistical analysis, and visualization concepts.',
  },
  {
    code: 'CO2',
    icon: BarChart3,
    title: 'APPLICATION',
    text: 'Apply data handling, cleaning, transformation, and visualization techniques using Python-based analytical tools.',
  },
  {
    code: 'CO3',
    icon: LineChart,
    title: 'ANALYSIS',
    text: 'Analyse analytical results using statistical measures and exploratory data analysis techniques.',
  },
  {
    code: 'CO4',
    icon: LayoutDashboard,
    title: 'SOLUTION DESIGN',
    text: 'Design and develop interactive dashboards and complete data analytics solutions for domain-specific problems using modern analytics and visualization platforms.',
  },
];

/* 3D Tilt Card */
const COTiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className, glowColor = '#36D9FF' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0);
  const posY = useMotionValue(0);

  const rX = useSpring(useTransform(posY, [-0.5, 0.5], [6, -6]), {
    stiffness: 260,
    damping: 24,
  });
  const rY = useSpring(useTransform(posX, [-0.5, 0.5], [-6, 6]), {
    stiffness: 260,
    damping: 24,
  });

  const gx = useSpring(useTransform(posX, [-0.5, 0.5], [0, 100]), {
    stiffness: 260,
    damping: 24,
  });
  const gy = useSpring(useTransform(posY, [-0.5, 0.5], [0, 100]), {
    stiffness: 260,
    damping: 24,
  });
  const glowBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, ${glowColor}16 0%, transparent 68%)`;

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      posX.set((e.clientX - r.left) / r.width - 0.5);
      posY.set((e.clientY - r.top) / r.height - 0.5);
    },
    [posX, posY]
  );

  const onLeave = useCallback(() => {
    posX.set(0);
    posY.set(0);
  }, [posX, posY]);

  return (
    <motion.div
      ref={ref}
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 950 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className ?? ''}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: glowBg }}
      />
      {children}
    </motion.div>
  );
};

export const Mission: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const coGridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = coGridRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.mission-co-card',
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.1,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="mission"
      ref={sectionRef}
      className="relative overflow-hidden border-t border-white/5 bg-[#080B10] px-4 py-14 sm:py-24 md:px-8"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#36D9FF]/5 blur-[130px]" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#FF7A30]/5 blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-8 sm:mb-14 max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#36D9FF]/30 bg-[#36D9FF]/10 px-4 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#36D9FF]">
            <Target className="h-3.5 w-3.5 animate-pulse" />
            <span>Academic Vision & Mission</span>
          </div>

          <h2 className="font-display text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            OUR <span className="text-[#FF7A30]">MISSION</span>
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[#8B96A5] md:text-base">
            NIErnaya is conducted by the{' '}
            <span className="font-bold text-white">
              Department of Computer Science and Engineering (CSE)
            </span>{' '}
            at{' '}
            <span className="font-bold text-white">
              The National Institute of Engineering, Mysuru
            </span>
            . The Data Detective Challenge is designed to transform data into meaningful
            analysis, actionable insights, and domain-specific solutions.
          </p>
        </div>

        {/* Mission statement card with 3D tilt */}
        <COTiltCard
          glowColor="#FF7A30"
          className="mx-auto mb-12 max-w-5xl"
        >
          <div className="relative overflow-hidden rounded-3xl border border-[#FF7A30]/25 bg-[#0D1219]/90 p-7 shadow-2xl shadow-black/40 backdrop-blur-md md:p-10">
            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-[#36D9FF] via-[#FF7A30] to-transparent" />

            <div className="pl-4 md:pl-6">
              <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7A30]">
                NIErnaya • CSE DEPARTMENT
              </p>

              <h3 className="font-display text-2xl font-black leading-tight text-white md:text-4xl">
                From raw data to{' '}
                <span className="text-[#36D9FF] text-glow-cyan">real insight.</span>
              </h3>

              <p className="mt-5 max-w-4xl text-sm leading-7 text-[#AAB3C0] md:text-base">
                Our mission is to develop analytical thinking, strengthen
                practical data-handling capabilities, encourage evidence-based
                decision making, and enable students to design modern
                visualization and analytics solutions for real-world problems.
              </p>
            </div>
          </div>
        </COTiltCard>

        {/* CO heading */}
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-[#36D9FF]">
              COURSE OUTCOMES
            </p>

            <h3 className="mt-1 font-display text-2xl font-black text-white md:text-3xl">
              What participants develop
            </h3>
          </div>

          <span className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[9px] font-bold text-[#8B96A5] sm:block">
            CO1 — CO4
          </span>
        </div>

        {/* CO cards grid */}
        <div
          ref={coGridRef}
          className="grid grid-cols-1 gap-5 md:grid-cols-2"
        >
          {COURSE_OUTCOMES.map((outcome, idx) => {
            const Icon = outcome.icon;
            const accentColor = idx % 2 === 0 ? '#36D9FF' : '#FF7A30';

            return (
              <COTiltCard
                key={outcome.code}
                glowColor={accentColor}
                className="mission-co-card h-full"
              >
                <article className="group relative h-full overflow-hidden rounded-2xl border border-white/10 bg-[#0D1219]/90 p-6 backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-[#101722] hover:shadow-xl hover:shadow-black/50">
                  <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#36D9FF]/5 blur-3xl transition-all group-hover:bg-[#FF7A30]/10" />

                  <div className="relative flex gap-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#36D9FF]/20 bg-[#36D9FF]/10 text-[#36D9FF] transition-all duration-300 group-hover:scale-105 group-hover:border-[#FF7A30]/40 group-hover:bg-[#FF7A30]/15 group-hover:text-[#FF7A30] shadow-md">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black tracking-widest text-[#FF7A30]">
                          {outcome.code}
                        </span>

                        <span className="h-px w-8 bg-white/10" />

                        <span className="font-mono text-[9px] font-bold uppercase tracking-wider text-[#8B96A5]">
                          {outcome.title}
                        </span>
                      </div>

                      <p className="text-sm leading-7 text-[#C1C8D2]">
                        {outcome.text}
                      </p>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-[#36D9FF] to-[#FF7A30] transition-all duration-500 group-hover:w-full" />
                </article>
              </COTiltCard>
            );
          })}
        </div>

        {/* Institutional footer line */}
        <div className="mt-12 flex flex-col items-center justify-center gap-2 text-center">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-[#8B96A5]">
            THE NATIONAL INSTITUTE OF ENGINEERING • MYSURU
          </p>

          <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#36D9FF]">
            DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
          </p>
        </div>
      </div>
    </section>
  );
};

export default Mission;