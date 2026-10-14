import React from 'react';
import { Building2, Mail, Phone, Users2 } from 'lucide-react';
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
    subtitle: 'The National Institute of Engineering, Mysuru',
    image: '/assets/people/principal.jpg',
  },
  {
    title: 'HEAD OF DEPARTMENT',
    subtitle: 'Department of Computer Science and Engineering',
    image: '/assets/people/hod-cse.jpg',
  },
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

        {/* Principal + HOD */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:mb-10 md:grid-cols-2 md:gap-6">
          {LEADERS.map((leader) => (
            <article
              key={leader.title}
              className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0D1219] sm:flex-row"
            >
              <div className="relative h-40 w-full shrink-0 overflow-hidden bg-[#121A23] sm:h-auto sm:w-44 md:w-48">
                <img
                  src={leader.image}
                  alt={leader.title}
                  className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-105"
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              </div>

              <div className="flex flex-1 flex-col justify-center p-4 sm:p-5 md:p-6">
                <div className="mb-3 inline-flex w-fit items-center gap-2 rounded-full border border-[#FF7A30]/25 bg-[#FF7A30]/10 px-3 py-1.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#FF7A30]">
                  <Users2 className="h-3.5 w-3.5" />
                  {leader.title}
                </div>

                <h3 className="font-display text-xl font-black text-white sm:text-2xl">
                  {leader.title === 'PRINCIPAL'
                    ? 'Principal, NIE Mysuru'
                    : 'Head, Department of CSE'}
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#8B96A5]">
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
                {/* Faculty portrait */}
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

                {/* Faculty details */}
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