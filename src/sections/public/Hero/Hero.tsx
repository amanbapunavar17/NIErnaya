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
      className="relative flex min-h-[92vh] items-center justify-center overflow-hidden px-4 pb-12 pt-8 sm:pb-16 sm:pt-12 md:px-8"
    >
      {/* 3D Background */}
      <HeroCanvas />

      {/* Background Grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid-cyber opacity-30" />

      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#36D9FF]/10 blur-[120px] sm:h-[600px] sm:w-[600px] sm:blur-[140px]" />

      <div className="pointer-events-none absolute bottom-10 right-0 h-[300px] w-[300px] rounded-full bg-[#FF7A30]/10 blur-[100px] sm:right-10 sm:h-[450px] sm:w-[450px] sm:blur-[120px]" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">

        {/* Institution Branding */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-5 flex w-full max-w-3xl items-center justify-center gap-2 sm:mb-7 sm:gap-5"
        >
          {/* NIE Logo */}
          <img
            src={SITE_CONFIG.branding.nieLogo}
            alt="NIE Logo"
            className="h-11 w-11 shrink-0 object-contain sm:h-16 sm:w-16 lg:h-20 lg:w-20"
          />

          {/* Institution and Department */}
          <div className="min-w-0 flex-1 text-center">
            <p className="font-mono text-[9px] font-bold uppercase leading-relaxed tracking-wide text-[#F5F7FA] min-[380px]:text-[10px] sm:text-sm sm:tracking-wider">
              THE NATIONAL INSTITUTE OF ENGINEERING
            </p>

            <p className="mt-1 font-mono text-[8px] font-bold uppercase leading-relaxed tracking-wide text-[#36D9FF] min-[380px]:text-[9px] sm:text-xs">
              Department of Computer Science and Engineering
            </p>
          </div>

          {/* CSE Logo */}
          <img
            src={SITE_CONFIG.branding.cseLogo}
            alt="CSE Department Logo"
            className="h-10 w-10 shrink-0 object-contain sm:h-14 sm:w-14 lg:h-16 lg:w-16"
          />
        </motion.div>

        {/* Event Title */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-4xl space-y-2 sm:space-y-3"
        >
          <h1 className="font-display text-5xl font-black leading-none tracking-tight text-white sm:text-7xl md:text-8xl">
            NIErnaya
          </h1>

          <div className="py-1 font-mono text-xs font-bold uppercase tracking-[0.2em] text-[#36D9FF] text-glow-cyan sm:text-base sm:tracking-[0.25em] md:text-xl">
            {SITE_CONFIG.tagline}
          </div>
        </motion.div>

        {/* Event Description */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mx-auto mt-5 max-w-2xl px-1 text-center text-sm font-normal leading-7 text-[#B8C4D6] sm:mt-6 sm:px-0 sm:text-base md:text-lg"
        >
          
        </motion.p>

        {/* Call to Action */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-7 flex w-full flex-col items-center justify-center gap-3 sm:mt-9 sm:w-auto sm:flex-row sm:flex-wrap sm:gap-4"
        >
          <Link
            to="/login"
            className="flex min-h-14 w-full items-center justify-center gap-2.5 rounded-full border border-[#FF7A30] bg-gradient-to-r from-[#FF7A30] to-[#FF9050] px-6 py-3.5 font-display text-sm font-black uppercase tracking-wider text-[#07090D] transition-all hover:scale-[1.03] hover:shadow-xl hover:shadow-[#FF7A30]/30 active:scale-95 sm:w-auto sm:px-8"
          >
            <span>REGISTER YOUR TEAM</span>
            <ArrowRight className="h-4 w-4 shrink-0" />
          </Link>

          <a
            href="#timeline"
            className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-white/10 bg-[#0D1219]/90 px-7 py-3.5 font-display text-sm font-bold uppercase tracking-wider text-[#F5F7FA] backdrop-blur-md transition-all hover:scale-[1.02] hover:border-[#36D9FF]/60 hover:bg-[#121A23] sm:w-auto"
          >
            EXPLORE ROADMAP
          </a>
        </motion.div>

        {/* Event Highlights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-9 grid w-full max-w-4xl grid-cols-2 gap-3 sm:mt-12 sm:gap-4 md:mt-14 md:grid-cols-4 md:gap-6"
        >
          <Highlight
            icon={<Calendar className="h-5 w-5" />}
            label="EVENT TIMELINE"
            value="October – November"
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
    <div className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#0D1219]/90 p-3 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/20 sm:p-4">
      <div className={`mb-1.5 ${iconClass}`}>
        {icon}
      </div>

      <span className="text-center font-mono text-[9px] tracking-wide text-[#8B96A5] sm:text-[10px] sm:tracking-wider">
        {label}
      </span>

      <span className="mt-1 text-center font-display text-xs font-bold leading-relaxed text-[#F5F7FA] sm:text-sm">
        {value}
      </span>
    </div>
  );
};