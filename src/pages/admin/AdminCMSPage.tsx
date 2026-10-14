import React, {

  useCallback,

  useEffect,

  useState,

} from 'react';

import {

  Sliders,

  Plus,

  Trash2,

  CheckCircle,

  Bell,

  Trophy,

  Mail,

  Phone,

  MapPin,

  MessageCircle,

  Save,

  RefreshCw,

  AlertCircle,

  Loader2,

  Eye,

  EyeOff,

  FileText,
} from 'lucide-react';

import {

  supabase,

  isSupabaseConfigured,

} from '../../lib/supabase/client';

type AnnouncementPriority =

  | 'low'

  | 'medium'

  | 'high';

type Announcement = {

  id: string;

  title: string;

  message: string;

  priority: AnnouncementPriority;

  published: boolean;

  published_at: string | null;

  created_at: string;

  updated_at: string;

  attachment_path: string | null;

};

type Prize = {

  id: string;

  position: string;

  title: string;

  amount: string;

  amount_num: number | null;

  description: string | null;

  trophy_style: string | null;

  perks: unknown;

  sort_order: number;

  published: boolean;

};

type ContactConfig = {

  id: string;

  email: string;

  phone: string;

  north_campus_venue: string;

  south_campus_venue: string;

  whatsapp_community_link: string;

  working_hours: string;

  updated_at?: string;

};

export const AdminCMSPage: React.FC = () => {

  const [announcements, setAnnouncements] =

    useState<Announcement[]>([]);

  const [prizes, setPrizes] =

    useState<Prize[]>([]);

  const [contactConfig, setContactConfig] =

    useState<ContactConfig | null>(null);

  // =========================================================

  // ANNOUNCEMENT FORM

  // =========================================================

  const [annTitle, setAnnTitle] =

    useState('');

  const [annMessage, setAnnMessage] =

    useState('');

  const [annPriority, setAnnPriority] =

    useState<AnnouncementPriority>('medium');

  const [annAttachment, setAnnAttachment] =

    useState<File | null>(null);

  // =========================================================

  // CONTACT FORM

  // =========================================================

  const [contactEmail, setContactEmail] =

    useState('');

  const [contactPhone, setContactPhone] =

    useState('');

  const [northVenue, setNorthVenue] =

    useState('');

  const [southVenue, setSouthVenue] =

    useState('');

  const [whatsappLink, setWhatsappLink] =

    useState('');

  const [workingHours, setWorkingHours] =

    useState(

      '09:00 AM – 05:00 PM IST (MON–SAT)'

    );

  // =========================================================

  // UI STATE

  // =========================================================

  const [loading, setLoading] =

    useState(true);

  const [refreshing, setRefreshing] =

    useState(false);

  const [savingContact, setSavingContact] =

    useState(false);

  const [addingAnnouncement, setAddingAnnouncement] =

    useState(false);

  const [actionId, setActionId] =

    useState<string | null>(null);

  const [success, setSuccess] =

    useState<string | null>(null);

  const [error, setError] =

    useState<string | null>(null);

  // =========================================================

  // MESSAGE HELPERS

  // =========================================================

  const clearMessages = () => {

    setSuccess(null);

    setError(null);

  };

  const showSuccess = (

    message: string

  ) => {

    setSuccess(message);

    setError(null);

    window.setTimeout(() => {

      setSuccess(null);

    }, 3500);

  };

  // =========================================================

  // LOAD CONTACT CONFIG

  // =========================================================

  const loadContactConfig =

    useCallback(async () => {

      if (

        !isSupabaseConfigured ||

        !supabase

      ) {

        throw new Error(

          'Supabase is not configured.'

        );

      }

      const {

        data,

        error: contactError,

      } = await supabase

        .from('contact_config')

        .select(`

          id,

          email,

          phone,

          north_campus_venue,

          south_campus_venue,

          whatsapp_community_link,

          working_hours,

          updated_at

        `)

        .limit(1)

        .maybeSingle();

      if (contactError) {

        throw contactError;

      }

      if (data) {

        const config =

          data as ContactConfig;

        setContactConfig(config);

        setContactEmail(

          config.email || ''

        );

        setContactPhone(

          config.phone || ''

        );

        setNorthVenue(

          config.north_campus_venue || ''

        );

        setSouthVenue(

          config.south_campus_venue || ''

        );

        setWhatsappLink(

          config.whatsapp_community_link ||

            'https://chat.whatsapp.com/JGsWjeav6U47BbcKrxBdyb'

        );

        setWorkingHours(

          config.working_hours ||

            '09:00 AM – 05:00 PM IST (MON–SAT)'

        );

      }

    }, []);

  // =========================================================

  // LOAD ANNOUNCEMENTS

  // =========================================================

  const loadAnnouncements =

    useCallback(async () => {

      if (

        !isSupabaseConfigured ||

        !supabase

      ) {

        throw new Error(

          'Supabase is not configured.'

        );

      }

      const {

        data,

        error: announcementError,

      } = await supabase

        .from('announcements')

        .select(`

          id,

          title,

          message,

          priority,

          published,

          published_at,

          created_at,

          updated_at,

          attachment_path

        `)

        .order('created_at', {

          ascending: false,

        });

      if (announcementError) {

        throw announcementError;

      }

      setAnnouncements(

        (data || []) as Announcement[]

      );

    }, []);

  // =========================================================

  // LOAD PRIZES

  // =========================================================

  const loadPrizes =

    useCallback(async () => {

      if (

        !isSupabaseConfigured ||

        !supabase

      ) {

        throw new Error(

          'Supabase is not configured.'

        );

      }

      const {

        data,

        error: prizeError,

      } = await supabase

        .from('prizes')

        .select(`

          id,

          position,

          title,

          amount,

          amount_num,

          description,

          trophy_style,

          perks,

          sort_order,

          published

        `)

        .order('sort_order', {

          ascending: true,

        });

      if (prizeError) {

        throw prizeError;

      }

      setPrizes(

        (data || []) as Prize[]

      );

    }, []);

  // =========================================================

  // LOAD EVERYTHING

  // =========================================================

  const refreshData = useCallback(

    async (isRefresh = false) => {

      if (

        !isSupabaseConfigured ||

        !supabase

      ) {

        setError(

          'Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'

        );

        setLoading(false);

        return;

      }

      if (isRefresh) {

        setRefreshing(true);

      } else {

        setLoading(true);

      }

      setError(null);

      try {

        await Promise.all([

          loadContactConfig(),

          loadAnnouncements(),

          loadPrizes(),

        ]);

      } catch (err: any) {

        setError(

          err?.message ||

            'Failed to load CMS data.'

        );

      } finally {

        setLoading(false);

        setRefreshing(false);

      }

    },

    [

      loadContactConfig,

      loadAnnouncements,

      loadPrizes,

    ]

  );

  useEffect(() => {

    refreshData();

  }, [refreshData]);

  // =========================================================

  // SAVE CONTACT CONFIG

  // =========================================================

  const handleSaveContact = async (

    e: React.FormEvent

  ) => {

    e.preventDefault();

    if (!supabase) {

      setError(

        'Supabase is not configured.'

      );

      return;

    }

    clearMessages();

    const cleanEmail =

      contactEmail.trim().toLowerCase();

    const cleanPhone =

      contactPhone.trim();

    const cleanNorthVenue =

      northVenue.trim();

    const cleanSouthVenue =

      southVenue.trim();

    const cleanWhatsapp =

      whatsappLink.trim();

    const cleanWorkingHours =

      workingHours.trim();

    if (

      !cleanEmail ||

      !cleanPhone ||

      !cleanNorthVenue ||

      !cleanSouthVenue ||

      !cleanWhatsapp ||

      !cleanWorkingHours

    ) {

      setError(

        'All official contact, venue, WhatsApp, and working-hour fields are required.'

      );

      return;

    }

    if (

      !cleanEmail.endsWith('@nie.ac.in')

    ) {

      setError(

        'The official helpdesk email should use the @nie.ac.in domain.'

      );

      return;

    }

    try {

      new URL(cleanWhatsapp);

    } catch {

      setError(

        'Please enter a valid WhatsApp community URL.'

      );

      return;

    }

    setSavingContact(true);

    try {

      const payload = {

        email: cleanEmail,

        phone: cleanPhone,

        north_campus_venue:

          cleanNorthVenue,

        south_campus_venue:

          cleanSouthVenue,

        whatsapp_community_link:

          cleanWhatsapp,

        working_hours:

          cleanWorkingHours,

      };

      let updateError: any = null;

      if (contactConfig?.id) {

        const result =

          await supabase

            .from('contact_config')

            .update(payload)

            .eq(

              'id',

              contactConfig.id

            );

        updateError =

          result.error;

      } else {

        const result =

          await supabase

            .from('contact_config')

            .insert(payload);

        updateError =

          result.error;

      }

      if (updateError) {

        throw updateError;

      }

      await loadContactConfig();

      showSuccess(

        'Official contact, venue, WhatsApp, and helpdesk details updated across the platform.'

      );

    } catch (err: any) {

      setError(

        err?.message ||

          'Failed to save contact configuration.'

      );

    } finally {

      setSavingContact(false);

    }

  };

  // =========================================================

  // ADD ANNOUNCEMENT
  // =========================================================

  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    clearMessages();
    const cleanTitle = annTitle.trim();
    const cleanMessage = annMessage.trim();
    if (!cleanTitle || !cleanMessage) {
      setError('Announcement title and message are required.');
      return;
    }
    if (annAttachment && (annAttachment.type !== 'application/pdf' || !annAttachment.name.toLowerCase().endsWith('.pdf'))) {
      setError('Please select a valid PDF file.');
      return;
    }
    if (annAttachment && annAttachment.size > 10 * 1024 * 1024) {
      setError('PDF must be 10 MB or smaller.');
      return;
    }

    setAddingAnnouncement(true);
    let uploadedPath: string | null = null;
    try {
      if (annAttachment) {
        uploadedPath = `announcements/${crypto.randomUUID()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from('announcement-pdfs')
          .upload(uploadedPath, annAttachment, { contentType: 'application/pdf', upsert: false });
        if (uploadError) throw uploadError;
      }

      const { data, error: insertError } = await supabase
        .from('announcements')
        .insert({
          title: cleanTitle,
          message: cleanMessage,
          priority: annPriority,
          published: true,
          published_at: new Date().toISOString(),
          attachment_path: uploadedPath,
        })
        .select('id, title, message, priority, published, published_at, created_at, updated_at, attachment_path')
        .single();
      if (insertError) throw insertError;

      setAnnouncements(current => [data as Announcement, ...current]);
      setAnnTitle('');
      setAnnMessage('');
      setAnnPriority('medium');
      setAnnAttachment(null);
      const fileInput = document.getElementById('announcement-pdf-upload') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
      showSuccess(annAttachment ? 'Announcement and PDF broadcast to the live ticker.' : 'New announcement broadcast to the live marquee ticker.');
    } catch (err: any) {
      if (uploadedPath) {
        await supabase.storage.from('announcement-pdfs').remove([uploadedPath]).catch(() => undefined);
      }
      setError(err?.message || 'Failed to create announcement.');
    } finally {
      setAddingAnnouncement(false);
    }
  };

  const handleReplaceAnnouncementAttachment = async (announcement: Announcement, file: File | null) => {
    if (!supabase || !file) return;
    clearMessages();
    if (file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a valid PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('PDF must be 10 MB or smaller.');
      return;
    }
    setActionId(announcement.id);
    const newPath = `announcements/${announcement.id}/${crypto.randomUUID()}.pdf`;
    try {
      const { error: uploadError } = await supabase.storage.from('announcement-pdfs').upload(newPath, file, { contentType: 'application/pdf', upsert: false });
      if (uploadError) throw uploadError;
      const { error: updateError } = await supabase.from('announcements').update({ attachment_path: newPath }).eq('id', announcement.id);
      if (updateError) {
        await supabase.storage.from('announcement-pdfs').remove([newPath]);
        throw updateError;
      }
      if (announcement.attachment_path) {
        const { error: removeError } = await supabase.storage.from('announcement-pdfs').remove([announcement.attachment_path]);
        if (removeError) console.error('Old announcement PDF cleanup failed:', removeError);
      }
      setAnnouncements(current => current.map(item => item.id === announcement.id ? { ...item, attachment_path: newPath } : item));
      showSuccess('Announcement PDF uploaded/replaced successfully.');
    } catch (err: any) {
      setError(err?.message || 'Failed to upload or replace PDF.');
    } finally {
      setActionId(null);
    }
  };

  const handleRemoveAnnouncementAttachment = async (announcement: Announcement) => {
    if (!supabase || !announcement.attachment_path) return;
    if (!window.confirm(`Remove the PDF attached to "${announcement.title}"?`)) return;
    clearMessages();
    setActionId(announcement.id);
    try {
      const { error: updateError } = await supabase.from('announcements').update({ attachment_path: null }).eq('id', announcement.id);
      if (updateError) throw updateError;
      const { error: removeError } = await supabase.storage.from('announcement-pdfs').remove([announcement.attachment_path]);
      setAnnouncements(current => current.map(item => item.id === announcement.id ? { ...item, attachment_path: null } : item));
      if (removeError) {
        setError(`Attachment was detached, but storage cleanup failed: ${removeError.message}`);
      } else {
        showSuccess('Announcement PDF removed successfully.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to remove PDF attachment.');
    } finally {
      setActionId(null);
    }
  };

  // TOGGLE ANNOUNCEMENT

  // =========================================================

  const handleToggleAnnouncement =

    async (

      announcement: Announcement

    ) => {

      if (!supabase) {

        setError(

          'Supabase is not configured.'

        );

        return;

      }

      clearMessages();

      setActionId(announcement.id);

      const nextPublished =

        !announcement.published;

      try {

        const {

          error: updateError,

        } = await supabase

          .from('announcements')

          .update({

            published:

              nextPublished,

            published_at:

              nextPublished

                ? new Date().toISOString()

                : announcement.published_at,

          })

          .eq(

            'id',

            announcement.id

          );

        if (updateError) {

          throw updateError;

        }

        setAnnouncements(

          (current) =>

            current.map(

              (item) =>

                item.id ===

                announcement.id

                  ? {

                      ...item,

                      published:

                        nextPublished,

                      published_at:

                        nextPublished

                          ? new Date().toISOString()

                          : item.published_at,

                    }

                  : item

            )

        );

        showSuccess(

          `Announcement ${

            nextPublished

              ? 'published'

              : 'hidden'

          } successfully.`

        );

      } catch (err: any) {

        setError(

          err?.message ||

            'Failed to update announcement visibility.'

        );

      } finally {

        setActionId(null);

      }

    };

  // =========================================================

  // DELETE ANNOUNCEMENT

  // =========================================================

  const handleDeleteAnnouncement =

    async (

      announcement: Announcement

    ) => {

      if (!supabase) {

        setError(

          'Supabase is not configured.'

        );

        return;

      }

      const confirmed =

        window.confirm(

          `Delete announcement "${announcement.title}"?\n\nThis cannot be undone.`

        );

      if (!confirmed) {

        return;

      }

      clearMessages();

      setActionId(announcement.id);

      try {

        const {

          error: deleteError,

        } = await supabase

          .from('announcements')

          .delete()

          .eq(

            'id',

            announcement.id

          );

        if (deleteError) {

          throw deleteError;

        }

        if (announcement.attachment_path) {
          const { error: storageDeleteError } = await supabase.storage
            .from('announcement-pdfs')
            .remove([announcement.attachment_path]);
          if (storageDeleteError) console.error('Announcement PDF cleanup failed:', storageDeleteError);
        }

        setAnnouncements(

          (current) =>

            current.filter(

              (item) =>

                item.id !==

                announcement.id

            )

        );

        showSuccess(

          'Announcement deleted successfully.'

        );

      } catch (err: any) {

        setError(

          err?.message ||

            'Failed to delete announcement.'

        );

      } finally {

        setActionId(null);

      }

    };

  // =========================================================

  // LOADING

  // =========================================================

  if (loading) {

    return (

      <div className="space-y-8 max-w-6xl mx-auto">

        <div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">

            Event Website Content & Contact CMS

          </h1>

          <p className="text-xs text-[#8B96A5] mt-1">

            Loading live CMS configuration from Supabase...

          </p>

        </div>

        <div className="min-h-[360px] rounded-3xl bg-[#0D1219] border border-white/10 flex flex-col items-center justify-center gap-4">

          <Loader2 className="w-8 h-8 text-[#36D9FF] animate-spin" />

          <span className="text-xs font-mono text-[#8B96A5] uppercase tracking-wider">

            Loading CMS...

          </span>

        </div>

      </div>

    );

  }

  // =========================================================

  // MAIN UI

  // =========================================================

  return (

    <div className="space-y-8 max-w-6xl mx-auto">

      {/* Header */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

        <div>

          <div className="flex items-center gap-2 text-xs font-mono text-[#36D9FF] uppercase tracking-wider font-bold mb-1">

            <Sliders className="w-4 h-4" />

            CONTENT CONTROL

          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">

            Event Website Content & Contact CMS

          </h1>

          <p className="text-xs text-[#8B96A5] mt-1">

            Manage dynamic website content, official

            contact details, WhatsApp links, prizes,

            and marquee announcements.

          </p>

        </div>

        <button

          type="button"

          onClick={() =>

            refreshData(true)

          }

          disabled={refreshing}

          className="self-start px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-xs font-bold flex items-center gap-2 hover:border-[#36D9FF]/40 transition-all disabled:opacity-50"

        >

          <RefreshCw

            className={`w-4 h-4 ${

              refreshing

                ? 'animate-spin'

                : ''

            }`}

          />

          <span>

            {refreshing

              ? 'REFRESHING...'

              : 'REFRESH'}

          </span>

        </button>

      </div>

      {/* Error */}

      {error && (

        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">

          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <span>{error}</span>

        </div>

      )}

      {/* Success */}

      {success && (

        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex items-center gap-2">

          <CheckCircle className="w-4 h-4" />

          <span>{success}</span>

        </div>

      )}

      {/* =====================================================

          CONTACT + VENUE

          ===================================================== */}

      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border-2 border-[#36D9FF]/40 space-y-6 shadow-xl shadow-[#36D9FF]/5">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">

            <Phone className="w-5 h-5 text-[#36D9FF]" />

            <span>

              Official Helpdesk, Venues & Contact Numbers

            </span>

          </h2>

          <span className="self-start text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#36D9FF]/20 text-[#36D9FF] font-bold">

            LIVE PUBLIC DESK

          </span>

        </div>

        <form

          onSubmit={handleSaveContact}

          className="space-y-4"

        >

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

            {/* Email */}

            <div className="space-y-1">

              <label className="text-[10px] font-mono text-[#8B96A5] font-bold">

                HELPDESK OFFICIAL EMAIL

              </label>

              <div className="relative">

                <input

                  type="email"

                  value={contactEmail}

                  onChange={(e) =>

                    setContactEmail(

                      e.target.value

                    )

                  }

                  required

                  disabled={

                    savingContact

                  }

                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#36D9FF] disabled:opacity-50"

                />

                <Mail className="w-4 h-4 text-[#8B96A5] absolute left-3 top-2.5" />

              </div>

            </div>

            {/* Phone */}

            <div className="space-y-1">

              <label className="text-[10px] font-mono text-[#8B96A5] font-bold">

                SECRETARIATE PHONE NUMBER

              </label>

              <div className="relative">

                <input

                  type="text"

                  value={contactPhone}

                  onChange={(e) =>

                    setContactPhone(

                      e.target.value

                    )

                  }

                  required

                  disabled={

                    savingContact

                  }

                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#36D9FF] disabled:opacity-50"

                />

                <Phone className="w-4 h-4 text-[#8B96A5] absolute left-3 top-2.5" />

              </div>

            </div>

            {/* WhatsApp */}

            <div className="space-y-1">

              <label className="text-[10px] font-mono text-[#8B96A5] font-bold">

                OFFICIAL WHATSAPP GROUP LINK

              </label>

              <div className="relative">

                <input

                  type="url"

                  value={whatsappLink}

                  onChange={(e) =>

                    setWhatsappLink(

                      e.target.value

                    )

                  }

                  required

                  disabled={

                    savingContact

                  }

                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#25D366] disabled:opacity-50"

                />

                <MessageCircle className="w-4 h-4 text-[#25D366] absolute left-3 top-2.5" />

              </div>

            </div>

            {/* North */}

            <div className="space-y-1 sm:col-span-2">

              <label className="text-[10px] font-mono text-[#8B96A5] font-bold">

                NORTH CAMPUS VENUE DESCRIPTION

              </label>

              <div className="relative">

                <input

                  type="text"

                  value={northVenue}

                  onChange={(e) =>

                    setNorthVenue(

                      e.target.value

                    )

                  }

                  required

                  disabled={

                    savingContact

                  }

                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#36D9FF] disabled:opacity-50"

                />

                <MapPin className="w-4 h-4 text-[#FF7A30] absolute left-3 top-2.5" />

              </div>

            </div>

            {/* Working Hours */}

            <div className="space-y-1">

              <label className="text-[10px] font-mono text-[#8B96A5] font-bold">

                WORKING HOURS / AVAILABILITY

              </label>

              <input

                type="text"

                value={workingHours}

                onChange={(e) =>

                  setWorkingHours(

                    e.target.value

                  )

                }

                required

                disabled={

                  savingContact

                }

                className="w-full px-3.5 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#36D9FF] disabled:opacity-50"

              />

            </div>

            {/* South */}

            <div className="space-y-1 sm:col-span-3">

              <label className="text-[10px] font-mono text-[#8B96A5] font-bold">

                SOUTH CAMPUS VENUE DESCRIPTION

              </label>

              <div className="relative">

                <input

                  type="text"

                  value={southVenue}

                  onChange={(e) =>

                    setSouthVenue(

                      e.target.value

                    )

                  }

                  required

                  disabled={

                    savingContact

                  }

                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#36D9FF] disabled:opacity-50"

                />

                <MapPin className="w-4 h-4 text-[#FF7A30] absolute left-3 top-2.5" />

              </div>

            </div>

          </div>

          <div className="pt-2 flex justify-end">

            <button

              type="submit"

              disabled={savingContact}

              className="px-6 py-2.5 rounded-xl bg-[#36D9FF] text-[#07090D] font-mono text-xs font-bold hover:bg-[#5ce1ff] transition-all flex items-center gap-2 shadow-lg shadow-[#36D9FF]/20 disabled:opacity-50"

            >

              {savingContact ? (

                <Loader2 className="w-4 h-4 animate-spin" />

              ) : (

                <Save className="w-4 h-4" />

              )}

              <span>

                {savingContact

                  ? 'SAVING...'

                  : 'SAVE CONTACT & VENUE SETTINGS'}

              </span>

            </button>

          </div>

        </form>

      </div>

      {/* =====================================================

          ANNOUNCEMENTS

          ===================================================== */}

      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6">

        <div className="flex items-center justify-between">

          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">

            <Bell className="w-5 h-5 text-[#FF7A30]" />

            <span>

              Live Ticker Announcements (

              {announcements.length})

            </span>

          </h2>

          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#FF7A30]/20 text-[#FF7A30] font-bold">

            SYNCED WITH MARQUEE

          </span>

        </div>

        {/* Add Form */}

        <form

          onSubmit={

            handleAddAnnouncement

          }

          className="p-5 rounded-2xl bg-[#121A23] border border-white/5 space-y-4"

        >

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* Headline */}

            <div className="space-y-1 sm:col-span-2">

              <label className="text-[10px] font-mono text-[#8B96A5]">

                ANNOUNCEMENT HEADLINE

              </label>

              <input

                type="text"

                placeholder="e.g. SHORTLISTED SQUADS DECLARED"

                value={annTitle}

                onChange={(e) =>

                  setAnnTitle(

                    e.target.value

                  )

                }

                required

                disabled={

                  addingAnnouncement

                }

                className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-xs font-mono text-white placeholder:text-[#8B96A5]/40 disabled:opacity-50"

              />

            </div>

            {/* Priority */}

            <div className="space-y-1">

              <label className="text-[10px] font-mono text-[#8B96A5]">

                PRIORITY

              </label>

              <select

                value={annPriority}

                onChange={(e) =>

                  setAnnPriority(

                    e.target

                      .value as AnnouncementPriority

                  )

                }

                disabled={

                  addingAnnouncement

                }

                className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-xs font-mono text-white disabled:opacity-50"

              >

                <option value="low">

                  Low Priority

                </option>

                <option value="medium">

                  Medium Priority

                </option>

                <option value="high">

                  High Priority (Urgent)

                </option>

              </select>

            </div>

            {/* Message */}

            <div className="space-y-1 sm:col-span-3">

              <label className="text-[10px] font-mono text-[#8B96A5]">

                MESSAGE TEXT

              </label>

              <input

                type="text"

                placeholder="Details displayed across the top rotating marquee bar..."

                value={annMessage}

                onChange={(e) =>

                  setAnnMessage(

                    e.target.value

                  )

                }

                required

                disabled={

                  addingAnnouncement

                }

                className="w-full px-3 py-2 rounded-lg bg-[#07090D] border border-white/10 text-xs font-mono text-white placeholder:text-[#8B96A5]/40 disabled:opacity-50"

              />

            </div>
            <div className="space-y-1 sm:col-span-3">
              <label className="text-[10px] font-mono text-[#8B96A5]">ATTACH PDF (OPTIONAL, MAX 10 MB)</label>
              <input id="announcement-pdf-upload" type="file" accept="application/pdf,.pdf" onChange={(e) => setAnnAttachment(e.target.files?.[0] ?? null)} disabled={addingAnnouncement} className="w-full text-xs font-mono text-white file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-white/10 file:text-white" />
              {annAttachment && <span className="block text-[10px] text-[#36D9FF]">Selected: {annAttachment.name}</span>}
            </div>
          </div>
          <button type="submit"

            disabled={

              addingAnnouncement

            }

            className="px-4 py-2 rounded-xl bg-[#FF7A30] text-[#07090D] font-mono text-xs font-bold hover:bg-[#FF8C4B] transition-colors flex items-center gap-1.5 disabled:opacity-50"

          >

            {addingAnnouncement ? (

              <Loader2 className="w-3.5 h-3.5 animate-spin" />

            ) : (

              <Plus className="w-3.5 h-3.5" />

            )}

            <span>

              {addingAnnouncement

                ? 'BROADCASTING...'

                : 'BROADCAST TO TICKER'}

            </span>

          </button>

        </form>

        {/* Existing Announcements */}

        <div className="space-y-2">

          {announcements.length ===

          0 ? (

            <div className="p-8 rounded-xl bg-[#121A23] border border-white/5 text-center">

              <Bell className="w-8 h-8 text-[#8B96A5] mx-auto mb-2" />

              <div className="text-sm text-white font-semibold">

                No announcements yet

              </div>

              <div className="text-[10px] text-[#8B96A5] font-mono mt-1">

                Create the first marquee announcement

                above.

              </div>

            </div>

          ) : (

            announcements.map(

              (announcement) => (

                <div

                  key={

                    announcement.id

                  }

                  className="p-3.5 rounded-xl bg-[#121A23] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"

                >

                  <div className="space-y-1 min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <span className="font-bold text-[#FF7A30] uppercase">

                        {

                          announcement.title

                        }

                      </span>

                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#8B96A5] uppercase">

                        {

                          announcement.priority

                        }

                      </span>

                      {announcement.published ? (

                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1">

                          <Eye className="w-3 h-3" />

                          PUBLIC

                        </span>

                      ) : (

                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">

                          <EyeOff className="w-3 h-3" />

                          HIDDEN

                        </span>

                      )}

                    </div>

                    <div className="text-[#8B96A5] text-[11px]">

                      {

                        announcement.message

                      }

                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {announcement.attachment_path && <span className="text-[10px] text-[#36D9FF] flex items-center gap-1"><FileText className="w-3 h-3" /> PDF attached</span>}
                      <label className="cursor-pointer px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[#36D9FF] hover:text-white text-[10px] font-bold">
                        {announcement.attachment_path ? 'REPLACE PDF' : 'ATTACH PDF'}
                        <input type="file" accept="application/pdf,.pdf" className="hidden" disabled={actionId === announcement.id} onChange={(e) => { const file = e.target.files?.[0] ?? null; void handleReplaceAnnouncementAttachment(announcement, file); e.currentTarget.value = ''; }} />
                      </label>
                      {announcement.attachment_path && <button type="button" disabled={actionId === announcement.id} onClick={() => void handleRemoveAnnouncementAttachment(announcement)} className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:text-red-300 text-[10px] font-bold disabled:opacity-50">REMOVE PDF</button>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">

                    <button

                      type="button"

                      disabled={

                        actionId ===

                        announcement.id

                      }

                      onClick={() =>

                        handleToggleAnnouncement(

                          announcement

                        )

                      }

                      className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#8B96A5] hover:text-white text-[10px] font-bold disabled:opacity-50"

                    >

                      {actionId ===

                      announcement.id ? (

                        <Loader2 className="w-3 h-3 animate-spin" />

                      ) : announcement.published ? (

                        'HIDE'

                      ) : (

                        'PUBLISH'

                      )}

                    </button>

                    <button

                      type="button"

                      disabled={

                        actionId ===

                        announcement.id

                      }

                      onClick={() =>

                        handleDeleteAnnouncement(

                          announcement

                        )

                      }

                      className="p-1.5 text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"

                      title="Delete Announcement"

                    >

                      <Trash2 className="w-4 h-4" />

                    </button>

                  </div>

                </div>

              )

            )

          )}

        </div>

      </div>

      {/* =====================================================

          PRIZES

          ===================================================== */}

      <div className="p-6 sm:p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-4">

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">

            <Trophy className="w-5 h-5 text-[#FF7A30]" />

            <span>

              Prize Pool Configuration

            </span>

          </h2>

          <span className="text-[10px] font-mono text-[#8B96A5]">

            {prizes.length} PRIZE RECORD

            {prizes.length === 1

              ? ''

              : 'S'}

          </span>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {prizes.length === 0 ? (

            <div className="md:col-span-3 p-8 rounded-xl bg-[#121A23] border border-white/5 text-center">

              <Trophy className="w-8 h-8 text-[#8B96A5] mx-auto mb-2" />

              <div className="text-sm text-white font-semibold">

                No prize records found

              </div>

            </div>

          ) : (

            prizes.map((prize) => (

              <div

                key={prize.id}

                className="p-4 rounded-xl bg-[#121A23] border border-white/5 space-y-2 font-mono text-xs"

              >

                <div className="flex items-center justify-between gap-2">

                  <div className="text-[#FF7A30] font-bold">

                    {prize.position}

                  </div>

                  {prize.published ? (

                    <span className="text-[9px] text-green-400 flex items-center gap-1">

                      <CheckCircle className="w-3 h-3" />

                      PUBLISHED

                    </span>

                  ) : (

                    <span className="text-[9px] text-red-400">

                      HIDDEN

                    </span>

                  )}

                </div>

                <div className="text-xl font-display font-black text-white">

                  {prize.amount}

                </div>

                <div className="text-xs text-white font-semibold">

                  {prize.title}

                </div>

                {prize.description && (

                  <p className="text-[#8B96A5] text-[11px]">

                    {

                      prize.description

                    }

                  </p>

                )}

              </div>

            ))

          )}

        </div>

        <div className="pt-3 border-t border-white/5 text-[10px] text-[#8B96A5] font-mono">

          Prize records are currently displayed

          from Supabase. Prize editing can be added

          here later without changing the public

          data model.

        </div>

      </div>

      {/* CMS Notice */}

      <div className="p-5 rounded-2xl bg-[#121A23] border border-[#36D9FF]/15">

        <div className="flex items-start gap-3">

          <Sliders className="w-5 h-5 text-[#36D9FF] shrink-0 mt-0.5" />

          <div>

            <h3 className="font-display font-bold text-sm text-white">

              Live CMS

            </h3>

            <p className="text-[10px] text-[#8B96A5] font-mono mt-1 leading-relaxed">

              Contact settings and announcements are

              stored directly in Supabase. Public-facing

              components can consume the same records,

              keeping the website content synchronized

              with the Admin Control Room.

            </p>

          </div>

        </div>

      </div>

    </div>

  );

};