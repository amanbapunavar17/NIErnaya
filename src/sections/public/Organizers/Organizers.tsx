
import React from 'react';
import { Building2, Mail, Phone, Users2, ShieldCheck } from 'lucide-react';
import { FACULTY_ORGANIZERS } from '../../../config/site';

const FACULTY_IMAGES = [
  '/assets/people/faculty-01.jpg',
  '/assets/people/faculty-02.jpg',
  '/assets/people/faculty-03.jpg',
  '/assets/people/faculty-04.jpg',
  '/assets/people/faculty-05.jpg',
  '/assets/people/faculty-06.jpg',
  '/assets/people/faculty-07.jpg',
];

const FACULTY_CONTACTS = [
  {
    name: 'Dr. Anitha Raghavendra',
    phone: '+91 9845932547',
    email: 'anitharaghavendra@nie.ac.in',
  },
  {
    name: 'Mr. Nishanth R',
    phone: '+91 9686341445',
    email: 'nishanthr@nie.ac.in',
  },
  {
    name: 'Mr. Manoj N Sogi',
    phone: '+91 7411115352',
    email: 'manojnsogi@nie.ac.in',
  },
  {
    name: 'Ms. Kavitha S',
    phone: '+91 8971995058',
    email: 'kavithas@nie.ac.in',
  },
  {
    name: 'Ms. Sneha S',
    phone: '+91 7795002623',
    email: 'snehas@nie.ac.in',
  },
  {
    name: 'Ms. Deepashree M',
    phone: '+91 8861576007',
    email: 'deepashreem@nie.ac.in',
  },
  {
    name: 'Ms. Aishwarya K M',
    phone: '+91 8762600760',
    email: 'kmaishwarya@nie.ac.in',
  },
];

const LEADERS = [
  {
    title: 'PRINCIPAL',
    name: 'Dr. B S Nagendra Parashar',
    designation: 'Principal',
    subtitle: 'The National Institute of Engineering, Mysuru',
    image: '/assets/people/principal.jpg',
  },
  {
    title: 'VICE-PRINCIPAL',
    name: 'Dr. Likith Kumar M V',
    designation: 'Vice-Principal',
    subtitle: 'The National Institute of Engineering, Mysuru',
    image: '/assets/people/vice-principal.png',
  },
  {
    title: 'HEAD OF DEPARTMENT CSE',
    name: 'Dr. Anitha R',
    designation: 'Professor & Head, Computer Science and Engineering',
    subtitle: 'The National Institute of Engineering, Mysuru',
    image: '/assets/people/hod-cse.jpg',
  },
];

// Phase 2 Jury Members
const JURY_MEMBERS = [
  { name: 'Dr. Mayura Tapkire', image: '/images/jury/jury1.jpg' },
  { name: 'Mrs. Sumana K M', image: '/images/jury/jury2.jpg' },
  { name: 'Mr. Balaji V', image: '/images/jury/jury3.png' },
  { name: 'Mr.G. B. Janardhana Swamy', image: '/images/jury/jury4.jpg' },
  { name: 'Mr. Kartik Manguli', image: '/images/jury/jury5.jpg' },
  { name: 'Mr. Bharath G', image: '/images/jury/jury6.jpg' },
  { name: 'Ms. Nanditha V', image: '/images/jury/jury7.jpg' },
];

export const Organizers: React.FC = () => {
  const faculty = FACULTY_ORGANIZERS
    .filter((fac) => fac.published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 7);

  return (
    <section
      id="organizers"
      className="relative overflow-hidden bg-[#07090D] px-4 py-14 text-white sm:py-20 md:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Section heading */}
        <div className="mx-auto mb-8 max-w-3xl text-center sm:mb-12">
          <p className="font-mono text-[10px] font-black uppercase tracking-[0.3em] text-[#36D9FF]">
            ACADEMIC LEADERSHIP & FACULTY
          </p>

          <h2 className="mt-3 font-display text-4xl font-black tracking-tight md:text-6xl">
            THE PEOPLE BEHIND{' '}
            <span className="text-[#FF7A30]">NIErnaya</span>
          </h2>

          <p className="mt-4 text-sm leading-7 text-[#8B96A5] md:text-base">
            Academic leadership and faculty coordination from the Department
            of Computer Science and Engineering at NIE.
          </p>
        </div>

        {/* Principal + Vice-Principal + HOD */}
        <div className="mb-8 grid grid-cols-1 items-stretch gap-4 md:mb-10 md:grid-cols-3 md:gap-5">
          {LEADERS.map((leader) => (
            <article
              key={leader.title}
              className="group flex min-w-0 flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0D1219] transition-all duration-300 hover:border-[#FF7A30]/40 hover:shadow-xl hover:shadow-[#FF7A30]/5"
            >
              <div className="relative h-56 w-full shrink-0 overflow-hidden bg-[#121A23] sm:h-64 md:h-56 lg:h-64">
                <img
                  src={leader.image}
                  alt={leader.name}
                  className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="mb-3 inline-flex w-fit max-w-full items-center gap-2 rounded-full border border-[#FF7A30]/25 bg-[#FF7A30]/10 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#FF7A30]">
                  <Users2 className="h-3.5 w-3.5 shrink-0" />
                  <span>{leader.title}</span>
                </div>

                <h3 className="font-display text-xl font-black leading-snug text-white transition-colors group-hover:text-[#36D9FF] sm:text-2xl">
                  {leader.name}
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-[#D5DCE5]">
                  {leader.designation}
                </p>

                <p className="mt-2 text-xs leading-5 text-[#8B96A5] sm:text-sm">
                  {leader.subtitle}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Faculty heading */}
        <div className="mb-6 flex items-center gap-4 sm:mb-8">
          <div className="h-px flex-1 bg-white/10" />

          <span className="whitespace-nowrap font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#8B96A5]">
            07 FACULTY MEMBERS
          </span>

          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Seven faculty cards */}
        <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {faculty.map((fac, index) => {
            const image = FACULTY_IMAGES[index];
            const contact = FACULTY_CONTACTS[index];

            if (!contact || !image) return null;

            return (
              <article
                key={fac.id}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0D1219] transition-all duration-300 hover:-translate-y-1 hover:border-[#36D9FF]/40 hover:shadow-xl hover:shadow-[#36D9FF]/5 sm:rounded-3xl"
              >
                <div className="relative h-32 shrink-0 overflow-hidden bg-[#121A23] sm:h-36 lg:h-40">
                  <img
                    src={image}
                    alt={contact.name}
                    className="h-full w-full object-cover object-[center_20%] grayscale-[10%] transition duration-500 group-hover:scale-105 group-hover:grayscale-0"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#0D1219]/50 via-transparent to-transparent" />

                  <div className="absolute left-2 top-2 rounded-md border border-white/10 bg-black/50 px-2 py-1 font-mono text-[8px] font-black text-white backdrop-blur-md sm:left-3 sm:top-3 sm:rounded-lg sm:text-[9px]">
                    FACULTY {String(index + 1).padStart(2, '0')}
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-3 sm:p-4">
                  <div className="mb-1.5 font-mono text-[8px] font-black uppercase tracking-wider text-[#FF7A30] sm:text-[9px]">
                    {fac.role}
                  </div>

                  <h3 className="font-display text-sm font-bold leading-snug text-white transition-colors group-hover:text-[#36D9FF] sm:text-base">
                    {contact.name}
                  </h3>

                  <p className="mt-1 text-[10px] font-semibold leading-4 text-[#AAB3C0] sm:text-xs">
                    {index === 0 ? 'Professor' : 'Assistant Professor'}
                  </p>

                  <p className="mt-2 flex items-start gap-1.5 text-[10px] leading-4 text-[#8B96A5] sm:text-[11px]">
                    <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#36D9FF]" />
                    <span className="min-w-0 break-words">
                      Computer Science and Engineering
                    </span>
                  </p>

                  <div className="mt-3 space-y-2 border-t border-white/5 pt-3 font-mono text-[9px] text-[#8B96A5] sm:text-[10px]">
                    <a
                      href={`mailto:${contact.email}`}
                      className="flex min-w-0 items-start gap-2 transition-colors hover:text-[#36D9FF]"
                      title={contact.email}
                    >
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#36D9FF]" />
                      <span className="min-w-0 break-all">
                        {contact.email}
                      </span>
                    </a>

                    <a
                      href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                      className="flex items-center gap-2 transition-colors hover:text-[#FF7A30]"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0 text-[#FF7A30]" />
                      <span>{contact.phone}</span>
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* =====================================================
            NEW SECTION: PHASE 2 JURY MEMBERS
        ====================================================== */}
        <div className="mt-16 sm:mt-20">

          {/* Jury section heading */}
          <div className="mx-auto mb-8 max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FF7A30]/20 bg-[#FF7A30]/10 px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-[#FF7A30]" />
              <span className="font-mono text-[9px] font-black tracking-[0.18em] text-[#FF7A30]">
                PHASE 2 EVALUATION PANEL
              </span>
            </div>

            <h2 className="font-display text-2xl font-black text-white sm:text-3xl">
              JURY <span className="text-[#36D9FF]">MEMBERS</span>
            </h2>

            <p className="mt-2 text-xs leading-6 text-[#8B96A5] sm:text-sm">
              Meet the jury members participating in the Phase 2 project
              evaluation of NIErnaya 2026.
            </p>
          </div>

          {/* Compact jury profiles */}
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">

            {JURY_MEMBERS.map((jury, index) => (
              <article
                key={jury.name}
                className="group flex items-center gap-3 rounded-xl border border-white/10 bg-[#0D1219] p-3 transition-all duration-300 hover:border-[#36D9FF]/40 hover:bg-[#121A23] sm:gap-4 sm:p-4"
              >
                {/* Small circular jury image */}
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full border border-[#36D9FF]/25 bg-[#121A23] sm:h-16 sm:w-16">
                  <img
                    src={jury.image}
                    alt={jury.name}
                    className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-110"
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                {/* Jury details */}
                <div className="min-w-0">
                  <p className="font-mono text-[8px] font-bold uppercase tracking-wider text-[#FF7A30]">
                    JURY {String(index + 1).padStart(2, '0')}
                  </p>

                  <h3 className="mt-1 break-words font-display text-xs font-bold leading-snug text-white transition-colors group-hover:text-[#36D9FF] sm:text-sm">
                    {jury.name}
                  </h3>

                  <p className="mt-1 text-[9px] text-[#8B96A5]">
                    Phase 2
                  </p>
                </div>
              </article>
            ))}

          </div>
        </div>

        {/* Organizer credit */}
        <div className="mt-10 text-center sm:mt-12">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-[#8B96A5]">
            ORGANIZED BY
          </p>

          <p className="mt-2 font-display text-base font-black text-white sm:text-lg">
            DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING
          </p>

          <p className="mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#36D9FF]">
            THE NATIONAL INSTITUTE OF ENGINEERING • MYSURU
          </p>
        </div>

      </div>
    </section>
  );
};

export default Organizers;
