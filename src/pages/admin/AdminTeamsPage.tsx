
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Users,
  Search,
  Download,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  Copy,
  Check,
  Target,
  FileText,
} from 'lucide-react';

import {
  supabase,
  isSupabaseConfigured,
} from '../../lib/supabase/client';

// ============================================================
// TYPES
// ============================================================

type TeamRow = {
  id: string;
  team_code: string;
  team_name: string;
  leader_student_id: string;
  mode: 'Offline';
  campus: 'North' | 'South';
  registration_status: 'draft' | 'submitted' | 'locked';
  locked_at: string | null;
  created_at: string;
  problem_statement: string | null;
  selected_sdg: number | null;
};

type StudentRow = {
  id: string;
  name: string;
  usn: string;
  email: string;
  phone: string | null;
  branch: string | null;
  year: number;
  semester: number;
  section: string | null;
  campus: 'North' | 'South';
};

type TeamMemberRow = {
  id: string;
  team_id: string;
  student_id: string;
  role: 'leader' | 'member';
};

type FacultyRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  active: boolean;
  sort_order: number;
};

type FacultyAssignmentRow = {
  id: string;
  team_id: string;
  faculty_id: string;
  assigned_at: string;
  assigned_by: string | null;
};

type TeamView = {
  id: string;
  team_code: string;
  team_name: string;

  problem_statement: string | null;
  selected_sdg: number | null;

  leader_student_id: string;
  leader_name: string;
  leader_email: string;
  leader_phone: string;

  mode: 'Offline';
  campus: 'North' | 'South';

  registration_status: 'draft' | 'submitted' | 'locked';
  locked_at: string | null;
  created_at: string;

  members: StudentRow[];

  assigned_faculty_id: string | null;
  assigned_faculty_name: string | null;
};

// ============================================================
// SDG DETAILS
// ============================================================

const SDG_NAMES: Record<number, string> = {
  2: 'Zero Hunger',
  3: 'Good Health and Well-being',
  4: 'Quality Education',
  5: 'Gender Equality',
  13: 'Climate Action',
};

const getSdgName = (
  sdg: number | null
): string => {
  if (sdg === null) {
    return 'Not selected';
  }

  return SDG_NAMES[sdg] ?? 'Unknown SDG';
};

// ============================================================
// CSV HELPER
// ============================================================

const escapeCSV = (
  value: unknown
): string => {
  const text =
    value === null || value === undefined
      ? ''
      : String(value);

  return `"${text.replace(/"/g, '""')}"`;
};

// ============================================================
// COMPONENT
// ============================================================

export const AdminTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamView[]>([]);
  const [faculty, setFaculty] = useState<FacultyRow[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampus, setFilterCampus] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [actionTeamId, setActionTeamId] =
    useState<string | null>(null);

  const [selectedTeam, setSelectedTeam] =
    useState<TeamView | null>(null);

  const [copiedStatement, setCopiedStatement] =
    useState(false);

  const [error, setError] = useState<string | null>(null);

  // ==========================================================
  // LOAD TEAMS + MEMBERS + STUDENTS + FACULTY + ASSIGNMENTS
  // ==========================================================

  const loadTeams = useCallback(
    async (showRefreshState = false) => {
      if (!isSupabaseConfigured || !supabase) {
        setError(
          'Supabase is not configured. Check your environment variables.'
        );

        setLoading(false);
        setRefreshing(false);
        return;
      }

      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [
          teamsResult,
          membersResult,
          studentsResult,
          facultyResult,
          assignmentsResult,
        ] = await Promise.all([
          // Teams, including project information.
          supabase
            .from('teams')
            .select(`
              id,
              team_code,
              team_name,
              leader_student_id,
              mode,
              campus,
              registration_status,
              locked_at,
              created_at,
              problem_statement,
              selected_sdg
            `)
            .order('created_at', {
              ascending: true,
            }),

          // Team membership.
          supabase
            .from('team_members')
            .select(`
              id,
              team_id,
              student_id,
              role
            `),

          // Student records.
          supabase
            .from('students')
            .select(`
              id,
              name,
              usn,
              email,
              phone,
              branch,
              year,
              semester,
              section,
              campus
            `),

          // Active faculty.
          supabase
            .from('faculty')
            .select(`
              id,
              name,
              email,
              phone,
              designation,
              department,
              active,
              sort_order
            `)
            .eq('active', true)
            .order('sort_order', {
              ascending: true,
            }),

          // Faculty assignments.
          supabase
            .from('faculty_assignments')
            .select(`
              id,
              team_id,
              faculty_id,
              assigned_at,
              assigned_by
            `),
        ]);

        // ------------------------------------------------------
        // Check query errors.
        // ------------------------------------------------------

        const firstError =
          teamsResult.error ||
          membersResult.error ||
          studentsResult.error ||
          facultyResult.error ||
          assignmentsResult.error;

        if (firstError) {
          throw firstError;
        }

        const teamRows =
          (teamsResult.data ?? []) as TeamRow[];

        const memberRows =
          (membersResult.data ?? []) as TeamMemberRow[];

        const studentRows =
          (studentsResult.data ?? []) as StudentRow[];

        const facultyRows =
          (facultyResult.data ?? []) as FacultyRow[];

        const assignmentRows =
          (assignmentsResult.data ??
            []) as FacultyAssignmentRow[];

        // ------------------------------------------------------
        // Build lookup maps.
        // ------------------------------------------------------

        const studentsById = new Map<
          string,
          StudentRow
        >();

        studentRows.forEach((student) => {
          studentsById.set(student.id, student);
        });

        const facultyById = new Map<
          string,
          FacultyRow
        >();

        facultyRows.forEach((member) => {
          facultyById.set(member.id, member);
        });

        const membersByTeam = new Map<
          string,
          TeamMemberRow[]
        >();

        memberRows.forEach((member) => {
          const existing =
            membersByTeam.get(member.team_id) ?? [];

          existing.push(member);

          membersByTeam.set(
            member.team_id,
            existing
          );
        });

        const assignmentByTeam = new Map<
          string,
          FacultyAssignmentRow
        >();

        assignmentRows.forEach((assignment) => {
          assignmentByTeam.set(
            assignment.team_id,
            assignment
          );
        });

        // ------------------------------------------------------
        // Map database rows to admin team records.
        // ------------------------------------------------------

        const mappedTeams: TeamView[] =
          teamRows.map((team) => {
            const leader = studentsById.get(
              team.leader_student_id
            );

            const teamMemberRows =
              membersByTeam.get(team.id) ?? [];

            const members = teamMemberRows
              .map((member) =>
                studentsById.get(member.student_id)
              )
              .filter(
                (
                  student
                ): student is StudentRow =>
                  Boolean(student)
              )
              .sort((a, b) => {
                if (
                  a.id === team.leader_student_id
                ) {
                  return -1;
                }

                if (
                  b.id === team.leader_student_id
                ) {
                  return 1;
                }

                return a.name.localeCompare(b.name);
              });

            const assignment =
              assignmentByTeam.get(team.id);

            const assignedFaculty = assignment
              ? facultyById.get(assignment.faculty_id)
              : undefined;

            return {
              id: team.id,
              team_code: team.team_code,
              team_name: team.team_name,

              // Project information.
              problem_statement:
                team.problem_statement ?? null,

              selected_sdg:
                team.selected_sdg ?? null,

              leader_student_id:
                team.leader_student_id,

              leader_name:
                leader?.name ??
                'Leader record unavailable',

              leader_email:
                leader?.email ?? '—',

              leader_phone:
                leader?.phone ?? '—',

              mode: team.mode,
              campus: team.campus,

              registration_status:
                team.registration_status,

              locked_at: team.locked_at,
              created_at: team.created_at,

              members,

              assigned_faculty_id:
                assignment?.faculty_id ?? null,

              assigned_faculty_name:
                assignedFaculty?.name ?? null,
            };
          });

        setTeams(mappedTeams);
        setFaculty(facultyRows);
      } catch (err: unknown) {
        console.error(
          'Admin teams loading error:',
          err
        );

        const message =
          err instanceof Error
            ? err.message
            : 'Unable to load registered squads.';

        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  // ==========================================================
  // CLOSE MODAL WITH ESCAPE
  // ==========================================================

  useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (event.key === 'Escape') {
        setSelectedTeam(null);
        setCopiedStatement(false);
      }
    };

    window.addEventListener(
      'keydown',
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      );
    };
  }, [selectedTeam]);

  // ==========================================================
  // FILTERED TEAMS
  // ==========================================================

  const filteredTeams = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesSearch =
        !search ||
        team.team_name.toLowerCase().includes(search) ||
        team.team_code.toLowerCase().includes(search) ||
        team.leader_name.toLowerCase().includes(search) ||
        team.leader_email.toLowerCase().includes(search) ||
        (team.problem_statement ?? '')
          .toLowerCase()
          .includes(search) ||
        getSdgName(team.selected_sdg)
          .toLowerCase()
          .includes(search) ||
        team.members.some(
          (member) =>
            member.name.toLowerCase().includes(search) ||
            member.usn.toLowerCase().includes(search)
        );

      const matchesCampus =
        filterCampus === 'all' ||
        team.campus === filterCampus;

      return matchesSearch && matchesCampus;
    });
  }, [teams, searchTerm, filterCampus]);

  // ==========================================================
  // LOCK / UNLOCK REGISTRATION
  // ==========================================================

  const toggleLock = async (
    team: TeamView
  ) => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    try {
      setActionTeamId(team.id);
      setError(null);

      if (team.registration_status === 'locked') {
        const { error: unlockError } =
          await supabase.rpc(
            'admin_unlock_team_registration',
            {
              p_team_id: team.id,
            }
          );

        if (unlockError) {
          throw unlockError;
        }
      } else {
        const { error: lockError } =
          await supabase.rpc(
            'lock_team_registration',
            {
              p_team_id: team.id,
            }
          );

        if (lockError) {
          throw lockError;
        }
      }

      await loadTeams(true);
    } catch (err: unknown) {
      console.error(
        'Team lock/unlock error:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to change team registration status.';

      setError(message);
      alert(message);
    } finally {
      setActionTeamId(null);
    }
  };

  // ==========================================================
  // FACULTY REASSIGNMENT
  // ==========================================================

  const handleFacultyReassign = async (
    team: TeamView,
    facultyId: string
  ) => {
    if (!supabase) {
      setError('Supabase is not configured.');
      return;
    }

    if (team.registration_status !== 'locked') {
      alert(
        'Faculty assignment is available only after the team registration is locked.'
      );
      return;
    }

    try {
      setActionTeamId(team.id);
      setError(null);

      if (!facultyId) {
        const { error: removeError } =
          await supabase.rpc(
            'remove_team_faculty_assignment',
            {
              p_team_id: team.id,
            }
          );

        if (removeError) {
          throw removeError;
        }
      } else {
        const { error: assignError } =
          await supabase.rpc(
            'reassign_team_faculty',
            {
              p_team_id: team.id,
              p_faculty_id: facultyId,
            }
          );

        if (assignError) {
          throw assignError;
        }
      }

      await loadTeams(true);
    } catch (err: unknown) {
      console.error(
        'Faculty reassignment error:',
        err
      );

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to reassign faculty.';

      setError(message);
      alert(message);
    } finally {
      setActionTeamId(null);
    }
  };

  // ==========================================================
  // COPY PROBLEM STATEMENT
  // ==========================================================

  const copyProblemStatement = async (
    statement: string | null
  ) => {
    if (!statement) {
      return;
    }

    try {
      await navigator.clipboard.writeText(statement);

      setCopiedStatement(true);

      window.setTimeout(() => {
        setCopiedStatement(false);
      }, 2000);
    } catch (err) {
      console.error(
        'Unable to copy problem statement:',
        err
      );

      alert(
        'Unable to copy automatically. Please select and copy the problem statement.'
      );
    }
  };

  // ==========================================================
  // CSV EXPORT
  // ==========================================================

  const exportTeamsCSV = () => {
    const headers = [
      'Team Code',
      'Team Name',
      'Problem Statement',
      'Selected SDG',
      'SDG Name',
      'Leader Name',
      'Leader Email',
      'Phone',
      'Campus',
      'Mode',
      'Members Count',
      'Members',
      'Assigned Faculty',
      'Status',
      'Created At',
      'Locked At',
    ];

    const rows = filteredTeams.map((team) => [
      escapeCSV(team.team_code),
      escapeCSV(team.team_name),
      escapeCSV(team.problem_statement),
      escapeCSV(team.selected_sdg),
      escapeCSV(getSdgName(team.selected_sdg)),
      escapeCSV(team.leader_name),
      escapeCSV(team.leader_email),
      escapeCSV(team.leader_phone),
      escapeCSV(team.campus),
      escapeCSV(team.mode),
      escapeCSV(team.members.length),

      escapeCSV(
        team.members
          .map(
            (member) =>
              `${member.name} (${member.usn})`
          )
          .join(' | ')
      ),

      escapeCSV(
        team.assigned_faculty_name ?? 'Unassigned'
      ),

      escapeCSV(team.registration_status),

      escapeCSV(
        new Date(team.created_at).toLocaleString()
      ),

      escapeCSV(
        team.locked_at
          ? new Date(team.locked_at).toLocaleString()
          : ''
      ),
    ]);

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\r\n');

    const blob = new Blob(
      ['\uFEFF', csvContent],
      {
        type: 'text/csv;charset=utf-8;',
      }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'NIErnaya_Teams_Export.csv';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-6">
      {/* ERROR MESSAGE */}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />

          <div className="flex-1">
            <div className="font-mono text-xs font-bold">
              SQUAD DATA ERROR
            </div>

            <div className="mt-1 break-words text-xs opacity-80">
              {error}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadTeams(true)}
            disabled={refreshing}
            className="rounded-lg bg-white/5 px-3 py-2 text-xs font-mono hover:bg-white/10 disabled:opacity-50"
          >
            {refreshing ? 'RETRYING...' : 'RETRY'}
          </button>
        </div>
      )}

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-black text-white sm:text-3xl">
            Registered Squads Directory (
            {loading ? '—' : teams.length})
          </h1>

          <p className="text-xs text-[#8B96A5]">
            Manage registered teams, project statements,
            SDGs, rosters, and faculty assignments.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void loadTeams(true)}
            disabled={refreshing || loading}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121A23] px-4 py-2.5 font-mono text-xs font-bold text-[#36D9FF] transition-colors hover:border-[#36D9FF] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing ? 'animate-spin' : ''
              }`}
            />

            {refreshing ? 'REFRESHING' : 'REFRESH'}
          </button>

          <button
            type="button"
            onClick={exportTeamsCSV}
            disabled={teams.length === 0}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#121A23] px-4 py-2.5 font-mono text-xs font-bold text-[#36D9FF] transition-colors hover:border-[#36D9FF] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download className="h-4 w-4" />
            EXPORT CSV
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTER */}

      <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#0D1219] p-4 sm:flex-row">
        <div className="relative w-full flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#8B96A5]" />

          <input
            type="text"
            placeholder="Search team, leader, USN, problem statement, or SDG..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-[#121A23] py-2 pl-10 pr-4 font-mono text-xs text-white placeholder:text-[#8B96A5]/50 focus:border-[#36D9FF] focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={filterCampus}
            onChange={(event) =>
              setFilterCampus(event.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-[#121A23] px-3 py-2 font-mono text-xs text-white focus:outline-none sm:w-auto"
          >
            <option value="all">All Campuses</option>
            <option value="North">North Campus</option>
            <option value="South">South Campus</option>
          </select>
        </div>
      </div>

      {/* DIRECTORY SUMMARY */}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-[#0D1219] p-4">
          <div className="font-mono text-[10px] text-[#8B96A5]">
            TOTAL SQUADS
          </div>

          <div className="mt-1 font-display text-2xl font-black text-white">
            {loading ? '—' : teams.length}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0D1219] p-4">
          <div className="font-mono text-[10px] text-[#8B96A5]">
            LOCKED
          </div>

          <div className="mt-1 font-display text-2xl font-black text-white">
            {loading
              ? '—'
              : teams.filter(
                  (team) =>
                    team.registration_status === 'locked'
                ).length}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0D1219] p-4">
          <div className="font-mono text-[10px] text-[#8B96A5]">
            PENDING
          </div>

          <div className="mt-1 font-display text-2xl font-black text-white">
            {loading
              ? '—'
              : teams.filter(
                  (team) =>
                    team.registration_status !== 'locked'
                ).length}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0D1219] p-4">
          <div className="font-mono text-[10px] text-[#8B96A5]">
            SHOWN
          </div>

          <div className="mt-1 font-display text-2xl font-black text-white">
            {filteredTeams.length}
          </div>
        </div>
      </div>

      {/* TEAMS TABLE */}

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D1219] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-white/5 bg-[#121A23] uppercase text-[#8B96A5]">
              <tr>
                <th className="p-4">Squad ID &amp; Name</th>
                <th className="p-4">Leader / Contact</th>
                <th className="p-4">Roster</th>
                <th className="p-4">Campus / Mode</th>
                <th className="p-4">Assigned Faculty</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-white/5 text-[#F5F7FA]">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-[#8B96A5]"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="h-5 w-5 animate-spin text-[#36D9FF]" />

                      <span className="font-mono text-xs">
                        LOADING REGISTERED SQUADS...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredTeams.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-[#8B96A5]"
                  >
                    <Users className="mx-auto mb-3 h-8 w-8 opacity-40" />

                    <div className="font-mono text-xs">
                      {teams.length === 0
                        ? 'No teams have been registered yet.'
                        : 'No teams found matching the current search/filter criteria.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTeams.map((team) => {
                  const isBusy =
                    actionTeamId === team.id;

                  return (
                    <tr
                      key={team.id}
                      className="transition-colors hover:bg-[#121A23]/50"
                    >
                      {/* TEAM */}

                      <td className="p-4 align-top">
                        <div className="font-mono text-xs font-bold text-[#FF7A30]">
                          {team.team_code}
                        </div>

                        <div className="mt-1 font-sans text-sm font-semibold text-white">
                          {team.team_name}
                        </div>

                        <div className="mt-1 text-[10px] text-[#8B96A5]">
                          {team.members.length}{' '}
                          {team.members.length === 1
                            ? 'member'
                            : 'members'}
                        </div>

                        {/* PROJECT DETAILS BUTTON */}

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTeam(team);
                            setCopiedStatement(false);
                          }}
                          className="mt-3 inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#36D9FF]/30 bg-[#36D9FF]/10 px-2.5 py-1.5 text-[10px] font-bold text-[#36D9FF] transition-colors hover:bg-[#36D9FF]/20"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          VIEW PROJECT
                        </button>

                        <div className="mt-2">
                          {team.selected_sdg !== null ? (
                            <span className="inline-flex max-w-[180px] items-center gap-1 rounded-md border border-orange-400/20 bg-orange-400/10 px-2 py-1 text-[9px] leading-4 text-orange-300">
                              <Target className="h-3 w-3 shrink-0" />
                              SDG {team.selected_sdg}
                            </span>
                          ) : (
                            <span className="text-[9px] text-[#8B96A5]">
                              SDG not selected
                            </span>
                          )}
                        </div>
                      </td>

                      {/* LEADER */}

                      <td className="p-4 align-top">
                        <div>{team.leader_name}</div>

                        <div className="break-all text-[10px] text-[#8B96A5]">
                          {team.leader_email}
                        </div>

                        <div className="text-[10px] text-[#8B96A5]">
                          {team.leader_phone}
                        </div>
                      </td>

                      {/* ROSTER */}

                      <td className="p-4 align-top">
                        <div className="space-y-1.5">
                          {team.members.map((member) => (
                            <div
                              key={member.id}
                              className="text-[11px] text-[#8B96A5]"
                            >
                              <span className="text-white">
                                {member.name}
                              </span>

                              <span className="text-[#36D9FF]">
                                {' '}
                                ({member.usn})
                              </span>

                              {member.id ===
                                team.leader_student_id && (
                                <span className="ml-1 text-[9px] text-[#FF7A30]">
                                  LEADER
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* CAMPUS / MODE */}

                      <td className="p-4 align-top">
                        <div>{team.campus} Campus</div>

                        <div className="text-[10px] text-[#8B96A5]">
                          Offline Mode
                        </div>
                      </td>

                      {/* FACULTY */}

                      <td className="p-4 align-top">
                        <select
                          value={
                            team.assigned_faculty_id ?? ''
                          }
                          disabled={
                            team.registration_status !==
                              'locked' || isBusy
                          }
                          onChange={(event) =>
                            void handleFacultyReassign(
                              team,
                              event.target.value
                            )
                          }
                          title={
                            team.registration_status !==
                            'locked'
                              ? 'Lock the team before assigning faculty.'
                              : 'Assign faculty mentor'
                          }
                          className="rounded-lg border border-white/10 bg-[#07090D] p-1.5 text-xs text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <option value="">
                            -- Unassigned --
                          </option>

                          {faculty.map((member) => (
                            <option
                              key={member.id}
                              value={member.id}
                            >
                              {member.name}
                            </option>
                          ))}
                        </select>

                        {team.assigned_faculty_name && (
                          <div className="mt-1 text-[9px] text-[#8B96A5]">
                            {team.assigned_faculty_name}
                          </div>
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="p-4 align-top">
                        <span
                          className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${
                            team.registration_status === 'locked'
                              ? 'border-red-500/30 bg-red-500/20 text-red-400'
                              : team.registration_status === 'submitted'
                              ? 'border-green-500/30 bg-green-500/20 text-green-400'
                              : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {team.registration_status}
                        </span>

                        {team.locked_at && (
                          <div className="mt-1 text-[9px] text-[#8B96A5]">
                            Locked{' '}
                            {new Date(
                              team.locked_at
                            ).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}

                      <td className="p-4 text-right align-top">
                        <button
                          type="button"
                          onClick={() => void toggleLock(team)}
                          disabled={isBusy}
                          className={`rounded-lg border p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                            team.registration_status === 'locked'
                              ? 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                              : 'border-white/10 bg-white/5 text-[#8B96A5] hover:bg-white/10 hover:text-white'
                          }`}
                          title={
                            team.registration_status === 'locked'
                              ? 'Unlock Registration'
                              : 'Lock Registration'
                          }
                          aria-label={
                            team.registration_status === 'locked'
                              ? `Unlock ${team.team_name}`
                              : `Lock ${team.team_name}`
                          }
                        >
                          {isBusy ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : team.registration_status === 'locked' ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            <Unlock className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================
          PROJECT DETAILS MODAL
      ======================================================= */}

      {selectedTeam && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => {
            setSelectedTeam(null);
            setCopiedStatement(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0D1219] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#121A23] p-4 sm:p-5">
              <div className="min-w-0">
                <div className="font-mono text-xs font-bold text-[#FF7A30]">
                  {selectedTeam.team_code}
                </div>

                <h2
                  id="project-modal-title"
                  className="mt-1 break-words text-xl font-bold text-white sm:text-2xl"
                >
                  {selectedTeam.team_name}
                </h2>

                <p className="mt-1 text-xs text-[#8B96A5]">
                  Project statement and Sustainable Development Goal
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedTeam(null);
                  setCopiedStatement(false);
                }}
                aria-label="Close project details"
                className="shrink-0 rounded-lg border border-white/10 p-2 text-[#8B96A5] transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-4 sm:p-6">
              {/* SDG SECTION */}

              <section className="rounded-xl border border-[#36D9FF]/20 bg-[#36D9FF]/5 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#36D9FF]">
                  <Target className="h-4 w-4" />
                  Selected Sustainable Development Goal
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {selectedTeam.selected_sdg !== null ? (
                    <span className="rounded-lg bg-[#36D9FF]/15 px-3 py-2 font-mono text-lg font-bold text-[#36D9FF]">
                      SDG {selectedTeam.selected_sdg}
                    </span>
                  ) : (
                    <span className="rounded-lg bg-white/5 px-3 py-2 text-sm text-[#8B96A5]">
                      No SDG selected
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="break-words text-base font-bold text-white">
                      {getSdgName(selectedTeam.selected_sdg)}
                    </div>

                    <div className="mt-1 text-xs text-[#8B96A5]">
                      Team's selected Sustainable Development Goal
                    </div>
                  </div>
                </div>
              </section>

              {/* PROBLEM STATEMENT */}

              <section>
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#FF7A30]" />

                    <h3 className="text-sm font-bold text-white">
                      Problem Statement
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      void copyProblemStatement(
                        selectedTeam.problem_statement
                      )
                    }
                    disabled={!selectedTeam.problem_statement}
                    className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-white/10 px-3 py-2 text-xs text-[#8B96A5] transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:self-auto"
                  >
                    {copiedStatement ? (
                      <Check className="h-3.5 w-3.5 text-green-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}

                    {copiedStatement
                      ? 'COPIED'
                      : 'COPY STATEMENT'}
                  </button>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-[#07090D] p-4 text-sm leading-7 text-[#D5DCE5] sm:p-5">
                  {selectedTeam.problem_statement ? (
                    <div className="whitespace-pre-wrap break-words">
                      {selectedTeam.problem_statement}
                    </div>
                  ) : (
                    <p className="text-[#8B96A5]">
                      No problem statement has been submitted for this team.
                    </p>
                  )}
                </div>
              </section>

              {/* TEAM INFORMATION */}

              <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B96A5]">
                    Registration Status
                  </div>

                  <div className="mt-2">
                    <span
                      className={`inline-block rounded border px-2 py-1 text-xs font-bold uppercase ${
                        selectedTeam.registration_status === 'locked'
                          ? 'border-red-500/30 bg-red-500/20 text-red-400'
                          : selectedTeam.registration_status === 'submitted'
                          ? 'border-green-500/30 bg-green-500/20 text-green-400'
                          : 'border-yellow-500/30 bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {selectedTeam.registration_status}
                    </span>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B96A5]">
                    Team Members
                  </div>

                  <div className="mt-2 text-lg font-bold text-white">
                    {selectedTeam.members.length}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B96A5]">
                    Team Leader
                  </div>

                  <div className="mt-2 break-words text-sm font-semibold text-white">
                    {selectedTeam.leader_name}
                  </div>

                  <div className="mt-1 break-all text-xs text-[#8B96A5]">
                    {selectedTeam.leader_email}
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#8B96A5]">
                    Faculty Mentor
                  </div>

                  <div className="mt-2 break-words text-sm font-semibold text-white">
                    {selectedTeam.assigned_faculty_name ??
                      'Not assigned'}
                  </div>
                </div>
              </section>
            </div>

            {/* MODAL FOOTER */}

            <div className="flex justify-end border-t border-white/10 p-4">
              <button
                type="button"
                onClick={() => {
                  setSelectedTeam(null);
                  setCopiedStatement(false);
                }}
                className="rounded-xl bg-[#36D9FF] px-5 py-2.5 text-xs font-bold text-[#07090D] transition-opacity hover:opacity-90"
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeamsPage;
