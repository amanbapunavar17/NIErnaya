import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  Calendar,
  CheckCircle,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  Loader2,
  Save,
  Clock,
  UploadCloud,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';

import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

type PhaseStatus =
  | 'upcoming'
  | 'active'
  | 'completed'
  | 'hidden';

type TimelineStatus =
  | 'upcoming'
  | 'active'
  | 'completed';

type Phase = {
  id: string;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  focus: string;
  description: string;
  campus_info: string | null;
  status: PhaseStatus;
  sort_order: number;
  public_visible: boolean;
};

type TimelineEvent = {
  id: string;
  phase_id: string | null;
  station_number: string;
  title: string;
  description: string | null;
  event_date: string | null;
  status: TimelineStatus;
  sort_order: number;
  public_visible: boolean;
};

type PhaseDraft = Pick<Phase, 'name' | 'start_date' | 'end_date' | 'status'>;
type TimelineDraft = Pick<TimelineEvent, 'title' | 'event_date' | 'status'>;

type SubmissionPortalState = {
  submission_open: boolean;
  submission_start: string | null;
  submission_end: string | null;
  currently_accepting: boolean;
};

export const AdminPhasesPage: React.FC = () => {
  const [phases, setPhases] = useState<Phase[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [phaseDrafts, setPhaseDrafts] = useState<Record<string, PhaseDraft>>({});
  const [timelineDrafts, setTimelineDrafts] = useState<Record<string, TimelineDraft>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [savingId, setSavingId] =
    useState<string | null>(null);

  const [timelineSavingId, setTimelineSavingId] =
    useState<string | null>(null);

  const [submissionOpen, setSubmissionOpen] =
    useState(false);

  const [submissionAccepting, setSubmissionAccepting] =
    useState(false);

  const [submissionLoading, setSubmissionLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  // =========================================================
  // MESSAGE HELPERS
  // =========================================================

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const showSuccess = (message: string) => {
    setSuccess(message);
    setError(null);

    window.setTimeout(() => {
      setSuccess((current) =>
        current === message ? null : current
      );
    }, 3500);
  };

  // =========================================================
  // LOAD PHASES
  // =========================================================

  const loadPhases = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase is not configured.'
      );
    }

    const {
      data,
      error: phaseError,
    } = await supabase
      .from('phases')
      .select(`
        id,
        name,
        slug,
        start_date,
        end_date,
        focus,
        description,
        campus_info,
        status,
        sort_order,
        public_visible
      `)
      .order('sort_order', {
        ascending: true,
      });

    if (phaseError) {
      throw phaseError;
    }

    const loadedPhases = (data || []) as Phase[];
    setPhases(loadedPhases);
    setPhaseDrafts(Object.fromEntries(loadedPhases.map((phase) => [phase.id, { name: phase.name, start_date: phase.start_date, end_date: phase.end_date, status: phase.status }])));
  }, []);

  // =========================================================
  // LOAD TIMELINE
  // =========================================================

  const loadTimeline = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error(
        'Supabase is not configured.'
      );
    }

    const {
      data,
      error: timelineError,
    } = await supabase
      .from('timeline_events')
      .select(`
        id,
        phase_id,
        station_number,
        title,
        description,
        event_date,
        status,
        sort_order,
        public_visible
      `)
      .order('sort_order', {
        ascending: true,
      });

    if (timelineError) {
      throw timelineError;
    }

    const loadedTimeline = (data || []) as TimelineEvent[];
    setTimeline(loadedTimeline);
    setTimelineDrafts(Object.fromEntries(loadedTimeline.map((event) => [event.id, { title: event.title, event_date: event.event_date, status: event.status }])));
  }, []);

  // =========================================================
  // LOAD SUBMISSION PORTAL
  // =========================================================

  const loadSubmissionPortal =
    useCallback(async () => {
      if (!isSupabaseConfigured || !supabase) {
        throw new Error(
          'Supabase is not configured.'
        );
      }

      const {
        data,
        error: portalError,
      } = await supabase.rpc(
        'get_submission_portal_status'
      );

      if (portalError) {
        throw portalError;
      }

      /*
       * get_submission_portal_status()
       * returns TABLE(...)
       *
       * Supabase therefore normally returns:
       *
       * [
       *   {
       *     submission_open: true,
       *     currently_accepting: true
       *   }
       * ]
       *
       * Never use Boolean(data) here because
       * Boolean([]) / Boolean({}) is true.
       */

      const portal =
        Array.isArray(data)
          ? (data[0] as SubmissionPortalState | undefined)
          : (data as SubmissionPortalState | null);

      setSubmissionOpen(
        Boolean(portal?.submission_open)
      );

      setSubmissionAccepting(
        Boolean(portal?.currently_accepting)
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
          'Supabase is not configured. Check your environment variables.'
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
          loadPhases(),
          loadTimeline(),
          loadSubmissionPortal(),
        ]);
      } catch (err: any) {
        setError(
          err?.message ||
            'Failed to load event configuration.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      loadPhases,
      loadTimeline,
      loadSubmissionPortal,
    ]
  );

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  // =========================================================
  // OPEN / CLOSE SUBMISSION PORTAL
  // =========================================================

  const handleSubmissionPortalToggle =
    async () => {
      if (!supabase) {
        setError(
          'Supabase is not configured.'
        );
        return;
      }

      const nextState = !submissionOpen;

      const confirmed = window.confirm(
        nextState
          ? 'Open the Submission Portal?\n\nTeam leaders will immediately be allowed to upload their PPT/PPTX/PDF submissions.'
          : 'Close the Submission Portal?\n\nStudents will no longer be able to upload new submissions until you open it again.'
      );

      if (!confirmed) {
        return;
      }

      clearMessages();
      setSubmissionLoading(true);

      try {
        /*
         * IMPORTANT:
         *
         * Do NOT use:
         *
         * setSubmissionOpen(Boolean(data))
         *
         * because the RPC returns a row/object.
         *
         * We already know what state we requested,
         * so after the RPC succeeds we set the UI to
         * that exact state and then re-read Supabase.
         */

        if (nextState) {
          const {
            error: rpcError,
          } = await supabase.rpc(
            'open_submission_portal'
          );

          if (rpcError) {
            throw rpcError;
          }
        } else {
          const {
            error: rpcError,
          } = await supabase.rpc(
            'close_submission_portal'
          );

          if (rpcError) {
            throw rpcError;
          }
        }

        // Immediate UI update
        setSubmissionOpen(nextState);

        // Reset accepting state temporarily.
        // It will be replaced by the real DB value below.
        setSubmissionAccepting(nextState);

        /*
         * Re-read the actual server state.
         * This guarantees the UI matches Supabase.
         */
        await loadSubmissionPortal();

        showSuccess(
          nextState
            ? 'Submission Portal is now OPEN. Team leaders can submit their project files.'
            : 'Submission Portal is now CLOSED. New submissions are disabled.'
        );
      } catch (err: any) {
        setError(
          err?.message ||
            'Failed to change Submission Portal state.'
        );

        /*
         * If the operation failed, reload the actual
         * backend state instead of trusting local state.
         */
        try {
          await loadSubmissionPortal();
        } catch {
          // Keep original error visible.
        }
      } finally {
        setSubmissionLoading(false);
      }
    };

  // =========================================================
  // PHASE DRAFTS + SAVE
  // =========================================================

  const updatePhaseDraft = <K extends keyof PhaseDraft>(
    id: string,
    field: K,
    value: PhaseDraft[K]
  ) => {
    setPhaseDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  };

  const handleSavePhase = async (id: string) => {
    if (!supabase) return;
    const draft = phaseDrafts[id];
    const original = phases.find((phase) => phase.id === id);
    if (!draft || !original) return;
    if (!draft.name.trim()) {
      setError('Phase name cannot be empty.');
      return;
    }
    if (!draft.start_date || !draft.end_date || draft.start_date > draft.end_date) {
      setError('Choose valid phase start and end dates.');
      return;
    }

    clearMessages();
    setSavingId(id);
    try {
      const { error: updateError } = await supabase
        .from('phases')
        .update({
          name: draft.name.trim(),
          start_date: draft.start_date,
          end_date: draft.end_date,
          status: draft.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (updateError) throw updateError;

      // Keep public Event Journey entries linked to this phase in sync.
      const timelineStatus: TimelineStatus =
        draft.status === 'completed' ? 'completed' :
        draft.status === 'active' ? 'active' : 'upcoming';
      const linkedEvent = timeline
        .filter((event) => event.phase_id === id)
        .sort((a, b) => a.sort_order - b.sort_order)[0];
      if (linkedEvent) {
        const { error: timelineSyncError } = await supabase
          .from('timeline_events')
          .update({
            title: linkedEvent.title.includes(':')
              ? linkedEvent.title.replace(/^[^:]+:\s*/, `${draft.name.trim()}: `)
              : draft.name.trim(),
            event_date: draft.start_date,
            status: timelineStatus,
            public_visible: draft.status !== 'hidden' && original.public_visible,
            updated_at: new Date().toISOString(),
          })
          .eq('id', linkedEvent.id);
        if (timelineSyncError) throw timelineSyncError;
      }

      await refreshData(true);
      showSuccess(`${draft.name.trim()} saved and synchronized with the public timeline.`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save phase settings.');
    } finally {
      setSavingId(null);
    }
  };

  // =========================================================
  // PHASE VISIBILITY
  // =========================================================

  const handleToggleVisibility =
    async (
      id: string,
      current: boolean
    ) => {
      if (!supabase) return;

      clearMessages();
      setSavingId(id);

      try {
        const {
          error: updateError,
        } = await supabase
          .from('phases')
          .update({
            public_visible: !current,
          })
          .eq('id', id);

        if (updateError) {
          throw updateError;
        }

        setPhases((currentPhases) =>
          currentPhases.map((phase) =>
            phase.id === id
              ? {
                  ...phase,
                  public_visible:
                    !current,
                }
              : phase
          )
        );

        showSuccess(
          `Phase is now ${
            !current
              ? 'public'
              : 'hidden'
          }.`
        );
      } catch (err: any) {
        setError(
          err?.message ||
            'Failed to update phase visibility.'
        );
      } finally {
        setSavingId(null);
      }
    };

  // =========================================================
  // TIMELINE DRAFTS + SAVE
  // =========================================================

  const updateTimelineDraft = <K extends keyof TimelineDraft>(
    id: string,
    field: K,
    value: TimelineDraft[K]
  ) => {
    setTimelineDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  };

  const handleSaveTimelineEvent = async (id: string) => {
    if (!supabase) return;
    const draft = timelineDrafts[id];
    if (!draft || !draft.title.trim()) {
      setError('Timeline event name cannot be empty.');
      return;
    }

    clearMessages();
    setTimelineSavingId(id);
    try {
      const { error: updateError } = await supabase
        .from('timeline_events')
        .update({
          title: draft.title.trim(),
          event_date: draft.event_date || null,
          status: draft.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (updateError) throw updateError;
      await refreshData(true);
      showSuccess('Event timeline settings saved.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save timeline settings.');
    } finally {
      setTimelineSavingId(null);
    }
  };

  // =========================================================
  // TIMELINE VISIBILITY
  // =========================================================

  const handleTimelineVisibility =
    async (
      id: string,
      current: boolean
    ) => {
      if (!supabase) return;

      clearMessages();
      setTimelineSavingId(id);

      try {
        const {
          error: updateError,
        } = await supabase
          .from('timeline_events')
          .update({
            public_visible: !current,
          })
          .eq('id', id);

        if (updateError) {
          throw updateError;
        }

        setTimeline((currentEvents) =>
          currentEvents.map((event) =>
            event.id === id
              ? {
                  ...event,
                  public_visible:
                    !current,
                }
              : event
          )
        );

        showSuccess(
          `Timeline event ${
            !current
              ? 'published'
              : 'hidden'
          }.`
        );
      } catch (err: any) {
        setError(
          err?.message ||
            'Failed to update timeline visibility.'
        );
      } finally {
        setTimelineSavingId(null);
      }
    };

    // =========================================================
  // DATE FORMATTER
  // =========================================================

  const formatDate = (date: string) => {
    try {
      return new Date(
        date
      ).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return date;
    }
  };

  // =========================================================
  // PHASE STATUS CLASS
  // =========================================================

  const getPhaseStatusClass = (
    status: PhaseStatus
  ) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/15 text-green-400 border-green-500/30';

      case 'completed':
        return 'bg-[#36D9FF]/15 text-[#36D9FF] border-[#36D9FF]/30';

      case 'hidden':
        return 'bg-red-500/15 text-red-400 border-red-500/30';

      default:
        return 'bg-[#FF7A30]/15 text-[#FF7A30] border-[#FF7A30]/30';
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#36D9FF] animate-spin" />

          <span className="text-xs font-mono text-[#8B96A5]">
            LOADING EVENT CONTROL...
          </span>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#36D9FF] uppercase tracking-wider font-bold mb-1">
            <Calendar className="w-4 h-4" />
            EVENT CONTROL
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Phases & Timeline Controller
          </h1>

          <p className="text-xs text-[#8B96A5] mt-1">
            Edit phase names, dates, and status, manage the public Event Journey, and control submissions.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void refreshData(true)
          }
          disabled={refreshing}
          className="self-start px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-xs font-bold flex items-center gap-2 hover:border-[#36D9FF]/40 transition-all disabled:opacity-50"
        >
          <RefreshCw
            className={
              refreshing
                ? 'w-4 h-4 animate-spin'
                : 'w-4 h-4'
            }
          />

          {refreshing
            ? 'REFRESHING...'
            : 'REFRESH'}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SUCCESS */}
      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* =====================================================
          SUBMISSION PORTAL CONTROL
      ===================================================== */}

      <section className="relative overflow-hidden rounded-3xl bg-[#0D1219] border border-white/10">
        <div
          className={`absolute inset-0 pointer-events-none ${
            submissionOpen
              ? 'bg-green-500/[0.035]'
              : 'bg-red-500/[0.025]'
          }`}
        />

        <div className="relative p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">

            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                  submissionOpen
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                {submissionOpen ? (
                  <Unlock className="w-7 h-7 text-green-400" />
                ) : (
                  <Lock className="w-7 h-7 text-red-400" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-black text-xl text-white">
                    Submission Portal
                  </h2>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[9px] font-mono font-black border ${
                      submissionOpen
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {submissionOpen
                      ? 'OPEN'
                      : 'CLOSED'}
                  </span>
                </div>

                <p className="text-xs text-[#8B96A5] mt-1 max-w-xl">
                  Control when team leaders can upload
                  their official PPT, PPTX or PDF
                  submission.
                </p>

                <div className="flex items-center gap-2 mt-3 text-[10px] font-mono text-[#8B96A5]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#36D9FF]" />
                  Server-side Supabase control
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                void handleSubmissionPortalToggle()
              }
              disabled={submissionLoading}
              className={`min-w-[190px] px-6 py-4 rounded-2xl font-display font-black text-sm tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${
                submissionOpen
                  ? 'bg-red-500/15 border border-red-500/40 text-red-300 hover:bg-red-500/25'
                  : 'bg-green-500/15 border border-green-500/40 text-green-300 hover:bg-green-500/25'
              }`}
            >
              {submissionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : submissionOpen ? (
                <Lock className="w-5 h-5" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}

              {submissionLoading
                ? 'UPDATING...'
                : submissionOpen
                  ? 'CLOSE PORTAL'
                  : 'OPEN PORTAL'}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">

            {/* CURRENT STATE */}
            <div className="p-3 rounded-xl bg-[#121A23] border border-white/5">
              <p className="text-[9px] font-mono text-[#8B96A5]">
                CURRENT STATE
              </p>

              <p
                className={`text-sm font-display font-bold mt-1 ${
                  submissionAccepting
                    ? 'text-green-400'
                    : 'text-red-400'
                }`}
              >
                {submissionAccepting
                  ? 'ACCEPTING SUBMISSIONS'
                  : 'NOT ACCEPTING'}
              </p>
            </div>

            {/* FILE TYPES */}
            <div className="p-3 rounded-xl bg-[#121A23] border border-white/5">
              <p className="text-[9px] font-mono text-[#8B96A5]">
                ALLOWED FILES
              </p>

              <p className="text-sm font-display font-bold text-white mt-1">
                PPT / PPTX / PDF
              </p>
            </div>

            {/* MAX SIZE */}
            <div className="p-3 rounded-xl bg-[#121A23] border border-white/5">
              <p className="text-[9px] font-mono text-[#8B96A5]">
                MAXIMUM SIZE
              </p>

              <p className="text-sm font-display font-bold text-white mt-1">
                20 MB
              </p>
            </div>

          </div>

          {/* SCHEDULE WARNING */}
          {submissionOpen &&
            !submissionAccepting && (
              <div className="mt-4 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-[10px] font-mono">
                Portal is manually OPEN, but the configured
                submission time window is currently inactive.
              </div>
            )}
        </div>
      </section>

      {/* =====================================================
          PHASES
      ===================================================== */}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-white">
            Event Phases
          </h2>

          <span className="text-[10px] font-mono text-[#8B96A5]">
            {phases.length} PHASE
            {phases.length === 1 ? '' : 'S'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-xs font-bold text-[#FF7A30]">
                  {phase.name}
                </span>

                <button
                  type="button"
                  disabled={
                    savingId === phase.id
                  }
                  onClick={() =>
                    void handleToggleVisibility(
                      phase.id,
                      phase.public_visible
                    )
                  }
                  className="text-xs font-mono text-[#8B96A5] flex items-center gap-1"
                >
                  {phase.public_visible ? (
                    <Eye className="w-3.5 h-3.5 text-green-400" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5 text-red-400" />
                  )}

                  {phase.public_visible
                    ? 'Public'
                    : 'Hidden'}
                </button>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-[9px] font-mono font-bold uppercase ${getPhaseStatusClass(
                  phase.status
                )}`}
              >
                {savingId === phase.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Clock className="w-3 h-3" />
                )}

                {phase.status}
              </span>

              <div>
                <label className="block text-[9px] font-mono text-[#8B96A5] uppercase">Phase Name</label>
                <input
                  type="text"
                  value={phaseDrafts[phase.id]?.name ?? phase.name}
                  disabled={savingId === phase.id}
                  onChange={(e) => updatePhaseDraft(phase.id, 'name', e.target.value)}
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-[#121A23] border border-white/10 text-sm font-display font-bold text-white outline-none focus:border-[#36D9FF]/50"
                />
                <h3 className="font-display font-bold text-base text-white mt-3">
                  {phase.focus}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">

  {/* START DATE */}
  <div>
    <label className="text-[9px] font-mono text-[#8B96A5] uppercase">
      Start Date
    </label>

    <div className="relative mt-1">
      <input
        type="date"
        value={phaseDrafts[phase.id]?.start_date ?? phase.start_date ?? ''}
        disabled={savingId === phase.id}
        onChange={(e) => updatePhaseDraft(phase.id, 'start_date', e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white outline-none focus:border-[#36D9FF]/50"
      />
    </div>
  </div>

  {/* END DATE */}
  <div>
    <label className="text-[9px] font-mono text-[#8B96A5] uppercase">
      End Date
    </label>

    <div className="relative mt-1">
      <input
        type="date"
        value={phaseDrafts[phase.id]?.end_date ?? phase.end_date ?? ''}
        disabled={savingId === phase.id}
        onChange={(e) => updatePhaseDraft(phase.id, 'end_date', e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white outline-none focus:border-[#36D9FF]/50"
      />
    </div>
  </div>

</div>

                <p className="text-xs text-[#8B96A5] mt-2">
                  {phase.description}
                </p>

                {phase.campus_info && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-[#121A23] border border-white/5 text-[10px] text-[#8B96A5] font-mono">
                    CAMPUS: {phase.campus_info}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-white/5">
                <label className="text-[10px] font-mono text-[#8B96A5]">
                  PHASE STATE
                </label>

                <select
                  value={phaseDrafts[phase.id]?.status ?? phase.status}
                  disabled={savingId === phase.id}
                  onChange={(e) => updatePhaseDraft(phase.id, 'status', e.target.value as PhaseStatus)}
                  className="w-full mt-2 px-3 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white"
                >
                  <option value="upcoming">
                    Upcoming
                  </option>

                  <option value="active">
                    Active
                  </option>

                  <option value="completed">
                    Completed
                  </option>

                  <option value="hidden">
                    Hidden
                  </option>
                </select>
                <button
                  type="button"
                  onClick={() => void handleSavePhase(phase.id)}
                  disabled={savingId === phase.id}
                  className="w-full mt-3 px-4 py-2.5 rounded-xl bg-[#36D9FF] text-[#07090D] text-xs font-mono font-black flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {savingId === phase.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  SAVE PHASE SETTINGS
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =====================================================
          TIMELINE
      ===================================================== */}

      <div className="p-6 rounded-3xl bg-[#0D1219] border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Event Timeline Settings
            </h2>

            <p className="text-[10px] text-[#8B96A5] font-mono mt-1">
              Edit event names, dates, and status. Changes publish to the Event Journey.
            </p>
          </div>

          <span className="text-[10px] font-mono text-[#8B96A5]">
            {timeline.length} EVENT
            {timeline.length === 1 ? '' : 'S'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono min-w-[850px]">
            <thead className="bg-[#121A23] text-[#8B96A5] uppercase">
              <tr>
                <th className="p-3">Event</th>
                <th className="p-3">Date</th>
                <th className="p-3">Event Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Visibility</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {timeline.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-[#121A23]/50"
                >
                  <td className="p-3 text-[#FF7A30] font-bold">
                    {event.sort_order}
                  </td>

                  <td className="p-3 text-white whitespace-nowrap">
  <input
    type="date"
    value={timelineDrafts[event.id]?.event_date || ''}
    disabled={timelineSavingId === event.id}
    onChange={(e) => updateTimelineDraft(event.id, 'event_date', e.target.value)}
    className="px-2.5 py-2 rounded-lg bg-[#07090D] border border-white/10 text-white text-xs font-mono outline-none focus:border-[#36D9FF]/50"
  />

  <div className="text-[9px] text-[#8B96A5] mt-1">
    {event.event_date
      ? formatDate(event.event_date)
      : 'No date'}
  </div>
</td>

                  <td className="p-3">
                    <input
                      type="text"
                      value={timelineDrafts[event.id]?.title ?? event.title}
                      disabled={timelineSavingId === event.id}
                      onChange={(e) => updateTimelineDraft(event.id, 'title', e.target.value)}
                      className="w-full min-w-[190px] px-2.5 py-2 rounded-lg bg-[#07090D] border border-white/10 text-white text-xs font-sans font-semibold outline-none focus:border-[#36D9FF]/50"
                      aria-label={`Event title for ${event.title}`}
                    />

                    {event.description && (
                      <div className="text-[10px] text-[#8B96A5] mt-1">
                        {event.description}
                      </div>
                    )}
                  </td>

                  <td className="p-3">
                    <select
                      value={timelineDrafts[event.id]?.status ?? event.status}
                      disabled={timelineSavingId === event.id}
                      onChange={(e) => updateTimelineDraft(event.id, 'status', e.target.value as TimelineStatus)}
                      className="px-2 py-1.5 rounded bg-[#07090D] border border-white/10 text-white"
                    >
                      <option value="completed">
                        Completed
                      </option>

                      <option value="active">
                        Current Active
                      </option>

                      <option value="upcoming">
                        Upcoming
                      </option>
                    </select>
                  </td>

                  <td className="p-3">
                    <button
                      type="button"
                      disabled={timelineSavingId === event.id}
                      onClick={() => void handleSaveTimelineEvent(event.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 mb-2 rounded-lg bg-[#36D9FF] text-[#07090D] text-[10px] font-black"
                    >
                      {timelineSavingId === event.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      SAVE
                    </button>
                    <button
                      type="button"
                      disabled={
                        timelineSavingId === event.id
                      }
                      onClick={() =>
                        void handleTimelineVisibility(
                          event.id,
                          event.public_visible
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold"
                    >
                      {event.public_visible ? (
                        <>
                          <Eye className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-400">
                            PUBLIC
                          </span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-red-400" />
                          <span className="text-red-400">
                            HIDDEN
                          </span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
          FOOTER NOTICE
      ===================================================== */}

      <div className="p-5 rounded-2xl bg-[#121A23] border border-[#36D9FF]/15">
        <div className="flex items-start gap-3">
          <Save className="w-5 h-5 text-[#36D9FF] shrink-0" />

          <div>
            <h3 className="font-display font-bold text-sm text-white">
              Live Configuration
            </h3>

            <p className="text-[10px] text-[#8B96A5] font-mono mt-1 leading-relaxed">
              Phase, timeline and submission portal
              settings are controlled through Supabase.
              Closing the portal immediately prevents new
              student submissions at the database level.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
};