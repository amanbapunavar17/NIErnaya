import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  Search,
  Download,
  Lock,
  Unlock,
  RefreshCw,
  AlertCircle,
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
// COMPONENT
// ============================================================

export const AdminTeamsPage: React.FC = () => {
  const [teams, setTeams] = useState<TeamView[]>([]);
  const [faculty, setFaculty] = useState<FacultyRow[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampus, setFilterCampus] = useState('all');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionTeamId, setActionTeamId] = useState<string | null>(null);

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
        return;
      }

      try {
        if (showRefreshState) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        // ------------------------------------------------------
        // Fetch all data required for the directory.
        // ------------------------------------------------------

        const [
          teamsResult,
          membersResult,
          studentsResult,
          facultyResult,
          assignmentsResult,
        ] = await Promise.all([
          supabase
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
                created_at
              `
            )
            .order('created_at', {
              ascending: true,
            }),

          supabase
            .from('team_members')
            .select(
              `
                id,
                team_id,
                student_id,
                role
              `
            ),

          supabase
            .from('students')
            .select(
              `
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
              `
            ),

          supabase
            .from('faculty')
            .select(
              `
                id,
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
            .order('sort_order', {
              ascending: true,
            }),

          supabase
            .from('faculty_assignments')
            .select(
              `
                id,
                team_id,
                faculty_id,
                assigned_at,
                assigned_by
              `
            ),
        ]);

        // ------------------------------------------------------
        // Check for errors
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
        // Create quick lookup maps
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
        // Build admin-friendly team records
        // ------------------------------------------------------

        const mappedTeams: TeamView[] =
          teamRows.map((team) => {
            const leader =
              studentsById.get(
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

                return a.name.localeCompare(
                  b.name
                );
              });

            const assignment =
              assignmentByTeam.get(team.id);

            const assignedFaculty =
              assignment
                ? facultyById.get(
                    assignment.faculty_id
                  )
                : undefined;

            return {
              id: team.id,
              team_code: team.team_code,
              team_name: team.team_name,
              leader_student_id:
                team.leader_student_id,

              leader_name:
                leader?.name ??
                'Leader record unavailable',

              leader_email:
                leader?.email ??
                '—',

              leader_phone:
                leader?.phone ??
                '—',

              mode: team.mode,
              campus: team.campus,
              registration_status:
                team.registration_status,

              locked_at: team.locked_at,
              created_at: team.created_at,

              members,

              assigned_faculty_id:
                assignment?.faculty_id ??
                null,

              assigned_faculty_name:
                assignedFaculty?.name ??
                null,
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
    loadTeams();
  }, [loadTeams]);

  // ==========================================================
  // FILTERED TEAMS
  // ==========================================================

  const filteredTeams = useMemo(() => {
    const search =
      searchTerm.trim().toLowerCase();

    return teams.filter((team) => {
      const matchesSearch =
        !search ||
        team.team_name
          .toLowerCase()
          .includes(search) ||
        team.team_code
          .toLowerCase()
          .includes(search) ||
        team.leader_name
          .toLowerCase()
          .includes(search) ||
        team.leader_email
          .toLowerCase()
          .includes(search) ||
        team.members.some(
          (member) =>
            member.name
              .toLowerCase()
              .includes(search) ||
            member.usn
              .toLowerCase()
              .includes(search)
        );

      const matchesCampus =
        filterCampus === 'all' ||
        team.campus === filterCampus;

      return matchesSearch && matchesCampus;
    });
  }, [
    teams,
    searchTerm,
    filterCampus,
  ]);

  // ==========================================================
  // LOCK / UNLOCK REGISTRATION
  // ==========================================================

  const toggleLock = async (
    team: TeamView
  ) => {
    if (!supabase) {
      setError(
        'Supabase is not configured.'
      );
      return;
    }

    try {
      setActionTeamId(team.id);
      setError(null);

      if (
        team.registration_status ===
        'locked'
      ) {
        // ----------------------------------------------------
        // ADMIN UNLOCK
        // ----------------------------------------------------

        const {
          error: unlockError,
        } = await supabase.rpc(
          'admin_unlock_team_registration',
          {
            p_team_id: team.id,
          }
        );

        if (unlockError) {
          throw unlockError;
        }
      } else {
        // ----------------------------------------------------
        // ADMIN LOCK
        // ----------------------------------------------------

        const {
          error: lockError,
        } = await supabase.rpc(
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
      setError(
        'Supabase is not configured.'
      );
      return;
    }

    // --------------------------------------------------------
    // The database allocation function requires a LOCKED team.
    // --------------------------------------------------------

    if (
      team.registration_status !==
      'locked'
    ) {
      alert(
        'Faculty assignment is available only after the team registration is locked.'
      );
      return;
    }

    try {
      setActionTeamId(team.id);
      setError(null);

      // ------------------------------------------------------
      // Remove assignment
      // ------------------------------------------------------

      if (!facultyId) {
        const {
          error: removeError,
        } = await supabase.rpc(
          'remove_team_faculty_assignment',
          {
            p_team_id: team.id,
          }
        );

        if (removeError) {
          throw removeError;
        }
      }

      // ------------------------------------------------------
      // Assign faculty
      // ------------------------------------------------------

      else {
        const {
          error: assignError,
        } = await supabase.rpc(
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
  // CSV EXPORT
  // ==========================================================

  const exportTeamsCSV = () => {
    const headers = [
      'Team Code',
      'Team Name',
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

    const escapeCSV = (
      value: unknown
    ) => {
      const text =
        value === null ||
        value === undefined
          ? ''
          : String(value);

      return `"${text.replace(
        /"/g,
        '""'
      )}"`;
    };

    const rows = filteredTeams.map(
      (team) => [
        escapeCSV(team.team_code),
        escapeCSV(team.team_name),
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
          team.assigned_faculty_name ??
            'Unassigned'
        ),

        escapeCSV(
          team.registration_status
        ),

        escapeCSV(
          new Date(
            team.created_at
          ).toLocaleString()
        ),

        escapeCSV(
          team.locked_at
            ? new Date(
                team.locked_at
              ).toLocaleString()
            : ''
        ),
      ]
    );

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.join(',')
      ),
    ].join('\n');

    const blob = new Blob(
      [csvContent],
      {
        type: 'text/csv;charset=utf-8;',
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download =
      'NIErnaya_Teams_Export.csv';

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

      {/* ======================================================
          ERROR
      ======================================================= */}

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 flex items-center gap-3">

          <AlertCircle className="w-5 h-5 shrink-0" />

          <div className="flex-1">
            <div className="font-mono text-xs font-bold">
              SQUAD DATA ERROR
            </div>

            <div className="text-xs mt-1 opacity-80">
              {error}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              loadTeams(true)
            }
            disabled={refreshing}
            className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono disabled:opacity-50"
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
            Registered Squads Directory ({loading ? '—' : teams.length})
          </h1>

          <p className="text-xs text-[#8B96A5]">
            Manage all participating team records,
            registration state, rosters, and faculty assignments.
          </p>
        </div>

        <div className="flex gap-2">

          {/* Refresh */}
          <button
            type="button"
            onClick={() =>
              loadTeams(true)
            }
            disabled={
              refreshing ||
              loading
            }
            className="px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 hover:border-[#36D9FF] text-[#36D9FF] font-mono text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
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
                ? 'REFRESHING'
                : 'REFRESH'}
            </span>
          </button>

          {/* CSV */}
          <button
            type="button"
            onClick={
              exportTeamsCSV
            }
            disabled={
              teams.length === 0
            }
            className="px-4 py-2.5 rounded-xl bg-[#121A23] border border-white/10 hover:border-[#36D9FF] text-[#36D9FF] font-mono text-xs font-bold flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />

            <span>
              EXPORT CSV
            </span>
          </button>
        </div>
      </div>

      {/* ======================================================
          SEARCH & FILTER
      ======================================================= */}

      <div className="p-4 rounded-2xl bg-[#0D1219] border border-white/10 flex flex-col sm:flex-row items-center gap-3">

        {/* Search */}
        <div className="relative flex-1 w-full">

          <Search className="w-4 h-4 text-[#8B96A5] absolute left-3.5 top-3" />

          <input
            type="text"
            placeholder="Search by team code, squad name, leader name, email, or USN..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(
                e.target.value
              )
            }
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white placeholder:text-[#8B96A5]/50 focus:outline-none focus:border-[#36D9FF]"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto">

          <select
            value={filterCampus}
            onChange={(e) =>
              setFilterCampus(
                e.target.value
              )
            }
            className="px-3 py-2 rounded-xl bg-[#121A23] border border-white/10 text-xs font-mono text-white focus:outline-none"
          >
            <option value="all">
              All Campuses
            </option>

            <option value="North">
              North Campus
            </option>

            <option value="South">
              South Campus
            </option>
          </select>


        </div>
      </div>

      {/* ======================================================
          DIRECTORY SUMMARY
      ======================================================= */}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

        <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5]">
            TOTAL SQUADS
          </div>

          <div className="mt-1 font-display font-black text-2xl text-white">
            {loading
              ? '—'
              : teams.length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5]">
            LOCKED
          </div>

          <div className="mt-1 font-display font-black text-2xl text-white">
            {loading
              ? '—'
              : teams.filter(
                  (team) =>
                    team.registration_status ===
                    'locked'
                ).length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5]">
            PENDING
          </div>

          <div className="mt-1 font-display font-black text-2xl text-white">
            {loading
              ? '—'
              : teams.filter(
                  (team) =>
                    team.registration_status !==
                    'locked'
                ).length}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1219] border border-white/10">
          <div className="text-[10px] font-mono text-[#8B96A5]">
            SHOWN
          </div>

          <div className="mt-1 font-display font-black text-2xl text-white">
            {filteredTeams.length}
          </div>
        </div>
      </div>

      {/* ======================================================
          TEAMS TABLE
      ======================================================= */}

      <div className="rounded-2xl bg-[#0D1219] border border-white/10 overflow-hidden shadow-xl">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs font-mono">

            <thead className="bg-[#121A23] text-[#8B96A5] uppercase border-b border-white/5">

              <tr>
                <th className="p-4">
                  Squad ID & Name
                </th>

                <th className="p-4">
                  Leader / Contact
                </th>

                <th className="p-4">
                  Roster
                </th>

                <th className="p-4">
                  Campus / Mode
                </th>

                <th className="p-4">
                  Assigned Faculty
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

              {/* Loading */}
              {loading ? (

                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-[#8B96A5]"
                  >
                    <div className="flex flex-col items-center gap-3">

                      <RefreshCw className="w-5 h-5 animate-spin text-[#36D9FF]" />

                      <span className="font-mono text-xs">
                        LOADING REGISTERED SQUADS...
                      </span>

                    </div>
                  </td>
                </tr>

              ) : filteredTeams.length === 0 ? (

                /* Empty */
                <tr>
                  <td
                    colSpan={7}
                    className="p-12 text-center text-[#8B96A5]"
                  >

                    <Users className="w-8 h-8 mx-auto mb-3 opacity-40" />

                    <div className="font-mono text-xs">
                      {teams.length === 0
                        ? 'No teams have been registered yet.'
                        : 'No teams found matching the current search/filter criteria.'}
                    </div>

                  </td>
                </tr>

              ) : (

                /* Teams */
                filteredTeams.map(
                  (team) => {

                    const isBusy =
                      actionTeamId ===
                      team.id;

                    return (
                      <tr
                        key={team.id}
                        className="hover:bg-[#121A23]/50 transition-colors"
                      >

                        {/* ----------------------------------
                            TEAM
                        ----------------------------------- */}

                        <td className="p-4 font-bold align-top">

                          <div className="text-[#FF7A30] font-mono text-xs">
                            {team.team_code}
                          </div>

                          <div className="text-white font-sans text-sm font-semibold">
                            {team.team_name}
                          </div>

                          <div className="text-[10px] text-[#8B96A5] mt-1">
                            {team.members.length} member
                            {team.members.length === 1
                              ? ''
                              : 's'}
                          </div>
                        </td>

                        {/* ----------------------------------
                            LEADER
                        ----------------------------------- */}

                        <td className="p-4 align-top">

                          <div>
                            {team.leader_name}
                          </div>

                          <div className="text-[10px] text-[#8B96A5] break-all">
                            {team.leader_email}
                          </div>

                          <div className="text-[10px] text-[#8B96A5]">
                            {team.leader_phone}
                          </div>
                        </td>

                        {/* ----------------------------------
                            ROSTER
                        ----------------------------------- */}

                        <td className="p-4 align-top">

                          <div className="space-y-1.5">

                            {team.members.map(
                              (member) => (
                                <div
                                  key={
                                    member.id
                                  }
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
                              )
                            )}

                          </div>
                        </td>

                        {/* ----------------------------------
                            CAMPUS / MODE
                        ----------------------------------- */}

                        <td className="p-4 align-top">

                          <div>
                            {team.campus}{' '}
                            Campus
                          </div>

                          <div className="text-[10px] text-[#8B96A5]">
                            Offline Mode
                          </div>
                        </td>

                        {/* ----------------------------------
                            FACULTY
                        ----------------------------------- */}

                        <td className="p-4 align-top">

                          <select
                            value={
                              team.assigned_faculty_id ??
                              ''
                            }
                            disabled={
                              team.registration_status !==
                                'locked' ||
                              isBusy
                            }
                            onChange={(e) =>
                              handleFacultyReassign(
                                team,
                                e.target.value
                              )
                            }
                            title={
                              team.registration_status !==
                              'locked'
                                ? 'Lock the team before assigning faculty.'
                                : 'Assign faculty mentor'
                            }
                            className="p-1.5 rounded-lg bg-[#07090D] border border-white/10 text-xs text-white disabled:opacity-40 disabled:cursor-not-allowed"
                          >

                            <option value="">
                              -- Unassigned --
                            </option>

                            {faculty.map(
                              (member) => (
                                <option
                                  key={
                                    member.id
                                  }
                                  value={
                                    member.id
                                  }
                                >
                                  {member.name}
                                </option>
                              )
                            )}

                          </select>

                          {team.assigned_faculty_name && (
                            <div className="text-[9px] text-[#8B96A5] mt-1">
                              {team.assigned_faculty_name}
                            </div>
                          )}

                        </td>

                        {/* ----------------------------------
                            STATUS
                        ----------------------------------- */}

                        <td className="p-4 align-top">

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              team.registration_status ===
                              'locked'
                                ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                : team.registration_status ===
                                  'submitted'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            }`}
                          >
                            {
                              team.registration_status
                            }
                          </span>

                          {team.locked_at && (
                            <div className="text-[9px] text-[#8B96A5] mt-1">
                              Locked{' '}
                              {new Date(
                                team.locked_at
                              ).toLocaleDateString()}
                            </div>
                          )}

                        </td>

                        {/* ----------------------------------
                            ACTIONS
                        ----------------------------------- */}

                        <td className="p-4 text-right align-top">

                          <button
                            type="button"
                            onClick={() =>
                              toggleLock(
                                team
                              )
                            }
                            disabled={
                              isBusy
                            }
                            className={`p-2 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                              team.registration_status ===
                              'locked'
                                ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                                : 'bg-white/5 border-white/10 text-[#8B96A5] hover:text-white hover:bg-white/10'
                            }`}
                            title={
                              team.registration_status ===
                              'locked'
                                ? 'Unlock Registration'
                                : 'Lock Registration'
                            }
                          >

                            {isBusy ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : team.registration_status ===
                              'locked' ? (
                              <Lock className="w-3.5 h-3.5" />
                            ) : (
                              <Unlock className="w-3.5 h-3.5" />
                            )}

                          </button>

                        </td>

                      </tr>
                    );
                  }
                )
              )}

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};