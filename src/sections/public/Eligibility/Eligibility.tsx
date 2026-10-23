import React from 'react';
import {
  ShieldCheck,
  Users,
  Mail,
  GraduationCap,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const Eligibility: React.FC = () => {
  const criteria = [
    {
      icon: GraduationCap,
      title: 'NIE Students Only',
      desc:
        'Participation is open to currently enrolled students of The National Institute of Engineering, Mysuru.',
    },
    {
      icon: CheckCircle,
      title: 'Eligible Branches',
      desc:
        'All branches students are eligible to participate.',
    },
    {
      icon: ShieldCheck,
      title: '2nd Year / 3rd Semester',
      desc:
        'The event is specifically designed for students currently in 2nd Year / 3rd Semester.',
    },
    {
      icon: Users,
      title: '2–3 Members Per Team',
      desc:
        'Participation is team-based. Every team must contain a minimum of 2 and a maximum of 3 members.',
    },
    {
      icon: Mail,
      title: '@nie.ac.in Email',
      desc:
        'All participating students must use their official NIE institutional email address.',
    },
    {
      icon: AlertTriangle,
      title: 'One Team Per Student',
      desc:
        'Each student can belong to only one registered team. Duplicate USN participation is blocked.',
    },
  ];

  return (
    <section
      id="eligibility"
      className="relative border-t border-white/5 bg-[#07090D] px-4 py-14 sm:py-24 md:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mx-auto mb-10 sm:mb-16 max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#36D9FF]/30 bg-[#36D9FF]/10 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[#36D9FF]">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>PARTICIPATION CRITERIA</span>
          </div>

          <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-5xl">
            ELIGIBILITY & CRITERIA
          </h2>

          <p className="mt-3 text-sm leading-relaxed text-[#8B96A5] md:text-base">
            Review the participation requirements before creating a team.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {criteria.map((item, index) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-[#0D1219] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#36D9FF]/50 hover:shadow-xl hover:shadow-[#36D9FF]/10"
              >
                <div className="shrink-0 rounded-xl border border-white/5 bg-[#121A23] p-3.5 text-[#36D9FF] transition-all duration-300 group-hover:bg-[#36D9FF] group-hover:text-[#07090D]">
                  <Icon className="h-5 w-5" />
                </div>

                <div>
                  <div className="mb-1 font-mono text-[10px] font-bold tracking-widest text-[#FF7A30]/70">
                    REQUIREMENT 0{index + 1}
                  </div>

                  <h3 className="mb-1 font-display text-base font-bold text-white transition-colors group-hover:text-[#36D9FF]">
                    {item.title}
                  </h3>

                  <p className="text-xs leading-relaxed text-[#8B96A5]">
                    {item.desc}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};