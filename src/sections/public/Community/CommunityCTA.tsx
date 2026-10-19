
import React, { useCallback, useEffect, useState } from 'react';
import {
  MessageCircle,
  ArrowRight,
  Shield,
  Users,
  Radio,
} from 'lucide-react';

import {
  supabase,
  isSupabaseConfigured,
} from '../../../lib/supabase/client';

const FALLBACK_WHATSAPP = '';

export const CommunityCTA: React.FC = () => {
  const [whatsappLink, setWhatsappLink] =
    useState(FALLBACK_WHATSAPP);

  const loadWhatsAppLink = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const { data, error } = await supabase
      .from('contact_config')
      .select('whatsapp_community_link')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        '[CommunityCTA] Failed to load WhatsApp link:',
        error,
      );
      return;
    }

    if (data?.whatsapp_community_link) {
      setWhatsappLink(data.whatsapp_community_link.trim());
    }
  }, []);

  useEffect(() => {
    loadWhatsAppLink();

    if (!isSupabaseConfigured || !supabase) {
      return;
    }

    const channel = supabase
      .channel('niernaya-community-whatsapp-live')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_config',
        },
        () => {
          loadWhatsAppLink();
        },
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [loadWhatsAppLink]);

  return (
    <section
      id="community"
      className="relative border-t border-white/5 bg-[#07090D] px-4 py-8 sm:px-6 md:px-8 md:py-10"
    >
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[28px] border border-[#FF7A30]/80 bg-gradient-to-br from-[#0D141C] via-[#10151C] to-[#1B1718] p-6 transition-colors duration-300 hover:border-[#FF7A30] sm:p-8 lg:p-10">

          {/* Ambient glow */}
          <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-[#FF7A30]/10 blur-[100px]" />

          <div className="relative z-10 flex flex-col items-start justify-between gap-7 lg:flex-row lg:items-center lg:gap-10">

            {/* Left: Community information */}
            <div className="min-w-0 flex-1 space-y-4">

              <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/10 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-[#10B981]">
                <Radio className="h-4 w-4" />
                <span>OFFICIAL COMMUNITY</span>
              </div>

              <h2 className="font-display text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl lg:text-4xl">
                JOIN THE NIErnaya COMMUNITY
              </h2>

              <p className="max-w-3xl text-sm leading-7 text-[#AAB3C0] sm:text-base">
                Stay connected with official event announcements, phase
                updates, mentoring information, submission notices, and
                important logistics.
              </p>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1 font-mono text-xs font-bold text-[#36D9FF]">
                <span className="inline-flex items-center gap-2">
                  <Shield className="h-4 w-4 shrink-0" />
                  NIE Community
                </span>

                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  NIErnaya Participants
                </span>
              </div>
            </div>

            {/* Right: WhatsApp community button */}
            {whatsappLink && (
              <div className="relative z-10 w-full shrink-0 lg:w-auto">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Join the NIErnaya WhatsApp Community"
                  className="group flex min-h-[68px] w-full items-center justify-center gap-4 rounded-full border border-[#25D366] bg-[#25D366] px-7 py-5 font-display text-sm font-black uppercase tracking-wide text-[#07090D] shadow-[0_12px_30px_rgba(37,211,102,0.22)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#20bd5a] hover:shadow-[0_16px_36px_rgba(37,211,102,0.3)] active:scale-[0.98] sm:px-9 lg:w-auto lg:min-w-[316px]"
                >
                  <MessageCircle className="h-5 w-5 shrink-0 fill-current" />

                  <span className="whitespace-nowrap">
                    JOIN COMMUNITY
                  </span>

                  <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
                </a>
              </div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
};

export default CommunityCTA;
