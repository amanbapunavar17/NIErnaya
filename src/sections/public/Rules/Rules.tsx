/**
 * ================================================================
 * Rules.tsx — Enhanced Event Governance & Rules Accordion
 * ================================================================
 * Effects added:
 * - Spring-physics accordion expansion with Framer Motion AnimatePresence & layout
 * - Scale-bounce and rotation micro-interactions on expand/collapse chevron
 * - GSAP ScrollTrigger staggered entrance for rule items
 * - Glowing category badges and active border highlight states
 * - Preserves ALL content, strings, rules, and RULES_DATA bindings
 * ================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { RULES_DATA } from '../../../config/site';

gsap.registerPlugin(ScrollTrigger);

export const Rules: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const rulesListRef = useRef<HTMLDivElement>(null);

  const rules = [...RULES_DATA]
    .filter((rule) => rule.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  const [openIndex, setOpenIndex] = useState<number | null>(
    rules.length > 0 ? 0 : null
  );

  /* GSAP entrance */
  useEffect(() => {
    const el = rulesListRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.rule-card-item',
        { y: 35, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.7,
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
      id="rules"
      ref={sectionRef}
      className="relative border-t border-white/5 bg-[#07090D] px-4 py-14 sm:py-24 md:px-8 overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -left-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#FF7A30]/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-[#36D9FF]/5 blur-[120px]" />

      <div className="mx-auto max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-10 sm:mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF7A30]/30 bg-[#FF7A30]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7A30] shadow-sm shadow-[#FF7A30]/20"
          >
            <BookOpen className="h-3.5 w-3.5 animate-pulse" />
            <span>EVENT GOVERNANCE</span>
          </motion.div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            RULES & GUIDELINES
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#8B96A5] md:text-base max-w-xl mx-auto">
            Please review the official participation, submission, conduct,
            and event guidelines before registering.
          </p>
        </div>

        {/* Rules Accordion */}
        <div ref={rulesListRef} className="space-y-4">
          {rules.map((rule, index) => {
            const isOpen = openIndex === index;

            return (
              <motion.article
                key={rule.id}
                layout
                className={`rule-card-item overflow-hidden rounded-2xl border transition-colors duration-300 backdrop-blur-md ${
                  isOpen
                    ? 'border-[#FF7A30] bg-[#0D1219] shadow-xl shadow-[#FF7A30]/10'
                    : 'border-white/10 bg-[#0D1219]/80 hover:border-white/25'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition-colors ${
                        isOpen
                          ? 'border-[#FF7A30] bg-[#FF7A30]/15 text-[#FF7A30]'
                          : 'border-white/10 bg-white/5 text-[#8B96A5]'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <span className="font-display text-base font-bold text-white md:text-lg">
                      {rule.title}
                    </span>
                  </div>

                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      isOpen
                        ? 'border-[#FF7A30]/40 bg-[#FF7A30]/10 text-[#FF7A30]'
                        : 'border-white/10 bg-white/5 text-[#8B96A5]'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: 'auto',
                        opacity: 1,
                        transition: {
                          height: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.25, delay: 0.1 },
                        },
                      }}
                      exit={{
                        height: 0,
                        opacity: 0,
                        transition: {
                          height: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                          opacity: { duration: 0.15 },
                        },
                      }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-white/5 px-5 pb-6 pt-5 sm:px-6">
                        <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#36D9FF]">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>CATEGORY: {rule.category}</span>
                        </div>

                        <p className="text-sm leading-relaxed text-[#8B96A5]">
                          {rule.content}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Rules;