import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';

interface CinematicLoaderProps {
  onComplete: () => void;
}

export const CinematicLoader: React.FC<CinematicLoaderProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  const steps = [
    { title: "THE NATIONAL INSTITUTE OF ENGINEERING", subtitle: "ESTABLISHED 1946 • MYSURU, KARNATAKA" },
    { title: "DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING", subtitle: "DATA ENGINEERING & ANALYTICS WING" },
    { title: "NIErnaya", subtitle: "DISCOVER. ANALYZE. VISUALIZE." },
    { title: "INITIALIZING QUANTITATIVE ENGINE", subtitle: "MOUNTING 3D VISUALIZATION PIPELINES..." }
  ];

  useEffect(() => {
    // Fail-safe maximum timeout (2.8 seconds)
    const timer = setTimeout(() => {
      onComplete();
    }, 3200);

    const stepInterval = setInterval(() => {
      setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 4;
      });
    }, 60);

    return () => {
      clearTimeout(timer);
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#07090D] text-[#F5F7FA] overflow-hidden"
    >
      {/* Subtle Background Glows */}
      <div className="absolute w-[500px] h-[500px] bg-[#36D9FF]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-[#FF7A30]/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-cyber opacity-30 pointer-events-none" />

      <div className="relative z-10 max-w-xl w-full px-6 flex flex-col items-center text-center">
        
        {/* Animated Official NIE Logo with Holographic Rings */}
        <div className="relative mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-3 rounded-3xl border border-dashed border-[#36D9FF]/40 pointer-events-none"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-5 rounded-full border border-dashed border-[#FF7A30]/30 pointer-events-none"
          />

          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-[0_0_30px_rgba(54,217,255,0.35)]"          >
              <img
          src="/assets/people/nie-logo.png"
          alt="National Institute of Engineering"
          className="w-40 h-40 sm:w-48 sm:h-48 object-contain drop-shadow-[0_0_30px_rgba(54,217,255,0.35)]"
        />
          </motion.div>
        </div>

        {/* Dynamic Title Stream */}
        <div className="h-28 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ y: 20, opacity: 0, filter: "blur(6px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -20, opacity: 0, filter: "blur(6px)" }}
              transition={{ duration: 0.35 }}
              className="space-y-2"
            >
              <h2 className="font-display font-extrabold text-xl md:text-2xl text-[#F5F7FA] tracking-wide">
                {steps[step].title}
              </h2>
              <p className="font-mono text-xs md:text-sm text-[#36D9FF] tracking-widest uppercase">
                {steps[step].subtitle}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Technical Progress Bar */}
        <div className="w-full max-w-md mt-6 space-y-2">
          <div className="flex justify-between items-center text-xs font-mono text-[#8B96A5]">
            <span className="flex items-center gap-1.5 text-[#36D9FF]">
              <Terminal className="w-3.5 h-3.5 animate-pulse" />
              SYSTEM_BOOT: READY
            </span>
            <span className="text-[#FF7A30] font-bold">{progress}%</span>
          </div>

          <div className="w-full h-1.5 bg-[#121A23] rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#36D9FF] via-[#8B5CF6] to-[#FF7A30]"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Instant Skip Button */}
        <button
          onClick={onComplete}
          className="mt-8 text-xs font-mono text-[#8B96A5] hover:text-[#F5F7FA] transition-colors flex items-center gap-1 px-3 py-1 rounded border border-white/10 hover:border-white/20 bg-white/5"
        >
          <span>Skip Intro</span>
          <span className="text-white/40">›</span>
        </button>
      </div>
    </motion.div>
  );
};
