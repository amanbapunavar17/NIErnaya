import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Clock3,
  ExternalLink,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

import {
  supabase,
  isSupabaseConfigured,
} from '../../../lib/supabase/client';

type ContactConfig = {
  id?: string;
  email: string;
  phone: string;
  address: string;
  northCampusVenue: string;
  southCampusVenue: string;
  whatsappCommunityLink: string;
  workingHours: string;
};

const FALLBACK_CONTACT: ContactConfig = {
  email: 'nishanthr@nie.ac.in',
  phone: '9686341445',
  address:
    'The National Institute of Engineering, Manandavadi Road, Mysuru, Karnataka 570008',
  northCampusVenue:
    'NIE North Campus (CSE / AIML Block), Koorgalli, Mysuru',
  southCampusVenue:
    'NIE South Campus (ECE, EEE, ME, CV Tech Center), Manandavadi Rd, Mysuru',
  whatsappCommunityLink:
    'https://chat.whatsapp.com/JGsWjeav6U47BbcKrxBdyb',
  workingHours:
    '09:00 AM – 05:00 PM IST (MON–SAT)',
};

const normalizeContact = (
  row: Record<string, unknown>,
): ContactConfig => ({
  id: typeof row.id === 'string' ? row.id : undefined,

  email:
    typeof row.email === 'string' && row.email.trim()
      ? row.email.trim()
      : FALLBACK_CONTACT.email,

  phone:
    typeof row.phone === 'string' && row.phone.trim()
      ? row.phone.trim()
      : FALLBACK_CONTACT.phone,

  address:
    typeof row.address === 'string' && row.address.trim()
      ? row.address.trim()
      : FALLBACK_CONTACT.address,

  northCampusVenue:
    typeof row.north_campus_venue === 'string' &&
    row.north_campus_venue.trim()
      ? row.north_campus_venue.trim()
      : FALLBACK_CONTACT.northCampusVenue,

  southCampusVenue:
    typeof row.south_campus_venue === 'string' &&
    row.south_campus_venue.trim()
      ? row.south_campus_venue.trim()
      : FALLBACK_CONTACT.southCampusVenue,

  whatsappCommunityLink:
    typeof row.whatsapp_community_link === 'string' &&
    row.whatsapp_community_link.trim()
      ? row.whatsapp_community_link.trim()
      : FALLBACK_CONTACT.whatsappCommunityLink,

  workingHours:
    typeof row.working_hours === 'string' &&
    row.working_hours.trim()
      ? row.working_hours.trim()
      : FALLBACK_CONTACT.workingHours,
});

const mapsUrl = (venue: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    venue,
  )}`;

const directionsUrl = (venue: string) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    venue,
  )}`;

const Contact: React.FC = () => {
  const [contact, setContact] =
    useState<ContactConfig>(FALLBACK_CONTACT);

  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  const loadContact = useCallback(
    async (manual = false) => {
      if (!isSupabaseConfigured || !supabase) {
        setLoading(false);
        setIsLive(false);
        return;
      }

      try {
        if (manual) {
          setRefreshing(true);
        }

        const { data, error } = await supabase
          .from('contact_config')
          .select(`
            id,
            email,
            phone,
            address,
            north_campus_venue,
            south_campus_venue,
            whatsapp_community_link,
            working_hours,
            updated_at
          `)
          .order('updated_at', {
            ascending: false,
          })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error(
            '[Contact] contact_config error:',
            error,
          );

          setIsLive(false);
          return;
        }

        if (data) {
          setContact(
            normalizeContact(
              data as Record<string, unknown>,
            ),
          );

          setLastUpdated(
            typeof data.updated_at === 'string'
              ? data.updated_at
              : null,
          );

          setIsLive(true);
        }
      } catch (error) {
        console.error(
          '[Contact] Failed to load:',
          error,
        );

        setIsLive(false);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadContact();

    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const channel = supabase
      .channel('niernaya-contact-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_config',
        },
        () => {
          loadContact();
        },
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [loadContact]);

  const northMaps = useMemo(
    () => mapsUrl(contact.northCampusVenue),
    [contact.northCampusVenue],
  );

  const northDirections = useMemo(
    () => directionsUrl(contact.northCampusVenue),
    [contact.northCampusVenue],
  );

  const southMaps = useMemo(
    () => mapsUrl(contact.southCampusVenue),
    [contact.southCampusVenue],
  );

  const southDirections = useMemo(
    () => directionsUrl(contact.southCampusVenue),
    [contact.southCampusVenue],
  );

  const reveal = {
    hidden: {
      opacity: 0,
      y: 24,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.65,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[#05070A] px-5 py-14 sm:py-24 text-white sm:px-8 lg:px-12"
    >
      {/* subtle technical background */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.035]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              'linear-gradient(#00D9FF 1px, transparent 1px), linear-gradient(90deg, #00D9FF 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#00D9FF]/5 blur-3xl" />

      <div className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FF6A1A]/5 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{
            once: true,
            amount: 0.2,
          }}
          variants={reveal}
          className="mb-8 sm:mb-14 text-center"
        >
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-10 bg-[#00D9FF]" />

            <span className="rounded-full border border-[#00D9FF]/40 bg-[#00D9FF]/5 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#00D9FF]">
              Contact & Venues
            </span>

            <span className="h-px w-10 bg-[#00D9FF]" />
          </div>

          <h2 className="font-display text-4xl font-black uppercase tracking-tight text-white sm:text-5xl lg:text-6xl">
            CONTACT
            <span className="text-[#FF6A1A]"> & VENUES</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-[#8B96A5]">
            Reach the NIErnaya organizing team or find
            your designated NIE campus venue.
          </p>

          {/* live status */}
          <div className="mt-7 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-[#00D9FF]/25 bg-[#00D9FF]/5 px-4 py-2">
              <span className="relative flex h-2 w-2">
                {isLive && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                )}

                <span
                  className={`relative h-2 w-2 rounded-full ${
                    isLive
                      ? 'bg-green-400'
                      : 'bg-[#FF6A1A]'
                  }`}
                />
              </span>

              <Radio
                size={12}
                className="text-[#00D9FF]"
              />

              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-[#8B96A5]">
                {loading
                  ? 'SYNCING'
                  : isLive
                    ? 'LIVE FROM SUPABASE'
                    : 'SITE CONTACT'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* =====================================================
            MAIN GRID
        ===================================================== */}

        <div className="grid gap-5 lg:grid-cols-12">

          {/* ===================================================
              CONTACT CARD
          =================================================== */}

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{
              once: true,
              amount: 0.15,
            }}
            variants={reveal}
            className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F14] p-5 sm:p-7 lg:col-span-5"
          >
            <div className="absolute right-0 top-0 h-40 w-40 bg-[#FF6A1A]/5 blur-3xl" />

            <div className="relative">

              <div className="mb-7 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF6A1A]">
                    GENERAL ENQUIRIES
                  </p>

                  <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-white">
                    TALK TO THE TEAM
                  </h3>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#00D9FF]/20 bg-[#00D9FF]/5">
                  <MessageCircle
                    size={19}
                    className="text-[#00D9FF]"
                  />
                </div>
              </div>

              {/* EMAIL */}
              {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="group mb-3 block rounded-xl border border-white/10 bg-[#080B0F] p-4 transition-all duration-300 hover:border-[#00D9FF]/40"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00D9FF]/10 text-[#00D9FF]">
                    <Mail size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#66717F]">
                      EMAIL
                    </p>

                    <p className="truncate text-sm font-semibold text-[#D9E1E8]">
                      {contact.email}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-[#66717F] transition-colors group-hover:text-[#00D9FF]"
                  />
                </div>
              </a>
              )}

              {/* PHONE */}
              {contact.phone && (
              <a
                href={`tel:${contact.phone.replace(
                  /[^\d+]/g,
                  '',
                )}`}
                className="group mb-3 block rounded-xl border border-white/10 bg-[#080B0F] p-4 transition-all duration-300 hover:border-[#00D9FF]/40"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF6A1A]/10 text-[#FF6A1A]">
                    <Phone size={17} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="mb-1 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#66717F]">
                      PHONE
                    </p>

                    <p className="text-sm font-semibold text-[#D9E1E8]">
                      {contact.phone}
                    </p>
                  </div>

                  <ArrowUpRight
                    size={15}
                    className="text-[#66717F] transition-colors group-hover:text-[#FF6A1A]"
                  />
                </div>
              </a>
              )}

              {/* WHATSAPP */}
              {contact.whatsappCommunityLink && (
              <a
                href={contact.whatsappCommunityLink}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-5 flex items-center justify-between rounded-xl border border-[#FF6A1A]/40 bg-[#FF6A1A]/10 p-4 transition-all duration-300 hover:bg-[#FF6A1A]/15"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FF6A1A] text-[#05070A]">
                    <MessageCircle size={18} />
                  </div>

                  <div>
                    <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#FF6A1A]">
                      COMMUNITY
                    </p>

                    <p className="mt-1 text-sm font-bold text-white">
                      Join WhatsApp Community
                    </p>
                  </div>
                </div>

                <ExternalLink
                  size={16}
                  className="text-[#FF6A1A]"
                />
              </a>
              )}
            </div>
          </motion.div>

          {/* ===================================================
              RIGHT SIDE
          =================================================== */}

          <div className="grid gap-5 sm:grid-cols-2 lg:col-span-7">

            {/* NORTH */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.15,
              }}
              variants={reveal}
              className="rounded-2xl border border-white/10 bg-[#0B0F14] p-6 transition-all duration-300 hover:border-[#00D9FF]/30"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#00D9FF]/10 text-[#00D9FF]">
                  <MapPin size={19} />
                </div>

                <span className="rounded-md border border-[#00D9FF]/20 bg-[#00D9FF]/5 px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-wider text-[#00D9FF]">
                  CSE / AIML
                </span>
              </div>

              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF6A1A]">
                NORTH CAMPUS
              </p>

              <h3 className="mt-2 text-2xl font-black uppercase text-white">
                NORTH
              </h3>

              <p className="mt-4 min-h-[72px] text-xs leading-5 text-[#8B96A5]">
                {contact.northCampusVenue}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <a
                  href={northMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#00D9FF] px-3 py-3 font-mono text-[9px] font-black uppercase tracking-wider text-[#05070A] transition-all hover:brightness-110"
                >
                  <MapPin size={13} />
                  GPS
                </a>

                <a
                  href={northDirections}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3 font-mono text-[9px] font-black uppercase tracking-wider text-[#AAB4C0] transition-all hover:border-[#00D9FF]/40 hover:text-[#00D9FF]"
                >
                  <Navigation size={13} />
                  DIRECTIONS
                </a>
              </div>
            </motion.div>

            {/* SOUTH */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.15,
              }}
              variants={reveal}
              className="rounded-2xl border border-white/10 bg-[#0B0F14] p-6 transition-all duration-300 hover:border-[#FF6A1A]/30"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#FF6A1A]/10 text-[#FF6A1A]">
                  <MapPin size={19} />
                </div>

                <span className="rounded-md border border-[#FF6A1A]/20 bg-[#FF6A1A]/5 px-2.5 py-1 font-mono text-[8px] font-bold uppercase tracking-wider text-[#FF6A1A]">
                  ECE / EEE / ME
                </span>
              </div>

              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-[#FF6A1A]">
                SOUTH CAMPUS
              </p>

              <h3 className="mt-2 text-2xl font-black uppercase text-white">
                SOUTH
              </h3>

              <p className="mt-4 min-h-[72px] text-xs leading-5 text-[#8B96A5]">
                {contact.southCampusVenue}
              </p>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <a
                  href={southMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6A1A] px-3 py-3 font-mono text-[9px] font-black uppercase tracking-wider text-[#05070A] transition-all hover:brightness-110"
                >
                  <MapPin size={13} />
                  GPS
                </a>

                <a
                  href={southDirections}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-3 font-mono text-[9px] font-black uppercase tracking-wider text-[#AAB4C0] transition-all hover:border-[#FF6A1A]/40 hover:text-[#FF6A1A]"
                >
                  <Navigation size={13} />
                  DIRECTIONS
                </a>
              </div>
            </motion.div>

            {/* ADDRESS */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.15,
              }}
              variants={reveal}
              className="rounded-2xl border border-white/10 bg-[#0B0F14] p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/5 text-[#00D9FF]">
                  <MapPin size={17} />
                </div>

                <div>
                  <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#FF6A1A]">
                    INSTITUTE ADDRESS
                  </p>

                  <p className="mt-3 text-xs leading-5 text-[#8B96A5]">
                    {contact.address}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* HOURS */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{
                once: true,
                amount: 0.15,
              }}
              variants={reveal}
              className="rounded-2xl border border-[#FF6A1A]/20 bg-[#FF6A1A]/5 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF6A1A]/10 text-[#FF6A1A]">
                  <Clock3 size={17} />
                </div>

                <div>
                  <p className="font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-[#FF6A1A]">
                    WORKING HOURS
                  </p>

                  <p className="mt-3 text-xs font-semibold leading-5 text-[#D9E1E8]">
                    {contact.workingHours}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* =====================================================
            FOOTER STATUS
        ===================================================== */}

        <motion.div
          initial={{
            opacity: 0,
          }}
          whileInView={{
            opacity: 1,
          }}
          viewport={{
            once: true,
          }}
          className="mt-6 flex flex-col gap-3 rounded-xl border border-white/5 bg-[#080B0F] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00D9FF]/5">
              <Radio
                size={13}
                className="text-[#00D9FF]"
              />
            </div>

            <div>
              <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-[#66717F]">
                CONTACT CONFIGURATION
              </p>

              <p className="mt-1 text-[10px] text-[#59636F]">
                {isLive
                  ? lastUpdated
                    ? `Synced ${new Date(
                        lastUpdated,
                      ).toLocaleString('en-IN')}`
                    : 'Connected to Supabase'
                  : 'Using fallback configuration'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadContact(true)}
            disabled={refreshing}
            className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 font-mono text-[9px] font-bold uppercase tracking-wider text-[#8B96A5] transition-all hover:border-[#00D9FF]/40 hover:text-[#00D9FF] disabled:opacity-40"
          >
            <RefreshCw
              size={12}
              className={
                refreshing
                  ? 'animate-spin'
                  : ''
              }
            />

            REFRESH
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export { Contact };
export default Contact;