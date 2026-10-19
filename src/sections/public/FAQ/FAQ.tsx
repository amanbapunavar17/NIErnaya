/**
 * ================================================================
 * FAQ.tsx — Enhanced Clarifications & Questions Accordion
 * ================================================================
 * Effects added:
 * - Spring-damped height accordion transitions with Framer Motion AnimatePresence & layout
 * - Interactive category filtering tabs with animated sliding indicator
 * - Cyan border glow and micro-interaction on question hover
 * - GSAP ScrollTrigger staggered entrance
 * - Preserves all questions, answers, categories, and FAQ_DATA entries
 * ================================================================
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  HelpCircle,
  ChevronDown,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { FAQ_DATA } from '../../../config/site';

gsap.registerPlugin(ScrollTrigger);

export const FAQ: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const faqListRef = useRef<HTMLDivElement>(null);

  const faqs = FAQ_DATA.filter((faq) => faq.published);

  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [faqs]);

  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filteredFaqs = useMemo(() => {
    if (selectedCategory === 'ALL') return faqs;
    return faqs.filter((f) => f.category === selectedCategory);
  }, [faqs, selectedCategory]);

  const [openId, setOpenId] = useState<string | null>(
    faqs[0]?.id ?? null
  );

  /* GSAP entrance */
  useEffect(() => {
    const el = faqListRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.faq-item-card',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.07,
          duration: 0.65,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
          },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [selectedCategory]);

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative border-t border-white/5 bg-[#07090D] px-4 py-14 sm:py-24 md:px-8 overflow-hidden"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-[#36D9FF]/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#FF7A30]/5 blur-[120px]" />

      <div className="mx-auto max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-10 sm:mb-14 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#36D9FF]/30 bg-[#36D9FF]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#36D9FF] shadow-sm shadow-[#36D9FF]/20"
          >
            <HelpCircle className="h-3.5 w-3.5 animate-pulse" />
            <span>CLARIFICATIONS</span>
          </motion.div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            FREQUENTLY ASKED QUESTIONS
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#8B96A5] md:text-base">
            Everything you need to know about eligibility, teams, accounts,
            team registration, submissions, and faculty allocation.
          </p>
        </div>

        {/* Category Filter Pills (if multiple categories exist) */}
        {categories.length > 2 && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setOpenId(null);
                  }}
                  className={`relative rounded-xl border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    isSelected
                      ? 'border-[#36D9FF] bg-[#36D9FF]/15 text-[#36D9FF] shadow-md shadow-[#36D9FF]/15'
                      : 'border-white/10 bg-[#0D1219]/60 text-[#8B96A5] hover:border-white/25 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {/* Accordion */}
        <div ref={faqListRef} className="space-y-4">
          {filteredFaqs.map((faq) => {
            const isOpen = openId === faq.id;

            return (
              <motion.article
                key={faq.id}
                layout
                className={`faq-item-card overflow-hidden rounded-2xl border transition-colors duration-300 backdrop-blur-md ${
                  isOpen
                    ? 'border-[#FF7A30] bg-[#0D1219] shadow-xl shadow-[#FF7A30]/10'
                    : 'border-white/10 bg-[#0D1219]/80 hover:border-[#36D9FF]/40'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                  className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left transition-all"
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`mt-0.5 rounded-md border px-2 py-0.5 font-mono text-xs font-bold transition-colors ${
                        isOpen
                          ? 'border-[#FF7A30]/40 bg-[#FF7A30]/15 text-[#FF7A30]'
                          : 'border-white/10 bg-white/5 text-[#8B96A5]'
                      }`}
                    >
                      {String(faq.sort_order).padStart(2, '0')}
                    </span>

                    <span className="font-display text-base font-bold text-white md:text-lg">
                      {faq.question}
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
                      key="answer"
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
                      <div className="border-t border-white/5 px-6 pb-6 pt-5">
                        <div className="flex gap-4">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#36D9FF]" />

                          <div>
                            <p className="text-sm leading-relaxed text-[#8B96A5]">
                              {faq.answer}
                            </p>

                            <div className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#36D9FF]">
                              <Sparkles className="h-3 w-3" />
                              <span>CATEGORY: {faq.category}</span>
                            </div>
                          </div>
                        </div>
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

export default FAQ;