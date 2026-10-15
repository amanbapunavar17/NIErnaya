import React from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  Trophy,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeroCanvas } from '../../../three/scenes/HeroCanvas';
import { SITE_CONFIG, PRIZES_DATA } from '../../../config/site';

export const Hero: React.FC = () => {
  const totalPrizePool = PRIZES_DATA.reduce(
    (total, prize) => total + prize.amount_num,
    0
  );

  return (
    <section
      id="hero"
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-4 pb-20 pt-12 md:px-8"
    >
      {/* 3D layer */}
      <HeroCanvas />

      {/* Background */}
      <div className="pointer-events-none absolute inset-0 bg-grid-cyber opacity-30" />

      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#36D9FF]/10 blur-[140px]" />

      <div className="pointer-events-none absolute bottom-10 right-10 h-[450px] w-[450px] rounded-full bg-[#FF7A30]/10 blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">

        {/* Institution and Department */}
<motion.div
  initial={{ y: -20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.6 }}
  className="mb-6 flex max-w-full flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-5"
>

{/* NIE Logo */}
<img
  src={SITE_CONFIG.branding.nieLogo}
  alt="NIE Logo"
  className="h-16 w-16 shrink-0 object-contain sm:h-20 sm:w-20"
 />

{/* Institution and Department */}
<div className="min-w-0 text-center sm:text-left">
  <p className="font-mono text-xs font-bold uppercase tracking-wider text-[#F5F7FA] sm:text-sm">
    THE NATIONAL INSTITUTE OF ENGINEERING
  </p>

  <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-wide text-[#36D9FF] sm:text-xs">
    Department of Computer Science and Engineering
  </p>
</div>

{/* CSE Logo */}
<img
  src={SITE_CONFIG.branding.cseLogo}
  alt="CSE Department Logo"
  className="h-16 w-16 shrink-0 object-contain sm:ml-2 sm:h-20 sm:w-20"
 />

</motion.div>

        {/* Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="max-w-4xl space-y-3"
        >
          

          <h1 className="font-display text-5xl font-black leading-none tracking-tight text-white sm:text-7xl md:text-8xl">
  NIErnaya
</h1>

          <div className="py-1 font-mono text-sm font-bold uppercase tracking-[0.25em] text-[#36D9FF] text-glow-cyan sm:text-base md:text-xl">
            {SITE_CONFIG.tagline}
          </div>
        </motion.div>

        {/* Pitch */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 max-w-2xl text-sm font-normal leading-relaxed text-[#8B96A5] sm:text-base"
        >
          A collegiate Data Analytics & Visualization challenge where
          problem formulation, data exploration, analytical reasoning, and
          visual storytelling come together.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-9 flex w-full flex-wrap items-center justify-center gap-4 sm:w-auto"
        >
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-[#FF7A30] bg-gradient-to-r from-[#FF7A30] to-[#FF9050] px-8 py-3.5 font-display text-sm font-black uppercase tracking-wider text-[#07090D] transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-[#FF7A30]/30 active:scale-95 sm:w-auto"
          >
            <span>REGISTER YOUR TEAM</span>
            <ArrowRight className="h-4 w-4" />
          </Link>

          <a
            href="#timeline"
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-white/10 bg-[#0D1219]/80 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-[#F5F7FA] backdrop-blur-md transition-all hover:scale-[1.02] hover:border-[#36D9FF]/60 hover:bg-[#121A23] sm:w-auto"
          >
            EXPLORE ROADMAP
          </a>
        </motion.div>

        {/* Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-14 grid w-full max-w-4xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-6"
        >
          <Highlight
            icon={<Calendar className="h-5 w-5" />}
            label="EVENT TIMELINE"
            value="21 Oct – 6 Nov"
            iconClass="text-[#36D9FF]"
          />

          <Highlight
            icon={<Users className="h-5 w-5" />}
            label="SQUAD FORMATION"
            value="2 – 3 Members"
            iconClass="text-[#FF7A30]"
          />

          <Highlight
            icon={<Trophy className="h-5 w-5" />}
            label="TOTAL PRIZE POOL"
            value={`₹${totalPrizePool.toLocaleString('en-IN')}`}
            iconClass="text-[#8B5CF6]"
          />

          <Highlight
            icon={<MapPin className="h-5 w-5" />}
            label="PHASE 3 FINALE"
            value="NIE North Campus"
            iconClass="text-[#36D9FF]"
          />
        </motion.div>
      </div>
    </section>
  );
};


interface HighlightProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  iconClass: string;
}

const Highlight: React.FC<HighlightProps> = ({
  icon,
  label,
  value,
  iconClass,
}) => {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#0D1219]/80 p-4 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className={`mb-1.5 ${iconClass}`}>
        {icon}
      </div>

      <span className="font-mono text-[10px] tracking-wider text-[#8B96A5]">
        {label}
      </span>

      <span className="font-display text-xs font-bold text-[#F5F7FA] sm:text-sm">
        {value}
      </span>
    </div>
  );
};