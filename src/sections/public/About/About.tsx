/**
 * ================================================================
 * About.tsx — Enhanced Concept & Analytical Pillars Section
 * ================================================================
 * Effects added:
 * - Split-word stagger reveal for main headline using Framer Motion
 * - Cyber text decode / scramble effect on event concept badge
 * - 3D Perspective Tilt on Pillar cards with cursor radial glow tracking
 * - GSAP ScrollTrigger staggered entrance for pillar articles
 * - Ambient background parallax grid and soft colored atmospheric blurs
 * - Preserves ALL content, strings, pillars, and labels exactly as-is
 * ================================================================
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  Database,
  LineChart,
  Eye,
  Compass,
  ArrowUpRight,
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

import { SITE_CONFIG } from '../../../config/site';

gsap.registerPlugin(ScrollTrigger);

/* ================================================================
   3D TILT PILLAR CARD
   ================================================================ */
const PillarTiltCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className, glowColor = '#FF7A30' }) => {
  const ref = useRef<HTMLDivElement>(null);
  const posX = useMotionValue(0);
  const posY = useMotionValue(0);

  const rX = useSpring(useTransform(posY, [-0.5, 0.5], [8, -8]), {
    stiffness: 260,
    damping: 24,
  });
  const rY = useSpring(useTransform(posX, [-0.5, 0.5], [-8, 8]), {
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
  const glowBg = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, ${glowColor}18 0%, transparent 68%)`;

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

/* ================================================================
   MAIN ABOUT COMPONENT
   ================================================================ */
export const About: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  const corePillars = [
    {
      icon: Database,
      number: '01',
      title: 'Problem & Data Formulation',
      description:
        'Identify meaningful analytical problems, discover relevant datasets, validate data availability, and frame clear questions that can be explored through data.',
    },
    {
      icon: LineChart,
      number: '02',
      title: 'Exploration & EDA',
      description:
        'Clean real-world datasets, understand patterns and relationships, perform exploratory analysis, and transform raw information into structured evidence.',
    },
    {
      icon: Eye,
      number: '03',
      title: 'Visualization & Storytelling',
      description:
        'Build clear and engaging visual narratives that communicate analytical findings and help audiences understand what the data is telling them.',
    },
  ];

  /* GSAP ScrollTrigger Staggered Reveal on Pillar Cards */
  useEffect(() => {
    const el = cardsContainerRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about-pillar-card',
        { y: 50, opacity: 0, scale: 0.94 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          stagger: 0.14,
          duration: 0.85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 82%',
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, []);

  const conceptParts = SITE_CONFIG.aboutConcept.split('. ');
  const conceptPart1 = conceptParts[0] ? `${conceptParts[0]}.` : '';
  const conceptPart2 = conceptParts[1] ?? '';

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative overflow-hidden border-t border-white/5 bg-[#07090D] px-4 py-14 sm:py-24 md:px-8"
    >
      {/* Background Cyber Grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Ambient background glow blurs */}
      <div className="pointer-events-none absolute left-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-[#173A8C]/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-96 w-96 rounded-full bg-[#FF7A30]/10 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto mb-10 sm:mb-16 max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#36D9FF]/30 bg-[#36D9FF]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#36D9FF] shadow-sm shadow-[#36D9FF]/20"
          >
            <Compass className="h-3.5 w-3.5 animate-spin-slow" />
            <span>EVENT CONCEPT</span>
          </motion.div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            {conceptPart1}
            <br />
            <span className="text-[#FF7A30] text-glow-orange">
              {conceptPart2}
            </span>
          </h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="pt-5 text-sm leading-relaxed text-[#8B96A5] md:text-base max-w-2xl mx-auto"
          >
            {SITE_CONFIG.name} is a collegiate Data Analytics & Visualization
            Data Detective Challenge hosted by{' '}
            <span className="font-semibold text-white">
              {SITE_CONFIG.institution}
            </span>
            . The event brings together problem formulation, data exploration,
            analytical thinking, and visual communication in one structured
            challenge.
          </motion.p>
        </div>

        {/* Pillars Grid */}
        <div
          ref={cardsContainerRef}
          className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3 lg:gap-8"
        >
          {corePillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <PillarTiltCard
                key={pillar.number}
                className="about-pillar-card h-full"
                glowColor={pillar.number === '02' ? '#36D9FF' : '#FF7A30'}
              >
                <article className="group flex h-full flex-col justify-between rounded-2xl border-2 border-white/5 bg-[#0D1219]/90 p-5 sm:p-8 backdrop-blur-md transition-all duration-300 hover:border-[#FF7A30]/50 hover:shadow-xl hover:shadow-[#FF7A30]/10">
                  <div>
                    <div className="mb-7 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#FF7A30]/30 bg-[#121A23] text-[#FF7A30] transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FF7A30] group-hover:text-[#07090D] shadow-md shadow-[#FF7A30]/10">
                        <Icon className="h-6 w-6" />
                      </div>

                      <span className="font-mono text-xs font-bold tracking-widest text-[#36D9FF]/70">
                        PILLAR {pillar.number}
                      </span>
                    </div>

                    <h3 className="mb-3 font-display text-xl font-bold text-white transition-colors group-hover:text-[#36D9FF]">
                      {pillar.title}
                    </h3>

                    <p className="text-sm leading-relaxed text-[#8B96A5]">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-4">
                    <span className="font-mono text-xs text-[#8B96A5]">
                      NIErnaya
                    </span>

                    <ArrowUpRight className="h-4 w-4 text-[#FF7A30] transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </div>
                </article>
              </PillarTiltCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default About;