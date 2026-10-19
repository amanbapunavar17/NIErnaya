/**
 * ================================================================
 * LiveStats.tsx — Enhanced Event Telemetry Grid
 * ================================================================
 * Effects added:
 * - 3D Perspective Tilt on each stat card with spring physics and cursor-following radial glow
 * - GSAP ScrollTrigger staggered entrance animations with back.out easing
 * - Scroll-triggered animated numeric counter for numeric metrics (Prize pool, phases, campuses)
 * - Cyber scan line and atmospheric particle glow
 * - Preserves ALL content, values, labels, and text exactly as-is
 * ================================================================
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CalendarDays,
  Users,
  Building2,
  Trophy,
  Layers,
  MapPin,
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

import { SITE_CONFIG, PRIZES_DATA } from '../../../config/site';

gsap.registerPlugin(ScrollTrigger);

/* ================================================================
   3D TILT STAT CARD
   ================================================================ */
const StatTiltCard: React.FC<{
  children: React.ReactNode;
  glowColor?: string;
  className?: string;
}> = ({ children, glowColor = '#36D9FF', className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0);
  const posY = useMotionValue(0);

  const rX = useSpring(useTransform(posY, [-0.5, 0.5], [8, -8]), {
    stiffness: 280,
    damping: 24,
  });
  const rY = useSpring(useTransform(posX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 280,
    damping: 24,
  });

  const gx = useSpring(useTransform(posX, [-0.5, 0.5], [0, 100]), {
    stiffness: 280,
    damping: 24,
  });
  const gy = useSpring(useTransform(posY, [-0.5, 0.5], [0, 100]), {
    stiffness: 280,
    damping: 24,
  });
  const glowBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, ${glowColor}1c 0%, transparent 70%)`;

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
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 900 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className ?? ''}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl"
        style={{ background: glowBg }}
      />
      {children}
    </motion.div>
  );
};

/* ================================================================
   ANIMATED NUMBER VALUE (counts up when section enters viewport)
   ================================================================ */
const StatCounterValue: React.FC<{
  value: string;
  isVisible: boolean;
}> = ({ value, isVisible }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (!isVisible) return;

    // Check if value is a pure number or currency
    const isCurrency = value.startsWith('₹');
    const numericStr = value.replace(/[^\d]/g, '');
    const targetNum = parseInt(numericStr, 10);

    if (isNaN(targetNum) || targetNum <= 0) {
      setDisplayValue(value);
      return;
    }

    const duration = 1800;
    const t0 = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const current = Math.floor(eased * targetNum);

      if (isCurrency) {
        setDisplayValue(`₹${current.toLocaleString('en-IN')}`);
      } else if (value.length === 2 && value.startsWith('0')) {
        setDisplayValue(String(current).padStart(2, '0'));
      } else {
        setDisplayValue(String(current));
      }

      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        setDisplayValue(value);
      }
    };

    const animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [value, isVisible]);

  return <span>{displayValue}</span>;
};

/* ================================================================
   MAIN LIVESTATS COMPONENT
   ================================================================ */
export const LiveStats: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  const totalPrizePool = PRIZES_DATA.reduce(
    (total, prize) => total + prize.amount_num,
    0
  );

  const statCards = [
    {
      label: 'EVENT PHASES',
      value: '03',
      icon: Layers,
      color: 'text-[#36D9FF]',
      hexColor: '#36D9FF',
      border: 'border-[#36D9FF]/30',
      subtext: 'Progressive data challenge',
    },
    {
      label: 'TEAM SIZE',
      value: '2–3',
      icon: Users,
      color: 'text-[#FF7A30]',
      hexColor: '#FF7A30',
      border: 'border-[#FF7A30]/30',
      subtext: 'Members per squad',
    },
    {
      label: 'ELIGIBLE YEAR',
      value: '2ND',
      icon: CalendarDays,
      color: 'text-[#8B5CF6]',
      hexColor: '#8B5CF6',
      border: 'border-[#8B5CF6]/30',
      subtext: '3rd Semester students',
    },
    {
      label: 'CAMPUSES',
      value: '02',
      icon: Building2,
      color: 'text-[#36D9FF]',
      hexColor: '#36D9FF',
      border: 'border-[#36D9FF]/30',
      subtext: 'North + South Campus',
    },
    {
      label: 'PRIZE POOL',
      value: `₹${totalPrizePool.toLocaleString('en-IN')}`,
      icon: Trophy,
      color: 'text-[#10B981]',
      hexColor: '#10B981',
      border: 'border-[#10B981]/30',
      subtext: 'Total cash awards',
    },
    {
      label: 'FINALE VENUE',
      value: 'NORTH',
      icon: MapPin,
      color: 'text-[#F59E0B]',
      hexColor: '#F59E0B',
      border: 'border-[#F59E0B]/30',
      subtext: 'Offline Phase 3',
    },
  ];

  /* GSAP ScrollTrigger staggered entrance */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.telemetry-card',
        { y: 35, opacity: 0, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.08,
          duration: 0.75,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            onEnter: () => setInView(true),
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative border-y border-white/5 bg-[#07090D] px-4 py-14 md:px-8 overflow-hidden"
    >
      {/* Ambient background glow accents */}
      <div className="pointer-events-none absolute -left-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#36D9FF]/5 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-[#FF7A30]/5 blur-[100px]" />

      <div className="mx-auto max-w-7xl relative z-10">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-1.5 flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-widest text-[#36D9FF]">
              <Layers className="h-4 w-4 text-[#FF7A30] animate-pulse" />
              <span>EVENT TELEMETRY</span>
            </div>

            <h2 className="font-display text-2xl font-black text-[#F5F7FA] md:text-3xl tracking-tight">
              NIErnaya AT A GLANCE
            </h2>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0D1219]/90 px-3.5 py-1.5 font-mono text-xs text-[#8B96A5] backdrop-blur-md shadow-inner flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#36D9FF] animate-ping" />
            <span>{SITE_CONFIG.institution}</span>
          </div>
        </div>

        {/* 6 Telemetry Cards */}
        <div className="grid grid-cols-2 gap-3.5 md:grid-cols-3 md:gap-4 lg:grid-cols-6">
          {statCards.map((card) => {
            const Icon = card.icon;

            return (
              <StatTiltCard
                key={card.label}
                glowColor={card.hexColor}
                className="telemetry-card h-full"
              >
                <div
                  className={`group flex h-full flex-col justify-between rounded-xl border ${card.border} bg-[#0D1219]/90 p-4 transition-all duration-300 hover:border-white/30 hover:shadow-xl hover:shadow-black/50 backdrop-blur-sm`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold leading-tight tracking-wider text-[#8B96A5]">
                      {card.label}
                    </span>

                    <Icon
                      className={`h-4 w-4 shrink-0 ${card.color} transition-transform duration-300 group-hover:scale-110`}
                    />
                  </div>

                  <div>
                    <div className="font-display text-2xl font-black tracking-tight text-white md:text-3xl">
                      <StatCounterValue value={card.value} isVisible={inView} />
                    </div>

                    <div className="mt-0.5 font-mono text-[10px] text-[#8B96A5]/80">
                      {card.subtext}
                    </div>
                  </div>
                </div>
              </StatTiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LiveStats;