import React, { useCallback, useEffect, useState } from 'react';
import { Radio, FileText } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

interface Announcement {
  id: string;
  title: string;
  message: string;
  published: boolean;
  created_at?: string;
  attachment_path?: string | null;
}

export const AnnouncementTicker: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnnouncements = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setAnnouncements([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('id, title, message, published, created_at, attachment_path')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Announcement ticker loading error:', error);
        setAnnouncements([]);
        return;
      }
      setAnnouncements((data ?? []) as Announcement[]);
    } catch (error) {
      console.error('Unexpected announcement loading error:', error);
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnnouncements();
    if (!supabase) return;

    const channel = supabase
      .channel('public-announcements-ticker')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        void loadAnnouncements();
      })
      .subscribe();

    return () => {
  if (supabase) {
    void supabase.removeChannel(channel);
  }
};
  }, [loadAnnouncements]);

  const openAttachment = async (path: string) => {
    if (!supabase) return;
    // Open a blank tab immediately to avoid browser popup blocking while the signed URL is requested.
    const newTab = window.open('about:blank', '_blank');
    if (!newTab) {
      console.error('The browser blocked opening the PDF tab.');
      return;
    }
    newTab.opener = null;
    newTab.document.title = 'Opening announcement PDF…';
    try {
      const { data, error } = await supabase.storage
        .from('announcement-pdfs')
        .createSignedUrl(path, 60 * 60);
      if (error || !data?.signedUrl) throw error || new Error('Could not create PDF link.');
      newTab.location.href = data.signedUrl;
    } catch (error) {
      newTab.close();
      console.error('Announcement PDF opening error:', error);
    }
  };

  if (loading || announcements.length === 0) return null;

  return (
    <div className="w-full bg-[#FF7A30] text-[#07090D] overflow-hidden flex items-center h-8 z-40 relative text-xs font-bold font-mono tracking-wider border-b border-black/20">
      <div className="flex items-center gap-1.5 bg-[#07090D] text-[#FF7A30] px-3.5 h-full z-10 shrink-0 shadow-md">
        <Radio className="w-3.5 h-3.5 animate-pulse text-[#36D9FF]" />
        <span className="tracking-widest uppercase text-[11px]">LATEST NEWS</span>
      </div>
      <div className="flex whitespace-nowrap overflow-hidden flex-1 relative items-center">
        <div className="flex animate-marquee items-center gap-10 pl-4">
          {[...announcements, ...announcements].map((announcement, index) => {
            const content = (
              <span className="flex items-center gap-2">
                <span className="opacity-60">•</span>
                <span className="uppercase">{announcement.title}:</span>
                <span className="font-medium text-[#07090D]/90">{announcement.message}</span>
                {announcement.attachment_path && <FileText className="w-3.5 h-3.5 shrink-0" aria-label="PDF attachment" />}
              </span>
            );
            return announcement.attachment_path ? (
              <button
                key={`${announcement.id}-${index}`}
                type="button"
                onClick={() => void openAttachment(announcement.attachment_path!)}
                title="Open attached PDF in a new tab"
                className="cursor-pointer text-left hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[#07090D] rounded-sm"
              >
                {content}
              </button>
            ) : (
              <span key={`${announcement.id}-${index}`}>{content}</span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
