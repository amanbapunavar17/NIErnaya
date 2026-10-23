/**
 * ================================================================
 * Prizes.tsx — Enhanced 3D Metallic Trophy Podium & Prize Honors
 * ================================================================
 * Effects added:
 * - 3D Perspective Tilt on Trophy cards with metallic reflections and radial light tracking
 * - Metallic gradient styling: Gold/Amber for Champions, Silver/Slate for 1st Runner Up, Bronze/Copper for 2nd Runner Up
 * - Animated Counter counting from 0 to total prize pool (₹10,000) and individual prize cards on viewport entry
 * - Spotlight illumination cone on Champions trophy with pulsing celebration sparkles
 * - GSAP ScrollTrigger staggered reveal
 * - Preserves all imports, assets, labels, texts, and PRIZES_DATA values
 * ================================================================
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Trophy, Award, Crown } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { PRIZES_DATA } from '../../../config/site';

import championTrophy from '../../../assets/prizes/champion-trophy.png';
import firstRunnerUpTrophy from '../../../assets/prizes/first-runner-up-trophy.png';
import secondRunnerUpTrophy from '../../../assets/prizes/second-runner-up-trophy.png';

gsap.registerPlugin(ScrollTrigger);

const TROPHY_IMAGES = [
  championTrophy,
  firstRunnerUpTrophy,
  secondRunnerUpTrophy,
];

const PRIZE_LABELS = [
  'CHAMPIONS',
  '1ST RUNNER UP',
  '2ND RUNNER UP',
];

const METALLIC_THEMES = [
  {
    name: 'gold',
    glowColor: '#F59E0B',
    border: 'border-[#F59E0B]/50 hover:border-[#F59E0B]',
    gradient: 'from-[#F59E0B]/15 via-[#F59E0B]/5 to-transparent',
    textGlow: 'text-glow-gold text-[#F59E0B]',
    tagBg: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/40',
    platform: 'bg-[#F59E0B]/35',
    line: 'via-[#F59E0B]',
    icon: Crown,
  },
  {
    name: 'silver',
    glowColor: '#CBD5E1',
    border: 'border-slate-400/40 hover:border-slate-300',
    gradient: 'from-slate-400/15 via-slate-400/5 to-transparent',
    textGlow: 'text-glow-silver text-slate-200',
    tagBg: 'bg-slate-400/15 text-slate-200 border-slate-400/40',
    platform: 'bg-slate-300/30',
    line: 'via-slate-300',
    icon: Trophy,
  },
  {
    name: 'bronze',
    glowColor: '#d9770670',
    border: 'border-amber-700/40 hover:border-amber-600',
    gradient: 'from-amber-700/15 via-amber-700/5 to-transparent',
    textGlow: 'text-glow-bronze text-[#F59E0B]',
    tagBg: 'bg-amber-700/15 text-amber-400 border-amber-700/40',
    platform: 'bg-amber-600/30',
    line: 'via-amber-500',
    icon: Award,
  },
];

const getPrizeAmount = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

/* 3D Tilt Trophy Card Component */
const TrophyTiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className, glowColor = '#F59E0B' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0);
  const posY = useMotionValue(0);

  const rX = useSpring(useTransform(posY, [-0.5, 0.5], [10, -10]), {
    stiffness: 260,
    damping: 24,
  });
  const rY = useSpring(useTransform(posX, [-0.5, 0.5], [-10, 10]), {
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
  const glowBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, ${glowColor}25 0%, transparent 68%)`;

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
      style={{ rotateX: rX, rotateY: rY, transformPerspective: 1000 }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`relative ${className ?? ''}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-3xl"
        style={{ background: glowBg }}
      />
      {children}
    </motion.div>
  );
};

/* Animated Cash Counter */
const AnimatedPrizeValue: React.FC<{
  target: number;
  isVisible: boolean;
}> = ({ target, isVisible }) => {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const t0 = performance.now();

    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };

    const animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [target, isVisible]);

  return <span>₹{val.toLocaleString('en-IN')}</span>;
};

export const Prizes: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const podiumRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const prizes = PRIZES_DATA.slice(0, 3);

  /* GSAP entrance */
  useEffect(() => {
    const el = podiumRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.trophy-podium-card',
        { y: 60, opacity: 0, scale: 0.92 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.15,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 80%',
            onEnter: () => setInView(true),
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="prizes"
      ref={sectionRef}
      className="relative overflow-hidden py-14 sm:py-24 md:py-32 bg-[#07090D]"
    >
      {/* Background Ambient Glows & Grid */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-20 h-[500px] w-[850px] -translate-x-1/2 rounded-full bg-orange-500/[0.05] blur-[140px]" />
        <div className="absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-cyan-500/[0.035] blur-[120px]" />
        <div className="absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-orange-500/[0.035] blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 z-10">
        {/* Heading */}
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/[0.08] px-5 py-2 text-xs font-semibold tracking-[0.16em] text-orange-400 shadow-sm shadow-orange-500/20"
          >
            <Sparkles size={14} className="animate-spin-slow" />
            <span>PRIZES &amp; REWARDS</span>
          </motion.div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            WIN.
            <span className="mx-2 text-orange-500 text-glow-orange">
              EARN.
            </span>
            GET RECOGNIZED.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
            Showcase your analytical thinking, turn data into
            meaningful insights, and earn recognition at
            NIErnaya.
          </p>
        </div>

        {/* Total Prize Pool Spotlight */}
        <div className="mx-auto mt-12 max-w-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-orange-500/35 bg-[#0D1219]/90 px-8 py-6 text-center backdrop-blur-xl shadow-2xl shadow-orange-500/15"
          >
            <div className="pointer-events-none absolute inset-x-10 -bottom-10 h-24 rounded-full bg-orange-500/25 blur-3xl animate-pulse" />

            <p className="relative text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
              Total Prize Pool
            </p>

            <p className="relative mt-2 text-4xl font-black text-orange-400 md:text-5xl text-glow-orange">
              <AnimatedPrizeValue target={10000} isVisible={inView} />
            </p>
          </motion.div>
        </div>

        {/* THREE TROPHIES PODIUM */}
        <div
          ref={podiumRef}
          className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-6 lg:gap-10 items-end"
        >
          {prizes.map((prize, index) => {
            const amount = getPrizeAmount(prize.amount);
            const trophyImage = TROPHY_IMAGES[index];
            const label = PRIZE_LABELS[index];
            const theme = METALLIC_THEMES[index];
            const isChampion = index === 0;

            return (
              <TrophyTiltCard
                key={index}
                glowColor={theme.glowColor}
                className="trophy-podium-card h-full"
              >
                <article
                  className={`group relative flex h-full flex-col items-center text-center rounded-3xl border ${theme.border} bg-gradient-to-b ${theme.gradient} bg-[#0D1219]/90 p-6 sm:p-8 backdrop-blur-md transition-all duration-500 hover:shadow-2xl hover:shadow-black/70 ${
                    isChampion ? 'md:-translate-y-4' : ''
                  }`}
                >
                  {/* Spotlight on Champion */}
                  {isChampion && (
                    <div className="pointer-events-none absolute -top-16 left-1/2 h-32 w-48 -translate-x-1/2 bg-gradient-to-b from-[#F59E0B]/30 to-transparent blur-xl" />
                  )}

                  {/* Position Badge */}
                  <div
                    className={`mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[9px] font-black uppercase tracking-wider ${theme.tagBg}`}
                  >
                    <theme.icon className="h-3 w-3" />
                    <span>{label}</span>
                  </div>

                  {/* Trophy Area */}
                  <div className="relative flex h-[280px] w-full items-end justify-center">
                    {/* Trophy Glow */}
                    <div
                      className="pointer-events-none absolute bottom-8 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full blur-[70px] transition-all duration-700 opacity-60 group-hover:opacity-100"
                      style={{ backgroundColor: `${theme.glowColor}30` }}
                    />

                    {/* Platform Glow */}
                    <div
                      className={`pointer-events-none absolute bottom-7 left-1/2 h-3 w-44 -translate-x-1/2 rounded-full blur-md transition-all duration-500 group-hover:w-56 ${theme.platform}`}
                    />

                    {/* Platform Line */}
                    <div
                      className={`pointer-events-none absolute bottom-6 left-1/2 h-px w-48 -translate-x-1/2 bg-gradient-to-r from-transparent ${theme.line} to-transparent transition-all duration-500 group-hover:w-60`}
                    />

                    {/* Actual Trophy Image */}
                    <img
                      src={trophyImage}
                      alt={`${label} trophy`}
                      className="relative z-10 h-[240px] w-auto max-w-[260px] object-contain drop-shadow-[0_0_30px_rgba(255,140,40,0.22)] transition-all duration-700 ease-out group-hover:-translate-y-4 group-hover:scale-105 group-hover:drop-shadow-[0_0_48px_rgba(255,140,40,0.45)]"
                    />
                  </div>

                  {/* Prize Name */}
                  <h3 className="mt-4 text-xl font-black tracking-[0.08em] text-white md:text-2xl">
                    {label}
                  </h3>

                  {/* Prize Amount */}
                  <p
                    className={`mt-3 text-4xl font-black tracking-tight md:text-5xl ${theme.textGlow}`}
                  >
                    <AnimatedPrizeValue target={amount} isVisible={inView} />
                  </p>

                  {/* Accent Line */}
                  <div className="mx-auto mt-5 h-[2px] w-16 bg-gradient-to-r from-transparent via-orange-400 to-transparent transition-all duration-500 group-hover:w-28" />
                </article>
              </TrophyTiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Prizes;