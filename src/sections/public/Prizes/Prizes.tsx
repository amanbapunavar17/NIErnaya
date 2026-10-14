import React from 'react';
import { Sparkles } from 'lucide-react';

import { PRIZES_DATA } from '../../../config/site';

import championTrophy from '../../../assets/prizes/champion-trophy.png';
import firstRunnerUpTrophy from '../../../assets/prizes/first-runner-up-trophy.png';
import secondRunnerUpTrophy from '../../../assets/prizes/second-runner-up-trophy.png';

/* -------------------------------------------------------------------------- */
/* Trophy images                                                              */
/* -------------------------------------------------------------------------- */

const TROPHY_IMAGES = [
  championTrophy,
  firstRunnerUpTrophy,
  secondRunnerUpTrophy,
];

/* -------------------------------------------------------------------------- */
/* Public prize labels                                                        */
/* -------------------------------------------------------------------------- */

const PRIZE_LABELS = [
  'CHAMPIONS',
  '1ST RUNNER UP',
  '2ND RUNNER UP',
];

/* -------------------------------------------------------------------------- */
/* Prize amount helper                                                        */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export const Prizes: React.FC = () => {

  /*
   * IMPORTANT:
   * We intentionally use the first three prize entries.
   *
   * We do NOT depend on prize.position because the existing
   * site configuration may store that value as text such as
   * "1st", "2nd", "3rd".
   */
  const prizes = PRIZES_DATA.slice(0, 3);

  return (
    <section
      id="prizes"
      className="relative overflow-hidden py-14 sm:py-24 md:py-32"
    >

      {/* ================================================================== */}
      {/* Background                                                         */}
      {/* ================================================================== */}

      <div className="pointer-events-none absolute inset-0">

        {/* Center glow */}
        <div className="absolute left-1/2 top-20 h-[500px] w-[850px] -translate-x-1/2 rounded-full bg-orange-500/[0.035] blur-[130px]" />

        {/* Left glow */}
        <div className="absolute left-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-cyan-500/[0.025] blur-[120px]" />

        {/* Right glow */}
        <div className="absolute right-0 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-orange-500/[0.025] blur-[120px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(
                rgba(255,255,255,0.5) 1px,
                transparent 1px
              ),
              linear-gradient(
                90deg,
                rgba(255,255,255,0.5) 1px,
                transparent 1px
              )
            `,
            backgroundSize: '64px 64px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* ================================================================= */}
        {/* Heading                                                           */}
        {/* ================================================================= */}

        <div className="mx-auto max-w-4xl text-center">

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/[0.08] px-5 py-2 text-xs font-semibold tracking-[0.16em] text-orange-400">
            <Sparkles size={14} />
            <span>PRIZES &amp; REWARDS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            WIN.
            <span className="mx-2 text-orange-500">
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

        {/* ================================================================= */}
        {/* Total prize pool                                                  */}
        {/* ================================================================= */}

        <div className="mx-auto mt-12 max-w-sm">

          <div className="relative overflow-hidden rounded-2xl border border-orange-500/25 bg-black/40 px-8 py-6 text-center backdrop-blur-xl">

            <div className="pointer-events-none absolute inset-x-10 -bottom-10 h-20 rounded-full bg-orange-500/20 blur-3xl" />

            <p className="relative text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
              Total Prize Pool
            </p>

            <p className="relative mt-2 text-4xl font-black text-orange-400 md:text-5xl">
              ₹10,000
            </p>

          </div>

        </div>

        {/* ================================================================= */}
        {/* THREE TROPHIES                                                    */}
        {/* ================================================================= */}

        <div className="mt-20 grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-6 lg:gap-10">

          {prizes.map((prize, index) => {

            const amount = getPrizeAmount(prize.amount);

            const trophyImage = TROPHY_IMAGES[index];

            const label = PRIZE_LABELS[index];

            return (
              <article
                key={index}
                className="group relative flex flex-col items-center text-center"
              >

                {/* --------------------------------------------------------- */}
                {/* Trophy area                                               */}
                {/* --------------------------------------------------------- */}

                <div className="relative flex h-[300px] w-full items-end justify-center">

                  {/* Trophy glow */}
                  <div className="pointer-events-none absolute bottom-8 left-1/2 h-40 w-56 -translate-x-1/2 rounded-full bg-orange-500/10 blur-[70px] transition-all duration-700 group-hover:bg-orange-500/20" />

                  {/* Platform glow */}
                  <div className="pointer-events-none absolute bottom-7 left-1/2 h-3 w-44 -translate-x-1/2 rounded-full bg-orange-400/25 blur-md transition-all duration-500 group-hover:w-56 group-hover:bg-orange-400/40" />

                  {/* Platform line */}
                  <div className="pointer-events-none absolute bottom-6 left-1/2 h-px w-48 -translate-x-1/2 bg-gradient-to-r from-transparent via-orange-400/70 to-transparent transition-all duration-500 group-hover:w-60" />

                  {/* ===================================================== */}
                  {/* YOUR ACTUAL TROPHY IMAGE                              */}
                  {/* ===================================================== */}

                  <img
                    src={trophyImage}
                    alt={`${label} trophy`}
                    className="relative z-10 h-[255px] w-auto max-w-[270px] object-contain drop-shadow-[0_0_30px_rgba(255,140,40,0.18)] transition-all duration-700 ease-out group-hover:-translate-y-4 group-hover:scale-105 group-hover:drop-shadow-[0_0_45px_rgba(255,140,40,0.35)]"
                  />

                </div>

                {/* --------------------------------------------------------- */}
                {/* Prize name                                                 */}
                {/* --------------------------------------------------------- */}

                <h3 className="mt-4 text-xl font-black tracking-[0.08em] text-white md:text-2xl">
                  {label}
                </h3>

                {/* --------------------------------------------------------- */}
                {/* Prize amount                                               */}
                {/* --------------------------------------------------------- */}

                <p className="mt-3 text-4xl font-black tracking-tight text-orange-400 md:text-5xl">
                  ₹{amount.toLocaleString('en-IN')}
                </p>

                {/* Accent line */}
                <div className="mx-auto mt-5 h-[2px] w-16 bg-gradient-to-r from-transparent via-orange-400 to-transparent transition-all duration-500 group-hover:w-24" />

              </article>
            );
          })}

        </div>

      </div>
    </section>
  );
};

export default Prizes;