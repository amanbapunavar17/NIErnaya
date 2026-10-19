import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useMotionTemplate,
} from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  Trophy,
  ChevronDown,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroCanvas } from '../../../three/scenes/HeroCanvas';
import { SITE_CONFIG, PRIZES_DATA } from '../../../config/site';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/* ================================================================
   GLITCH & GLOW KEYFRAMES  — injected once via <style>
   ================================================================ */
const HERO_KEYFRAMES = `
  @keyframes heroGlitch1 {
    0%, 100% { transform: translate(0); }
    20%      { transform: translate(-2px, 2px); }
    40%      { transform: translate(-2px, -2px); }
    60%      { transform: translate(2px, 2px); }
    80%      { transform: translate(2px, -2px); }
  }
  @keyframes heroGlitch2 {
    0%, 100% { transform: translate(0); }
    20%      { transform: translate(2px, -2px); }
    40%      { transform: translate(2px, 2px); }
    60%      { transform: translate(-2px, -2px); }
    80%      { transform: translate(-2px, 2px); }
  }
  @keyframes heroBorderPulse {
    0%, 100% { opacity: 0.15; }
    50%      { opacity: 0.6; }
  }
  @keyframes heroShine {
    0%   { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(200%)  skewX(-15deg); }
  }
`;

/* ================================================================
   HOOK — Animated Number Counter
   ================================================================ */
function useAnimatedCounter(
  target: number,
  duration = 2000,
  startDelay = 900
) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const t0 = performance.now();

      const tick = (now: number) => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        setCount(Math.floor(eased * target));
        if (p < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    }, startDelay);

    return () => clearTimeout(timeout);
  }, [target, duration, startDelay]);

  return count;
}

/* ================================================================
   HOOK — Text Scramble  (cyber decode effect)
   ================================================================ */
function useTextScramble(text: string, delay = 1100) {
  const pool =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!<>-_\\/[]{}—=+*^?#';
  const [out, setOut] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => {
      let iter = 0;
      const max = text.length;

      const id = setInterval(() => {
        setOut(
          text
            .split('')
            .map((ch, i) => {
              if (i < iter) return ch;
              if (ch === ' ') return ' ';
              return pool[Math.floor(Math.random() * pool.length)];
            })
            .join('')
        );

        iter += 1 / 3;
        if (iter >= max) {
          setOut(text);
          clearInterval(id);
        }
      }, 30);

      return () => clearInterval(id);
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, delay]);

  return out;
}

/* ================================================================
   COMPONENT — Floating Particles
   ================================================================ */
const FloatingParticles: React.FC = () => {
  const dots = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 1,
        dur: Math.random() * 18 + 12,
        delay: Math.random() * 6,
        alpha: Math.random() * 0.35 + 0.08,
        color:
          i % 3 === 0
            ? '#36D9FF'
            : i % 3 === 1
              ? '#8B5CF6'
              : '#FF7A30',
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {dots.map((d) => (
        <motion.div
          key={d.id}
          className="absolute rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            backgroundColor: d.color,
            opacity: d.alpha,
            boxShadow: `0 0 ${d.size * 5}px ${d.color}`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 24 - 12, 0],
            opacity: [d.alpha, d.alpha * 2, d.alpha],
          }}
          transition={{
            duration: d.dur,
            delay: d.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

/* ================================================================
   COMPONENT — Horizontal Scan Line
   ================================================================ */
const ScanLine: React.FC = () => (
  <motion.div
    className="pointer-events-none absolute left-0 right-0 z-20 h-px"
    style={{
      background:
        'linear-gradient(90deg, transparent 0%, rgba(54,217,255,0.12) 15%, rgba(54,217,255,0.28) 50%, rgba(54,217,255,0.12) 85%, transparent 100%)',
    }}
    animate={{ top: ['0%', '100%'] }}
    transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
  />
);

/* ================================================================
   COMPONENT — Magnetic Wrapper  (desktop-only cursor attraction)
   ================================================================ */
const MagneticWrap: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 160, damping: 18 });
  const sy = useSpring(my, { stiffness: 160, damping: 18 });

  const move = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      mx.set((e.clientX - (r.left + r.width / 2)) * 0.12);
      my.set((e.clientY - (r.top + r.height / 2)) * 0.12);
    },
    [mx, my]
  );
  const leave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  return (
    <motion.div
      ref={ref}
      style={{ x: sx, y: sy }}
      onMouseMove={move}
      onMouseLeave={leave}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/* ================================================================
   COMPONENT — 3-D Perspective Tilt Card
   ================================================================ */
const TiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className, glowColor = '#36D9FF' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0);
  const posY = useMotionValue(0);

  const rX = useSpring(
    useTransform(posY, [-0.5, 0.5], [10, -10]),
    { stiffness: 280, damping: 25 }
  );
  const rY = useSpring(
    useTransform(posX, [-0.5, 0.5], [-10, 10]),
    { stiffness: 280, damping: 25 }
  );

  const gx = useSpring(
    useTransform(posX, [-0.5, 0.5], [0, 100]),
    { stiffness: 280, damping: 25 }
  );
  const gy = useSpring(
    useTransform(posY, [-0.5, 0.5], [0, 100]),
    { stiffness: 280, damping: 25 }
  );
  const glowBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, ${glowColor}18 0%, transparent 65%)`;

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
      className={className}
    >
      {/* cursor-following inner glow */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{ background: glowBg }}
      />
      {children}
    </motion.div>
  );
};

/* ================================================================
   COMPONENT — Glitch Title Text
   ================================================================ */
const GlitchText: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className }) => (
  <span className={`relative inline-block ${className ?? ''}`}>
    <span className="relative z-10">{text}</span>
    <span
      className="absolute left-0 top-0 -z-10 opacity-60"
      style={{
        color: '#36D9FF',
        animation: 'heroGlitch1 3s infinite',
        clipPath: 'inset(38% 0 58% 0)',
      }}
      aria-hidden
    >
      {text}
    </span>
    <span
      className="absolute left-0 top-0 -z-10 opacity-60"
      style={{
        color: '#FF7A30',
        animation: 'heroGlitch2 3s infinite',
        clipPath: 'inset(62% 0 10% 0)',
      }}
      aria-hidden
    >
      {text}
    </span>
  </span>
);

/* ================================================================
   COMPONENT — Split-Word Reveal  (each word slides up)
   ================================================================ */
const SplitReveal: React.FC<{
  text: string;
  className?: string;
  delay?: number;
}> = ({ text, className, delay = 0 }) => (
  <span className={className}>
    {text.split(' ').map((word, i) => (
      <span key={i} className="inline-block overflow-hidden">
        <motion.span
          className="inline-block"
          initial={{ y: '110%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          transition={{
            duration: 0.55,
            delay: delay + i * 0.07,
            ease: [0.33, 1, 0.68, 1],
          }}
        >
          {word}
          {i < text.split(' ').length - 1 ? '\u00A0' : ''}
        </motion.span>
      </span>
    ))}
  </span>
);

/* ================================================================
   COMPONENT — Scroll-Down Indicator
   ================================================================ */
const ScrollCue: React.FC = () => (
  <motion.div
    className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-1.5 sm:bottom-7"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 2.4, duration: 0.8 }}
  >
    <motion.span
      className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#8B96A5] sm:text-[10px]"
      animate={{ opacity: [0.25, 0.75, 0.25] }}
      transition={{ duration: 2.4, repeat: Infinity }}
    >
      Scroll to explore
    </motion.span>
    <motion.div
      animate={{ y: [0, 7, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <ChevronDown className="h-4 w-4 text-[#36D9FF]/50" />
    </motion.div>
  </motion.div>
);

/* ================================================================
   ★  HERO  —  Main Export
   ================================================================ */
export const Hero: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);

  const totalPrizePool = PRIZES_DATA.reduce(
    (total, prize) => total + prize.amount_num,
    0
  );

  // Animated counter for prize pool (counts up from 0)
  const animatedPrize = useAnimatedCounter(totalPrizePool, 2200, 1000);

  // Cyber-decode effect for the tagline
  const scrambledTagline = useTextScramble(SITE_CONFIG.tagline, 1200);

  /* ── scroll-driven parallax values ── */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Background layer moves slower → depth illusion
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  // Content fades / shrinks / lifts as user scrolls away
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const contentAlpha = useTransform(
    scrollYProgress,
    [0, 0.35, 0.75],
    [1, 0.85, 0]
  );
  const contentScale = useTransform(scrollYProgress, [0, 0.6], [1, 0.96]);
  // Orbs expand & vanish
  const orbScale = useTransform(scrollYProgress, [0, 1], [1, 1.35]);
  const orbAlpha = useTransform(scrollYProgress, [0, 0.55], [1, 0]);
  // Highlight cards have their own, slightly lagged parallax
  const cardsY = useTransform(scrollYProgress, [0, 1], ['0%', '35%']);

  // buttery-smooth spring wrappers
  const sBgY = useSpring(bgY, { stiffness: 90, damping: 30 });
  const sContentY = useSpring(contentY, { stiffness: 90, damping: 30 });
  const sContentA = useSpring(contentAlpha, { stiffness: 90, damping: 30 });
  const sContentS = useSpring(contentScale, { stiffness: 90, damping: 30 });

  /* ── GSAP: staggered card entrance triggered on scroll ── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.hero-highlight-card',
        { y: 70, opacity: 0, scale: 0.88, rotateX: 12 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateX: 0,
          stagger: 0.13,
          duration: 0.9,
          ease: 'back.out(1.7)',
          scrollTrigger: {
            trigger: '.hero-highlights-grid',
            start: 'top 88%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  /* ── render ── */
  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-4 pb-12 pt-8 sm:pb-16 sm:pt-12 md:px-8"
    >
      {/* Keyframes (injected once) */}
      <style>{HERO_KEYFRAMES}</style>

      {/* ───── Layer 0: 3D Background (parallax) ───── */}
      <motion.div className="absolute inset-0" style={{ y: sBgY }}>
        <HeroCanvas />
      </motion.div>

      {/* ───── Layer 1: Ambient FX ───── */}
      <FloatingParticles />
      <ScanLine />

      {/* Background Grid (parallax) */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-grid-cyber opacity-30"
        style={{ y: sBgY }}
      />

      {/* Ambient glow orbs — scale + fade on scroll, gentle drift */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/4 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#36D9FF]/10 blur-[120px] sm:h-[600px] sm:w-[600px] sm:blur-[140px]"
        style={{ scale: orbScale, opacity: orbAlpha }}
        animate={{ x: [0, 12, 0, -12, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="pointer-events-none absolute bottom-10 right-0 h-[300px] w-[300px] rounded-full bg-[#FF7A30]/10 blur-[100px] sm:right-10 sm:h-[450px] sm:w-[450px] sm:blur-[120px]"
        style={{ scale: orbScale, opacity: orbAlpha }}
        animate={{
          x: [0, 18, 0, -18, 0],
          y: [0, -14, 0, 14, 0],
        }}
        transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* NEW violet orb for extra depth */}
      <motion.div
        className="pointer-events-none absolute bottom-1/4 left-10 h-[220px] w-[220px] rounded-full bg-[#8B5CF6]/[0.07] blur-[100px] sm:h-[320px] sm:w-[320px]"
        style={{ scale: orbScale, opacity: orbAlpha }}
        animate={{
          x: [0, -22, 0, 22, 0],
          y: [0, 16, 0, -16, 0],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* ───── Layer 2: Content (scroll parallax + fade) ───── */}
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center"
        style={{
          y: sContentY,
          opacity: sContentA,
          scale: sContentS,
        }}
      >
        {/* ── Institution Branding ── */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-5 flex w-full max-w-3xl items-center justify-center gap-2 sm:mb-7 sm:gap-5"
        >
          {/* NIE Logo — spring-in + glow */}
          <motion.img
            src={SITE_CONFIG.branding.nieLogo}
            alt="NIE Logo"
            className="h-11 w-11 shrink-0 object-contain sm:h-16 sm:w-16 lg:h-20 lg:w-20"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 180,
              damping: 14,
              delay: 0.15,
            }}
            whileHover={{ scale: 1.12, rotate: 6 }}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(54,217,255,0.35))',
            }}
          />

          {/* Institution and Department */}
          <div className="min-w-0 flex-1 text-center">
            <p className="font-mono text-[9px] font-bold uppercase leading-relaxed tracking-wide text-[#F5F7FA] min-[380px]:text-[10px] sm:text-sm sm:tracking-wider">
              <SplitReveal
                text="THE NATIONAL INSTITUTE OF ENGINEERING"
                delay={0.25}
              />
            </p>

            <p className="mt-1 font-mono text-[8px] font-bold uppercase leading-relaxed tracking-wide text-[#36D9FF] min-[380px]:text-[9px] sm:text-xs">
              <SplitReveal
                text="Department of Computer Science and Engineering"
                delay={0.45}
              />
            </p>
          </div>

          {/* CSE Logo — spring-in + glow */}
          <motion.img
            src={SITE_CONFIG.branding.cseLogo}
            alt="CSE Department Logo"
            className="h-10 w-10 shrink-0 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16"
            initial={{ scale: 0, rotate: 180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 180,
              damping: 14,
              delay: 0.25,
            }}
            whileHover={{ scale: 1.12, rotate: -6 }}
            style={{
              filter: 'drop-shadow(0 0 10px rgba(255,122,48,0.35))',
            }}
          />
        </motion.div>

        {/* ── Event Title — Glitch FX ── */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-4xl space-y-2 sm:space-y-3"
        >
          <h1 className="font-display text-5xl font-black leading-none tracking-tight text-white sm:text-7xl md:text-8xl">
            <GlitchText text="NIErnaya" />
          </h1>

          <div className="py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#36D9FF] text-glow-cyan sm:text-base sm:tracking-[0.25em] md:text-xl">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
            >
              {scrambledTagline}
            </motion.span>
          </div>
        </motion.div>

        {/* ── Event Description ── */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mt-5 max-w-2xl px-1 text-center text-sm font-normal leading-7 text-[#B8C4D6] sm:mt-6 sm:px-0 sm:text-base md:text-lg"
        >
          
        </motion.p>

        {/* ── Call to Action — Magnetic + Shine ── */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4"
        >
          <MagneticWrap className="w-full sm:w-auto">
            <Link
              to="/login"
              className="group relative flex min-h-14 w-full items-center justify-center gap-2.5 overflow-hidden rounded-full border border-[#FF7A30] bg-gradient-to-r from-[#FF7A30] to-[#FF9050] px-6 py-3.5 font-display text-sm font-black uppercase tracking-wider text-[#07090D] transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-[#FF7A30]/30 active:scale-95 sm:w-auto sm:px-8"
            >
              {/* shine sweep */}
              <span
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)',
                  animation: 'heroShine 1.4s ease-in-out infinite',
                }}
              />
              <span className="relative">REGISTER YOUR TEAM</span>
              <ArrowRight className="relative h-4 w-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </MagneticWrap>

          <MagneticWrap className="w-full sm:w-auto">
            <a
              href="#timeline"
              className="group relative flex min-h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-full border-2 border-white/10 bg-[#0D1219]/90 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-[#F5F7FA] backdrop-blur-md transition-all hover:scale-[1.02] hover:border-[#36D9FF]/60 hover:bg-[#121A23] sm:w-auto"
            >
              {/* shimmer overlay */}
              <span
                className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(54,217,255,0.08), transparent)',
                }}
              />
              <span className="relative">EXPLORE ROADMAP</span>
            </a>
          </MagneticWrap>
        </motion.div>

        {/* ── Event Highlights — 3-D tilt + GSAP stagger ── */}
        <motion.div
          style={{ y: cardsY }}
          className="hero-highlights-grid mt-9 grid w-full max-w-4xl grid-cols-2 gap-3 sm:mt-12 sm:gap-4 md:mt-14 md:grid-cols-4 md:gap-6"
        >
          <Highlight
            icon={<Calendar className="h-5 w-5" />}
            label="EVENT TIMELINE"
            value="October – November"
            iconClass="text-[#36D9FF]"
            glowColor="#36D9FF"
            idx={0}
          />

          <Highlight
            icon={<Users className="h-5 w-5" />}
            label="SQUAD FORMATION"
            value="2 – 3 Members"
            iconClass="text-[#FF7A30]"
            glowColor="#FF7A30"
            idx={1}
          />

          <Highlight
            icon={<Trophy className="h-5 w-5" />}
            label="TOTAL PRIZE POOL"
            value={`₹${animatedPrize.toLocaleString('en-IN')}`}
            iconClass="text-[#8B5CF6]"
            glowColor="#8B5CF6"
            idx={2}
          />

          <Highlight
            icon={<MapPin className="h-5 w-5" />}
            label="PHASE 3 FINALE"
            value="NIE North Campus"
            iconClass="text-[#36D9FF]"
            glowColor="#36D9FF"
            idx={3}
          />
        </motion.div>
      </motion.div>

      {/* ───── Layer 3: Scroll Cue ───── */}
      <ScrollCue />
    </section>
  );
};

/* ================================================================
   COMPONENT — Highlight Card (3-D tilt + animated glow border)
   ================================================================ */
interface HighlightProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconClass: string;
  glowColor?: string;
  idx?: number;
}

const Highlight: React.FC<HighlightProps> = ({
  icon,
  label,
  value,
  iconClass,
  glowColor = '#36D9FF',
  idx = 0,
}) => {
  return (
    <TiltCard
      glowColor={glowColor}
      className="hero-highlight-card relative flex min-w-0 cursor-default flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0D1219]/90 p-3 shadow-lg backdrop-blur-md transition-colors duration-300 hover:border-white/20 sm:p-4"
    >
      {/* pulsing border glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow: `inset 0 0 24px ${glowColor}0D, 0 0 18px ${glowColor}08`,
          animation: 'heroBorderPulse 3.5s ease-in-out infinite',
          animationDelay: `${idx * 0.6}s`,
        }}
      />

      <motion.div
        className={`relative mb-1.5 ${iconClass}`}
        animate={{ rotateY: [0, 360] }}
        transition={{
          duration: 5,
          delay: 2 + idx * 1.2,
          repeat: Infinity,
          repeatDelay: 10,
          ease: 'easeInOut',
        }}
      >
        {icon}
      </motion.div>

      <span className="relative text-center font-mono text-[9px] tracking-wide text-[#8B96A5] sm:text-[10px] sm:tracking-wider">
        {label}
      </span>

      <span className="relative mt-1 text-center font-display text-xs font-bold leading-relaxed text-[#F5F7FA] sm:text-sm">
        {value}
      </span>
    </TiltCard>
  );
};
