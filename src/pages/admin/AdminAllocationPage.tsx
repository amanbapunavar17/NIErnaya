import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Shuffle,
  CheckCircle,
  GraduationCap,
  Building2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Lock,
  UserCheck,
  XCircle,
  Loader2,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase/client';

type Faculty = {
  id: string;
  profile_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  active: boolean;
  sort_order: number;
};

type Team = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  mode: 'Offline';
  campus: 'North' | 'South';
  registration_status: 'draft' | 'submitted' | 'locked';
  locked_at: string | null;
  created_at: string;
  updated_at: string;
};

type FacultyAssignment = {
  id: string;
  team_id: string;
  faculty_id: string;
  assigned_at: string;
  assigned_by: string | null;
};

type AllocationStatus = {
  locked_teams: number;
  assigned_teams: number;
  unassigned_teams: number;
  active_faculty: number;
  minimum_assignments: number;
  maximum_assignments: number;
  balanced: boolean;
};

type AllocationIntegrity = {
  valid: boolean;
  balanced: boolean;
  locked_teams: number;
  assigned_locked_teams: number;
  unassigned_locked_teams: number;
  duplicate_teams: number;
  inactive_faculty_assignments: number;
  unlocked_team_assignments: number;
  active_faculty: number;
  minimum_assignments: number;
  maximum_assignments: number;
};

type TeamView = Team & {
  assignedFaculty: Faculty | null;
};

const formatError = (message?: string) => {
  if (!message) {
    return 'An unexpected error occurred.';
  }

  if (
    message.toLowerCase().includes('team must be locked') ||
    message.toLowerCase().includes('locked')
  ) {
    return 'Only locked teams can be assigned to faculty.';
  }

  if (
    message.toLowerCase().includes('faculty') &&
    message.toLowerCase().includes('active')
  ) {
    return 'The selected faculty member is not currently active.';
  }

  if (
    message.toLowerCase().includes('admin') ||
    message.toLowerCase().includes('permission')
  ) {
    return 'Administrator permission is required for this action.';
  }

  return message;
};

export const AdminAllocationPage: React.FC = () => {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);

  const [allocationStatus, setAllocationStatus] =
    useState<AllocationStatus | null>(null);

  const [integrity, setIntegrity] =
    useState<AllocationIntegrity | null>(null);

  const [loading, setLoading] = useState(true);
  const [allocationLoading, setAllocationLoading] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState<string | null>(
    null
  );

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /*
   * ============================================================
   * LOAD FACULTY
   * ============================================================
   */

  const loadFaculty = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error: facultyError } = await supabase
      .from('faculty')
      .select(
        `
          id,
          profile_id,
          name,
          email,
          phone,
          designation,
          department,
          active,
          sort_order
        `
      )
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (facultyError) {
      throw facultyError;
    }

    setFaculty((data || []) as Faculty[]);
  }, []);

  /*
   * ============================================================
   * LOAD TEAMS
   * ============================================================
   */

  const loadTeams = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error: teamsError } = await supabase
      .from('teams')
      .select(
        `
          id,
          team_code,
          team_name,
          leader_student_id,
          mode,
          campus,
          registration_status,
          locked_at,
          created_at,
          updated_at
        `
      )
      .order('created_at', { ascending: true });

    if (teamsError) {
      throw teamsError;
    }

    setTeams((data || []) as Team[]);
  }, []);

  /*
   * ============================================================
   * LOAD ASSIGNMENTS
   * ============================================================
   */

  const loadAssignments = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error: assignmentError } = await supabase
      .from('faculty_assignments')
      .select(
        `
          id,
          team_id,
          faculty_id,
          assigned_at,
          assigned_by
        `
      )
      .order('assigned_at', { ascending: true });

    if (assignmentError) {
      throw assignmentError;
    }

    setAssignments((data || []) as FacultyAssignment[]);
  }, []);

  /*
   * ============================================================
   * LOAD ALLOCATION STATUS
   * ============================================================
   */

  const loadAllocationStatus = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error: statusError } = await supabase.rpc(
      'get_allocation_status'
    );

    if (statusError) {
      throw statusError;
    }

    /*
     * get_allocation_status() returns a single JSON object.
     */
    setAllocationStatus((data || null) as AllocationStatus | null);
  }, []);

  /*
   * ============================================================
   * LOAD ALLOCATION INTEGRITY
   * ============================================================
   */

  const loadIntegrity = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data, error: integrityError } = await supabase.rpc(
      'get_allocation_integrity'
    );

    if (integrityError) {
      throw integrityError;
    }

    setIntegrity((data || null) as AllocationIntegrity | null);
  }, []);

  /*
   * ============================================================
   * REFRESH EVERYTHING
   * ============================================================
   */

  const refreshData = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setError(
        'Supabase is not configured. Check your VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadFaculty(),
        loadTeams(),
        loadAssignments(),
        loadAllocationStatus(),
        loadIntegrity(),
      ]);
    } catch (err: any) {
      setError(formatError(err?.message));
    } finally {
      setLoading(false);
    }
  }, [
    loadFaculty,
    loadTeams,
    loadAssignments,
    loadAllocationStatus,
    loadIntegrity,
  ]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  /*
   * ============================================================
   * DERIVED TEAM DATA
   * ============================================================
   */

  const teamViews = useMemo<TeamView[]>(() => {
    return teams.map((team) => {
      const assignment = assignments.find(
        (item) => item.team_id === team.id
      );

      const assignedFaculty = assignment
        ? faculty.find((item) => item.id === assignment.faculty_id) || null
        : null;

      return {
        ...team,
        assignedFaculty,
      };
    });
  }, [teams, assignments, faculty]);

  /*
   * ============================================================
   * FACULTY LOAD
   * ============================================================
   */

  const facultyLoads = useMemo(() => {
    return faculty.map((member) => {
      const assignedTeams = assignments.filter(
        (assignment) => assignment.faculty_id === member.id
      );

      return {
        faculty: member,
        count: assignedTeams.length,
      };
    });
  }, [faculty, assignments]);

  /*
   * ============================================================
   * AUTO ALLOCATION
   * ============================================================
   */

  const handleAutoAllocate = async () => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    if (faculty.length === 0) {
      setError('No active faculty members are available for allocation.');
      return;
    }

    if (allocationStatus && allocationStatus.locked_teams === 0) {
      setError(
        'There are no locked teams available for faculty allocation. Lock team registrations first.'
      );
      return;
    }

    const confirmed = window.confirm(
      'Run balanced automatic faculty allocation?\n\n' +
        'Existing faculty assignments will be recalculated and locked teams will be distributed as evenly as possible across the active faculty committee.'
    );

    if (!confirmed) {
      return;
    }

    setAllocationLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        'randomize_faculty_allocation'
      );

      if (rpcError) {
        throw rpcError;
      }

      const summary = data as
        | {
            allocated_teams?: number;
            allocations_count?: number;
            active_faculty?: number;
            minimum_assignments?: number;
            maximum_assignments?: number;
            balanced?: boolean;
          }
        | null;

      const allocated =
        summary?.allocated_teams ??
        summary?.allocations_count ??
        allocationStatus?.locked_teams ??
        0;

      const facultyCount =
        summary?.active_faculty ??
        faculty.length;

      setSuccessMsg(
        `Balanced allocation completed. ${allocated} locked teams distributed across ${facultyCount} active faculty members.`
      );

      await Promise.all([
        loadTeams(),
        loadAssignments(),
        loadAllocationStatus(),
        loadIntegrity(),
      ]);
} catch (err: any) {
  console.error('FULL FACULTY ALLOCATION ERROR:', err);

  const message =
    err?.message ||
    err?.details ||
    err?.hint ||
    'Faculty allocation failed.';

  setError(
    [
      message,
      err?.code ? `Code: ${err.code}` : '',
      err?.details ? `Details: ${err.details}` : '',
      err?.hint ? `Hint: ${err.hint}` : '',
    ]
      .filter(Boolean)
      .join(' | ')
  );
} finally {
      setAllocationLoading(false);
    }
  };

  /*
   * ============================================================
   * MANUAL ASSIGNMENT
   * ============================================================
   */

  const handleManualAssign = async (
    teamId: string,
    facultyId: string
  ) => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    const team = teams.find((item) => item.id === teamId);

    if (!team) {
      setError('Team could not be found.');
      return;
    }

    if (team.registration_status !== 'locked') {
      setError(
        'Only locked teams can be manually assigned to faculty.'
      );
      return;
    }

    setAssignmentLoading(teamId);
    setError(null);
    setSuccessMsg(null);

    try {
      /*
       * Empty selection means remove assignment.
       */
      if (!facultyId) {
        const { error: rpcError } = await supabase.rpc(
          'remove_team_faculty_assignment',
          {
            p_team_id: teamId,
          }
        );

        if (rpcError) {
          throw rpcError;
        }

        setSuccessMsg(
          `${team.team_code} faculty assignment removed.`
        );
      } else {
        const selectedFaculty = faculty.find(
          (member) => member.id === facultyId
        );

        if (!selectedFaculty) {
          throw new Error('Selected faculty member not found.');
        }

        const { error: rpcError } = await supabase.rpc(
          'reassign_team_faculty',
          {
            p_team_id: teamId,
            p_faculty_id: facultyId,
          }
        );

        if (rpcError) {
          throw rpcError;
        }

        setSuccessMsg(
          `${team.team_code} assigned to ${selectedFaculty.name}.`
        );
      }

      await Promise.all([
        loadAssignments(),
        loadAllocationStatus(),
        loadIntegrity(),
      ]);
    } catch (err: any) {
      setError(formatError(err?.message));

      /*
       * Reload because the database is the source of truth.
       */
      await Promise.all([
        loadAssignments(),
        loadAllocationStatus(),
        loadIntegrity(),
      ]).catch(() => undefined);
    } finally {
      setAssignmentLoading(null);
    }
  };

  /*
   * ============================================================
   * LOADING STATE
   * ============================================================
   */

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              Faculty Mentorship Allocation
            </h1>

            <p className="text-xs text-[#8B96A5] mt-1">
              Loading the live Supabase allocation engine...
            </p>
          </div>
        </div>

        <div className="min-h-[360px] rounded-3xl bg-[#0D1219] border border-white/10 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />

          <span className="text-xs font-mono text-[#8B96A5] uppercase tracking-wider">
            Loading allocation data...
          </span>
        </div>
      </div>
    );
  }

  /*
   * ============================================================
   * MAIN UI
   * ============================================================
   */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8B5CF6] uppercase tracking-wider font-bold mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>FACULTY ALLOCATION ENGINE</span>
          </div>

          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Faculty Mentorship Allocation
          </h1>

          <p className="text-xs text-[#8B96A5] mt-1">
            Evenly distribute locked registered teams across the active NIE
            faculty committee. Maximum load difference should be ≤ 1.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start">
          <button
            type="button"
            onClick={refreshData}
            disabled={loading || allocationLoading}
            className="px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 text-white font-mono text-xs font-bold flex items-center gap-2 hover:border-[#36D9FF]/40 transition-all disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span>REFRESH</span>
          </button>

          <button
            type="button"
            onClick={handleAutoAllocate}
            disabled={
              allocationLoading ||
              faculty.length === 0 ||
              !allocationStatus ||
              allocationStatus.locked_teams === 0
            }
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA] text-white font-mono text-xs font-bold flex items-center gap-2 hover:shadow-xl hover:shadow-[#8B5CF6]/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {allocationLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shuffle className="w-4 h-4" />
            )}

            <span>
              {allocationLoading
                ? 'ALLOCATING...'
                : 'RUN BALANCED AUTO-ALLOCATION'}
            </span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Allocation Engine Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Locked Teams
          </div>

          <div className="text-2xl font-display font-black text-white mt-2">
            {allocationStatus?.locked_teams ?? 0}
          </div>

          <div className="text-[10px] font-mono text-[#8B96A5] mt-1">
            Eligible for allocation
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Assigned
          </div>

          <div className="text-2xl font-display font-black text-[#36D9FF] mt-2">
            {allocationStatus?.assigned_teams ?? 0}
          </div>

          <div className="text-[10px] font-mono text-[#8B96A5] mt-1">
            Faculty assignments
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Unassigned
          </div>

          <div className="text-2xl font-display font-black text-[#FF7A30] mt-2">
            {allocationStatus?.unassigned_teams ?? 0}
          </div>

          <div className="text-[10px] font-mono text-[#8B96A5] mt-1">
            Locked teams awaiting faculty
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5] uppercase">
            Balance
          </div>

          <div
            className={`text-2xl font-display font-black mt-2 ${
              allocationStatus?.balanced
                ? 'text-green-400'
                : 'text-red-400'
            }`}
          >
            {allocationStatus?.balanced ? 'OK' : 'CHECK'}
          </div>

          <div className="text-[10px] font-mono text-[#8B96A5] mt-1">
            Max difference ≤ 1
          </div>
        </div>
      </div>

      {/* Integrity */}
      {integrity && (
        <div
          className={`p-4 rounded-xl border text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            integrity.valid && integrity.balanced
              ? 'bg-green-500/5 border-green-500/20 text-green-400'
              : 'bg-red-500/5 border-red-500/20 text-red-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {integrity.valid && integrity.balanced ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}

            <span>
              Allocation integrity:{' '}
              <strong>
                {integrity.valid && integrity.balanced
                  ? 'VALID'
                  : 'REQUIRES REVIEW'}
              </strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-4 text-[10px]">
            <span>
              LOCKED:{' '}
              <strong>{integrity.locked_teams}</strong>
            </span>

            <span>
              ASSIGNED:{' '}
              <strong>{integrity.assigned_locked_teams}</strong>
            </span>

            <span>
              UNASSIGNED:{' '}
              <strong>{integrity.unassigned_locked_teams}</strong>
            </span>

            <span>
              INVALID:{' '}
              <strong>
                {integrity.duplicate_teams +
                  integrity.inactive_faculty_assignments +
                  integrity.unlocked_team_assignments}
              </strong>
            </span>
          </div>
        </div>
      )}

      {/* Faculty Roster */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#8B5CF6]" />

            <span>
              Active Faculty Mentors ({faculty.length})
            </span>
          </h2>

          <span className="text-[10px] font-mono text-[#8B96A5]">
            BALANCED DISTRIBUTION ENGINE
          </span>
        </div>

        {faculty.length === 0 ? (
          <div className="p-8 rounded-3xl bg-[#0D1219] border border-white/10 text-center">
            <GraduationCap className="w-8 h-8 text-[#8B96A5] mx-auto mb-3" />

            <p className="text-sm text-white font-display font-bold">
              No active faculty members found
            </p>

            <p className="text-xs text-[#8B96A5] font-mono mt-1">
              Activate faculty members before running allocation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {facultyLoads.map(({ faculty: member, count }, index) => {
              const maxLoad =
                allocationStatus?.maximum_assignments ?? 0;

              const minLoad =
                allocationStatus?.minimum_assignments ?? 0;

              const isBalanced =
                maxLoad === 0 ||
                (count >= minLoad && count <= maxLoad);

              return (
                <div
                  key={member.id}
                  className={`p-5 rounded-2xl bg-[#0D1219] border transition-all flex flex-col justify-between ${
                    isBalanced
                      ? 'border-white/10 hover:border-[#8B5CF6]/50'
                      : 'border-red-500/30'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#8B96A5]">
                        EVALUATOR {String(index + 1).padStart(2, '0')}
                      </span>

                      <span className="font-mono text-xs font-bold text-[#8B5CF6]">
                        {count} SQUADS
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-white mb-1">
                      {member.name}
                    </h3>

                    <p className="text-xs text-[#8B96A5] mb-2">
                      {member.designation || 'Faculty Evaluator'}
                    </p>

                    <p className="text-[11px] text-[#8B96A5]/80 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#36D9FF]" />

                      <span>
                        Dept. of {member.department || 'NIE'}
                      </span>
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 text-[11px] font-mono text-[#8B96A5] flex items-center justify-between">
                    <span>
                      Load:{' '}
                      <strong className="text-white">
                        {count}
                      </strong>
                    </span>

                    {isBalanced ? (
                      <span className="text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        BALANCED
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        REVIEW
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Allocation Matrix */}
      <div className="p-6 rounded-3xl bg-[#0D1219] border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display font-bold text-lg text-white">
              Team-by-Team Faculty Assignment Matrix
            </h2>

            <p className="text-[11px] text-[#8B96A5] font-mono mt-1">
              Only LOCKED teams are eligible for faculty allocation.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1 text-[#8B96A5]">
              <Lock className="w-3 h-3" />
              LOCKED
            </span>

            <span className="flex items-center gap-1 text-[#8B96A5]">
              <UserCheck className="w-3 h-3" />
              ASSIGNED
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#121A23] text-[#8B96A5] uppercase border-b border-white/5">
              <tr>
                <th className="p-3">Team Code</th>
                <th className="p-3">Team Name</th>
                <th className="p-3">Campus</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Registration</th>
                <th className="p-3">Assigned Faculty</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5">
              {teamViews.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-10 text-center text-[#8B96A5]"
                  >
                    No teams registered yet.
                  </td>
                </tr>
              ) : (
                teamViews.map((team) => {
                  const isLocked =
                    team.registration_status === 'locked';

                  const isAssignmentLoading =
                    assignmentLoading === team.id;

                  return (
                    <tr
                      key={team.id}
                      className="hover:bg-[#121A23]/50"
                    >
                      <td className="p-3">
                        <div className="font-bold text-[#FF7A30]">
                          {team.team_code}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-sans font-semibold text-white">
                          {team.team_name}
                        </div>
                      </td>

                      <td className="p-3">
                        <span
                          className={
                            team.campus === 'North'
                              ? 'text-[#36D9FF]'
                              : 'text-[#FF7A30]'
                          }
                        >
                          {team.campus}
                        </span>
                      </td>

                      <td className="p-3 text-[#8B96A5]">
                        Offline
                      </td>

                      <td className="p-3">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">
                            <Lock className="w-3 h-3" />
                            LOCKED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />
                            {team.registration_status.toUpperCase()}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <select
                            value={team.assignedFaculty?.id || ''}
                            disabled={
                              !isLocked ||
                              isAssignmentLoading ||
                              allocationLoading
                            }
                            onChange={(event) =>
                              handleManualAssign(
                                team.id,
                                event.target.value
                              )
                            }
                            className="min-w-[220px] px-3 py-1.5 rounded-lg bg-[#07090D] border border-white/10 text-white text-xs font-mono focus:border-[#8B5CF6] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="">
                              -- Unassigned --
                            </option>

                            {faculty.map((member) => (
                              <option
                                key={member.id}
                                value={member.id}
                              >
                                {member.name} (
                                {member.department || 'NIE'})
                              </option>
                            ))}
                          </select>

                          {isAssignmentLoading && (
                            <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin shrink-0" />
                          )}
                        </div>

                        {!isLocked && (
                          <p className="text-[9px] text-[#8B96A5] mt-1">
                            Lock registration before assignment.
                          </p>
                        )}

                        {isLocked &&
                          team.assignedFaculty && (
                            <p className="text-[9px] text-green-400 mt-1">
                              Assigned and eligible for faculty access.
                            </p>
                          )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Allocation Rules */}
      <div className="p-5 rounded-2xl bg-[#121A23] border border-[#8B5CF6]/20">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />

          <div>
            <h3 className="font-display font-bold text-sm text-white">
              Allocation Engine Rules
            </h3>

            <ul className="mt-2 space-y-1.5 text-[11px] text-[#8B96A5] font-mono">
              <li>
                • Only locked team registrations are eligible.
              </li>

              <li>
                • Active faculty members are used for automatic allocation.
              </li>

              <li>
                • Automatic allocation distributes teams as evenly as
                possible.
              </li>

              <li>
                • Maximum faculty load difference is intended to remain ≤ 1.
              </li>

              <li>
                • Manual reassignment is restricted to administrators.
              </li>

              <li>
                • Every team can have only one active faculty assignment.
              </li>

              <li>
                • Database RPCs remain the final authority for all
                allocation operations.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};