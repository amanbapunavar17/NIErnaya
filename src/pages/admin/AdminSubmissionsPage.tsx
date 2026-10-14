import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  FileText,
  CheckCircle,
  Search,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  AlertCircle,
  Loader2,
  UploadCloud,
  X,
  Settings2,
  Unlock,
  Power,
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

type SubmissionStatus =
  | 'submitted'
  | 'reviewed'
  | 'shortlisted'
  | 'rejected';

type Submission = {
  id: string;
  team_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  submitted_at: string;
  submitted_by: string;
  status: SubmissionStatus;
  created_at?: string;
  updated_at?: string;
};

type Team = {
  id: string;
  team_code: string;
  team_name: string;
  campus: string;
  mode: string;
  registration_status: string;
};

type SubmissionView = Submission & {
  team: Team | null;
};

export const AdminSubmissionsPage: React.FC = () => {
  const [submissions, setSubmissions] = useState<
    SubmissionView[]
  >([]);

  const [searchTerm, setSearchTerm] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState<'all' | SubmissionStatus>('all');

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState<
    string | null
  >(null);

  const [success, setSuccess] = useState<
    string | null
  >(null);

  const [actionId, setActionId] = useState<
    string | null
  >(null);

  const [previewSubmission, setPreviewSubmission] =
    useState<SubmissionView | null>(null);

  const [registeredTeams, setRegisteredTeams] =
    useState<Team[]>([]);

  // =========================================================
  // TEAM-SPECIFIC SUBMISSION ACCESS
  // =========================================================

const [teamAccesses, setTeamAccesses] = useState<
  Record<
    string,
    {
      globalOpen: boolean;
      teamOverrideOpen: boolean;
      currentlyAccepting: boolean;
      overrideExpiresAt: string | null;
      overrideReason: string | null;
    }
  >
>({});

const [accessLoadingId, setAccessLoadingId] =
  useState<string | null>(null);

const [overrideTeam, setOverrideTeam] =
  useState<SubmissionView | null>(null);

const [overrideMinutes, setOverrideMinutes] =
  useState(30);

const [overrideReason, setOverrideReason] =
  useState(
    'Administrative technical exception'
  );
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
      setSuccess(null);
    }, 3500);
  };

  // =========================================================
  // LOAD SUBMISSIONS
  // =========================================================

  const loadSubmissions = useCallback(
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
        /*
         * We intentionally fetch submissions and teams
         * separately rather than relying on generated
         * relationship typing.
         *
         * This keeps the frontend resilient to the current
         * Supabase schema.
         */

        const {
          data: submissionData,
          error: submissionError,
        } = await supabase
          .from('submissions')
          .select(`
            id,
            team_id,
            storage_path,
            file_name,
            file_type,
            file_size,
            submitted_at,
            submitted_by,
            status,
            created_at,
            updated_at
          `)
          .order('submitted_at', {
            ascending: false,
          });

        if (submissionError) {
          throw submissionError;
        }

        const rawSubmissions =
          (submissionData || []) as Submission[];

        // No submissions = keep the submission table empty,
        // but still load all registered teams for access control.
        if (rawSubmissions.length === 0) {
          setSubmissions([]);
          await loadRegisteredTeams();
          return;
        }

        const teamIds = Array.from(
          new Set(
            rawSubmissions.map(
              (submission) =>
                submission.team_id
            )
          )
        );

        const {
          data: teamData,
          error: teamError,
        } = await supabase
          .from('teams')
          .select(`
            id,
            team_code,
            team_name,
            campus,
            mode,
            registration_status
          `)
          .in('id', teamIds);

        if (teamError) {
          throw teamError;
        }

        const teams = (teamData || []) as Team[];

        const teamMap = new Map<
          string,
          Team
        >();

        teams.forEach((team) => {
          teamMap.set(team.id, team);
        });

        const mapped: SubmissionView[] =
          rawSubmissions.map(
            (submission) => ({
              ...submission,
              team:
                teamMap.get(
                  submission.team_id
                ) || null,
            })
          );

        setSubmissions(mapped);

        // Load access for every registered team, not only teams
        // that already have a submission.
        await loadRegisteredTeams();
      } catch (err: any) {
        setError(
          err?.message ||
            'Failed to load submissions from Supabase.'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
          },
    []
  );

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  // =========================================================
  // FILTERING
  // =========================================================

  const filtered = useMemo(() => {
    const query =
      searchTerm.trim().toLowerCase();

    return submissions.filter(
      (submission) => {
        const teamCode =
          submission.team?.team_code
            ?.toLowerCase() || '';

        const teamName =
          submission.team?.team_name
            ?.toLowerCase() || '';

        const fileName =
          submission.file_name?.toLowerCase() ||
          '';

        const matchesSearch =
          !query ||
          teamCode.includes(query) ||
          teamName.includes(query) ||
          fileName.includes(query);

        const matchesStatus =
          statusFilter === 'all' ||
          submission.status ===
            statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    submissions,
    searchTerm,
    statusFilter,
  ]);

  // =========================================================
  // FILE SIZE
  // =========================================================

  const formatFileSize = (
    bytes: number
  ) => {
    if (!bytes || bytes <= 0) {
      return '0 KB';
    }

    const mb =
      bytes / (1024 * 1024);

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  };

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (
    date: string
  ) => {
    try {
      return new Date(
        date
      ).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return date;
    }
  };

  // =========================================================
  // FILE TYPE LABEL
  // =========================================================

  const getFileTypeLabel = (
    submission: Submission
  ) => {
    const type =
      submission.file_type?.toLowerCase() ||
      '';

    if (type.includes('pdf')) {
      return 'PDF';
    }

    if (
      type.includes('presentation') ||
      type.includes('powerpoint')
    ) {
      return submission.file_name
        .toLowerCase()
        .endsWith('.pptx')
        ? 'PPTX'
        : 'PPT';
    }

    const extension =
      submission.file_name
        .split('.')
        .pop();

    return extension
      ? extension.toUpperCase()
      : 'FILE';
  };

  // =========================================================
  // STATUS STYLING
  // =========================================================

  const getStatusClass = (
    status: SubmissionStatus
  ) => {
    switch (status) {
      case 'submitted':
        return 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30';

      case 'reviewed':
        return 'bg-[#36D9FF]/15 text-[#36D9FF] border-[#36D9FF]/30';

      case 'shortlisted':
        return 'bg-[#8B5CF6]/15 text-[#A78BFA] border-[#8B5CF6]/30';

      case 'rejected':
        return 'bg-red-500/15 text-red-400 border-red-500/30';

      default:
        return 'bg-white/5 text-[#8B96A5] border-white/10';
    }
  };

  // =========================================================
  // DOWNLOAD / VIEW FILE
  // =========================================================

  const openSubmissionFile = async (
    submission: SubmissionView,
    mode: 'view' | 'download'
  ) => {
    if (!supabase) {
      setError(
        'Supabase is not configured.'
      );
      return;
    }

    clearMessages();
    setActionId(submission.id);

    try {
      /*
       * The bucket is PRIVATE.
       *
       * Therefore we create a short-lived signed URL
       * rather than exposing a public storage URL.
       */

      const {
        data,
        error: signedUrlError,
      } = await supabase.storage
        .from('drushtix-submissions')
        .createSignedUrl(
          submission.storage_path,
          60 * 10
        );

      if (signedUrlError) {
        throw signedUrlError;
      }

      if (!data?.signedUrl) {
        throw new Error(
          'Unable to generate a secure file URL.'
        );
      }

      /*
       * Both PDF and PowerPoint files can be opened
       * through the browser depending on browser support.
       *
       * For DOWNLOAD we still open the signed URL in a
       * new tab because the private signed URL is the
       * safest cross-browser behaviour for this stage.
       */
      window.open(
        data.signedUrl,
        '_blank',
        'noopener,noreferrer'
      );

      if (mode === 'download') {
        showSuccess(
          `Secure file access opened for "${submission.file_name}".`
        );
      }
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to access the submitted file.'
      );
    } finally {
      setActionId(null);
    }
  };

  // =========================================================
// LOAD TEAM SUBMISSION ACCESS
// =========================================================

const loadTeamSubmissionAccess = async (
  teamId: string
) => {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured.'
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    'get_team_submission_access',
    {
      p_team_id: teamId,
    }
  );

  if (error) {
    throw error;
  }

  const access = Array.isArray(data)
    ? data[0]
    : data;

  setTeamAccesses((current) => ({
    ...current,
    [teamId]: {
      globalOpen: Boolean(
        access?.global_open
      ),
      teamOverrideOpen: Boolean(
        access?.team_override_open
      ),
      currentlyAccepting: Boolean(
        access?.currently_accepting
      ),
      overrideExpiresAt:
        access?.override_expires_at ??
        null,
      overrideReason:
        access?.override_reason ??
        null,
    },
  }));

  return access;
};

// =========================================================
// LOAD ALL REGISTERED TEAMS
// =========================================================

const loadRegisteredTeams = async () => {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured.'
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('teams')
    .select(`
      id,
      team_code,
      team_name,
      campus,
      mode,
      registration_status
    `)
    .in(
      'registration_status',
      ['submitted', 'locked']
    )
    .order(
      'team_code',
      {
        ascending: true,
      }
    );

  if (error) {
    throw error;
  }

  setRegisteredTeams(
    (data ?? []) as typeof registeredTeams
  );

  // Load access state for every team
  await Promise.all(
    (data ?? []).map(
      async (team) => {
        try {
          await loadTeamSubmissionAccess(
            team.id
          );
        } catch (err) {
          console.warn(
            `Unable to load submission access for ${team.team_code}`,
            err
          );
        }
      }
    )
  );
};

// =========================================================
// DELETE SUBMISSION
// =========================================================

const deleteSubmission = async (
  submission: SubmissionView
) => {
  if (!supabase) {
    setError('Supabase is not configured.');
    return;
  }

  const teamName =
    submission.team?.team_name ||
    submission.team?.team_code ||
    'this team';

  const confirmed = window.confirm(
    `Delete the submission "${submission.file_name}" from ${teamName}?\n\n` +
      `This will remove the database record and the stored file.\n\n` +
      `This action cannot be undone.`
  );

  if (!confirmed) return;

  clearMessages();
  setActionId(submission.id);

  try {
    // -------------------------------------------------------
    // 1. Delete submission metadata through secured RPC
    // -------------------------------------------------------

    const { data, error: rpcError } =
      await supabase.rpc(
        'admin_delete_submission',
        {
          p_submission_id: submission.id,
        }
      );

    if (rpcError) {
      throw rpcError;
    }

    // -------------------------------------------------------
    // 2. Remove physical file from Supabase Storage
    // -------------------------------------------------------

    const storagePath =
      submission.storage_path ||
      (data as any)?.storage_path;

    if (storagePath) {
      const {
        error: storageError,
      } = await supabase.storage
        .from('drushtix-submissions')
        .remove([storagePath]);

      if (storageError) {
        console.warn(
          'Submission metadata deleted, but storage cleanup failed:',
          storageError
        );

        showSuccess(
          `Submission "${submission.file_name}" deleted. Storage cleanup requires attention.`
        );
      } else {
        showSuccess(
          `Submission "${submission.file_name}" deleted successfully.`
        );
      }
    } else {
      showSuccess(
        `Submission "${submission.file_name}" deleted successfully.`
      );
    }

    // -------------------------------------------------------
    // 3. Remove from current UI immediately
    // -------------------------------------------------------

    setSubmissions((current) =>
      current.filter(
        (item) => item.id !== submission.id
      )
    );

    setPreviewSubmission((current) =>
      current?.id === submission.id
        ? null
        : current
    );

  } catch (err: any) {
    console.error(
      'Delete submission error:',
      err
    );

    setError(
      err?.message ||
        'Failed to delete the submission.'
    );
  } finally {
    setActionId(null);
  }
};
  // =========================================================
  // LOADING STATE
  // =========================================================

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Phase Submissions Hub
          </h1>

          <p className="text-xs text-[#8B96A5] mt-1">
            Loading live submission records from Supabase...
          </p>
        </div>

        <div className="min-h-[360px] rounded-2xl bg-[#0D1219] border border-white/10 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-[#36D9FF] animate-spin" />

          <span className="text-xs font-mono text-[#8B96A5] uppercase tracking-wider">
            Loading submissions...
          </span>
        </div>
      </div>
    );
  }

  // =========================================================
// OPEN TEAM SUBMISSION ACCESS
// =========================================================

const openTeamSubmission = async (
  submission: SubmissionView
) => {
  if (!supabase) {
    setError(
      'Supabase is not configured.'
    );
    return;
  }

  const teamId =
    submission.team?.id;

  if (!teamId) {
    setError(
      'Team information is unavailable.'
    );
    return;
  }

  clearMessages();

  setAccessLoadingId(teamId);

  try {
    const {
      data,
      error: rpcError,
    } = await supabase.rpc(
      'admin_open_team_submission',
      {
        p_team_id: teamId,
        p_minutes: overrideMinutes,
        p_reason:
          overrideReason.trim() ||
          'Administrative technical exception',
      }
    );

    if (rpcError) {
      throw rpcError;
    }

    await loadTeamSubmissionAccess(
      teamId
    );

    setOverrideTeam(null);

    showSuccess(
      `Submission access opened for ${
        submission.team?.team_code ||
        'this team'
      } for ${overrideMinutes} minutes.`
    );

    console.log(
      'Team submission access opened:',
      data
    );
  } catch (err: any) {
    console.error(
      'Open team submission error:',
      err
    );

    setError(
      err?.message ||
        'Failed to open team submission access.'
    );
  } finally {
    setAccessLoadingId(null);
  }
};

// =========================================================
// CLOSE TEAM SUBMISSION ACCESS
// =========================================================

const closeTeamSubmission = async (
  submission: SubmissionView
) => {
  if (!supabase) {
    setError(
      'Supabase is not configured.'
    );
    return;
  }

  const teamId =
    submission.team?.id;

  if (!teamId) {
    setError(
      'Team information is unavailable.'
    );
    return;
  }

  const teamCode =
    submission.team?.team_code ||
    'this team';

  const confirmed =
    window.confirm(
      `Close special submission access for ${teamCode}?\n\nThe team will immediately return to the normal submission portal state.`
    );

  if (!confirmed) {
    return;
  }

  clearMessages();
  setAccessLoadingId(teamId);

  try {
    const {
      error: rpcError,
    } = await supabase.rpc(
      'admin_close_team_submission',
      {
        p_team_id: teamId,
      }
    );

    if (rpcError) {
      throw rpcError;
    }

    await loadTeamSubmissionAccess(
      teamId
    );

    showSuccess(
      `Special submission access closed for ${teamCode}.`
    );
  } catch (err: any) {
    console.error(
      'Close team submission error:',
      err
    );

    setError(
      err?.message ||
        'Failed to close team submission access.'
    );
  } finally {
    setAccessLoadingId(null);
  }
};

  // =========================================================
  // MAIN UI
  // =========================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#36D9FF] uppercase tracking-wider font-bold mb-1">
            <UploadCloud className="w-4 h-4" />
            SUBMISSION CONTROL
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Phase Submissions Hub ({submissions.length})
          </h1>

          <p className="text-xs text-[#8B96A5] mt-1">
            Manage presentation decks, submission status, and uploaded files.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadSubmissions(true)
          }
          disabled={refreshing}
          className="self-start lg:self-auto px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-xs font-bold flex items-center gap-2 hover:border-[#36D9FF]/40 transition-all disabled:opacity-50"
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

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError(null)
            }
            className="ml-auto text-red-400/60 hover:text-red-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />

          <span>{success}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Total
          </div>

          <div className="text-2xl font-display font-black text-white mt-1">
            {submissions.length}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Submitted
          </div>

          <div className="text-2xl font-display font-black text-[#10B981] mt-1">
            {
              submissions.filter(
                (s) =>
                  s.status ===
                  'submitted'
              ).length
            }
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Reviewed
          </div>

          <div className="text-2xl font-display font-black text-[#36D9FF] mt-1">
            {
              submissions.filter(
                (s) =>
                  s.status ===
                  'reviewed'
              ).length
            }
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Shortlisted
          </div>

          <div className="text-2xl font-display font-black text-[#A78BFA] mt-1">
            {
              submissions.filter(
                (s) =>
                  s.status ===
                  'shortlisted'
              ).length
            }
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Rejected
          </div>

          <div className="text-2xl font-display font-black text-red-400 mt-1">
            {
              submissions.filter(
                (s) =>
                  s.status ===
                  'rejected'
              ).length
            }
          </div>
        </div>
      </div>
              {/* =====================================================
    TEAM SUBMISSION ACCESS CONTROL
===================================================== */}

<div className="rounded-2xl bg-[#0D1219] border border-white/10 overflow-hidden">

  <div className="p-5 border-b border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">

    <div>
      <div className="flex items-center gap-2 text-[#FF7A30]">
        <Settings2 className="w-4 h-4" />

        <span className="text-xs font-mono font-bold uppercase tracking-wider">
          Team Submission Access
        </span>
      </div>

      <p className="text-[10px] text-[#8B96A5] mt-1">
        Temporarily open submission access for an individual team without opening the global portal.
      </p>
    </div>

    <div className="px-3 py-2 rounded-xl bg-[#121A23] border border-white/5 text-[10px] font-mono text-[#8B96A5]">
      ADMIN OVERRIDE CONTROL
    </div>

  </div>

  <div className="p-5">

    {registeredTeams.length === 0 ? (

      <div className="p-6 rounded-xl bg-[#121A23] border border-white/5 text-center">

        <FileText className="w-7 h-7 text-[#8B96A5] mx-auto mb-2" />

        <p className="text-xs text-white font-semibold">
          No registered teams available
        </p>

        <p className="text-[10px] text-[#8B96A5] mt-1">
          Team-specific submission controls will appear for registered teams.
        </p>

      </div>

    ) : (

      <div className="space-y-3">

        {registeredTeams.map(
  (teamItem) => {
    const access =
      teamAccesses[
        teamItem.id
      ];

    const submission =
      submissions.find(
        (item) =>
          item.team?.id ===
          teamItem.id
      );

    const busy =
      accessLoadingId ===
      teamItem.id;

    return (
      <div
        key={`access-${teamItem.id}`}
        className="p-4 rounded-xl bg-[#121A23] border border-white/5"
      >
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">

          {/* TEAM */}
          <div>
            <div className="flex items-center gap-2">

              <span className="text-[#FF7A30] font-mono text-xs font-bold">
                {teamItem.team_code}
              </span>

              {submission && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[8px] font-mono font-bold">
                  SUBMITTED
                </span>
              )}

            </div>

            <div className="text-sm text-white font-semibold mt-1">
              {teamItem.team_name}
            </div>

            <div className="text-[9px] text-[#8B96A5] font-mono mt-1 uppercase">
              {teamItem.campus}
              {' · '}
              Offline
            </div>
          </div>

          {/* ACCESS STATUS */}
          <div className="flex flex-wrap items-center gap-2">

            {access?.globalOpen ? (

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="w-2 h-2 rounded-full bg-[#36D9FF] animate-pulse" />

                <span className="text-[10px] font-mono font-bold text-[#36D9FF]">
                  GLOBAL OPEN
                </span>
              </div>

            ) : access?.teamOverrideOpen ? (

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/30">

                <span className="w-2 h-2 rounded-full bg-[#FF7A30] animate-pulse" />

                <span className="text-[10px] font-mono font-bold text-[#FF7A30]">
                  TEAM OVERRIDE ACTIVE
                </span>

              </div>

            ) : (

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">

                <span className="w-2 h-2 rounded-full bg-red-400" />

                <span className="text-[10px] font-mono font-bold text-red-400">
                  CLOSED
                </span>

              </div>

            )}

          </div>

          {/* ACTION */}
          <div>

            {access?.globalOpen ? (

              <button
                type="button"
                disabled
                className="px-4 py-2.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-[#36D9FF]/60 text-[10px] font-mono font-bold cursor-not-allowed"
              >
                GLOBAL ACCESS ACTIVE
              </button>

            ) : access?.teamOverrideOpen ? (

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const fakeSubmission =
                    submission ?? {
                      id: '',
                      team: teamItem,
                    } as SubmissionView;

                  void closeTeamSubmission(
                    fakeSubmission
                  );
                }}
                className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-[10px] font-mono font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Power className="w-3.5 h-3.5" />
                )}

                CLOSE TEAM ACCESS
              </button>

            ) : (

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  const fakeSubmission =
                    submission ?? {
                      id: '',
                      team: teamItem,
                    } as SubmissionView;

                  setOverrideTeam(
                    fakeSubmission
                  );
                }}
                className="px-4 py-2.5 rounded-xl bg-[#FF7A30]/10 border border-[#FF7A30]/30 text-[#FF7A30] hover:bg-[#FF7A30]/20 text-[10px] font-mono font-bold flex items-center gap-2 disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Unlock className="w-3.5 h-3.5" />
                )}

                OPEN TEAM ACCESS
              </button>

            )}

          </div>

        </div>

        {/* EXPIRY */}
        {access?.teamOverrideOpen &&
          access.overrideExpiresAt && (

            <div className="mt-3 pt-3 border-t border-white/5 flex flex-col sm:flex-row gap-2 sm:gap-6">

              <div className="text-[10px] font-mono text-[#8B96A5]">
                EXPIRES:{' '}
                <span className="text-orange-300">
                  {new Date(
                    access.overrideExpiresAt
                  ).toLocaleString(
                    'en-IN'
                  )}
                </span>
              </div>

              {access.overrideReason && (
                <div className="text-[10px] text-[#8B96A5]">
                  REASON:{' '}
                  <span className="text-white">
                    {access.overrideReason}
                  </span>
                </div>
              )}

            </div>

          )}

      </div>
    );
  }
)}

      </div>
    )}
</div>
      {/* Search + Filter */}
      <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

            <input
              type="text"
              placeholder="Search by team code, squad name, or uploaded file name..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white placeholder:text-[#8B96A5]/50 focus:outline-none focus:border-[#36D9FF]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target
                  .value as
                  | 'all'
                  | SubmissionStatus
              )
            }
            className="lg:w-48 px-3.5 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#36D9FF]"
          >
            <option value="all">
              ALL STATUSES
            </option>

            <option value="submitted">
              SUBMITTED
            </option>

            <option value="reviewed">
              REVIEWED
            </option>

            <option value="shortlisted">
              SHORTLISTED
            </option>

            <option value="rejected">
              REJECTED
            </option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-[#0D1219] border border-white/10 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono min-w-[1100px]">
            <thead className="bg-[#121A23] text-[#8B96A5] uppercase border-b border-white/5">
              <tr>
                <th className="p-4">
                  Squad ID & Name
                </th>

                <th className="p-4">
                  Uploaded File
                </th>

                <th className="p-4">
                  File Size
                </th>

                <th className="p-4">
                  Submitted At
                </th>

                <th className="p-4">
                  Submission Details
                </th>

                <th className="p-4">
                  Status
                </th>

                <th className="p-4 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 text-[#F5F7FA]">
              {filtered.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center"
                  >
                    <FileText className="w-10 h-10 text-[#8B96A5] mx-auto mb-3" />

                    <div className="text-sm text-white font-semibold">
                      {submissions.length ===
                      0
                        ? 'No submissions uploaded yet.'
                        : 'No submissions match your filters.'}
                    </div>

                    <div className="text-[10px] text-[#8B96A5] font-mono mt-1">
                      {submissions.length ===
                      0
                        ? 'Uploaded team presentations will appear here.'
                        : 'Try changing the search term or status filter.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map(
                  (submission) => (
                    <tr
                      key={
                        submission.id
                      }
                      className="hover:bg-[#121A23]/50 transition-colors"
                    >
                      {/* Team */}
                      <td className="p-4 font-bold">
                        <div className="text-[#FF7A30] font-mono text-xs">
                          {submission.team
                            ?.team_code ||
                            'UNKNOWN'}
                        </div>

                        <div className="text-white font-sans text-sm font-semibold">
                          {submission
                            .team
                            ?.team_name ||
                            'Unknown Team'}
                        </div>

                        {submission.team && (
                          <div className="text-[9px] text-[#8B96A5] font-mono mt-1 uppercase">
                            {submission
                              .team
                              .campus}{' '}
                            ·{' '}
Offline
                          </div>
                        )}
                      </td>

                      {/* File */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#36D9FF] shrink-0" />

                          <div className="min-w-0">
                            <div className="truncate max-w-[240px]">
                              {
                                submission.file_name
                              }
                            </div>

                            <div className="text-[9px] text-[#8B96A5] mt-0.5">
                              {getFileTypeLabel(
                                submission
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="p-4 whitespace-nowrap">
                        {formatFileSize(
                          submission.file_size
                        )}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-[10px] text-[#8B96A5] whitespace-nowrap">
                        {formatDate(
                          submission.submitted_at
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-[9px] uppercase font-bold border ${getStatusClass(
                            submission.status
                          )}`}
                        >
                          {
                            submission.status
                          }
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View */}
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewSubmission(
                                submission
                              )
                            }
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[#8B96A5] hover:text-white hover:border-white/20 transition-colors inline-flex items-center gap-1 font-bold"
                            title="View submission details"
                          >
                            <Eye className="w-3 h-3" />

                            <span>
                              VIEW
                            </span>
                          </button>

                          {/* Download */}
                          <button
                            type="button"
                            disabled={
                              actionId ===
                              submission.id
                            }
                            onClick={() =>
                              openSubmissionFile(
                                submission,
                                'download'
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-[#36D9FF]/20 border border-[#36D9FF]/40 text-[#36D9FF] hover:bg-[#36D9FF]/30 transition-colors inline-flex items-center gap-1 font-bold disabled:opacity-50"
                          >
                            {actionId ===
                            submission.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Download className="w-3 h-3" />
                            )}

                            <span>
                              DOWNLOAD
                            </span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            disabled={
                              actionId ===
                              submission.id
                            }
                            onClick={() =>
                              deleteSubmission(
                                submission
                              )
                            }
                            className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                            title="Delete submission"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =====================================================
    OPEN TEAM ACCESS MODAL
===================================================== */}

{overrideTeam && (
  <div
    className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={() =>
      setOverrideTeam(null)
    }
  >

    <div
      className="w-full max-w-md rounded-3xl bg-[#0D1219] border border-[#FF7A30]/30 shadow-2xl overflow-hidden"
      onClick={(e) =>
        e.stopPropagation()
      }
    >

      {/* HEADER */}

      <div className="p-5 border-b border-white/10">

        <div className="flex items-center gap-2 text-[#FF7A30]">

          <Unlock className="w-4 h-4" />

          <span className="text-[10px] font-mono font-bold tracking-wider">
            TEAM SUBMISSION OVERRIDE
          </span>

        </div>

        <h2 className="font-display font-bold text-xl text-white mt-2">
          Open Team Access
        </h2>

        <p className="text-[10px] text-[#8B96A5] mt-1">
          Temporarily allow this team to submit even when the global portal is closed.
        </p>

      </div>

      {/* BODY */}

      <div className="p-5 space-y-5">

        {/* TEAM */}

        <div className="p-4 rounded-xl bg-[#121A23] border border-white/5">

          <div className="text-[9px] font-mono text-[#8B96A5] uppercase">
            Team
          </div>

          <div className="text-[#FF7A30] font-mono font-bold mt-1">
            {overrideTeam.team?.team_code ||
              'UNKNOWN'}
          </div>

          <div className="text-sm text-white font-semibold mt-0.5">
            {overrideTeam.team?.team_name ||
              'Unknown Team'}
          </div>

        </div>

        {/* DURATION */}

        <div>

          <label className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Access Duration
          </label>

          <select
            value={overrideMinutes}
            onChange={(e) =>
              setOverrideMinutes(
                Number(e.target.value)
              )
            }
            className="w-full mt-2 px-3 py-3 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none focus:border-[#FF7A30]"
          >

            <option value={15}>
              15 MINUTES
            </option>

            <option value={30}>
              30 MINUTES
            </option>

            <option value={45}>
              45 MINUTES
            </option>

            <option value={60}>
              60 MINUTES
            </option>

            <option value={90}>
              90 MINUTES
            </option>

            <option value={120}>
              120 MINUTES
            </option>

            <option value={180}>
              180 MINUTES
            </option>

          </select>

        </div>

        {/* REASON */}

        <div>

          <label className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Reason
          </label>

          <textarea
            value={overrideReason}
            onChange={(e) =>
              setOverrideReason(
                e.target.value
              )
            }
            rows={3}
            className="w-full mt-2 px-3 py-3 rounded-xl bg-[#121A23] border border-white/10 text-xs text-white placeholder:text-[#8B96A5]/50 focus:outline-none focus:border-[#FF7A30] resize-none"
            placeholder="Why is special access being granted?"
          />

        </div>

        {/* WARNING */}

        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">

          <div className="flex gap-2">

            <AlertCircle className="w-4 h-4 text-[#FF7A30] shrink-0" />

            <p className="text-[10px] text-[#8B96A5] leading-relaxed">

              This override affects only this team.
              Other teams will continue following the
              normal submission portal state.

            </p>

          </div>

        </div>

      </div>

      {/* FOOTER */}

      <div className="p-5 border-t border-white/10 flex flex-col sm:flex-row gap-2">

        <button
          type="button"
          onClick={() =>
            setOverrideTeam(null)
          }
          className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[#8B96A5] hover:text-white text-xs font-mono"
        >
          CANCEL
        </button>

        <button
          type="button"
          onClick={() =>
            void openTeamSubmission(
              overrideTeam
            )
          }
          disabled={
            accessLoadingId ===
            overrideTeam.team?.id
          }
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#FF7A30] text-[#07090D] text-xs font-mono font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >

          {accessLoadingId ===
          overrideTeam.team?.id ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              OPENING...
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4" />
              OPEN ACCESS
            </>
          )}

        </button>

      </div>

    </div>

  </div>
)}

      {/* Preview Modal */}
      {previewSubmission && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() =>
            setPreviewSubmission(null)
          }
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-[#0D1219] border border-white/10 shadow-2xl overflow-hidden"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <div>
                <div className="text-[10px] font-mono text-[#36D9FF] uppercase tracking-wider">
                  Submission Details
                </div>

                <h2 className="font-display font-bold text-lg text-white mt-1">
                  {previewSubmission
                    .team?.team_name ||
                    'Unknown Team'}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPreviewSubmission(
                    null
                  )
                }
                className="p-2 rounded-lg bg-white/5 text-[#8B96A5] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[#121A23] border border-white/5">
                  <div className="text-[9px] font-mono text-[#8B96A5] uppercase">
                    Team Code
                  </div>

                  <div className="text-sm text-[#FF7A30] font-bold mt-1">
                    {previewSubmission
                      .team
                      ?.team_code ||
                      '—'}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#121A23] border border-white/5">
                  <div className="text-[9px] font-mono text-[#8B96A5] uppercase">
                    File
                  </div>

                  <div className="text-sm text-white font-semibold mt-1 break-all">
                    {
                      previewSubmission.file_name
                    }
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#121A23] border border-white/5">
                  <div className="text-[9px] font-mono text-[#8B96A5] uppercase">
                    File Size
                  </div>

                  <div className="text-sm text-white font-semibold mt-1">
                    {formatFileSize(
                      previewSubmission.file_size
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#121A23] border border-white/5">
                  <div className="text-[9px] font-mono text-[#8B96A5] uppercase">
                    Submitted
                  </div>

                  <div className="text-sm text-white font-semibold mt-1">
                    {formatDate(
                      previewSubmission.submitted_at
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#121A23] border border-white/5">
                  <div className="text-[9px] font-mono text-[#8B96A5] uppercase">
                    Status
                  </div>

                  <div className="mt-2">
                    <span
                      className={`px-2 py-1 rounded text-[9px] uppercase font-bold border ${getStatusClass(
                        previewSubmission.status
                      )}`}
                    >
                      {
                        previewSubmission.status
                      }
                    </span>
                  </div>
                </div>
                </div>

              {/* Storage path */}
              <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                <div className="text-[9px] font-mono text-[#8B96A5] uppercase mb-1">
                  Secure Storage Path
                </div>

                <div className="text-[10px] text-[#8B96A5] font-mono break-all">
                  {
                    previewSubmission.storage_path
                  }
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() =>
                  setPreviewSubmission(
                    null
                  )
                }
                className="px-4 py-2 rounded-xl bg-white/5 text-[#8B96A5] hover:text-white text-xs font-mono"
              >
                CLOSE
              </button>

              <button
                type="button"
                onClick={() =>
                  openSubmissionFile(
                    previewSubmission,
                    'view'
                  )
                }
                disabled={
                  actionId ===
                  previewSubmission.id
                }
                className="px-4 py-2 rounded-xl bg-[#36D9FF]/15 border border-[#36D9FF]/30 text-[#36D9FF] hover:bg-[#36D9FF]/25 text-xs font-mono font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {actionId ===
                previewSubmission.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}

                OPEN SECURE FILE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
     </div>
  );
};