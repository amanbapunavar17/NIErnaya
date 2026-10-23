
/**
 * ================================================================
 * Rules.tsx — Unified Rules & FAQ Section
 * ================================================================
 * - Combines Rules and FAQ into one public section
 * - Preserves RULES_DATA and FAQ_DATA bindings
 * - Includes the five eligible SDGs
 * - Preserves accordion animations and GSAP entrances
 * - Includes FAQ category filtering
 * ================================================================
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ShieldCheck,
  Target,
  HelpCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { RULES_DATA, FAQ_DATA } from '../../../config/site';

gsap.registerPlugin(ScrollTrigger);

const ELIGIBLE_SDGS = [
  { number: 2, title: 'Zero Hunger', color: '#DDA63A' },
  { number: 3, title: 'Good Health and Well-being', color: '#4C9F38' },
  { number: 4, title: 'Quality Education', color: '#C5192D' },
  { number: 5, title: 'Gender Equality', color: '#FF3A21' },
  { number: 13, title: 'Climate Action', color: '#3F7E44' },
];

const SDG_RULE = {
  id: 'eligible-sdgs',
  title: 'Sustainable Development Goals (SDGs)',
  category: 'Problem Statement Selection Criteria',
};

export const Rules: React.FC = () => {
  const rulesListRef = useRef<HTMLDivElement>(null);
  const faqListRef = useRef<HTMLDivElement>(null);

  const rules = [...RULES_DATA]
    .filter((rule) => rule.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  const faqs = [...FAQ_DATA]
    .filter((faq) => faq.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  const categories = useMemo(() => {
    const available = new Set<string>();

    faqs.forEach((faq) => {
      if (faq.category) available.add(faq.category);
    });

    return ['ALL', ...Array.from(available)];
  }, [faqs]);

  const [openRule, setOpenRule] = useState<string | null>(
    rules[0]?.id ?? SDG_RULE.id
  );

  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    if (selectedCategory === 'ALL') return faqs;

    return faqs.filter((faq) => faq.category === selectedCategory);
  }, [faqs, selectedCategory]);

  useEffect(() => {
    const elements = [
      rulesListRef.current,
      faqListRef.current,
    ].filter((element): element is HTMLDivElement => Boolean(element));

    const contexts = elements.map((element) =>
      gsap.context(() => {
        gsap.fromTo(
          element.querySelectorAll('.unified-accordion-item'),
          { y: 25, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.06,
            duration: 0.6,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: element,
              start: 'top 88%',
            },
          }
        );
      }, element)
    );

    return () => contexts.forEach((context) => context.revert());
  }, [selectedCategory]);

  const accordionHeader = (
    title: string,
    index: number,
    isOpen: boolean,
    onClick: () => void,
    prefix = ''
  ) => (
    <button
      type="button"
      aria-expanded={isOpen}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-4 p-5 text-left transition-all sm:p-6"
    >
      <div className="flex min-w-0 items-center gap-3.5">
        <span
          className={`shrink-0 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold transition-colors ${
            isOpen
              ? 'border-[#FF7A30] bg-[#FF7A30]/15 text-[#FF7A30]'
              : 'border-white/10 bg-white/5 text-[#8B96A5]'
          }`}
        >
          {prefix}
          {String(index + 1).padStart(2, '0')}
        </span>

        <span className="font-display text-base font-bold text-white md:text-lg">
          {title}
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
  );

  const accordionContent = (
    children: React.ReactNode,
    isOpen: boolean,
    contentKey: string
  ) => (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key={contentKey}
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
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <section
      id="rules"
      className="relative overflow-hidden border-t border-white/5 bg-[#07090D] px-4 py-14 sm:py-24 md:px-8"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-[#FF7A30]/5 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#36D9FF]/5 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Unified section heading */}
        <div className="mb-10 text-center sm:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FF7A30]/30 bg-[#FF7A30]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#FF7A30] shadow-sm shadow-[#FF7A30]/20"
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>PARTICIPANT INFORMATION</span>
          </motion.div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            RULES <span className="text-[#FF7A30]">&amp;</span> FAQ
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#8B96A5] md:text-base">
            Everything you need to know about participation, problem statement
            selection, submissions, and the NIErnaya event.
          </p>
        </div>

        {/* Participation Rules */}
        <div className="mb-5 flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-[#FF7A30]" />
          <h3 className="font-display text-lg font-bold tracking-wide text-white sm:text-xl">
            PARTICIPATION RULES
          </h3>
        </div>

        <div ref={rulesListRef} className="space-y-3">
          {rules.map((rule, index) => {
            const isOpen = openRule === rule.id;

            return (
              <motion.article
                key={rule.id}
                layout
                className={`unified-accordion-item overflow-hidden rounded-2xl border backdrop-blur-md transition-colors duration-300 ${
                  isOpen
                    ? 'border-[#FF7A30] bg-[#0D1219] shadow-xl shadow-[#FF7A30]/10'
                    : 'border-white/10 bg-[#0D1219]/80 hover:border-white/25'
                }`}
              >
                {accordionHeader(
                  rule.title,
                  index,
                  isOpen,
                  () => setOpenRule(isOpen ? null : rule.id)
                )}

                {accordionContent(
                  <div className="border-t border-white/5 px-5 pb-6 pt-5 sm:px-6">
                    <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#36D9FF]">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>CATEGORY: {rule.category}</span>
                    </div>

                    <p className="whitespace-pre-line text-sm leading-relaxed text-[#8B96A5]">
                      {rule.content}
                    </p>
                  </div>,
                  isOpen,
                  `rule-${rule.id}`
                )}
              </motion.article>
            );
          })}

          {/* SDG criteria */}
          <motion.article
            layout
            className={`unified-accordion-item overflow-hidden rounded-2xl border backdrop-blur-md transition-colors duration-300 ${
              openRule === SDG_RULE.id
                ? 'border-[#FF7A30] bg-[#0D1219] shadow-xl shadow-[#FF7A30]/10'
                : 'border-white/10 bg-[#0D1219]/80 hover:border-white/25'
            }`}
          >
            {accordionHeader(
              SDG_RULE.title,
              rules.length,
              openRule === SDG_RULE.id,
              () =>
                setOpenRule(
                  openRule === SDG_RULE.id ? null : SDG_RULE.id
                )
            )}

            {accordionContent(
              <div className="border-t border-white/5 px-5 pb-6 pt-5 sm:px-6">
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#36D9FF]">
                  <Target className="h-3.5 w-3.5" />
                  <span>CATEGORY: {SDG_RULE.category}</span>
                </div>

                <p className="mb-5 text-sm leading-relaxed text-[#B2BCC9]">
                  Problem statements must align with at least one of the five
                  eligible Sustainable Development Goals below. Choose a
                  meaningful problem with strong societal impact or one that
                  addresses a genuine social need in India. Consider the
                  availability and relevance of data for investigating
                  real-world challenges.
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {ELIGIBLE_SDGS.map((sdg) => (
                    <div
                      key={sdg.number}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                    >
                      <span
                        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg"
                        style={{ backgroundColor: sdg.color }}
                      >
                        <span className="text-[9px] font-bold text-white/90">
                          SDG
                        </span>
                        <span className="text-lg font-black leading-none text-white">
                          {sdg.number}
                        </span>
                      </span>

                      <span className="text-sm font-semibold text-white">
                        {sdg.title}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 rounded-xl border border-[#FF7A30]/20 bg-[#FF7A30]/5 p-4 text-sm leading-relaxed text-[#B2BCC9]">
                  <span className="font-semibold text-[#FF7A30]">
                    Selection reminder:
                  </span>{' '}
                  Explain how your selected problem connects to an eligible
                  SDG and how data analysis and visualization can help
                  investigate or address it.
                </p>
              </div>,
              openRule === SDG_RULE.id,
              'rule-eligible-sdgs'
            )}
          </motion.article>
        </div>

        {/* FAQ */}
        <div className="mb-5 mt-14 flex items-center gap-2.5 sm:mt-16">
          <HelpCircle className="h-5 w-5 text-[#36D9FF]" />
          <h3 className="font-display text-lg font-bold tracking-wide text-white sm:text-xl">
            FREQUENTLY ASKED QUESTIONS
          </h3>
        </div>

        <p className="mb-6 text-sm leading-relaxed text-[#8B96A5]">
          Find quick answers to common questions about registration,
          eligibility, teams, submissions, and faculty allocation.
        </p>

        {/* FAQ category filters */}
        {categories.length > 2 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {categories.map((category) => {
              const isSelected = selectedCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(category);
                    setOpenFaq(null);
                  }}
                  className={`rounded-xl border px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    isSelected
                      ? 'border-[#36D9FF] bg-[#36D9FF]/15 text-[#36D9FF] shadow-md shadow-[#36D9FF]/15'
                      : 'border-white/10 bg-[#0D1219]/60 text-[#8B96A5] hover:border-white/25 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        )}

        <div ref={faqListRef} className="space-y-3">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openFaq === faq.id;

            return (
              <motion.article
                key={faq.id}
                layout
                className={`unified-accordion-item overflow-hidden rounded-2xl border backdrop-blur-md transition-colors duration-300 ${
                  isOpen
                    ? 'border-[#36D9FF]/60 bg-[#0D1219] shadow-xl shadow-[#36D9FF]/5'
                    : 'border-white/10 bg-[#0D1219]/80 hover:border-[#36D9FF]/40'
                }`}
              >
                {accordionHeader(
                  faq.question,
                  index,
                  isOpen,
                  () => setOpenFaq(isOpen ? null : faq.id),
                  'Q'
                )}

                {accordionContent(
                  <div className="border-t border-white/5 px-5 pb-6 pt-5 sm:px-6">
                    <div className="flex gap-3">
                      <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#36D9FF]" />

                      <div>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-[#8B96A5]">
                          {faq.answer}
                        </p>

                        <div className="mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider text-[#36D9FF]">
                          <Sparkles className="h-3 w-3" />
                          <span>CATEGORY: {faq.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>,
                  isOpen,
                  `faq-${faq.id}`
                )}
              </motion.article>
            );
          })}
        </div>

        {filteredFaqs.length === 0 && (
          <p className="rounded-xl border border-white/10 bg-[#0D1219] p-5 text-sm text-[#8B96A5]">
            No published questions are available in this category yet.
          </p>
        )}
      </div>
    </section>
  );
};

export default Rules;
