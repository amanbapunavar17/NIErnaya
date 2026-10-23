// ============================================================
// NIErnaya — CENTRAL SITE CONFIGURATION
// ============================================================

import type {
  Phase,
  TimelineEvent,
  RuleItem,
  PrizeItem,
  FAQItem,
  OrganizerMember,
  ContactConfig,
} from '../types';


// ============================================================
// SITE CONFIGURATION
// ============================================================

export const SITE_CONFIG = {
  name: "NIErnaya",

  tagline: "FROM DATA TO DECISION",

  subtitle: "DATA DETECTIVE CHALLENGE",

institution: "THE NATIONAL INSTITUTE OF ENGINEERING",
department: "DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING",
  institutionShort: "NIE",

  branding: {
    nieLogo: "/assets/branding/nie-logo1.png",
    cseLogo: "/assets/branding/cse-logo1.png",
  },

  edition: "2026",

  aboutConcept: "DISCOVER THE STORY HIDDEN IN DATA.",

  registrationOpen: true,

  registrationDeadline:
    "25th October 2026, 11:59 PM IST",

  eventDates:
    "17th October – 20th November 2026 (Grand Valedictory date to be announced)",

  emailDomain: "@nie.ac.in",

  whatsappCommunityLink:
    "https://chat.whatsapp.com/JGsWjeav6U47BbcKrxBdyb",

  developerCredit: {
    name: "AMAN BAPUNAVAR",
    department: "CSE – A SECTION",
    role: "Lead Platform Architect & Developer",
  },

  contact: {
    email: "",

    phone: "",

    address:
      "The National Institute of Engineering, Manandavadi Road, Mysuru, Karnataka 570008",

    northCampusVenue:
      "NIE North Campus (CSE / AIML Block), Koorgalli, Mysuru",

    southCampusVenue:
      "NIE South Campus (ECE, EEE, ME), Manandavadi Rd, Mysuru",

    whatsappCommunityLink: "https://chat.whatsapp.com/JGsWjeav6U47BbcKrxBdyb",

    workingHours:
      "09:00 AM – 05:00 PM IST (MON–SAT)",
  } satisfies ContactConfig,
} as const;


// ============================================================
// PHASES
// ============================================================

export const PHASES_DATA: Phase[] = [
  {
    id: "phase-1",

    name: "PHASE 1",

    slug: "data-hunt",

    start_date: "2026-10-28",

    end_date: "2026-10-28",

    dates: "28th October",

    focus:
      "Problem Identification & Data Acquisition",

    description:
      "Phase 1 clearance criteria: the selected problem statement must address one of five Sustainable Development Goals with strong societal impact or social need in India and meaningful scope for an interdisciplinary student project. Eligible SDGs are SDG 2 – Zero Hunger, SDG 3 – Good Health and Well-being, SDG 4 – Quality Education, SDG 5 – Gender Equality, and SDG 13 – Climate Action. During problem statement selection, priority is given to datasets encountering real-time challenges. These criteria must be satisfied to clear Phase 1.",

    campus_info:
      "Team problem definition and data acquisition",

    status: "upcoming",

    sort_order: 1,

    public_visible: true,
  },

  {
    id: "phase-2",

    name: "PHASE 2",

    slug: "data-lab-war",

    start_date: "2026-11-11",

    end_date: "2026-11-11",

    dates: "11th November",

    focus:
      "Data Cleaning, EDA & Visualization War",

    description:
      "Perform advanced data wrangling, missing-value imputation, exploratory data analysis, and craft high-impact interactive visual dashboards.",

    campus_info:
      "Data cleaning, exploratory analysis, and visualization",

    status: "upcoming",

    sort_order: 2,

    public_visible: true,
  },

  {
    id: "phase-3",

    name: "PHASE 3",

    slug: "live-battle",

    start_date: "2026-11-20",

    end_date: "2026-11-20",

    dates: "20th November",

    focus:
      "Live Data Battle & Grand Finale",

    description:
      "Shortlisted finalist teams solve the live data challenge, build clear visual narratives, and present their findings.",

    campus_info:
      "NIE North Campus, Koorgalli, Mysuru",

    status: "upcoming",

    sort_order: 3,

    public_visible: true,
  },
];


// ============================================================
// TIMELINE
// ============================================================

export const TIMELINE_EVENTS: TimelineEvent[] = [
  {
    id: "station-01",

    station_number: "EVENT 01",

    date_badge: {
      day: "17",
      month: "OCT",
      year: "2026",
    },

    title: "Registrations Open",

    description:
      "Team registration portal goes live. Form your squad of 2–3 students from 2nd year (3rd sem) NIE.",

    status: "upcoming",

    sort_order: 1,
  },

  {
    id: "station-02",

    station_number: "EVENT 02",

    date_badge: {
      day: "25",
      month: "OCT",
      year: "2026",
    },

    title: "Registration Deadline & Locking",

    description:
      "Final deadline to complete team registration and verify team details.",

    status: "upcoming",

    sort_order: 2,
  },

  {
    id: "station-03",

    station_number: "EVENT 03",

    date_badge: {
      day: "28",
      month: "OCT",
      year: "2026",
    },

    title: "Phase 1: Data Hunt Launch",

    description:
      "Problem formulation requirements and dataset discovery challenges are officially initiated.",

    phase_id: "phase-1",

    status: "upcoming",

    sort_order: 3,
  },

  {
    id: "station-04",

    station_number: "EVENT 04",

    date_badge: {
      day: "04",
      month: "NOV",
      year: "2026",
    },

    title: "Shortlisted Teams Announcement",

    description:
      "Shortlisted teams are announced and advance to Phase 2 Data Lab.",

    status: "upcoming",

    sort_order: 4,
  },

  {
    id: "station-05",

    station_number: "EVENT 05",

    date_badge: {
      day: "11",
      month: "NOV",
      year: "2026",
    },

    title: "Phase 2: Data Lab & Visualization",

    description:
      "Intense EDA phase with faculty syncs, visual prototype audits, and statistical validation.",

    phase_id: "phase-2",

    status: "upcoming",

    sort_order: 5,
  },

  {
    id: "station-06",

    station_number: "EVENT 06",

    date_badge: {
      day: "20",
      month: "NOV",
      year: "2026",
    },

    title: "Phase 3: Live Data Battle",

    description:
      "Live data problem-solving and team presentations at NIE North Campus.",

    phase_id: "phase-3",

    status: "upcoming",

    sort_order: 6,
  },

  {
    id: "station-07",

    station_number: "EVENT 07",

    date_badge: {
      day: "--",
      month: "TBD",
      year: "",
    },

    title: "Grand Valedictory & Prize Distribution",

    description:
      "Final presentations, jury deliberation, certificate issuance, and ₹10,000 cash prize honors.",

    phase_id: "phase-3",

    status: "upcoming",

    sort_order: 7,
  },
];


// ============================================================
// RULES & GUIDELINES
// ============================================================

export const RULES_DATA: RuleItem[] = [
  {
    id: "r1",

    category: "Eligibility & Formation",

    title: "Strict Eligibility",

    content:
      "Only currently enrolled 2nd Year / 3rd Semester students from The National Institute of Engineering (NIE), Mysore across eligible engineering branches (CSE, AIML, ECE, EEE, ME) are eligible.",

    sort_order: 1,

    published: true,
  },

  {
    id: "r2",

    category: "Eligibility & Formation",

    title: "Team Size & Email Validation",

    content:
      "Teams must consist of exactly 2 to 3 members. All members must have valid @nie.ac.in institutional email addresses. No individual or solo participation is allowed.",

    sort_order: 2,

    published: true,
  },

  {
    id: "r3",

    category: "Team Leader & Access",

    title: "Single Account Policy",

    content:
      "Only the Team Leader creates and holds the login portal account. Team members do not receive individual accounts. A student can only be part of one team.",

    sort_order: 3,

    published: true,
  },

  {
    id: "r4",

    category: "Submissions & Formats",

    title: "Accepted Submission Artifacts",

    content:
      "All phase submissions must be uploaded through the official portal in .ppt, .pptx, or .pdf format with a maximum file size of 20MB. Late submissions will be automatically rejected.",

    sort_order: 4,

    published: true,
  },

  {
    id: "r5",

    category: "Submissions & Formats",

    title: "Locking & Immutability",

    content:
      "Once a submission is locked or registration is finalized, changes cannot be made unless explicitly unlocked by the NIErnaya Admin committee.",

    sort_order: 5,

    published: true,
  },

  {
    id: "r6",

    category: "Integrity & Code of Conduct",

    title: "Originality & Plagiarism",

    content:
      "All data transformations, code notebooks, and visualization models must be original. Attribution is mandatory for public datasets. Plagiarized work will result in immediate disqualification.",

    sort_order: 6,

    published: true,
  },
];


// ============================================================
// PRIZES
// ============================================================

export const PRIZES_DATA: PrizeItem[] = [
  {
    id: "prize-1",

    position: "1ST PLACE",

    title: "CHAMPION",

    amount: "₹5,000",

    amount_num: 5000,

    description:
      "Grand Winner Trophy + Certificate of Excellence + Direct Recognition & Mentorship",

    trophy_style: "gold",

    perks: [
      "₹5,000 Cash Prize",
      "Grand Winner Trophy",
      "Certificate of Merit",
      "NIE Innovation Cell Fast-track",
    ],

    sort_order: 1,

    published: true,
  },

  {
    id: "prize-2",

    position: "2ND PLACE",

    title: "1ST RUNNER UP",

    amount: "₹3,000",

    amount_num: 3000,

    description:
      "Silver Trophy + Certificate of Excellence + Special Analytics Commendation",

    trophy_style: "silver",

    perks: [
      "₹3,000 Cash Prize",
      "Runner-up Trophy",
      "Certificate of Merit",
      "Special Domain Badge",
    ],

    sort_order: 2,

    published: true,
  },

  {
    id: "prize-3",

    position: "3RD PLACE",

    title: "2ND RUNNER UP",

    amount: "₹2,000",

    amount_num: 2000,

    description:
      "Bronze Trophy + Certificate of Excellence + Analytics Honor Roll",

    trophy_style: "bronze",

    perks: [
      "₹2,000 Cash Prize",
      "Bronze Trophy",
      "Certificate of Merit",
      "Analytics Honor Badge",
    ],

    sort_order: 3,

    published: true,
  },
];


// ============================================================
// FAQ
// ============================================================

export const FAQ_DATA: FAQItem[] = [
  {
    id: "faq-1",

    question:
      "Who is eligible to participate in NIErnaya?",

    answer:
      "Only currently enrolled 2nd Year (3rd Semester) students of The National Institute of Engineering (NIE), Mysore from CSE, AIML, ECE, EEE, and ME departments. Valid @nie.ac.in emails are required.",

    category: "Eligibility",

    sort_order: 1,

    published: true,
  },

  {
    id: "faq-2",

    question:
      "Can I participate individually without a team?",

    answer:
      "No. NIErnaya is strictly a team competition. Teams must have a minimum of 2 and a maximum of 3 members.",

    category: "Registration",

    sort_order: 2,

    published: true,
  },

  {
    id: "faq-3",

    question:
      "How does authentication work for team members?",

    answer:
      "Only the designated Team Leader creates and logs into the platform account. The leader registers the team members and handles submissions on behalf of the team.",

    category: "Accounts",

    sort_order: 3,

    published: true,
  },

  {
    id: "faq-4",

    question:
      "What formats and tools can we use for analytics & visualization?",

    answer:
      "You are free to use Python (Pandas, Matplotlib, Seaborn, Plotly), R, Tableau, PowerBI, D3.js, or custom WebGL visualization frameworks. Submissions are accepted in .ppt, .pptx, or .pdf format.",

    category: "Submissions",

    sort_order: 4,

    published: true,
  },

  /*{
    id: "faq-5",

    question:
      "How are faculty mentors allocated?",

    answer:
      "The committee allocates teams across the faculty mentors. You can view your assigned faculty member on your dashboard after allocation is published.",

    category: "Mentorship",

    sort_order: 5,

    published: true,
  },*/
];


// ============================================================
// FACULTY / ORGANIZERS
// ============================================================

export const FACULTY_ORGANIZERS: OrganizerMember[] = [
  {
    id: "fac-1",
    name: "Dr. Anitha Raghavendra",
    role: "Faculty Mentor",
    designation: "Professor",
    department: "Computer Science and Engineering",
    email: "anitharaghavendra@nie.ac.in",
    phone: "+91 9845932547",
    sort_order: 1,
    published: true,
  },
  {
    id: "fac-2",
    name: "Mr. Nishanth R",
    role: "Faculty Mentor",
    designation: "Assistant Professor",
    department: "Computer Science and Engineering",
    email: "nishanthr@nie.ac.in",
    phone: "+91 9686341445",
    sort_order: 2,
    published: true,
  },
  {
    id: "fac-3",
    name: "Mr. Manoj N Sogi",
    role: "Faculty Mentor",
    designation: "Assistant Professor",
    department: "Computer Science and Engineering",
    email: "manojnsogi@nie.ac.in",
    phone: "+91 7411115352",
    sort_order: 3,
    published: true,
  },
  {
    id: "fac-4",
    name: "Ms. Kavitha S",
    role: "Faculty Mentor",
    designation: "Assistant Professor",
    department: "Computer Science and Engineering",
    email: "kavithas@nie.ac.in",
    phone: "+91 8971995058",
    sort_order: 4,
    published: true,
  },
  {
    id: "fac-5",
    name: "Ms. Sneha S",
    role: "Faculty Mentor",
    designation: "Assistant Professor",
    department: "Computer Science and Engineering",
    email: "snehas@nie.ac.in",
    phone: "+91 7795002623",
    sort_order: 5,
    published: true,
  },
  {
    id: "fac-6",
    name: "Ms. Deepashree M",
    role: "Faculty Mentor",
    designation: "Assistant Professor",
    department: "Computer Science and Engineering",
    email: "deepashreem@nie.ac.in",
    phone: "+91 8861576007",
    sort_order: 6,
    published: true,
  },
  {
    id: "fac-7",
    name: "Ms. Aishwarya K M",
    role: "Faculty Mentor",
    designation: "Assistant Professor",
    department: "Computer Science and Engineering",
    email: "kmaishwarya@nie.ac.in",
    phone: "+91 8762600760",
    sort_order: 7,
    published: true,
  },
];

// ============================================================
// QUICK LOOKUP / AGGREGATES
// ============================================================

export const TOTAL_PRIZE_POOL =
  PRIZES_DATA.reduce(
    (total, prize) => total + prize.amount_num,
    0
  );

export const TOTAL_FACULTY_COUNT =
  FACULTY_ORGANIZERS.length;

export const TOTAL_PHASE_COUNT =
  PHASES_DATA.length;

export const TOTAL_TIMELINE_EVENTS =
  TIMELINE_EVENTS.length;

export const TOTAL_RULE_COUNT =
  RULES_DATA.length;

export const TOTAL_FAQ_COUNT =
  FAQ_DATA.length;