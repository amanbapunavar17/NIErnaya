import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  FileText,
  Clock,
  GraduationCap,
  Building2,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

type FacultyRecord = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  active?: boolean;
};

type TeamRecord = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  problem_statement?: string | null;
  selected_sdg?: number | null;
  mode: 'Offline';
  campus: 'North' | 'South';
  registration_status: string;
  locked_at?: string | null;
  created_at?: string;
};

type StudentRecord = {
  id: string;
  name: string;
  usn: string;
  email: string;
  phone?: string | null;
  branch: string;
  year: number;
  semester: number;
  section: string;
  campus: 'North' | 'South';
};

type TeamMemberRecord = {
  id: string;
  team_id: string;
  student_id: string;
  role?: string | null;
};

type SubmissionRecord = {
  id: string;
  team_id: string;
  storage_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  submitted_at: string;
  submitted_by: string;
  status: string;
};

type FacultyTeam = TeamRecord & {
  leader: StudentRecord | null;
  members: StudentRecord[];
  submission: SubmissionRecord | null;
};

export const FacultyDashboard: React.FC = () => {
  const [faculty, setFaculty] = useState<FacultyRecord | null>(null);
  const [phase1ResponseSheetUrl, setPhase1ResponseSheetUrl] = useState<string | null>(null);
  const [teams, setTeams] = useState<FacultyTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [phaseAccessMessage, setPhaseAccessMessage] =
    useState<string | null>(null);

  // ============================================================
  // SELECTED TEAM
  // ============================================================

  const selectedTeam = useMemo(
    () =>
      teams.find((team) => team.id === selectedTeamId) ??
      teams[0] ??
      null,
    [teams, selectedTeamId]
  );

  // ============================================================
  // LOAD FACULTY DASHBOARD
  // ============================================================

  const loadDashboard = useCallback(
    async (showRefreshState = false) => {
      if (!isSupabaseConfigured || !supabase) {
        setError(
          'Supabase is not configured. Check your environment variables.'
        );
        setLoading(false);
        return;
      }

      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);
        setPhaseAccessMessage(null);

        // --------------------------------------------------------
        // 1. Resolve authenticated user
        // --------------------------------------------------------

        const {
          data: {
            user,
          },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error(
            'No authenticated user found. Please sign in again.'
          );
        }

        // --------------------------------------------------------
        // 2. Resolve current faculty record
        // --------------------------------------------------------

        const {
          data: facultyId,
          error: facultyIdError,
        } = await supabase.rpc('get_current_faculty_id');

        if (facultyIdError) {
          throw facultyIdError;
        }

        if (!facultyId) {
          throw new Error(
            'Your account is not linked to an active faculty record.'
          );
        }

        const {
          data: facultyRow,
          error: facultyError,
        } = await supabase
          .from('faculty')
          .select(
            'id, name, email, phone, designation, department, active'
          )
          .eq('id', facultyId)
          .maybeSingle();

        if (facultyError) {
          throw facultyError;
        }

        if (!facultyRow) {
          throw new Error(
            'Faculty profile could not be found.'
          );
        }

        if (facultyRow.active === false) {
          throw new Error(
            'This faculty account is currently inactive.'
          );
        }

        setFaculty(facultyRow as FacultyRecord);

      // Load this faculty member's Phase 1 response spreadsheet.
        const { data: responseSheet, error: responseSheetError } = await supabase
          .from('faculty_phase_response_sheets')
          .select('response_sheet_url')
          .eq('phase_number', 1)
          .eq('faculty_id', facultyId)
          .maybeSingle();
        if (responseSheetError) throw responseSheetError;
        setPhase1ResponseSheetUrl(responseSheet?.response_sheet_url ?? null);

        // --------------------------------------------------------
        // 3. Get faculty assignments
        // --------------------------------------------------------

        const {
          data: assignmentRows,
          error: assignmentError,
        } = await supabase
          .from('faculty_assignments')
          .select('team_id')
          .eq('faculty_id', facultyId);

        if (assignmentError) {
          throw assignmentError;
        }

        const teamIds = (assignmentRows ?? [])
          .map((row) => row.team_id)
          .filter(Boolean);

        if (teamIds.length === 0) {
          setTeams([]);
          setSelectedTeamId(null);
          return;
        }

        // --------------------------------------------------------
        // 4. Load assigned teams
        // --------------------------------------------------------

        const {
          data: teamRows,
          error: teamsError,
        } = await supabase
          .from('teams')
          .select(
            'id, team_code, team_name, leader_student_id, problem_statement, selected_sdg, mode, campus, registration_status, locked_at, created_at'
          )
          .in('id', teamIds)
          .order('team_code', { ascending: true });

        if (teamsError) {
          throw teamsError;
        }

        const assignedTeams = (teamRows ?? []) as TeamRecord[];

        if (assignedTeams.length === 0) {
          setTeams([]);
          setSelectedTeamId(null);
          return;
        }

        // --------------------------------------------------------
        // 5. Load all members for assigned teams
        // --------------------------------------------------------

        const {
          data: memberRows,
          error: memberError,
        } = await supabase
          .from('team_members')
          .select('id, team_id, student_id, role')
          .in('team_id', teamIds);

        if (memberError) {
          throw memberError;
        }

        const members = (memberRows ?? []) as TeamMemberRecord[];

        const studentIds = Array.from(
          new Set([
            ...members.map((member) => member.student_id).filter(Boolean),
            ...assignedTeams.map((team) => team.leader_student_id).filter(Boolean),
          ])
        );

        let students: StudentRecord[] = [];

        if (studentIds.length > 0) {
          const {
            data: studentRows,
            error: studentsError,
          } = await supabase
            .from('students')
            .select(
              'id, name, usn, email, phone, branch, year, semester, section, campus'
            )
            .in('id', studentIds);

          if (studentsError) {
            throw studentsError;
          }

          students = (studentRows ?? []) as StudentRecord[];
        }

        // --------------------------------------------------------
        // 6. Load submissions
        // --------------------------------------------------------

        const {
          data: submissionRows,
          error: submissionError,
        } = await supabase
          .from('submissions')
          .select(
            'id, team_id, storage_path, file_name, file_type, file_size, submitted_at, submitted_by, status'
          )
          .in('team_id', teamIds);

        if (submissionError) {
          throw submissionError;
        }

        const submissions =
          (submissionRows ?? []) as SubmissionRecord[];

        // --------------------------------------------------------
        // 7. Compose faculty view model
        // --------------------------------------------------------

        const composedTeams: FacultyTeam[] =
          assignedTeams.map((team) => {
            const teamMembers = members
              .filter(
                (member) => member.team_id === team.id
              )
              .map((member) =>
                students.find(
                  (student) =>
                    student.id === member.student_id
                )
              )
              .filter(
                (student): student is StudentRecord =>
                  Boolean(student)
              );

            const submission =
              submissions.find(
                (item) => item.team_id === team.id
              ) ?? null;

            return {
              ...team,
              leader: students.find((student) => student.id === team.leader_student_id) ?? null,
              members: teamMembers,
              submission,
            };
          });

        setTeams(composedTeams);

        setSelectedTeamId((current) => {
          if (
            current &&
            composedTeams.some(
              (team) => team.id === current
            )
          ) {
            return current;
          }

          return composedTeams[0]?.id ?? null;
        });

        // --------------------------------------------------------
        // 8. Phase access information
        // --------------------------------------------------------

        const {
          data: phaseState,
          error: phaseError,
        } = await supabase.rpc(
          'get_current_phase'
        );

        if (!phaseError && phaseState) {
          const phase = Array.isArray(phaseState)
            ? phaseState[0]
            : phaseState;

          if (
            phase?.status === 'upcoming'
          ) {
            setPhaseAccessMessage(
              `Current event phase is upcoming. Assigned teams are visible, but phase-specific access may not yet be active.`
            );
          }
        }
      } catch (err: unknown) {
        console.error(
          'Faculty dashboard loading error:',
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load faculty dashboard.';

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    await loadDashboard(true);
  };

  // ============================================================
  // SECURE SUBMISSION DOWNLOAD / INSPECTION
  // ============================================================

  const handleInspectSubmission = async (
    submission: SubmissionRecord
  ) => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    try {
      setDownloadLoading(true);
      setError(null);

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
          'Unable to create a secure download link.'
        );
      }

      window.open(
        data.signedUrl,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (err: unknown) {
      console.error(
        'Submission inspection error:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to open the submitted file.';

      setError(message);
    } finally {
      setDownloadLoading(false);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';

    const mb = bytes / (1024 * 1024);

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (value: string) => {
    return new Date(value).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const formatTime = (value: string) => {
    return new Date(value).toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-8">

      {phase1ResponseSheetUrl && (
        <section className="rounded-2xl border border-emerald-400/20 bg-[#0D1219] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="text-[10px] font-mono font-bold tracking-[0.18em] text-emerald-300">PHASE 1 · DATA HUNT</div>
            <h2 className="mt-2 text-xl font-black text-white">Team Dataset Responses</h2>
            <p className="mt-1 text-sm text-[#8B96A5]">Open the response spreadsheet configured for your faculty account.</p>
          </div>
          <a href={phase1ResponseSheetUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 px-4 py-3 text-sm font-bold text-emerald-200 hover:bg-emerald-400/10">Open response sheet <ExternalLink className="w-4 h-4" /></a>
        </section>
      )}

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />

          <div className="flex-1 min-w-0">
            <div className="font-mono text-xs font-bold">
              FACULTY DATA ERROR
            </div>

            <div className="text-xs mt-1 opacity-80 break-words">
              {error}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors disabled:opacity-50"
          >
            {refreshing
              ? 'RETRYING...'
              : 'RETRY'}
          </button>
        </div>
      )}

      {/* ======================================================
          PHASE INFORMATION
      ======================================================= */}

      {phaseAccessMessage && (
        <div className="p-4 rounded-2xl bg-[#36D9FF]/10 border border-[#36D9FF]/20 text-[#36D9FF] flex items-center gap-3">
          <Clock className="w-5 h-5 shrink-0" />

          <div className="text-xs font-mono">
            {phaseAccessMessage}
          </div>
        </div>
      )}

      {/* ======================================================
          WELCOME HEADER
      ======================================================= */}

      <div className="p-8 rounded-3xl bg-[#0D1219] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">

        <div className="space-y-2">

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#8B5CF6]/15 border border-[#8B5CF6]/30 text-[#8B5CF6] font-mono text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5" />

            <span>
              FACULTY MENTOR DESK
            </span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            {faculty?.name ||
              'Faculty Mentor'}
          </h1>

          <p className="text-xs sm:text-sm text-[#8B96A5]">
            {faculty?.designation ||
              'Faculty Mentor'}
            {faculty?.department
              ? ` • Dept. of ${faculty.department}`
              : ''}
          </p>

          {faculty?.email && (
            <p className="text-[11px] font-mono text-[#8B96A5]">
              {faculty.email}
            </p>
          )}

        </div>

        <div className="flex flex-wrap gap-4">

          <div className="p-4 rounded-2xl bg-[#121A23] border border-white/10 text-center font-mono min-w-[120px]">
            <div className="text-[10px] text-[#8B96A5]">
              ASSIGNED SQUADS
            </div>

            <div className="font-display font-black text-2xl text-[#8B5CF6]">
              {loading
                ? '—'
                : teams.length}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#121A23] border border-white/10 text-center font-mono min-w-[120px]">
            <div className="text-[10px] text-[#8B96A5]">
              SUBMISSIONS
            </div>

            <div className="font-display font-black text-2xl text-[#36D9FF]">
              {loading
                ? '—'
                : teams.filter(
                    (team) =>
                      Boolean(team.submission)
                  ).length}
            </div>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="self-stretch px-4 rounded-2xl bg-[#121A23] border border-white/10 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 hover:bg-[#18232F] transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                refreshing
                  ? 'animate-spin'
                  : ''
              }`}
            />

            {refreshing
              ? 'REFRESHING'
              : 'REFRESH'}
          </button>

        </div>
      </div>

      {/* ======================================================
          SECURITY NOTICE
      ======================================================= */}

      <div className="p-4 rounded-2xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />

        <div>
          <div className="text-xs font-mono font-bold text-[#8B5CF6]">
            ASSIGNED DATA ACCESS
          </div>

          <p className="text-[11px] text-[#8B96A5] mt-1">
            This workspace displays only teams assigned
            to your faculty account. Submission files are
            stored privately and opened through temporary
            secure links.
          </p>
        </div>
      </div>

      {/* ======================================================
          MAIN WORKSPACE
      ======================================================= */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ====================================================
            LEFT: ASSIGNED TEAMS
        ===================================================== */}

        <div className="lg:col-span-1 space-y-4">

          <div className="flex items-center justify-between">

            <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-[#8B96A5]" />

              <span>
                Assigned Squads
              </span>
            </h3>

            <span className="text-xs font-mono text-[#8B96A5]">
              {teams.length}
            </span>

          </div>

          {loading ? (
            <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 text-center text-xs text-[#8B96A5] font-mono">
              Loading assigned squads...
            </div>
          ) : teams.length === 0 ? (
            <div className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 text-center space-y-3">

              <Users className="w-8 h-8 mx-auto text-[#8B5CF6] opacity-50" />

              <div className="text-xs text-[#8B96A5] font-mono">
                No teams assigned yet.
              </div>

              <div className="text-[10px] text-[#8B96A5]">
                The administrator must complete faculty
                allocation before teams appear here.
              </div>

            </div>
          ) : (
            <div className="space-y-3">

              {teams.map((team) => {

                const isSelected =
                  selectedTeam?.id === team.id;

                return (
                  <button
                    type="button"
                    key={team.id}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setError(null);
                    }}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'bg-[#121A23] border-[#8B5CF6] shadow-lg shadow-[#8B5CF6]/15'
                        : 'bg-[#0D1219] border-white/5 hover:border-white/20'
                    }`}
                  >

                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#FF7A30]">
                        {team.team_code}
                      </span>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#8B96A5]">
                        Offline
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-sm text-white mb-2">
                      {team.team_name}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] font-mono text-[#8B96A5]">

                      <span>
                        {team.campus} Campus (
                        {team.members.length} M)
                      </span>

                      <span
                        className={
                          team.submission
                            ? 'text-[#10B981]'
                            : 'text-amber-500'
                        }
                      >
                        {team.submission
                          ? '● SUBMITTED'
                          : '○ PENDING'}
                      </span>

                    </div>

                  </button>
                );
              })}

            </div>
          )}

        </div>

        {/* ====================================================
            RIGHT: TEAM INSPECTION
        ===================================================== */}

        <div className="lg:col-span-2">

          {selectedTeam ? (
            <div className="p-8 rounded-3xl bg-[#0D1219] border border-white/10 space-y-6">

              {/* Team header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">

                <div>

                  <span className="font-mono text-xs font-bold text-[#FF7A30]">
                    {selectedTeam.team_code}
                  </span>

                  <h2 className="font-display font-black text-2xl text-white mt-1">
                    {selectedTeam.team_name}
                  </h2>

                  <p className="text-xs text-[#8B96A5] font-mono mt-1">
                    {selectedTeam.campus} Campus
                    {' • '}
                    Offline
                  </p>

                </div>

                <div className="text-right font-mono text-xs space-y-1">

                  <div className="text-[#36D9FF]">
                    {selectedTeam.registration_status.toUpperCase()}
                  </div>

                  {selectedTeam.locked_at && (
                    <div className="text-[#8B96A5]">
                      Locked:{' '}
                      {formatDate(
                        selectedTeam.locked_at
                      )}
                    </div>
                  )}

                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-[#121A23] border border-[#36D9FF]/20">
                  <p className="text-[10px] font-mono font-bold text-[#36D9FF] mb-1">TEAM LEADER</p>
                  <p className="text-sm font-bold text-white">{selectedTeam.leader?.name || 'Leader details unavailable'}</p>
                  {selectedTeam.leader && <p className="text-[11px] text-[#8B96A5] mt-1">{selectedTeam.leader.usn} · {selectedTeam.leader.email}</p>}
                </div>
                <div className="p-4 rounded-xl bg-[#121A23] border border-white/5">
                  <p className="text-[10px] font-mono font-bold text-[#8B96A5] mb-1">PROBLEM STATEMENT</p>
                  <p className="text-xs leading-5 text-white">{selectedTeam.problem_statement || 'No problem statement has been submitted yet.'}</p>
                  {selectedTeam.selected_sdg != null && <p className="text-[10px] font-mono text-[#36D9FF] mt-2">SELECTED SDG: {selectedTeam.selected_sdg}</p>}
                </div>
              </div>

              {/* ==================================================
                  MEMBER ROSTER
              =================================================== */}

              <div className="space-y-3">

                <div className="flex items-center justify-between">

                  <h4 className="text-xs font-mono font-bold text-[#8B96A5] uppercase">
                    SQUAD MEMBER ROSTER
                  </h4>

                  <span className="text-[10px] font-mono text-[#8B96A5]">
                    {selectedTeam.members.length} MEMBERS
                  </span>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">

                  {selectedTeam.members.map(
                    (member) => (
                      <div
                        key={member.id}
                        className="p-3 rounded-xl bg-[#121A23] border border-white/5 text-xs font-mono space-y-1"
                      >

                        <div className="font-bold text-white">
                          {member.name}
                        </div>

                        <div className="text-[#36D9FF]">
                          {member.usn}
                        </div>

                        <div className="text-[10px] text-[#8B96A5]">
                          {member.branch}
                          {' • '}
                          Sec {member.section}
                        </div>

                        <div className="text-[10px] text-[#8B96A5]">
                          Year {member.year}
                          {' • '}
                          Sem {member.semester}
                        </div>

                      </div>
                    )
                  )}

                </div>

              </div>

              {/* ==================================================
                  SUBMISSION
              =================================================== */}

              <div className="pt-6 border-t border-white/10">

                <div className="flex items-center justify-between mb-3">

                  <h4 className="text-xs font-mono font-bold text-[#8B96A5] uppercase">
                    SUBMISSION ARTIFACT
                  </h4>

                  {selectedTeam.submission && (
                    <span className="text-[10px] font-mono text-[#10B981]">
                      {selectedTeam.submission.status.toUpperCase()}
                    </span>
                  )}

                </div>

                {selectedTeam.submission ? (

                  <div className="p-5 rounded-2xl bg-[#121A23] border border-[#36D9FF]/30">

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                      <div className="flex items-center gap-3 min-w-0">

                        <div className="p-3 rounded-xl bg-[#36D9FF]/10">
                          <FileText className="w-6 h-6 text-[#36D9FF]" />
                        </div>

                        <div className="min-w-0">

                          <div className="font-display font-bold text-sm text-white truncate">
                            {selectedTeam.submission.file_name}
                          </div>

                          <div className="text-[10px] font-mono text-[#8B96A5] mt-1">
                            {formatFileSize(
                              selectedTeam.submission.file_size
                            )}
                            {' • '}
                            Uploaded{' '}
                            {formatDate(
                              selectedTeam.submission.submitted_at
                            )}
                            {' • '}
                            {formatTime(
                              selectedTeam.submission.submitted_at
                            )}
                          </div>

                        </div>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleInspectSubmission(
                            selectedTeam.submission!
                          )
                        }
                        disabled={downloadLoading}
                        className="shrink-0 px-4 py-2.5 rounded-xl bg-[#36D9FF] text-[#07090D] font-mono text-xs font-bold hover:bg-[#5ce1ff] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >

                        {downloadLoading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <ExternalLink className="w-4 h-4" />
                        )}

                        {downloadLoading
                          ? 'OPENING...'
                          : 'INSPECT FILE'}

                      </button>

                    </div>

                  </div>

                ) : (

                  <div className="p-8 rounded-2xl bg-[#121A23] border border-dashed border-white/10 text-center space-y-3">

                    <FileText className="w-9 h-9 mx-auto text-[#8B96A5] opacity-40" />

                    <div className="text-xs text-[#8B96A5] font-mono">
                      This squad has not uploaded its presentation yet.
                    </div>

                  </div>

                )}

              </div>

              {/* ==================================================
                  TEAM ACCESS INFORMATION
              =================================================== */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div className="p-4 rounded-2xl bg-[#121A23] border border-white/5">

                  <div className="flex items-center gap-2 text-[#8B96A5] text-[10px] font-mono">
                    <Building2 className="w-3.5 h-3.5" />
                    CAMPUS
                  </div>

                  <div className="mt-2 text-sm font-display font-bold text-white">
                    {selectedTeam.campus}
                  </div>

                </div>

                <div className="p-4 rounded-2xl bg-[#121A23] border border-white/5">

                  <div className="flex items-center gap-2 text-[#8B96A5] text-[10px] font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    REGISTRATION
                  </div>

                  <div className="mt-2 text-sm font-display font-bold text-white">
                    {selectedTeam.registration_status}
                  </div>

                </div>

              </div>

            </div>
          ) : (

            <div className="p-12 rounded-3xl bg-[#0D1219] border border-white/10 text-center space-y-3 text-[#8B96A5]">

              <Users className="w-12 h-12 mx-auto text-[#8B5CF6] opacity-50" />

              <h3 className="font-display font-bold text-lg text-white">
                Select a squad to inspect
              </h3>

              <p className="text-xs font-mono">
                Assigned teams will appear here after
                faculty allocation.
              </p>

            </div>

          )}

        </div>

      </div>

    </div>
  );
};