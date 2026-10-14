import React, { useCallback, useEffect, useState } from 'react';
import {
  Users,
  FileText,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

type FacultyRecord = {
  id: string;
  name: string;
  email: string;
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

export const FacultyTeamsPage: React.FC = () => {
  const [faculty, setFaculty] =
    useState<FacultyRecord | null>(null);

  const [assignedTeams, setAssignedTeams] =
    useState<FacultyTeam[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openingSubmission, setOpeningSubmission] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  // ============================================================
  // LOAD ASSIGNED TEAMS
  // ============================================================

  const loadTeams = useCallback(
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

        // --------------------------------------------------------
        // 1. Resolve authenticated faculty
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
        // 2. Resolve current faculty ID through secure RPC
        // --------------------------------------------------------

        const {
          data: facultyId,
          error: facultyIdError,
        } = await supabase.rpc(
          'get_current_faculty_id'
        );

        if (facultyIdError) {
          throw facultyIdError;
        }

        if (!facultyId) {
          throw new Error(
            'Your account is not linked to an active faculty record.'
          );
        }

        // --------------------------------------------------------
        // 3. Load faculty profile
        // --------------------------------------------------------

        const {
          data: facultyRow,
          error: facultyError,
        } = await supabase
          .from('faculty')
          .select(
            'id, name, email, designation, department, active'
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

        setFaculty(
          facultyRow as FacultyRecord
        );

        // --------------------------------------------------------
        // 4. Get ONLY this faculty's assignments
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

        // No assignments yet
        if (teamIds.length === 0) {
          setAssignedTeams([]);
          return;
        }

        // --------------------------------------------------------
        // 5. Load assigned teams only
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
          .order('team_code', {
            ascending: true,
          });

        if (teamsError) {
          throw teamsError;
        }

        const teams =
          (teamRows ?? []) as TeamRecord[];

        if (teams.length === 0) {
          setAssignedTeams([]);
          return;
        }

        // --------------------------------------------------------
        // 6. Load members
        // --------------------------------------------------------

        const {
          data: memberRows,
          error: memberError,
        } = await supabase
          .from('team_members')
          .select(
            'id, team_id, student_id, role'
          )
          .in('team_id', teamIds);

        if (memberError) {
          throw memberError;
        }

        const members =
          (memberRows ??
            []) as TeamMemberRecord[];

        const studentIds = Array.from(
          new Set([
            ...members.map((member) => member.student_id).filter(Boolean),
            ...teams.map((team) => team.leader_student_id).filter(Boolean),
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

          students =
            (studentRows ??
              []) as StudentRecord[];
        }

        // --------------------------------------------------------
        // 7. Load submissions
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
          (submissionRows ??
            []) as SubmissionRecord[];

        // --------------------------------------------------------
        // 8. Compose assigned-team view
        // --------------------------------------------------------

        const composedTeams: FacultyTeam[] =
          teams.map((team) => {
            const teamMembers = members
              .filter(
                (member) =>
                  member.team_id ===
                  team.id
              )
              .map((member) =>
                students.find(
                  (student) =>
                    student.id ===
                    member.student_id
                )
              )
              .filter(
                (
                  student
                ): student is StudentRecord =>
                  Boolean(student)
              );

            const submission =
              submissions.find(
                (item) =>
                  item.team_id === team.id
              ) ?? null;

            return {
              ...team,
              leader: students.find((student) => student.id === team.leader_student_id) ?? null,
              members: teamMembers,
              submission,
            };
          });

        setAssignedTeams(
          composedTeams
        );
      } catch (err: unknown) {
        console.error(
          'Faculty teams loading error:',
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load assigned teams.';

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
    loadTeams();
  }, [loadTeams]);

  // ============================================================
  // REFRESH
  // ============================================================

  const handleRefresh = async () => {
    await loadTeams(true);
  };

  // ============================================================
  // SECURE SUBMISSION OPEN
  // ============================================================

  const handleOpenSubmission = async (
    submission: SubmissionRecord
  ) => {
    if (!supabase) {
      setError(
        'Supabase is not configured.'
      );
      return;
    }

    try {
      setOpeningSubmission(
        submission.id
      );
      setError(null);

      const {
        data,
        error: signedUrlError,
      } = await supabase.storage
        .from(
          'drushtix-submissions'
        )
        .createSignedUrl(
          submission.storage_path,
          60 * 10
        );

      if (signedUrlError) {
        throw signedUrlError;
      }

      if (!data?.signedUrl) {
        throw new Error(
          'Unable to create a secure file link.'
        );
      }

      window.open(
        data.signedUrl,
        '_blank',
        'noopener,noreferrer'
      );
    } catch (err: unknown) {
      console.error(
        'Submission opening error:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to open submission.';

      setError(message);
    } finally {
      setOpeningSubmission(null);
    }
  };

  // ============================================================
  // HELPERS
  // ============================================================

  const formatFileSize = (
    bytes: number
  ) => {
    if (!bytes) {
      return '0 B';
    }

    const mb =
      bytes /
      (1024 * 1024);

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  };

  const formatDate = (
    value: string
  ) => {
    return new Date(
      value
    ).toLocaleDateString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  const formatTime = (
    value: string
  ) => {
    return new Date(
      value
    ).toLocaleTimeString(
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
    <div className="space-y-6">

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
          HEADER
      ======================================================= */}

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

        <div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/25 text-[#8B5CF6] font-mono text-[10px] font-bold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />

            ASSIGNED FACULTY ACCESS
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Assigned Teams Roster (
            {loading
              ? '—'
              : assignedTeams.length}
            )
          </h1>

          <p className="text-xs text-[#8B96A5] mt-2">
            Full squad and member details for
            collegiate groups assigned to your
            assigned teams.
          </p>

          {faculty && (
            <p className="text-[10px] font-mono text-[#8B96A5] mt-2">
              Faculty: {faculty.name}
              {faculty.department
                ? ` • ${faculty.department}`
                : ''}
            </p>
          )}

        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={
            refreshing || loading
          }
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-[#121A23] hover:bg-[#18232F] border border-white/10 text-white font-mono text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
        >

          <RefreshCw
            className={`w-4 h-4 ${
              refreshing
                ? 'animate-spin'
                : ''
            }`}
          />

          {refreshing
            ? 'REFRESHING...'
            : 'REFRESH'}

        </button>

      </div>

      {/* ======================================================
          ACCESS NOTICE
      ======================================================= */}

      <div className="p-4 rounded-2xl bg-[#36D9FF]/10 border border-[#36D9FF]/20 flex items-start gap-3">

        <ShieldCheck className="w-5 h-5 text-[#36D9FF] shrink-0 mt-0.5" />

        <div>

          <div className="text-xs font-mono font-bold text-[#36D9FF]">
            PRIVATE ASSIGNMENT VIEW
          </div>

          <p className="text-[11px] text-[#8B96A5] mt-1">
            Only teams assigned to your authenticated
            faculty account are displayed. Uploaded
            presentation files remain private and are
            opened through temporary secure links.
          </p>

        </div>

      </div>

      {/* ======================================================
          TEAM GRID
      ======================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {loading ? (

          <>
            {[1, 2].map((item) => (
              <div
                key={item}
                className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 animate-pulse space-y-4"
              >
                <div className="h-4 w-24 rounded bg-white/5" />
                <div className="h-6 w-48 rounded bg-white/5" />
                <div className="h-4 w-64 rounded bg-white/5" />
                <div className="h-20 rounded-xl bg-white/5" />
              </div>
            ))}
          </>

        ) : assignedTeams.length === 0 ? (

          <div className="md:col-span-2 p-10 rounded-2xl bg-[#0D1219] border border-white/10 text-center">

            <Users className="w-10 h-10 mx-auto text-[#8B5CF6] opacity-50 mb-3" />

            <h3 className="font-display font-bold text-white">
              No teams currently assigned
            </h3>

            <p className="text-xs font-mono text-[#8B96A5] mt-2">
              Faculty allocation has not assigned
              any squads to this account yet.
            </p>

          </div>

        ) : (

          assignedTeams.map(
            (team) => (
              <div
                key={team.id}
                className="p-6 rounded-2xl bg-[#0D1219] border border-white/10 space-y-4 hover:border-white/20 transition-colors"
              >

                {/* ==================================================
                    TEAM HEADER
                =================================================== */}

                <div className="flex items-center justify-between gap-3">

                  <span className="font-mono text-xs font-bold text-[#FF7A30]">
                    {team.team_code}
                  </span>

                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#36D9FF]">
                    {team.campus} Campus
                    {' • '}
                    Offline
                  </span>

                </div>

                <div>

                  <h3 className="font-display font-bold text-lg text-white">
                    {team.team_name}
                  </h3>

                  <p className="text-xs text-[#8B96A5] font-mono mt-1">
                    Registration:{' '}
                    {team.registration_status}
                  </p>

                </div>

                <div className="p-3 rounded-xl bg-[#121A23] border border-[#36D9FF]/20">
                  <div className="text-[10px] font-mono text-[#36D9FF] uppercase mb-1">TEAM LEADER</div>
                  <div className="text-sm font-bold text-white">{team.leader?.name || 'Leader details unavailable'}</div>
                  {team.leader && <div className="text-[11px] text-[#8B96A5] mt-1">{team.leader.usn} · {team.leader.email}</div>}
                </div>

                {(team.problem_statement || team.selected_sdg != null) && (
                  <div className="p-3 rounded-xl bg-[#121A23] border border-white/5">
                    <div className="text-[10px] font-mono text-[#8B96A5] uppercase mb-1">PHASE 1 DETAILS</div>
                    {team.problem_statement && <p className="text-xs leading-5 text-white">{team.problem_statement}</p>}
                    {team.selected_sdg != null && <p className="text-[10px] font-mono text-[#36D9FF] mt-2">SELECTED SDG: {team.selected_sdg}</p>}
                  </div>
                )}

                {/* ==================================================
                    LEADER
                =================================================== */}

                <div className="p-3 rounded-xl bg-[#121A23] border border-white/5">

                  <div className="text-[10px] font-mono text-[#8B96A5] uppercase mb-1">
                    TEAM LEADER
                  </div>

                  {(() => {
                    const leader =
                      team.members.find(
                        (member) =>
                          member.id ===
                          team.leader_student_id
                      );

                    if (!leader) {
                      return (
                        <div className="text-xs text-[#8B96A5]">
                          Leader profile unavailable
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="text-xs font-bold text-white">
                          {leader.name}
                        </div>

                        <div className="text-[10px] font-mono text-[#36D9FF] mt-1">
                          {leader.usn}
                          {' • '}
                          {leader.email}
                        </div>
                      </>
                    );
                  })()}

                </div>

                {/* ==================================================
                    MEMBERS
                =================================================== */}

                <div className="space-y-1.5 pt-2 border-t border-white/5">

                  <div className="flex items-center justify-between">

                    <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
                      TEAM SQUAD MEMBERS
                    </div>

                    <span className="text-[10px] font-mono text-[#8B96A5]">
                      {team.members.length}
                    </span>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">

                    {team.members.map(
                      (member) => (
                        <div
                          key={member.id}
                          className="p-2.5 rounded-lg bg-[#121A23] border border-white/5 text-[11px]"
                        >

                          <div className="font-bold text-white">
                            {member.name}
                          </div>

                          <div className="text-[#36D9FF] text-[10px] mt-0.5">
                            {member.usn}
                            {' • '}
                            {member.branch}
                          </div>

                          <div className="text-[#8B96A5] text-[9px] mt-0.5">
                            Year {member.year}
                            {' • '}
                            Sem {member.semester}
                            {' • '}
                            Sec {member.section}
                          </div>

                        </div>
                      )
                    )}

                  </div>

                </div>

                {/* ==================================================
                    SUBMISSION
                =================================================== */}

                <div className="pt-3 border-t border-white/5">

                  <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center gap-2 text-xs font-mono text-[#8B96A5]">

                      {team.submission ? (
                        <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500" />
                      )}

                      <span>
                        Artifact
                      </span>

                    </div>

                    <span
                      className={
                        team.submission
                          ? 'text-[#10B981] font-bold text-[10px] font-mono'
                          : 'text-amber-500 text-[10px] font-mono'
                      }
                    >
                      {team.submission
                        ? '● SUBMITTED'
                        : '○ PENDING UPLOAD'}
                    </span>

                  </div>

                  {team.submission && (
                    <div className="mt-3 p-3 rounded-xl bg-[#121A23] border border-[#36D9FF]/20">

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

                        <div className="flex items-center gap-2 min-w-0">

                          <FileText className="w-5 h-5 text-[#36D9FF] shrink-0" />

                          <div className="min-w-0">

                            <div className="text-xs font-bold text-white truncate">
                              {team.submission.file_name}
                            </div>

                            <div className="text-[9px] font-mono text-[#8B96A5] mt-0.5">
                              {formatFileSize(
                                team.submission.file_size
                              )}
                              {' • '}
                              {formatDate(
                                team.submission.submitted_at
                              )}
                              {' • '}
                              {formatTime(
                                team.submission.submitted_at
                              )}
                            </div>

                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleOpenSubmission(
                              team.submission!
                            )
                          }
                          disabled={
                            openingSubmission ===
                            team.submission.id
                          }
                          className="shrink-0 px-3 py-2 rounded-lg bg-[#36D9FF] text-[#07090D] font-mono text-[10px] font-bold hover:bg-[#5ce1ff] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >

                          {openingSubmission ===
                          team.submission.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}

                          {openingSubmission ===
                          team.submission.id
                            ? 'OPENING...'
                            : 'INSPECT'}

                        </button>

                      </div>

                    </div>
                  )}

                </div>

              </div>
            )
          )

        )}

      </div>

    </div>
  );
};