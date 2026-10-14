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
      .order('updated_at', {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        '[CommunityCTA] Failed to load WhatsApp link:',
        error,
      );
      return;
    }

    if (
      data?.whatsapp_community_link
    ) {
      setWhatsappLink(
        data.whatsapp_community_link.trim(),
      );
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
      className="relative border-t border-white/5 bg-[#07090D] px-4 py-20 md:px-8"
    >
      <div className="mx-auto max-w-6xl">

        <div className="relative flex flex-col items-center justify-between gap-8 overflow-hidden rounded-3xl border-2 border-[#FF7A30]/50 bg-gradient-to-r from-[#0D1219] via-[#121A23] to-[#0D1219] p-8 shadow-2xl shadow-[#FF7A30]/15 transition-colors duration-300 hover:border-[#FF7A30] sm:p-12 md:flex-row">

          {/* Ambient glow */}
          <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-[#FF7A30]/15 blur-[100px]" />

          <div className="relative z-10 max-w-xl space-y-4 text-center md:text-left">

            <div className="inline-flex items-center gap-2 rounded-full border border-[#10B981]/30 bg-[#10B981]/15 px-3.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[#10B981]">
              <Radio className="h-3.5 w-3.5" />
              <span>OFFICIAL COMMUNITY</span>
            </div>

            <h2 className="font-display text-3xl font-black tracking-tight text-white sm:text-4xl">
              JOIN THE NIErnaya COMMUNITY
            </h2>

            <p className="text-sm leading-relaxed text-[#8B96A5]">
              Stay connected with official event announcements, phase updates,
              mentoring information, submission notices, and important
              logistics.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 font-mono text-xs text-[#36D9FF] md:justify-start">
              <span className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                NIE Community
              </span>

              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                NIErnaya Participants
              </span>
            </div>
          </div>

          {whatsappLink && (
          <div className="relative z-10 shrink-0">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Join the NIErnaya WhatsApp Community"
              className="flex items-center gap-3 rounded-full border border-[#25D366] bg-[#25D366] px-8 py-4 font-display text-sm font-black uppercase tracking-wider text-[#07090D] shadow-xl shadow-[#25D366]/25 transition-all hover:scale-105 hover:bg-[#20bd5a] active:scale-95"
            >
              <MessageCircle className="h-5 w-5 fill-current" />

              <span>JOIN COMMUNITY</span>

              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
          )}
        </div>

      </div>
    </section>
  );
};

export default CommunityCTA;